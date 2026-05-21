import re
import uuid
from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.config import settings


router = APIRouter()

# image/* allowlist. HEIC is iOS-default — accept for the future iOS client.
ALLOWED_TYPES: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/heic": ".heic",
}
_EXT_TO_MIME = {v: k for k, v in ALLOWED_TYPES.items()}

# 32-char lowercase hex from uuid4().hex
_ID_RE = re.compile(r"^[a-f0-9]{32}$")


class PhotoUploadOut(BaseModel):
    photo_id: str
    photo_url: str  # backend-relative — e.g. "/photos/abc123…"


def _photo_dir() -> Path:
    p = Path(settings.photo_dir)
    p.mkdir(parents=True, exist_ok=True)
    return p


@router.post("", response_model=PhotoUploadOut)
async def upload_photo(file: UploadFile = File(...)) -> PhotoUploadOut:
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(415, f"unsupported media type: {file.content_type}")

    photo_id = uuid.uuid4().hex
    ext = ALLOWED_TYPES[file.content_type]
    path = _photo_dir() / f"{photo_id}{ext}"

    total = 0
    try:
        with open(path, "wb") as out:
            while chunk := await file.read(64 * 1024):
                total += len(chunk)
                if total > settings.photo_max_bytes:
                    raise HTTPException(413, "file too large")
                out.write(chunk)
    except HTTPException:
        path.unlink(missing_ok=True)
        raise
    except Exception:
        path.unlink(missing_ok=True)
        raise

    return PhotoUploadOut(photo_id=photo_id, photo_url=f"/photos/{photo_id}")


@router.get("/{photo_id}")
async def get_photo(photo_id: str) -> FileResponse:
    if not _ID_RE.match(photo_id):
        raise HTTPException(404, "not found")
    base = _photo_dir()
    for ext, mime in _EXT_TO_MIME.items():
        path = base / f"{photo_id}{ext}"
        if path.exists():
            return FileResponse(path, media_type=mime)
    raise HTTPException(404, "not found")


def find_photo_path(photo_id: str) -> Path | None:
    """Resolve a photo_id to an on-disk path, or None if missing/invalid."""
    if not _ID_RE.match(photo_id):
        return None
    base = _photo_dir()
    for ext in ALLOWED_TYPES.values():
        path = base / f"{photo_id}{ext}"
        if path.exists():
            return path
    return None


def media_type_for(path: Path) -> str:
    return _EXT_TO_MIME.get(path.suffix.lower(), "application/octet-stream")
