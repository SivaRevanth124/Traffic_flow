import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  TrendingUp,
  MapPin,
  ShieldAlert,
  ArrowUpRight,
  Info,
  RotateCw
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
  ResponsiveContainer
} from 'recharts';
import { api, CongestionJunctionDto } from '../services/api';

export const CongestionMonitoring: React.FC = () => {
  const [selectedCorridor, setSelectedCorridor] = useState('Ring Road North');
  const [junctions, setJunctions] = useState<CongestionJunctionDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCongestionData();
  }, []);

  const loadCongestionData = async () => {
    setLoading(true);
    try {
      const data = await api.getCongestionMonitoring();
      setJunctions(data);
    } catch (err) {
      console.error('Failed to load congestion data:', err);
    } finally {
      setLoading(false);
    }
  };

  const congestionTrend = [
    { time: '06:00', index: 24, speed: 62 },
    { time: '07:00', index: 48, speed: 45 },
    { time: '08:00', index: 88, speed: 18 },
    { time: '09:00', index: 82, speed: 22 },
    { time: '10:00', index: 54, speed: 40 },
    { time: '11:00', index: 42, speed: 48 },
    { time: '12:00', index: 46, speed: 46 },
    { time: '13:00', index: 40, speed: 50 },
    { time: '14:00', index: 44, speed: 48 },
    { time: '15:00', index: 58, speed: 38 },
    { time: '16:00', index: 76, speed: 26 },
    { time: '17:00', index: 92, speed: 14 },
    { time: '18:00', index: 84, speed: 20 },
    { time: '19:00', index: 60, speed: 36 },
  ];

  const getStatusFromOccupancy = (occ: number) => {
    if (occ >= 80) return 'critical';
    if (occ >= 60) return 'high';
    if (occ >= 40) return 'medium';
    return 'low';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
      case 'high':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'medium':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default:
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Methodological Notice */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4 flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <h3 className="font-semibold text-white">
            Engineering Methodology: Density & Level-of-Service (LOS) Estimation
          </h3>
          <p className="text-slate-400 mt-1">
            Congestion indices are calculated via optical vehicle occupancy and inter-frame displacement.
            Estimated queue lengths are derived from calibrated bounding box density rather than uncalibrated GPS. Speed estimation is enabled strictly on calibrated highway segments.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="City Congestion Index"
          value="42 / 100"
          subtitle="Moderate traffic conditions"
          icon={<Activity className="w-5 h-5" />}
          accentColor="blue"
        />
        <MetricCard
          title="Critical Bottlenecks"
          value="1 Node"
          subtitle="Ring Road Northern Overpass (LOS E)"
          icon={<AlertTriangle className="w-5 h-5" />}
          accentColor="amber"
          badge="ALERT ACTIVE"
        />
        <MetricCard
          title="Average Network Delay"
          value="+4.2 min"
          subtitle="Relative to free-flow baseline"
          icon={<Clock className="w-5 h-5" />}
          accentColor="cyan"
        />
        <MetricCard
          title="Peak Flow Corridor"
          value="1,840 vph"
          subtitle="Northern Arterial Ring Road"
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="emerald"
        />
      </div>

      {/* Trend Area Chart */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white">Hourly Congestion Index vs Average Speed</h3>
            <p className="text-xs text-slate-400">Diurnal profile highlighting morning (08:00) and evening (17:00) peaks</p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-cyan-400">
              <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block"></span> Congestion Index (%)
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span> Avg Speed (km/h)
            </span>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={congestionTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorIndex" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorSpeed" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
              <XAxis dataKey="time" stroke="#64748B" fontSize={11} />
              <YAxis stroke="#64748B" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1F293D', borderRadius: '8px', fontSize: '11px' }}
              />
              <Area type="monotone" dataKey="index" stroke="#06B6D4" fillOpacity={1} fill="url(#colorIndex)" strokeWidth={2} name="Congestion Index" />
              <Area type="monotone" dataKey="speed" stroke="#3B82F6" fillOpacity={1} fill="url(#colorSpeed)" strokeWidth={2} name="Speed (km/h)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monitored Corridors & Road Segments Table */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1F293D] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Monitored Junction Segments</h3>
            <p className="text-xs text-slate-400">Live Level of Service (LOS), occupancy percentage, and queue lengths</p>
          </div>
          <button
            onClick={loadCongestionData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161F30] hover:bg-[#1E293B] text-slate-300 rounded-lg text-xs border border-[#1F293D] transition-colors"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <RotateCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
              Loading junction telemetry...
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161F30] text-slate-400 border-b border-[#1F293D]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Sensor & Junction</th>
                  <th className="py-3 px-4 font-semibold">Level of Service (LOS)</th>
                  <th className="py-3 px-4 font-semibold">Occupancy Rate</th>
                  <th className="py-3 px-4 font-semibold">Estimated Queue Length</th>
                  <th className="py-3 px-4 font-semibold">Average Delay</th>
                  <th className="py-3 px-4 font-semibold">Flow Rate (vph)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D]/60">
                {junctions.map((seg) => {
                  const severity = getStatusFromOccupancy(seg.occupancy_pct);
                  return (
                    <tr key={seg.camera_id} className="hover:bg-[#161F30]/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{seg.name}</div>
                        <div className="font-mono text-slate-400 text-[11px] mt-0.5">
                          {seg.camera_id} • {seg.location}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getStatusColor(severity)}`}>
                          {seg.level_of_service}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-1">{seg.status_label}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                seg.occupancy_pct >= 80 ? 'bg-rose-500' : seg.occupancy_pct >= 50 ? 'bg-amber-400' : 'bg-emerald-400'
                              }`}
                              style={{ width: `${Math.min(100, seg.occupancy_pct)}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-white">
                            {seg.occupancy_pct.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-200">
                        {seg.estimated_queue_m > 0 ? `~${seg.estimated_queue_m} meters` : 'None (Free Flow)'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-200">
                        {seg.average_delay_sec > 0 ? `+${seg.average_delay_sec.toFixed(0)}s delay` : '0s'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                        {seg.flow_rate_vph > 0 ? `${seg.flow_rate_vph} vph` : '0 vph'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
