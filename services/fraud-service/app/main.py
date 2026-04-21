from __future__ import annotations
import sys
import os
from contextvars import ContextVar
from typing import Optional

import base64
import json
from functools import lru_cache
from io import BytesIO
from uuid import uuid4

import boto3
import joblib
import numpy as np
import pandas as pd
import pika
import psycopg
import jwt
from fastapi import FastAPI, Header, HTTPException, Request
from psycopg.rows import dict_row

# Monorepo path injection for shared-python
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SHARED_PYTHON_PATH = os.path.join(PROJECT_ROOT, "packages", "shared-python")
if SHARED_PYTHON_PATH not in sys.path:
    sys.path.append(SHARED_PYTHON_PATH)

from ai_utils import verify_internal_access, get_s3_client, check_health, keys_to_camel, log_event

correlation_id_ctx: ContextVar[Optional[str]] = ContextVar("correlation_id", default=None)
from psycopg.types.json import Json
from sklearn.ensemble import IsolationForest
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import StandardScaler


def env(name: str, default: str) -> str:
    import os

    return os.getenv(name, default)


DATABASE_URL = env("FRAUD_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/fraud_db")
RABBITMQ_URL = env("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")
MODELS_BUCKET = env("S3_BUCKET_MODELS", "loan-models")
S3_REGION = env("S3_REGION", "us-east-1")
MINIO_ENDPOINT = env("MINIO_ENDPOINT", "localhost")
MINIO_PORT = int(env("MINIO_PORT", "9000"))
MINIO_USE_SSL = env("MINIO_USE_SSL", "false").lower() == "true"
MINIO_ACCESS_KEY = env("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = env("MINIO_SECRET_KEY", "minioadmin")
JWT_PUBLIC_KEY_BASE64 = env("JWT_PUBLIC_KEY_BASE64", "")
JWT_ISSUER = env("JWT_ISSUER", "")
JWT_AUDIENCE = env("JWT_AUDIENCE", "")

app = FastAPI(title="fraud-service")

@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    correlation_id = request.headers.get("x-correlation-id")
    token = correlation_id_ctx.set(correlation_id)
    try:
        response = await call_next(request)
        if correlation_id:
            response.headers["x-correlation-id"] = correlation_id
        return response
    finally:
        correlation_id_ctx.reset(token)

def verify_access(authorization: str | None) -> dict:
    return verify_internal_access(authorization, JWT_PUBLIC_KEY_BASE64, JWT_ISSUER, JWT_AUDIENCE)


def get_conn() -> psycopg.Connection:
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def init_db() -> None:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS fraud_alerts (
                id UUID PRIMARY KEY,
                tenant_id UUID NOT NULL,
                user_id UUID,
                model_version_id UUID,
                risk_band TEXT NOT NULL,
                anomaly_score DOUBLE PRECISION NOT NULL,
                rule_flags JSONB NOT NULL,
                payload JSONB NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS fraud_rules (
                id UUID PRIMARY KEY,
                code TEXT NOT NULL UNIQUE,
                description TEXT NOT NULL,
                severity TEXT NOT NULL
            );
            """
        )


def s3_client():
    return get_s3_client(f"{MINIO_ENDPOINT}:{MINIO_PORT}", MINIO_ACCESS_KEY, MINIO_SECRET_KEY, S3_REGION, MINIO_USE_SSL)


def ensure_bucket(bucket: str) -> None:
    client = s3_client()
    existing = [item["Name"] for item in client.list_buckets().get("Buckets", [])]
    if bucket not in existing:
        client.create_bucket(Bucket=bucket)


@lru_cache(maxsize=32)
def load_artifact(key: str) -> dict:
    handle = BytesIO()
    s3_client().download_fileobj(MODELS_BUCKET, key, handle)
    handle.seek(0)
    return joblib.load(handle)


def publish(topic: str, payload: dict) -> None:
    connection = pika.BlockingConnection(pika.URLParameters(RABBITMQ_URL))
    channel = connection.channel()
    channel.exchange_declare(exchange="platform.events", exchange_type="topic", durable=True)
    channel.basic_publish(
        exchange="platform.events",
        routing_key=topic,
        body=json.dumps(payload).encode("utf-8"),
        properties=pika.BasicProperties(content_type="application/json", delivery_mode=2),
    )
    connection.close()


def extract_rule_flags(features: dict) -> list[str]:
    normalized = {str(key).lower(): value for key, value in features.items()}
    flags: list[str] = []
    annual_income = float(normalized.get("annual_income", normalized.get("applicantincome", 0)) or 0)
    loan_amount = float(normalized.get("loan_amount", normalized.get("loanamount", 0)) or 0)
    dti = float(normalized.get("debt_to_income", normalized.get("loan_to_income_ratio", 0)) or 0)
    credit_history = float(normalized.get("credit_history_years", normalized.get("credithistory", 1)) or 0)
    late_payments = float(normalized.get("late_payments", normalized.get("latepaymentcount", 0)) or 0)

    if annual_income and loan_amount > annual_income * 0.8:
        flags.append("LOAN_AMOUNT_HIGH_VS_INCOME")
    if dti > 0.55:
        flags.append("DEBT_TO_INCOME_ELEVATED")
    if credit_history < 1:
        flags.append("LIMITED_CREDIT_HISTORY")
    if late_payments >= 3:
        flags.append("MULTIPLE_LATE_PAYMENTS")
    return flags


# In-memory model cache for hot paths
_model_cache: dict[str, dict] = {}

def preload_hot_models():
    """Preload recent models from database to warm the cache"""
    try:
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute("""
                SELECT DISTINCT model_version_id, tenant_id 
                FROM fraud_alerts 
                ORDER BY created_at DESC 
                LIMIT 10
            """)
            rows = cur.fetchall()
            for row in rows:
                key = f"{row['tenant_id']}/{row['model_version_id']}/fraud.joblib"
                try:
                    _ = load_artifact(key)  # Warm the LRU cache
                    print(f"[FRAUD] Preloaded model: {key}")
                except Exception as e:
                    print(f"[FRAUD] Failed to preload {key}: {e}")
    except Exception as e:
        print(f"[FRAUD] Preload error: {e}")

@app.on_event("startup")
def startup() -> None:
    init_db()
    ensure_bucket(MODELS_BUCKET)
    # Preload models in background
    import threading
    threading.Thread(target=preload_hot_models, daemon=True).start()


@app.get("/health")
def health_check():
    health = check_health(
        db_conn=get_conn,
        rabbitmq_url=RABBITMQ_URL,
        s3_client=s3_client,
        bucket=MODELS_BUCKET
    )
    return {**health, "service": "fraud-service"}


@app.post("/internal/fraud/train")
def train(payload: dict, authorization: str | None = Header(None)) -> dict:
    claims = verify_access(authorization)
    if payload.get("tenantId") != claims.get("tenantId"):
        raise HTTPException(status_code=403, detail="Forbidden")

    numeric_features = payload["numericFeatureNames"]
    frame = pd.DataFrame(payload["rows"])
    frame = frame[numeric_features].apply(pd.to_numeric, errors="coerce")
    imputer = SimpleImputer(strategy="median")
    scaler = StandardScaler()
    values = imputer.fit_transform(frame)
    scaled = scaler.fit_transform(values)
    log_event("fraud-service", "fraud.train.started", {"modelVersionId": payload["modelVersionId"]}, correlation_id=correlation_id_ctx.get())
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
    s3_client().upload_fileobj(buffer, MODELS_BUCKET, key)
    return {"artifactKey": key}


@app.post("/internal/fraud/evaluate")
def evaluate(payload: dict, authorization: str | None = Header(None)) -> dict:
    claims = verify_access(authorization)
    if payload.get("tenantId") != claims.get("tenantId"):
        raise HTTPException(status_code=403, detail="Forbidden")
    if payload.get("userId") is not None and payload.get("userId") != claims.get("sub"):
        raise HTTPException(status_code=403, detail="Forbidden")

    features = payload.get("features") or {}
    flags = extract_rule_flags(features)

    # Fallback: if no IsolationForest artifact exists for this model version,
    # score using rule-based signals only so the UI always gets a real number
    # instead of a flat 0%.
    if not payload.get("fraudArtifactKey"):
        anomaly_score = 0.0
        risk_score = min(1.0, len(flags) * 0.25)
    else:
        artifact = load_artifact(payload["fraudArtifactKey"])
        row = pd.DataFrame([features])
        numeric_frame = row.reindex(columns=artifact["numeric_features"], fill_value=0).apply(pd.to_numeric, errors="coerce")
        imputed = artifact["imputer"].transform(numeric_frame)
        scaled = artifact["scaler"].transform(imputed)
        decision_score = float(artifact["model"].decision_function(scaled)[0])
        anomaly_score = max(0.0, min(1.0, (-decision_score + 0.5)))
        risk_score = min(1.0, anomaly_score + len(flags) * 0.15)

    if risk_score >= 0.75:
        risk_band = "high"
    elif risk_score >= 0.45:
        risk_band = "medium"
    else:
        risk_band = "low"

    # Async database write - don't block response
    def save_fraud_alert():
        try:
            with get_conn() as conn, conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO fraud_alerts (id, tenant_id, user_id, model_version_id, risk_band, anomaly_score, rule_flags, payload)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        str(uuid4()),
                        payload["tenantId"],
                        payload.get("userId"),
                        payload.get("modelVersionId"),
                        risk_band,
                        anomaly_score,
                        Json(flags),
                        Json(features),
                    ),
                )
        except Exception as e:
            print(f"[FRAUD] Failed to save alert: {e}")
    
    import threading
    threading.Thread(target=save_fraud_alert, daemon=True).start()

    if risk_band == "high":
        publish(
            "fraud.flagged",
            {
                "tenantId": payload["tenantId"],
                "userId": payload.get("userId"),
                "modelVersionId": payload.get("modelVersionId"),
                "riskBand": risk_band,
                "email": payload.get("email"),
                "flags": flags,
            },
        )

    # Return result immediately - DB write is async
    result = keys_to_camel({
        "riskBand": risk_band,
        "anomalyScore": anomaly_score,
        "riskScore": risk_score,
        "ruleFlags": flags,
    })
    
    log_event("fraud-service", "fraud.evaluate.completed", {
        "predictionId": payload.get("predictionId"),
        "riskBand": risk_band,
        "durationMs": 0  # Could track actual duration if needed
    }, correlation_id=correlation_id_ctx.get())
    
    return result
