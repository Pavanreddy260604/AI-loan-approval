import os
from dataclasses import dataclass


def as_bool(value: str | None, default: bool = False) -> bool:
    if value is None:
        return default
    return value.lower() == "true"


@dataclass(frozen=True)
class Settings:
    port: int = int(os.getenv("PORT", "5007"))
    database_url: str = os.getenv("TRAINING_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/training_db")
    rabbitmq_url: str = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")
    models_bucket: str = os.getenv("S3_BUCKET_MODELS", "loan-models")
    datasets_bucket: str = os.getenv("S3_BUCKET_DATASETS", "loan-datasets")
    s3_region: str = os.getenv("S3_REGION", "us-east-1")
    minio_endpoint: str = os.getenv("MINIO_ENDPOINT", "localhost")
    minio_port: int = int(os.getenv("MINIO_PORT", "9000"))
    minio_use_ssl: bool = as_bool(os.getenv("MINIO_USE_SSL"), False)
    minio_access_key: str = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
    minio_secret_key: str = os.getenv("MINIO_SECRET_KEY", "minioadmin")
    fraud_service_url: str = os.getenv("FRAUD_SERVICE_URL", "http://localhost:5004")
    auth_service_url: str = os.getenv("AUTH_SERVICE_URL", "http://localhost:4001")
    training_random_seed: int = int(os.getenv("TRAINING_RANDOM_SEED", "42"))
    model_artifact_signing_key: str = os.getenv("MODEL_ARTIFACT_SIGNING_KEY", "audit-signing-key-default-2026")
    jwt_public_key_base64: str = os.getenv("JWT_PUBLIC_KEY_BASE64", "")
    jwt_issuer: str = os.getenv("JWT_ISSUER", "")
    jwt_audience: str = os.getenv("JWT_AUDIENCE", "")


settings = Settings()

