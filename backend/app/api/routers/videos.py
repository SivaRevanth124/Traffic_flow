import os
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    BackgroundTasks,
    Header,
    Response,
    status
)
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.core.config import settings
from backend.app.database.session import get_db
from backend.app.models.video import Video
from backend.app.schemas.video import VideoResponse, VideoProcessingStatus
from backend.app.services.video_service import VideoService
from backend.app.api.deps import require_operator, get_current_user

router = APIRouter(prefix="/videos", tags=["Recorded Video Management"])

ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv"}

@router.get("", response_model=List[VideoResponse])
def list_recorded_videos(db: Session = Depends(get_db)):
    """List all registered surveillance footage files with processing states."""
    return db.query(Video).order_by(Video.uploaded_at.desc()).all()

@router.get("/{video_id}", response_model=VideoResponse)
def get_video_details(video_id: str, db: Session = Depends(get_db)):
    """Retrieve metadata and inference progress for a specific video file."""
    video = db.query(Video).filter(Video.video_id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail=f"Video '{video_id}' not found.")
    return video

@router.post("/upload", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    camera_id: str = Form(...),
    frame_stride: int = Form(2),
    db: Session = Depends(get_db),
    current_user = Depends(require_operator)
):
    """
    Upload recorded CCTV footage (MP4, AVI, MOV), extract metadata,
    and trigger the asynchronous 5-stage inference pipeline.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video format '{ext}'. Supported: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Save and register video
    video = VideoService.save_uploaded_video(db, file, camera_id)

    # Dispatch non-blocking background inference pipeline
    background_tasks.add_task(VideoService.run_video_pipeline, video.video_id, frame_stride)

    return video

@router.get("/{video_id}/stream")
@router.head("/{video_id}/stream")
def stream_video(
    video_id: str,
    annotated: bool = False,
    range: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    Stream video footage supporting HTTP 206 Range Requests.
    Allows HTML5 video players to seek, scrub, and stream without downloading full file.
    If annotated=True, serves the AI annotated video with YOLO+ByteTrack bounding boxes.
    """
    video = db.query(Video).filter(Video.video_id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail=f"Video record for '{video_id}' not found.")

    stream_path = video.filepath
    if annotated:
        annotated_path = os.path.join(settings.PROCESSED_DIR, f"{video_id}_annotated.mp4")
        if os.path.exists(annotated_path):
            stream_path = annotated_path

    if not os.path.exists(stream_path):
        raise HTTPException(status_code=404, detail=f"Video file '{stream_path}' not found on disk.")

    generator, start, end, total, status_code = VideoService.get_range_stream(stream_path, range)

    headers = {
        "Content-Range": f"bytes {start}-{end}/{total}",
        "Accept-Ranges": "bytes",
        "Content-Length": str((end - start) + 1),
        "Content-Type": "video/mp4",
    }
    return StreamingResponse(generator, status_code=status_code, headers=headers)

@router.get("/{video_id}/annotated-stream")
@router.head("/{video_id}/annotated-stream")
def stream_annotated_video(
    video_id: str,
    range: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Direct shortcut for streaming the AI annotated video with detection bounding boxes."""
    return stream_video(video_id=video_id, annotated=True, range=range, db=db)

@router.post("/{video_id}/reprocess", response_model=VideoResponse)
def reprocess_video(
    video_id: str,
    background_tasks: BackgroundTasks,
    frame_stride: int = Form(2),
    db: Session = Depends(get_db),
    current_user = Depends(require_operator)
):
    """Reset processing status and re-execute pipeline workflow."""
    video = db.query(Video).filter(Video.video_id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail=f"Video '{video_id}' not found.")

    video.status = "pending"
    video.progress_pct = 0.0
    video.current_step = "1. Reprocessing Requested"
    video.error_message = None
    db.commit()
    db.refresh(video)

    background_tasks.add_task(VideoService.run_video_pipeline, video.video_id, frame_stride)
    return video

@router.delete("/{video_id}")
def delete_video(
    video_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(require_operator)
):
    """Delete video file from storage disk and remove record from database."""
    video = db.query(Video).filter(Video.video_id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail=f"Video '{video_id}' not found.")

    if os.path.exists(video.filepath):
        try:
            os.remove(video.filepath)
        except Exception:
            pass

    db.delete(video)
    db.commit()
    return {"message": f"Video '{video_id}' successfully deleted.", "success": True}
