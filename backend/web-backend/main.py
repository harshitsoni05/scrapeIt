from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit, join_room
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_pymongo import PyMongo
from pymongo import MongoClient
import jwt
import uuid
import datetime
import time
from bson import ObjectId
import pika
from flask_mail import Mail, Message
import json
import os


# Initialization
app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'secretkey123'  # JWT Secret Key
bcrypt = Bcrypt(app)

# MongoDB setup
app.config["MONGO_URI"] = "mongodb://host.docker.internal:27017/documents"

mongo = PyMongo(app)
client = MongoClient("mongodb://host.docker.internal:27017/")
db = client["documents"]
users = db["users"]
documents = db["documents"]

# RabbitMQ Connection Details
RABBITMQ_HOST = 'host.docker.internal'
QUEUE_NAME = 'scrape_and_post'

# Flask-Mail Configuration
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'scrapeit.invite@gmail.com'
app.config['MAIL_PASSWORD'] = 'ujxf wgdw eclp lmcx'  # Use App Password here
app.config['MAIL_DEFAULT_SENDER'] = 'scrapeit.invite@gmail.com'
mail = Mail(app)

socketio = SocketIO(app, cors_allowed_origins="*")

# Helper functions
from functools import wraps
from flask import request, jsonify
from flask_socketio import emit

def publish_message(payload):
    # Connect to RabbitMQ
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()

    # Declare the queue
    channel.queue_declare(queue=QUEUE_NAME, durable=True)

    # Publish the message
    channel.basic_publish(
        exchange='',
        routing_key=QUEUE_NAME,
        body=json.dumps(payload),
        properties=pika.BasicProperties(delivery_mode=2)  # Make message persistent
    )

    connection.close()


def token_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Determine if this is a Socket.IO or HTTP request
        token = ""
        if request.headers.get('Authorization'):
            # For HTTP requests, get the token from headers
            token = request.headers.get('Authorization')
        elif args and isinstance(args[0], dict) and 'token' in args[0]:
            # For Socket.IO requests, get the token from `data`
            token = args[0].get('token')
        else:
            # Token is missing
            if request:  # HTTP request
                return jsonify({"error": "Token is missing"}), 401
            else:  # Socket.IO event
                emit('error', {"error": "Token is missing"}, to=request.sid)
                return
        
        try:
            # Decode the token
            token_data = jwt.decode(token.split(" ")[1], app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = users.find_one({"email": token_data['email']})
            if not current_user:
                raise Exception()
        except Exception:
            # Handle invalid token
            if request:  # HTTP request
                return jsonify({"error": "Token is invalid"}), 401
            else:  # Socket.IO event
                emit('error', {"error": "Token is invalid"}, to=request.sid)
                return

        # Pass the `current_user` to the decorated function
        return func(current_user, *args, **kwargs)
    return wrapper

def get_document_by_uuid(uuid_value, path):
    projection = {f"{'.'.join(path)}"}
    document = documents.find_one({"uuid": uuid_value}, projection)
    if document:
        return document
    return None

def get_node_data(node, parts):
    if not node: return None
    for part in parts:
        if part in node:
            node = node[part]
        else:
            return None
    return node

def get_path_parts(node_path):
    path = node_path.split('/') if node_path else []
    path_parts = []
    for i in path:
        path_parts.append('children')
        path_parts.append(i)
    return ['documentJson'] + path_parts

def add_new_document(data):
    # Create the document object
    document = {
        "uuid": str(uuid.uuid4()), 
        "documentJson": data.get("documentJson", {}),
        "title": data.get("name", ""),
        "url": data.get("url", ""),
        "createTimestamp": datetime.datetime.now(datetime.timezone.utc),
        "updateTimestamp": datetime.datetime.now(datetime.timezone.utc),
        "createdBy": data.get("createdBy",""),
    }
    # Insert the document into the MongoDB collection
    result = documents.insert_one(document)
    document_id = result.inserted_id
    # Create the reference object for the user's createdDocuments
    document_reference = {
        "title": document['title'],
        "url": document['url']
    }
    # Update the user's createdDocuments field with the new document reference
    users.update_one(
        {"email": document['createdBy']},
        {"$set": {f"createdDocuments.{document['uuid']}": document_reference}}
    )
    return document_id

# WebSocket event handler for joining and updating documents
@socketio.on('join')
@token_required
def handle_join(current_user,data):
    doc_id = data['docId']
    node_path = data['filePath']
    join_room(doc_id)
    
    path_parts = get_path_parts(node_path) + ['content']
    document = get_document_by_uuid(doc_id, path_parts)
    document = get_node_data(document, path_parts)

    if document:
        emit('update', {'docId': doc_id, 'content': document}, to=request.sid)
    else:
        emit('update', {'docId': doc_id, 'content': "This particular route or component doesn't have written content, please select a component that has written content."},  to=request.sid)

@socketio.on('update')
@token_required
def handle_update(current_user,data):
    doc_id = data['docId']
    content = data['content']
    node_path = data['filePath']
    
    path_parts = get_path_parts(node_path) + ['content']
    projection = {f"{'.'.join(path_parts)}"}
    projection = next(iter(projection))

    update_data = {projection: content, "updateTimestamp": datetime.datetime.now(datetime.timezone.utc)}
    documents.update_one({"uuid": doc_id}, {"$set": update_data})
    
    emit('update', {'docId': doc_id, 'content': content}, room=doc_id, skip_sid=request.sid)

# Routes
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")

    if users.find_one({"email": email}):
        return jsonify({"error": "User already exists"}), 400

    hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
    user_document = {
        "email": email,
        "password": hashed_password,
        "name": name,
        "createTimestamp":datetime.datetime.now(datetime.timezone.utc),
        "createdDocuments": {},
        "invitedDocuments": {}
    }

    users.insert_one(user_document)

    token = jwt.encode(
        {"email": email, "exp":datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)},
        app.config['SECRET_KEY'],
        algorithm="HS256"
    )

    return jsonify({"message": "User registered successfully", "token": token}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")
    user = users.find_one({"email": email})
    
    if not user or not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid credentials"}), 401
    
    token = jwt.encode(
        {"email": email, "exp":datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)},
        app.config['SECRET_KEY']
    )

    return jsonify({"token": token}), 200

@app.route('/api/scrape', methods=['POST'])
@token_required
def add_document(current_user):
    data = request.json
    data["createdBy"] = current_user['email']

    try:
        publish_message(data)
        return jsonify({'status':'success','message': 'Payload published successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route("/api/documents", methods=["GET"])
@token_required
def get_documents(current_user):
    # Retrieve the user document by email
    user = users.find_one({"email": current_user["email"]})
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    # Access the createdDocuments field which contains the references (UUIDs)
    created_documents = user.get("createdDocuments",{} )
    # Fetch the full document details using the UUIDs from the createdDocuments references
    created_documents_details = []
    for uuid, document_ref in created_documents.items():
        document = document_ref
        if document:
            document_details = {
                "uuid": uuid,
                "title": document["title"],
                "url": document["url"],
                "createDate": document.get("createTimestamp","Not available")
            }
            created_documents_details.append(document_details)

    invited_documents = user.get("invitedDocuments",{} )
    invited_documents_details = []
    for uuid, document_ref in invited_documents.items():
        document = document_ref
        if document:
            document_details = {
                "uuid": uuid,
                "title": document["title"],
                "url": document["url"],
                "createDate": document.get("createTimestamp","Not available")
            }
            invited_documents_details.append(document_details)

    # Return the documents details as a JSON response
    final_response = {"createdDocuments":created_documents_details,"invitedDocuments":invited_documents_details}
    return jsonify({"documents": final_response}), 200

@app.route("/api/invite", methods=["GET"])
@token_required
def document_invite(current_user):
    # Retrieve the user document by email
    data = request.args
    invited_user_email = data.get('email')
    doc_id = data.get('docId')
    
    if not invited_user_email or not doc_id:
        return jsonify({"error": "Email and docId are required"}), 200
    user = users.find_one({"email": current_user["email"]})
    created_documents = user.get("createdDocuments",{} )

    if doc_id not in created_documents:
        return jsonify({"message": "Sorry, You can only share an invite for your own created documents."}), 200

    if current_user["email"]==invited_user_email:
        return jsonify({"message": "Sorry, you cannot invite yourself."}), 200
    
    current_user = users.find_one({"email": invited_user_email})
    if not current_user:
        return jsonify({"message": "The entered email address doesn't have an account on ScrapeIt, ask them to make an account first."}), 200
    
    # Create JWT token with email and docId
    payload = {
        "email": invited_user_email,
        "docId": doc_id,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=1)  # Token expires in 1 hour
    }

    token = jwt.encode(payload, app.config['SECRET_KEY'], algorithm="HS256")
    domain = os.getenv('DOMAIN_URL', 'https://scrape-it.duckdns.org')
    invite_link = domain + f"/api/accept_invite?token={token}"
    
    try:
        # Send the email
        msg = Message("ScrapeIt - You're Invited!",
                      sender="scrapeit.invite@gmail.com",
                      recipients=[invited_user_email])
        msg.body = f"You have been invited to collaborate on a document. Click the link below to accept and access:\n{invite_link}"
        
        mail.send(msg)
        
        return jsonify({"message": "Invitation sent successfully"}), 200
    except Exception as e:
        return jsonify({"message": "error: "+str(e)}), 500

@app.route("/api/accept_invite", methods=["GET"])
def accept_invite():
    token = request.args.get('token')

    if not token:
        return jsonify({"error": "Token is required"}), 400

    try:
        # Decode the JWT token
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        invited_user_email = payload.get('email')
        doc_id = payload.get('docId')

        if not invited_user_email or not doc_id:
            return jsonify({"error": "Invalid token payload"}), 400

        # Perform your task with invited_user_email and doc_id
        # Example: Grant access to the document for the invited user
        # Create the reference object for the user's createdDocuments
        document = documents.find_one({"uuid": doc_id})
        document_reference = {
            "title": document['title'],
            "url": document['url'],
            "createTimestamp": document["createTimestamp"]
        }
        # Update the user's createdDocuments field with the new document reference
        users.update_one(
            {"email": invited_user_email},
            {"$set": {f"invitedDocuments.{document['uuid']}": document_reference}}
        )

        return jsonify({"message": "Invite accepted successfully"}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({"error": "Token has expired"}), 400
    except jwt.InvalidTokenError:
        return jsonify({"error": "Invalid token"}), 400


@app.route("/api/documents/<uuid>/get-children/", methods=["GET"])
@token_required
def get_children_endpoint(current_user,uuid):
    
    node_path = request.args.get('path', 'docs')
    path_parts = get_path_parts(node_path) + ['keys']
    node = get_document_by_uuid(uuid, path_parts)
    node_data = get_node_data(node, path_parts)
    node_data_dict = {key: {} for key in node_data}
    
    return jsonify(node_data_dict), 200

if __name__ == "__main__":
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, allow_unsafe_werkzeug=True)

