# Consolidated AI Services Dockerfile
# Merges: training + prediction + fraud + xai

FROM python:3.11-slim

WORKDIR /app

# Install system deps
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy services
COPY services/training-service/requirements.txt /tmp/training-req.txt
COPY services/prediction-service/requirements.txt /tmp/prediction-req.txt
COPY services/fraud-service/requirements.txt /tmp/fraud-req.txt
COPY services/xai-service/requirements.txt /tmp/xai-req.txt

# Install all Python deps
RUN pip install --no-cache-dir -r /tmp/training-req.txt \
    -r /tmp/prediction-req.txt \
    -r /tmp/fraud-req.txt \
    -r /tmp/xai-req.txt \
    fastapi uvicorn

# Copy service code
COPY services/training-service/app /app/training/app
COPY services/prediction-service/app /app/prediction/app
COPY services/fraud-service/app /app/fraud/app
COPY services/xai-service/app /app/xai/app

# Create unified FastAPI app
RUN echo 'from fastapi import FastAPI' > /app/main.py && \
    echo 'app = FastAPI(title="AI Loan Services")' >> /app/main.py && \
    echo '' >> /app/main.py && \
    echo '@app.get("/health")' >> /app/main.py && \
    echo 'async def health():' >> /app/main.py && \
    echo '    return {"status": "ok", "services": ["training", "prediction", "fraud", "xai"]}' >> /app/main.py

EXPOSE 5000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
