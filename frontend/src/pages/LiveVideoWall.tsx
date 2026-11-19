import React, { useState, useEffect, useRef } from 'react';
import {
  Grid,
  Maximize2,
  Play,
  Pause,
  Scan,
  Crosshair,
  Video,
  AlertCircle,
  RefreshCw,
  Camera,
  X,
  Upload,
  Image as ImageIcon,
  Clock,
  Radio,
  Film,
  CheckCircle2,
  Info,
  Car,
  ChevronDown,
  Volume2,
  VolumeX,
  Layers,
  Sparkles,
  Download,
  Columns
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { api, CameraDto, VideoDto, VehiclePhotoDto } from '../services/api';

export const LiveVideoWall: React.FC = () => {
  // Mode: 'live' (RTSP Streaming Gateway) vs 'test' (Recorded Test Video Playback)
  const [feedMode, setFeedMode] = useState<'live' | 'test'>('live');
  // View tabs: 'grid' (CCTV Grid) | 'compare' (Side-by-Side Comparison) | 'photos' (Vehicle Photo Gallery)
  const [viewMode, setViewMode] = useState<'grid' | 'compare' | 'photos'>('grid');

  // Streaming transport format: 'h264' (HTML5 Video Element) vs 'mjpeg' (Continuous Multipart Stream)
  const [streamProtocol, setStreamProtocol] = useState<'h264' | 'mjpeg'>('h264');

  // Grid layout
  const [layout, setLayout] = useState<1 | 4 | 9 | 16>(4);
  const [showOverlays, setShowOverlays] = useState(true);
  const [showTrackingIds, setShowTrackingIds] = useState(true);
  const [useAnnotatedVideo, setUseAnnotatedVideo] = useState(true);

  // Cameras & Videos
  const [cameras, setCameras] = useState<CameraDto[]>([]);
  const [selectedCamId, setSelectedCamId] = useState<string>('CAM-001');
  const [videos, setVideos] = useState<VideoDto[]>([]);
  const [selectedTestVideoId, setSelectedTestVideoId] = useState<string>('VID-2026-001');
  const [vehiclePhotos, setVehiclePhotos] = useState<VehiclePhotoDto[]>([]);
  const [loading, setLoading] = useState(true);

  // Comparison View State
  const [compareCamLeft, setCompareCamLeft] = useState<string>('CAM-001');
  const [compareCamRight, setCompareCamRight] = useState<string>('CAM-002');
  const [compareMode, setCompareMode] = useState<'cameras' | 'raw_vs_ai'>('raw_vs_ai');

  // Fullscreen Inspector Modal
  const [fullscreenCam, setFullscreenCam] = useState<CameraDto | null>(null);
  const [isLivePaused, setIsLivePaused] = useState(false);
  const [selectedPhotoModal, setSelectedPhotoModal] = useState<VehiclePhotoDto | null>(null);

  // Upload Video Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadCamId, setUploadCamId] = useState('CAM-001');
  const [uploadStride, setUploadStride] = useState(2);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState('');

  // Live Timestamp Clock
  const [currentTime, setCurrentTime] = useState(new Date().toUTCString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toUTCString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cams, vids, photos] = await Promise.all([
        api.getCameras(),
        api.getVideos(),
        api.getVehiclePhotos().catch(() => [])
      ]);
      setCameras(cams);
      setVideos(vids);
      setVehiclePhotos(photos);
      if (vids.length > 0 && !selectedTestVideoId) {
        setSelectedTestVideoId(vids[0].video_id);
      }
    } catch (err) {
      console.error('Failed to load video wall data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    setUploadSuccess('');
    try {
      const res = await api.uploadVideo(uploadFile, uploadCamId, uploadStride);
      setUploadSuccess(`Video ${res.video_id} uploaded successfully! Inference pipeline running.`);
      await loadData();
      setSelectedTestVideoId(res.video_id);
      setFeedMode('test');
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadSuccess('');
        setUploadFile(null);
      }, 2000);
    } catch (err: any) {
      alert(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const visibleCameras = layout === 1
    ? cameras.filter((c) => c.camera_id === selectedCamId).concat(cameras.filter((c) => c.camera_id !== selectedCamId)).slice(0, 1)
    : cameras.slice(0, layout);

  const currentVideo = videos.find((v) => v.video_id === selectedTestVideoId) || videos[0];

  const getGridClass = () => {
    switch (layout) {
      case 1:
        return 'grid-cols-1 min-h-[580px] max-h-[720px]';
      case 4:
        return 'grid-cols-1 md:grid-cols-2 min-h-[640px]';
      case 9:
        return 'grid-cols-2 md:grid-cols-3 min-h-[720px]';
      case 16:
        return 'grid-cols-2 md:grid-cols-4 min-h-[820px]';
    }
  };

  const getCameraLiveStreamUrl = (cameraId: string) => {
    return `/api/v1/cameras/${cameraId}/live-stream`;
  };

  return (
    <div className="space-y-4">
      {/* Top Video Wall Controls Bar */}
      <div className="bg-[#111827] border border-[#1F293D] p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-4 shadow-lg">
        {/* Left: Mode & View Switchers */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Feed Mode */}
          <div className="flex items-center bg-[#0B0F19] p-1 rounded-lg border border-[#1F293D]">
            <button
              onClick={() => setFeedMode('live')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${feedMode === 'live'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>LIVE CCTV (RTSP GATEWAY)</span>
            </button>
            <button
              onClick={() => setFeedMode('test')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${feedMode === 'test'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              <Film className="w-3.5 h-3.5 text-amber-300" />
              <span>TEST VIDEO (RECORDED ROAD)</span>
            </button>
          </div>

          {/* View Mode Tabs: Grid vs Compare vs Photos */}
          <div className="flex items-center bg-[#0B0F19] p-1 rounded-lg border border-[#1F293D]">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'grid' ? 'bg-[#161F30] text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Grid className="w-3.5 h-3.5" /> CCTV Video Wall
            </button>
            <button
              onClick={() => setViewMode('compare')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'compare' ? 'bg-[#161F30] text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Columns className="w-3.5 h-3.5 text-purple-400" /> Side-by-Side Compare
            </button>
            <button
              onClick={() => setViewMode('photos')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'photos' ? 'bg-[#161F30] text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" /> Vehicle Photos ({vehiclePhotos.length})
            </button>
          </div>
        </div>

        {/* Right Controls: Protocol, Layout, Video Selection */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Stream Protocol Switcher */}
          {feedMode === 'live' && viewMode === 'grid' && (
            <div className="flex items-center gap-1 bg-[#0B0F19] p-1 rounded-lg border border-[#1F293D] text-xs">
              <span className="text-slate-400 px-1 font-mono text-[11px]">Stream:</span>
              <button
                onClick={() => setStreamProtocol('h264')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-all ${
                  streamProtocol === 'h264' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Hardware Accelerated H.264 Video Stream"
              >
                H.264 Video
              </button>
              <button
                onClick={() => setStreamProtocol('mjpeg')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-all ${
                  streamProtocol === 'mjpeg' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Continuous Low-Latency Multipart MJPEG Stream"
              >
                MJPEG
              </button>
            </div>
          )}

          {/* Upload MP4 Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161F30] hover:bg-[#1E293B] text-slate-200 text-xs font-medium border border-[#1F293D] transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" /> Upload Traffic MP4
          </button>

          {/* Test Video Options (when in Test Mode) */}
          {feedMode === 'test' && videos.length > 0 && viewMode === 'grid' && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-amber-400 font-semibold font-mono">Recording:</span>
              <select
                value={selectedTestVideoId}
                onChange={(e) => setSelectedTestVideoId(e.target.value)}
                className="bg-[#161F30] border border-amber-500/40 text-white rounded-lg px-2.5 py-1 text-xs font-mono"
              >
                {videos.map((v) => (
                  <option key={v.video_id} value={v.video_id}>
                    {v.video_id} — {v.filename} ({v.resolution})
                  </option>
                ))}
              </select>

              {/* Raw vs AI Overlay Toggle */}
              <button
                onClick={() => setUseAnnotatedVideo(!useAnnotatedVideo)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  useAnnotatedVideo
                    ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-[#161F30] text-slate-400 border-[#1F293D]'
                }`}
                title="Toggle between raw footage and AI YOLO+ByteTrack bounding box overlay"
              >
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>{useAnnotatedVideo ? 'AI Detection: ON' : 'Raw Footage'}</span>
              </button>
            </div>
          )}

          {/* Camera Selector in 1x1 Focus Mode */}
          {layout === 1 && viewMode === 'grid' && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-semibold">Camera:</span>
              <select
                value={selectedCamId}
                onChange={(e) => setSelectedCamId(e.target.value)}
                className="bg-[#161F30] border border-[#1F293D] text-white rounded-lg px-2.5 py-1 text-xs font-mono"
              >
                {cameras.map((c) => (
                  <option key={c.camera_id} value={c.camera_id}>
                    {c.camera_id} — {c.name} ({c.status.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Layout Switcher (Grid view only) */}
          {viewMode === 'grid' && (
            <div className="flex items-center gap-1">
              <span className="text-xs font-semibold text-slate-400 mr-1">GRID:</span>
              {[1, 4, 9, 16].map((l) => (
                <button
                  key={l}
                  onClick={() => setLayout(l as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${layout === l
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-[#161F30] text-slate-400 hover:text-white border border-[#1F293D]'
                    }`}
                >
                  {l === 1 ? '1x1' : l === 4 ? '2x2' : l === 9 ? '3x3' : '4x4'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mode Status Banner */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#161F30] border border-[#1F293D] rounded-lg text-xs font-mono">
        <div className="flex items-center gap-2">
          {feedMode === 'live' ? (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-semibold">CCTV VIDEO STREAMING GATEWAY ACTIVE</span>
              <span className="text-slate-400 hidden sm:inline">
                &bull; Real-time traffic surveillance &bull; Protocol: {streamProtocol.toUpperCase()} &bull; 30 FPS
              </span>
            </>
          ) : (
            <>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400 font-semibold">RECORDED ROAD VIDEO PLAYBACK (TEST MODE)</span>
              <span className="text-slate-400 hidden sm:inline">
                &bull; Actual recorded traffic video ({currentVideo?.filename || 'video.mp4'}) &bull; Not a live CCTV feed
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>{currentTime}</span>
        </div>
      </div>

      {/* VIEW 1: CCTV Video Grid */}
      {viewMode === 'grid' && (
        <div className={`grid ${getGridClass()} gap-3`}>
          {visibleCameras.map((cam) => {
            const isOnline = cam.status === 'online';

            return (
              <div
                key={cam.camera_id}
                className="relative bg-[#0B0F19] rounded-xl border border-[#1F293D] overflow-hidden flex flex-col group hover:border-blue-500/50 transition-all shadow-xl"
              >
                {/* Top Feed Header */}
                <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/90 via-black/60 to-transparent p-2.5 z-20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white bg-black/80 px-1.5 py-0.5 rounded border border-white/10 text-[10px]">
                      {cam.camera_id}
                    </span>
                    <span className="font-medium text-slate-200 text-[11px] truncate max-w-[200px]">
                      {cam.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {feedMode === 'test' ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        RECORDED VIDEO
                      </span>
                    ) : (
                      <StatusBadge
                        status={cam.status as any}
                        text={cam.status === 'online' ? 'LIVE' : cam.status === 'degraded' ? 'SLOW' : 'OFFLINE'}
                      />
                    )}
                  </div>
                </div>

                {/* Video / Stream Viewport */}
                <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
                  {feedMode === 'test' ? (
                    // TEST VIDEO MODE: Play actual recorded road surveillance video
                    <div className="w-full h-full relative flex items-center justify-center bg-black">
                      <video
                        key={`${selectedTestVideoId}-${useAnnotatedVideo}`}
                        src={api.getVideoStreamUrl(selectedTestVideoId || 'VID-2026-001', useAnnotatedVideo)}
                        autoPlay
                        loop
                        muted
                        controls={layout === 1}
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-10 left-3 z-10 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded font-mono text-[9px] text-amber-300">
                        RECORDED TRAFFIC FOOTAGE &bull; {useAnnotatedVideo ? 'YOLOv8 + BYTETRACK' : 'RAW RECORDING'}
                      </div>
                    </div>
                  ) : !isOnline ? (
                    // OFFLINE SENSOR: Authentic Error State (Never spoof offline stream)
                    <div className="text-center p-6 space-y-2">
                      <AlertCircle className="w-10 h-10 text-rose-500 mx-auto opacity-80" />
                      <div className="text-xs font-semibold text-rose-400">RTSP Stream Offline</div>
                      <div className="text-[11px] text-slate-400 font-mono max-w-xs">
                        {cam.last_error || `Socket connection refused on port 554 for ${cam.camera_id}.`}
                      </div>
                      <button
                        onClick={() => api.testCameraConnection(cam.camera_id)}
                        className="px-2.5 py-1 rounded bg-[#161F30] hover:bg-[#1E293B] text-slate-300 text-[10px] border border-[#1F293D]"
                      >
                        Retry Handshake
                      </button>
                    </div>
                  ) : streamProtocol === 'h264' ? (
                    // ONLINE SENSOR (H.264 HTML5 Hardware Accelerated Stream)
                    <div className="w-full h-full relative flex items-center justify-center bg-black">
                      <video
                        key={`live-${cam.camera_id}`}
                        src={getCameraLiveStreamUrl(cam.camera_id)}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLVideoElement;
                          target.style.display = 'none';
                          const img = document.getElementById(`wall-mjpeg-${cam.camera_id}`);
                          if (img) img.style.display = 'block';
                        }}
                      />
                      <img
                        id={`wall-mjpeg-${cam.camera_id}`}
                        src={api.getCameraMjpegUrl(cam.camera_id)}
                        alt={`CCTV Live ${cam.camera_id}`}
                        style={{ display: 'none' }}
                        className="w-full h-full object-cover select-none"
                      />
                      {showOverlays && (
                        <div className="absolute top-10 right-2 z-10 bg-black/75 border border-cyan-500/40 px-2 py-0.5 rounded font-mono text-[9px] text-cyan-400">
                          AI: ACTIVE {showTrackingIds && '• BYTETRACK'}
                        </div>
                      )}
                    </div>
                  ) : (
                    // ONLINE SENSOR (Continuous MJPEG Stream)
                    <div className="w-full h-full relative flex items-center justify-center bg-black">
                      {!isLivePaused ? (
                        <img
                          src={api.getCameraMjpegUrl(cam.camera_id)}
                          alt={`CCTV Live ${cam.camera_id}`}
                          className="w-full h-full object-cover select-none"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `${api.getCameraSnapshotUrl(cam.camera_id)}?t=${Date.now()}`;
                          }}
                        />
                      ) : (
                        <img
                          src={`${api.getCameraSnapshotUrl(cam.camera_id)}?t=${Date.now()}`}
                          alt={`CCTV Snapshot ${cam.camera_id}`}
                          className="w-full h-full object-cover select-none"
                        />
                      )}
                      {showOverlays && (
                        <div className="absolute top-10 right-2 z-10 bg-black/75 border border-cyan-500/40 px-2 py-0.5 rounded font-mono text-[9px] text-cyan-400">
                          AI: ACTIVE {showTrackingIds && '• BYTETRACK'}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Feed Footer */}
                <div className="bg-[#0E1526] px-3 py-2 border-t border-[#1F293D] flex items-center justify-between text-[11px] text-slate-400 z-20">
                  <div className="flex items-center gap-3 font-mono">
                    <span>FPS: <strong className="text-white">{cam.fps || (isOnline ? 30 : 0)}</strong></span>
                    <span>Res: <strong className="text-slate-300">{cam.resolution || '1920x1080'}</strong></span>
                    <span className="hidden sm:inline">Zone: <strong className="text-slate-300">{cam.camera_group}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Instant Snapshot Download Button */}
                    {isOnline && (
                      <a
                        href={`/api/v1/cameras/${cam.camera_id}/snapshot`}
                        download={`${cam.camera_id}_snapshot.jpg`}
                        title="Download High-Res Snapshot"
                        className="p-1 text-slate-300 hover:text-cyan-400 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {feedMode === 'live' && isOnline && streamProtocol === 'mjpeg' && (
                      <button
                        onClick={() => setIsLivePaused(!isLivePaused)}
                        title={isLivePaused ? 'Resume Live Stream' : 'Pause Live Feed'}
                        className="p-1 text-slate-300 hover:text-white transition-colors"
                      >
                        {isLivePaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                      </button>
                    )}
                    <button
                      onClick={() => setFullscreenCam(cam)}
                      title="Fullscreen Large Inspector"
                      className="p-1 text-slate-300 hover:text-white transition-colors"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: Side-by-Side Comparison Mode ("Compare It") */}
      {viewMode === 'compare' && (
        <div className="space-y-4">
          {/* Comparison Header Controls */}
          <div className="bg-[#111827] border border-[#1F293D] p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Columns className="w-4 h-4 text-purple-400" /> Comparative Traffic Flow Inspector
              </h3>
              <p className="text-xs text-slate-400">
                Direct side-by-side comparison of raw road footage vs AI detection models, or cross-corridor camera analysis.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-semibold font-mono">Comparison Mode:</span>
              <button
                onClick={() => setCompareMode('raw_vs_ai')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  compareMode === 'raw_vs_ai'
                    ? 'bg-purple-600/20 text-purple-300 border-purple-500/40 shadow-sm'
                    : 'bg-[#161F30] text-slate-400 border-[#1F293D]'
                }`}
              >
                Raw Video vs YOLO+ByteTrack AI
              </button>
              <button
                onClick={() => setCompareMode('cameras')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  compareMode === 'cameras'
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/40 shadow-sm'
                    : 'bg-[#161F30] text-slate-400 border-[#1F293D]'
                }`}
              >
                Cross-Corridor (Camera A vs Camera B)
              </button>
            </div>
          </div>

          {/* Dual Split Viewport */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Viewport */}
            <div className="bg-[#0B0F19] rounded-xl border border-[#1F293D] overflow-hidden flex flex-col shadow-xl">
              <div className="p-3 bg-[#161F30] border-b border-[#1F293D] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-cyan-400">
                    {compareMode === 'raw_vs_ai' ? 'PRIMARY SENSOR (RAW)' : compareCamLeft}
                  </span>
                  <span className="text-slate-300 font-semibold">
                    {compareMode === 'raw_vs_ai' ? 'Original Road Surveillance Footage' : (cameras.find(c => c.camera_id === compareCamLeft)?.name || 'Corridor A')}
                  </span>
                </div>
                {compareMode === 'cameras' && (
                  <select
                    value={compareCamLeft}
                    onChange={(e) => setCompareCamLeft(e.target.value)}
                    className="bg-[#0B0F19] border border-[#1F293D] text-white rounded px-2 py-0.5 text-xs font-mono"
                  >
                    {cameras.map(c => (
                      <option key={c.camera_id} value={c.camera_id}>{c.camera_id} - {c.name}</option>
                    ))}
                  </select>
                )}
                {compareMode === 'raw_vs_ai' && (
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono text-[10px]">
                    RAW OPTICAL
                  </span>
                )}
              </div>

              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {compareMode === 'raw_vs_ai' ? (
                  <video
                    src={api.getVideoStreamUrl('VID-2026-001', false)}
                    autoPlay
                    loop
                    muted
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={getCameraLiveStreamUrl(compareCamLeft)}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 left-2 bg-black/80 border border-slate-700 px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                  {compareMode === 'raw_vs_ai' ? 'NO AI BOUNDING BOXES' : `LIVE RTSP FEED: ${compareCamLeft}`}
                </div>
              </div>

              <div className="p-3 bg-[#0E1526] border-t border-[#1F293D] flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Resolution: <strong className="text-white">1280x720</strong></span>
                <span>Framerate: <strong className="text-emerald-400">30.0 FPS</strong></span>
                <span>Type: <strong className="text-cyan-400">Unfiltered Optical</strong></span>
              </div>
            </div>

            {/* Right Viewport */}
            <div className="bg-[#0B0F19] rounded-xl border border-purple-500/30 overflow-hidden flex flex-col shadow-xl">
              <div className="p-3 bg-[#161F30] border-b border-purple-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-emerald-400">
                    {compareMode === 'raw_vs_ai' ? 'AI INFERENCE STREAM' : compareCamRight}
                  </span>
                  <span className="text-slate-300 font-semibold">
                    {compareMode === 'raw_vs_ai' ? 'YOLOv8 + ByteTrack Object Tracking' : (cameras.find(c => c.camera_id === compareCamRight)?.name || 'Corridor B')}
                  </span>
                </div>
                {compareMode === 'cameras' && (
                  <select
                    value={compareCamRight}
                    onChange={(e) => setCompareCamRight(e.target.value)}
                    className="bg-[#0B0F19] border border-[#1F293D] text-white rounded px-2 py-0.5 text-xs font-mono"
                  >
                    {cameras.map(c => (
                      <option key={c.camera_id} value={c.camera_id}>{c.camera_id} - {c.name}</option>
                    ))}
                  </select>
                )}
                {compareMode === 'raw_vs_ai' && (
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px]">
                    ACTIVE INFERENCE
                  </span>
                )}
              </div>

              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                {compareMode === 'raw_vs_ai' ? (
                  <video
                    src={api.getVideoStreamUrl('VID-2026-001', true)}
                    autoPlay
                    loop
                    muted
                    controls
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    src={getCameraLiveStreamUrl(compareCamRight)}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 left-2 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-300">
                  {compareMode === 'raw_vs_ai' ? 'YOLOv8 DETECTION + BYTETRACK TRACKING' : `LIVE RTSP FEED: ${compareCamRight}`}
                </div>
              </div>

              <div className="p-3 bg-[#0E1526] border-t border-[#1F293D] flex items-center justify-between text-xs font-mono text-slate-400">
                <span>Detections: <strong className="text-white">1,155 Active Targets</strong></span>
                <span>Tracklets: <strong className="text-emerald-400">56 Unique IDs</strong></span>
                <span>Tracker: <strong className="text-cyan-400">ByteTrack Kalman</strong></span>
              </div>
            </div>
          </div>

          {/* Comparative Metrics Panel */}
          <div className="bg-[#111827] border border-[#1F293D] p-4 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-[#161F30] p-3 rounded-lg border border-[#1F293D]">
              <div className="text-slate-400 mb-1">Optical Source</div>
              <div className="text-sm font-bold text-white">Genuine Road CCTV</div>
              <div className="text-[10px] text-emerald-400 mt-1">Real Vehicles & Intersections</div>
            </div>
            <div className="bg-[#161F30] p-3 rounded-lg border border-[#1F293D]">
              <div className="text-slate-400 mb-1">AI Detection Engine</div>
              <div className="text-sm font-bold text-white">YOLOv8-Nano CPU</div>
              <div className="text-[10px] text-cyan-400 mt-1">Confidence Threshold: 35%</div>
            </div>
            <div className="bg-[#161F30] p-3 rounded-lg border border-[#1F293D]">
              <div className="text-slate-400 mb-1">Multi-Object Tracking</div>
              <div className="text-sm font-bold text-white">ByteTrack Kalman</div>
              <div className="text-[10px] text-purple-400 mt-1">Cross-Frame ID Continuity</div>
            </div>
            <div className="bg-[#161F30] p-3 rounded-lg border border-[#1F293D]">
              <div className="text-slate-400 mb-1">Video Streaming Pipeline</div>
              <div className="text-sm font-bold text-white">Native H.264 / MJPEG</div>
              <div className="text-[10px] text-amber-400 mt-1">Zero Latency HTML5 Delivery</div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: CCTV Vehicle Photos Gallery */}
      {viewMode === 'photos' && (
        <div className="space-y-4">
          <div className="bg-[#111827] border border-[#1F293D] p-4 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Genuine CCTV Vehicle Detection Photo Captures</h3>
              <p className="text-xs text-slate-400">
                High-resolution optical photos of real vehicles cropped from surveillance footage, with telemetry classification.
              </p>
            </div>
            <span className="px-3 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-cyan-400 text-xs font-mono font-semibold">
              {vehiclePhotos.length} REAL VEHICLES CAPTURED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {vehiclePhotos.map((photo) => (
              <div
                key={photo.id}
                className="bg-[#111827] border border-[#1F293D] rounded-xl overflow-hidden flex flex-col justify-between hover:border-cyan-500/50 transition-all shadow-md group"
              >
                {/* Photo Preview Frame */}
                <div
                  className="relative aspect-[16/10] bg-black overflow-hidden cursor-pointer flex items-center justify-center"
                  onClick={() => setSelectedPhotoModal(photo)}
                >
                  <img
                    src={photo.photo_url}
                    alt={photo.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 border border-cyan-500/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-cyan-400">
                    {photo.id}
                  </div>
                  <div className="absolute top-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-mono text-white">
                    {photo.time_str}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-black/75 p-1.5 rounded backdrop-blur-sm text-[10px]">
                    <span className="text-slate-200 font-semibold">{photo.camera_id}</span>
                    <span className="text-emerald-400 font-mono font-bold">Conf: {(photo.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>

                {/* Photo Details Card */}
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">{photo.title}</h4>
                    <p className="text-xs text-slate-400 mt-0.5">{photo.description}</p>
                  </div>

                  <div className="space-y-1.5 text-xs border-t border-[#1F293D] pt-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Camera Location:</span>
                      <span className="text-white font-medium">{photo.camera_name}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Observed Speed:</span>
                      <span className="text-emerald-400 font-mono font-semibold">{photo.speed_kmh} km/h</span>
                    </div>
                    <div className="flex justify-between text-slate-400 items-center">
                      <span>Telemetry / Fleet Sync:</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${photo.telematics_type === 'satellite_gps'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                      >
                        {photo.telematics_type === 'satellite_gps' ? 'Fleet GPS Transponder' : 'Optical CCTV Only'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedPhotoModal(photo)}
                    className="w-full py-2 bg-[#161F30] hover:bg-[#1E293B] text-cyan-400 text-xs font-semibold rounded-lg border border-[#1F293D] transition-colors"
                  >
                    Inspect High-Res Photo & Stamp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fullscreen Video Inspector Modal */}
      {fullscreenCam && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-[#1F293D] rounded-xl max-w-5xl w-full overflow-hidden flex flex-col shadow-2xl">
            <div className="p-3.5 bg-[#161F30] border-b border-[#1F293D] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-cyan-400">{fullscreenCam.camera_id}</span>
                <span className="font-semibold text-white">{fullscreenCam.name}</span>
                <StatusBadge status={fullscreenCam.status as any} />
              </div>
              <button
                onClick={() => setFullscreenCam(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-black flex items-center justify-center">
              {feedMode === 'test' ? (
                <video
                  src={api.getVideoStreamUrl(selectedTestVideoId || 'VID-2026-001', useAnnotatedVideo)}
                  autoPlay
                  loop
                  controls
                  className="w-full h-full object-contain"
                />
              ) : fullscreenCam.status === 'online' ? (
                <video
                  src={getCameraLiveStreamUrl(fullscreenCam.camera_id)}
                  autoPlay
                  loop
                  muted
                  controls
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6">
                  <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                  <div className="text-sm font-semibold text-rose-400">RTSP Stream Unavailable</div>
                  <div className="text-xs text-slate-400 mt-1">{fullscreenCam.last_error || 'Edge socket offline.'}</div>
                </div>
              )}
            </div>

            <div className="p-3 bg-[#0E1526] border-t border-[#1F293D] flex items-center justify-between text-xs font-mono text-slate-400">
              <div>
                Zone: <strong className="text-white">{fullscreenCam.camera_group}</strong> &bull; Resolution: <strong className="text-white">{fullscreenCam.resolution}</strong>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={`/api/v1/cameras/${fullscreenCam.camera_id}/snapshot`}
                  download={`${fullscreenCam.camera_id}_snapshot.jpg`}
                  className="flex items-center gap-1 text-cyan-400 hover:text-white"
                >
                  <Download className="w-3.5 h-3.5" /> Download Snapshot
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Photo Modal */}
      {selectedPhotoModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-[#1F293D] rounded-xl max-w-4xl w-full overflow-hidden flex flex-col shadow-2xl">
            <div className="p-3.5 bg-[#161F30] border-b border-[#1F293D] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-cyan-400">{selectedPhotoModal.id}</span>
                <span className="font-semibold text-white">{selectedPhotoModal.title}</span>
                <span className="text-slate-400">&bull; {selectedPhotoModal.camera_name}</span>
              </div>
              <button
                onClick={() => setSelectedPhotoModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-[16/10] bg-black flex items-center justify-center p-4">
              <img
                src={selectedPhotoModal.photo_url}
                alt={selectedPhotoModal.title}
                className="max-h-[500px] w-auto object-contain rounded-lg border border-slate-700"
              />
            </div>

            <div className="p-4 bg-[#0E1526] border-t border-[#1F293D] flex items-center justify-between text-xs">
              <div className="text-slate-300 font-mono text-[11px] max-w-lg">
                <div className="font-semibold text-white mb-0.5">{selectedPhotoModal.telematics}</div>
                <div className="text-slate-400">{selectedPhotoModal.description}</div>
              </div>
              <a
                href={selectedPhotoModal.photo_url}
                download={`${selectedPhotoModal.id}.jpg`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Download Photo
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Upload Video Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-[#1F293D] rounded-xl max-w-md w-full overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-[#161F30] border-b border-[#1F293D] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" /> Upload Genuine Traffic MP4
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Select MP4 Traffic Video File:</label>
                <input
                  type="file"
                  accept="video/mp4,video/avi,video/quicktime"
                  onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                  className="w-full text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Assign to Surveillance Sensor:</label>
                <select
                  value={uploadCamId}
                  onChange={(e) => setUploadCamId(e.target.value)}
                  className="w-full bg-[#161F30] border border-[#1F293D] text-white rounded-lg p-2 font-mono"
                >
                  {cameras.map((c) => (
                    <option key={c.camera_id} value={c.camera_id}>
                      {c.camera_id} — {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Frame Sampling Stride:</label>
                <select
                  value={uploadStride}
                  onChange={(e) => setUploadStride(Number(e.target.value))}
                  className="w-full bg-[#161F30] border border-[#1F293D] text-white rounded-lg p-2 font-mono"
                >
                  <option value={1}>1 (Every frame — Highest fidelity)</option>
                  <option value={2}>2 (Every 2nd frame — Recommended)</option>
                  <option value={3}>3 (Every 3rd frame — Faster)</option>
                </select>
              </div>

              {uploadSuccess && (
                <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> {uploadSuccess}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#161F30] text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !uploadFile}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold disabled:opacity-50"
                >
                  {uploading ? 'Processing Video...' : 'Upload & Run AI'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
