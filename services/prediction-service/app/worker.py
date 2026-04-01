import json

import pika

from .main import RABBITMQ_URL, BATCH_BUCKET, s3_client, process_batch_job, update_batch_job_fields


def handle_batch_request(ch, method, properties, body):
    payload = json.loads(body)
    batch_job_id = payload["batchJobId"]

    try:
        update_batch_job_fields(
            batch_job_id,
            payload["tenantId"],
            payload["userId"],
            status="processing",
            error=None,
        )

        buffer = s3_client().get_object(Bucket=BATCH_BUCKET, Key=payload["inputKey"])["Body"].read()
        process_batch_job(
            batch_job_id,
            payload["tenantId"],
            payload["userId"],
            payload["datasetId"],
            payload["fileName"],
            buffer,
            payload.get("modelVersionId"),
            payload["reservationId"],
            payload["accessToken"],
        )
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as error:
        print(f"[PREDICTION-WORKER] Failed batch {batch_job_id}: {error}")
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)


def main():
    import time
    while True:
        try:
            connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
            channel = connection.channel()
            
            channel.exchange_declare(exchange="platform.events", exchange_type="topic", durable=True)
            queue = channel.queue_declare(queue="prediction.batch.queue", durable=True)
            channel.queue_bind(exchange="platform.events", queue=queue.method.queue, routing_key="prediction.batch.requested")
            
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue=queue.method.queue, on_message_callback=handle_batch_request)
            
            print("[PREDICTION-WORKER] Waiting for batch jobs...")
            channel.start_consuming()
        except (pika.exceptions.AMQPConnectionError, pika.exceptions.ConnectionClosedByBroker) as e:
            print(f"[PREDICTION-WORKER] Connection lost: {e}. Retrying in 5 seconds...")
            time.sleep(5)
        except Exception as e:
            print(f"[PREDICTION-WORKER] Unexpected error: {e}. Retrying in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    main()
