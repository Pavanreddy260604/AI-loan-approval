# Base stage with all heavy ML dependencies
FROM python:3.12-slim AS runner

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /workspace

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install requirements
COPY infra/docker/python-requirements.txt /tmp/requirements.txt
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r /tmp/requirements.txt

# Copy and install shared-python properly
COPY packages/shared-python /tmp/shared-python
RUN pip install /tmp/shared-python && rm -rf /tmp/shared-python

# Set working directory back to workspace
WORKDIR /workspace

# Add a non-root user for security
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Copy service-specific source
ARG SERVICE_DIR
COPY --chown=appuser:appuser ${SERVICE_DIR} /workspace
USER appuser

# Note: Port is controlled by the command in docker-compose
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "5000"]
