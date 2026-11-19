import React, { ReactNode } from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  accentColor?: 'blue' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple';
  badge?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accentColor = 'blue',
  badge
}) => {
  const getAccentBg = () => {
    switch (accentColor) {
      case 'cyan':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'emerald':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'amber':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'rose':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'purple':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'blue':
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  return (
    <div className="bg-[#111827]/80 backdrop-blur-sm border border-[#1F293D] rounded-xl p-5 hover:border-slate-700/80 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
            {badge && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                {badge}
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-white flex items-baseline gap-2">
            <span>{value}</span>
            {subtitle && <span className="text-xs font-normal text-slate-400">{subtitle}</span>}
          </div>
        </div>
        <div className={`p-3 rounded-lg border ${getAccentBg()}`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 pt-3 border-t border-[#1F293D]/70 flex items-center gap-1.5 text-xs">
          <span className={`font-semibold ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {trend.value}
          </span>
          <span className="text-slate-400">{trend.label || 'vs last period'}</span>
        </div>
      )}
    </div>
  );
};
