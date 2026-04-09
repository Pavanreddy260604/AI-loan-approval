from __future__ import annotations
from contextvars import ContextVar

from datetime import date, datetime
from functools import lru_cache
from io import BytesIO
from typing import Any
from uuid import uuid4, UUID

import base64
import boto3
import joblib
import numpy as np
import pandas as pd
import pika
import psycopg
import requests
import torch
import json
import jwt
from fastapi import FastAPI, File, Form, Header, HTTPException, Query, UploadFile, Request
from fastapi.responses import Response
from psycopg.rows import dict_row
from psycopg.types.json import Json
from typing import Optional, cast

correlation_id_ctx: ContextVar[Optional[str]] = ContextVar("correlation_id", default=None)

import sys
import os

# Monorepo path injection for shared-python
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SHARED_PYTHON_PATH = os.path.join(PROJECT_ROOT, "packages", "shared-python")
if SHARED_PYTHON_PATH not in sys.path:
    sys.path.append(SHARED_PYTHON_PATH)

from ai_utils import (
    verify_internal_access, 
    get_s3_client, 
    verify_artifact_integrity as shared_verify_integrity,
    check_health,
    keys_to_camel,
    log_event
)


def env(name: str, default: str) -> str:
    import os

    return os.getenv(name, default)


DATABASE_URL = env("PREDICTION_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/prediction_db")
TRAINING_SERVICE_URL = env("TRAINING_SERVICE_URL", "http://localhost:5007")
BILLING_SERVICE_URL = env("BILLING_SERVICE_URL", "http://billing-service:4002")
RABBITMQ_URL = env("RABBITMQ_URL", "amqp://guest:guest@localhost:5672")
MODELS_BUCKET = env("S3_BUCKET_MODELS", "loan-models")
BATCH_BUCKET = env("S3_BUCKET_BATCH", "batch-results")
S3_REGION = env("S3_REGION", "us-east-1")
MINIO_ENDPOINT = env("MINIO_ENDPOINT", "localhost")
MINIO_PORT = int(env("MINIO_PORT", "9000"))
MINIO_USE_SSL = env("MINIO_USE_SSL", "false").lower() == "true"
MINIO_ACCESS_KEY = env("MINIO_ACCESS_KEY", "minioadmin")
MINIO_SECRET_KEY = env("MINIO_SECRET_KEY", "minioadmin")
MODEL_ARTIFACT_SIGNING_KEY = env("MODEL_ARTIFACT_SIGNING_KEY", "audit-signing-key-default-2026")
JWT_PUBLIC_KEY_BASE64 = env("JWT_PUBLIC_KEY_BASE64", "")
JWT_ISSUER = env("JWT_ISSUER", "")
JWT_AUDIENCE = env("JWT_AUDIENCE", "")

app = FastAPI(title="prediction-service")

def s3_client():
    return get_s3_client(
        f"{MINIO_ENDPOINT}:{MINIO_PORT}",
        MINIO_ACCESS_KEY,
        MINIO_SECRET_KEY,
        S3_REGION,
        MINIO_USE_SSL
    )

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

@app.get("/health")
def health_check():
    health = check_health(
        db_conn=get_conn,
        rabbitmq_url=RABBITMQ_URL,
        s3_client=s3_client,
        bucket=MODELS_BUCKET
    )
    return {**health, "service": "prediction-service"}

def verify_access(authorization: str | None) -> dict:
    return verify_internal_access(authorization, JWT_PUBLIC_KEY_BASE64, JWT_ISSUER, JWT_AUDIENCE)


class TabularMLP(torch.nn.Module):
    def __init__(self, input_dim: int) -> None:
        super().__init__()
        self.network = torch.nn.Sequential(
            torch.nn.Linear(input_dim, 128),
            torch.nn.ReLU(),
            torch.nn.Dropout(0.2),
            torch.nn.Linear(128, 64),
            torch.nn.ReLU(),
            torch.nn.Dropout(0.1),
            torch.nn.Linear(64, 1),
        )

    def forward(self, values: torch.Tensor) -> torch.Tensor:
        return self.network(values).squeeze(-1)


def get_conn() -> psycopg.Connection:
    return psycopg.connect(DATABASE_URL, row_factory=dict_row)


def init_db() -> None:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS predictions (
                id UUID PRIMARY KEY,
                tenant_id UUID NOT NULL,
                user_id UUID NOT NULL,
                dataset_id UUID NOT NULL,
                model_version_id UUID NOT NULL,
                model_family TEXT,
                decision BOOLEAN NOT NULL,
                probability DOUBLE PRECISION NOT NULL,
                features JSONB NOT NULL,
                explanation JSONB,
                fraud JSONB,
                fraud_score DOUBLE PRECISION,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        cur.execute(
            """
            ALTER TABLE predictions
            ADD COLUMN IF NOT EXISTS model_family TEXT;
            """
        )
        cur.execute(
            """
            ALTER TABLE predictions
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
            """
        )
        cur.execute(
            """
            ALTER TABLE predictions
            ADD COLUMN IF NOT EXISTS fraud JSONB
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS batch_jobs (
                id UUID PRIMARY KEY,
                tenant_id UUID NOT NULL,
                user_id UUID NOT NULL,
                dataset_id UUID NOT NULL,
                model_version_id UUID,
                file_name TEXT,
                input_key TEXT,
                status TEXT NOT NULL DEFAULT 'queued',
                row_count INTEGER NOT NULL DEFAULT 0,
                output_key TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            """
        )
        cur.execute(
            """
            ALTER TABLE batch_jobs
            ADD COLUMN IF NOT EXISTS reserved_credits INTEGER NOT NULL DEFAULT 0
            """
        )
        cur.execute(
            """
            ALTER TABLE batch_jobs
            ADD COLUMN IF NOT EXISTS error TEXT
            """
        )
        cur.execute(
            """
            ALTER TABLE batch_jobs
            ADD COLUMN IF NOT EXISTS reservation_id UUID
            """
        )
        cur.execute(
            """
            ALTER TABLE batch_jobs
            ADD COLUMN IF NOT EXISTS billing_status TEXT NOT NULL DEFAULT 'reserved'
            """
        )
        cur.execute(
            """
            ALTER TABLE batch_jobs
            ADD COLUMN IF NOT EXISTS input_key TEXT
            """
        )
        cur.execute(
            """
            ALTER TABLE batch_jobs
            ADD COLUMN IF NOT EXISTS file_name TEXT
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS prediction_items (
                id UUID PRIMARY KEY,
                batch_job_id UUID NOT NULL REFERENCES batch_jobs(id) ON DELETE CASCADE,
                row_index INTEGER NOT NULL,
                decision BOOLEAN NOT NULL,
                probability DOUBLE PRECISION NOT NULL,
                features JSONB NOT NULL
            );
            """
        )
        cur.execute(
            """
            ALTER TABLE predictions
            ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'pending'
            """
        )
        cur.execute(
            """
            ALTER TABLE predictions
            ADD COLUMN IF NOT EXISTS reviewed_by UUID
            """
        )
        cur.execute(
            """
            ALTER TABLE predictions
            ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ
            """
        )
        cur.execute(
            """
            UPDATE predictions
            SET review_status = CASE WHEN decision = true THEN 'auto_approved' ELSE 'auto_rejected' END
            WHERE review_status = 'pending'
              AND decision IS NOT NULL
              AND reviewed_at IS NULL
              AND created_at < NOW() - INTERVAL '1 minute'
            """
        )

def ensure_bucket(bucket: str) -> None:
    client = s3_client()
    existing = [item["Name"] for item in client.list_buckets().get("Buckets", [])]
    if bucket not in existing:
        client.create_bucket(Bucket=bucket)


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


def verify_artifact_integrity(artifact_key: str, bundle_bytes: bytes) -> None:
    import hashlib
    import hmac

    client = s3_client()
    manifest_key = f"{artifact_key}.manifest.json"
    try:
        response = client.get_object(Bucket=MODELS_BUCKET, Key=manifest_key)
        manifest = json.loads(response["Body"].read().decode("utf-8"))
    except Exception as error:
        raise HTTPException(status_code=403, detail="Missing or corrupt model manifest. Audit failure.") from error

    signature = manifest.pop("signature", None)
    manifest_bytes = json.dumps(manifest, sort_keys=True).encode("utf-8")
    expected_signature = hmac.new(MODEL_ARTIFACT_SIGNING_KEY.encode("utf-8"), manifest_bytes, hashlib.sha256).hexdigest()

    if signature != expected_signature:
        raise HTTPException(status_code=403, detail="Invalid model signature. Artifact tampered.")

    actual_sha = hashlib.sha256(bundle_bytes).hexdigest()
    if actual_sha != manifest["sha256"]:
        raise HTTPException(status_code=403, detail="Model SHA256 mismatch. Artifact tampered.")


@lru_cache(maxsize=32)
def load_bundle(artifact_key: str) -> dict[str, Any]:
    client = s3_client()
    handle = BytesIO()
    client.download_fileobj(MODELS_BUCKET, artifact_key, handle)
    bundle_bytes = handle.getvalue()
    
    verify_artifact_integrity(artifact_key, bundle_bytes)
    
    handle.seek(0)
    return joblib.load(handle)


@lru_cache(maxsize=128)
def resolve_version(tenant_id: str, dataset_id: str, model_version_id: str | None, access_token: str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    correlation_id = correlation_id_ctx.get()
    if correlation_id:
        headers["x-correlation-id"] = correlation_id
        
    response = requests.get(
        f"{TRAINING_SERVICE_URL}/internal/model-resolve",
        params={"tenantId": tenant_id, "datasetId": dataset_id, "modelVersionId": model_version_id},
        timeout=30,
        headers=headers,
    )
    response.raise_for_status()
    return response.json()


def resolve_version_or_raise(tenant_id: str, dataset_id: str, model_version_id: str | None, access_token: str) -> dict:
    try:
        return resolve_version(tenant_id, dataset_id, model_version_id, access_token)
    except requests.HTTPError as error:
        response = error.response
        if response is None:
            raise HTTPException(status_code=502, detail="Training service unavailable") from error

        try:
            payload = response.json()
        except ValueError:
            payload = None

        detail = payload.get("detail") if isinstance(payload, dict) else response.text
        raise HTTPException(status_code=response.status_code, detail=detail or "Unable to resolve model version") from error
    except requests.RequestException as error:
        raise HTTPException(status_code=502, detail="Training service unavailable") from error


def get_required_feature_names(bundle: dict[str, Any]) -> list[str]:
    return list(dict.fromkeys([*bundle.get("numeric_features", []), *bundle.get("categorical_features", [])]))


def validate_feature_keys(bundle: dict[str, Any], provided_keys: list[str] | set[str], *, batch: bool = False) -> None:
    required = get_required_feature_names(bundle)
    provided_set = set(provided_keys)
    missing = [name for name in required if name not in provided_set]
    if not missing:
        return

    prefix = "Batch file is missing required columns" if batch else "Prediction payload is missing required fields"
    raise HTTPException(status_code=422, detail=f"{prefix}: {', '.join(missing)}")


def to_json_safe_value(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (str, bool, int)):
        return value
    if isinstance(value, float):
        return None if np.isnan(value) or np.isinf(value) else value
    if isinstance(value, np.generic):
        return to_json_safe_value(value.item())
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    return None if pd.isna(value) else value


def to_json_safe_record(record: dict[str, Any]) -> dict[str, Any]:
    return {key: to_json_safe_value(value) for key, value in record.items()}


def predict_probability(bundle: dict[str, Any], features: dict[str, Any]) -> float:
    frame = pd.DataFrame([features])
    transformed = bundle["preprocessor"].transform(frame)
    dense = transformed.toarray() if hasattr(transformed, "toarray") else np.asarray(transformed)

    if bundle["model_family"] == "deep_mlp":
        model = TabularMLP(bundle["nn_input_dim"])
        model.load_state_dict(bundle["nn_state_dict"])
        model.eval()
        with torch.no_grad():
            logits = model(torch.tensor(dense, dtype=torch.float32))
            return float(torch.sigmoid(logits).cpu().numpy()[0])

    return float(bundle["model"].predict_proba(dense)[:, 1][0])


def get_threshold(bundle: dict[str, Any]) -> float:
    return float(bundle.get("threshold", 0.5))


def apply_smart_mapping(bundle: dict[str, Any], df: pd.DataFrame) -> pd.DataFrame:
    import difflib
    required = get_required_feature_names(bundle)
    existing_cols = list(df.columns)
    mapping = {}
    
    # Header Map for case-insensitive/stripped matching
    header_map = {str(col).strip().lower(): str(col) for col in existing_cols}
    
    for req in required:
        norm_req = str(req).strip().lower()
        if norm_req in header_map:
            mapping[header_map[norm_req]] = req
        else:
            # Fuzzy match
            matches = difflib.get_close_matches(req, existing_cols, n=1, cutoff=0.7)
            if matches:
                mapping[matches[0]] = req
                
    if not mapping:
        return df
        
    return df.rename(columns=mapping)


def parse_batch(file_name: str, payload: bytes | Any, chunksize: int | None = None) -> pd.DataFrame | Any:
    ext = file_name.lower().split(".")[-1]
    if ext not in ["csv", "xlsx"]:
        raise ValueError(f"Unsupported file format: .{ext}. Please use .csv or .xlsx.")
    
    if isinstance(payload, bytes):
        buffer = BytesIO(payload)
    else:
        buffer = payload

    def reset_buffer() -> None:
        if not hasattr(buffer, "seek"):
            return
        try:
            buffer.seek(0)
        except Exception:
            pass

    def normalize_frame(frame: pd.DataFrame) -> pd.DataFrame:
        normalized = frame.copy()
        normalized.columns = [str(c).strip() for c in normalized.columns]
        for col in normalized.select_dtypes(["object"]).columns:
            normalized[col] = normalized[col].astype(str).str.strip().replace("", np.nan)
        return normalized

    import io
    
    try:
        if ext == "xlsx":
            if chunksize:
                print("[PREDICTION] Warning: chunksize not supported for Excel files.")
            df = pd.read_excel(buffer, engine="openpyxl")
            return normalize_frame(df)
        
        # Robust CSV parsing
        reset_buffer()
        # Wrap bytes in text stream for the python engine sniffer
        stream = buffer
        if isinstance(buffer, (BytesIO, io.BufferedIOBase)):
            stream = io.TextIOWrapper(buffer, encoding="utf-8", errors="replace", newline="")
            
        df_iter = pd.read_csv(stream, sep=None, engine="python", on_bad_lines="warn", chunksize=chunksize)
        
        if chunksize:
            return (normalize_frame(chunk) for chunk in df_iter)
        
        return normalize_frame(df_iter)
    except Exception as e:
        print(f"[PREDICTION] Primary CSV parsing failed: {e}. Retrying with utf-8-sig...")
        reset_buffer()
        df = pd.read_csv(buffer, encoding="utf-8-sig", on_bad_lines="skip", chunksize=chunksize)
        if chunksize:
            return (normalize_frame(chunk) for chunk in df)
        return normalize_frame(df)


def normalize_chunk(chunk: pd.DataFrame) -> pd.DataFrame:
    normalized = chunk.copy()
    normalized.columns = [str(c).strip() for c in normalized.columns]
    for col in normalized.select_dtypes(["object"]).columns:
        normalized[col] = normalized[col].astype(str).str.strip().replace("", np.nan)
    return normalized


def parse_service_error(response: requests.Response, fallback: str) -> str:
    try:
        payload = response.json()
    except ValueError:
        payload = None

    if isinstance(payload, dict):
        detail = payload.get("detail") or payload.get("error")
        if isinstance(detail, str) and detail:
            return detail
    if response.text:
        return response.text
    return fallback


def call_billing(path: str, payload: dict[str, Any], access_token: str) -> dict[str, Any]:
    # World Class: Billing decommissioned. Replaced with unlimited free tier.
    return {"status": "success", "reservationId": str(uuid4())}


# Whitelist of allowed columns for batch job updates
ALLOWED_BATCH_COLUMNS = {"status", "billing_status", "error", "row_count", "output_key", "reservation_id", "input_key", "file_name", "model_version_id"}


def update_batch_job_fields(batch_job_id: str, tenant_id: str, user_id: str, **fields: Any) -> None:
    if not fields:
        return

    # Validate column names against whitelist to prevent SQL injection
    invalid_columns = set(fields.keys()) - ALLOWED_BATCH_COLUMNS
    if invalid_columns:
        raise ValueError(f"Invalid column names: {invalid_columns}")

    # Now safe to use column names in query
    assignments = [f"{column} = %s" for column in fields]
    params = list(fields.values()) + [batch_job_id, tenant_id, user_id]
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            f"""
            UPDATE batch_jobs
            SET {", ".join(assignments)}, updated_at = NOW()
            WHERE id = %s AND tenant_id = %s AND user_id = %s
            """,
            params,
        )


def reserve_batch_credits(access_token: str, tenant_id: str, dataset_id: str, units: int) -> dict[str, Any]:
    return call_billing(
        "/internal/credits/reserve",
        {
            "tenantId": tenant_id,
            "units": units,
            "reason": "batch_prediction",
            "reference": f"dataset:{dataset_id}",
        },
        access_token,
    )


def process_batch_job(
    batch_job_id: str,
    tenant_id: str,
    user_id: str,
    dataset_id: str,
    file_name: str,
    payload: bytes | Any,
    model_version_id: str | None,
    reservation_id: str,
    access_token: str,
) -> dict:
    import tempfile
    import os
    
    try:
        version = resolve_version(tenant_id, dataset_id, model_version_id, access_token)
        # Resilient access for synchronization proofing
        artifact_key = version.get("artifactKey") or version.get("artifact_key")
        if not artifact_key:
            raise KeyError("Neither 'artifactKey' nor 'artifact_key' found in version response")
        bundle = load_bundle(artifact_key)
        
        # Use chunk size of 500 for memory safety
        reader = parse_batch(file_name, payload, chunksize=500)
        
        threshold = get_threshold(bundle)
        pos_label = bundle.get("positive_label", "Approved")
        neg_label = "Rejected" # Default fallback
        
        all_results_preview = []
        total_processed = 0
        output_key = f"{batch_job_id}.csv"

        with tempfile.NamedTemporaryFile(mode='w+', delete=False, suffix='.csv', newline='') as tf:
            temp_path = tf.name
            
            with get_conn() as conn, conn.cursor() as cur:
                # Handle reader being a DataFrame (Excel) or TextFileReader (CSV)
                if isinstance(reader, pd.DataFrame):
                    chunks = [reader]
                else:
                    chunks = reader

                for i, chunk in enumerate(chunks):
                    # Smart Column Mapping: Adapt fuzzy/casing differences in batch file
                    chunk = apply_smart_mapping(bundle, chunk)
                    chunk = normalize_chunk(chunk)
                    
                    validate_feature_keys(bundle, set(chunk.columns.tolist()), batch=True)
                    
                    rows_to_insert = []
                    chunk_results = []
                    for index, record in enumerate(chunk.to_dict(orient="records")):
                        stored_record = to_json_safe_record(record)
                        probability = predict_probability(bundle, record)
                        decision_bool = probability >= threshold
                        decision_label = pos_label if decision_bool else neg_label
                        
                        row_id = str(uuid4())
                        rows_to_insert.append((
                            row_id,
                            batch_job_id,
                            total_processed + index,
                            bool(decision),
                            float(probability),
                            Json(stored_record),
                        ))
                        
                        res_obj = {
                            **stored_record,
                            "approved": bool(decision),
                            "decision": "Approved" if decision else "Rejected",
                            "probability": float(probability),
                        }
                        chunk_results.append(res_obj)
                        if len(all_results_preview) < 100:
                            all_results_preview.append(res_obj)

                    # Append this chunk to the temporary file
                    pd.DataFrame(chunk_results).to_csv(tf, header=(i == 0), index=False)
                    tf.flush()

                    # Batch insert for this chunk into DB
                    cur.executemany(
                        """
                        INSERT INTO prediction_items (id, batch_job_id, row_index, decision, probability, features)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        """,
                        rows_to_insert,
                    )
                    total_processed += len(chunk)

                # Loop finished, upload the full CSV from disk
                try:
                    with open(temp_path, 'rb') as f:
                        s3_client().upload_fileobj(f, BATCH_BUCKET, output_key, ExtraArgs={"ContentType": "text/csv"})
                finally:
                    if os.path.exists(temp_path):
                        os.remove(temp_path)

                cur.execute(
                    """
                    UPDATE batch_jobs
                    SET row_count = %s, output_key = %s, error = NULL, updated_at = NOW()
                    WHERE id = %s AND tenant_id = %s AND user_id = %s
                    """,
                    (total_processed, output_key, batch_job_id, tenant_id, user_id),
                )
        
        commit_result = call_billing(
            "/internal/credits/commit",
            {
                "reservationId": reservation_id,
                "reference": f"batch:{batch_job_id}",
            },
            access_token,
        )
        update_batch_job_fields(
            batch_job_id,
            tenant_id,
            user_id,
            status="completed",
            billing_status="committed",
        )
        try:
            publish(
                "prediction.completed",
                {"tenantId": tenant_id, "datasetId": dataset_id, "batchJobId": batch_job_id, "count": total_processed},
            )
        except Exception as publish_error:
            log_event("prediction-service", "batch.publish.failed", {"batchJobId": batch_job_id, "error": str(publish_error)}, level="ERROR", correlation_id=correlation_id_ctx.get())
            
        return {
            "processedCount": total_processed,
            "results": all_results_preview,
            "billing": commit_result,
        }
    except Exception as error:
        try:
            call_billing(
                "/internal/credits/release",
                {
                    "reservationId": reservation_id,
                    "reference": f"batch_failed:{batch_job_id}",
                },
                access_token,
            )
            billing_status = "released"
        except Exception as release_error:
            log_event("prediction-service", "batch.billing_release.failed", {"batchJobId": batch_job_id, "error": str(release_error)}, level="ERROR", correlation_id=correlation_id_ctx.get())
            billing_status = "reserved"

        update_batch_job_fields(
            batch_job_id,
            tenant_id,
            user_id,
            status="failed",
            billing_status=billing_status,
            error=str(error),
        )
        raise


@app.on_event("startup")
def startup() -> None:
    init_db()
    ensure_bucket(BATCH_BUCKET)


@app.post("/internal/predict")
def predict(payload: dict, authorization: str | None = Header(None)) -> dict:
    claims = verify_access(authorization)
    if authorization is None: raise HTTPException(status_code=401, detail="Missing auth")
    
    access_token = authorization.split(" ", 1)[1].strip()

    if payload.get("tenantId") != claims.get("tenantId") or payload.get("userId") != claims.get("sub"):
        raise HTTPException(status_code=403, detail="Forbidden")

    tenant_id = claims.get("tenantId")
    user_id = claims.get("sub")

    version = resolve_version_or_raise(tenant_id, payload["datasetId"], payload.get("modelVersionId"), access_token)
    log_event("prediction-service", "predict.started", {"datasetId": payload["datasetId"]}, correlation_id=correlation_id_ctx.get())
    artifact_key = version.get("artifactKey") or version.get("artifact_key")
    if not artifact_key:
        raise HTTPException(status_code=500, detail="Model version missing artifact key")
    bundle = load_bundle(artifact_key)
    
    # Smart Column Mapping: Adapt fuzzy/casing differences in features payload
    features_df = apply_smart_mapping(bundle, pd.DataFrame([payload["features"]]))
    mapped_features = features_df.to_dict(orient="records")[0]
    
    validate_feature_keys(bundle, set(mapped_features.keys()))
    try:
        probability = predict_probability(bundle, mapped_features)
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    pos_label = bundle.get("positive_label", "Approved")
    neg_label = "Rejected" # Default fallback
    
    decision_bool = (probability >= get_threshold(bundle))
    decision_label = pos_label if decision_bool else neg_label
    prediction_id = str(uuid4())
    stored_features = to_json_safe_record(payload["features"])

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO predictions (id, tenant_id, user_id, dataset_id, model_version_id, model_family, decision, probability, features)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                prediction_id,
                tenant_id,
                user_id,
                payload["datasetId"],
                version["id"],
                version.get("modelFamily") or version.get("model_family"),
                decision_bool,
                probability,
                Json(stored_features),
            ),
        )

    publish(
        "prediction.completed",
        {
            "tenantId": tenant_id,
            "datasetId": payload["datasetId"],
            "predictionId": prediction_id,
            "count": 1,
        },
    )
    return {
        "predictionId": prediction_id,
        "decision": decision_label,
        "approved": decision_bool,
        "probability": probability,
        "artifactKey": artifact_key,
        "fraudArtifactKey": version.get("fraudArtifactKey") or version.get("fraud_artifact_key"),
        "modelVersion": {
            "id": version.get("id"),
            "modelId": version.get("modelId") or version.get("model_id"),
            "family": version.get("modelFamily") or version.get("model_family"),
            "metrics": version.get("metrics"),
        },
    }



@app.post("/internal/predict-batch", status_code=202)
async def predict_batch(
    file: UploadFile = File(...),
    tenantId: str = Form(...),
    userId: str = Form(...),
    datasetId: str = Form(...),
    modelVersionId: str | None = Form(default=None),
    authorization: str | None = Header(None),
) -> dict:
    claims = verify_access(authorization)
    if authorization is None: raise HTTPException(status_code=401, detail="Missing auth")
    
    access_token = authorization.split(" ", 1)[1].strip()
    if tenantId != claims.get("tenantId") or userId != claims.get("sub"):
        raise HTTPException(status_code=403, detail="Forbidden")

    tenant_id = claims.get("tenantId")
    user_id = claims.get("sub")

    version = resolve_version_or_raise(tenant_id, datasetId, modelVersionId, access_token)
    artifact_key = version.get("artifactKey") or version.get("artifact_key")
    if not artifact_key:
        raise HTTPException(status_code=500, detail="Model version missing artifact key")
    bundle = load_bundle(artifact_key)
    payload_bytes = await file.read()
    if not payload_bytes:
        raise HTTPException(status_code=400, detail="Batch file must include at least one row")

    row_count = 0

    try:
        reader = parse_batch(file.filename, payload_bytes, chunksize=500)
        if isinstance(reader, pd.DataFrame):
            chunk = normalize_chunk(reader)
            validate_feature_keys(bundle, set(chunk.columns.tolist()), batch=True)
            row_count = len(chunk)
        else:
            for chunk in reader:
                normalized = normalize_chunk(chunk)
                validate_feature_keys(bundle, set(normalized.columns.tolist()), batch=True)
                row_count += len(normalized)
    except StopIteration:
        raise HTTPException(status_code=400, detail="Batch file must include at least one row")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except requests.HTTPError as error:
        raise HTTPException(status_code=502, detail="Training service unavailable") from error

    if row_count <= 0:
        raise HTTPException(status_code=400, detail="Batch file must include at least one row")

    reservation = reserve_batch_credits(access_token, tenant_id, datasetId, row_count)
    reservation_id = str(reservation.get("reservationId"))

    try:
        batch_job_id = str(uuid4())
        input_key = f"inputs/{tenant_id}/{batch_job_id}/{file.filename}"
        s3_client().upload_fileobj(BytesIO(payload_bytes), BATCH_BUCKET, input_key)
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO batch_jobs (
                    id,
                    tenant_id,
                    user_id,
                    dataset_id,
                    model_version_id,
                    file_name,
                    input_key,
                    reservation_id,
                    billing_status,
                    status,
                    row_count,
                    reserved_credits
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'reserved', 'queued', %s, %s)
                """,
                (
                    batch_job_id,
                    tenant_id,
                    user_id,
                    datasetId,
                    modelVersionId,
                    file.filename,
                    input_key,
                    reservation_id,
                    row_count,
                    row_count,
                ),
            )

        publish(
            "prediction.batch.requested",
            {
                "batchJobId": batch_job_id,
                "tenantId": tenant_id,
                "userId": user_id,
                "datasetId": datasetId,
                "modelVersionId": modelVersionId,
                "reservationId": reservation_id,
                "inputKey": input_key,
                "fileName": file.filename,
                "accessToken": access_token,
            },
        )
    except Exception as error:
        try:
            call_billing(
                "/internal/credits/release",
                {
                    "reservationId": reservation_id,
                    "reference": f"batch_enqueue_failed:{datasetId}",
                },
                access_token,
            )
        except Exception as release_error:
            print(f"Failed to release batch reservation after enqueue failure: {release_error}")
        raise HTTPException(status_code=500, detail=f"Unable to queue batch job: {error}") from error

    return {
        "batchJobId": batch_job_id,
        "status": "queued",
        "rowCount": row_count,
        "reservedCredits": row_count,
        "outputReady": False,
        "downloadUrl": None,
        "error": None,
    }


def get_batch_job(batch_job_id: str, tenant_id: str, user_id: str) -> dict:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT * FROM batch_jobs WHERE id = %s AND tenant_id = %s AND user_id = %s",
            (batch_job_id, tenant_id, user_id),
        )
        job = cur.fetchone()
        if not job:
            raise HTTPException(status_code=404, detail="Batch job not found")
        return job


@app.get("/internal/batch-jobs/{batch_job_id}")
def get_batch_job_status(batch_job_id: str, authorization: str | None = Header(None)) -> dict:
    claims = verify_access(authorization)
    if authorization is None: raise HTTPException(status_code=401, detail="Missing auth")
    
    tenant_id = claims.get("tenantId")
    user_id = claims.get("sub")
    job = get_batch_job(batch_job_id, tenant_id, user_id)
    
    results = []
    if job["status"] == "completed":
        with get_conn() as conn, conn.cursor() as cur:
            cur.execute(
                """
                SELECT features, decision, probability
                FROM prediction_items
                WHERE batch_job_id = %s
                ORDER BY row_index ASC
                LIMIT 100
                """,
                (batch_job_id,),
            )
            rows = cur.fetchall()
            for row in rows:
                results.append({
                    **row["features"],
                    "approved": row["decision"],
                    "decision": "Approved" if row["decision"] else "Rejected",
                    "probability": row["probability"]
                })

    return {
        "batchJobId": job["id"],
        "status": job["status"],
        "rowCount": job["row_count"],
        "reservedCredits": job.get("reserved_credits", 0),
        "reservationId": job.get("reservation_id"),
        "billingStatus": job.get("billing_status", "reserved"),
        "outputKey": job["output_key"],
        "outputReady": bool(job["output_key"]),
        "results": results,
        "createdAt": job["created_at"],
        "updatedAt": job["updated_at"],
        "error": job.get("error"),
    }


@app.post("/internal/batch-jobs/{batch_job_id}/billing-status")
def update_batch_job_billing_status(batch_job_id: str, payload: dict, authorization: str | None = Header(None)) -> dict:
    claims = verify_access(authorization)
    if authorization is None: raise HTTPException(status_code=401, detail="Missing auth")
    
    billing_status = payload.get("billingStatus")
    if billing_status not in {"reserved", "committed", "released"}:
        raise HTTPException(status_code=400, detail="billingStatus must be reserved, committed, or released")

    with get_conn() as conn, conn.cursor() as cur:
        tenant_id = claims.get("tenantId")
        user_id = claims.get("sub")
        cur.execute(
            """
            UPDATE batch_jobs
            SET billing_status = %s, updated_at = NOW()
            WHERE id = %s AND tenant_id = %s AND user_id = %s
            """,
            (billing_status, batch_job_id, tenant_id, user_id),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Batch job not found")

    return {"batchJobId": batch_job_id, "billingStatus": billing_status}


@app.get("/internal/batch-jobs/{batch_job_id}/download")
def download_batch_job(batch_job_id: str, authorization: str | None = Header(None)) -> Response:
    claims = verify_access(authorization)
    if authorization is None: raise HTTPException(status_code=401, detail="Missing auth")
    
    job = get_batch_job(batch_job_id, claims.get("tenantId"), claims.get("sub"))
    if job["status"] != "completed" or not job["output_key"]:
        raise HTTPException(status_code=409, detail="Batch output is not ready")

    buffer = BytesIO()
    s3_client().download_fileobj(BATCH_BUCKET, job["output_key"], buffer)
    filename = f"{batch_job_id}.csv"
    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@app.post("/internal/predictions/{prediction_id}/metadata")
def update_prediction_metadata(prediction_id: str, payload: dict, authorization: str | None = Header(None)) -> dict:
    verify_access(authorization)
    explanation = payload.get("explanation")
    fraud = payload.get("fraud")
    fraud_score = payload.get("fraudScore")
    if fraud_score is None and isinstance(fraud, dict):
        fraud_score = fraud.get("riskScore") or fraud.get("risk_score") or fraud.get("fraudScore")
    
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE predictions
            SET explanation = %s, fraud = %s, fraud_score = %s, updated_at = NOW()
            WHERE id = %s
            """,
            (
                Json(explanation) if explanation is not None else None,
                Json(fraud) if fraud is not None else None,
                fraud_score,
                prediction_id,
            ),
        )
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Prediction not found")
            
    return {"predictionId": prediction_id, "updated": True}


@app.get("/internal/predictions")
def get_predictions(authorization: str | None = Header(None)) -> list[dict]:
    claims = verify_access(authorization)
    if authorization is None:
        raise HTTPException(status_code=401, detail="Missing auth")

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT
                id,
                tenant_id,
                user_id,
                dataset_id,
                model_version_id,
                model_family,
                decision,
                probability,
                features,
                explanation,
                fraud,
                fraud_score,
                created_at
            FROM predictions
            WHERE tenant_id = %s
            ORDER BY created_at DESC
            LIMIT 100
            """,
            (claims.get("tenantId"),),
        )
        rows = cur.fetchall()
        return keys_to_camel(rows)


@app.get("/internal/predictions/audit")
def get_prediction_audit_logs(authorization: str | None = Header(None)) -> list[dict]:
    """Admin endpoint to get prediction audit logs with explanations"""
    claims = verify_access(authorization)
    if authorization is None: raise HTTPException(status_code=401, detail="Missing auth")
    
    if claims.get("role") != "ADMIN":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required")
    
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT 
                p.id,
                p.tenant_id,
                p.user_id,
                p.dataset_id,
                p.model_version_id,
                p.decision,
                p.probability,
                p.features,
                p.explanation,
                p.fraud,
                p.fraud_score,
                p.created_at
            FROM predictions p
            ORDER BY p.created_at DESC
            LIMIT 100
            """
        )
        rows = cur.fetchall()
        return keys_to_camel(rows)


@app.get("/internal/predictions/pending")
def get_pending_predictions(tenantId: str = Query(...)):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, dataset_id, model_version_id, decision, probability,
                   features, fraud_score, fraud, explanation,
                   review_status, created_at
            FROM predictions
            WHERE tenant_id = %s AND review_status = 'pending'
            ORDER BY created_at DESC
            LIMIT 50
            """,
            (tenantId,),
        )
        rows = cur.fetchall()
    return keys_to_camel(rows)


@app.get("/internal/predictions/recent-decisions")
def get_recent_decisions(tenantId: str = Query(...)):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, decision, probability, review_status,
                   reviewed_by, reviewed_at, features, created_at
            FROM predictions
            WHERE tenant_id = %s AND review_status IN ('approved', 'rejected')
            ORDER BY reviewed_at DESC
            LIMIT 10
            """,
            (tenantId,),
        )
        rows = cur.fetchall()
    return keys_to_camel(rows)


@app.get("/internal/predictions/{prediction_id}")
def get_prediction(prediction_id: UUID, authorization: str | None = Header(None)) -> dict:
    claims = verify_access(authorization)
    if authorization is None: raise HTTPException(status_code=401, detail="Missing auth")
    
    tenant_id = claims.get("tenantId")
    user_id = claims.get("sub")
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            SELECT * FROM predictions
            WHERE id = %s AND tenant_id = %s AND user_id = %s
            """,
            (prediction_id, tenant_id, user_id),
        )
        prediction = cur.fetchone()
        if not prediction:
            raise HTTPException(status_code=404, detail="Prediction not found")
        
        return keys_to_camel({
            "predictionId": str(prediction["id"]),
            "decision": "Approved" if prediction["decision"] else "Rejected",
            "approved": bool(prediction["decision"]),
            "probability": float(prediction["probability"]),
            "features": prediction["features"],
            "explanation": prediction["explanation"],
            "fraud": prediction["fraud"],
            "fraudScore": float(prediction["fraud_score"]) if prediction["fraud_score"] else None,
            "createdAt": prediction["created_at"].isoformat(),
        })


@app.post("/internal/predictions/{prediction_id}/decision")
def submit_decision(prediction_id: str, payload: dict):
    decision_type = payload.get("decision")
    user_id = payload.get("userId")
    tenant_id = payload.get("tenantId")

    if decision_type not in ("approve", "reject"):
        raise HTTPException(status_code=400, detail="decision must be 'approve' or 'reject'")

    review_status = "approved" if decision_type == "approve" else "rejected"

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE predictions
            SET review_status = %s, reviewed_by = %s, reviewed_at = NOW()
            WHERE id = %s AND tenant_id = %s
            RETURNING id, review_status
            """,
            (review_status, user_id, prediction_id, tenant_id),
        )
        result = cur.fetchone()

    if not result:
        raise HTTPException(status_code=404, detail="Prediction not found")
    return keys_to_camel(result)
