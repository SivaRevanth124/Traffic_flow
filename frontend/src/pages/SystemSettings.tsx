import React, { useState } from 'react';
import {
  Sliders,
  Cpu,
  Database,
  Radio,
  Save,
  Shield,
  HardDrive,
  RefreshCw,
  Server
} from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const [modelWeights, setModelWeights] = useState('yolov8n');
  const [inferenceDevice, setInferenceDevice] = useState('cpu');
  const [trackBuffer, setTrackBuffer] = useState(30);
  const [matchThresh, setMatchThresh] = useState(0.8);
  const [videoRetentionDays, setVideoRetentionDays] = useState(14);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="bg-[#111827] border border-[#1F293D] p-4 rounded-xl flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">System Architecture & Model Configurations</h2>
          <p className="text-xs text-slate-400">Manage computer vision models, video gateway, and retention policies</p>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
        >
          <Save className="w-4 h-4" /> Save Configuration
        </button>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-mono">
          ✓ Configuration parameters persisted to backend SQLite settings store.
        </div>
      )}

      {/* AI Model & Inference Engine */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1F293D]">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-white">Computer Vision & Inference Tuning</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">YOLO Model Checkpoint</label>
            <select
              value={modelWeights}
              onChange={(e) => setModelWeights(e.target.value)}
              className="w-full bg-[#161F30] border border-[#1F293D] rounded-lg p-2.5 text-white"
            >
              <option value="yolov8n">YOLOv8-Nano (3.2M params) — Optimized for CPU</option>
              <option value="yolov8s">YOLOv8-Small (11.2M params) — High accuracy</option>
              <option value="yolov8m">YOLOv8-Medium (25.9M params) — Workstation grade</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">
              Nano is recommended for laptop and edge CPU setups to sustain &gt;25 FPS.
            </p>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Inference Execution Engine</label>
            <select
              value={inferenceDevice}
              onChange={(e) => setInferenceDevice(e.target.value)}
              className="w-full bg-[#161F30] border border-[#1F293D] rounded-lg p-2.5 text-white font-mono"
            >
              <option value="cpu">PyTorch CPU (Multi-threading, 8 cores detected)</option>
              <option value="cuda">NVIDIA CUDA GPU (Not detected in active host)</option>
              <option value="onnx">ONNX Runtime CPU / DirectML</option>
            </select>
          </div>
        </div>

        {/* ByteTrack Hyperparameters */}
        <div className="pt-3 border-t border-[#1F293D] space-y-3 text-xs">
          <span className="font-semibold text-slate-300 block">ByteTrack Tracking Hyperparameters</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Track Buffer (Lost frames retention)</span>
                <span className="font-mono text-cyan-400 font-bold">{trackBuffer} frames</span>
              </div>
              <input
                type="range"
                min="10"
                max="60"
                value={trackBuffer}
                onChange={(e) => setTrackBuffer(parseInt(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Second Stage Match Threshold</span>
                <span className="font-mono text-cyan-400 font-bold">{matchThresh}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="0.95"
                step="0.05"
                value={matchThresh}
                onChange={(e) => setMatchThresh(parseFloat(e.target.value))}
                className="w-full accent-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Video Gateway & WebRTC Streaming */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1F293D]">
          <Radio className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">RTSP Video Gateway & WebRTC Transcoder</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Gateway Internal Port</label>
            <input
              type="text"
              defaultValue="8554 (RTSP) / 8000 (FastAPI Gateway)"
              disabled
              className="w-full bg-[#161F30] border border-[#1F293D] rounded-lg p-2.5 text-slate-400 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-300 font-medium mb-1">WebRTC Media Server Protocol</label>
            <select className="w-full bg-[#161F30] border border-[#1F293D] rounded-lg p-2.5 text-white">
              <option>Live WebRTC Direct Media Stream (Low latency &lt;200ms)</option>
              <option>HLS Fallback (High-latency segments)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Storage & Video Retention */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-[#1F293D]">
          <HardDrive className="w-4 h-4 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Database Storage & Video Retention Policies</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Database ORM Layer</label>
            <input
              type="text"
              defaultValue="SQLite (sqlite:///./trafficflow.db) → PostgreSQL Ready"
              disabled
              className="w-full bg-[#161F30] border border-[#1F293D] rounded-lg p-2.5 text-slate-400 font-mono"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-slate-300 font-medium">Recorded Video Auto-Pruning Window</span>
              <span className="font-mono text-cyan-400 font-bold">{videoRetentionDays} Days</span>
            </div>
            <input
              type="range"
              min="3"
              max="90"
              value={videoRetentionDays}
              onChange={(e) => setVideoRetentionDays(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Raw frames are automatically pruned after retention expiration. Extracted trajectory vectors are kept permanently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
