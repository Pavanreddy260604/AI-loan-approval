import json
import os
import sys

# Monorepo path injection for shared-python
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SHARED_PYTHON_PATH = os.path.join(PROJECT_ROOT, "packages", "shared-python")
if SHARED_PYTHON_PATH not in sys.path:
    sys.path.append(SHARED_PYTHON_PATH)

import pika
from .tasks import process_dataset_metadata
from .config import settings

def callback(ch, method, properties, body):
    try:
        payload = json.loads(body.decode("utf-8"))
        print(f"[CONSUMER] Received event {method.routing_key}")
        
        if method.routing_key == "dataset.uploaded":
            dataset_id = payload.get("datasetId")
            if dataset_id:
                process_dataset_metadata.delay(dataset_id, payload)
                print(f"[CONSUMER] Queued metadata processing for {dataset_id}")
        
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print(f"[CONSUMER] Error processing event: {e}")
        # Optionally nack with requeue=False to avoid infinite loops
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def start_consumer():
    params = pika.URLParameters(settings.rabbitmq_url)
    connection = pika.BlockingConnection(params)
    channel = connection.channel()
    
    exchange = "platform.events"
    channel.exchange_declare(exchange=exchange, exchange_type="topic", durable=True)
    
    result = channel.queue_declare(queue="training_events", durable=True)
    queue_name = result.method.queue
    
    # Bind to relevant topics
    channel.queue_bind(exchange=exchange, queue=queue_name, routing_key="dataset.uploaded")
    
    print(f"[CONSUMER] Waiting for events on {queue_name}...")
    channel.basic_consume(queue=queue_name, on_message_callback=callback)
    
    try:
        channel.start_consuming()
    except KeyboardInterrupt:
        channel.stop_consuming()
        connection.close()

if __name__ == "__main__":
    import time
    while True:
        try:
            start_consumer()
        except (pika.exceptions.AMQPConnectionError, pika.exceptions.ConnectionClosedByBroker, Exception) as e:
            print(f"[CONSUMER] Connection error: {e}. Retrying in 5 seconds...")
            time.sleep(5)
        except KeyboardInterrupt:
            print("[CONSUMER] Shutting down.")
            break
