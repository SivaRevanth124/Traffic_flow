import React, { useState } from 'react';
import { MainLayout } from './layouts/MainLayout';
import { NavPage } from './types';

// Import all 16 functional pages
import { CommandCenter } from './pages/CommandCenter';
import { CameraManagement } from './pages/CameraManagement';
import { LiveVideoWall } from './pages/LiveVideoWall';
import { RecordedVideos } from './pages/RecordedVideos';
import { VehicleDetection } from './pages/VehicleDetection';
import { VehicleTracking } from './pages/VehicleTracking';
import { TrajectoryExplorer } from './pages/TrajectoryExplorer';
import { RouteClustering } from './pages/RouteClustering';
import { CityTrafficMap } from './pages/CityTrafficMap';
import { CongestionMonitoring } from './pages/CongestionMonitoring';
import { IncidentAlerts } from './pages/IncidentAlerts';
import { TrafficAnalytics } from './pages/TrafficAnalytics';
import { DatasetManagement } from './pages/DatasetManagement';
import { UsersRoles } from './pages/UsersRoles';
import { Reports } from './pages/Reports';
import { SystemSettings } from './pages/SystemSettings';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<NavPage>('command-center');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 800);
  };

  const getPageMeta = (page: NavPage): { title: string; subtitle?: string } => {
    switch (page) {
      case 'command-center':
        return {
          title: 'Command Center',
          subtitle: 'Central dispatch operations and optical sensor network status'
        };
      case 'cameras':
        return {
          title: 'Camera Management',
          subtitle: 'Authorized CCTV and ANPR optical sensor registry'
        };
      case 'video-wall':
        return {
          title: 'Live CCTV Video Wall',
          subtitle: 'Multi-stream gateway with real-time AI bounding box overlays'
        };
      case 'recorded-videos':
        return {
          title: 'Recorded Video Archive',
          subtitle: 'Footage ingestion and automated trajectory extraction pipeline'
        };
      case 'detection':
        return {
          title: 'AI Vehicle Detection (YOLO)',
          subtitle: 'Class-differentiated optical bounding boxes and confidence evaluation'
        };
      case 'tracking':
        return {
          title: 'Vehicle Tracking & Cross-Camera Re-ID',
          subtitle: 'ByteTrack Kalman filter association and topological transit matching'
        };
      case 'trajectories':
        return {
          title: 'Trajectory Explorer',
          subtitle: 'Spatial-temporal observation chains and multi-camera route reconstructions'
        };
      case 'clustering':
        return {
          title: 'Route Clustering Intelligence',
          subtitle: 'Unsupervised pattern discovery: DBSCAN, K-Means & Agglomerative analysis'
        };
      case 'traffic-map':
        return {
          title: 'City Traffic Map',
          subtitle: 'Interactive geospatial grid with sensor coordinates and trajectory routes'
        };
      case 'congestion':
        return {
          title: 'Congestion & Density Monitoring',
          subtitle: 'Occupancy analysis, bottleneck alerts, and Level-of-Service (LOS) estimation'
        };
      case 'alerts':
        return {
          title: 'Incident Decision-Support Alerts',
          subtitle: 'Automated anomaly detection triggers requiring human controller verification'
        };
      case 'analytics':
        return {
          title: 'City Traffic Analytics',
          subtitle: 'Historical flow profiles, hourly transit volumes, and vehicle category trends'
        };
      case 'datasets':
        return {
          title: 'Dataset Management',
          subtitle: 'CityFlowV2 benchmark standards and multi-camera tracking corpus staging'
        };
      case 'users':
        return {
          title: 'Users, Roles & Security Audit',
          subtitle: 'Role-based access permissions, 2FA enforcement, and tamper-evident logs'
        };
      case 'reports':
        return {
          title: 'Reports & Intelligence Exports',
          subtitle: 'Database-backed daily and weekly transportation intelligence exports'
        };
      case 'settings':
        return {
          title: 'System Settings',
          subtitle: 'Inference device selection, ByteTrack parameters, and video retention windows'
        };
      default:
        return { title: 'TrafficFlow', subtitle: 'City Traffic Intelligence Platform' };
    }
  };

  const { title, subtitle } = getPageMeta(currentPage);

  const renderContent = () => {
    switch (currentPage) {
      case 'command-center':
        return <CommandCenter onNavigate={(page) => setCurrentPage(page as NavPage)} />;
      case 'cameras':
        return <CameraManagement />;
      case 'video-wall':
        return <LiveVideoWall />;
      case 'recorded-videos':
        return <RecordedVideos />;
      case 'detection':
        return <VehicleDetection />;
      case 'tracking':
        return <VehicleTracking />;
      case 'trajectories':
        return <TrajectoryExplorer />;
      case 'clustering':
        return <RouteClustering />;
      case 'traffic-map':
        return <CityTrafficMap onNavigate={(page) => setCurrentPage(page as NavPage)} />;
      case 'congestion':
        return <CongestionMonitoring />;
      case 'alerts':
        return <IncidentAlerts />;
      case 'analytics':
        return <TrafficAnalytics />;
      case 'datasets':
        return <DatasetManagement />;
      case 'users':
        return <UsersRoles />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <SystemSettings />;
      default:
        return <CommandCenter onNavigate={(page) => setCurrentPage(page as NavPage)} />;
    }
  };

  return (
    <MainLayout
      currentPage={currentPage}
      onSelectPage={setCurrentPage}
      title={title}
      subtitle={subtitle}
      onRefresh={handleRefresh}
      isRefreshing={isRefreshing}
    >
      {renderContent()}
    </MainLayout>
  );
};
