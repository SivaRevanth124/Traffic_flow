import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Key,
  Lock,
  UserPlus,
  Eye,
  CheckCircle,
  Clock,
  ShieldCheck,
  FileText,
  RefreshCw,
  X,
  AlertTriangle,
  UserCheck,
  UserX
} from 'lucide-react';
import { api, UserDto, AuditLogDto } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';

export const UsersRoles: React.FC = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // New User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    role: 'operator',
    password: '',
  });

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [usersData, logsData] = await Promise.all([
        api.getUsers(),
        api.getAuditLogs(30),
      ]);
      setUsers(usersData);
      setAuditLogs(logsData);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to authentication server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);
    try {
      await api.createUser({
        username: formData.username.trim(),
        email: formData.email.trim(),
        full_name: formData.full_name.trim() || undefined,
        password: formData.password,
        role: formData.role,
      });
      setIsModalOpen(false);
      setFormData({
        username: '',
        full_name: '',
        email: '',
        role: 'operator',
        password: '',
      });
      setActionSuccess(`User '${formData.username}' created successfully.`);
      setTimeout(() => setActionSuccess(null), 3000);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create user');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (user: UserDto) => {
    try {
      const newStatus = !user.is_active;
      await api.updateUserStatus(user.id, newStatus);
      setActionSuccess(`User '${user.username}' status updated to ${newStatus ? 'Active' : 'Deactivated'}.`);
      setTimeout(() => setActionSuccess(null), 3000);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to toggle user status');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toLowerCase()) {
      case 'administrator':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'operator':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'analyst':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      case 'viewer':
      default:
        return 'bg-slate-700/30 text-slate-400 border-slate-700/50';
    }
  };

  const formatTimestamp = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Privacy & Authorization Notice */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4 flex items-start gap-3">
        <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="text-xs">
          <h3 className="font-semibold text-white">
            Role-Based Access Control (RBAC) & Privacy Protection Architecture
          </h3>
          <p className="text-slate-400 mt-1">
            ANPR / Number-Plate identification is disabled by default and restricted exclusively to authorized municipal jurisdictions. Camera credentials are AES-256 encrypted at rest and never exposed to the frontend browser runtime.
          </p>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1F293D] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Authorized Platform Users</h3>
            <p className="text-xs text-slate-400">Personnel with authenticated console credentials</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 rounded-lg bg-[#161F30] border border-[#1F293D] text-slate-400 hover:text-white transition-colors"
              title="Refresh users and logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add User
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161F30] text-slate-400 border-b border-[#1F293D]">
              <tr>
                <th className="py-3 px-4 font-semibold">User Details</th>
                <th className="py-3 px-4 font-semibold">Security Role</th>
                <th className="py-3 px-4 font-semibold">Superuser</th>
                <th className="py-3 px-4 font-semibold">Account Status</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D]/60">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-[#161F30]/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{u.full_name || u.username}</div>
                    <div className="font-mono text-slate-400 text-[11px] mt-0.5">
                      @{u.username} &bull; {u.email}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold border capitalize ${getRoleBadge(u.role)}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {u.is_superuser ? (
                      <span className="text-amber-400 font-mono flex items-center gap-1 text-[11px]">
                        <CheckCircle className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-[11px]">No</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge
                      status={u.is_active ? 'online' : 'offline'}
                      text={u.is_active ? 'ACTIVE' : 'DEACTIVATED'}
                    />
                  </td>
                  <td className="py-3 px-4 text-right">
                    {u.username !== 'admin' && (
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className={`text-xs px-2 py-1 rounded font-medium transition-colors ${
                          u.is_active
                            ? 'text-rose-400 hover:bg-rose-500/10'
                            : 'text-emerald-400 hover:bg-emerald-500/10'
                        }`}
                      >
                        {u.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {users.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No registered platform accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Audit Log */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Immutable Security Audit Trail</h3>
            <p className="text-xs text-slate-400">Cryptographically verifiable system administrative operations</p>
          </div>
          <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            Live Audit Stream ({auditLogs.length} events)
          </span>
        </div>

        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-3 rounded-lg bg-[#161F30] border border-[#1F293D] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-cyan-400 text-[11px]">AUD-{log.id}</span>
                <span className="text-white font-semibold">{log.actor_username}</span>
                <span className="px-1.5 py-0.5 rounded bg-[#111827] border border-[#1F293D] text-[10px] font-mono text-slate-300">
                  {log.action}
                </span>
                {log.details && (
                  <span className="text-slate-400 hidden md:inline truncate max-w-md">
                    {log.details}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-slate-500 font-mono text-[11px]">
                <span>{log.ip_address}</span>
                <span>{formatTimestamp(log.timestamp)}</span>
              </div>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <div className="p-4 text-center text-slate-500 text-xs">
              No audit log events recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#1F293D] rounded-xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-[#1F293D] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Register Platform User</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-4 text-xs">
              {modalError && (
                <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. officer_chen"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full bg-[#161F30] border border-[#1F293D] rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Wei Chen"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full bg-[#161F30] border border-[#1F293D] rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="chen@traffic.city.gov"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-[#161F30] border border-[#1F293D] rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Security Role *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-[#161F30] border border-[#1F293D] rounded-lg p-2.5 text-white"
                >
                  <option value="administrator">Administrator (Full System & Security Privileges)</option>
                  <option value="operator">Traffic Operator (Triage, Streams & Verifications)</option>
                  <option value="analyst">Analyst (Trajectories, ML Clustering & Reports)</option>
                  <option value="viewer">Viewer (Read-Only Access)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Initial Password *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-[#161F30] border border-[#1F293D] rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#1F293D]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-[#161F30] text-slate-300 hover:text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  {modalLoading ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
