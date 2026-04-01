from uuid import uuid4
from typing import Optional
from contextvars import ContextVar

import base64

import jwt
from fastapi import FastAPI, Header, HTTPException, Request
from psycopg.types.json import Json

correlation_id_ctx: ContextVar[Optional[str]] = ContextVar("correlation_id", default=None)

from .config import settings
from .db import get_conn, init_db
from .events import publish
from .storage import ensure_bucket
from .tasks import train_dataset
import sys
import os

# Monorepo path injection for shared-python
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SHARED_PYTHON_PATH = os.path.join(PROJECT_ROOT, "packages", "shared-python")
if SHARED_PYTHON_PATH not in sys.path:
    sys.path.append(SHARED_PYTHON_PATH)

from ai_utils import check_health, keys_to_camel, log_event


app = FastAPI(title="training-service")

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

def verify_internal_access(authorization: str | None) -> tuple[dict, str]:
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")

    token = authorization.split(" ", 1)[1].strip()

    if not settings.jwt_public_key_base64:
        raise HTTPException(status_code=500, detail="JWT verification is not configured")

    public_key_pem = base64.b64decode(settings.jwt_public_key_base64).decode("utf-8")

    decode_kwargs: dict = {"algorithms": ["RS256"]}
    if settings.jwt_issuer:
        decode_kwargs["issuer"] = settings.jwt_issuer
    if settings.jwt_audience:
        decode_kwargs["audience"] = settings.jwt_audience

    try:
        claims = jwt.decode(token, public_key_pem, **decode_kwargs)
    except jwt.exceptions.PyJWTError:
        raise HTTPException(status_code=401, detail="Unauthorized") from None

    if claims.get("tokenType") != "access":
        raise HTTPException(status_code=401, detail="Invalid access tokenType")

    return claims, token


@app.on_event("startup")
def startup() -> None:
    init_db()
    ensure_bucket(settings.models_bucket)


@app.get("/health")
def health() -> dict:
    from ai_utils import get_s3_client

    def s3_client():
        return get_s3_client(
            f"{settings.minio_endpoint}:{settings.minio_port}",
            settings.minio_access_key,
            settings.minio_secret_key,
            settings.s3_region,
            settings.minio_use_ssl,
        )

    health = check_health(
        db_conn=get_conn,
        rabbitmq_url=settings.rabbitmq_url,
        s3_client=s3_client,
        bucket=settings.models_bucket
    )
    return {**health, "service": "training-service"}


@app.post("/internal/models/train")
def start_training(payload: dict, authorization: str | None = Header(None)) -> dict:
    claims, token = verify_internal_access(authorization)
    if payload.get("tenantId") != claims.get("tenantId") or payload.get("userId") != claims.get("sub"):
        raise HTTPException(status_code=403, detail="Forbidden")

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT * FROM models WHERE tenant_id = %s AND dataset_id = %s
                """,
                (payload["tenantId"], payload["datasetId"]),
            )
            model = cur.fetchone()
            if not model:
                model_id = str(uuid4())
                cur.execute(
                    """
                    INSERT INTO models (id, tenant_id, dataset_id)
                    VALUES (%s, %s, %s)
                    """,
                    (model_id, payload["tenantId"], payload["datasetId"]),
                )
            else:
                model_id = str(model["id"])

            job_id = str(uuid4())
            cur.execute(
                """
                INSERT INTO training_jobs (id, model_id, tenant_id, dataset_id, requested_by, status, progress, metadata)
                VALUES (%s, %s, %s, %s, %s, 'queued', 0, %s)
                """,
                (
                    job_id,
                    model_id,
                    payload["tenantId"],
                    payload["datasetId"],
                    payload["userId"],
                    Json({"columns": payload["columns"], "mapping": payload["mapping"]}),
                ),
            )

    publish(
        "training.requested",
        {
            "jobId": job_id,
            "modelId": model_id,
            "tenantId": payload["tenantId"],
            "datasetId": payload["datasetId"],
        },
    )
    # Pass the verified access token to background tasks so downstream internal calls can be authenticated.
    train_dataset.delay(job_id, {**payload, "modelId": model_id, "accessToken": token})
    log_event("training-service", "training.requested", {
        "jobId": job_id,
        "modelId": model_id,
        "tenantId": payload["tenantId"]
    }, correlation_id=correlation_id_ctx.get())
    return {"jobId": job_id, "modelId": model_id, "status": "queued"}


@app.get("/internal/jobs/{job_id}")
def get_job(job_id: str, authorization: str | None = Header(None)) -> dict:
    claims, _ = verify_internal_access(authorization)
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT * FROM training_jobs WHERE id = %s AND tenant_id = %s",
                (job_id, claims.get("tenantId")),
            )
            job = cur.fetchone()
            if not job:
                raise HTTPException(status_code=404, detail="Job not found")
            return keys_to_camel(job)


@app.get("/internal/models")
def list_models(tenantId: str, authorization: str | None = Header(None)) -> list[dict]:
    claims, _ = verify_internal_access(authorization)
    if tenantId != claims.get("tenantId"):
        raise HTTPException(status_code=403, detail="Forbidden")

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    m.*,
                    champion.model_family AS champion_family,
                    champion.metrics AS champion_metrics,
                    pinned.model_family AS pinned_family,
                    job.status AS last_training_status,
                    job.error AS last_training_error
                FROM models m
                LEFT JOIN model_versions champion ON champion.id = m.current_champion_version_id
                LEFT JOIN model_versions pinned ON pinned.id = m.pinned_version_id
                LEFT JOIN (
                    SELECT DISTINCT ON (model_id) model_id, status, error, created_at
                    FROM training_jobs
                    ORDER BY model_id, created_at DESC
                ) job ON job.model_id = m.id
                WHERE m.tenant_id = %s
                ORDER BY m.created_at DESC
                """,
                (tenantId,),
            )
            return keys_to_camel(cur.fetchall())


@app.get("/internal/models/compare")
def compare_models(
    tenantId: str,
    datasetId: str | None = None,
    authorization: str | None = Header(None),
) -> list[dict]:
    claims, _ = verify_internal_access(authorization)
    if tenantId != claims.get("tenantId"):
        raise HTTPException(status_code=403, detail="Forbidden")

    with get_conn() as conn:
        with conn.cursor() as cur:
            if datasetId:
                cur.execute(
                    """
                    SELECT mv.*
                    FROM model_versions mv
                    WHERE mv.tenant_id = %s AND mv.dataset_id = %s
                    ORDER BY mv.created_at DESC
                    """,
                    (tenantId, datasetId),
                )
            else:
                cur.execute(
                    """
                    SELECT mv.*
                    FROM model_versions mv
                    WHERE mv.tenant_id = %s
                    ORDER BY mv.created_at DESC
                    """,
                    (tenantId,),
                )
            return keys_to_camel(cur.fetchall())


@app.get("/internal/model-resolve")
def resolve_model(
    tenantId: str,
    datasetId: str,
    modelVersionId: str | None = None,
    authorization: str | None = Header(None),
) -> dict:
    claims, _ = verify_internal_access(authorization)
    if tenantId != claims.get("tenantId"):
        raise HTTPException(status_code=403, detail="Forbidden")

    with get_conn() as conn:
        with conn.cursor() as cur:
            version_id = modelVersionId
            
            if not version_id:
                cur.execute(
                    "SELECT * FROM models WHERE tenant_id = %s AND dataset_id = %s",
                    (tenantId, datasetId),
                )
                model = cur.fetchone()
                if not model:
                    raise HTTPException(status_code=404, detail="Model not found for dataset")
                version_id = model["pinned_version_id"] or model["current_champion_version_id"]

            if not version_id:
                raise HTTPException(status_code=404, detail="No ready model version available")

            cur.execute(
                "SELECT * FROM model_versions WHERE id = %s AND tenant_id = %s",
                (version_id, tenantId),
            )
            version = cur.fetchone()
            if not version:
                raise HTTPException(status_code=404, detail="Model version not found")
            
            # Dual-key support for synchronization proofing
            res = keys_to_camel(version)
            if "artifact_key" in version:
                res["artifact_key"] = version["artifact_key"]
            return res



@app.get("/internal/models/{model_id}")
def get_model(model_id: str, tenantId: str, authorization: str | None = Header(None)) -> dict:
    claims, _ = verify_internal_access(authorization)
    if tenantId != claims.get("tenantId"):
        raise HTTPException(status_code=403, detail="Forbidden")

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM models WHERE id = %s AND tenant_id = %s", (model_id, tenantId))
            model = cur.fetchone()
            if not model:
                raise HTTPException(status_code=404, detail="Model not found")
            cur.execute(
                "SELECT * FROM model_versions WHERE model_id = %s ORDER BY created_at DESC",
                (model_id,),
            )
            versions = cur.fetchall()
            return keys_to_camel({"model": model, "versions": versions})


@app.post("/internal/models/{model_id}/pin")
def pin_model(model_id: str, payload: dict, authorization: str | None = Header(None)) -> dict:
    claims, _ = verify_internal_access(authorization)
    version_id = payload.get("versionId")
    tenant_id = payload.get("tenantId")
    if not version_id:
        raise HTTPException(status_code=400, detail="versionId is required")
    if not tenant_id:
        raise HTTPException(status_code=400, detail="tenantId is required")
    if tenant_id != claims.get("tenantId"):
        raise HTTPException(status_code=403, detail="Forbidden")

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT mv.id
                FROM model_versions mv
                JOIN models m ON m.id = mv.model_id
                WHERE mv.id = %s AND mv.model_id = %s AND mv.tenant_id = %s AND m.tenant_id = %s
                """,
                (version_id, model_id, tenant_id, tenant_id),
            )
            version = cur.fetchone()
            if not version:
                raise HTTPException(status_code=404, detail="Model version not found")
            cur.execute(
                """
                UPDATE models
                SET pinned_version_id = %s, updated_at = NOW()
                WHERE id = %s AND tenant_id = %s
                """,
                (version_id, model_id, tenant_id),
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Model not found")
    return {"pinned": True, "modelId": model_id, "versionId": version_id}


@app.post("/internal/model-versions/{version_id}/fraud-metadata")
def update_fraud_metadata(version_id: str, payload: dict, authorization: str | None = Header(None)) -> dict:
    claims, _ = verify_internal_access(authorization)
    artifact_key = payload.get("artifactKey")
    tenant_id = payload.get("tenantId")
    if not artifact_key or not tenant_id:
        raise HTTPException(status_code=400, detail="artifactKey and tenantId are required")
    if tenant_id != claims.get("tenantId"):
        raise HTTPException(status_code=403, detail="Forbidden")

    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE model_versions
                SET fraud_artifact_key = %s
                WHERE id = %s AND tenant_id = %s
                """,
                (artifact_key, version_id, tenant_id),
            )
            if cur.rowcount == 0:
                raise HTTPException(status_code=404, detail="Model version not found")
    return {"updated": True}
