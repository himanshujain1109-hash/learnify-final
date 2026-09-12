import os
import uuid
from pathlib import Path
from threading import Thread
from typing import Any, Dict, Optional

from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from main_pipeline import run_pipeline, run_lecture_pipeline


BASE_DIR = Path(__file__).resolve().parent
JOBS_DIR = BASE_DIR / "jobs"
JOBS_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pptx", ".pdf", ".txt"}
MAX_FILE_MB = int(os.environ.get("MAX_FILE_MB", "20"))

app = FastAPI(title="Remix Teacher Lecture Video Generator")


# --------------------------------------------------
# CORS
# --------------------------------------------------

FRONTEND_URL = os.environ.get("FRONTEND_URL", "")

# Accept comma-separated production origins and local development origins.
# FastAPI's CORS middleware otherwise rejects localhost when FRONTEND_URL is
# omitted, which makes the local video page look like an upload failure.
allowed_origins = [
    origin.strip().rstrip("/")
    for origin in FRONTEND_URL.split(",")
    if origin.strip()
]
if not allowed_origins:
    allowed_origins = [
        # The Remix Teacher app serves its frontend + API from one Express
        # process on port 3000 (see server.ts) in local dev.
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # Kept for compatibility with a plain Vite dev server setup.
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app$",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# STATUS HELPERS
# --------------------------------------------------

def write_status(job_dir: Path, status: str, message: str = ""):
    (job_dir / "status.txt").write_text(
        f"{status}\n{message}",
        encoding="utf-8",
    )


def read_status(job_dir: Path):
    status_file = job_dir / "status.txt"

    if not status_file.exists():
        return {
            "status": "unknown",
            "message": "",
        }

    lines = status_file.read_text(
        encoding="utf-8"
    ).splitlines()

    return {
        "status": lines[0] if lines else "unknown",
        "message": "\n".join(lines[1:]),
    }


# --------------------------------------------------
# VIDEO PROCESSING (file-upload flow)
# --------------------------------------------------

def process_job(job_id: str, input_path: str, options=None):
    job_dir = JOBS_DIR / job_id

    try:
        write_status(
            job_dir,
            "processing",
            "Extracting material and generating the learning video...",
        )

        output_path = run_pipeline(
            input_path,
            str(job_dir),
            options or {},
        )

        (job_dir / "video_path.txt").write_text(
            output_path,
            encoding="utf-8",
        )

        write_status(
            job_dir,
            "done",
            "Your learning video is ready.",
        )

    except Exception as exc:
        write_status(
            job_dir,
            "error",
            f"{type(exc).__name__}: {exc}",
        )


# --------------------------------------------------
# VIDEO PROCESSING (direct lecture-JSON flow)
# --------------------------------------------------

def process_lecture_job(job_id: str, lecture: Dict[str, Any], options=None):
    job_dir = JOBS_DIR / job_id

    try:
        write_status(
            job_dir,
            "processing",
            "Narrating slides and rendering the lecture video...",
        )

        output_path = run_lecture_pipeline(
            lecture,
            str(job_dir),
            options or {},
        )

        (job_dir / "video_path.txt").write_text(
            output_path,
            encoding="utf-8",
        )

        write_status(
            job_dir,
            "done",
            "Your lecture video is ready.",
        )

    except Exception as exc:
        write_status(
            job_dir,
            "error",
            f"{type(exc).__name__}: {exc}",
        )


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "ok",
        "service": "Remix Teacher Lecture Video Generator",
        "message": "Python service is running",
        "health": "/health",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "remix-teacher-lecture-video-generator",
    }


# --------------------------------------------------
# CREATE VIDEO JOB (upload a PPTX/PDF/TXT file)
# --------------------------------------------------

@app.post("/api/video/jobs")
async def create_video_job(
    file: UploadFile = File(...),
    language: str = Form("English"),
    level: str = Form("College"),
    style: str = Form("Teacher"),
    duration: str = Form("5"),
    voice: str = Form("default"),
):
    filename = file.filename or ""

    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Only PPTX, PDF and TXT files are supported.",
        )

    file_data = await file.read()

    if len(file_data) > MAX_FILE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail=f"File is too large. Maximum size is {MAX_FILE_MB} MB.",
        )

    job_id = uuid.uuid4().hex

    job_dir = JOBS_DIR / job_id
    job_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    safe_filename = Path(filename).name

    input_path = job_dir / safe_filename

    input_path.write_bytes(file_data)

    write_status(
        job_dir,
        "queued",
        "Your material has been uploaded and queued.",
    )

    options = {
        "language": language,
        "level": level,
        "style": style,
        "duration": duration,
        "voice": voice,
    }

    worker = Thread(
        target=process_job,
        args=(
            job_id,
            str(input_path),
            options,
        ),
        daemon=True,
    )

    worker.start()

    return {
        "job_id": job_id,
        "status": "queued",
    }


# --------------------------------------------------
# CREATE VIDEO JOB (direct lecture JSON - no file upload)
# --------------------------------------------------

class LectureVideoRequest(BaseModel):
    lecture: Dict[str, Any]
    voice: Optional[str] = "default"
    language: Optional[str] = "English"
    level: Optional[str] = "College"
    style: Optional[str] = "Teacher"


@app.post("/api/video/lecture-jobs")
async def create_lecture_video_job(payload: LectureVideoRequest):
    lecture = payload.lecture or {}
    slides = lecture.get("slides") or []

    if not slides:
        raise HTTPException(
            status_code=400,
            detail="A lecture with at least one slide is required.",
        )

    job_id = uuid.uuid4().hex

    job_dir = JOBS_DIR / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    write_status(
        job_dir,
        "queued",
        "Your lecture has been queued for video rendering.",
    )

    options = {
        "language": payload.language,
        "level": payload.level,
        "style": payload.style,
        "voice": payload.voice,
    }

    worker = Thread(
        target=process_lecture_job,
        args=(
            job_id,
            lecture,
            options,
        ),
        daemon=True,
    )

    worker.start()

    return {
        "job_id": job_id,
        "status": "queued",
    }


# --------------------------------------------------
# CHECK JOB STATUS (shared by both flows above)
# --------------------------------------------------

@app.get("/api/video/jobs/{job_id}")
def get_job_status(job_id: str):

    job_dir = JOBS_DIR / job_id

    if not job_dir.exists():
        raise HTTPException(
            status_code=404,
            detail="Video job not found.",
        )

    result = read_status(job_dir)

    response = {
        "job_id": job_id,
        "status": result["status"],
        "message": result["message"],
    }

    if result["status"] == "done":
        response["video_url"] = (
            f"/api/video/jobs/{job_id}/video"
        )
        metadata_path = job_dir / "metadata.json"
        if metadata_path.exists():
            try:
                import json
                response["metadata"] = json.loads(metadata_path.read_text("utf-8"))
            except Exception:
                pass

    return response


# --------------------------------------------------
# GET VIDEO (shared by both flows above)
# --------------------------------------------------

@app.get("/api/video/jobs/{job_id}/video")
def get_video(job_id: str):

    video_path = (
        JOBS_DIR /
        job_id /
        "output.mp4"
    )

    if not video_path.exists():
        raise HTTPException(
            status_code=404,
            detail="Video is not ready yet.",
        )

    return FileResponse(
        path=video_path,
        media_type="video/mp4",
        filename=f"lecture-{job_id}.mp4",
    )
