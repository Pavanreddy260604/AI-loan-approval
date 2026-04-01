from contextlib import contextmanager
from typing import Iterator

import psycopg
from psycopg.rows import dict_row

from .config import settings


SCHEMA = [
    """
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    """,
    """
    CREATE TABLE IF NOT EXISTS models (
        id UUID PRIMARY KEY,
        tenant_id UUID NOT NULL,
        dataset_id UUID NOT NULL,
        current_champion_version_id UUID,
        pinned_version_id UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (tenant_id, dataset_id)
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS model_versions (
        id UUID PRIMARY KEY,
        model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL,
        dataset_id UUID NOT NULL,
        model_family TEXT NOT NULL,
        artifact_key TEXT NOT NULL,
        fraud_artifact_key TEXT,
        status TEXT NOT NULL DEFAULT 'training',
        metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
        is_champion BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    """,
    """
    CREATE TABLE IF NOT EXISTS training_jobs (
        id UUID PRIMARY KEY,
        model_id UUID NOT NULL REFERENCES models(id) ON DELETE CASCADE,
        tenant_id UUID NOT NULL,
        dataset_id UUID NOT NULL,
        requested_by UUID NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued',
        progress INTEGER NOT NULL DEFAULT 0,
        error TEXT,
        metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    """,
]


@contextmanager
def get_conn() -> Iterator[psycopg.Connection]:
    conn = psycopg.connect(settings.database_url, row_factory=dict_row)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_db() -> None:
    with get_conn() as conn:
        with conn.cursor() as cur:
            for statement in SCHEMA:
                cur.execute(statement)

