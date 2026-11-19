import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  Clock,
  Printer,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export const Reports: React.FC = () => {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const availableReports = [
    {
      id: 'REP-01',
      title: 'Daily City Traffic Summary Report',
      desc: 'Aggregated vehicle classification volumes, hourly flow profiles, and camera network status.',
      generated: 'Today, Live Sync',
      records: '48,920 Detections',
      format: 'PDF & CSV',
      type: 'daily_summary'
    },
    {
      id: 'REP-02',
      title: 'Weekly Trajectory & Clustering Audit',
      desc: 'Comparative evaluation of K-Means, DBSCAN, and Agglomerative runs with Silhouette metrics.',
      generated: 'Nov 18, 2026',
      records: 'Database Reconstructed Trajectories',
      format: 'PDF & CSV',
      type: 'trajectories'
    },
    {
      id: 'REP-03',
      title: 'CCTV Optical Sensor Health & Downtime Log',
      desc: 'Historical uptime percentages, dropped frames, RTSP socket reconnect logs, and MTBF statistics.',
      generated: 'Nov 18, 2026',
      records: '6 Central Metropolitan Sensors',
      format: 'CSV',
      type: 'sensors'
    },
    {
      id: 'REP-04',
      title: 'Arterial Congestion & Bottleneck Analysis',
      desc: 'Density indices, Level-of-Service (LOS A–E) distribution, and signal delay profiles across key corridors.',
      generated: 'Nov 18, 2026',
      records: 'Urban Corridor Junctions',
      format: 'PDF & CSV',
      type: 'congestion'
    }
  ];

  const triggerCsvDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = async (reportType: string, title: string) => {
    setDownloading(reportType);
    setMessage(null);
    try {
      if (reportType === 'trajectories') {
        window.open(api.getTrajectoryExportCsvUrl(), '_blank');
        setMessage(`Successfully exported ${title} from Trajectory database.`);
      } else if (reportType === 'sensors') {
        const cameras = await api.getCameras();
        let csv = 'Camera ID,Name,Location,Type,Group,FPS,Resolution,Status,Detection Active,Last Ping\n';
        cameras.forEach((c) => {
          csv += `"${c.camera_id}","${c.name}","${c.location}","${c.camera_type}","${c.camera_group}",${c.fps},"${c.resolution}","${c.status}",${c.detection_active},"${c.last_ping || 'N/A'}"\n`;
        });
        triggerCsvDownload(csv, 'trafficflow_cctv_sensor_audit.csv');
        setMessage(`Exported ${cameras.length} sensor records to trafficflow_cctv_sensor_audit.csv`);
      } else if (reportType === 'congestion') {
        const junctions = await api.getCongestionMonitoring();
        let csv = 'Camera ID,Intersection,Corridor,Sensor Status,Occupancy %,LOS,Status Label,Estimated Queue (m),Avg Delay (s),Flow Rate (vph)\n';
        junctions.forEach((j) => {
          csv += `"${j.camera_id}","${j.name}","${j.camera_group}","${j.sensor_status}",${j.occupancy_pct},"${j.level_of_service}","${j.status_label}",${j.estimated_queue_m},${j.average_delay_sec},${j.flow_rate_vph}\n`;
        });
        triggerCsvDownload(csv, 'trafficflow_arterial_congestion_report.csv');
        setMessage(`Exported congestion monitoring data for ${junctions.length} junctions.`);
      } else {
        // Daily Summary
        const overview = await api.getAnalyticsOverview();
        let csv = 'Metric,Value\n';
        csv += `Daily Traffic Volume,${overview.summary.daily_traffic_volume}\n`;
        csv += `Morning Peak Hour,"${overview.summary.peak_hour_morning}"\n`;
        csv += `Evening Peak Hour,"${overview.summary.peak_hour_evening}"\n`;
        csv += `Average Network Speed (km/h),${overview.summary.average_network_speed_kmh}\n`;
        csv += `Network Efficiency Index,${overview.summary.network_efficiency_index}%\n\n`;
        csv += 'Vehicle Category,Count,Percentage\n';
        overview.vehicle_breakdown.forEach((vb) => {
          csv += `"${vb.category}",${vb.count},${vb.percentage}%\n`;
        });
        triggerCsvDownload(csv, 'trafficflow_daily_traffic_summary.csv');
        setMessage(`Exported daily traffic intelligence metrics to CSV.`);
      }
    } catch (err: any) {
      setMessage(`Export failed: ${err.message}`);
    } finally {
      setDownloading(null);
      setTimeout(() => setMessage(null), 4000);
    }
  };

  const handlePrintPdf = (title: string) => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#111827] border border-[#1F293D] p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-white">Transportation Intelligence Reports & Data Exports</h2>
          <p className="text-xs text-slate-400">
            Generate verifiable operational and machine learning experiment documentation from database records
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadCsv('trajectories', 'All Trajectories')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export All Trajectories (CSV)
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {availableReports.map((rep) => (
          <div key={rep.id} className="bg-[#111827] border border-[#1F293D] rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-cyan-400">{rep.id}</span>
                <span className="text-[10px] font-mono text-slate-400 bg-[#161F30] px-2 py-0.5 rounded border border-[#1F293D]">
                  {rep.format}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white mb-1">{rep.title}</h4>
              <p className="text-xs text-slate-400 mb-4">{rep.desc}</p>
            </div>

            <div className="pt-3 border-t border-[#1F293D] flex items-center justify-between text-xs">
              <div className="space-y-0.5 text-slate-400">
                <div>Generated: <span className="text-slate-200 font-mono">{rep.generated}</span></div>
                <div>Volume: <span className="text-white font-medium">{rep.records}</span></div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={downloading === rep.type}
                  onClick={() => handleDownloadCsv(rep.type, rep.title)}
                  className="px-2.5 py-1.5 bg-[#161F30] hover:bg-slate-800 text-slate-200 rounded text-xs border border-[#1F293D] flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <Download className="w-3 h-3 text-cyan-400" />
                  {downloading === rep.type ? 'Exporting...' : 'CSV'}
                </button>
                <button
                  onClick={() => handlePrintPdf(rep.title)}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Printer className="w-3 h-3" /> Print / PDF
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
