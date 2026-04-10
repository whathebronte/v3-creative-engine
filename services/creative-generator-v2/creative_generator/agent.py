"""
Creative Generator V2 - ADK Agent Graph
=========================================

Defines the agent pipeline for manifest-driven creative generation:
  root_agent → manifest_loader → execution_phase (sequential)
                                   ├── reference_executor
                                   ├── job_executor
                                   └── report_writer

Run locally:
    cd services/creative-generator-v2
    adk web

Or via the FastAPI server:
    uvicorn server.app:app --host 0.0.0.0 --port 8080
"""

from pathlib import Path
from google.adk.agents import LlmAgent, SequentialAgent

from creative_generator.tools import (
    load_and_validate_manifest,
    generate_reference_image,
    generate_image,
    generate_video,
    write_execution_report,
    write_updated_manifest,
)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

# Use Flash for orchestration (cost-effective). Generation models are
# specified in the manifest and passed through to tools unchanged.
MODEL = "gemini-2.5-flash"

BASE_DIR = Path(__file__).parent
PROMPTS_DIR = BASE_DIR / "prompts"


def _load_prompt(filename: str) -> str:
    """Load a prompt file from the prompts directory."""
    return (PROMPTS_DIR / filename).read_text()


# ---------------------------------------------------------------------------
# Specialist Agents
# ---------------------------------------------------------------------------

manifest_loader = LlmAgent(
    name="manifest_loader",
    model=MODEL,
    instruction=_load_prompt("manifest_loader.md"),
    tools=[load_and_validate_manifest],
    output_key="manifest_load_result",
)

reference_executor = LlmAgent(
    name="reference_executor",
    model=MODEL,
    instruction=_load_prompt("reference_executor.md"),
    tools=[generate_reference_image],
    output_key="ref_execution_result",
)

job_executor = LlmAgent(
    name="job_executor",
    model=MODEL,
    instruction=_load_prompt("job_executor.md"),
    tools=[generate_image, generate_video],
    output_key="job_execution_result",
)

report_writer = LlmAgent(
    name="report_writer",
    model=MODEL,
    instruction=_load_prompt("report_writer.md"),
    tools=[write_execution_report, write_updated_manifest],
    output_key="report_result",
)

# ---------------------------------------------------------------------------
# Execution Phase — sequential: refs first, then jobs, then report
# ---------------------------------------------------------------------------

execution_phase = SequentialAgent(
    name="execution_phase",
    sub_agents=[reference_executor, job_executor, report_writer],
)

# ---------------------------------------------------------------------------
# Root Agent — orchestrates the full pipeline
# ---------------------------------------------------------------------------

root_agent = LlmAgent(
    name="creative_generator",
    model=MODEL,
    instruction=_load_prompt("root_agent.md"),
    tools=[generate_reference_image, generate_image, generate_video],
    sub_agents=[manifest_loader, execution_phase],
    output_key="pipeline_result",
)
