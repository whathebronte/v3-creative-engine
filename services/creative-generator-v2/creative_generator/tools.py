"""
Creative Generator V2 - ADK Tool Functions
============================================

Each tool wraps an external system interaction (Vertex AI, GCS).
Retry policy: 3 attempts, exponential backoff (2s, 4s, 8s).

Authentication: Uses Application Default Credentials (ADC) via
google.auth for Vertex AI and GCS. On Cloud Run, this is the
service account. Locally, use `gcloud auth application-default login`.
"""

import base64
import json
import logging
import os
import time
from datetime import datetime, timezone

import google.auth
import google.auth.transport.requests
from google.cloud import storage as gcs

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

GCS_BUCKET = os.environ.get("GCS_BUCKET", "v3-creative-engine.firebasestorage.app")
GCP_PROJECT = os.environ.get("GCP_PROJECT_ID", "v3-creative-engine")
VERTEX_LOCATION = os.environ.get("VERTEX_AI_LOCATION", "us-central1")

RECOGNISED_MODELS = {"gemini-3-pro-image-preview", "veo-3.1-generate-preview"}

# Map manifest model identifiers to actual Vertex AI model endpoints
MODEL_MAP = {
    "gemini-3-pro-image-preview": "imagen-3.0-generate-001",
    "veo-3.1-generate-preview": "veo-3.1-generate-preview",
}

# Video polling config
VIDEO_POLL_INTERVAL = 10  # seconds between polls
VIDEO_POLL_MAX_WAIT = 300  # max seconds to wait for video completion

# ---------------------------------------------------------------------------
# Auth helper
# ---------------------------------------------------------------------------

_credentials = None
_auth_request = None


def _get_access_token() -> str:
    """Get a fresh OAuth access token using Application Default Credentials."""
    global _credentials, _auth_request
    if _credentials is None:
        _credentials, _ = google.auth.default(
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        _auth_request = google.auth.transport.requests.Request()
    _credentials.refresh(_auth_request)
    return _credentials.token


# ---------------------------------------------------------------------------
# Vertex AI helpers
# ---------------------------------------------------------------------------

def _vertex_predict(model_id: str, payload: dict) -> dict:
    """Call Vertex AI predict endpoint and return the response JSON."""
    import httpx

    url = (
        f"https://{VERTEX_LOCATION}-aiplatform.googleapis.com/v1/"
        f"projects/{GCP_PROJECT}/locations/{VERTEX_LOCATION}/"
        f"publishers/google/models/{model_id}:predict"
    )
    token = _get_access_token()
    resp = httpx.post(
        url,
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        timeout=120.0,
    )
    resp.raise_for_status()
    return resp.json()


def _vertex_predict_long_running(model_id: str, payload: dict) -> dict:
    """Call Vertex AI predictLongRunning endpoint for async operations (video)."""
    import httpx

    url = (
        f"https://{VERTEX_LOCATION}-aiplatform.googleapis.com/v1/"
        f"projects/{GCP_PROJECT}/locations/{VERTEX_LOCATION}/"
        f"publishers/google/models/{model_id}:predictLongRunning"
    )
    token = _get_access_token()
    resp = httpx.post(
        url,
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        timeout=120.0,
    )
    resp.raise_for_status()
    return resp.json()


def _poll_operation(operation_name: str) -> dict:
    """Poll a long-running operation until done or timeout."""
    import httpx

    url = f"https://{VERTEX_LOCATION}-aiplatform.googleapis.com/v1/{operation_name}"
    elapsed = 0

    while elapsed < VIDEO_POLL_MAX_WAIT:
        token = _get_access_token()
        resp = httpx.get(
            url,
            headers={"Authorization": f"Bearer {token}"},
            timeout=30.0,
        )
        resp.raise_for_status()
        data = resp.json()

        if data.get("done"):
            return data

        time.sleep(VIDEO_POLL_INTERVAL)
        elapsed += VIDEO_POLL_INTERVAL

    raise TimeoutError(f"Video operation timed out after {VIDEO_POLL_MAX_WAIT}s: {operation_name}")


# ---------------------------------------------------------------------------
# GCS helpers
# ---------------------------------------------------------------------------

_gcs_client = None


def _get_gcs_client():
    global _gcs_client
    if _gcs_client is None:
        _gcs_client = gcs.Client(project=GCP_PROJECT)
    return _gcs_client


def _upload_to_gcs(data: bytes, gcs_path: str, content_type: str) -> str:
    """Upload bytes to GCS and return the public URL."""
    client = _get_gcs_client()
    bucket = client.bucket(GCS_BUCKET)
    blob = bucket.blob(gcs_path)
    blob.upload_from_string(data, content_type=content_type)
    blob.make_public()
    return f"https://storage.googleapis.com/{GCS_BUCKET}/{gcs_path}"


# ---------------------------------------------------------------------------
# Retry helper
# ---------------------------------------------------------------------------

def _retry(fn, max_attempts=3, backoff_base=2):
    """Execute fn with exponential backoff. Returns (success, result_or_error)."""
    last_error = None
    for attempt in range(max_attempts):
        try:
            result = fn()
            return True, result
        except Exception as e:
            last_error = e
            logger.warning(f"Attempt {attempt + 1}/{max_attempts} failed: {e}")
            if attempt < max_attempts - 1:
                wait = backoff_base ** (attempt + 1)
                time.sleep(wait)
    return False, str(last_error)


# ---------------------------------------------------------------------------
# Tool: load_and_validate_manifest
# ---------------------------------------------------------------------------

def load_and_validate_manifest(manifest_json: str, tool_context) -> dict:
    """Validate a generation manifest JSON string against the pre-execution
    checklist. Writes parsed manifest and status tracking to session state.
    If validation_errors is non-empty, the pipeline must halt.

    Args:
        manifest_json: The raw JSON string of the generation_manifest.json
    """
    errors = []

    try:
        manifest = json.loads(manifest_json)
    except json.JSONDecodeError as e:
        tool_context.state["validation_errors"] = [f"Invalid JSON: {e}"]
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

    bad_text_items = [
        t.get("element_id", t.get("id", "?"))
        for t in text_items
        if not t.get("fits_limit", False)
    ]
    if bad_text_items:
        errors.append(
            f"Pipeline quality check incomplete. Affected text items: {', '.join(bad_text_items)}"
        )

    all_models = set()
    for ref in refs:
        all_models.add(ref.get("model"))
    for job in jobs:
        all_models.add(job.get("model"))
    unknown = all_models - RECOGNISED_MODELS - {None}
    if unknown:
        errors.append(f"Unrecognised model identifiers: {', '.join(sorted(unknown))}")

    has_brief = "brief_id" in manifest
    has_run = "pipeline_run_id" in manifest
    if has_brief and has_run:
        errors.append("Cannot determine pipeline path — both brief_id and pipeline_run_id present.")
    elif not has_brief and not has_run:
        errors.append("Cannot determine pipeline path — run identifier missing or ambiguous.")

    if has_brief:
        run_id = manifest["brief_id"]
        pipeline_path = "path_1"
    else:
        run_id = manifest.get("pipeline_run_id", "unknown")
        pipeline_path = "path_2"

    ref_status = {ref["ref_id"]: {"status": "pending", "gcs_uri": None} for ref in refs}
    job_status = {job["job_id"]: {"status": "pending", "gcs_uri": None} for job in jobs}

    # Persist to session state for the status API
    tool_context.state["schema_version"] = "1.0"
    tool_context.state["run_id"] = run_id
    tool_context.state["pipeline_path"] = pipeline_path
    tool_context.state["manifest_version"] = version or "unknown"
    tool_context.state["parsed_manifest"] = manifest
    tool_context.state["ref_status"] = ref_status
    tool_context.state["job_status"] = job_status
    tool_context.state["validation_errors"] = errors

    return {
        "run_id": run_id,
        "pipeline_path": pipeline_path,
        "validation_errors": errors,
        "ref_count": len(refs),
        "job_count": len(jobs),
    }


# ---------------------------------------------------------------------------
# Tool: generate_reference_image
# ---------------------------------------------------------------------------

def generate_reference_image(
    ref_id: str,
    prompt: str,
    negative_prompt: str,
    model: str,
    resolution: str,
    output_path: str,
    gcs_root: str,
    tool_context,
) -> dict:
    """Generate a single reference image using the Vertex AI Imagen API.
    Retries up to 3 times with exponential backoff. Updates ref_status in session state.

    Args:
        ref_id: The reference image identifier
        prompt: The generation prompt (do not modify)
        negative_prompt: The negative prompt (do not modify)
        model: The model identifier from the manifest
        resolution: The target resolution (e.g. '1024x1024')
        output_path: Relative path for GCS output
        gcs_root: The GCS root path for this run
    """
    vertex_model = MODEL_MAP.get(model, model)
    gcs_path = f"{gcs_root}{output_path}"

    # Parse resolution to determine aspect ratio (refs are typically square)
    aspect_ratio = "1:1"
    if resolution:
        parts = resolution.split("x")
        if len(parts) == 2:
            w, h = int(parts[0]), int(parts[1])
            if w > h:
                aspect_ratio = "16:9"
            elif h > w:
                aspect_ratio = "9:16"

    def _generate():
        # Build the full prompt with negative prompt
        full_prompt = prompt
        if negative_prompt:
            full_prompt = f"{prompt}. Avoid: {negative_prompt}"

        payload = {
            "instances": [{"prompt": full_prompt}],
            "parameters": {
                "sampleCount": 1,
                "aspectRatio": aspect_ratio,
                "safetyFilterLevel": "block_some",
                "personGeneration": "allow_adult",
            },
        }

        response = _vertex_predict(vertex_model, payload)
        predictions = response.get("predictions", [])
        if not predictions:
            raise ValueError("No predictions returned from Imagen API")

        image_b64 = predictions[0].get("bytesBase64Encoded")
        if not image_b64:
            raise ValueError("No image data in prediction response")

        image_bytes = base64.b64decode(image_b64)
        public_url = _upload_to_gcs(image_bytes, gcs_path, "image/png")
        return public_url

    # Mark as running in session state
    ref_status = dict(tool_context.state.get("ref_status", {}))
    ref_status[ref_id] = {"status": "running", "gcs_uri": None}
    tool_context.state["ref_status"] = ref_status

    success, result = _retry(_generate)

    # Update session state with final status
    ref_status = dict(tool_context.state.get("ref_status", {}))
    if success:
        logger.info(f"Reference image generated: {ref_id} -> {result}")
        ref_status[ref_id] = {"status": "complete", "gcs_uri": result}
        tool_context.state["ref_status"] = ref_status
        return {"status": "complete", "gcs_uri": result, "ref_id": ref_id}
    else:
        logger.error(f"Reference image failed: {ref_id} -> {result}")
        ref_status[ref_id] = {"status": "failed", "gcs_uri": None, "error": result}
        tool_context.state["ref_status"] = ref_status
        return {"status": "failed", "gcs_uri": None, "ref_id": ref_id, "error": result}


# ---------------------------------------------------------------------------
# Tool: generate_image
# ---------------------------------------------------------------------------

def generate_image(
    job_id: str,
    prompt: str,
    negative_prompt: str,
    model: str,
    aspect_ratio: str,
    output_path: str,
    gcs_root: str,
    tool_context,
    ref_image_uris: str = "",
) -> dict:
    """Generate a single scene image using the Vertex AI Imagen API.
    Retries up to 3 times with exponential backoff. Updates job_status in session state.

    Args:
        job_id: The job identifier
        prompt: The generation prompt (do not modify)
        negative_prompt: The negative prompt (do not modify)
        model: The model identifier from the manifest
        aspect_ratio: Target aspect ratio (e.g. '9:16')
        output_path: Relative path for GCS output
        gcs_root: The GCS root path for this run
        ref_image_uris: Comma-separated GCS URIs of reference images
    """
    vertex_model = MODEL_MAP.get(model, model)
    gcs_path = f"{gcs_root}{output_path}"

    def _generate():
        full_prompt = prompt
        if negative_prompt:
            full_prompt = f"{prompt}. Avoid: {negative_prompt}"

        instance = {"prompt": full_prompt}

        # If reference images are provided, download and include them
        if ref_image_uris:
            ref_uris = [u.strip() for u in ref_image_uris.split(",") if u.strip()]
            ref_images = []
            for uri in ref_uris:
                ref_data = _download_gcs_blob(uri)
                if ref_data:
                    ref_images.append({
                        "referenceType": 1,  # SUBJECT reference
                        "referenceImage": {
                            "bytesBase64Encoded": base64.b64encode(ref_data).decode("ascii"),
                        },
                    })
            if ref_images:
                instance["referenceImages"] = ref_images
                # Use capability model for reference-based generation
                nonlocal vertex_model
                vertex_model = "imagen-3.0-capability-001"

        payload = {
            "instances": [instance],
            "parameters": {
                "sampleCount": 1,
                "aspectRatio": aspect_ratio or "9:16",
                "safetyFilterLevel": "block_some",
                "personGeneration": "allow_adult",
            },
        }

        response = _vertex_predict(vertex_model, payload)
        predictions = response.get("predictions", [])
        if not predictions:
            raise ValueError("No predictions returned from Imagen API")

        image_b64 = predictions[0].get("bytesBase64Encoded")
        if not image_b64:
            raise ValueError("No image data in prediction response")

        image_bytes = base64.b64decode(image_b64)
        public_url = _upload_to_gcs(image_bytes, gcs_path, "image/png")
        return public_url

    # Mark as running
    job_status = dict(tool_context.state.get("job_status", {}))
    job_status[job_id] = {"status": "running", "gcs_uri": None}
    tool_context.state["job_status"] = job_status

    success, result = _retry(_generate)

    # Update session state
    job_status = dict(tool_context.state.get("job_status", {}))
    if success:
        logger.info(f"Image generated: {job_id} -> {result}")
        job_status[job_id] = {"status": "complete", "gcs_uri": result}
        tool_context.state["job_status"] = job_status
        return {"status": "complete", "gcs_uri": result, "job_id": job_id}
    else:
        logger.error(f"Image generation failed: {job_id} -> {result}")
        job_status[job_id] = {"status": "failed", "gcs_uri": None, "error": result}
        tool_context.state["job_status"] = job_status
        return {"status": "failed", "gcs_uri": None, "job_id": job_id, "error": result}


# ---------------------------------------------------------------------------
# Tool: generate_video
# ---------------------------------------------------------------------------

def generate_video(
    job_id: str,
    prompt: str,
    negative_prompt: str,
    model: str,
    aspect_ratio: str,
    duration_seconds: int,
    output_path: str,
    gcs_root: str,
    tool_context,
) -> dict:
    """Generate a single video using the Vertex AI Veo API.
    Submits a long-running operation and polls for completion.
    Retries up to 3 times with exponential backoff. Updates job_status in session state.

    Args:
        job_id: The job identifier
        prompt: The generation prompt (do not modify)
        negative_prompt: The negative prompt (do not modify)
        model: The model identifier from the manifest
        aspect_ratio: Target aspect ratio (e.g. '9:16')
        duration_seconds: Video duration in seconds
        output_path: Relative path for GCS output
        gcs_root: The GCS root path for this run
    """
    vertex_model = MODEL_MAP.get(model, model)
    gcs_path = f"{gcs_root}{output_path}"

    def _generate():
        full_prompt = prompt
        if negative_prompt:
            full_prompt = f"{prompt}. Avoid: {negative_prompt}"

        payload = {
            "instances": [{"prompt": full_prompt}],
            "parameters": {
                "aspectRatio": aspect_ratio or "9:16",
                "videoDuration": f"{duration_seconds}s",
            },
        }

        # Submit long-running operation
        op_response = _vertex_predict_long_running(vertex_model, payload)
        operation_name = op_response.get("name")
        if not operation_name:
            raise ValueError(f"No operation name in Veo response: {op_response}")

        logger.info(f"Video operation started: {job_id} -> {operation_name}")

        # Poll until complete
        result = _poll_operation(operation_name)

        # Check for errors
        error = result.get("error")
        if error:
            raise ValueError(f"Video generation error: {error}")

        # Extract video data
        response = result.get("response", {})
        predictions = response.get("predictions", [])
        if not predictions:
            raise ValueError("No predictions in completed video operation")

        video_b64 = predictions[0].get("bytesBase64Encoded")
        if not video_b64:
            raise ValueError("No video data in prediction response")

        video_bytes = base64.b64decode(video_b64)
        public_url = _upload_to_gcs(video_bytes, gcs_path, "video/mp4")
        return public_url

    # Mark as running
    job_status = dict(tool_context.state.get("job_status", {}))
    job_status[job_id] = {"status": "running", "gcs_uri": None}
    tool_context.state["job_status"] = job_status

    success, result = _retry(_generate)

    # Update session state
    job_status = dict(tool_context.state.get("job_status", {}))
    if success:
        logger.info(f"Video generated: {job_id} -> {result}")
        job_status[job_id] = {"status": "complete", "gcs_uri": result}
        tool_context.state["job_status"] = job_status
        return {"status": "complete", "gcs_uri": result, "job_id": job_id}
    else:
        logger.error(f"Video generation failed: {job_id} -> {result}")
        job_status[job_id] = {"status": "failed", "gcs_uri": None, "error": result}
        tool_context.state["job_status"] = job_status
        return {"status": "failed", "gcs_uri": None, "job_id": job_id, "error": result}


# ---------------------------------------------------------------------------
# Tool: write_execution_report
# ---------------------------------------------------------------------------

def write_execution_report(
    run_id: str,
    pipeline_path: str,
    manifest_version: str,
    started_at: str,
    ref_summary: str,
    job_summary: str,
    text_summary: str,
    failures_json: str,
    blocked_json: str,
    gcs_root: str,
) -> dict:
    """Write the execution_report.json to the GCS run folder.

    Args:
        run_id: The run identifier
        pipeline_path: 'path_1' or 'path_2'
        manifest_version: The manifest version
        started_at: ISO timestamp when the run started
        ref_summary: JSON string of {total, complete, failed}
        job_summary: JSON string of {total, complete, failed, blocked}
        text_summary: JSON string of {total, surfaced}
        failures_json: JSON array of failure details
        blocked_json: JSON array of blocked job details
        gcs_root: The GCS root path for this run

    Returns:
        Dict with status and gcs_uri of the report
    """
    report = {
        "report_version": "1.0",
        "run_id": run_id,
        "pipeline_path": pipeline_path,
        "manifest_version": manifest_version,
        "started_at": started_at,
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "reference_images": json.loads(ref_summary),
        "jobs": json.loads(job_summary),
        "text_items": json.loads(text_summary),
        "failures": json.loads(failures_json),
        "blocked_jobs": json.loads(blocked_json),
    }

    gcs_path = f"{gcs_root}execution_report.json"

    try:
        report_bytes = json.dumps(report, indent=2).encode("utf-8")
        public_url = _upload_to_gcs(report_bytes, gcs_path, "application/json")
        logger.info(f"Execution report written: {public_url}")
        return {"status": "complete", "gcs_uri": public_url}
    except Exception as e:
        logger.error(f"Failed to write execution report: {e}")
        return {"status": "failed", "gcs_uri": None, "error": str(e)}


# ---------------------------------------------------------------------------
# Tool: write_updated_manifest
# ---------------------------------------------------------------------------

def write_updated_manifest(
    manifest_json: str,
    gcs_root: str,
) -> dict:
    """Write an updated copy of the generation manifest with final statuses
    to the GCS run folder. Does NOT overwrite the original pipeline output.

    Args:
        manifest_json: The updated manifest as a JSON string
        gcs_root: The GCS root path for this run

    Returns:
        Dict with status and gcs_uri of the updated manifest
    """
    gcs_path = f"{gcs_root}generation_manifest.json"

    try:
        public_url = _upload_to_gcs(
            manifest_json.encode("utf-8"), gcs_path, "application/json"
        )
        logger.info(f"Updated manifest written: {public_url}")
        return {"status": "complete", "gcs_uri": public_url}
    except Exception as e:
        logger.error(f"Failed to write updated manifest: {e}")
        return {"status": "failed", "gcs_uri": None, "error": str(e)}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _download_gcs_blob(uri: str) -> bytes | None:
    """Download a blob from GCS given a public URL or gs:// URI."""
    try:
        if uri.startswith("gs://"):
            # gs://bucket/path
            parts = uri.replace("gs://", "").split("/", 1)
            bucket_name, blob_path = parts[0], parts[1]
        elif uri.startswith("https://storage.googleapis.com/"):
            # https://storage.googleapis.com/bucket/path
            remainder = uri.replace("https://storage.googleapis.com/", "")
            bucket_name, blob_path = remainder.split("/", 1)
        else:
            logger.warning(f"Unrecognised URI format: {uri}")
            return None

        client = _get_gcs_client()
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(blob_path)
        return blob.download_as_bytes()
    except Exception as e:
        logger.warning(f"Failed to download GCS blob {uri}: {e}")
        return None
