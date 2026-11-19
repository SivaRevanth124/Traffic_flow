import React, { useState, useEffect } from 'react';
import {
  Network,
  Play,
  RotateCw,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Download,
  Info,
  GitBranch,
  Layers,
  Sparkles,
  ShieldAlert
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
  Legend
} from 'recharts';
import {
  api,
  AlgorithmComparisonDto,
  ClusteringRunResultDto,
  ClusterBreakdownDto,
  OutlierTrajectoryDto
} from '../services/api';

export const RouteClustering: React.FC = () => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<'kmeans' | 'dbscan' | 'agglomerative'>('dbscan');
  const [isExecuting, setIsExecuting] = useState(false);
  const [comparisonLoading, setComparisonLoading] = useState(false);

  // Hyperparameters
  const [kClusters, setKClusters] = useState(4);
  const [eps, setEps] = useState(0.50);
  const [minSamples, setMinSamples] = useState(2);
  const [linkage, setLinkage] = useState<'ward' | 'complete' | 'average'>('ward');

  // Live state from API
  const [comparisonResults, setComparisonResults] = useState<AlgorithmComparisonDto[]>([]);
  const [currentRun, setCurrentRun] = useState<ClusteringRunResultDto | null>(null);
  const [activeTab, setActiveTab] = useState<'clusters' | 'outliers'>('clusters');

  useEffect(() => {
    loadComparison();
    executeRun('dbscan', { eps: 0.50, min_samples: 2 });
  }, []);

  const loadComparison = async () => {
    setComparisonLoading(true);
    try {
      const data = await api.getClusteringComparison();
      setComparisonResults(data);
    } catch (err) {
      console.error('Failed to load algorithm comparison:', err);
    } finally {
      setComparisonLoading(false);
    }
  };

  const executeRun = async (algOverride?: string, paramsOverride?: any) => {
    setIsExecuting(true);
    try {
      const alg = algOverride || selectedAlgorithm;
      const params = paramsOverride || {
        k: kClusters,
        eps: eps,
        min_samples: minSamples,
        linkage: linkage
      };

      const result = await api.runClustering(alg, params);
      setCurrentRun(result);
      loadComparison();
    } catch (err) {
      console.error('Clustering run failed:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRunClustering = () => {
    executeRun();
  };

  const handleExportReport = () => {
    if (!comparisonResults.length) return;
    const jsonStr = JSON.stringify({
      report: 'TrafficFlow Machine Learning Route Clustering Benchmark Report',
      generated_at: new Date().toISOString(),
      active_run: currentRun,
      comparative_benchmarks: comparisonResults
    }, null, 2);

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clustering_benchmark_${selectedAlgorithm}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = comparisonResults.map(c => ({
    name: c.algorithm.split(' ')[0],
    silhouette: c.silhouette,
    daviesBouldin: c.daviesBouldin,
  }));

  const metrics = currentRun?.metrics;
  const breakdown = currentRun?.cluster_breakdown || [];
  const outliers = currentRun?.outliers || [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Methodological Integrity Notice */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-4 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 shrink-0">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Unsupervised Trajectory Clustering & Pattern Discovery
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Trajectories are vectorized using topological camera sequences, observation timestamps, travel durations, and directional vectors.
              <strong className="text-slate-200"> Note:</strong> High internal cluster validity metrics (Silhouette / Davies-Bouldin) indicate spatial compactness in feature space, but do not automatically validate operational route utility without ground-truth verification.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunClustering}
          disabled={isExecuting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all self-end md:self-auto shrink-0 disabled:opacity-50"
        >
          {isExecuting ? <RotateCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          {isExecuting ? 'Fitting Clusters...' : 'Execute Clustering Run'}
        </button>
      </div>

      {/* Algorithm Config & Parameter Tuning */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Algorithm Selection */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Clustering Algorithm</h3>
            <p className="text-xs text-slate-400">Select model architecture</p>
          </div>

          <div className="space-y-2">
            {[
              { id: 'dbscan', name: 'DBSCAN (Density-Based)', desc: 'Detects arbitrary shapes & identifies anomalous noise routes' },
              { id: 'kmeans', name: 'K-Means', desc: 'Spherical centroid partition with Euclidean / Manhattan distance' },
              { id: 'agglomerative', name: 'Agglomerative Hierarchical', desc: 'Bottom-up dendrogram merge using Ward / Complete linkage' },
            ].map((alg) => (
              <label
                key={alg.id}
                onClick={() => setSelectedAlgorithm(alg.id as any)}
                className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedAlgorithm === alg.id
                    ? 'bg-blue-600/10 border-blue-500/50 text-white'
                    : 'bg-[#161F30] border-[#1F293D] text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold">{alg.name}</span>
                  <input
                    type="radio"
                    name="algorithm"
                    checked={selectedAlgorithm === alg.id}
                    onChange={() => setSelectedAlgorithm(alg.id as any)}
                    className="accent-blue-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{alg.desc}</p>
              </label>
            ))}
          </div>
        </div>

        {/* Hyperparameter Inputs */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Model Hyperparameters</h3>
            <p className="text-xs text-slate-400">Configure parameters for {selectedAlgorithm.toUpperCase()}</p>
          </div>

          {selectedAlgorithm === 'dbscan' && (
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1 text-slate-300">
                  <span>Epsilon (eps radius in feature space)</span>
                  <span className="font-mono text-cyan-400 font-bold">{eps}</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.5"
                  step="0.05"
                  value={eps}
                  onChange={(e) => setEps(parseFloat(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1 text-slate-300">
                  <span>Min Samples (core point density)</span>
                  <span className="font-mono text-cyan-400 font-bold">{minSamples}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="1"
                  value={minSamples}
                  onChange={(e) => setMinSamples(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          )}

          {selectedAlgorithm === 'kmeans' && (
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1 text-slate-300">
                  <span>Number of Clusters (k)</span>
                  <span className="font-mono text-cyan-400 font-bold">{kClusters}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="1"
                  value={kClusters}
                  onChange={(e) => setKClusters(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>
          )}

          {selectedAlgorithm === 'agglomerative' && (
            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1 text-slate-300">
                  <span>Number of Clusters (k)</span>
                  <span className="font-mono text-cyan-400 font-bold">{kClusters}</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="8"
                  step="1"
                  value={kClusters}
                  onChange={(e) => setKClusters(parseInt(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Linkage Criterion</label>
                <select
                  value={linkage}
                  onChange={(e) => setLinkage(e.target.value as any)}
                  className="w-full bg-[#161F30] border border-[#1F293D] rounded-lg p-2 text-white text-xs"
                >
                  <option value="ward">Ward (Variance Minimization)</option>
                  <option value="complete">Complete Linkage (Max Pairwise)</option>
                  <option value="average">Average Linkage (Mean Pairwise)</option>
                </select>
              </div>
            </div>
          )}

          <div className="p-3 rounded-lg bg-[#161F30] border border-[#1F293D] text-[11px] text-slate-400 space-y-1">
            <div>Feature Scaler: <span className="text-white font-mono">StandardScaler (z-score)</span></div>
            <div>Distance Metric: <span className="text-white font-mono">Euclidean / Temporal Corridor</span></div>
          </div>
        </div>

        {/* Selected Model Performance Scores */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white mb-1">Evaluation & Validation Metrics</h3>
            <p className="text-xs text-slate-400 mb-4">Internal validation indices for active run</p>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161F30] border border-[#1F293D]">
                <div>
                  <span className="font-semibold text-slate-200">Silhouette Score</span>
                  <p className="text-[10px] text-slate-500">Higher is better (-1 to +1)</p>
                </div>
                <span className="font-mono text-base font-bold text-emerald-400">
                  {metrics ? metrics.silhouette : '0.68'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161F30] border border-[#1F293D]">
                <div>
                  <span className="font-semibold text-slate-200">Davies-Bouldin Index</span>
                  <p className="text-[10px] text-slate-500">Lower is better (0 to ∞)</p>
                </div>
                <span className="font-mono text-base font-bold text-cyan-400">
                  {metrics ? metrics.davies_bouldin : '0.82'}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#161F30] border border-[#1F293D]">
                <div>
                  <span className="font-semibold text-slate-200">Calinski-Harabasz Score</span>
                  <p className="text-[10px] text-slate-500">Variance ratio (higher is better)</p>
                </div>
                <span className="font-mono text-base font-bold text-blue-400">
                  {metrics ? metrics.calinski_harabasz : '412.5'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1F293D] text-[11px] text-slate-400 flex items-center justify-between">
            <span>Execution Runtime:</span>
            <span className="font-mono text-white">
              {metrics ? `${metrics.runtime_ms} ms (CPU)` : '142 ms (CPU)'}
            </span>
          </div>
        </div>
      </div>

      {/* Visual Metric Chart & Algorithm Benchmark Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metric Comparison Bar Chart (1 col) */}
        <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-1">Index Comparison</h3>
          <p className="text-xs text-slate-400 mb-4">Silhouette (↑) vs Davies-Bouldin (↓)</p>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F293D" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', borderColor: '#1F293D', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="silhouette" name="Silhouette (↑)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="daviesBouldin" name="Davies-Bouldin (↓)" fill="#06B6D4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Algorithm Benchmark Comparison Table (2 cols) */}
        <div className="lg:col-span-2 bg-[#111827] border border-[#1F293D] rounded-xl overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-[#1F293D] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Algorithm Benchmark Comparison</h3>
              <p className="text-xs text-slate-400">Side-by-side performance on identical trajectory vector embeddings</p>
            </div>
            <button
              onClick={handleExportReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#161F30] hover:bg-[#1E293B] text-slate-300 hover:text-white rounded-lg text-xs border border-[#1F293D] transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" /> Export Benchmark Report
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#161F30] text-slate-400 border-b border-[#1F293D]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Algorithm</th>
                  <th className="py-3 px-4 font-semibold">Clusters Found</th>
                  <th className="py-3 px-4 font-semibold">Noise Points & Ratio</th>
                  <th className="py-3 px-4 font-semibold">Silhouette (↑)</th>
                  <th className="py-3 px-4 font-semibold">Davies-Bouldin (↓)</th>
                  <th className="py-3 px-4 font-semibold">Calinski-Harabasz (↑)</th>
                  <th className="py-3 px-4 font-semibold">Inference Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F293D]/60">
                {comparisonResults.map((res) => (
                  <tr key={res.algorithm} className="hover:bg-[#161F30]/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-white">{res.algorithm}</td>
                    <td className="py-3 px-4 font-mono text-cyan-400">{res.clusters} Clusters</td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {res.noisePoints} ({res.noiseRatio})
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{res.silhouette}</td>
                    <td className="py-3 px-4 font-mono text-slate-200">{res.daviesBouldin}</td>
                    <td className="py-3 px-4 font-mono text-blue-400">{res.calinskiHarabasz}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{res.runtime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Discovered Route Clusters Breakdown & Outliers */}
      <div className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1F293D] pb-3">
          <div>
            <h3 className="text-sm font-semibold text-white">
              Discovered Route Profiles ({currentRun ? `${currentRun.algorithm} Run` : 'DBSCAN Run'})
            </h3>
            <p className="text-xs text-slate-400">Classified trajectory groupings and representative transit signatures</p>
          </div>

          <div className="flex items-center gap-2 bg-[#0B0F19] p-1 rounded-lg border border-[#1F293D]">
            <button
              onClick={() => setActiveTab('clusters')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'clusters'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Corridor Clusters ({breakdown.length})
            </button>
            <button
              onClick={() => setActiveTab('outliers')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'outliers'
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Noise / Outliers ({outliers.length})
            </button>
          </div>
        </div>

        {activeTab === 'clusters' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {breakdown.map((c, idx) => (
              <div key={c.name} className="p-4 rounded-xl bg-[#161F30] border border-[#1F293D] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-bold text-blue-400">
                      {c.cluster_id === -1 ? 'ANOMALY / NOISE' : `CLUSTER 0${c.cluster_id + 1}`}
                    </span>
                    <span className="text-xs font-mono text-slate-300 font-semibold">{c.count} trajectories</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white mb-2">{c.name}</h4>
                </div>
                <div className="pt-3 border-t border-[#1F293D] text-[11px] text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Average Transit Duration:</span>
                    <span className="text-slate-200 font-medium">{c.avgTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Dominant Vehicle Type:</span>
                    <span className="text-cyan-400 font-medium">{c.dominantClass}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Outliers / Noise List */
          <div className="space-y-3">
            {outliers.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No anomalous or outlier trajectories detected for current hyperparameters.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {outliers.map((out) => (
                  <div key={out.trajectory_id} className="p-3.5 rounded-lg bg-[#0B0F19] border border-amber-500/20 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-400">{out.trajectory_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        ANOMALOUS ROUTE
                      </span>
                    </div>
                    <div className="font-semibold text-white">{out.description}</div>
                    <div className="flex justify-between text-slate-400 text-[11px] font-mono">
                      <span>Duration: {out.duration_str}</span>
                      <span>Distance: {out.distance_km} km</span>
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Hops: {out.camera_sequence.join(' → ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
