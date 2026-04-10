# Agent  Collective - Demo UI

Web interface for the Creative Collective multi-agent pipeline.

## Setup

### Terminal 1: ADK pipeline

```bash
cd ~/agent-collective
source .venv/bin/activate
adk web
```

ADK runs on port 8000.

### Terminal 2: Demo frontend

```bash
cd ~/agent-collective
source .venv/bin/activate
cd demo_ui
pip install -r requirements.txt
uvicorn server:app --port 8080
```

### Browser

Open Cloud Shell web preview on port 8080.

## How it works

The frontend sends messages to the FastAPI backend, which proxies them
to ADK on localhost:8000. Events stream back via SSE (Server-Sent Events)
so the user sees progress in real time.

Only presenter agent output is shown to the user. All specialist agents
(JSON output, quality checks, revisions) are filtered out by the frontend.

## Model switching

Edit `agent_collective/agent.py`:

- Testing: `MODEL_PRO = "gemini-2.5-flash"` (~$0.15/run)
- Production: `MODEL_PRO = "gemini-2.5-pro"` (~$2-3/run)
