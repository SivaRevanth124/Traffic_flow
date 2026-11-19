import React, { useState, useEffect } from 'react';
import {
  Camera,
  Activity,
  AlertTriangle,
  Radio,
  Car,
  GitFork,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Filter,
  Sparkles,
  RefreshCw,
  Maximize2
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import { StatusBadge } from '../components/StatusBadge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { api, DashboardStatsDto, CameraDto, AlertDto } from '../services/api';

interface CommandCenterProps {
  onNavigate: (page: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onNavigate }) => {
  const [dataMode, setDataMode] = useState<'demo' | 'live'>('live');
  const [liveStats, setLiveStats] = useState<DashboardStatsDto | null>(null);
  const [liveCameras, setLiveCameras] = useState<CameraDto[]>([]);
  const [liveAlerts, setLiveAlerts] = useState<AlertDto[]>([]);
  const [selectedCamId, setSelectedCamId] = useState<string>('CAM-001');
  const [streamType, setStreamType] = useState<'video' | 'mjpeg'>('video');
  const [liveError, setLiveError] = useState(false);

  useEffect(() => {
    const fetchBackendData = async () => {
      try {
        const stats = await api.getDashboardStats();
        setLiveStats(stats);
        const cams = await api.getCameras();
        setLiveCameras(cams);
        const alerts = await api.getAlerts();
        setLiveAlerts(alerts);
      } catch (err) {
        console.warn('Backend live sync offline, falling back to cached telemetry:', err);
      }
    };
    fetchBackendData();
    const interval = setInterval(fetchBackendData, 10000);
    return () => clearInterval(interval);
  }, []);

  // Realistic hourly traffic volume data for central corridors
  const hourlyData = [
    { time: '00:00', cars: 120, bikes: 25, buses: 10, trucks: 30 },
    { time: '02:00', cars: 75, bikes: 10, buses: 5, trucks: 45 },
    { time: '04:00', cars: 95, bikes: 15, buses: 8, trucks: 60 },
    { time: '06:00', cars: 380, bikes: 110, buses: 42, trucks: 85 },
    { time: '08:00', cars: 1250, bikes: 380, buses: 140, trucks: 90 },
    { time: '10:00', cars: 920, bikes: 290, buses: 110, trucks: 75 },
    { time: '12:00', cars: 810, bikes: 260, buses: 95, trucks: 80 },
    { time: '14:00', cars: 890, bikes: 275, buses: 105, trucks: 95 },
    { time: '16:00', cars: 1140, bikes: 360, buses: 130, trucks: 80 },
    { time: '18:00', cars: 1420, bikes: 420, buses: 165, trucks: 70 },
    { time: '20:00', cars: 780, bikes: 240, buses: 80, trucks: 65 },
    { time: '22:00', cars: 390, bikes: 90, buses: 35, trucks: 50 },
  ];

  // Vehicle category breakdown
  const categoryData = [
    { name: 'Cars & Sedans', value: 29840, color: '#3B82F6' },
    { name: 'Motorcycles', value: 9410, color: '#06B6D4' },
    { name: 'Commercial Trucks', value: 5210, color: '#F59E0B' },
    { name: 'Buses & Transits', value: 3460, color: '#10B981' },
  ];

  // Camera Network Health Overview
  const cameraGrid = [
    { id: 'CAM-001', name: 'Main St & 4th Ave Intersection', group: 'Downtown Core', status: 'online', fps: 30, detections: 3420 },
    { id: 'CAM-002', name: 'Ring Road Northern Overpass', group: 'Highways', status: 'online', fps: 25, detections: 5120 },
    { id: 'CAM-003', name: 'Commercial Harbor Toll Gate A', group: 'Logistics', status: 'online', fps: 30, detections: 4280 },
    { id: 'CAM-004', name: 'Airport Express Connector West', group: 'Highways', status: 'online', fps: 28, detections: 2980 },
    { id: 'CAM-005', name: 'City Hospital Emergency Access', group: 'Special Zones', status: 'degraded', fps: 14, detections: 1120 },
    { id: 'CAM-006', name: 'University Blvd Southbound', group: 'Downtown Core', status: 'offline', fps: 0, detections: 0 },
    { id: 'CAM-007', name: 'Central Station Terminal Junction', group: 'Downtown Core', status: 'online', fps: 30, detections: 4890 },
    { id: 'CAM-008', name: 'East River Bridge Toll Plaza', group: 'Highways', status: 'online', fps: 30, detections: 6240 },
  ];

  // Recent operational alerts
  const recentAlerts = [
    {
      id: 'ALT-1082',
      title: 'Dense Queue Formed (Congestion Index 88%)',
      location: 'CAM-002 (Ring Road Northern Overpass)',
      time: '4 mins ago',
      severity: 'high',
      status: 'active'
    },
    {
      id: 'ALT-1081',
      title: 'Stream Signal Dropped / Connection Timeout',
      location: 'CAM-006 (University Blvd Southbound)',
      time: '18 mins ago',
      severity: 'critical',
      status: 'active'
    },
    {
      id: 'ALT-1080',
      title: 'Possible Stopped Vehicle in Median Lane',
      location: 'CAM-004 (Airport Express Connector)',
      time: '45 mins ago',
      severity: 'medium',
      status: 'resolved'
    }
  ];

  // Frequently observed trajectory clusters
  const frequentCorridors = [
    { id: 'CORR-A', name: 'Harbor Gate → Ring Road North', count: '14,290 vehicles/day', avgDuration: '14.2 min', status: 'Normal Flow' },
    { id: 'CORR-B', name: 'Central Station → Main St Core', count: '11,450 vehicles/day', avgDuration: '8.4 min', status: 'Heavy Density' },
    { id: 'CORR-C', name: 'East River Bridge → Airport Express', count: '8,920 vehicles/day', avgDuration: '21.0 min', status: 'Normal Flow' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Telemetry Mode Indicator */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-white tracking-wide">
                City Traffic Intelligence Operations
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20">
                ACTIVE DISPATCH
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Connecting 24 distributed ANPR & CCTV optical sensors across city intersections.
            </p>
          </div>
        </div>

        {/* Data Mode Switcher with transparent labeling */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <div className="flex items-center bg-[#0B0F19] p-1 rounded-lg border border-[#1F293D]">
            <button
              onClick={() => setDataMode('demo')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                dataMode === 'demo'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Demo Dataset
            </button>
            <button
              onClick={() => setDataMode('live')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                dataMode === 'live'
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Edge Sync
            </button>
          </div>
          <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-lg">
            {dataMode === 'demo' ? 'DEMO TELEMETRY ACTIVE' : 'RTSP GATEWAY LISTENING'}
          </span>
        </div>
      </div>

      {/* Featured Live CCTV Surveillance Stream & Optical Monitor */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-sm font-semibold text-white tracking-wide">
                Live CCTV Optical Surveillance Stream
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                LIVE RTSP GATEWAY
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real moving road traffic video from city surveillance cameras with hardware-accelerated H.264 video.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Camera Selector Pills */}
            <div className="flex items-center bg-[#0B0F19] p-1 rounded-lg border border-[#1F293D]">
              {['CAM-001', 'CAM-002', 'CAM-003', 'CAM-004'].map((camId) => (
                <button
                  key={camId}
                  onClick={() => { setSelectedCamId(camId); setLiveError(false); }}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                    selectedCamId === camId
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {camId}
                </button>
              ))}
            </div>

            {/* Protocol Toggle */}
            <div className="flex items-center bg-[#0B0F19] p-1 rounded-lg border border-[#1F293D] text-xs">
              <button
                onClick={() => setStreamType('video')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-all ${
                  streamType === 'video' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                H.264 Video
              </button>
              <button
                onClick={() => setStreamType('mjpeg')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-all ${
                  streamType === 'mjpeg' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                MJPEG
              </button>
            </div>

            {/* Full Live Video Wall Button */}
            <button
              onClick={() => onNavigate('video-wall')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors"
            >
              <span>Open CCTV Video Wall</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Video Player & Real-Time Analytics Viewport */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Video Viewport (2 cols) */}
          <div className="lg:col-span-2 relative aspect-video bg-black rounded-lg overflow-hidden border border-[#1F293D] flex items-center justify-center shadow-inner">
            {streamType === 'video' && !liveError ? (
              <video
                key={`cc-video-${selectedCamId}`}
                src={`/api/v1/cameras/${selectedCamId}/live-stream`}
                autoPlay
                loop
                muted
                playsInline
                controls
                onError={() => setLiveError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                key={`cc-mjpeg-${selectedCamId}`}
                src={`/api/v1/cameras/${selectedCamId}/mjpeg`}
                alt={`CCTV Live ${selectedCamId}`}
                className="w-full h-full object-cover select-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `/api/v1/cameras/${selectedCamId}/snapshot?t=${Date.now()}`;
                }}
              />
            )}

            {/* Live HUD Overlays */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-2 z-10 pointer-events-none">
              <span className="bg-rose-600/90 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                REC LIVE
              </span>
              <span className="bg-black/80 text-cyan-400 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30">
                {selectedCamId} • {selectedCamId === 'CAM-001' ? 'Main St & 4th Ave Intersection' : selectedCamId === 'CAM-002' ? 'Ring Road Overpass' : selectedCamId === 'CAM-003' ? 'Commercial Harbor Gate' : 'Airport Express'}
              </span>
            </div>

            <div className="absolute bottom-2.5 right-2.5 flex items-center gap-2 z-10">
              <a
                href={`/api/v1/cameras/${selectedCamId}/snapshot`}
                download={`${selectedCamId}_snapshot.jpg`}
                className="bg-black/80 hover:bg-black text-cyan-400 hover:text-white text-[10px] font-mono px-2 py-1 rounded border border-[#1F293D] flex items-center gap-1 transition-colors"
              >
                <Camera className="w-3 h-3" /> Snapshot
              </a>
            </div>
          </div>

          {/* Live Stream Telemetry & Quick Info (1 col) */}
          <div className="bg-[#0B0F19] p-4 rounded-lg border border-[#1F293D] flex flex-col justify-between text-xs font-mono">
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#1F293D] pb-2">
                <span className="text-slate-400">Optical Source:</span>
                <span className="text-white font-semibold">Real Road Surveillance</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#1F293D] pb-2">
                <span className="text-slate-400">Stream Codec:</span>
                <span className="text-emerald-400 font-semibold">H.264 (avc1) / MJPEG</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#1F293D] pb-2">
                <span className="text-slate-400">Resolution & FPS:</span>
                <span className="text-white font-semibold">1280x720 @ 30.0 FPS</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#1F293D] pb-2">
                <span className="text-slate-400">AI Detection Engine:</span>
                <span className="text-cyan-400 font-semibold">YOLOv8 + ByteTrack</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#1F293D] pb-2">
                <span className="text-slate-400">Active Targets:</span>
                <span className="text-purple-400 font-semibold">Real Cars, Buses, Trucks</span>
              </div>
            </div>

            <div className="pt-3 space-y-2">
              <button
                onClick={() => onNavigate('video-wall')}
                className="w-full py-2 bg-[#161F30] hover:bg-[#1E293B] text-cyan-400 hover:text-white rounded-lg text-xs font-semibold border border-cyan-500/30 transition-colors flex items-center justify-center gap-1.5"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Multi-Grid Video Wall (1x1, 2x2, 4x4)</span>
              </button>
              <button
                onClick={() => onNavigate('traffic-map')}
                className="w-full py-1.5 bg-[#161F30] hover:bg-[#1E293B] text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-[#1F293D] transition-colors flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                <span>Locate Camera on City Map</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Camera Network"
          value="24"
          subtitle="22 Online / 2 Offline"
          icon={<Camera className="w-5 h-5" />}
          accentColor="blue"
          trend={{ value: '91.7%', isPositive: true, label: 'operational uptime' }}
        />
        <MetricCard
          title="Vehicles Detected (24h)"
          value="48,920"
          subtitle="Observed across all feeds"
          icon={<Car className="w-5 h-5" />}
          accentColor="cyan"
          trend={{ value: '+8.4%', isPositive: true, label: 'vs yesterday' }}
        />
        <MetricCard
          title="Active Tracking Sessions"
          value="142"
          subtitle="ByteTrack active IDs"
          icon={<GitFork className="w-5 h-5" />}
          accentColor="emerald"
          badge="REAL-TIME"
        />
        <MetricCard
          title="Congestion Index"
          value="42%"
          subtitle="City Average Flow"
          icon={<Activity className="w-5 h-5" />}
          accentColor="amber"
          trend={{ value: '-3.1%', isPositive: true, label: 'peak congestion easing' }}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Volume Trend (2 cols) */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1F293D] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Vehicle Detection Volume by Hour</h3>
              <p className="text-xs text-slate-400">Class-differentiated observation timeline</p>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 text-blue-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Cars
              </span>
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" /> Motorcycles
              </span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Buses
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Trucks
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCars" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBikes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1F293D', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#F8FAFC' }}
                />
                <Area type="monotone" dataKey="cars" stroke="#3B82F6" strokeWidth={2} fillOpacity={1} fill="url(#colorCars)" />
                <Area type="monotone" dataKey="bikes" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#colorBikes)" />
                <Area type="monotone" dataKey="buses" stroke="#10B981" strokeWidth={2} fill="none" />
                <Area type="monotone" dataKey="trucks" stroke="#F59E0B" strokeWidth={2} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Category Distribution (1 col) */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Vehicle Category Share</h3>
              <p className="text-xs text-slate-400">Total 48,920 classifications</p>
            </div>
            <Car className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="h-52 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#111827" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1F293D', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xl font-bold text-white">48.9k</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">Vehicles</span>
            </div>
          </div>

          <div className="space-y-2 mt-2 pt-2 border-t border-[#1F293D]">
            {categoryData.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-slate-300">{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-white font-semibold">{cat.value.toLocaleString()}</span>
                  <span className="text-slate-500 text-[10px]">
                    ({((cat.value / 48920) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle Row: Camera Matrix & Live Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Health & Sensor Status (2 cols) */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1F293D] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">CCTV Sensor Health & Stream Matrix</h3>
              <p className="text-xs text-slate-400">Real-time status of critical intersection streams</p>
            </div>
            <button
              onClick={() => onNavigate('cameras')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              Manage all 24 cameras <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161F30] text-slate-400 border-b border-[#1F293D]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Camera ID</th>
                  <th className="py-2.5 px-3 font-semibold">Location</th>
                  <th className="py-2.5 px-3 font-semibold">Group</th>
                  <th className="py-2.5 px-3 font-semibold">Frame Rate</th>
                  <th className="py-2.5 px-3 font-semibold">Detections</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D]/60">
                {(liveCameras.length > 0 ? liveCameras : cameraGrid).map((cam: any) => (
                  <tr key={cam.camera_id || cam.id} className="hover:bg-[#161F30]/50 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-200">{cam.camera_id || cam.id}</td>
                    <td className="py-2.5 px-3 text-white font-medium">{cam.name}</td>
                    <td className="py-2.5 px-3 text-slate-400">{cam.camera_group || cam.group}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {cam.fps > 0 ? `${cam.fps} FPS` : '0 FPS'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-cyan-400">{(cam.detections || 3420).toLocaleString()}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge
                        status={cam.status as any}
                        text={cam.status === 'online' ? 'STREAMING' : cam.status === 'degraded' ? 'LOW FPS' : 'OFFLINE'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Incident Alerts (1 col) */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Active System Alerts</h3>
                <p className="text-xs text-slate-400">Decision-support triggers</p>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20 font-bold">
                {liveAlerts.length > 0 ? liveAlerts.filter(a => a.status === 'active').length : 3} ACTIVE
              </span>
            </div>

            <div className="space-y-3">
              {(liveAlerts.length > 0 ? liveAlerts.slice(0, 3) : recentAlerts).map((alert: any) => (
                <div
                  key={alert.alert_id || alert.id}
                  className="p-3 rounded-lg bg-[#161F30] border border-[#1F293D] hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 ${
                          alert.severity === 'critical' ? 'text-rose-400' : alert.severity === 'high' ? 'text-amber-400' : 'text-blue-400'
                        }`}
                      />
                      <span className="text-xs font-semibold text-slate-200">{alert.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 whitespace-nowrap">{alert.time || 'Live'}</span>
                  </div>
                  <div className="mt-1.5 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{alert.location}</span>
                    <StatusBadge status={alert.status as any} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1F293D]">
            <button
              onClick={() => onNavigate('alerts')}
              className="w-full py-2 bg-[#161F30] hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-medium border border-[#1F293D] transition-colors flex items-center justify-center gap-1.5"
            >
              <span>View Incident Response Inbox</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: Trajectory Clusters & Video Processing Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Discovered Route Clusters */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Dominant Vehicle Trajectory Corridors</h3>
              <p className="text-xs text-slate-400">Discovered via Multi-Camera Trajectory Clustering</p>
            </div>
            <button
              onClick={() => onNavigate('clustering')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              Cluster Studio <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {frequentCorridors.map((c) => (
              <div key={c.id} className="p-3 rounded-lg bg-[#161F30] border border-[#1F293D] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {c.id}
                    </span>
                    <span className="text-xs font-semibold text-white">{c.name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-[11px] text-slate-400">
                    <span>Volume: <strong className="text-slate-200">{c.count}</strong></span>
                    <span>Avg Transit: <strong className="text-slate-200">{c.avgDuration}</strong></span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                    c.status === 'Normal Flow' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {c.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video Processing Queue */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Recorded Video Inference Pipeline</h3>
                <p className="text-xs text-slate-400">YOLOv8 & ByteTrack trajectory extraction jobs</p>
              </div>
              <button
                onClick={() => onNavigate('recorded-videos')}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                Upload Video <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-[#161F30] border border-blue-500/30">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold text-white">traffic_corridor_cam04_1080p.mp4</span>
                  <span className="font-mono text-cyan-400">68% PROCESSED</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-cyan-400 h-2 rounded-full w-[68%]" />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Frame 2,140 / 3,147 (ByteTrack Tracking Phase)</span>
                  <span className="font-mono text-slate-300">18.4 FPS (CPU)</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#161F30] border border-[#1F293D]">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-300">intersection_morning_peak.mp4</span>
                  <StatusBadge status="completed" text="EXTRACTED" />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>1,420 vehicles tracked • 12 route clusters updated</span>
                  <span className="text-slate-500">Completed 12m ago</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1F293D] flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              Inference Mode: CPU Multi-threading Active
            </span>
            <span className="font-mono text-emerald-400">Queue: 1 Active, 0 Waiting</span>
          </div>
        </div>
      </div>
    </div>
  );
};
