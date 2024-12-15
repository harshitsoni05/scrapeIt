from flask import Flask
from flask_socketio import SocketIO, emit, join_room

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, cors_allowed_origins="*")

documents = {}  # In-memory store for document content

@socketio.on('join')
def handle_join(data):
    doc_id = data['docId']
    join_room(doc_id)  # Join a room for the document
    if doc_id in documents:
        # Send the current content to the newly joined client
        emit('update', {'docId': doc_id, 'content': documents[doc_id]}, room=doc_id)
    else:
        documents[doc_id]=data['content']
    


@socketio.on('update')
def handle_update(data):
    doc_id = data['docId']
    content = data['content']
    documents[doc_id] = content  # Save the updated content
    emit('update', {'docId': doc_id, 'content': content}, room=doc_id)

if __name__ == '__main__':
    socketio.run(app, debug=True)
