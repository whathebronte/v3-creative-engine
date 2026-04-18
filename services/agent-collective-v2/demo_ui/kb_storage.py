"""
KB Storage - abstraction layer for knowledge base file operations.

All reads and writes go through this module. To switch from local filesystem
to cloud storage (GCS, S3, etc.), only this file needs to change - the API
endpoints and frontend stay identical.

Local layout:
  agent_collective/kb/global/     market-agnostic files
  agent_collective/kb/{market}/   market-specific files (kr, in, jp, id)

Accepted extensions: .md, .json
"""

from pathlib import Path

KB_DIR = Path(__file__).parent.parent / "agent_collective" / "kb"
ALLOWED_EXTENSIONS = {".md", ".json"}
VALID_SCOPES = {"global", "kr", "in", "jp", "id"}


def _resolve(scope: str, filename: str) -> Path:
    """Return a safe absolute path inside the scope directory.

    Raises ValueError if the scope is unknown, the extension is not allowed,
    or the resolved path would escape the scope directory.
    """
    if scope not in VALID_SCOPES:
        raise ValueError(f"Unknown scope: {scope!r}")
    # Strip any directory components from the filename to prevent traversal
    safe_name = Path(filename).name
    if Path(safe_name).suffix.lower() not in ALLOWED_EXTENSIONS:
        raise ValueError("Only .md and .json files are accepted.")
    base = (KB_DIR / scope).resolve()
    candidate = (base / safe_name).resolve()
    if not str(candidate).startswith(str(base)):
        raise ValueError("Invalid filename.")
    return candidate


def list_files(market: str) -> dict:
    """Return {"global": [...], "market": [...]} with sorted filename lists.

    Returns empty lists if the directory does not exist yet.
    """
    def _names(folder: Path) -> list:
        if not folder.exists():
            return []
        return sorted(
            f.name for f in folder.iterdir()
            if f.is_file() and f.suffix.lower() in ALLOWED_EXTENSIONS
        )

    return {
        "global": _names(KB_DIR / "global"),
        "market": _names(KB_DIR / market),
    }


def read_file(scope: str, filename: str) -> str:
    """Return file content as a UTF-8 string."""
    path = _resolve(scope, filename)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {filename}")
    return path.read_text(encoding="utf-8")


def write_file(scope: str, filename: str, data: bytes) -> None:
    """Write bytes to the scope directory, creating it if needed."""
    path = _resolve(scope, filename)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def delete_file(scope: str, filename: str) -> None:
    """Delete a file from the scope directory."""
    path = _resolve(scope, filename)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {filename}")
    path.unlink()
