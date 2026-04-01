# AI-Powered Automated Loan Intelligence System (Elite V2)

A state-of-the-art, microservices-driven platform for automated loan decisioning, risk assessment, and explainable AI (XAI). Designed for high-performance, real-time credit analysis with built-in fraud detection and data profiling.

---

## 🚀 Quick Start (Docker)

To launch the entire platform, ensure you have **Docker Desktop** (with 8GB+ RAM allocated) and **Docker Compose** installed.

```bash
# 1. Clone the repository and navigate to the directory
# 2. Build and start all services
docker-compose up -d --build
```

The system will automatically initialize databases, run migrations, and bootstrap the default admin account.

---

## 🔑 Admin Credentials

Use these credentials for the initial setup and to access the Admin Dashboard:

> [!IMPORTANT]
> **Email:** `admin@ailoan.local`  
> **Password:** `Admin@123`

---

## 🏗️ Architecture Overview

The platform is built on a distributed microservices architecture for maximum scalability and resilience:

- **Frontend (web):** React + Vite 6 + TailwindCSS (Elite V2 Design System).
- **Gateway (gateway-service):** Node.js/Express. The single entry point for all client requests.
- **Auth (auth-service):** JWT-based secure authentication with RSA key signing.
- **Data (data-service):** Python FastAPI. Handles dataset ingestion, profiling, and storage (Postgres + MinIO).
- **Training (training-service):** Python. Manages model training, versioning, and metrics.
- **Prediction (prediction-service):** Real-time inference using trained ML models.
- **XAI (xai-service):** Explainable AI using SHAP/LIME to provide human-readable logic for every decision.
- **Fraud (fraud-service):** Real-time anomaly detection and risk scoring.
- **Infrastructure:** Postgres (DB), Redis (Cache), RabbitMQ (Events), MinIO (Object Storage), Mailpit (Local Email Testing).

---

## 🌐 Service Map

| Service | Port | Internal URL |
| :--- | :--- | :--- |
| **Web UI** | `5175` | `http://localhost:5175` |
| **API Gateway** | `4000` | `http://localhost:4000/api/v1` |
| **Mailpit** | `8025` | `http://localhost:8025` (Email logs) |
| **MinIO** | `9001` | `http://localhost:9001` (Object storage UI) |

---

## 🔧 Performance & Stability Tweaks (Windows)

Due to Docker-on-Windows volume syncing constraints, we've implemented several optimizations:

- **Optimized Volumes:** Vite and Node now only watch the necessary source code directories, ignoring massive root-level `node_modules` scans.
- **Memory Hotfix:** Web and Gateway containers have been allocated 1GB and 512MB respectively to prevent HMR stalls and connection resets.
- **Null-Safe Enrichment:** The Gateway now handles background XAI/Fraud tasks with hard null-safety, ensuring the UI remains functional even during heavy processing.

---

## 🧪 Submission Verification

1. **Dashboard:** Verify metrics (Datasets, Models, Predictions) load immediately upon login.
2. **Predict:** Use the "One Loan" tool with "Magic Fill" to verify the end-to-end AI inference pipeline.
3. **Training:** Upload a new CSV in "Datasets" and trigger a "Train" action to verify the worker/queue system.

---

**Developed for Advanced Agentic Coding - March 2026**
# AI-loan-approval
