FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY agent_collective/ agent_collective/
COPY demo_ui/ demo_ui/

# Create writable directories for outputs and KB
RUN mkdir -p agent_collective/outputs/kb_cache \
    agent_collective/outputs/kr \
    agent_collective/outputs/in \
    agent_collective/outputs/jp \
    agent_collective/outputs/id \
    agent_collective/kb/global \
    agent_collective/kb/kr \
    agent_collective/kb/in \
    agent_collective/kb/jp \
    agent_collective/kb/id

# Default environment
ENV MARKET=kr
ENV PORT=8080

EXPOSE 8080

# Single-process: uvicorn runs the unified FastAPI app (ADK embedded)
CMD ["uvicorn", "demo_ui.server:app", "--host", "0.0.0.0", "--port", "8080"]
