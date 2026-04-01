import json
import os
import sys

# Monorepo path injection for shared-python
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SHARED_PYTHON_PATH = os.path.join(PROJECT_ROOT, "packages", "shared-python")
if SHARED_PYTHON_PATH not in sys.path:
    sys.path.append(SHARED_PYTHON_PATH)

import pika
import pandas as pd
import joblib
from io import BytesIO
import requests
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler

from ai_utils import get_s3_client, log_event

import boto3
def get_s3_client_fallback(endpoint, access_key, secret_key, region, use_ssl=False):
    url = f"{'https' if use_ssl else 'http'}://{endpoint}"
    return boto3.client(
        "s3",
        endpoint_url=url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
    )

def env(name: str, default: str) -> str:
    return os.getenv(name, default)

RABBITMQ_URL = env("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")
MODELS_BUCKET = env("S3_BUCKET_MODELS", "loan-models")
S3_REGION = env("S3_REGION", "us-east-1")
MINIO_ENDPOINT = env("MINIO_ENDPOINT", "localhost")
MINIO_PORT = int(env("MINIO_PORT", "9000"))
MINIO_USE_SSL = env("MINIO_USE_SSL", "false").lower() == "true"
MINIO_ACCESS_KEY = env("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = env("MINIO_SECRET_KEY", "minioadmin")
TRAINING_SERVICE_URL = env("TRAINING_SERVICE_URL", "http://localhost:5007")

def handle_train_request(ch, method, properties, body):
    payload = json.loads(body)
    print(f"[FRAUD-WORKER] Received training request for model version {payload['modelVersionId']}")
    
    try:
        numeric_features = payload["numericFeatureNames"]
        frame = pd.DataFrame(payload["rows"])
        frame = frame[numeric_features].apply(pd.to_numeric, errors="coerce")
        
        imputer = SimpleImputer(strategy="median")
        scaler = StandardScaler()
        values = imputer.fit_transform(frame)
        scaled = scaler.fit_transform(values)
        
        model = IsolationForest(contamination=0.05, random_state=42)
        model.fit(scaled)

        artifact = {
            "numeric_features": numeric_features,
            "imputer": imputer,
            "scaler": scaler,
            "model": model,
        }
        
        key = f"{payload['tenantId']}/{payload['modelVersionId']}/fraud.joblib"
        buffer = BytesIO()
        joblib.dump(artifact, buffer)
        buffer.seek(0)
        
        client = get_s3_client(
            f"{MINIO_ENDPOINT}:{MINIO_PORT}",
            MINIO_ACCESS_KEY,
            MINIO_SECRET_KEY,
            S3_REGION,
            MINIO_USE_SSL
        )
        client.upload_fileobj(buffer, MODELS_BUCKET, key)
        
        # Register with training-service
        if payload.get("accessToken"):
            resp = requests.post(
                f"{TRAINING_SERVICE_URL}/internal/model-versions/{payload['modelVersionId']}/fraud-metadata",
                headers={"Authorization": f"Bearer {payload['accessToken']}"},
                json={
                    "tenantId": payload["tenantId"],
                    "artifactKey": key
                },
                timeout=10
            )
            resp.raise_for_status()
            print(f"[FRAUD-WORKER] Registered fraud artifact for {payload['modelVersionId']}")
        
        ch.basic_ack(delivery_tag=method.delivery_tag)
    except Exception as e:
        print(f"[FRAUD-WORKER] Error processing request: {e}")
        # Reject and requeue once, or move to DLQ in production
        ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

def main():
    import time
    while True:
        try:
            connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
            channel = connection.channel()
            
            channel.exchange_declare(exchange="platform.events", exchange_type="topic", durable=True)
            queue = channel.queue_declare(queue="fraud.training.queue", durable=True)
            channel.queue_bind(exchange="platform.events", queue=queue.method.queue, routing_key="fraud.train.requested")
            
            channel.basic_qos(prefetch_count=1)
            channel.basic_consume(queue=queue.method.queue, on_message_callback=handle_train_request)
            
            print("[FRAUD-WORKER] Waiting for fraud training events...")
            channel.start_consuming()
        except (pika.exceptions.AMQPConnectionError, pika.exceptions.ConnectionClosedByBroker) as e:
            print(f"[FRAUD-WORKER] Connection lost: {e}. Retrying in 5 seconds...")
            time.sleep(5)
        except Exception as e:
            print(f"[FRAUD-WORKER] Unexpected error: {e}. Retrying in 5 seconds...")
            time.sleep(5)

if __name__ == "__main__":
    main()
