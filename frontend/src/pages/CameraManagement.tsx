import React, { useState, useEffect } from 'react';
import {
  Camera,
  Plus,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Edit2,
  Trash2,
  MapPin,
  Activity,
  Layers
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import { api, CameraDto } from '../services/api';

export const CameraManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [cameras, setCameras] = useState<CameraDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [testingCamId, setTestingCamId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Form state
  const [newCamId, setNewCamId] = useState('');
  const [newName, setNewName] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newLat, setNewLat] = useState('40.7128');
  const [newLng, setNewLng] = useState('-74.0060');
  const [newGroup, setNewGroup] = useState('Downtown Core');
  const [newType, setNewType] = useState('Fixed Dome');
  const [newRtsp, setNewRtsp] = useState('');

  const loadCameras = async () => {
    setIsLoading(true);
    try {
      const data = await api.getCameras(selectedGroup);
      setCameras(data);
    } catch (err) {
      console.error('Failed to load cameras, using local fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCameras();
  }, [selectedGroup]);

  const handleTestConnection = async (cameraId: string) => {
    setTestingCamId(cameraId);
    try {
      const result = await api.testCameraConnection(cameraId);
      setActionMessage(
        `Sensor ${cameraId}: ${result.is_reachable ? `Handshake Successful (${result.latency_ms}ms)` : `Unreachable (${result.error_message || 'Offline'})`}`
      );
      loadCameras();
    } catch (err: any) {
      setActionMessage(`Test failed for ${cameraId}: ${err.message}`);
    } finally {
      setTestingCamId(null);
      setTimeout(() => setActionMessage(null), 4000);
    }
  };

  const handleDeleteCamera = async (cameraId: string) => {
    if (!window.confirm(`Are you sure you want to decommission camera '${cameraId}'?`)) return;
    try {
      await api.deleteCamera(cameraId);
      setActionMessage(`Camera ${cameraId} decommissioned.`);
      loadCameras();
    } catch (err: any) {
      setActionMessage(`Failed to delete: ${err.message}`);
    } finally {
      setTimeout(() => setActionMessage(null), 3000);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamId || !newName || !newLocation) {
      alert('Please fill all required fields');
      return;
    }
    try {
      await api.registerCamera({
        camera_id: newCamId,
        name: newName,
        location: newLocation,
        latitude: parseFloat(newLat) || 40.7128,
        longitude: parseFloat(newLng) || -74.0060,
        camera_type: newType,
        camera_group: newGroup,
        rtsp_url: newRtsp || undefined,
        fps: 30,
        resolution: '1920x1080',
        detection_active: true
      });
      setShowAddModal(false);
      setActionMessage(`Camera ${newCamId} registered successfully!`);
      // Reset form
      setNewCamId('');
      setNewName('');
      setNewLocation('');
      setNewRtsp('');
      loadCameras();
    } catch (err: any) {
      alert(`Error registering camera: ${err.message}`);
    }
  };

  const filteredCameras = cameras.filter((cam) => {
    const matchesSearch =
      cam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cam.camera_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cam.camera_group.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const onlineCount = cameras.filter(c => c.status === 'online').length;
  const degradedCount = cameras.filter(c => c.status === 'degraded').length;
  const offlineCount = cameras.filter(c => c.status === 'offline').length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionMessage && (
        <div className="bg-blue-600/20 border border-blue-500/40 text-blue-300 px-4 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111827] border border-[#1F293D] p-4 rounded-xl">
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Camera ID, location, or group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#161F30] border border-[#1F293D] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <select
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            className="bg-[#161F30] border border-[#1F293D] rounded-lg text-xs text-slate-200 px-3 py-2 focus:outline-none"
          >
            <option value="all">All Groups</option>
            <option value="Downtown Core">Downtown Core</option>
            <option value="Highways">Highways</option>
            <option value="Logistics">Logistics</option>
            <option value="Special Zones">Special Zones</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Register Camera
          </button>
        </div>
      </div>

      {/* Camera Grid/Table */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1F293D] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Registered Optical Sensors ({filteredCameras.length})
            </h3>
            <p className="text-xs text-slate-400">
              Synchronized with FastAPI backend SQLite registry & ONVIF handshake gateway
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Online: {onlineCount}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> Degraded: {degradedCount}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400" /> Offline: {offlineCount}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#161F30] text-slate-400 border-b border-[#1F293D]">
              <tr>
                <th className="py-3 px-4 font-semibold">Camera Details</th>
                <th className="py-3 px-4 font-semibold">Coordinates</th>
                <th className="py-3 px-4 font-semibold">Stream Gateway</th>
                <th className="py-3 px-4 font-semibold">Resolution & FPS</th>
                <th className="py-3 px-4 font-semibold">Status & Last Ping</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F293D]/60">
              {filteredCameras.map((cam) => (
                <tr key={cam.camera_id} className="hover:bg-[#161F30]/40 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{cam.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-cyan-400 text-[11px] font-bold">{cam.camera_id}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 text-[11px]">{cam.camera_group}</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400 text-[11px]">{cam.camera_type}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-slate-300 text-[11px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {cam.latitude.toFixed(4)}, {cam.longitude.toFixed(4)}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-mono text-slate-400 text-[11px] max-w-[200px] truncate" title={cam.rtsp_url_masked}>
                      {cam.rtsp_url_masked || 'None'}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-200">{cam.resolution}</div>
                    <div className="font-mono text-slate-400 text-[11px]">{cam.fps} FPS</div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge
                      status={cam.status as any}
                      text={cam.status === 'online' ? 'STREAMING' : cam.status === 'degraded' ? 'DEGRADED' : 'OFFLINE'}
                    />
                    <div className="text-[10px] text-slate-500 mt-1 font-mono">
                      {cam.last_ping ? new Date(cam.last_ping).toLocaleTimeString() : 'No ping'}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleTestConnection(cam.camera_id)}
                        disabled={testingCamId === cam.camera_id}
                        title="Execute Active RTSP Connection Probe"
                        className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${testingCamId === cam.camera_id ? 'animate-spin text-cyan-400' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDeleteCamera(cam.camera_id)}
                        title="Decommission Sensor"
                        className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Camera Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form onSubmit={handleRegisterSubmit} className="bg-[#111827] border border-[#1F293D] rounded-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1F293D]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-500" /> Register Authorized CCTV Camera
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Camera ID *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CAM-007"
                    value={newCamId}
                    onChange={(e) => setNewCamId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161F30] border border-[#1F293D] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Camera Group *</label>
                  <select
                    value={newGroup}
                    onChange={(e) => setNewGroup(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161F30] border border-[#1F293D] rounded-lg text-white"
                  >
                    <option>Downtown Core</option>
                    <option>Highways</option>
                    <option>Logistics</option>
                    <option>Special Zones</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Camera Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. West End Ring Road Feeder"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161F30] border border-[#1F293D] rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Location Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Junction of Ring Road & Expressway Sector 4"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161F30] border border-[#1F293D] rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Latitude (WGS84)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLat}
                    onChange={(e) => setNewLat(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161F30] border border-[#1F293D] rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Longitude (WGS84)</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newLng}
                    onChange={(e) => setNewLng(e.target.value)}
                    className="w-full px-3 py-2 bg-[#161F30] border border-[#1F293D] rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Camera Hardware Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161F30] border border-[#1F293D] rounded-lg text-white"
                >
                  <option>Fixed Dome</option>
                  <option>PTZ 360</option>
                  <option>Fixed ANPR</option>
                  <option>Fixed Thermal</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">RTSP Stream URI</label>
                <input
                  type="text"
                  placeholder="rtsp://user:pass@camera-ip:554/stream1"
                  value={newRtsp}
                  onChange={(e) => setNewRtsp(e.target.value)}
                  className="w-full px-3 py-2 bg-[#161F30] border border-[#1F293D] rounded-lg text-white font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Credentials are encrypted at rest and masked in frontend responses.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1F293D]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm"
              >
                Register & Commit to Database
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
