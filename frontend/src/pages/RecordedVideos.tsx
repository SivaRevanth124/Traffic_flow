import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Video,
  Play,
  RotateCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  Clock,
  Cpu,
  Layers,
  ArrowRight,
  Eye,
  X,
  Maximize2
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { api, VideoDto, CameraDto } from '../services/api';

export const RecordedVideos: React.FC = () => {
  const [videos, setVideos] = useState<VideoDto[]>([]);
  const [cameras, setCameras] = useState<CameraDto[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('CAM-001');
  const [frameSamplingRate, setFrameSamplingRate] = useState(2);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedPlaybackVideo, setSelectedPlaybackVideo] = useState<VideoDto | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const videoList = await api.getVideos();
      setVideos(videoList);
      const camList = await api.getCameras();
      setCameras(camList);
      if (camList.length > 0 && !selectedCamera) {
        setSelectedCamera(camList[0].camera_id);
      }
    } catch (err: any) {
      console.warn('Failed to fetch videos from backend:', err);
    }
  };

  useEffect(() => {
    loadData();
    // Poll every 4 seconds to observe real-time background processing status
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    try {
      const uploaded = await api.uploadVideo(file, selectedCamera, frameSamplingRate);
      setActionMessage(`Uploaded '${file.name}' (${uploaded.video_id}). Background inference initiated.`);
      loadData();
    } catch (err: any) {
      setUploadError(err.message || 'Video upload failed.');
    } finally {
      setIsUploading(false);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleReprocess = async (videoId: string) => {
    try {
      await api.reprocessVideo(videoId, frameSamplingRate);
      setActionMessage(`Reprocessing requested for ${videoId}`);
      loadData();
    } catch (err: any) {
      alert(`Reprocessing failed: ${err.message}`);
    } finally {
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleDelete = async (videoId: string) => {
    if (!window.confirm(`Are you sure you want to delete video '${videoId}' and its extracted telemetry?`)) return;
    try {
      await api.deleteVideo(videoId);
      setActionMessage(`Video ${videoId} deleted successfully.`);
      loadData();
    } catch (err: any) {
      alert(`Deletion failed: ${err.message}`);
    } finally {
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const pipelineSteps = [
    { name: '1. Ingestion & Validation', desc: 'Metadata & codec verification' },
    { name: '2. Frame Extraction', desc: 'Configurable stride sampling' },
    { name: '3. YOLOv8 Detection', desc: 'Class-differentiated vehicle inference' },
    { name: '4. ByteTrack Association', desc: 'Kalman filter tracklet linking' },
    { name: '5. Trajectory Modeling', desc: 'Spatial-temporal observation storage' },
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Upload Zone & Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drag and Drop Uploader */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1F293D] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Upload Recorded Surveillance Footage</h3>
            <p className="text-xs text-slate-400 mb-4">
              Supported formats: MP4, AVI, MOV, MKV. Asynchronous multi-threading pipeline extracts frame observations.
            </p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-[#1F293D] hover:border-blue-500/60 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-[#0B0F19]/50"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0])}
                accept=".mp4,.avi,.mov,.mkv"
                className="hidden"
              />
              <div className="p-4 rounded-full bg-blue-600/10 text-blue-400 mb-3 border border-blue-500/20">
                <Upload className={`w-6 h-6 ${isUploading ? 'animate-bounce text-cyan-400' : ''}`} />
              </div>
              <p className="text-sm font-medium text-white mb-1">
                {isUploading ? 'Uploading and extracting metadata...' : 'Drag and drop CCTV video file here, or browse'}
              </p>
              <p className="text-xs text-slate-500">
                Automatic CPU-optimized batch inference will initiate upon staging.
              </p>
              {uploadError && (
                <div className="mt-2 text-rose-400 text-xs font-medium">{uploadError}</div>
              )}
            </div>
          </div>

          {/* Config Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#1F293D] text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Associated Camera Sensor</label>
              <select
                value={selectedCamera}
                onChange={(e) => setSelectedCamera(e.target.value)}
                className="w-full bg-[#161F30] border border-[#1F293D] rounded-lg p-2 text-white"
              >
                {cameras.map((cam) => (
                  <option key={cam.camera_id} value={cam.camera_id}>
                    {cam.camera_id}: {cam.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Frame Sampling Stride: <span className="text-cyan-400 font-mono">Every {frameSamplingRate} frames</span>
              </label>
              <input
                type="range"
                min="1"
                max="5"
                value={frameSamplingRate}
                onChange={(e) => setFrameSamplingRate(Number(e.target.value))}
                className="w-full mt-2 accent-blue-500"
              />
              <span className="text-[10px] text-slate-500">
                Lower stride improves tracking accuracy; higher stride accelerates CPU inference.
              </span>
            </div>
          </div>
        </div>

        {/* Processing Pipeline Architecture Info */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Processing Pipeline Architecture</h3>
            <p className="text-xs text-slate-400 mb-4">Five-stage automated trajectory extraction</p>

            <div className="space-y-3">
              {pipelineSteps.map((step, i) => (
                <div key={step.name} className="flex items-start gap-3 p-2.5 rounded-lg bg-[#161F30] border border-[#1F293D]">
                  <div className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{step.name}</div>
                    <div className="text-[11px] text-slate-400">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1F293D] text-[11px] text-slate-400 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Worker: FastAPI BackgroundTasks (Asynchronous)</span>
          </div>
        </div>
      </div>

      {/* Videos List Table */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1F293D] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Video Footage Repository</h3>
            <p className="text-xs text-slate-400">Processed runs and trajectory database entries</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{videos.length} Files Registered</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161F30] text-slate-400 border-b border-[#1F293D]">
              <tr>
                <th className="py-3 px-4 font-semibold">Video File</th>
                <th className="py-3 px-4 font-semibold">Camera Source</th>
                <th className="py-3 px-4 font-semibold">Duration & Size</th>
                <th className="py-3 px-4 font-semibold">Processing Pipeline Status</th>
                <th className="py-3 px-4 font-semibold">Extracted Vehicles</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D]/60">
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No recorded surveillance video files registered yet. Upload footage above to begin.
                  </td>
                </tr>
              ) : (
                videos.map((vid) => (
                  <tr key={vid.video_id} className="hover:bg-[#161F30]/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <FileVideo className="w-5 h-5 text-blue-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-white">{vid.filename}</div>
                          <div className="font-mono text-slate-500 text-[10px]">
                            {vid.video_id} • {new Date(vid.uploaded_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-medium">
                      {vid.camera_name || vid.camera_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-mono">{formatDuration(vid.duration_seconds)}</div>
                      <div className="text-slate-500 text-[10px]">
                        {formatFileSize(vid.file_size_bytes)} • {vid.resolution}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {vid.status === 'processing' ? (
                        <div className="space-y-1 max-w-[200px]">
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="text-cyan-400 font-mono">{vid.progress_pct.toFixed(0)}%</span>
                            <span className="text-slate-400 truncate max-w-[140px]">{vid.current_step}</span>
                          </div>
                          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-cyan-500 h-1.5 rounded-full transition-all duration-300"
                              style={{ width: `${vid.progress_pct}%` }}
                            />
                          </div>
                        </div>
                      ) : vid.status === 'completed' ? (
                        <StatusBadge status="completed" text="PIPELINE COMPLETED" />
                      ) : vid.status === 'failed' ? (
                        <StatusBadge status="critical" text="FAILED" />
                      ) : (
                        <StatusBadge status="pending" text="PENDING" />
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-cyan-400">
                      {vid.detected_vehicles_count.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedPlaybackVideo(vid)}
                          title="Stream & Inspect Video"
                          className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleReprocess(vid.video_id)}
                          title="Reprocess Video"
                          className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-blue-400 transition-colors"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(vid.video_id)}
                          title="Delete"
                          className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HTML5 Video Streaming & Playback Modal Dialog */}
      {selectedPlaybackVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-[#1F293D] rounded-xl max-w-3xl w-full p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]">
              <div>
                <span className="font-mono text-cyan-400 text-xs font-bold">{selectedPlaybackVideo.video_id}</span>
                <h3 className="text-sm font-semibold text-white">{selectedPlaybackVideo.filename}</h3>
              </div>
              <button
                onClick={() => setSelectedPlaybackVideo(null)}
                className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Viewport */}
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-[#1F293D] flex items-center justify-center">
              <video
                src={api.getVideoStreamUrl(selectedPlaybackVideo.video_id)}
                controls
                autoPlay
                className="w-full h-full object-contain"
              >
                Your browser does not support the video tag.
              </video>
            </div>

            {/* Video Meta Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#161F30] p-3 rounded-lg border border-[#1F293D]">
              <div>
                <span className="text-slate-400 block">Resolution:</span>
                <span className="font-mono text-white font-semibold">{selectedPlaybackVideo.resolution}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Frame Rate:</span>
                <span className="font-mono text-white font-semibold">{selectedPlaybackVideo.fps} FPS</span>
              </div>
              <div>
                <span className="text-slate-400 block">Duration:</span>
                <span className="font-mono text-white font-semibold">{formatDuration(selectedPlaybackVideo.duration_seconds)}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Extracted Targets:</span>
                <span className="font-mono text-cyan-400 font-semibold">{selectedPlaybackVideo.detected_vehicles_count} vehicles</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedPlaybackVideo(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Close Player
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
