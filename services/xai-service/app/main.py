from __future__ import annotations
import sys
import os
from contextvars import ContextVar
from typing import Optional

import base64
from functools import lru_cache
from io import BytesIO
from typing import Any

import boto3
import joblib
import numpy as np
import pandas as pd
import shap
import torch
import jwt
from fastapi import FastAPI, Header, HTTPException, Request

# Monorepo path injection for shared-python
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
SHARED_PYTHON_PATH = os.path.join(PROJECT_ROOT, "packages", "shared-python")
if SHARED_PYTHON_PATH not in sys.path:
    sys.path.append(SHARED_PYTHON_PATH)

from ai_utils import verify_internal_access, get_s3_client, check_health, keys_to_camel, log_event

correlation_id_ctx: ContextVar[Optional[str]] = ContextVar("correlation_id", default=None)


def env(name: str, default: str) -> str:
    import os

    return os.getenv(name, default)


MODELS_BUCKET = env("S3_BUCKET_MODELS", "loan-models")
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
XAI_KERNEL_BACKGROUND_LIMIT = int(env("XAI_KERNEL_BACKGROUND_LIMIT", "50"))
XAI_KERNEL_NSAMPLES = int(env("XAI_KERNEL_NSAMPLES", "50"))  # Reduced from 200 for faster responses

app = FastAPI(title="xai-service")

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


def s3_client():
    return get_s3_client(f"{MINIO_ENDPOINT}:{MINIO_PORT}", MINIO_ACCESS_KEY, MINIO_SECRET_KEY, S3_REGION, MINIO_USE_SSL)


def verify_artifact_integrity(artifact_key: str, bundle_bytes: bytes) -> None:
    import hashlib
    import hmac
    import json
    from fastapi import HTTPException

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


def predict_transformed(bundle: dict[str, Any], values: np.ndarray) -> np.ndarray:
    if bundle["model_family"] == "deep_mlp":
        model = TabularMLP(bundle["nn_input_dim"])
        model.load_state_dict(bundle["nn_state_dict"])
        model.eval()
        with torch.no_grad():
            logits = model(torch.tensor(values, dtype=torch.float32))
            return torch.sigmoid(logits).cpu().numpy()
    return bundle["model"].predict_proba(values)[:, 1]


def aggregate_values(bundle: dict[str, Any], shap_values: np.ndarray) -> list[dict]:
    grouped: dict[str, float] = {}
    for index, value in enumerate(shap_values):
        source = bundle["feature_sources"][index]
        grouped[source] = grouped.get(source, 0.0) + float(value)
    items = [{"feature": key, "impact": value} for key, value in grouped.items()]
    return sorted(items, key=lambda item: abs(item["impact"]), reverse=True)


@app.get("/health")
def health_check():
    health = check_health(
        s3_client=s3_client,
        bucket=MODELS_BUCKET
    )
    return {**health, "service": "xai-service"}


@app.post("/internal/explain/local")
def local_explanation(payload: dict, authorization: str | None = Header(None)) -> dict:
    claims = verify_access(authorization)
    if not str(payload.get("artifactKey", "")).startswith(f"{claims.get('tenantId')}/"):
        raise HTTPException(status_code=403, detail="Forbidden")
    log_event("xai-service", "explanation.local.started", {"artifactKey": payload.get("artifactKey")}, correlation_id=correlation_id_ctx.get())
    bundle = load_bundle(payload["artifactKey"])
    
    # Ensure all expected columns are present (fill missing with 0)
    features = payload["features"].copy()
    if hasattr(bundle["preprocessor"], 'feature_names_in_'):
        expected_cols = bundle["preprocessor"].feature_names_in_
        for col in expected_cols:
            if col not in features:
                features[col] = 0
    
    frame = pd.DataFrame([features])
    
    try:
        transformed = bundle["preprocessor"].transform(frame)
    except ValueError as e:
        log_event("xai-service", "explanation.transform_failed", {"error": str(e)}, level="ERROR", correlation_id=correlation_id_ctx.get())
        # Return a placeholder explanation when transformation fails
        return keys_to_camel({
            "topContributors": [],
            "summary": {"positiveDrivers": [], "negativeDrivers": []},
            "approximationInfo": {"isApproximated": True, "nsamples": None, "method": "Fallback (transform error)"}
        })
    
    dense = transformed.toarray() if hasattr(transformed, "toarray") else np.asarray(transformed)
    background = np.asarray(bundle["background_transformed"])
    approximated = False

    if bundle["model_family"] in {"random_forest", "xgboost"}:
        explainer = shap.TreeExplainer(bundle["model"])
        explanation = explainer.shap_values(dense)
        # Handle split between TreeExplainer list output and XGBoost log-odds output
        if isinstance(explanation, list):
            # Binary classification usually returns [values_class_0, values_class_1]
            values = explanation[1] if len(explanation) > 1 else explanation[0]
        else:
            values = explanation
        # Always take the first row (local explanation)
        if len(values.shape) > 1:
            values = values[0]
    elif bundle["model_family"] == "logistic_regression":
        explainer = shap.LinearExplainer(bundle["model"], background)
        values = explainer.shap_values(dense)[0]
    else:
        # Use smaller background and samples for faster computation
        background_limit = min(XAI_KERNEL_BACKGROUND_LIMIT, 20)  # Limit background size
        nsamples = XAI_KERNEL_NSAMPLES  # Default 50, much faster than 200
        
        explainer = shap.KernelExplainer(
            lambda items: predict_transformed(bundle, items), 
            background[:background_limit]
        )
        values = explainer.shap_values(dense, nsamples=nsamples)
        if isinstance(values, list):
            values = values[1] if len(values) > 1 else values[0]
        if len(values.shape) > 1:
            values = values[0]
        approximated = True

    aggregated = aggregate_values(bundle, np.asarray(values))
    return keys_to_camel({
      "topContributors": aggregated[:8],
      "summary": {
        "positiveDrivers": [item for item in aggregated if item["impact"] > 0][:4],
        "negativeDrivers": [item for item in aggregated if item["impact"] < 0][:4],
      },
      "approximationInfo": {
          "isApproximated": approximated,
          "nsamples": XAI_KERNEL_NSAMPLES if approximated else None,
          "method": "SHAP Kernel" if approximated else "SHAP Exact/Tree",
      }
    })


@app.post("/internal/explain/global")
def global_explanation(payload: dict, authorization: str | None = Header(None)) -> dict:
    claims = verify_access(authorization)
    if not str(payload.get("artifactKey", "")).startswith(f"{claims.get('tenantId')}/"):
        raise HTTPException(status_code=403, detail="Forbidden")

    log_event("xai-service", "explanation.global.started", {"artifactKey": payload.get("artifactKey")}, correlation_id=correlation_id_ctx.get())
    bundle = load_bundle(payload["artifactKey"])
    return keys_to_camel({"featureImportance": bundle.get("global_importance", [])})
