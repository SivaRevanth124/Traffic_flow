import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Car,
  Calendar,
  Layers,
  Clock,
  ArrowUpRight,
  Download,
  RotateCw
} from 'lucide-react';
import { MetricCard } from '../components/MetricCard';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { api, AnalyticsOverviewDto } from '../services/api';

export const TrafficAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsOverviewDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const data = await api.getAnalyticsOverview();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load traffic analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const cameraCounts = [
    { name: 'CAM-001 (Main St)', cars: 2200, trucks: 270, buses: 960, bikes: 490 },
    { name: 'CAM-002 (Ring Road N)', cars: 3600, trucks: 850, buses: 420, bikes: 250 },
    { name: 'CAM-003 (Harbor Toll)', cars: 1800, trucks: 2100, buses: 180, bikes: 200 },
    { name: 'CAM-004 (Airport Express)', cars: 2400, trucks: 410, buses: 320, bikes: 150 },
    { name: 'CAM-005 (Hospital Access)', cars: 1200, trucks: 140, buses: 280, bikes: 90 },
    { name: 'CAM-006 (University Blvd)', cars: 850, trucks: 40, buses: 310, bikes: 620 },
  ];

  const handleExportCSV = () => {
    window.open(api.getTrajectoryExportCsvUrl(), '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="bg-[#111827] border border-[#1F293D] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">City Traffic Analytics & Volume Patterns</h2>
          <p className="text-xs text-slate-400">Classified multi-sensor optical observation analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#161F30] px-3 py-1.5 rounded-lg border border-[#1F293D] text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span>Past 7 Days (Telemetry Window)</span>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export Data (CSV)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Daily Observed Volume"
          value={analytics ? analytics.summary.daily_traffic_volume.toLocaleString() : '48,920'}
          subtitle="Classified optical targets"
          icon={<Car className="w-5 h-5" />}
          accentColor="blue"
          trend={{ value: '+5.2%', isPositive: true, label: 'vs baseline' }}
        />
        <MetricCard
          title="Morning Peak Window"
          value={analytics ? analytics.summary.peak_hour_morning.split(' ')[0] + ' ' + analytics.summary.peak_hour_morning.split(' ')[1] : '08:15 AM'}
          subtitle="Northern Arterial corridor"
          icon={<Clock className="w-5 h-5" />}
          accentColor="amber"
        />
        <MetricCard
          title="Avg Network Speed"
          value={analytics ? `${analytics.summary.average_network_speed_kmh} km/h` : '46.8 km/h'}
          subtitle="Across monitored segments"
          icon={<TrendingUp className="w-5 h-5" />}
          accentColor="cyan"
        />
        <MetricCard
          title="Network Efficiency"
          value={analytics ? `${analytics.summary.network_efficiency_index}%` : '78.4%'}
          subtitle="Flow continuity index"
          icon={<Layers className="w-5 h-5" />}
          accentColor="emerald"
        />
      </div>

      {/* Camera-wise Classified Vehicle Volumes */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Camera Sensor Vehicle Category Distribution</h3>
            <p className="text-xs text-slate-400">Differentiated count of classified targets per primary corridor</p>
          </div>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={cameraCounts} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" vertical={false} />
              <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1F293D', borderRadius: '8px', fontSize: '11px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="cars" name="Cars" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="bikes" name="Motorcycles" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              <Bar dataKey="trucks" name="Trucks" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              <Bar dataKey="buses" name="Buses" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Profile and Top Corridors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Profile Line Chart */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">Weekly Day-by-Day Traffic Volume</h3>
          <p className="text-xs text-slate-400 mb-4">Daily volume variations across Monday to Sunday</p>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics?.weekly_profile || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1F293D', borderRadius: '8px', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="volume" stroke="#3B82F6" strokeWidth={3} dot={{ r: 4, fill: '#3B82F6' }} name="Volume" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Arterial Corridors List */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Busiest Corridors (24h Volume)</h3>
            <p className="text-xs text-slate-400 mb-4">Ranked by aggregate multi-camera vehicle counts</p>

            <div className="space-y-3">
              {(analytics?.top_corridors_by_volume || [
                { corridor: "CAM-001 → CAM-002 (Northern Ring Road)", volume_24h: 14290, speed_avg: 42.5 },
                { corridor: "CAM-003 → CAM-004 (Harbor-Airport Expressway)", volume_24h: 11840, speed_avg: 68.2 },
                { corridor: "CAM-002 → CAM-005 (Hospital / Industrial Link)", volume_24h: 7650, speed_avg: 38.0 },
                { corridor: "CAM-001 → CAM-006 (University Campus Connector)", volume_24h: 5820, speed_avg: 31.4 }
              ]).map((c, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-[#161F30] border border-[#1F293D] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-white block">{c.corridor}</span>
                    <span className="text-[11px] text-slate-400 font-mono">Mean Speed: {c.speed_avg} km/h</span>
                  </div>
                  <span className="font-mono font-bold text-cyan-400">
                    {c.volume_24h.toLocaleString()} vpd
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1F293D] text-[11px] text-slate-500">
            Analytics aggregated from optical sensor detection logs & cross-camera telemetry.
          </div>
        </div>
      </div>
    </div>
  );
};
