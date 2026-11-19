import React from 'react';

interface StatusBadgeProps {
  status: 'online' | 'offline' | 'degraded' | 'testing' | 'active' | 'resolved' | 'critical' | 'high' | 'medium' | 'low' | 'completed' | 'processing' | 'pending' | 'under_review' | 'dismissed';
  text?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, text, className = '' }) => {
  const getStyles = () => {
    switch (status) {
      case 'online':
      case 'active':
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'offline':
      case 'critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'degraded':
      case 'high':
      case 'processing':
      case 'under_review':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'medium':
      case 'testing':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'low':
      case 'resolved':
      case 'pending':
      default:
        return 'bg-slate-700/30 text-slate-400 border-slate-700/50';
    }
  };

  const getDotColor = () => {
    switch (status) {
      case 'online':
      case 'active':
      case 'completed':
        return 'bg-emerald-400';
      case 'offline':
      case 'critical':
        return 'bg-rose-400';
      case 'degraded':
      case 'high':
      case 'processing':
        return 'bg-amber-400';
      case 'medium':
        return 'bg-blue-400';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStyles()} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()} animate-pulse`} />
      {text || status.toUpperCase()}
    </span>
  );
};
