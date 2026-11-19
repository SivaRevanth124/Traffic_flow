import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  RefreshCw,
  Shield,
  Layers,
  CircleDot
} from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onRefresh,
  isRefreshing = false
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-[#0E1526]/90 backdrop-blur-md border-b border-[#1F293D] px-6 flex items-center justify-between z-20 shrink-0">
      {/* Title & Page breadcrumb */}
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-400 font-normal">{subtitle}</p>
        )}
      </div>

      {/* Middle Search & Zone Selector */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search cameras, trajectory IDs, alerts..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#161F30] border border-[#1F293D] rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161F30] border border-[#1F293D] rounded-lg text-xs text-slate-300">
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-medium text-slate-400">Sector:</span>
          <span className="font-semibold text-white">Central City Grid</span>
        </div>
      </div>

      {/* Right Telemetry & Controls */}
      <div className="flex items-center gap-3">
        {/* Real-time Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
          <CircleDot className="w-3.5 h-3.5 animate-ping text-emerald-400" />
          <span>NETWORK ONLINE</span>
        </div>

        {/* Live Clock */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161F30] border border-[#1F293D] text-xs font-mono text-slate-300">
          <span className="text-slate-500">SYS:</span>
          <span className="font-bold text-white">{timeStr || '00:00:00'}</span>
        </div>

        {/* Manual Sync Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Refresh State"
            className="p-2 rounded-lg bg-[#161F30] border border-[#1F293D] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        )}

        {/* Alerts Notification Button */}
        <button
          title="Incident Alerts"
          className="relative p-2 rounded-lg bg-[#161F30] border border-[#1F293D] text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0B0F19]" />
        </button>

        {/* Operator Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-[#1F293D]">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-xs">
            OP
          </div>
          <div className="hidden sm:block text-left text-xs">
            <div className="font-semibold text-slate-200">Traffic Controller</div>
            <div className="text-[10px] text-slate-400 flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-blue-400" /> Auth Admin
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
