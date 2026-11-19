import React, { useState, useEffect } from 'react';
import {
  Route,
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  Layers,
  MapPin,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  RotateCw,
  X,
  FileSpreadsheet,
  FileCode,
  Compass
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import {
  api,
  TrajectoryDto,
  TrajectoryDetailDto
} from '../services/api';

export const TrajectoryExplorer: React.FC = () => {
  const [trajectories, setTrajectories] = useState<TrajectoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTrajectory, setSelectedTrajectory] = useState<TrajectoryDetailDto | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);

  useEffect(() => {
    loadTrajectories();
  }, [categoryFilter]);

  const loadTrajectories = async (searchOverride?: string) => {
    setLoading(true);
    try {
      const qSearch = searchOverride !== undefined ? searchOverride : searchTerm;
      const data = await api.getTrajectories(categoryFilter, undefined, qSearch);
      setTrajectories(data);
    } catch (err) {
      console.error('Failed to load trajectories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTrajectories(searchTerm);
  };

  const handleInspectTrajectory = async (trajectoryId: string) => {
    setDetailLoading(true);
    try {
      const detail = await api.getTrajectoryDetail(trajectoryId);
      setSelectedTrajectory(detail);
    } catch (err) {
      console.error('Failed to load trajectory detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'car':
        return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      case 'motorcycle':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'bus':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'truck':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-[#111827] border border-[#1F293D] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search trajectory ID, vehicle, or camera corridor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#161F30] border border-[#1F293D] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Search
          </button>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#161F30] border border-[#1F293D] rounded-lg text-xs text-slate-200 px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Vehicles</option>
            <option value="car">Cars</option>
            <option value="motorcycle">Motorcycles</option>
            <option value="bus">Buses</option>
            <option value="truck">Trucks</option>
          </select>
        </form>

        <div className="flex items-center gap-2">
          <a
            href={api.getTrajectoryExportGeoJsonUrl()}
            download="trafficflow_trajectories.geojson"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#161F30] hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold border border-[#1F293D] transition-colors"
          >
            <FileCode className="w-3.5 h-3.5 text-cyan-400" /> Export GeoJSON
          </a>

          <a
            href={api.getTrajectoryExportCsvUrl()}
            download="trafficflow_trajectories.csv"
            className="flex items-center gap-1.5 px-3 py-2 bg-[#161F30] hover:bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold border border-[#1F293D] transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
          </a>
        </div>
      </div>

      {/* Trajectories Table */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl overflow-hidden">
        <div className="p-4 border-b border-[#1F293D] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Reconstructed Vehicle Trajectories</h3>
            <p className="text-xs text-slate-400">Time-ordered camera hops with spatial-temporal observation linkage</p>
          </div>
          <span className="text-xs font-mono text-slate-400">{trajectories.length} Trajectories Loaded</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">
              <RotateCw className="w-6 h-6 animate-spin mx-auto text-blue-500 mb-2" />
              Loading trajectory database...
            </div>
          ) : trajectories.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No reconstructed trajectories matching search criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161F30] text-slate-400 border-b border-[#1F293D]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Trajectory ID</th>
                  <th className="py-3 px-4 font-semibold">Vehicle Class</th>
                  <th className="py-3 px-4 font-semibold">Camera Sequence & Route Path</th>
                  <th className="py-3 px-4 font-semibold">Transit Duration & Dist</th>
                  <th className="py-3 px-4 font-semibold">Cluster Assignment</th>
                  <th className="py-3 px-4 font-semibold">Link Confidence</th>
                  <th className="py-3 px-4 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D]/60">
                {trajectories.map((trj) => (
                  <tr key={trj.id} className="hover:bg-[#161F30]/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">{trj.trajectory_id}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getCategoryBadgeClass(trj.vehicle_category)}`}>
                        {trj.vehicle_category.toUpperCase()}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1">{trj.vehicle_description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {trj.camera_names.map((cam, idx) => (
                          <React.Fragment key={cam}>
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-medium">
                              {cam}
                            </span>
                            {idx < trj.camera_names.length - 1 && (
                              <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-white font-semibold">{trj.duration_str}</div>
                      <div className="text-slate-500 text-[10px]">{trj.distance_km} km • {trj.total_observations} obs</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {trj.cluster_label}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-emerald-400 font-bold">{(trj.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleInspectTrajectory(trj.trajectory_id)}
                        title="Inspect Trajectory"
                        className="p-1.5 rounded bg-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Trajectory Detailed Inspection Modal */}
      {selectedTrajectory && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#111827] border border-[#1F293D] rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#1F293D] pb-3">
              <div>
                <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                  {selectedTrajectory.trajectory_id}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedTrajectory.vehicle_description}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTrajectory(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#161F30]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Trajectory Telemetry Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#0B0F19] p-3 rounded-lg border border-[#1F293D]">
                <span className="text-slate-400 block">Category</span>
                <span className="font-semibold text-white capitalize">{selectedTrajectory.vehicle_category}</span>
              </div>
              <div className="bg-[#0B0F19] p-3 rounded-lg border border-[#1F293D]">
                <span className="text-slate-400 block">Duration</span>
                <span className="font-mono font-semibold text-white">{selectedTrajectory.duration_str}</span>
              </div>
              <div className="bg-[#0B0F19] p-3 rounded-lg border border-[#1F293D]">
                <span className="text-slate-400 block">Total Distance</span>
                <span className="font-mono font-semibold text-cyan-400">{selectedTrajectory.distance_km} km</span>
              </div>
              <div className="bg-[#0B0F19] p-3 rounded-lg border border-[#1F293D]">
                <span className="text-slate-400 block">Confidence</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {(selectedTrajectory.confidence_score * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Cluster Assignment */}
            <div className="bg-[#0B0F19] p-3.5 rounded-lg border border-[#1F293D] flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 text-[11px] block">Machine Learning Cluster Assignment</span>
                <span className="font-semibold text-blue-400">{selectedTrajectory.cluster_label}</span>
              </div>
              <span className="font-mono text-xs text-slate-400">ID: {selectedTrajectory.cluster_id}</span>
            </div>

            {/* Observation Sequence Timeline */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300">Observation Sequence & Sensor Hops:</h4>
              <div className="space-y-2">
                {selectedTrajectory.observations.map((obs, idx) => (
                  <div
                    key={idx}
                    className="bg-[#0B0F19] p-3 rounded-lg border border-[#1F293D] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{obs.camera_name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Sensor: {obs.camera_id} • Track #{obs.track_id}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono text-slate-300">{obs.timestamp_str}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        {(obs.confidence * 100).toFixed(0)}% conf
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTrajectory(null)}
                className="px-4 py-2 bg-[#161F30] hover:bg-[#1E293B] text-slate-200 rounded-lg text-xs font-semibold border border-[#1F293D] transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
