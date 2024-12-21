import pika
import json
import uuid
import time
import logging
import datetime
from webscrsapper import WebsiteScraper
from pymongo import MongoClient

# RabbitMQ Connection Details
RABBITMQ_HOST = 'host.docker.internal'
QUEUE_NAME = 'scrape_and_post'

# MongoDB Connection Details
client = MongoClient("mongodb://host.docker.internal:27017/")
db = client["documents"]
users = db["users"]
documents = db["documents"]

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
        "url": document['url'],
        "createTimestamp": document["createTimestamp"]
    }
    # Update the user's createdDocuments field with the new document reference
    users.update_one(
        {"email": document['createdBy']},
        {"$set": {f"createdDocuments.{document['uuid']}": document_reference}}
    )
    return document_id

def process_message(data):
    """
    Define your custom task with the received payload here.
    Example: Print the payload or perform some operation.
    """
    base_url = data["url"]
    scraper = WebsiteScraper(base_url, max_depth=1)
    scraper.scrape_website(base_url)
    
    scraper.add_keys(scraper.data)
    data["documentJson"] = scraper.data
    scraper.save_to_json("savedfile.json")
    new_doc_id = add_new_document(data)
    logger.info("Task completed successfully.")

def callback(ch, method, properties, body):
    try:
        # Decode the payload
        data = json.loads(body)
        logger.info(f"Received payload: {data}")
        
        # Acknowledge the message
        ch.basic_ack(delivery_tag=method.delivery_tag)

        # Process the payload
        process_message(data)
        
        logger.info("Message acknowledged.")
    except Exception as e:
        logger.error(f"Failed to process message: {e}")
        ch.basic_ack(delivery_tag=method.delivery_tag)

def start_consumer():
    while True:
        try:
            # Connect to RabbitMQ
            connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
            channel = connection.channel()

            # Declare the queue
            channel.queue_declare(queue=QUEUE_NAME, durable=True)

            # Consume messages from the queue
            channel.basic_consume(queue=QUEUE_NAME, on_message_callback=callback)

            logger.info("Waiting for messages. To exit, press CTRL+C")
            channel.start_consuming()

        except pika.exceptions.AMQPConnectionError as e:
            logger.error(f"Connection error: {e}. Reconnecting in 5 seconds...")
            time.sleep(5)
        except Exception as e:
            logger.error(f"Unexpected error: {e}. Reconnecting in 5 seconds...")
            time.sleep(5)

if __name__ == '__main__':
    try:
        start_consumer()
    except KeyboardInterrupt:
        logger.info("Consumer stopped.")
