from io import BytesIO

import boto3

from .config import settings


def build_s3():
    endpoint = f"{'https' if settings.minio_use_ssl else 'http'}://{settings.minio_endpoint}:{settings.minio_port}"
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=settings.minio_access_key,
        aws_secret_access_key=settings.minio_secret_key,
        region_name=settings.s3_region,
    )


s3 = build_s3()


def ensure_bucket(bucket: str) -> None:
    existing = [item["Name"] for item in s3.list_buckets().get("Buckets", [])]
    if bucket not in existing:
        s3.create_bucket(Bucket=bucket)


def upload_bytes(bucket: str, key: str, data: bytes, content_type: str = "application/octet-stream") -> str:
    s3.upload_fileobj(BytesIO(data), bucket, key, ExtraArgs={"ContentType": content_type})
    return key


def download_bytes(bucket: str, key: str) -> bytes:
    handle = BytesIO()
    s3.download_fileobj(bucket, key, handle)
    handle.seek(0)
    return handle.read()


def open_s3_stream(bucket: str, key: str):
    response = s3.get_object(Bucket=bucket, Key=key)
    return response["Body"]

