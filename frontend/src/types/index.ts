export type NavPage =
  | 'command-center'
  | 'cameras'
  | 'video-wall'
  | 'recorded-videos'
  | 'detection'
  | 'tracking'
  | 'trajectories'
  | 'clustering'
  | 'traffic-map'
  | 'congestion'
  | 'alerts'
  | 'analytics'
  | 'datasets'
  | 'users'
  | 'reports'
  | 'settings';

export interface Camera {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  cameraType: 'fixed' | 'ptz' | 'dome' | 'thermal';
  cameraGroup: string;
  rtspUrl?: string;
  status: 'online' | 'offline' | 'degraded' | 'testing';
  lastPing?: string;
  fps: number;
  resolution: string;
  detectionActive: boolean;
}

export interface VehicleDetection {
  id: string;
  cameraId: string;
  cameraName: string;
  category: 'car' | 'motorcycle' | 'bus' | 'truck';
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, w, h]
  frameNumber: number;
  timestamp: string;
  trackingId?: number;
  speedKmh?: number;
}

export interface TrajectoryPoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed?: number;
  cameraId: string;
}

export interface VehicleTrajectory {
  id: string;
  vehicleCategory: 'car' | 'motorcycle' | 'bus' | 'truck';
  cameraSequence: string[];
  startTime: string;
  endTime: string;
  durationSeconds: number;
  points: TrajectoryPoint[];
  clusterId?: number;
  associationConfidence: number;
  crossCamera: boolean;
}

export interface IncidentAlert {
  id: string;
  category: 'camera_offline' | 'congestion_high' | 'stopped_vehicle' | 'wrong_way' | 'stream_fail' | 'processing_error';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  cameraId: string;
  cameraName: string;
  location: string;
  timestamp: string;
  status: 'active' | 'under_review' | 'resolved' | 'dismissed';
  assignedOperator?: string;
}

export interface ClusteringResult {
  algorithm: 'kmeans' | 'dbscan' | 'agglomerative';
  datasetName: string;
  totalTrajectories: number;
  clustersFound: number;
  noisePoints: number;
  silhouetteScore: number;
  daviesBouldinIndex: number;
  calinskiHarabaszScore: number;
  executionTimeMs: number;
  timestamp: string;
}

export interface SystemStats {
  registeredCameras: number;
  onlineCameras: number;
  offlineCameras: number;
  totalDetectionsToday: number;
  activeTrackingSessions: number;
  activeAlerts: number;
  congestionIndex: number; // 0-100
  processingJobs: number;
}
