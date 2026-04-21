#!/bin/bash
# Deploy AI Loan Platform to Google Cloud Run (Free Tier)
# Prerequisites: gcloud CLI installed and authenticated

PROJECT_ID="your-project-id"
REGION="asia-south1"  # Mumbai - closest to you

echo "🚀 Deploying to Google Cloud Run..."

# Enable required APIs
gcloud services enable run.googleapis.com cloudbuild.googleapis.com

# Set project
gcloud config set project $PROJECT_ID

# ---------- BUILD & DEPLOY NODE SERVICES ----------

services=("gateway-service" "auth-service" "data-service" "analytics-service" "notification-service")

for service in "${services[@]}"; do
  echo "📦 Building $service..."
  
  # Build using Cloud Build (120 free build-minutes/day)
  gcloud builds submit --tag gcr.io/$PROJECT_ID/$service \
    --config=cloudbuild.yaml \
    --substitutions=_SERVICE=$service
  
  echo "🚀 Deploying $service to Cloud Run..."
  
  gcloud run deploy $service \
    --image gcr.io/$PROJECT_ID/$service \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 512Mi \
    --cpu 1 \
    --concurrency 80 \
    --max-instances 3 \
    --min-instances 0 \
    --set-env-vars "NODE_ENV=production" \
    --set-env-vars "RABBITMQ_URL=amqp://user:pass@your-rabbitmq:5672" \
    --set-env-vars "DATABASE_URL=your-db-url" \
    --timeout 300s
done

# ---------- BUILD & DEPLOY PYTHON SERVICES ----------

python_services=("training-service" "prediction-service" "fraud-service" "xai-service")

for service in "${python_services[@]}"; do
  echo "📦 Building $service..."
  
  gcloud builds submit --tag gcr.io/$PROJECT_ID/$service \
    --file=services/$service/Dockerfile \
    services/$service
  
  echo "🚀 Deploying $service..."
  
  gcloud run deploy $service \
    --image gcr.io/$PROJECT_ID/$service \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --memory 2Gi \
    --cpu 2 \
    --concurrency 10 \
    --max-instances 2 \
    --min-instances 0 \
    --timeout 600s  # ML tasks need more time
done

# ---------- DEPLOY FRONTEND (Firebase Hosting) ----------

echo "🌐 Deploying frontend to Firebase Hosting..."
cd apps/web
npm run build
cd dist
firebase init hosting
firebase deploy

echo "✅ Deployment complete!"
echo ""
echo "Service URLs:"
gcloud run services list --region $REGION --format="table(metadata.name,status.url)"
