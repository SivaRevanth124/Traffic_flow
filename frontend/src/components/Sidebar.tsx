import React from 'react';
import {
  LayoutDashboard,
  Camera,
  Grid3X3,
  Video,
  ScanEye,
  GitFork,
  Route,
  Network,
  MapPin,
  Activity,
  AlertTriangle,
  BarChart3,
  Database,
  Users,
  FileText,
  Sliders,
  Radio,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import { NavPage } from '../types';

interface SidebarProps {
  currentPage: NavPage;
  onSelectPage: (page: NavPage) => void;
  collapsed?: boolean;
}

interface NavItem {
  id: NavPage;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  badgeType?: 'info' | 'warning' | 'alert';
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, onSelectPage }) => {
  const sections: NavSection[] = [
    {
      title: 'MONITORING',
      items: [
        { id: 'command-center', label: 'Command Center', icon: <LayoutDashboard className="w-4 h-4" /> },
        { id: 'cameras', label: 'Camera Management', icon: <Camera className="w-4 h-4" />, badge: '24' },
        { id: 'video-wall', label: 'Live Video Wall', icon: <Grid3X3 className="w-4 h-4" />, badge: 'LIVE', badgeType: 'alert' },
        { id: 'recorded-videos', label: 'Recorded Videos', icon: <Video className="w-4 h-4" /> },
      ],
    },
    {
      title: 'AI INTELLIGENCE',
      items: [
        { id: 'detection', label: 'Vehicle Detection', icon: <ScanEye className="w-4 h-4" />, badge: 'YOLOv8' },
        { id: 'tracking', label: 'Vehicle Tracking', icon: <GitFork className="w-4 h-4" />, badge: 'ByteTrack' },
        { id: 'trajectories', label: 'Trajectory Explorer', icon: <Route className="w-4 h-4" /> },
        { id: 'clustering', label: 'Route Clustering', icon: <Network className="w-4 h-4" />, badge: 'ML' },
      ],
    },
    {
      title: 'TRAFFIC OPERATIONS',
      items: [
        { id: 'traffic-map', label: 'City Traffic Map', icon: <MapPin className="w-4 h-4" /> },
        { id: 'congestion', label: 'Congestion Monitoring', icon: <Activity className="w-4 h-4" /> },
        { id: 'alerts', label: 'Incident Alerts', icon: <AlertTriangle className="w-4 h-4" />, badge: '3', badgeType: 'warning' },
        { id: 'analytics', label: 'Traffic Analytics', icon: <BarChart3 className="w-4 h-4" /> },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'datasets', label: 'Dataset Management', icon: <Database className="w-4 h-4" /> },
        { id: 'users', label: 'Users & Roles', icon: <Users className="w-4 h-4" /> },
        { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
        { id: 'settings', label: 'System Settings', icon: <Sliders className="w-4 h-4" /> },
      ],
    },
  ];

  return (
    <aside className="w-72 bg-[#0B0F19] border-r border-[#1F293D] flex flex-col h-screen select-none shrink-0 z-30">
      {/* Platform Branding */}
      <div className="px-5 py-4 border-b border-[#1F293D] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Radio className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-tight text-white text-base">TrafficFlow</span>
              <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-[10px] font-mono font-semibold">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">City Traffic Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="px-3 mb-1.5 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectPage(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-[#161F30]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          item.badgeType === 'alert'
                            ? isActive ? 'bg-white/20 text-white' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : item.badgeType === 'warning'
                            ? isActive ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Telemetry Card */}
      <div className="p-3 border-t border-[#1F293D] bg-[#0E1526]">
        <div className="p-2.5 rounded-lg bg-[#111827] border border-[#1F293D] text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Edge Inference
            </span>
            <span className="text-emerald-400 font-mono font-medium">Ready (CPU)</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Gateway
            </span>
            <span className="text-slate-300 font-mono">127.0.0.1:8000</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
