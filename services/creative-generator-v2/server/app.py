"""
Creative Generator V2 - Unified Server
========================================

Single-process FastAPI server that embeds the ADK agent runtime and
serves custom API endpoints for the dashboard frontend.

Run locally:
    cd services/creative-generator-v2
    uvicorn server.app:app --host 0.0.0.0 --port 8080

Endpoints:
    POST /api/session              - Create a new ADK session
    POST /api/manifest/load        - Load manifest into session
    POST /api/manifest/validate    - Validate manifest (dry run)
    POST /api/refs/generate        - Trigger ref generation
    POST /api/jobs/generate        - Trigger job generation
    GET  /api/status/{session_id}  - Get session state (statuses)
    POST /api/run/stream           - SSE stream for generation progress

    ADK native endpoints (mounted at /adk):
    POST /adk/apps/{app}/users/{user}/sessions
    POST /adk/run_sse
    POST /adk/run
"""

import json
import os
from pathlib import Path

import httpx
from google.cloud import storage as gcs
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

ADK_INTERNAL_PORT = 8000
APP_NAME = "creative_generator"
USER_ID = "operator"

GCS_BUCKET = os.environ.get("GCS_BUCKET", "v3-creative-engine.firebasestorage.app")
GCP_PROJECT = os.environ.get("GCP_PROJECT_ID", "v3-creative-engine")

AGENTS_DIR = str(Path(__file__).parent.parent)
ADK_TIMEOUT = httpx.Timeout(timeout=600.0)

# ---------------------------------------------------------------------------
# Build ADK FastAPI app (embedded, no separate process)
# ---------------------------------------------------------------------------

from google.adk.cli.fast_api import get_fast_api_app

adk_app = get_fast_api_app(
    agents_dir=AGENTS_DIR,
    web=False,
    host="0.0.0.0",
    port=ADK_INTERNAL_PORT,
    allow_origins=[
        "https://v3-creative-engine.web.app",
        "https://v3-creative-engine.firebaseapp.com",
        "http://localhost:5174",
        "http://localhost:8080",
    ],
)

# ---------------------------------------------------------------------------
# Main app
# ---------------------------------------------------------------------------

app = FastAPI(title="Creative Generator V2")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://v3-creative-engine.web.app",
        "https://v3-creative-engine.firebaseapp.com",
        "http://localhost:5174",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/adk", adk_app)

# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------


class SessionRequest(BaseModel):
    market: str = "kr"
    creative_package: str | None = None


class ManifestRequest(BaseModel):
    session_id: str
    manifest_json: str


class GenerateRefRequest(BaseModel):
    session_id: str
    ref_id: str = ""  # empty = generate all pending


class GenerateJobRequest(BaseModel):
    session_id: str
    job_id: str


class RunStreamRequest(BaseModel):
    session_id: str
    message: str


# ---------------------------------------------------------------------------
# API Routes
# ---------------------------------------------------------------------------


@app.post("/api/session")
async def create_session(req: SessionRequest = None):
    """Create a new ADK session for a generation run."""
    market = (req.market if req else None) or "kr"
    initial_state = {"market": market}
    if req and req.creative_package:
        initial_state["creative_package"] = req.creative_package
    async with httpx.AsyncClient(timeout=ADK_TIMEOUT, base_url="http://localhost:8080") as client:
        resp = await client.post(
            f"/adk/apps/{APP_NAME}/users/{USER_ID}/sessions",
            json={"state": initial_state},
        )
        if resp.status_code not in (200, 201):
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"ADK session creation failed: {resp.text}",
            )
        data = resp.json()
        return {"session_id": data.get("id", "")}


@app.post("/api/manifest/load")
async def load_manifest(req: ManifestRequest):
    """Load and validate a generation manifest into an ADK session."""
    message = f"Load and validate this manifest:\n```json\n{req.manifest_json}\n```"

    async with httpx.AsyncClient(timeout=ADK_TIMEOUT, base_url="http://localhost:8080") as client:
        resp = await client.post(
            "/adk/run",
            json={
                "appName": APP_NAME,
                "userId": USER_ID,
                "sessionId": req.session_id,
                "newMessage": {
                    "role": "user",
                    "parts": [{"text": message}],
                },
            },
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Manifest load failed: {resp.text}",
            )
        return resp.json()


@app.post("/api/manifest/validate")
async def validate_manifest(req: ManifestRequest):
    """Validate a manifest without starting a session (dry run).
    Calls the validation logic directly, bypassing the ADK tool decorator.
    """
    import json as _json

    manifest_json = req.manifest_json
    errors = []

    try:
        manifest = _json.loads(manifest_json)
    except _json.JSONDecodeError as e:
        return {"validation_errors": [f"Invalid JSON: {e}"], "parsed_manifest": None}

    version = manifest.get("manifest_version")
    if version != "1.1":
        errors.append(f"Unrecognised manifest version {version}. Expected 1.1.")

    refs = manifest.get("reference_images", [])
    jobs = manifest.get("jobs", [])
    text_items = manifest.get("text_items", [])

    if len(refs) != manifest.get("total_reference_images", -1):
        errors.append("Manifest written incompletely — reference image count mismatch.")
    if len(jobs) != manifest.get("total_jobs", -1):
        errors.append("Manifest written incompletely — job count mismatch.")
    if len(text_items) != manifest.get("total_text_items", -1):
        errors.append("Manifest written incompletely — text item count mismatch.")

    has_brief = "brief_id" in manifest
    has_run = "pipeline_run_id" in manifest
    if has_brief and has_run:
        errors.append("Cannot determine pipeline path — both identifiers present.")
    elif not has_brief and not has_run:
        errors.append("Cannot determine pipeline path — run identifier missing.")

    run_id = manifest.get("brief_id") or manifest.get("pipeline_run_id", "unknown")
    pipeline_path = "path_1" if has_brief else "path_2"

    return {
        "validation_errors": errors,
        "run_id": run_id,
        "pipeline_path": pipeline_path,
        "manifest_version": version or "unknown",
    }


@app.post("/api/refs/generate")
async def generate_refs(req: GenerateRefRequest):
    """Trigger reference image generation for a single ref or all pending."""
    if req.ref_id:
        message = (
            f"Generate the reference image with ref_id '{req.ref_id}'. "
            f"Look up this ref_id in parsed_manifest.reference_images from session state, "
            f"then call generate_reference_image with its fields. "
            f"Do NOT delegate to sub-agents — call the tool directly."
        )
    else:
        message = "Generate all pending reference images by delegating to execution_phase."

    return await _run_agent(req.session_id, message)


@app.post("/api/jobs/generate")
async def generate_job(req: GenerateJobRequest):
    """Trigger generation for a single job."""
    message = (
        f"Generate the job with job_id '{req.job_id}'. "
        f"Look up this job_id in parsed_manifest.jobs from session state, "
        f"then call generate_image (for images) or generate_video (for videos) with its fields. "
        f"Do NOT delegate to sub-agents — call the tool directly."
    )
    return await _run_agent(req.session_id, message)


@app.get("/api/status/{session_id}")
async def get_status(session_id: str):
    """Get current session state including ref_status and job_status."""
    async with httpx.AsyncClient(timeout=ADK_TIMEOUT, base_url="http://localhost:8080") as client:
        resp = await client.get(
            f"/adk/apps/{APP_NAME}/users/{USER_ID}/sessions/{session_id}",
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Failed to get session: {resp.text}",
            )
        session = resp.json()
        state = session.get("state", {})
        return {
            "ref_status": state.get("ref_status", {}),
            "job_status": state.get("job_status", {}),
            "validation_errors": state.get("validation_errors", []),
            "execution_summary": state.get("execution_summary"),
            "run_id": state.get("run_id"),
            "pipeline_path": state.get("pipeline_path"),
        }


@app.post("/api/run/stream")
async def run_stream(req: RunStreamRequest):
    """SSE stream for generation progress."""
    payload = {
        "appName": APP_NAME,
        "userId": USER_ID,
        "sessionId": req.session_id,
        "newMessage": {
            "role": "user",
            "parts": [{"text": req.message}],
        },
    }

    async def event_generator():
        async with httpx.AsyncClient(timeout=ADK_TIMEOUT, base_url="http://localhost:8080") as client:
            async with client.stream("POST", "/adk/run_sse", json=payload) as response:
                async for line in response.aiter_lines():
                    yield line + "\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


async def _run_agent(session_id: str, message: str) -> dict:
    """Send a message to the ADK agent and return the response."""
    async with httpx.AsyncClient(timeout=ADK_TIMEOUT, base_url="http://localhost:8080") as client:
        resp = await client.post(
            "/adk/run",
            json={
                "appName": APP_NAME,
                "userId": USER_ID,
                "sessionId": session_id,
                "newMessage": {
                    "role": "user",
                    "parts": [{"text": message}],
                },
            },
        )
        if resp.status_code != 200:
            raise HTTPException(
                status_code=resp.status_code,
                detail=f"Agent run failed: {resp.text}",
            )
        return resp.json()


# ---------------------------------------------------------------------------
# Asset proxy — serve generated images/videos from GCS
# ---------------------------------------------------------------------------

_gcs_client = None


def _get_gcs():
    global _gcs_client
    if _gcs_client is None:
        _gcs_client = gcs.Client(project=GCP_PROJECT)
    return _gcs_client


@app.get("/api/asset/{path:path}")
async def get_asset(path: str):
    """Proxy to GCS for image/video preview. Returns the raw binary."""
    try:
        client = _get_gcs()
        bucket = client.bucket(GCS_BUCKET)
        blob = bucket.blob(path)

        if not blob.exists():
            raise HTTPException(status_code=404, detail="Asset not found")

        data = blob.download_as_bytes()
        content_type = blob.content_type or "application/octet-stream"

        return Response(
            content=data,
            media_type=content_type,
            headers={
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*",
            },
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch asset: {e}")


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------


@app.get("/health")
async def health():
    return {"status": "ok", "service": "creative-generator-v2"}
