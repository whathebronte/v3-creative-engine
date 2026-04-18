"""
Creative Collective - ADK Agent Graph
======================================

Defines all 14 agents, wires them into phases, sets up auto-save
callbacks, artifact tools, and the root agent routing layer.

Agent types at a glance:
  - Specialists: output JSON via output_key + JSON mode. Silent.
  - Presenters: output formatted text to the user. No output_key.
  - Root agent: routes user intent to pipeline phases. Has tools.

Run:
    cd agent-collective
    adk web
"""

import hashlib
import json
import os
import re
from datetime import datetime
from pathlib import Path

from google.adk.agents import LlmAgent, SequentialAgent, LoopAgent, ParallelAgent
from google.genai import types


# =========================================================================
# Configuration
# =========================================================================

# Both set to Flash for cost-effective testing (~$0.15/run).
# Change MODEL_PRO to "gemini-2.5-pro" for production quality.
MODEL_FLASH = "gemini-2.5-flash"
MODEL_PRO = "gemini-2.5-flash"

# Paths (relative to this file)
BASE_DIR = Path(__file__).parent
PROMPTS_DIR = BASE_DIR / "prompts"
KB_DIR = BASE_DIR / "kb"
OUTPUT_DIR = BASE_DIR / "outputs"

# Market selection.
# Set the MARKET environment variable to the two-letter market code before
# starting the server (e.g. MARKET=kr adk web).
# Valid values: kr, in, jp, id
# Defaults to "kr" if not set.
MARKET = os.environ.get("MARKET", "kr").lower().strip()

# Market-scoped output directory: outputs/{market}/
# All run folders and latest_* files live here so multiple markets
# never share the same folder.
MARKET_OUTPUT_DIR = OUTPUT_DIR / MARKET

# KB cache directory: outputs/kb_cache/
KB_CACHE_DIR = OUTPUT_DIR / "kb_cache"


def _get_kb_dirs(market: str) -> list[Path]:
    """Return the ordered list of KB folders for a given market.

    Global documents are loaded first; market-specific documents are loaded
    second so they take priority when the kb_analyzer sees naming conflicts.
    Only folders that actually exist are returned.
    """
    candidates = [KB_DIR / "global", KB_DIR / market]
    return [p for p in candidates if p.exists()]


def _get_kb_cache_file(market: str) -> Path:
    """Return the path to the KB cache file for a given market."""
    return KB_CACHE_DIR / f"kb_cache_{market}.json"


# =========================================================================
# Prompt loading
# =========================================================================

def _load_prompt(filename: str) -> str:
    """Read a prompt markdown file from the prompts/ folder."""
    return (PROMPTS_DIR / filename).read_text(encoding="utf-8")


def _load_kb_documents(market: str) -> str:
    """Read all files from kb/global/ and kb/{market}/ and format them as a
    block that gets appended to the kb_analyzer's instruction.

    Global documents are loaded first; market-specific documents follow so the
    agent understands that market-specific files take priority. Each file is
    wrapped with BEGIN/END markers so the agent knows where one document ends
    and the next begins.
    """
    kb_dirs = _get_kb_dirs(market)
    if not kb_dirs:
        return "\n\n--- NO KB DOCUMENTS FOUND ---\n"

    docs = []
    for folder in kb_dirs:
        for f in sorted(folder.iterdir()):
            if f.is_file():
                content = f.read_text(encoding="utf-8")
                docs.append(
                    f"--- BEGIN {f.name} ---\n{content}\n--- END {f.name} ---"
                )

    if not docs:
        return "\n\n--- NO KB DOCUMENTS FOUND ---\n"

    return "\n\n--- KNOWLEDGE BASE DOCUMENTS ---\n\n" + "\n\n".join(docs)


# =========================================================================
# Run folder management
# =========================================================================

# Tracks the current run's output folder for this server process.
# Reset this to None if you want a new folder per invocation.
_current_run_dir: Path | None = None


def _get_run_dir() -> Path:
    """Get or create the output folder for this pipeline run.

    Folders are named: outputs/run_YYYY-MM-DD_NNN/
    where NNN is a sequential number per day.
    """
    global _current_run_dir
    if _current_run_dir is not None:
        return _current_run_dir

    today = datetime.now().strftime("%Y-%m-%d")
    MARKET_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    existing = sorted(MARKET_OUTPUT_DIR.glob(f"run_{today}_*"))
    next_num = len(existing) + 1
    _current_run_dir = MARKET_OUTPUT_DIR / f"run_{today}_{next_num:03d}"
    _current_run_dir.mkdir(parents=True, exist_ok=True)
    return _current_run_dir


def _reset_run_dir():
    """Reset so the next pipeline run creates a fresh folder."""
    global _current_run_dir
    _current_run_dir = None


def _parse_state_value(value):
    """Safely parse a state value that might be a JSON string or dict."""
    if value is None:
        return None
    if isinstance(value, dict) or isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, ValueError):
            return value
    return value


# =========================================================================
# KB output caching
# =========================================================================
# Avoids re-running the kb_analyzer LLM when nothing relevant has changed.
# The cache lives at outputs/kb_cache.json and stores the last-known
# fingerprint alongside the kb_insights JSON.
#
# The fingerprint is a SHA-256 hash of:
#   - the model name used by kb_analyzer
#   - the name + full content of every file in kb/
#
# Any line change inside a KB file, file addition/deletion, or model
# upgrade will produce a different fingerprint and trigger a fresh run.


def _compute_kb_fingerprint(model: str, market: str) -> str:
    """Hash KB file contents (global + market) and the model name into a
    single fingerprint. Any change to either folder invalidates the cache.
    """
    hasher = hashlib.sha256()
    hasher.update(model.encode("utf-8"))
    for folder in _get_kb_dirs(market):
        for f in sorted(folder.iterdir()):
            if f.is_file():
                hasher.update(f.name.encode("utf-8"))
                hasher.update(f.read_bytes())
    return hasher.hexdigest()


def _load_kb_cache(market: str) -> tuple[str, dict] | None:
    """Load the cached KB insights for a given market if the cache file exists
    and is valid.

    Returns (fingerprint, insights) or None if the cache is missing,
    corrupt, or incomplete.
    """
    cache_file = _get_kb_cache_file(market)
    if not cache_file.exists():
        return None
    try:
        with open(cache_file, encoding="utf-8") as f:
            cache = json.load(f)
        fingerprint = cache.get("fingerprint")
        insights = cache.get("kb_insights")
        if fingerprint and insights:
            # Normalise: if insights was saved as a JSON string instead of
            # a dict, parse it now so the before_callback never receives a
            # string and accidentally double-encodes it with json.dumps.
            if isinstance(insights, str):
                try:
                    insights = json.loads(insights)
                except (json.JSONDecodeError, ValueError):
                    return None  # corrupt entry - force a fresh LLM run
            return fingerprint, insights
    except (json.JSONDecodeError, KeyError, OSError):
        pass
    return None


def _save_kb_cache(market: str, fingerprint: str, kb_insights: dict):
    """Write the KB insights and their fingerprint to the market-scoped cache
    file.

    Only writes if kb_insights is a dict. If the LLM output could not be
    parsed to a dict (e.g. it arrived as a raw string), we skip the write
    so the cache file never contains a JSON string where an object is
    expected.
    """
    if not isinstance(kb_insights, dict):
        return
    KB_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = _get_kb_cache_file(market)
    with open(cache_file, "w", encoding="utf-8") as f:
        json.dump(
            {"fingerprint": fingerprint, "kb_insights": kb_insights},
            f, indent=2, ensure_ascii=False,
        )


def _make_dynamic_kb_instruction(base_prompt: str):
    """Return a callable instruction that loads kb documents for the market
    stored in session state at runtime.

    ADK calls this before each agent invocation, so the correct market's
    knowledge base is always loaded regardless of the startup MARKET value.
    Falls back to the module-level MARKET if state has no "market" key.
    """
    def instruction_fn(ctx) -> str:
        session_market = ctx.state.get("market", MARKET)
        return base_prompt + _load_kb_documents(session_market)
    return instruction_fn


_MARKET_CONFIG = {
    "kr": {"name": "Korea", "language": "Korean"},
    "in": {"name": "India", "language": "English"},
    "jp": {"name": "Japan", "language": "Japanese"},
    "id": {"name": "Indonesia", "language": "Indonesian"},
}


def _make_dynamic_audience_mapper_instruction(base_prompt: str):
    """Return a callable instruction that injects market-specific audience
    segments at runtime so the agent produces market-aware profiles.

    ADK calls this before each agent invocation. The market is read from
    session state (same key used by kb_analyzer). Falls back to the
    module-level MARKET if state has no "market" key.
    """
    def instruction_fn(ctx) -> str:
        session_market = ctx.state.get("market", MARKET)
        config = _MARKET_CONFIG.get(
            session_market,
            {"name": session_market.upper(), "language": "English"},
        )
        market_name = config["name"]
        language = config["language"]

        segments_section = (
            f"### **Segments for this run:**\n\n"
            f"1. {market_name}, Female, 18-24, language: {language}\n"
            f"2. {market_name}, Female, 25-34, language: {language}\n"
            f"3. {market_name}, Male, 18-24, language: {language}\n"
            f"4. {market_name}, Male, 25-34, language: {language}\n\n"
            f"These are market x demographic segments. Each segment includes a "
            f"market dimension, so you MUST include the \"Market and Cultural "
            f"Context\" adaptation driver for every profile. All copy and prompt "
            f"text should be in {language}.\n\n"
            f"  ### **Source asset origin:**\n\n"
            f"Source asset created for the US market, English language."
        )
        return base_prompt.replace("{{SEGMENTS_SECTION}}", segments_section)

    return instruction_fn


def _make_kb_cache_before_callback(agent_name: str, model: str):
    """Factory: before_agent_callback that short-circuits the LLM call
    when a valid cached result exists for the market stored in session state.

    Cache hit: writes kb_insights to the run folder, writes kb_insights
    to session state (output_key is skipped when the LLM is bypassed
    because ADK sets end_invocation=True), then returns the cached JSON
    as types.Content to populate the conversation history.

    Cache miss: stores the current fingerprint in state so the after
    callback can persist it, then returns None to let ADK proceed.
    """
    async def callback(callback_context) -> types.Content | None:
        session_market = callback_context.state.get("market", MARKET)

        # If KB files are absent (e.g. gitignored on a fresh clone), fall back
        # to the cached result directly without checking the fingerprint.
        # This lets collaborators run the pipeline against the committed cache
        # even when they have no local KB files.
        if not _get_kb_dirs(session_market):
            cached = _load_kb_cache(session_market)
            if cached is not None:
                _, cached_insights = cached
                run_dir = _get_run_dir()
                with open(run_dir / f"{agent_name}.json", "w", encoding="utf-8") as f:
                    json.dump(cached_insights, f, indent=2, ensure_ascii=False)
                callback_context.state["kb_insights"] = json.dumps(
                    cached_insights, ensure_ascii=False
                )
                return types.Content(
                    role="model",
                    parts=[types.Part(text=json.dumps(cached_insights, ensure_ascii=False))],
                )
            # No cache either - fall through and let the LLM run with no KB data
            return None

        fingerprint = _compute_kb_fingerprint(model, session_market)
        cached = _load_kb_cache(session_market)

        if cached is not None:
            cached_fingerprint, cached_insights = cached
            if cached_fingerprint == fingerprint:
                run_dir = _get_run_dir()
                with open(run_dir / f"{agent_name}.json", "w", encoding="utf-8") as f:
                    json.dump(cached_insights, f, indent=2, ensure_ascii=False)
                # output_key never fires on a cache hit because ADK sets
                # end_invocation=True, skipping _run_async_impl entirely.
                # Write kb_insights to state here so downstream agents and
                # the session export callback can read it normally.
                callback_context.state["kb_insights"] = json.dumps(
                    cached_insights, ensure_ascii=False
                )
                return types.Content(
                    role="model",
                    parts=[types.Part(text=json.dumps(cached_insights, ensure_ascii=False))],
                )

        # Cache miss - store fingerprint and market for the after callback
        callback_context.state["_kb_fingerprint_pending"] = fingerprint
        callback_context.state["_kb_market_pending"] = session_market
        return None

    return callback


def _make_kb_cache_after_callback(agent_name: str):
    """Factory: after_agent_callback that saves kb_insights to the run
    folder and updates the market-scoped cache when the LLM ran fresh.

    Skips cache update on a cache hit (fingerprint not present in state).
    """
    async def callback(callback_context):
        data = callback_context.state.get("kb_insights")
        if data is None:
            return

        run_dir = _get_run_dir()
        parsed = _parse_state_value(data)
        with open(run_dir / f"{agent_name}.json", "w", encoding="utf-8") as f:
            json.dump(parsed, f, indent=2, ensure_ascii=False)

        fingerprint = callback_context.state.get("_kb_fingerprint_pending")
        market = callback_context.state.get("_kb_market_pending")
        if fingerprint and market:
            _save_kb_cache(market, fingerprint, parsed)

    return callback


# =========================================================================
# Auto-save callbacks
# =========================================================================
# Every specialist agent gets an after_agent_callback that writes its
# output to the run folder. This is more reliable than LLM-driven save
# tools, and avoids the Gemini limitation where tools + JSON mode
# cannot coexist.


def _make_quality_check_callback(agent_name: str, state_key: str):
    """Factory: creates an after_agent_callback for a quality checker.

    Saves the result to disk (like auto-save) and also escalates
    out of the LoopAgent when the status is "pass", so the loop
    does not waste iterations re-checking work that already passed.
    """
    async def callback(callback_context):
        data = callback_context.state.get(state_key)
        if data is None:
            return

        # Auto-save the result
        run_dir = _get_run_dir()
        parsed = _parse_state_value(data)
        out_path = run_dir / f"{agent_name}.json"

        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(parsed, f, indent=2, ensure_ascii=False)

        # Escalate (exit loop) if quality check passed
        if isinstance(parsed, dict) and parsed.get("status") == "pass":
            callback_context.actions.escalate = True

    return callback


def _make_auto_save_callback(agent_name: str, state_key: str):
    """Factory: creates an after_agent_callback for a specialist agent.

    Reads the agent's output from session state and writes it to
    outputs/run_YYYY-MM-DD_NNN/agent_name.json
    """
    async def callback(callback_context):
        data = callback_context.state.get(state_key)
        if data is None:
            return

        run_dir = _get_run_dir()
        parsed = _parse_state_value(data)
        out_path = run_dir / f"{agent_name}.json"

        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(parsed, f, indent=2, ensure_ascii=False)

    return callback


def _make_latest_file_callback(state_key: str, filename: str):
    """Factory: creates a callback that writes a 'latest' copy of
    a state key to the outputs/ root for the demo UI to serve.

    This runs on presenter agents so the download always has the
    final (post-quality-check) version.
    """
    async def callback(callback_context):
        data = callback_context.state.get(state_key)
        if data is None:
            return

        MARKET_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        parsed = _parse_state_value(data)
        out_path = MARKET_OUTPUT_DIR / filename

        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(parsed, f, indent=2, ensure_ascii=False)

        # Also write into the run folder (without the "latest_" prefix)
        run_dir = _get_run_dir()
        run_filename = filename.replace("latest_", "")
        with open(run_dir / run_filename, "w", encoding="utf-8") as f:
            json.dump(parsed, f, indent=2, ensure_ascii=False)

    return callback


def _make_latest_brief_markdown_callback():
    """Callback for brief_presenter: writes the marketing brief as Markdown."""
    async def callback(callback_context):
        data = callback_context.state.get("marketing_brief")
        if data is None:
            return

        MARKET_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        parsed = _parse_state_value(data)
        md_content = _marketing_brief_to_markdown(parsed)

        with open(MARKET_OUTPUT_DIR / "latest_marketing_brief.md", "w", encoding="utf-8") as f:
            f.write(md_content)

        run_dir = _get_run_dir()
        with open(run_dir / "marketing_brief.md", "w", encoding="utf-8") as f:
            f.write(md_content)

    return callback


async def _session_state_export_callback(callback_context):
    """After-agent callback for results_presenter.

    Writes all session state keys into a combined session_state.json
    in the run folder. Also writes the latest generation manifest
    for the demo UI download endpoint.
    """
    state = callback_context.state
    run_dir = _get_run_dir()

    # Export all pipeline state keys
    export_keys = [
        "kb_insights", "campaign_concepts", "selected_concept",
        "marketing_brief", "brief_quality_result",
        "creative_package", "generation_manifest", "prompt_quality_result",
    ]
    export = {}
    for key in export_keys:
        val = state.get(key)
        if val is not None:
            export[key] = _parse_state_value(val)

    session_path = run_dir / "session_state.json"
    with open(session_path, "w", encoding="utf-8") as f:
        json.dump(export, f, indent=2, ensure_ascii=False)

    # Also write the latest files for the demo UI
    MARKET_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    brief = state.get("marketing_brief")
    if brief is not None:
        parsed = _parse_state_value(brief)
        md_content = _marketing_brief_to_markdown(parsed)
        latest_path = MARKET_OUTPUT_DIR / "latest_marketing_brief.md"
        with open(latest_path, "w", encoding="utf-8") as f:
            f.write(md_content)
        with open(run_dir / "marketing_brief.md", "w", encoding="utf-8") as f:
            f.write(md_content)

    manifest = state.get("generation_manifest")
    if manifest is not None:
        parsed = _parse_state_value(manifest)
        latest_path = MARKET_OUTPUT_DIR / "latest_generation_manifest.json"
        with open(latest_path, "w", encoding="utf-8") as f:
            json.dump(parsed, f, indent=2, ensure_ascii=False)
        with open(run_dir / "generation_manifest.json", "w", encoding="utf-8") as f:
            json.dump(parsed, f, indent=2, ensure_ascii=False)

    creative = state.get("creative_package")
    if creative is not None:
        parsed = _parse_state_value(creative)
        md_content = _creative_package_to_markdown(parsed)
        latest_path = MARKET_OUTPUT_DIR / "latest_creative_package.md"
        with open(latest_path, "w", encoding="utf-8") as f:
            f.write(md_content)
        with open(run_dir / "creative_package.md", "w", encoding="utf-8") as f:
            f.write(md_content)


# =========================================================================
# Root agent tool: write_selected_concept
# =========================================================================
# The root agent calls this at Gate 1 when the user selects a concept.
# It writes the selection to session state so brief_generator can read it.


async def write_selected_concept(
    concept_id: str,
    user_feedback: str,
    tool_context,
):
    """Write the user's concept selection to session state.

    Args:
        concept_id: The concept letter the user chose (A, B, or C).
        user_feedback: Any additional direction the user gave,
            or empty string if none.
    """
    selected = {
        "concept_id": concept_id,
        "user_feedback": user_feedback if user_feedback else None,
    }
    tool_context.state["selected_concept"] = selected
    return f"Saved selection: Concept {concept_id}."


# =========================================================================
# Artifact tools for presenter agents
# =========================================================================
# Each presenter has a tool that reads from session state and saves
# the data as a downloadable ADK artifact. The LLM never passes the
# large JSON payload as a tool argument.


def _marketing_brief_to_markdown(data: dict) -> str:
    """Convert a marketing_brief dict to a human-readable Markdown document."""
    lines = []

    brief_id = data.get("brief_id", "Unknown")
    brief_name = data.get("brief_name", "")

    lines += [
        f"# Marketing Brief: {brief_name}",
        "",
        f"**Brief ID:** {brief_id}",
        "",
        "---",
        "",
    ]

    # Market
    market = data.get("market") or {}
    if market:
        lines += ["## Market", ""]
        if market.get("country"):
            lines.append(f"**Country:** {market['country']} ({market.get('country_code', '')})")
        if market.get("primary_language"):
            lines.append(f"**Primary Language:** {market['primary_language']}")
        lines.append("")

    # Campaign context
    ctx = data.get("campaign_context") or {}
    if ctx:
        lines += ["## Campaign Context", ""]
        if ctx.get("objective"):
            lines += ["**Objective**", "", ctx["objective"], ""]
        if ctx.get("kpi"):
            lines += ["**KPI**", "", ctx["kpi"], ""]
        if ctx.get("get_to_by"):
            lines += ["**Get / To / By**", "", ctx["get_to_by"], ""]

    # Audience
    audience = data.get("audience") or {}
    if audience:
        lines += ["## Audience", ""]
        if audience.get("segment_name"):
            lines.append(f"**Segment:** {audience['segment_name']}")
            lines.append("")
        if audience.get("know_the_user"):
            lines += ["**Know the User**", "", audience["know_the_user"], ""]
        if audience.get("barriers"):
            lines += ["**Barriers**", "", audience["barriers"], ""]
        if audience.get("tensions"):
            lines += ["**Tensions**", "", audience["tensions"], ""]

    # Proposition
    prop = data.get("proposition") or {}
    if prop:
        lines += ["## Proposition", ""]
        tool = prop.get("featured_tool") or {}
        if tool.get("feature_name"):
            lines.append(f"**Featured Tool:** {tool['feature_name']}")
            lines.append("")
        theme = prop.get("theme") or {}
        if theme.get("name"):
            lines.append(f"**Theme:** {theme['name']}")
            if theme.get("description"):
                lines += ["", theme["description"]]
            lines.append("")
        if prop.get("know_the_magic"):
            lines += ["**Know the Magic**", "", prop["know_the_magic"], ""]
        if prop.get("key_message"):
            lines += ["**Key Message**", "", prop["key_message"], ""]

    # Creative guardrails
    guardrails = data.get("creative_guardrails") or {}
    if guardrails:
        lines += ["## Creative Guardrails", ""]
        mandatories = guardrails.get("mandatories") or []
        if mandatories:
            lines += ["**Mandatories**", ""]
            for item in mandatories:
                lines.append(f"- {item}")
            lines.append("")
        if guardrails.get("tone_of_voice"):
            lines += ["**Tone of Voice**", "", guardrails["tone_of_voice"], ""]
        if guardrails.get("inclusion_guidance"):
            lines += ["**Inclusion Guidance**", "", guardrails["inclusion_guidance"], ""]

    # Deliverables
    deliverables = data.get("deliverables") or {}
    items = deliverables.get("items") or []
    if items:
        lines += ["## Deliverables", ""]
        for item in items:
            did = item.get("deliverable_id", "")
            fmt = item.get("format", "")
            qty = item.get("quantity", "")
            specs = item.get("specs") or {}
            spec_parts = []
            if specs.get("max_duration_seconds"):
                spec_parts.append(f"{specs['max_duration_seconds']}s max")
            if specs.get("aspect_ratio"):
                spec_parts.append(specs["aspect_ratio"])
            spec_str = f" ({', '.join(spec_parts)})" if spec_parts else ""
            lines.append(f"- **{did}** {fmt}, qty {qty}{spec_str}")
        lines.append("")

    # Ad copy constraints
    copy = data.get("ad_copy_constraints") or {}
    if copy:
        lines += ["## Ad Copy Constraints", ""]
        langs = copy.get("languages_required") or []
        if langs:
            lines.append(f"**Languages:** {', '.join(langs)}")
            lines.append("")
        if copy.get("messaging_direction"):
            lines += ["**Messaging Direction**", "", copy["messaging_direction"], ""]
        video_copy = copy.get("video_copy") or {}
        if video_copy:
            lines += ["**Video Copy**", ""]
            desc = (video_copy.get("description") or {}).get("max_chars")
            cta = (video_copy.get("cta") or {}).get("max_chars")
            if desc:
                lines.append(f"- Description: max {desc} chars")
            if cta:
                lines.append(f"- CTA: max {cta} chars")
            lines.append("")
        static_copy = copy.get("static_copy") or {}
        if static_copy:
            lines += ["**Static Copy**", ""]
            headline = (static_copy.get("headline") or {}).get("max_chars")
            subheadline = (static_copy.get("subheadline") or {}).get("max_chars")
            cta_headline = (static_copy.get("cta_headline") or {}).get("max_chars")
            if headline:
                lines.append(f"- Headline: max {headline} chars")
            if subheadline:
                lines.append(f"- Subheadline: max {subheadline} chars")
            if cta_headline:
                lines.append(f"- CTA Headline: max {cta_headline} chars")
            lines.append("")

    return "\n".join(lines)


def _creative_package_to_markdown(data: dict) -> str:
    """Convert a creative_package dict to a human-readable Markdown document."""
    lines = []

    brief_id = data.get("brief_id", "Unknown")
    market_nationality = data.get("market_nationality", "Unknown")

    lines += [
        "# Creative Package",
        "",
        f"**Brief ID:** {brief_id}  ",
        f"**Market Nationality:** {market_nationality}",
        "",
        "---",
        "",
    ]

    for concept in data.get("creative_concepts", []):
        deliverable_id = concept.get("deliverable_id", "")
        fmt = concept.get("format", "")
        concept_name = concept.get("concept_name", "")

        lines += [f"## {deliverable_id} - {concept_name}", ""]
        lines.append(f"**Format:** {fmt}  ")
        if concept.get("total_duration_seconds"):
            lines.append(f"**Duration:** {concept['total_duration_seconds']} seconds  ")
        lines.append("")

        if concept.get("concept_description"):
            lines += ["### Concept", "", concept["concept_description"], ""]

        if concept.get("hook_description"):
            lines += ["### Hook", "", concept["hook_description"], ""]

        if concept.get("audio_direction"):
            lines += ["### Audio Direction", "", concept["audio_direction"], ""]

        if concept.get("visual_composition"):
            lines += ["### Visual Composition", "", concept["visual_composition"], ""]

        recurring = concept.get("recurring_elements", [])
        if recurring:
            lines += ["### Recurring Elements", ""]
            for el in recurring:
                lines.append(f"**{el.get('element_id', '')}** ({el.get('element_type', '')})")
                if el.get("creative_direction"):
                    lines.append(f"- Creative direction: {el['creative_direction']}")
                if el.get("role_in_story"):
                    lines.append(f"- Role: {el['role_in_story']}")
                if el.get("appears_in_scenes"):
                    lines.append(f"- Appears in: {', '.join(el['appears_in_scenes'])}")
                lines.append("")

        storyboard = concept.get("storyboard", [])
        if storyboard:
            lines += ["### Storyboard", ""]
            for scene in storyboard:
                scene_id = scene.get("scene_id", "")
                scene_type = scene.get("scene_type", "")
                duration = scene.get("duration_seconds", "")
                lines.append(f"#### {scene_id} ({scene_type}, {duration}s)")
                lines.append("")
                if scene.get("description"):
                    lines += [scene["description"], ""]
                if scene.get("emotional_beat"):
                    lines.append(f"- **Emotional beat:** {scene['emotional_beat']}")
                if scene.get("narrative_purpose"):
                    lines.append(f"- **Narrative purpose:** {scene['narrative_purpose']}")

                elements = scene.get("elements", [])
                if elements:
                    lines += ["", "**Elements:**"]
                    for el in elements:
                        ref = el.get("recurring_element_ref")
                        ref_str = f" (ref: {ref})" if ref else ""
                        lines.append(
                            f"- **{el.get('element_id', '')}** "
                            f"({el.get('element_type', '')}){ref_str}: "
                            f"{el.get('description', '')}"
                        )
                        if el.get("creative_direction"):
                            lines.append(f"  - Creative direction: {el['creative_direction']}")

                ui_ctx = scene.get("ui_context") or {}
                if ui_ctx.get("shows_product_ui"):
                    lines += ["", f"**UI Context:** {ui_ctx.get('ui_description', '')}"]
                    nested = [n for n in ui_ctx.get("nested_assets_to_generate", []) if n]
                    if nested:
                        lines.append(f"- Nested assets: {', '.join(nested)}")

                lines.append("")

        static_elements = concept.get("elements", [])
        if static_elements and not storyboard:
            lines += ["### Elements", ""]
            for el in static_elements:
                ref = el.get("recurring_element_ref")
                ref_str = f" (ref: {ref})" if ref else ""
                lines.append(
                    f"- **{el.get('element_id', '')}** "
                    f"({el.get('element_type', '')}){ref_str}: "
                    f"{el.get('description', '')}"
                )
                if el.get("creative_direction"):
                    lines.append(f"  - Creative direction: {el['creative_direction']}")
            lines.append("")

        copy_placement = concept.get("copy_placement") or {}
        if copy_placement:
            lines += ["### Copy Placement", ""]
            if copy_placement.get("headline_position"):
                lines.append(f"- **Headline:** {copy_placement['headline_position']}")
            if copy_placement.get("cta_position"):
                lines.append(f"- **CTA:** {copy_placement['cta_position']}")
            lines.append("")

        lines += ["---", ""]

    policy = data.get("policy_compliance") or {}
    if policy:
        lines += ["## Policy Compliance", ""]
        policy_labels = {
            "face_policy": "Face Policy",
            "children_policy": "Children Policy",
            "process_policy": "Process Policy",
            "ui_policy": "UI Policy",
            "end_card_policy": "End Card Policy",
            "market_representation_policy": "Market Representation Policy",
        }
        for key, label in policy_labels.items():
            if key in policy:
                lines += [f"**{label}:** {policy[key]}", ""]

    return "\n".join(lines)


async def save_marketing_brief_artifact(tool_context):
    """Save the marketing brief as a downloadable JSON file.
    Call this after presenting the brief summary to the user.
    Takes no arguments - reads directly from session state."""
    data = tool_context.state.get("marketing_brief")
    if data is None:
        return "No marketing brief found in state."

    parsed = _parse_state_value(data)
    content = json.dumps(parsed, indent=2, ensure_ascii=False)
    artifact = types.Part.from_bytes(
        data=content.encode("utf-8"),
        mime_type="application/json",
    )
    version = await tool_context.save_artifact(
        filename="marketing_brief.json", artifact=artifact,
    )
    return f"Saved marketing_brief.json (version {version})."


async def save_creative_package_artifact(tool_context):
    """Save the creative package as a downloadable Markdown file.
    Call this after presenting the storyboard concepts to the user.
    Takes no arguments - reads directly from session state."""
    data = tool_context.state.get("creative_package")
    if data is None:
        return "No creative package found in state."

    parsed = _parse_state_value(data)
    content = _creative_package_to_markdown(parsed)
    artifact = types.Part.from_bytes(
        data=content.encode("utf-8"),
        mime_type="text/markdown",
    )
    version = await tool_context.save_artifact(
        filename="creative_package.md", artifact=artifact,
    )
    return f"Saved creative_package.md (version {version})."


async def save_generation_manifest_artifact(tool_context):
    """Save the generation manifest as a downloadable JSON file.
    Call this after presenting the production summary to the user.
    Takes no arguments - reads directly from session state."""
    data = tool_context.state.get("generation_manifest")
    if data is None:
        return "No generation manifest found in state."

    parsed = _parse_state_value(data)
    content = json.dumps(parsed, indent=2, ensure_ascii=False)
    artifact = types.Part.from_bytes(
        data=content.encode("utf-8"),
        mime_type="application/json",
    )
    version = await tool_context.save_artifact(
        filename="generation_manifest.json", artifact=artifact,
    )
    return f"Saved generation_manifest.json (version {version})."


# =========================================================================
# Adaptation path: artifact tool
# =========================================================================
# The adaptation pipeline produces variation_output instead of a
# generation_manifest. This tool saves the complete variation output
# as a downloadable artifact at the end of the adaptation pipeline.


async def save_variation_artifact(tool_context):
    """Save the complete variation output as a downloadable JSON file.
    Call this after presenting the quality check summary to the user.
    Takes no arguments - reads directly from session state."""
    data = tool_context.state.get("variation_output")
    if data is None:
        return "No variation output found in session state."

    parsed = _parse_state_value(data)
    content = json.dumps(parsed, indent=2, ensure_ascii=False)
    artifact = types.Part.from_bytes(
        data=content.encode("utf-8"),
        mime_type="application/json",
    )
    version = await tool_context.save_artifact(
        filename="variation_output_complete.json", artifact=artifact,
    )
    return f"Saved variation_output_complete.json (version {version})."


# =========================================================================
# Adaptation path: generation manifest builder
# =========================================================================
# Flattens the nested variation_output into a flat list of generation
# jobs for media generators (Veo for video, Imagen for images).


def _parse_style(style_str: str) -> dict:
    """Parse a style_requirements text string into structured fields."""
    if not style_str:
        return {}

    result = {}
    lower = style_str.lower()

    res_match = re.search(r'resolution:\s*(\d+x\d+)', lower)
    if res_match:
        result["resolution"] = res_match.group(1)

    ar_match = re.search(r'aspect\s*ratio:\s*([\d]+:[\d]+)', lower)
    if ar_match:
        result["aspect_ratio"] = ar_match.group(1)

    vs_match = re.search(
        r'visual\s*style:\s*(.+)', style_str, re.IGNORECASE,
    )
    if vs_match:
        result["visual_style"] = vs_match.group(1).strip().rstrip(".")

    return result


def _normalize_variation_output(vo):
    """Normalise variation_output to a (pipeline_run_id, variations_dict) pair.

    Accepts the merged-dict format produced by _merge_variation_outputs
    and the flat-list format that the regenerator sometimes writes directly.
    """
    if isinstance(vo, dict):
        return vo.get("pipeline_run_id", "unknown"), vo.get("variations", {})
    if isinstance(vo, list):
        pipeline_run_id = "unknown"
        variations = {}
        for item in vo:
            if not isinstance(item, dict):
                continue
            aud_id = item.get("audience_id")
            if not aud_id:
                continue
            variations[aud_id] = item
            if pipeline_run_id == "unknown":
                pipeline_run_id = item.get("pipeline_run_id", "unknown")
        return pipeline_run_id, variations
    return "unknown", {}


def _build_adaptation_manifest(session_data: dict) -> dict | None:
    """Flatten variation_output into a generation manifest.

    Transforms nested variation_output (audience > scene > outputs)
    into a flat list of self-contained generation jobs.
    """
    vo = session_data.get("variation_output")
    if not vo:
        return None

    pipeline_run_id, variations = _normalize_variation_output(vo)
    if not variations:
        return None

    MODEL_MAP = {
        "image_generation_prompt": "gemini-3-pro-image-preview",
        "video_generation_prompt": "veo-3.1-generate-preview",
    }

    jobs = []
    text_items = []
    reference_images = []
    job_counter = 0
    ref_lookup = {}

    # Pass 1: Extract reference images
    for aud_id, aud_data in variations.items():
        if not isinstance(aud_data, dict):
            continue
        segment_name = aud_data.get("segment_name", aud_id)
        for ref_sub in aud_data.get("reference_subjects", []):
            if not isinstance(ref_sub, dict):
                continue
            ref_id = ref_sub.get("ref_id", "")
            if not ref_id:
                continue
            reference_images.append({
                "ref_id": ref_id,
                "audience_id": aud_id,
                "audience_name": segment_name,
                "subject_label": ref_sub.get("subject_label", ""),
                "canonical_description": ref_sub.get(
                    "canonical_description", "",
                ),
                "prompt": ref_sub.get("generation_prompt", ""),
                "negative_prompt": ref_sub.get("negative_prompt", ""),
                "style": _parse_style(
                    ref_sub.get("style_requirements", ""),
                ),
                "model": "gemini-3-pro-image-preview",
                "appears_in": ref_sub.get("appears_in", []),
                "output_path": (
                    f"{segment_name}/references/{ref_id}.png"
                ),
                "priority": 0,
                "status": "pending",
            })
            for location in ref_sub.get("appears_in", []):
                parts = location.split("/", 1)
                if len(parts) == 2:
                    key = (aud_id, parts[0], parts[1])
                    ref_lookup.setdefault(key, []).append(ref_id)

    # Pass 2: Build generation jobs and text items
    for aud_id, aud_data in variations.items():
        if not isinstance(aud_data, dict):
            continue
        segment_name = aud_data.get("segment_name", aud_id)
        for scene in aud_data.get("scene_outputs", []):
            if not isinstance(scene, dict):
                continue
            scene_id = scene.get("scene_id", "unknown")
            action = scene.get("action", "unknown")
            if action == "keep":
                continue
            for output in scene.get("outputs", []):
                if not isinstance(output, dict):
                    continue
                output_type = output.get("output_type", "")
                element_id = output.get("element_id", "unknown")
                if output_type == "text_copy":
                    text_items.append({
                        "audience_id": aud_id,
                        "audience_name": segment_name,
                        "scene_id": scene_id,
                        "element_id": element_id,
                        "final_text": output.get("final_text", ""),
                        "fits_original_space": output.get(
                            "fits_original_space", True,
                        ),
                    })
                    continue
                model = MODEL_MAP.get(output_type)
                if not model:
                    continue
                job_counter += 1
                job_id = f"job_{job_counter:03d}"
                style = _parse_style(
                    output.get("style_requirements", ""),
                )
                if model == "veo-3.1-generate-preview" and not style.get("aspect_ratio"):
                    style["aspect_ratio"] = "9:16"
                    style["resolution"] = "1080x1920"
                lookup_key = (aud_id, scene_id, element_id)
                ref_ids = ref_lookup.get(lookup_key, [])
                jobs.append({
                    "job_id": job_id,
                    "audience_id": aud_id,
                    "audience_name": segment_name,
                    "scene_id": scene_id,
                    "element_id": element_id,
                    "asset_type": (
                        "image" if "image" in output_type else "video"
                    ),
                    "model": model,
                    "prompt": output.get("generation_prompt", ""),
                    "negative_prompt": output.get("negative_prompt", ""),
                    "style": style,
                    "face_policy_check": output.get(
                        "face_policy_check", "",
                    ),
                    "ref_dependencies": ref_ids,
                    "priority": 1,
                    "output_path": (
                        f"{segment_name}/{scene_id}/{element_id}"
                        f".{'png' if 'image' in output_type else 'mp4'}"
                    ),
                    "status": "pending",
                })

    return {
        "manifest_version": "1.1",
        "pipeline_run_id": pipeline_run_id,
        "created_at": datetime.now().isoformat(),
        "total_reference_images": len(reference_images),
        "total_jobs": len(jobs),
        "total_text_items": len(text_items),
        "reference_images": reference_images,
        "jobs": jobs,
        "text_items": text_items,
    }


# =========================================================================
# Adaptation path: creative package markdown builder
# =========================================================================


def _build_adaptation_package_md(session_data: dict) -> str | None:
    """Build a human-readable markdown creative package from adaptation
    session state. Contains original ad recap, per-audience concepts,
    reference subjects, and production prompts."""
    scene_map_data = session_data.get("scene_map", {})
    strategy = session_data.get("approved_strategy", {})
    vo = session_data.get("variation_output")
    preprocessor = session_data.get("preprocessor_output", {})

    if not vo or not strategy:
        return None

    pipeline_run_id, _vo_variations = _normalize_variation_output(vo)

    lines = []
    lines.append("# Creative Adaptation Package")
    lines.append("")
    uploaded = preprocessor.get("uploaded_files", [])
    source_desc = "Unknown source"
    if uploaded:
        filename = uploaded[0].get("filename", "Unknown")
        file_type = uploaded[0].get("type", "")
        source_desc = (
            f"{filename} ({file_type})" if file_type else filename
        )

    audience_strategies = strategy.get("audience_strategies", [])
    audience_names = [
        a.get("segment_name", a.get("audience_id", "?"))
        for a in audience_strategies
    ]

    lines.append(f"**Source:** {source_desc}")
    lines.append(
        f"**Audiences:** {len(audience_names)}"
        f" ({', '.join(audience_names)})"
    )
    lines.append(
        f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M')}"
    )
    lines.append(f"**Pipeline run:** `{pipeline_run_id}`")
    lines.append("")
    lines.append("---")
    lines.append("")

    # Original Ad Recap
    lines.append("## Original Ad Recap")
    lines.append("")
    scenes = scene_map_data.get("scene_map", [])
    if scenes:
        for s in scenes:
            sid = s.get("scene_id", "?")
            ts = s.get("timestamp", "?")
            desc = s.get("description", "")
            swap = s.get("swap_recommendation", "?")
            texts = s.get("on_screen_text", [])
            primary_texts = [
                t.get("extracted_text", "")
                for t in texts
                if t.get("prominence") == "primary"
            ]
            text_str = (
                ", ".join(f'"{t}"' for t in primary_texts)
                if primary_texts else "None"
            )
            lines.append(f"### {sid} ({ts}) -- {swap}")
            lines.append("")
            lines.append(desc)
            lines.append("")
            lines.append(f"**Key text:** {text_str}")
            lines.append("")

    lines.append("---")
    lines.append("")

    # Per-Audience Creative Packages
    variations = _vo_variations
    for aud_strat in audience_strategies:
        aud_id = aud_strat.get("audience_id", "")
        segment_name = aud_strat.get("segment_name", aud_id)
        concept = aud_strat.get("creative_concept", {})

        lines.append(f"## {segment_name}")
        lines.append("")
        lines.append("### Creative Concept")
        lines.append("")
        lines.append(
            concept.get("summary", "No concept summary available.")
        )
        lines.append("")
        core_narrative = concept.get("core_narrative", "")
        if core_narrative:
            lines.append(f"**Core narrative:** {core_narrative}")
            lines.append("")

        aud_variation = variations.get(aud_id, {})
        ref_subjects = aud_variation.get("reference_subjects", [])
        if ref_subjects:
            lines.append("### Reference Subjects")
            lines.append("")
            for ref_sub in ref_subjects:
                ref_id = ref_sub.get("ref_id", "?")
                label = ref_sub.get("subject_label", "?")
                canonical = ref_sub.get("canonical_description", "")
                prompt = ref_sub.get("generation_prompt", "")
                appears = ref_sub.get("appears_in", [])
                lines.append(f"**{ref_id}** - {label}")
                lines.append("")
                if canonical:
                    lines.append(
                        f"- Canonical description: {canonical}"
                    )
                if prompt:
                    lines.append(f"- Reference prompt: {prompt}")
                if appears:
                    lines.append(
                        f"- Appears in: {', '.join(appears)}"
                    )
                lines.append("")

        scene_outputs = aud_variation.get("scene_outputs", [])
        if scene_outputs:
            lines.append("### Scene Breakdown")
            lines.append("")
            for scene_out in scene_outputs:
                scene_id = scene_out.get("scene_id", "?")
                action = scene_out.get("action", "?")
                scene_info = next(
                    (s for s in scenes if s.get("scene_id") == scene_id),
                    {},
                )
                ts = scene_info.get("timestamp", "")
                lines.append(
                    f"#### {scene_id} ({ts}) -- {action.upper()}"
                )
                lines.append("")
                comp = scene_out.get("comparison", {})
                if comp:
                    lines.append(
                        f"**Original:** {comp.get('original', 'N/A')}"
                    )
                    lines.append("")
                    lines.append(
                        f"**Adapted:** {comp.get('adapted', 'N/A')}"
                    )
                    lines.append("")
                    lines.append(
                        f"**What changed:**"
                        f" {comp.get('what_changed', 'N/A')}"
                    )
                    lines.append("")
                    lines.append(
                        f"**What preserved:**"
                        f" {comp.get('what_preserved', 'N/A')}"
                    )
                    lines.append("")
                outputs = scene_out.get("outputs", [])
                if outputs:
                    lines.append("**Production prompts:**")
                    lines.append("")
                    for out in outputs:
                        element_id = out.get("element_id", "?")
                        output_type = out.get("output_type", "?")
                        if output_type == "text_copy":
                            final_text = out.get("final_text", "")
                            lines.append(
                                f"- **{element_id}** (text copy):"
                                f" `{final_text}`"
                            )
                        elif output_type == "image_generation_prompt":
                            prompt = out.get("generation_prompt", "")
                            neg = out.get("negative_prompt", "")
                            lines.append(
                                f"- **{element_id}** (image)"
                            )
                            lines.append(f"  - Prompt: {prompt}")
                            if neg:
                                lines.append(
                                    f"  - Negative: {neg}"
                                )
                        elif output_type == "video_generation_prompt":
                            prompt = out.get("generation_prompt", "")
                            neg = out.get("negative_prompt", "")
                            duration = out.get(
                                "duration_guidance", "",
                            )
                            lines.append(
                                f"- **{element_id}** (video)"
                            )
                            lines.append(f"  - Prompt: {prompt}")
                            if neg:
                                lines.append(
                                    f"  - Negative: {neg}"
                                )
                            if duration:
                                lines.append(
                                    f"  - Duration: {duration}"
                                )
                    lines.append("")
                lines.append("---")
                lines.append("")
        lines.append("")

    return "\n".join(lines)


# =========================================================================
# Adaptation path: session state export callback
# =========================================================================


async def _adaptation_session_state_export_callback(callback_context):
    """After-agent callback for adapt_results_presenter.

    Writes session state, generation manifest, and creative package
    to the run folder at the end of the adaptation pipeline.
    """
    state = callback_context.state
    run_dir = _get_run_dir()

    export_keys = [
        "kb_insights", "preprocessor_output", "scene_map",
        "audience_profiles", "approved_strategy",
        "variation_output", "consistency_result",
    ]
    export = {}
    for key in export_keys:
        val = state.get(key)
        if val is not None:
            export[key] = _parse_state_value(val)

    session_path = run_dir / "session_state.json"
    with open(session_path, "w", encoding="utf-8") as f:
        json.dump(export, f, indent=2, ensure_ascii=False)

    MARKET_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    manifest = _build_adaptation_manifest(export)

    # Fallback: if the primary variation_output couldn't be parsed (e.g. the
    # regenerator produced malformed JSON), try re-building from the original
    # per-audience slot outputs (variation_output_0..3) which remain in state
    # untouched by the regenerator.
    if not manifest:
        slots = {}
        for i in range(4):
            slot = _parse_state_value(
                callback_context.state.get(f"variation_output_{i}")
            )
            if slot and isinstance(slot, dict):
                aud_id = slot.get("audience_id")
                if aud_id:
                    slots[aud_id] = slot
        if slots:
            fallback_export = dict(export)
            fallback_export["variation_output"] = {
                "schema_version": "1.0",
                "pipeline_run_id": "unknown",
                "source_asset_id": None,
                "variations": slots,
            }
            manifest = _build_adaptation_manifest(fallback_export)

    if manifest:
        with open(
            run_dir / "generation_manifest.json", "w", encoding="utf-8",
        ) as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        with open(
            MARKET_OUTPUT_DIR / "latest_generation_manifest.json",
            "w", encoding="utf-8",
        ) as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)

    md_content = _build_adaptation_package_md(export)
    if md_content:
        with open(
            run_dir / "creative_package.md", "w", encoding="utf-8",
        ) as f:
            f.write(md_content)
        with open(
            MARKET_OUTPUT_DIR / "latest_creative_package.md",
            "w", encoding="utf-8",
        ) as f:
            f.write(md_content)


# =========================================================================
# Adaptation path: quality check escalation callback
# =========================================================================


def _make_adapt_quality_check_callback(agent_name: str, state_key: str):
    """Factory for adaptation quality checker callback.

    Saves result to disk and escalates out of the LoopAgent when
    all variations pass.
    """
    async def callback(callback_context):
        data = callback_context.state.get(state_key)
        if data is None:
            return

        run_dir = _get_run_dir()
        parsed = _parse_state_value(data)
        out_path = run_dir / f"{agent_name}.json"

        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(parsed, f, indent=2, ensure_ascii=False)

        # Escalate if all audiences passed
        if isinstance(parsed, dict):
            verdicts = parsed.get("audience_verdicts", [])
            if verdicts and all(
                v.get("overall_verdict") == "PASS"
                or v.get("overall_verdict") == "PASS_WITH_NOTES"
                for v in verdicts
                if isinstance(v, dict)
            ):
                callback_context.actions.escalate = True

    return callback


# =========================================================================
# JSON mode config (shared by all specialist agents)
# =========================================================================

JSON_MODE_CONFIG = types.GenerateContentConfig(
    response_mime_type="application/json",
)

# Zero thinking budget for presenter agents. Presenters only format and
# display data - they don't make creative or analytical decisions, so
# internal reasoning time adds latency with no benefit.
TEXT_MODE_NO_THINK_CONFIG = types.GenerateContentConfig(
    thinking_config=types.ThinkingConfig(thinking_budget=0),
)


# =========================================================================
# Discovery phase reset callback
# =========================================================================
# Resets the run folder when a new pipeline run starts (discovery phase),
# so multiple runs in the same server session get separate output folders.


async def _discovery_before_callback(callback_context):
    """Reset run folder tracking at the start of a new pipeline run.

    Attached to discovery_phase (not root_agent) so the folder resets
    once per pipeline run, not on every user message.
    """
    _reset_run_dir()


# =========================================================================
# Agent definitions
# =========================================================================


# --- Phase 1: Discovery ---

kb_analyzer = LlmAgent(
    name="kb_analyzer",
    model=MODEL_PRO,
    instruction=_make_dynamic_kb_instruction(_load_prompt("discovery/kb_analyzer.md")),
    output_key="kb_insights",
    generate_content_config=JSON_MODE_CONFIG,
    before_agent_callback=_make_kb_cache_before_callback("kb_analyzer", MODEL_PRO),
    after_agent_callback=_make_kb_cache_after_callback("kb_analyzer"),
)

concept_generator = LlmAgent(
    name="concept_generator",
    model=MODEL_PRO,
    instruction=_load_prompt("discovery/concept_generator.md"),
    output_key="campaign_concepts",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_auto_save_callback(
        "concept_generator", "campaign_concepts",
    ),
)

concept_presenter = LlmAgent(
    name="concept_presenter",
    model=MODEL_FLASH,
    instruction=_load_prompt("discovery/concept_presenter.md"),
    generate_content_config=TEXT_MODE_NO_THINK_CONFIG,
    # No output_key: response goes directly to the user
)

discovery_phase = SequentialAgent(
    name="discovery_phase",
    sub_agents=[kb_analyzer, concept_generator, concept_presenter],
    before_agent_callback=_discovery_before_callback,
)


# --- Phase 2: Brief ---

brief_generator = LlmAgent(
    name="brief_generator",
    model=MODEL_PRO,
    instruction=_load_prompt("brief/brief_generator.md"),
    output_key="marketing_brief",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_auto_save_callback(
        "brief_generator", "marketing_brief",
    ),
)

brief_quality_checker = LlmAgent(
    name="brief_quality_checker",
    model=MODEL_FLASH,
    instruction=_load_prompt("brief/brief_quality_checker.md"),
    output_key="brief_quality_result",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_quality_check_callback(
        "brief_quality_checker", "brief_quality_result",
    ),
)

brief_reviser = LlmAgent(
    name="brief_reviser",
    model=MODEL_PRO,
    instruction=_load_prompt("brief/brief_reviser.md"),
    output_key="marketing_brief",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_auto_save_callback(
        "brief_reviser", "marketing_brief",
    ),
)

# Quality loop: checker then reviser, max 2 iterations.
# Checker and reviser are direct sub_agents so ADK checks the escalate flag
# after the checker runs - if the brief passes, the reviser is skipped entirely.
brief_quality_loop = LoopAgent(
    name="brief_quality_loop",
    sub_agents=[brief_quality_checker, brief_reviser],
    max_iterations=2,
)

brief_presenter = LlmAgent(
    name="brief_presenter",
    model=MODEL_FLASH,
    instruction=_load_prompt("brief/brief_presenter.md"),
    generate_content_config=TEXT_MODE_NO_THINK_CONFIG,
    tools=[save_marketing_brief_artifact],
    after_agent_callback=_make_latest_brief_markdown_callback(),
)

brief_phase = SequentialAgent(
    name="brief_phase",
    sub_agents=[brief_generator, brief_quality_loop, brief_presenter],
)


# --- Phase 3: Creative ---

creative_director = LlmAgent(
    name="creative_director",
    model=MODEL_PRO,
    instruction=_load_prompt("creative/creative_director.md"),
    output_key="creative_package",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_auto_save_callback(
        "creative_director", "creative_package",
    ),
)

creative_presenter = LlmAgent(
    name="creative_presenter",
    model=MODEL_FLASH,
    instruction=_load_prompt("creative/creative_presenter.md"),
    generate_content_config=TEXT_MODE_NO_THINK_CONFIG,
)

creative_phase = SequentialAgent(
    name="creative_phase",
    sub_agents=[creative_director, creative_presenter],
)


# --- Phase 4: Production ---

creative_prompter = LlmAgent(
    name="creative_prompter",
    model=MODEL_PRO,
    instruction=_load_prompt("production/creative_prompter.md"),
    output_key="generation_manifest",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_auto_save_callback(
        "creative_prompter", "generation_manifest",
    ),
)

prompt_quality_checker = LlmAgent(
    name="prompt_quality_checker",
    model=MODEL_FLASH,
    instruction=_load_prompt("production/prompt_quality_checker.md"),
    output_key="prompt_quality_result",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_quality_check_callback(
        "prompt_quality_checker", "prompt_quality_result",
    ),
)

prompt_regenerator = LlmAgent(
    name="prompt_regenerator",
    model=MODEL_PRO,
    instruction=_load_prompt("production/prompt_regenerator.md"),
    output_key="generation_manifest",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_auto_save_callback(
        "prompt_regenerator", "generation_manifest",
    ),
)

# Quality loop: checker then regenerator, max 2 iterations.
# Same pattern as brief_quality_loop - checker and regenerator are direct
# sub_agents so the regenerator is skipped when the checker escalates on pass.
prompt_quality_loop = LoopAgent(
    name="prompt_quality_loop",
    sub_agents=[prompt_quality_checker, prompt_regenerator],
    max_iterations=2,
)

results_presenter = LlmAgent(
    name="results_presenter",
    model=MODEL_FLASH,
    instruction=_load_prompt("production/results_presenter.md"),
    generate_content_config=TEXT_MODE_NO_THINK_CONFIG,
    tools=[save_creative_package_artifact, save_generation_manifest_artifact],
    after_agent_callback=_session_state_export_callback,
)

production_phase = SequentialAgent(
    name="production_phase",
    sub_agents=[creative_prompter, prompt_quality_loop, results_presenter],
)


# =========================================================================
# Adaptation pipeline agents
# =========================================================================
# These agents handle the "adapt from existing asset" workflow.
# They are separate from the campaign-creation agents above.

# Separate kb_analyzer instance for the adaptation path.
# ADK requires each agent to have exactly one parent, so we cannot reuse
# the kb_analyzer that is already a child of discovery_phase.
adapt_kb_analyzer = LlmAgent(
    name="adapt_kb_analyzer",
    model=MODEL_PRO,
    instruction=_make_dynamic_kb_instruction(_load_prompt("discovery/kb_analyzer.md")),
    output_key="kb_insights",
    generate_content_config=JSON_MODE_CONFIG,
    before_agent_callback=_make_kb_cache_before_callback("adapt_kb_analyzer", MODEL_PRO),
    after_agent_callback=_make_kb_cache_after_callback("adapt_kb_analyzer"),
)


# --- Analysis agents ---

adapt_preprocessor = LlmAgent(
    name="adapt_preprocessor",
    model=MODEL_FLASH,
    instruction=_load_prompt("analysis/preprocessor.md"),
    output_key="preprocessor_output",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_auto_save_callback(
        "adapt_preprocessor", "preprocessor_output",
    ),
)

adapt_deconstructor = LlmAgent(
    name="adapt_deconstructor",
    model=MODEL_FLASH,
    instruction=_load_prompt("analysis/deconstructor.md"),
    output_key="scene_map",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_auto_save_callback(
        "adapt_deconstructor", "scene_map",
    ),
)

adapt_audience_mapper = LlmAgent(
    name="adapt_audience_mapper",
    model=MODEL_FLASH,
    instruction=_make_dynamic_audience_mapper_instruction(
        _load_prompt("analysis/audience_mapper.md")
    ),
    output_key="audience_profiles",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_auto_save_callback(
        "adapt_audience_mapper", "audience_profiles",
    ),
)

adapt_analysis_presenter = LlmAgent(
    name="adapt_analysis_presenter",
    model=MODEL_FLASH,
    instruction=_load_prompt("analysis/analysis_presenter.md"),
    generate_content_config=TEXT_MODE_NO_THINK_CONFIG,
)


# --- Strategy agents ---

adapt_strategy_generator = LlmAgent(
    name="adapt_strategy_generator",
    model=MODEL_PRO,
    instruction=_load_prompt("adaptation/strategy_generator.md"),
    output_key="approved_strategy",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_auto_save_callback(
        "adapt_strategy_generator", "approved_strategy",
    ),
)

adapt_strategy_presenter = LlmAgent(
    name="adapt_strategy_presenter",
    model=MODEL_FLASH,
    instruction=_load_prompt("adaptation/strategy_presenter.md"),
    generate_content_config=TEXT_MODE_NO_THINK_CONFIG,
)


# --- Execution agents ---

# Audience targeting: before each parallel generator runs, set target_audience_id
# in state so the generator knows which audience it is responsible for.
# If no audience exists at that index (e.g. only 2 audiences defined), return
# empty Content to skip the LLM call entirely.
def _make_audience_target_callback(index: int):
    async def callback(callback_context) -> types.Content | None:
        strategy = _parse_state_value(
            callback_context.state.get("approved_strategy", {})
        )
        strategies = strategy.get("audience_strategies", []) if strategy else []
        if index < len(strategies):
            # Write to a slot-specific key so parallel steps don't overwrite each other
            callback_context.state[f"target_audience_id_{index}"] = strategies[index].get(
                "audience_id"
            )
            return None  # proceed normally
        # No audience at this index - skip the LLM call
        callback_context.state[f"target_audience_id_{index}"] = None
        return types.Content(parts=[types.Part(text="")], role="model")
    return callback


# Merge callback: after all parallel generators finish, combine the per-audience
# slots (variation_output_0 .. variation_output_3) into the unified variation_output
# structure that the consistency checker and results presenter already read.
# Idempotent: skips if variation_output already has content (i.e. a regenerator
# has already updated it on a subsequent quality loop iteration).
def _merge_variation_outputs(callback_context):
    existing = _parse_state_value(callback_context.state.get("variation_output"))
    if existing and isinstance(existing, dict) and existing.get("variations"):
        return  # already merged; don't overwrite regenerator's work
    if existing and isinstance(existing, list) and len(existing) > 0:
        return  # regenerator wrote a list; preserve it, don't re-merge original slots

    strategy = _parse_state_value(
        callback_context.state.get("approved_strategy", {})
    )
    pipeline_run_id = None
    source_asset_id = None
    if strategy:
        pipeline_run_id = strategy.get("pipeline_run_id")
        source_asset_id = strategy.get("source_asset_id")

    merged = {
        "schema_version": "1.0",
        "pipeline_run_id": pipeline_run_id,
        "source_asset_id": source_asset_id,
        "variations": {},
        "audiences_processed": [],
        "audiences_remaining": [],
        "status": "complete",
    }

    for i in range(4):
        slot = _parse_state_value(callback_context.state.get(f"variation_output_{i}"))
        if not slot or not isinstance(slot, dict):
            continue
        aud_id = slot.get("audience_id")
        if not aud_id:
            continue
        merged["variations"][aud_id] = slot
        merged["audiences_processed"].append(aud_id)
        if merged["pipeline_run_id"] is None:
            merged["pipeline_run_id"] = slot.get("pipeline_run_id")
        if merged["source_asset_id"] is None:
            merged["source_asset_id"] = slot.get("source_asset_id")

    callback_context.state["variation_output"] = merged

    # Persist merged output to run folder
    run_dir = _get_run_dir()
    out_path = run_dir / "adapt_variation_output_merged.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)


# Four parallel variation generators, one per audience slot.
# Each writes to its own state key (variation_output_0 .. variation_output_3)
# so parallel writes never conflict.
_VARIATION_PROMPT = _load_prompt("delivery/variation_generator.md")
def _make_variation_step(index: int) -> SequentialAgent:
    # Substitute slot-specific state keys so each parallel step reads
    # its own target_audience_id_{index} and variation_output_{index}.
    variation_prompt = _VARIATION_PROMPT.replace(
        "target_audience_id", f"target_audience_id_{index}"
    )
    generator = LlmAgent(
        name=f"adapt_variation_generator_{index}",
        model=MODEL_PRO,
        instruction=variation_prompt,
        output_key=f"variation_output_{index}",
        generate_content_config=JSON_MODE_CONFIG,
        before_agent_callback=_make_audience_target_callback(index),
        after_agent_callback=_make_auto_save_callback(
            f"adapt_variation_generator_{index}", f"variation_output_{index}",
        ),
    )
    return SequentialAgent(
        name=f"adapt_variation_step_{index}",
        sub_agents=[generator],
    )


adapt_variation_step_0 = _make_variation_step(0)
adapt_variation_step_1 = _make_variation_step(1)
adapt_variation_step_2 = _make_variation_step(2)
adapt_variation_step_3 = _make_variation_step(3)

adapt_consistency_checker = LlmAgent(
    name="adapt_consistency_checker",
    model=MODEL_FLASH,
    instruction=_load_prompt("delivery/consistency_checker.md"),
    output_key="consistency_result",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_adapt_quality_check_callback(
        "adapt_consistency_checker", "consistency_result",
    ),
)

adapt_variation_regenerator = LlmAgent(
    name="adapt_variation_regenerator",
    model=MODEL_PRO,
    instruction=_load_prompt("delivery/variation_regenerator.md"),
    output_key="variation_output",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_auto_save_callback(
        "adapt_variation_regenerator", "variation_output",
    ),
)

adapt_results_presenter = LlmAgent(
    name="adapt_results_presenter",
    model=MODEL_FLASH,
    instruction=_load_prompt("delivery/results_presenter.md"),
    generate_content_config=TEXT_MODE_NO_THINK_CONFIG,
    tools=[save_variation_artifact],
    after_agent_callback=_adaptation_session_state_export_callback,
)


# --- Adaptation phase wiring ---

# Analysis sub-phase: preprocessor then deconstructor (sequential, order matters)
adapt_analysis_sub = SequentialAgent(
    name="adapt_analysis_sub",
    sub_agents=[adapt_preprocessor, adapt_deconstructor],
)

# Parallel intake: KB analysis and video analysis have no dependency on each
# other, so run them at the same time. adapt_kb_analyzer writes kb_insights;
# adapt_analysis_sub writes preprocessor_output then scene_map. Both keys are
# available for adapt_audience_mapper once this block completes.
adapt_parallel_intake = ParallelAgent(
    name="adapt_parallel_intake",
    sub_agents=[adapt_kb_analyzer, adapt_analysis_sub],
)

# Pre-strategy phase: parallel intake runs first (KB + video analysis together),
# then audience mapping, then the presenter summarizes findings for the user.
async def _adapt_before_callback(callback_context):
    """Reset run folder at the start of a new adaptation run."""
    _reset_run_dir()

adapt_pre_strategy_phase = SequentialAgent(
    name="adapt_pre_strategy_phase",
    sub_agents=[
        adapt_parallel_intake,
        adapt_audience_mapper,
        adapt_analysis_presenter,
    ],
    before_agent_callback=_adapt_before_callback,
)

# Strategy phase: generate concepts then present for approval
adapt_strategy_phase = SequentialAgent(
    name="adapt_strategy_phase",
    sub_agents=[adapt_strategy_generator, adapt_strategy_presenter],
)

# Execution phase: parallel scatter, merge, quality loop, results
# All four variation steps run simultaneously. Each writes to its own state slot.
adapt_variation_scatter = ParallelAgent(
    name="adapt_variation_scatter",
    sub_agents=[
        adapt_variation_step_0,
        adapt_variation_step_1,
        adapt_variation_step_2,
        adapt_variation_step_3,
    ],
)

# Quality loop: merge callback fires first to assemble variation_output from
# the four parallel slots before the consistency checker reads it.
adapt_quality_loop = LoopAgent(
    name="adapt_quality_loop",
    sub_agents=[adapt_consistency_checker, adapt_variation_regenerator],
    max_iterations=2,
    before_agent_callback=_merge_variation_outputs,
)

adapt_execution_phase = SequentialAgent(
    name="adapt_execution_phase",
    sub_agents=[
        adapt_variation_scatter,
        adapt_quality_loop,
        adapt_results_presenter,
    ],
)


# =========================================================================
# Full Campaign (Create + Adapt) path
# =========================================================================
# This path runs after Campaign Creation (Path 1) when the user opts in to
# audience adaptation at the end of the production phase.
#
# The creative_bridge agent converts the existing creative_package (V1
# storyboard only) into a fc_scene_map that the adaptation agents can read,
# replacing the preprocessor + deconstructor from the standalone Adapt path.
#
# Only V1 (video) is adapted for the 4 targeted audiences. S1 (static ad)
# stays as gen pop only. The final output is a unified 5-audience manifest:
# gen_pop (from Path 1) + 4 targeted audience variations.


def _build_full_campaign_manifest(state: dict) -> dict | None:
    """Combine the Path 1 generation_manifest (gen_pop) with FC audience
    variations into a single unified 5-audience manifest.

    Gen pop jobs come from generation_manifest, tagged with
    audience_id='gen_pop'. Audience variation jobs are built from
    fc_variation_output using the same flattening logic as
    _build_adaptation_manifest.
    """
    creation_manifest = _parse_state_value(state.get("generation_manifest"))
    if not creation_manifest:
        return None

    fc_vo = _parse_state_value(state.get("fc_variation_output"))
    reference_images = []
    jobs = []
    text_items = []

    # --- Gen pop section (from Path 1 manifest) ---
    for ref in creation_manifest.get("reference_images", []):
        ref_copy = dict(ref)
        ref_copy.setdefault("audience_id", "gen_pop")
        ref_copy.setdefault("audience_name", "General Population")
        reference_images.append(ref_copy)

    for job in creation_manifest.get("jobs", []):
        job_copy = dict(job)
        job_copy.setdefault("audience_id", "gen_pop")
        job_copy.setdefault("audience_name", "General Population")
        jobs.append(job_copy)

    for item in creation_manifest.get("text_items", []):
        item_copy = dict(item)
        item_copy.setdefault("audience_id", "gen_pop")
        item_copy.setdefault("audience_name", "General Population")
        text_items.append(item_copy)

    pipeline_run_id = None

    # --- Audience variation sections (from FC adaptation) ---
    if fc_vo:
        fc_pipeline_run_id, variations = _normalize_variation_output(fc_vo)
        if isinstance(fc_vo, dict):
            pipeline_run_id = fc_vo.get("pipeline_run_id") or fc_pipeline_run_id

        MODEL_MAP = {
            "image_generation_prompt": "gemini-3-pro-image-preview",
            "video_generation_prompt": "veo-3.1-generate-preview",
        }

        job_counter = len(jobs)
        ref_lookup = {}

        # Pass 1: Reference images for audience variations
        for aud_id, aud_data in variations.items():
            if not isinstance(aud_data, dict):
                continue
            segment_name = aud_data.get("segment_name", aud_id)
            for ref_sub in aud_data.get("reference_subjects", []):
                if not isinstance(ref_sub, dict):
                    continue
                ref_id = ref_sub.get("ref_id", "")
                if not ref_id:
                    continue
                reference_images.append({
                    "ref_id": ref_id,
                    "audience_id": aud_id,
                    "audience_name": segment_name,
                    "subject_label": ref_sub.get("subject_label", ""),
                    "canonical_description": ref_sub.get(
                        "canonical_description", "",
                    ),
                    "prompt": ref_sub.get("generation_prompt", ""),
                    "negative_prompt": ref_sub.get("negative_prompt", ""),
                    "style": _parse_style(
                        ref_sub.get("style_requirements", ""),
                    ),
                    "model": "gemini-3-pro-image-preview",
                    "appears_in": ref_sub.get("appears_in", []),
                    "output_path": (
                        f"{segment_name}/references/{ref_id}.png"
                    ),
                    "priority": 0,
                    "status": "pending",
                })
                for location in ref_sub.get("appears_in", []):
                    parts = location.split("/", 1)
                    if len(parts) == 2:
                        key = (aud_id, parts[0], parts[1])
                        ref_lookup.setdefault(key, []).append(ref_id)

        # Pass 2: Jobs and text items for audience variations
        for aud_id, aud_data in variations.items():
            if not isinstance(aud_data, dict):
                continue
            segment_name = aud_data.get("segment_name", aud_id)
            for scene in aud_data.get("scene_outputs", []):
                if not isinstance(scene, dict):
                    continue
                scene_id = scene.get("scene_id", "unknown")
                action = scene.get("action", "unknown")
                if action == "keep":
                    continue
                for output in scene.get("outputs", []):
                    if not isinstance(output, dict):
                        continue
                    output_type = output.get("output_type", "")
                    element_id = output.get("element_id", "unknown")
                    if output_type == "text_copy":
                        text_items.append({
                            "audience_id": aud_id,
                            "audience_name": segment_name,
                            "scene_id": scene_id,
                            "element_id": element_id,
                            "final_text": output.get("final_text", ""),
                            "fits_original_space": output.get(
                                "fits_original_space", True,
                            ),
                        })
                        continue
                    model = MODEL_MAP.get(output_type)
                    if not model:
                        continue
                    job_counter += 1
                    job_id = f"job_{job_counter:03d}"
                    style = _parse_style(
                        output.get("style_requirements", ""),
                    )
                    if (
                        model == "veo-3.1-generate-preview"
                        and not style.get("aspect_ratio")
                    ):
                        style["aspect_ratio"] = "9:16"
                        style["resolution"] = "1080x1920"
                    lookup_key = (aud_id, scene_id, element_id)
                    ref_ids = ref_lookup.get(lookup_key, [])
                    jobs.append({
                        "job_id": job_id,
                        "audience_id": aud_id,
                        "audience_name": segment_name,
                        "scene_id": scene_id,
                        "element_id": element_id,
                        "asset_type": (
                            "image" if "image" in output_type else "video"
                        ),
                        "model": model,
                        "prompt": output.get("generation_prompt", ""),
                        "negative_prompt": output.get("negative_prompt", ""),
                        "style": style,
                        "face_policy_check": output.get(
                            "face_policy_check", "",
                        ),
                        "ref_dependencies": ref_ids,
                        "priority": 1,
                        "output_path": (
                            f"{segment_name}/{scene_id}/{element_id}"
                            f".{'png' if 'image' in output_type else 'mp4'}"
                        ),
                        "status": "pending",
                    })

    return {
        "manifest_version": "1.1",
        "run_type": "create_and_adapt",
        "brief_id": creation_manifest.get("brief_id", "unknown"),
        "pipeline_run_id": pipeline_run_id,
        "created_at": datetime.now().isoformat(),
        "market": creation_manifest.get("market", ""),
        "market_nationality": creation_manifest.get("market_nationality", ""),
        "total_reference_images": len(reference_images),
        "total_jobs": len(jobs),
        "total_text_items": len(text_items),
        "reference_images": reference_images,
        "jobs": jobs,
        "text_items": text_items,
    }


async def _fc_build_manifest_before_callback(callback_context):
    """Before-agent callback for fc_results_presenter.

    Builds the unified full_campaign_manifest and writes it to state so the
    presenter agent can read it and the artifact tool can save it.
    """
    state = callback_context.state
    export = {
        "generation_manifest": _parse_state_value(
            state.get("generation_manifest"),
        ),
        "fc_variation_output": _parse_state_value(
            state.get("fc_variation_output"),
        ),
    }
    manifest = _build_full_campaign_manifest(export)
    if manifest:
        callback_context.state["full_campaign_manifest"] = manifest


async def _fc_session_state_export_callback(callback_context):
    """After-agent callback for fc_results_presenter.

    Writes all session state keys and the full_campaign_manifest to the
    run folder and the market-scoped latest files.
    """
    state = callback_context.state
    run_dir = _get_run_dir()

    export_keys = [
        "kb_insights", "campaign_concepts", "selected_concept",
        "marketing_brief", "brief_quality_result",
        "creative_package", "generation_manifest", "prompt_quality_result",
        "fc_scene_map", "fc_audience_profiles", "fc_approved_strategy",
        "fc_variation_output", "fc_consistency_result",
        "full_campaign_manifest",
    ]
    export = {}
    for key in export_keys:
        val = state.get(key)
        if val is not None:
            export[key] = _parse_state_value(val)

    session_path = run_dir / "session_state.json"
    with open(session_path, "w", encoding="utf-8") as f:
        json.dump(export, f, indent=2, ensure_ascii=False)

    manifest = export.get("full_campaign_manifest")
    if manifest:
        MARKET_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        latest_path = MARKET_OUTPUT_DIR / "latest_full_campaign_manifest.json"
        with open(latest_path, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        with open(run_dir / "full_campaign_manifest.json", "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)


async def save_full_campaign_manifest_artifact(tool_context):
    """Save the unified full campaign manifest as a downloadable JSON file.
    Call this after presenting the final summary to the user.
    Takes no arguments - reads directly from session state."""
    data = tool_context.state.get("full_campaign_manifest")
    if data is None:
        return "No full campaign manifest found in session state."

    parsed = _parse_state_value(data)
    content = json.dumps(parsed, indent=2, ensure_ascii=False)
    artifact = types.Part.from_bytes(
        data=content.encode("utf-8"),
        mime_type="application/json",
    )
    version = await tool_context.save_artifact(
        filename="full_campaign_manifest.json", artifact=artifact,
    )
    return f"Saved full_campaign_manifest.json (version {version})."


def _make_fc_audience_target_callback(index: int):
    """Factory: before_agent_callback that sets fc_target_audience_id_{index}
    in state so the FC variation generator knows which audience to process.
    Skips with empty Content if no audience exists at this index.
    """
    async def callback(callback_context) -> types.Content | None:
        strategy = _parse_state_value(
            callback_context.state.get("fc_approved_strategy", {})
        )
        strategies = strategy.get("audience_strategies", []) if strategy else []
        if index < len(strategies):
            callback_context.state[f"fc_target_audience_id_{index}"] = (
                strategies[index].get("audience_id")
            )
            return None
        callback_context.state[f"fc_target_audience_id_{index}"] = None
        return types.Content(parts=[types.Part(text="")], role="model")
    return callback


def _merge_fc_variation_outputs(callback_context):
    """Merge the per-audience FC variation slots into fc_variation_output.

    Runs as before_agent_callback on fc_quality_loop. Skips if
    fc_variation_output already has content (e.g. from the regenerator).
    """
    existing = _parse_state_value(
        callback_context.state.get("fc_variation_output"),
    )
    if existing and isinstance(existing, dict) and existing.get("variations"):
        return
    if existing and isinstance(existing, list) and len(existing) > 0:
        return

    strategy = _parse_state_value(
        callback_context.state.get("fc_approved_strategy", {})
    )
    pipeline_run_id = None
    source_asset_id = None
    if strategy:
        pipeline_run_id = strategy.get("pipeline_run_id")
        source_asset_id = strategy.get("source_asset_id")

    merged = {
        "schema_version": "1.0",
        "pipeline_run_id": pipeline_run_id,
        "source_asset_id": source_asset_id,
        "variations": {},
        "audiences_processed": [],
        "audiences_remaining": [],
        "status": "complete",
    }

    for i in range(4):
        slot = _parse_state_value(
            callback_context.state.get(f"fc_variation_output_{i}"),
        )
        if not slot or not isinstance(slot, dict):
            continue
        aud_id = slot.get("audience_id")
        if not aud_id:
            continue
        merged["variations"][aud_id] = slot
        merged["audiences_processed"].append(aud_id)
        if merged["pipeline_run_id"] is None:
            merged["pipeline_run_id"] = slot.get("pipeline_run_id")
        if merged["source_asset_id"] is None:
            merged["source_asset_id"] = slot.get("source_asset_id")

    callback_context.state["fc_variation_output"] = merged

    run_dir = _get_run_dir()
    out_path = run_dir / "fc_variation_output_merged.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(merged, f, indent=2, ensure_ascii=False)


# =========================================================================
# FC agent definitions
# =========================================================================

# Prompt variants for FC agents that reuse existing prompts with FC-specific
# state key names substituted in. Substitutions target only the ADK
# integration sections (snake_case state key names), not prose headings.

_FC_AUDIENCE_MAPPER_PROMPT = (
    _load_prompt("analysis/audience_mapper.md")
    .replace("scene_map", "fc_scene_map")
    .replace("audience_profiles", "fc_audience_profiles")
)

_FC_ANALYSIS_PRESENTER_PROMPT = _load_prompt(
    "full_campaign/analysis_presenter.md"
)

_FC_STRATEGY_GENERATOR_PROMPT = (
    _load_prompt("adaptation/strategy_generator.md")
    .replace("scene_map", "fc_scene_map")
    .replace("audience_profiles", "fc_audience_profiles")
    .replace("approved_strategy", "fc_approved_strategy")
)

_FC_STRATEGY_PRESENTER_PROMPT = (
    _load_prompt("adaptation/strategy_presenter.md")
    .replace("approved_strategy", "fc_approved_strategy")
    .replace("scene_map", "fc_scene_map")
)

_FC_CONSISTENCY_CHECKER_PROMPT = (
    _load_prompt("delivery/consistency_checker.md")
    .replace("variation_output", "fc_variation_output")
    .replace("scene_map", "fc_scene_map")
    .replace("approved_strategy", "fc_approved_strategy")
)

_FC_VARIATION_REGENERATOR_PROMPT = (
    _load_prompt("delivery/variation_regenerator.md")
    .replace("consistency_result", "fc_consistency_result")
    .replace("variation_output", "fc_variation_output")
    .replace("approved_strategy", "fc_approved_strategy")
    .replace("scene_map", "fc_scene_map")
)

# Base FC variation prompt. The factory below substitutes the slot-specific
# fc_target_audience_id_{index} before creating each generator instance.
_FC_VARIATION_BASE_PROMPT = (
    _load_prompt("delivery/variation_generator.md")
    .replace("target_audience_id", "fc_target_audience_id")
    .replace("approved_strategy", "fc_approved_strategy")
    .replace("scene_map", "fc_scene_map")
)


# Separate KB analyzer instance for the FC path (ADK: one parent per agent).
fc_kb_analyzer = LlmAgent(
    name="fc_kb_analyzer",
    model=MODEL_PRO,
    instruction=_make_dynamic_kb_instruction(
        _load_prompt("discovery/kb_analyzer.md"),
    ),
    output_key="kb_insights",
    generate_content_config=JSON_MODE_CONFIG,
    before_agent_callback=_make_kb_cache_before_callback(
        "fc_kb_analyzer", MODEL_PRO,
    ),
    after_agent_callback=_make_kb_cache_after_callback("fc_kb_analyzer"),
)

fc_creative_bridge = LlmAgent(
    name="fc_creative_bridge",
    model=MODEL_PRO,
    instruction=_load_prompt("full_campaign/creative_bridge.md"),
    output_key="fc_scene_map",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_auto_save_callback(
        "fc_creative_bridge", "fc_scene_map",
    ),
)

fc_audience_mapper = LlmAgent(
    name="fc_audience_mapper",
    model=MODEL_FLASH,
    instruction=_make_dynamic_audience_mapper_instruction(
        _FC_AUDIENCE_MAPPER_PROMPT,
    ),
    output_key="fc_audience_profiles",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_auto_save_callback(
        "fc_audience_mapper", "fc_audience_profiles",
    ),
)

fc_analysis_presenter = LlmAgent(
    name="fc_analysis_presenter",
    model=MODEL_FLASH,
    instruction=_FC_ANALYSIS_PRESENTER_PROMPT,
    generate_content_config=TEXT_MODE_NO_THINK_CONFIG,
)

fc_strategy_generator = LlmAgent(
    name="fc_strategy_generator",
    model=MODEL_PRO,
    instruction=_FC_STRATEGY_GENERATOR_PROMPT,
    output_key="fc_approved_strategy",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_auto_save_callback(
        "fc_strategy_generator", "fc_approved_strategy",
    ),
)

fc_strategy_presenter = LlmAgent(
    name="fc_strategy_presenter",
    model=MODEL_FLASH,
    instruction=_FC_STRATEGY_PRESENTER_PROMPT,
    generate_content_config=TEXT_MODE_NO_THINK_CONFIG,
)

fc_consistency_checker = LlmAgent(
    name="fc_consistency_checker",
    model=MODEL_FLASH,
    instruction=_FC_CONSISTENCY_CHECKER_PROMPT,
    output_key="fc_consistency_result",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_adapt_quality_check_callback(
        "fc_consistency_checker", "fc_consistency_result",
    ),
)

fc_variation_regenerator = LlmAgent(
    name="fc_variation_regenerator",
    model=MODEL_PRO,
    instruction=_FC_VARIATION_REGENERATOR_PROMPT,
    output_key="fc_variation_output",
    generate_content_config=JSON_MODE_CONFIG,
    after_agent_callback=_make_auto_save_callback(
        "fc_variation_regenerator", "fc_variation_output",
    ),
)

fc_results_presenter = LlmAgent(
    name="fc_results_presenter",
    model=MODEL_FLASH,
    instruction=_load_prompt("full_campaign/results_presenter.md"),
    generate_content_config=TEXT_MODE_NO_THINK_CONFIG,
    tools=[save_full_campaign_manifest_artifact],
    before_agent_callback=_fc_build_manifest_before_callback,
    after_agent_callback=_fc_session_state_export_callback,
)


def _make_fc_variation_step(index: int) -> SequentialAgent:
    """Factory: create one FC variation generator step for the given index.

    Each step sets fc_target_audience_id_{index} via before_callback, runs
    the generator, and writes to fc_variation_output_{index}.
    """
    variation_prompt = _FC_VARIATION_BASE_PROMPT.replace(
        "fc_target_audience_id", f"fc_target_audience_id_{index}",
    )
    generator = LlmAgent(
        name=f"fc_variation_generator_{index}",
        model=MODEL_PRO,
        instruction=variation_prompt,
        output_key=f"fc_variation_output_{index}",
        generate_content_config=JSON_MODE_CONFIG,
        before_agent_callback=_make_fc_audience_target_callback(index),
        after_agent_callback=_make_auto_save_callback(
            f"fc_variation_generator_{index}",
            f"fc_variation_output_{index}",
        ),
    )
    return SequentialAgent(
        name=f"fc_variation_step_{index}",
        sub_agents=[generator],
    )


fc_variation_step_0 = _make_fc_variation_step(0)
fc_variation_step_1 = _make_fc_variation_step(1)
fc_variation_step_2 = _make_fc_variation_step(2)
fc_variation_step_3 = _make_fc_variation_step(3)


# =========================================================================
# FC phase wiring
# =========================================================================

# Parallel intake: bridge agent converts creative_package -> fc_scene_map,
# while kb_analyzer refreshes kb_insights. Both run simultaneously.
# No run folder reset - the FC path is a continuation of the same run.
fc_parallel_intake = ParallelAgent(
    name="fc_parallel_intake",
    sub_agents=[fc_creative_bridge, fc_kb_analyzer],
)

fc_pre_strategy_phase = SequentialAgent(
    name="fc_pre_strategy_phase",
    sub_agents=[
        fc_parallel_intake,
        fc_audience_mapper,
        fc_analysis_presenter,
    ],
)

fc_strategy_phase = SequentialAgent(
    name="fc_strategy_phase",
    sub_agents=[fc_strategy_generator, fc_strategy_presenter],
)

fc_variation_scatter = ParallelAgent(
    name="fc_variation_scatter",
    sub_agents=[
        fc_variation_step_0,
        fc_variation_step_1,
        fc_variation_step_2,
        fc_variation_step_3,
    ],
)

fc_quality_loop = LoopAgent(
    name="fc_quality_loop",
    sub_agents=[fc_consistency_checker, fc_variation_regenerator],
    max_iterations=2,
    before_agent_callback=_merge_fc_variation_outputs,
)

fc_execution_phase = SequentialAgent(
    name="fc_execution_phase",
    sub_agents=[
        fc_variation_scatter,
        fc_quality_loop,
        fc_results_presenter,
    ],
)


# --- Phase 5: Root Agent ---

root_agent = LlmAgent(
    name="creative_collective",
    model=MODEL_PRO,
    instruction=_load_prompt("root_agent.md"),
    tools=[write_selected_concept],
    sub_agents=[
        # Campaign creation path
        discovery_phase,
        brief_phase,
        creative_phase,
        production_phase,
        # Asset adaptation path
        adapt_pre_strategy_phase,
        adapt_strategy_phase,
        adapt_execution_phase,
        # Full Campaign (Create + Adapt) path
        fc_pre_strategy_phase,
        fc_strategy_phase,
        fc_execution_phase,
    ],
    generate_content_config=types.GenerateContentConfig(
        tool_config=types.ToolConfig(
            function_calling_config=types.FunctionCallingConfig(mode="ANY"),
        ),
    ),
)
