from __future__ import annotations

from collections import Counter
from datetime import datetime, timezone
from io import BytesIO
from typing import Any
from uuid import uuid4

import hashlib
import hmac
import json
import requests
import pandas as pd
from celery import Celery
from psycopg.types.json import Json

from .config import settings
from .db import get_conn
from .events import publish
from .ml import champion_family, parse_dataset, train_candidates
from .storage import download_bytes, ensure_bucket, upload_bytes, open_s3_stream
from ai_utils import log_event


celery_app = Celery("training-service", broker=settings.rabbitmq_url, backend="rpc://")
TOP_VALUE_LIMIT = 6
SAMPLE_VALUE_LIMIT = 8
IDENTIFIER_TOKENS = {"id", "uuid", "guid", "identifier", "reference", "ref", "key"}


def sign_manifest(manifest: dict, secret_key: str) -> str:
    manifest_bytes = json.dumps(manifest, sort_keys=True).encode("utf-8")
    return hmac.new(secret_key.encode("utf-8"), manifest_bytes, hashlib.sha256).hexdigest()


def _json_safe(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, (datetime, pd.Timestamp)):
        return value.isoformat()
    if hasattr(value, "item"):
        try:
            value = value.item()
        except Exception:
            pass
    try:
        if pd.isna(value):
            return None
    except Exception:
        pass
    return value


def _value_key(value: Any) -> str:
    return json.dumps(_json_safe(value), default=str, sort_keys=True)


def _looks_like_identifier_name(column_name: str) -> bool:
    normalized = str(column_name).strip().lower().replace("-", "_").replace(" ", "_")
    parts = [part for part in normalized.split("_") if part]
    if normalized == "id" or normalized.endswith("_id"):
        return True
    return any(part in IDENTIFIER_TOKENS for part in parts)


def _sort_value_entries(entries: list[tuple[str, int]], lookup: dict[str, Any]) -> list[tuple[str, int]]:
    return sorted(entries, key=lambda item: (-item[1], str(lookup[item[0]])))


def _coerce_preview_rows(frame: pd.DataFrame, limit: int = 10) -> list[dict[str, Any]]:
    preview_rows: list[dict[str, Any]] = []
    for row in frame.head(limit).to_dict("records"):
        preview_rows.append({str(key): _json_safe(value) for key, value in row.items()})
    return preview_rows


def _column_stats(column_name: str, state: dict[str, Any]) -> dict[str, Any]:
    unique_count = len(state["value_counts"])
    non_null_count = int(state["non_null_count"])
    null_count = int(state["null_count"])
    uniqueness_ratio = unique_count / non_null_count if non_null_count else 0.0
    looks_like_identifier = _looks_like_identifier_name(column_name) or (
        unique_count > 12 and (unique_count == non_null_count or (non_null_count > 20 and uniqueness_ratio > 0.9))
    )

    ordered_counts = _sort_value_entries(list(state["value_counts"].items()), state["value_lookup"])
    top_value_limit = unique_count if unique_count <= 12 else TOP_VALUE_LIMIT
    top_values = [
        {
            "value": state["value_lookup"][key],
            "count": int(count),
        }
        for key, count in ordered_counts[:top_value_limit]
    ]

    candidate_labels = []
    if 2 <= unique_count <= 12 and not looks_like_identifier:
        candidate_labels = [state["value_lookup"][key] for key, _count in ordered_counts]

    return {
        "uniqueCount": unique_count,
        "nullCount": null_count,
        "nonNullCount": non_null_count,
        "topValues": top_values,
        "truncated": unique_count > len(top_values),
        "isBinaryCandidate": unique_count == 2 and not looks_like_identifier,
        "candidateLabels": candidate_labels,
        "looksLikeIdentifier": looks_like_identifier,
    }


@celery_app.task(name="training.train_dataset")
def train_dataset(job_id: str, payload: dict) -> dict:
    try:
        ensure_bucket(settings.models_bucket)
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE training_jobs
                    SET status = 'running', progress = 10, updated_at = NOW()
                    WHERE id = %s
                    """,
                    (job_id,),
                )

                log_event("training-service", "training.task.started", {"jobId": job_id}, correlation_id=payload.get("correlationId"))
                stream = open_s3_stream(settings.datasets_bucket, payload["datasetObjectKey"])
                dataframe = parse_dataset(payload["fileName"], stream)
                log_event("training-service", "training.data.parsed", {"jobId": job_id, "rowCount": len(dataframe)}, correlation_id=payload.get("correlationId"))

                families = ["logistic_regression", "random_forest", "xgboost", "deep_mlp"]
                version_ids = {family: str(uuid4()) for family in families}
                candidates, fraud_rows, numeric_features = train_candidates(
                    payload["datasetId"],
                    version_ids,
                    dataframe,
                    payload["mapping"],
                )
                winning_family = champion_family(candidates)
                log_event("training-service", "training.core.completed", {"jobId": job_id, "champion": winning_family}, correlation_id=payload.get("correlationId"))

                cur.execute(
                    """
                    UPDATE training_jobs
                    SET progress = 75, updated_at = NOW()
                    WHERE id = %s
                    """,
                    (job_id,),
                )

                champion_version_id = version_ids[winning_family]
                for candidate in candidates:
                    artifact_key = f"{payload['tenantId']}/{payload['datasetId']}/{candidate.family}/{version_ids[candidate.family]}.joblib"
                    upload_bytes(settings.models_bucket, artifact_key, candidate.bundle_bytes)
                    
                    # Generate and upload signed manifest
                    manifest = {
                        "tenantId": payload["tenantId"],
                        "datasetId": payload["datasetId"],
                        "modelVersionId": version_ids[candidate.family],
                        "modelFamily": candidate.family,
                        "sha256": hashlib.sha256(candidate.bundle_bytes).hexdigest(),
                        "createdAt": datetime.now(timezone.utc).isoformat(),
                    }
                    manifest["signature"] = sign_manifest(manifest, settings.model_artifact_signing_key)
                    manifest_key = f"{artifact_key}.manifest.json"
                    upload_bytes(settings.models_bucket, manifest_key, json.dumps(manifest).encode("utf-8"))

                    metrics = {**candidate.metrics, "feature_importance": candidate.feature_importance}
                    cur.execute(
                        """
                        INSERT INTO model_versions (id, model_id, tenant_id, dataset_id, model_family, artifact_key, fraud_artifact_key, status, metrics, is_champion)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, 'ready', %s, %s)
                        """,
                        (
                            version_ids[candidate.family],
                            payload["modelId"],
                            payload["tenantId"],
                            payload["datasetId"],
                            candidate.family,
                            artifact_key,
                            None,
                            Json(metrics),
                            candidate.family == winning_family,
                        ),
                    )

                if numeric_features and fraud_rows:
                    publish(
                        "fraud.train.requested",
                        {
                            "modelVersionId": champion_version_id,
                            "tenantId": payload["tenantId"],
                            "numericFeatureNames": numeric_features,
                            "rows": fraud_rows,
                            "accessToken": payload.get("accessToken"),
                        },
                        correlation_id=payload.get("correlationId")
                    )

                cur.execute(
                    """
                    UPDATE models
                    SET current_champion_version_id = %s, updated_at = NOW()
                    WHERE id = %s
                    """,
                    (champion_version_id, payload["modelId"]),
                )
                cur.execute(
                    """
                    UPDATE training_jobs
                    SET status = 'completed', progress = 100, updated_at = NOW()
                    WHERE id = %s
                    """,
                    (job_id,),
                )
                log_event("training-service", "training.task.completed", {"jobId": job_id, "status": "completed"}, correlation_id=payload.get("correlationId"))

        publish(
            "training.completed",
            {
                "jobId": job_id,
                "tenantId": payload["tenantId"],
                "datasetId": payload["datasetId"],
                "modelId": payload["modelId"],
                "championModelFamily": winning_family,
                "email": payload.get("email"),
                "userId": payload.get("userId"),
            },
            correlation_id=payload.get("correlationId")
        )
        publish(
            "model.promoted",
            {
                "tenantId": payload["tenantId"],
                "datasetId": payload["datasetId"],
                "modelId": payload["modelId"],
                "modelVersionId": champion_version_id,
                "family": winning_family,
            },
            correlation_id=payload.get("correlationId")
        )
        return {
            "jobId": job_id,
            "modelId": payload["modelId"],
            "championModelFamily": winning_family,
            "championVersionId": champion_version_id,
        }
    except Exception as error:
        with get_conn() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    UPDATE training_jobs
                    SET status = 'failed', error = %s, updated_at = NOW()
                    WHERE id = %s
                    """,
                    (str(error), job_id),
                )
        raise
@celery_app.task(name="dataset.process")
def process_dataset_metadata(dataset_id: str, payload: dict) -> dict:
    try:
        log_event("training-service", "metadata.process.started", {"datasetId": dataset_id}, correlation_id=payload.get("correlationId"))
        stream = open_s3_stream(settings.datasets_bucket, payload["datasetObjectKey"])
        
        reader = parse_dataset(payload["fileName"], stream, chunksize=1000)
        chunks = [reader] if isinstance(reader, pd.DataFrame) else reader
        
        row_count = 0
        preview: list[dict[str, Any]] = []
        column_states: dict[str, dict[str, Any]] = {}
        
        for i, chunk in enumerate(chunks):
            row_count += len(chunk)

            if i == 0:
                preview = _coerce_preview_rows(chunk)

            for col_name in chunk.columns:
                column_name = str(col_name)
                series = chunk[col_name]
                state = column_states.setdefault(
                    column_name,
                    {
                        "inferred_type": "numeric" if pd.api.types.is_numeric_dtype(series) else "categorical",
                        "sample_values": [],
                        "sample_keys": set(),
                        "value_counts": Counter(),
                        "value_lookup": {},
                        "null_count": 0,
                        "non_null_count": 0,
                    },
                )

                if state["inferred_type"] == "numeric" and not pd.api.types.is_numeric_dtype(series):
                    state["inferred_type"] = "categorical"

                null_mask = series.isna()
                state["null_count"] += int(null_mask.sum())
                non_null_values = series[~null_mask].tolist()
                state["non_null_count"] += len(non_null_values)

                for value in non_null_values:
                    safe_value = _json_safe(value)
                    if safe_value is None:
                        continue

                    serialized = _value_key(safe_value)
                    state["value_counts"][serialized] += 1
                    state["value_lookup"].setdefault(serialized, safe_value)

                    if (
                        len(state["sample_values"]) < SAMPLE_VALUE_LIMIT
                        and serialized not in state["sample_keys"]
                    ):
                        state["sample_values"].append(safe_value)
                        state["sample_keys"].add(serialized)

        columns = [
            {
                "name": column_name,
                "inferredType": state["inferred_type"],
                "sampleValues": state["sample_values"],
                "stats": _column_stats(column_name, state),
            }
            for column_name, state in column_states.items()
        ]

        publish(
            "dataset.processed",
            {
                "datasetId": dataset_id,
                "tenantId": payload["tenantId"],
                "rowCount": row_count,
                "columns": columns,
                "preview": preview,
            },
        )
        log_event("training-service", "metadata.process.completed", {"datasetId": dataset_id, "rowCount": row_count}, correlation_id=payload.get("correlationId"))
        return {"datasetId": dataset_id, "rowCount": row_count}
    except Exception as error:
        print(f"[METADATA] Failed to process dataset {dataset_id}: {error}")
        publish(
            "dataset.failed",
            {
                "datasetId": dataset_id,
                "tenantId": payload["tenantId"],
                "error": str(error),
            },
        )
        raise
