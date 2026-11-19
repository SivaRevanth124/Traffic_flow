import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Search,
  ShieldAlert,
  UserCheck,
  FileEdit,
  ArrowRight,
  Eye,
  RotateCw,
  Check,
  X
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { MetricCard } from '../components/MetricCard';
import { api, AlertDto } from '../services/api';

export const IncidentAlerts: React.FC = () => {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alerts, setAlerts] = useState<AlertDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
  }, [severityFilter, statusFilter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const data = await api.getAlerts(severityFilter, statusFilter);
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load incident alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await api.updateAlert(alertId, {
        status: 'under_review',
        assigned_operator: 'Traffic Controller (OP)'
      });
      setActionMessage(`Alert ${alertId} assigned to Traffic Controller for review.`);
      loadAlerts();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      await api.updateAlert(alertId, {
        status: 'resolved',
        resolution_notes: 'Verified on live CCTV feed and resolved by operator.'
      });
      setActionMessage(`Alert ${alertId} marked as Resolved.`);
      loadAlerts();
      setTimeout(() => setActionMessage(null), 3500);
    } catch (err: any) {
      console.error('Failed to resolve alert:', err);
    }
  };

  const activeCount = alerts.filter(a => a.status === 'active').length;
  const underReviewCount = alerts.filter(a => a.status === 'under_review').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <div className="space-y-6">
      {/* Top Banner Notice */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4 flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <h3 className="font-semibold text-white">
            Operational Decision-Support: Incident & Anomaly Triage
          </h3>
          <p className="text-slate-400 mt-1">
            Real-time event inbox driven by optical density thresholds, trajectory anomaly discovery, and sensor telemetry handshakes.
            Operators can acknowledge, assign, and record resolution notes for dispatch coordination.
          </p>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Open Incidents"
          value={activeCount.toString()}
          subtitle="Awaiting operator triage"
          icon={<AlertTriangle className="w-5 h-5" />}
          accentColor="rose"
          badge={activeCount > 0 ? "ACTION REQ" : undefined}
        />
        <MetricCard
          title="Under Active Review"
          value={underReviewCount.toString()}
          subtitle="Assigned to controllers"
          icon={<Clock className="w-5 h-5" />}
          accentColor="amber"
        />
        <MetricCard
          title="Critical Severities"
          value={criticalCount.toString()}
          subtitle="Immediate dispatch priority"
          icon={<ShieldAlert className="w-5 h-5" />}
          accentColor="rose"
        />
        <MetricCard
          title="Mean Time to Triage"
          value="1.8 min"
          subtitle="Target response < 3.0 min"
          icon={<CheckCircle2 className="w-5 h-5" />}
          accentColor="emerald"
        />
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-[#111827] border border-[#1F293D] p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Severity:</span>
          </div>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#161F30] border border-[#1F293D] text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 ml-2">
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#161F30] border border-[#1F293D] text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="under_review">Under Review</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <button
          onClick={loadAlerts}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161F30] hover:bg-[#1E293B] text-slate-300 rounded-lg text-xs border border-[#1F293D] transition-colors"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Alerts
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            <RotateCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
            Fetching active incident queue...
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No incident alerts matching current criteria.
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.alert_id}
              className={`p-4 rounded-xl border transition-all ${
                alert.status === 'resolved'
                  ? 'bg-[#111827]/60 border-[#1F293D]/60 opacity-75'
                  : alert.severity === 'critical'
                  ? 'bg-rose-500/[0.04] border-rose-500/30'
                  : 'bg-[#111827] border-[#1F293D]'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-slate-400">{alert.alert_id}</span>
                  <StatusBadge status={alert.severity} text={alert.severity.toUpperCase()} />
                  <StatusBadge status={alert.status} />
                  <span className="text-xs font-semibold text-white">{alert.title}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">{alert.created_at}</span>
              </div>

              <p className="text-xs text-slate-300 mb-3">{alert.description}</p>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#1F293D] text-xs">
                <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
                  <span>Location: <strong className="text-white font-sans">{alert.location}</strong></span>
                  <span>Sensor: <strong className="text-cyan-400">{alert.camera_id}</strong></span>
                  <span>Operator: <strong className="text-slate-200">{alert.assigned_operator || 'Unassigned'}</strong></span>
                </div>

                <div className="flex items-center gap-2">
                  {alert.status === 'active' && (
                    <button
                      onClick={() => handleAcknowledge(alert.alert_id)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Acknowledge
                    </button>
                  )}
                  {alert.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolve(alert.alert_id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" /> Resolve Incident
                    </button>
                  )}
                  {alert.status === 'resolved' && (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Incident Cleared
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
