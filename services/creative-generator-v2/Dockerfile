FROM python:3.12-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY creative_generator/ creative_generator/
COPY server/ server/

# Environment defaults
ENV PORT=8080
ENV GCS_BUCKET=v3-creative-engine.firebasestorage.app
ENV GCP_PROJECT_ID=v3-creative-engine
ENV VERTEX_AI_LOCATION=us-central1

EXPOSE 8080

# Single-process uvicorn (Cloud Run handles scaling)
CMD ["uvicorn", "server.app:app", "--host", "0.0.0.0", "--port", "8080"]
