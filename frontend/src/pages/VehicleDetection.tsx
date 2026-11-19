import React, { useState, useEffect } from 'react';
import {
  ScanEye,
  Car,
  Filter,
  Sliders,
  Eye,
  Layers,
  BarChart2,
  CheckCircle,
  Cpu,
  Play,
  RotateCw,
  Video,
  Info
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { api, VideoDto } from '../services/api';

export const VehicleDetection: React.FC = () => {
  const [videos, setVideos] = useState<VideoDto[]>([]);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<'all' | 'car' | 'motorcycle' | 'bus' | 'truck'>('all');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.40);
  const [frameStride, setFrameStride] = useState(2);
  const [modelName, setModelName] = useState('yolov8n');
  const [isRunningInference, setIsRunningInference] = useState(false);
  const [detections, setDetections] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Load available videos
  useEffect(() => {
    const loadVideos = async () => {
      try {
        const vids = await api.getVideos();
        setVideos(vids);
        if (vids.length > 0 && !selectedVideoId) {
          setSelectedVideoId(vids[0].video_id);
        }
      } catch (err) {
        console.warn('Could not load videos:', err);
      }
    };
    loadVideos();
  }, []);

  // Load detections when video or filters change
  const loadDetections = async (vidId: string) => {
    if (!vidId) return;
    try {
      const data = await api.getVideoDetections(vidId, selectedClass, confidenceThreshold);
      setDetections(data);
      const sum = await api.getDetectionSummary(vidId);
      setSummary(sum);
    } catch (err) {
      console.warn('No detections yet for this video:', err);
      setDetections([]);
      setSummary(null);
    }
  };

  useEffect(() => {
    if (selectedVideoId) {
      loadDetections(selectedVideoId);
    }
  }, [selectedVideoId, selectedClass, confidenceThreshold]);

  const handleRunInference = async () => {
    if (!selectedVideoId) {
      alert('Please select a video first');
      return;
    }
    setIsRunningInference(true);
    setActionMessage(`Running ${modelName.toUpperCase()} inference on ${selectedVideoId}...`);
    try {
      const sum = await api.processDetection(selectedVideoId, confidenceThreshold, frameStride, modelName);
      setSummary(sum);
      setActionMessage(`Inference complete! ${sum.total_detections} vehicle observations extracted.`);
      loadDetections(selectedVideoId);
    } catch (err: any) {
      setActionMessage(`Inference error: ${err.message}`);
    } finally {
      setIsRunningInference(false);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const getCategoryCount = (cat: string) => {
    if (!summary || !summary.categories) return 0;
    const item = summary.categories.find((c: any) => c.category === cat);
    return item ? item.count : 0;
  };

  const selectedVideo = videos.find(v => v.video_id === selectedVideoId);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="bg-blue-600/20 border border-blue-500/40 text-blue-300 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Banner Notice */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
            <ScanEye className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              AI Vehicle Detection Engine (YOLOv8 + OpenCV Optical Pipeline)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Target vehicle classes: Cars, Motorcycles, Buses, and Trucks. CPU-optimized batch inference generates persistent bounding box records and annotated overlay streams.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunInference}
          disabled={isRunningInference || !selectedVideoId}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all self-end md:self-auto shrink-0 disabled:opacity-50"
        >
          {isRunningInference ? <RotateCw className="w-4 h-4 animate-spin text-cyan-300" /> : <Play className="w-4 h-4" />}
          {isRunningInference ? 'Running Inference...' : 'Execute YOLO Detection'}
        </button>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Model"
          value="YOLOv8-Nano"
          subtitle="PyTorch CPU Multi-threaded"
          icon={<Cpu className="w-5 h-5" />}
          accentColor="blue"
          badge="CPU OPT"
        />
        <MetricCard
          title="Cars Classified"
          value={getCategoryCount('car').toLocaleString()}
          subtitle="Passenger sedans / SUVs"
          icon={<Car className="w-5 h-5" />}
          accentColor="cyan"
        />
        <MetricCard
          title="Motorcycles"
          value={getCategoryCount('motorcycle').toLocaleString()}
          subtitle="Two-wheel transit"
          icon={<ScanEye className="w-5 h-5" />}
          accentColor="emerald"
        />
        <MetricCard
          title="Commercial Heavy"
          value={(getCategoryCount('truck') + getCategoryCount('bus')).toLocaleString()}
          subtitle="Logistics trucks & buses"
          icon={<Layers className="w-5 h-5" />}
          accentColor="amber"
        />
      </div>

      {/* Main Viewport & Detection Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Frame Inspection Viewport (2 cols) */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1F293D] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Visual Detection & Overlay Stream</h3>
                <p className="text-xs text-slate-400">Inspecting video with bounding boxes, confidence tags, and telemetry</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Video Source:</span>
                <select
                  value={selectedVideoId}
                  onChange={(e) => setSelectedVideoId(e.target.value)}
                  className="bg-[#161F30] border border-[#1F293D] rounded-lg text-xs text-white px-2.5 py-1.5 font-mono"
                >
                  {videos.map((v) => (
                    <option key={v.video_id} value={v.video_id}>
                      {v.video_id}: {v.filename}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Video Player Canvas */}
            <div className="relative aspect-video bg-black rounded-lg border border-[#1F293D] overflow-hidden flex items-center justify-center">
              {selectedVideoId ? (
                <video
                  key={selectedVideoId}
                  src={api.getAnnotatedVideoStreamUrl(selectedVideoId)}
                  controls
                  className="w-full h-full object-contain"
                >
                  Your browser does not support HTML5 video.
                </video>
              ) : (
                <div className="text-center p-6 text-slate-500">
                  <Video className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-xs">No video footage selected</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 text-slate-400 text-[11px] font-mono flex items-center justify-between">
            <span>Sensor: {selectedVideo?.camera_name || selectedVideo?.camera_id || 'CAM-001'}</span>
            <span>Total Detections: <strong className="text-cyan-400">{summary?.total_detections || detections.length}</strong></span>
          </div>
        </div>

        {/* Inference Filter & Tuning Sidebar */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Inference Hyperparameters</h3>
              <p className="text-xs text-slate-400">Tune sensitivity and category gating</p>
            </div>

            {/* Model Architecture */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Model Architecture</label>
              <select
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full bg-[#161F30] border border-[#1F293D] rounded-lg p-2 text-xs text-white font-mono"
              >
                <option value="yolov8n">YOLOv8-Nano (Fastest CPU throughput)</option>
                <option value="yolov8s">YOLOv8-Small (High recall balance)</option>
              </select>
            </div>

            {/* Confidence Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Confidence Threshold</span>
                <span className="font-mono text-cyan-400 font-bold">{(confidenceThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.95"
                step="0.05"
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>0.20 (Recall)</span>
                <span>0.95 (Precision)</span>
              </div>
            </div>

            {/* Frame Stride Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Frame Sampling Stride</span>
                <span className="font-mono text-cyan-400 font-bold">Every {frameStride} frames</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={frameStride}
                onChange={(e) => setFrameStride(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">Filter Observations</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {(['all', 'car', 'motorcycle', 'bus', 'truck'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedClass(cat)}
                    className={`py-1.5 px-2.5 rounded-lg capitalize font-medium transition-colors ${
                      selectedClass === cat
                        ? 'bg-blue-600 text-white font-semibold shadow-sm'
                        : 'bg-[#161F30] text-slate-400 hover:text-white border border-[#1F293D]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1F293D] text-[11px] text-slate-400">
            Observations are persisted to SQLite table for trajectory tracking and route clustering.
          </div>
        </div>
      </div>

      {/* Detections Log Table */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1F293D] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Extracted Vehicle Observations</h3>
            <p className="text-xs text-slate-400">Database records with bounding box coordinates and timestamps</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{detections.length} Records Loaded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161F30] text-slate-400 border-b border-[#1F293D]">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Detection ID</th>
                <th className="py-2.5 px-4 font-semibold">Vehicle Class</th>
                <th className="py-2.5 px-4 font-semibold">Confidence Score</th>
                <th className="py-2.5 px-4 font-semibold">Bounding Box [x, y, w, h]</th>
                <th className="py-2.5 px-4 font-semibold">Frame & Timestamp</th>
                <th className="py-2.5 px-4 font-semibold">Sensor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D]/60">
              {detections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No detections found. Select a video and click "Execute YOLO Detection" to extract vehicle observations.
                  </td>
                </tr>
              ) : (
                detections.slice(0, 50).map((det) => (
                  <tr key={det.detection_id} className="hover:bg-[#161F30]/40 transition-colors">
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-200">{det.detection_id}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-semibold text-white capitalize">{det.category}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-400 h-1.5 rounded-full"
                            style={{ width: `${det.confidence * 100}%` }}
                          />
                        </div>
                        <span className="font-mono text-cyan-400 font-semibold">
                          {(det.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">
                      [{Math.round(det.bbox_x)}, {Math.round(det.bbox_y)}, {Math.round(det.bbox_w)}, {Math.round(det.bbox_h)}]
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-slate-300">Frame {det.frame_number}</span>
                      <span className="text-slate-500 text-[10px] ml-2">({det.timestamp_str})</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-mono text-blue-400 font-semibold">{det.camera_id}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
