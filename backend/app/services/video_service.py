import os
import shutil
import time
from datetime import datetime, timezone
from typing import Optional, Tuple, Generator
from sqlalchemy.orm import Session
import cv2

from backend.app.core.config import settings
from backend.app.models.video import Video
from backend.app.models.camera import Camera

class VideoService:
    @staticmethod
    def extract_metadata(filepath: str) -> Tuple[float, int, float, str]:
        """Extract duration, total_frames, fps, and resolution from video file via OpenCV."""
        cap = cv2.VideoCapture(filepath)
        if not cap.isOpened():
            return 0.0, 0, 30.0, "Unknown"

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH) or 1920)
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT) or 1080)
        duration = round(total_frames / fps, 2) if fps > 0 else 0.0
        resolution = f"{width}x{height}"
        cap.release()
        return duration, total_frames, fps, resolution

    @staticmethod
    def save_uploaded_video(
        db: Session,
        upload_file,
        camera_id: str
    ) -> Video:
        """Save uploaded video file, extract metadata, and register in database."""
        # Find camera name
        camera = db.query(Camera).filter(Camera.camera_id == camera_id).first()
        camera_name = camera.name if camera else f"Camera ({camera_id})"

        # Generate unique Video ID
        count = db.query(Video).count()
        video_id = f"VID-2026-{1001 + count}"

        # Clean filename and target path
        clean_name = os.path.basename(upload_file.filename)
        dest_filename = f"{video_id}_{clean_name}"
        dest_path = os.path.join(settings.UPLOAD_DIR, dest_filename)

        with open(dest_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        file_size = os.path.getsize(dest_path)
        duration, total_frames, fps, resolution = VideoService.extract_metadata(dest_path)

        video = Video(
            video_id=video_id,
            filename=clean_name,
            filepath=dest_path,
            camera_id=camera_id,
            camera_name=camera_name,
            duration_seconds=duration,
            total_frames=total_frames,
            fps=fps,
            resolution=resolution,
            file_size_bytes=file_size,
            status="pending",
            progress_pct=0.0,
            current_step="1. Upload & Validation",
            detected_vehicles_count=0,
            uploaded_at=datetime.now(timezone.utc)
        )
        db.add(video)
        db.commit()
        db.refresh(video)
        return video

    @staticmethod
    def run_video_pipeline(video_id: str, frame_stride: int = 2):
        """
        Background task executing the complete 5-stage real video intelligence pipeline:
        Video Frames -> YOLO Vehicle Detection -> ByteTrack Tracking -> Vehicle Observations -> Trajectory Reconstruction -> Clustering
        """
        from backend.app.database.session import SessionLocal
        from backend.app.services.detection_service import DetectionService
        from backend.app.services.tracking_service import TrackingService
        from backend.app.services.trajectory_service import TrajectoryService
        from backend.app.services.clustering_service import ClusteringService

        db = SessionLocal()
        try:
            video = db.query(Video).filter(Video.video_id == video_id).first()
            if not video:
                return

            video.status = "processing"
            video.progress_pct = 15.0
            video.current_step = "1. Frame Ingestion & Validation"
            db.commit()

            # Stage 2: YOLOv8 Detection & ByteTrack
            video.progress_pct = 40.0
            video.current_step = "2. YOLOv8 Vehicle Detection & ByteTrack Inference"
            db.commit()

            summary = DetectionService.process_video_detections(
                video=video,
                db=db,
                confidence_threshold=0.35,
                frame_stride=frame_stride
            )

            # Stage 3: Kalman Object Tracking & Tracklet Reconstruction
            video.progress_pct = 70.0
            video.current_step = "3. ByteTrack Intra-Camera Tracklet Association"
            db.commit()
            try:
                TrackingService.track_video_detections(video.video_id, db)
            except Exception as trk_err:
                print(f"TrackingService notice: {trk_err}")

            # Stage 4: Trajectory Reconstruction
            video.progress_pct = 85.0
            video.current_step = "4. Spatio-Temporal Trajectory Reconstruction"
            db.commit()
            try:
                TrajectoryService.reconstruct_trajectories(video.video_id, db)
            except Exception as traj_err:
                print(f"TrajectoryService notice: {traj_err}")

            # Stage 5: Unsupervised Pattern Clustering
            video.progress_pct = 95.0
            video.current_step = "5. Unsupervised Flow Pattern Clustering"
            db.commit()
            try:
                ClusteringService.cluster_trajectories(db)
            except Exception as clus_err:
                print(f"ClusteringService notice: {clus_err}")

            # Finalize
            video.progress_pct = 100.0
            video.status = "completed"
            video.current_step = "Completed: Real-time Analytics & Annotated Feed Ready"
            video.detected_vehicles_count = summary.total_detections
            video.processed_at = datetime.now(timezone.utc)
            db.commit()
        except Exception as e:
            if video:
                video.status = "failed"
                video.error_message = str(e)
                video.current_step = f"Pipeline Error: {str(e)}"
                db.commit()
        finally:
            db.close()

    @staticmethod
    def get_range_stream(filepath: str, range_header: Optional[str]) -> Tuple[Generator, int, int, int, int]:
        """
        Yields chunked bytes supporting HTTP 206 Partial Content (Range requests)
        for seamless video playback and timeline scrubbing in browser video tags.
        """
        file_size = os.path.getsize(filepath)
        start = 0
        end = file_size - 1

        if range_header:
            # Parse 'bytes=start-end'
            parts = range_header.replace("bytes=", "").split("-")
            if parts[0]:
                start = int(parts[0])
            if len(parts) > 1 and parts[1]:
                end = int(parts[1])

        # Clamp bounds
        start = max(0, start)
        end = min(file_size - 1, end)
        content_length = (end - start) + 1

        def chunk_generator():
            with open(filepath, "rb") as f:
                f.seek(start)
                bytes_left = content_length
                while bytes_left > 0:
                    chunk_size = min(bytes_left, 1024 * 64) # 64KB chunks
                    data = f.read(chunk_size)
                    if not data:
                        break
                    bytes_left -= len(data)
                    yield data

        status_code = 206 if range_header else 200
        return chunk_generator(), start, end, file_size, status_code
