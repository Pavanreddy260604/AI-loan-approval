from __future__ import annotations

import base64
import hashlib
import hmac
import json
from datetime import datetime
from io import BytesIO
from typing import Any

import boto3
import jwt
from fastapi import HTTPException


def verify_internal_access(authorization: str | None, public_key_base64: str, issuer: str = "", audience: str = "") -> dict:
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()

    if not public_key_base64:
        raise HTTPException(status_code=500, detail="JWT verification is not configured")

    public_key_pem = base64.b64decode(public_key_base64).decode("utf-8")

    decode_kwargs: dict = {"algorithms": ["RS256"]}
    if issuer:
        decode_kwargs["issuer"] = issuer
    if audience:
        decode_kwargs["audience"] = audience

    try:
        claims = jwt.decode(token, public_key_pem, **decode_kwargs)
    except jwt.exceptions.PyJWTError:
        raise HTTPException(status_code=401, detail="Unauthorized") from None

    if claims.get("tokenType") != "access":
        raise HTTPException(status_code=401, detail="Invalid access tokenType")

    return claims


def get_s3_client(endpoint: str, access_key: str, secret_key: str, region: str, use_ssl: bool = False):
    url = f"{'https' if use_ssl else 'http'}://{endpoint}"
    return boto3.client(
        "s3",
        endpoint_url=url,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
    )


def verify_artifact_integrity(client: Any, bucket: str, artifact_key: str, bundle_bytes: bytes, signing_key: str) -> None:
    manifest_key = f"{artifact_key}.manifest.json"
    try:
        response = client.get_object(Bucket=bucket, Key=manifest_key)
        manifest = json.loads(response["Body"].read().decode("utf-8"))
    except Exception as error:
        raise HTTPException(status_code=403, detail="Missing or corrupt model manifest. Audit failure.") from error

    signature = manifest.pop("signature", None)
    manifest_bytes = json.dumps(manifest, sort_keys=True).encode("utf-8")
    expected_signature = hmac.new(signing_key.encode("utf-8"), manifest_bytes, hashlib.sha256).hexdigest()

    if signature != expected_signature:
        raise HTTPException(status_code=403, detail="Invalid model signature. Artifact tampered.")

    actual_sha = hashlib.sha256(bundle_bytes).hexdigest()
    if actual_sha != manifest["sha256"]:
        raise HTTPException(status_code=403, detail="Model SHA256 mismatch. Artifact tampered.")


def open_s3_stream(client: Any, bucket: str, key: str) -> Any:
    response = client.get_object(Bucket=bucket, Key=key)
    return response["Body"]


def keys_to_camel(d: Any) -> Any:
    if isinstance(d, list):
        return [keys_to_camel(i) for i in d]
    if isinstance(d, dict):
        new_dict = {}
        for k, v in d.items():
            components = k.split("_")
            camel_k = components[0] + "".join(x.title() for x in components[1:])
            new_dict[camel_k] = keys_to_camel(v)
        return new_dict
    return d


def log_event(service: str, event_type: str, details: dict, correlation_id: str | None = None, level: str = "INFO"):
    log_data = {
        "timestamp": datetime.now().isoformat(),
        "level": level,
        "service": service,
        "event": event_type,
        "correlationId": correlation_id,
        "details": details
    }
    print(json.dumps(log_data))


def check_health(db_conn: Any = None, s3_client: Any = None, bucket: str | None = None, rabbitmq_url: str | None = None) -> dict[str, Any]:
    status: dict[str, Any] = {
        "status": "ok", 
        "timestamp": datetime.now().isoformat(),
        "dependencies": {}
    }

    if db_conn:
        try:
            # Check if it's a connection or a getter
            conn = db_conn() if callable(db_conn) else db_conn
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                status["dependencies"]["database"] = "healthy"
        except Exception as e:
            status["status"] = "unhealthy"
            status["dependencies"]["database"] = f"error: {str(e)}"

    if s3_client and bucket:
        try:
            # Check if it's a client or a getter
            client = s3_client() if callable(s3_client) else s3_client
            client.head_bucket(Bucket=bucket)
            status["dependencies"]["s3"] = "healthy"
        except Exception as e:
            status["status"] = "unhealthy"
            status["dependencies"]["s3"] = f"error: {str(e)}"

    if rabbitmq_url:
        try:
            import pika
            params = pika.URLParameters(rabbitmq_url)
            params.socket_timeout = 2
            connection = pika.BlockingConnection(params)
            connection.close()
            status["dependencies"]["rabbitmq"] = "healthy"
        except Exception as e:
            status["status"] = "unhealthy"
            status["dependencies"]["rabbitmq"] = f"error: {str(e)}"

    return status
