/**
 * TrafficFlow Typed API Client
 * Connects frontend modules directly to FastAPI backend endpoints.
 */

const API_BASE = '/api/v1';

export interface CameraDto {
  id: number;
  camera_id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  camera_type: string;
  camera_group: string;
  fps: number;
  resolution: string;
  detection_active: boolean;
  status: 'online' | 'offline' | 'degraded' | 'testing';
  rtsp_url_masked?: string;
  last_ping?: string;
  last_error?: string;
  created_at?: string;
}

export interface DashboardStatsDto {
  registered_cameras: number;
  online_cameras: number;
  offline_cameras: number;
  degraded_cameras: number;
  total_detections_today: number;
  active_tracking_sessions: number;
  active_alerts: number;
  congestion_index: number;
  processing_jobs: number;
  system_status: string;
}

export interface AlertDto {
  id: number;
  alert_id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  camera_id: string;
  location: string;
  status: 'active' | 'under_review' | 'resolved' | 'dismissed';
  assigned_operator?: string;
  resolution_notes?: string;
  created_at: string;
  resolved_at?: string;
}

export interface VideoDto {
  id: number;
  video_id: string;
  filename: string;
  camera_id: string;
  camera_name?: string;
  duration_seconds: number;
  total_frames: number;
  fps: number;
  resolution: string;
  file_size_bytes: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_pct: number;
  current_step: string;
  detected_vehicles_count: number;
  error_message?: string;
  uploaded_at: string;
  processed_at?: string;
}

export interface TrackletDto {
  id: number;
  track_id: number;
  video_id: string;
  camera_id: string;
  category: string;
  start_frame: number;
  end_frame: number;
  start_time_sec: number;
  end_time_sec: number;
  duration_sec: number;
  total_detections: number;
  avg_confidence: number;
  avg_speed_kmh?: number;
  primary_direction?: string;
  appearance_color?: string;
  trajectory_points: Array<{
    frame: number;
    time_sec: number;
    cx: number;
    cy: number;
    w: number;
    h: number;
    score: number;
  }>;
  created_at: string;
}

export interface CrossCameraAssociationDto {
  id: number;
  association_id: string;
  source_camera_id: string;
  source_track_id: number;
  source_video_id?: string;
  source_time_str: string;
  dest_camera_id: string;
  dest_track_id: number;
  dest_video_id?: string;
  dest_time_str: string;
  vehicle_category: string;
  vehicle_description: string;
  travel_time_seconds: number;
  travel_time_str: string;
  expected_min_seconds: number;
  expected_max_seconds: number;
  expected_transit_str: string;
  distance_meters: number;
  confidence_score: number;
  appearance_similarity: number;
  topology_valid: boolean;
  status: 'verified' | 'review_required' | 'rejected';
  reviewed_by?: string;
  notes?: string;
  created_at: string;
}

export interface TrackingStatsDto {
  active_byte_track_sessions: number;
  cross_camera_reconstructed: number;
  pending_operator_review: number;
  avg_travel_time_delta_sec: number;
  high_confidence_ratio_pct: number;
}

export interface TrajectoryDto {
  id: number;
  trajectory_id: string;
  vehicle_category: string;
  vehicle_description: string;
  camera_sequence: string[];
  camera_names: string[];
  start_timestamp: string;
  end_timestamp: string;
  start_time_str: string;
  end_time_str: string;
  duration_seconds: number;
  duration_str: string;
  total_observations: number;
  distance_km: number;
  confidence_score: number;
  cluster_label: string;
  cluster_id: number;
  created_at: string;
}

export interface TrajectoryObservationDto {
  camera_id: string;
  camera_name: string;
  timestamp_str: string;
  track_id: number;
  confidence: number;
}

export interface TrajectoryDetailDto extends TrajectoryDto {
  geojson_path: {
    type: string;
    coordinates: number[][];
  };
  observations: TrajectoryObservationDto[];
}

export interface ClusterMetricsDto {
  algorithm: string;
  clusters: number;
  total_samples: number;
  noise_points: number;
  noise_ratio_pct: number;
  silhouette: number;
  davies_bouldin: number;
  calinski_harabasz: number;
  runtime_ms: number;
  memory_dim: number;
}

export interface ClusterBreakdownDto {
  cluster_id: number;
  name: string;
  count: number;
  avgTime: string;
  dominantClass: string;
}

export interface OutlierTrajectoryDto {
  trajectory_id: string;
  vehicle_category: string;
  description: string;
  duration_str: string;
  distance_km: number;
  camera_sequence: string[];
}

export interface ClusteringRunResultDto {
  algorithm: string;
  parameters: Record<string, any>;
  metrics: ClusterMetricsDto;
  cluster_breakdown: ClusterBreakdownDto[];
  outliers_count: number;
  outliers: OutlierTrajectoryDto[];
}

export interface AlgorithmComparisonDto {
  algorithm: string;
  clusters: number;
  noisePoints: number;
  noiseRatio: string;
  silhouette: number;
  daviesBouldin: number;
  calinskiHarabasz: number;
  runtime: string;
}

export interface CongestionJunctionDto {
  camera_id: string;
  name: string;
  location: string;
  camera_group: string;
  sensor_status: string;
  occupancy_pct: number;
  level_of_service: string;
  status_label: string;
  estimated_queue_m: number;
  average_delay_sec: number;
  flow_rate_vph: number;
}

export interface AnalyticsOverviewDto {
  summary: {
    daily_traffic_volume: number;
    peak_hour_morning: string;
    peak_hour_evening: string;
    average_network_speed_kmh: number;
    network_efficiency_index: number;
  };
  vehicle_breakdown: Array<{
    category: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  weekly_profile: Array<{
    day: string;
    volume: number;
    peakCongestion: number;
  }>;
  top_corridors_by_volume: Array<{
    corridor: string;
    volume_24h: number;
    speed_avg: number;
  }>;
}

export interface VehiclePhotoDto {
  id: string;
  category: string;
  title: string;
  camera_id: string;
  camera_name: string;
  confidence: number;
  speed_kmh: number;
  time_str: string;
  telematics: string;
  telematics_type: 'satellite_gps' | 'optical';
  description: string;
  photo_url: string;
}

export interface UserDto {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  is_superuser: boolean;
  created_at?: string;
  last_login?: string;
}

export interface UserCreatePayload {
  username: string;
  email: string;
  full_name?: string;
  password: string;
  role: string;
}

export interface AuditLogDto {
  id: number;
  actor_username: string;
  action: string;
  entity_type: string;
  entity_id: string;
  ip_address: string;
  details?: string;
  timestamp: string;
}

// Token storage helpers
export const getStoredToken = (): string | null => {
  return localStorage.getItem('trafficflow_token');
};

export const setStoredToken = (token: string) => {
  localStorage.setItem('trafficflow_token', token);
};

const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // Authentication
  async login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error('Authentication failed');
    const data = await res.json();
    setStoredToken(data.access_token);
    return data;
  },

  async getCurrentUser() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Session invalid');
    return res.json();
  },

  // Dashboard Telemetry
  async getDashboardStats(): Promise<DashboardStatsDto> {
    const res = await fetch(`${API_BASE}/dashboard/stats`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  async getHourlyVolumes() {
    const res = await fetch(`${API_BASE}/dashboard/hourly-volumes`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch hourly volumes');
    return res.json();
  },

  async getFrequentCorridors() {
    const res = await fetch(`${API_BASE}/dashboard/corridors`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch corridors');
    return res.json();
  },

  // CCTV Camera Management
  async getCameras(group?: string, status?: string): Promise<CameraDto[]> {
    const params = new URLSearchParams();
    if (group && group !== 'all') params.append('group', group);
    if (status && status !== 'all') params.append('status', status);
    const url = `${API_BASE}/cameras${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch cameras');
    return res.json();
  },

  async registerCamera(data: {
    camera_id: string;
    name: string;
    location: string;
    latitude: number;
    longitude: number;
    camera_type: string;
    camera_group: string;
    rtsp_url?: string;
    fps?: number;
    resolution?: string;
    detection_active?: boolean;
  }): Promise<CameraDto> {
    const res = await fetch(`${API_BASE}/cameras`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to register camera');
    }
    return res.json();
  },

  async updateCamera(cameraId: string, data: Partial<CameraDto>): Promise<CameraDto> {
    const res = await fetch(`${API_BASE}/cameras/${cameraId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update camera');
    return res.json();
  },

  async deleteCamera(cameraId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/cameras/${cameraId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete camera');
  },

  async testCameraConnection(cameraId: string) {
    const res = await fetch(`${API_BASE}/cameras/${cameraId}/test`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Camera test probe failed');
    return res.json();
  },

  async getCameraHealth(cameraId: string) {
    const res = await fetch(`${API_BASE}/cameras/${cameraId}/health`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch health history');
    return res.json();
  },

  getCameraLiveStreamUrl(cameraId: string): string {
    return `${API_BASE}/cameras/${cameraId}/live-stream`;
  },

  getCameraMjpegUrl(cameraId: string): string {
    return `${API_BASE}/cameras/${cameraId}/mjpeg`;
  },

  getCameraSnapshotUrl(cameraId: string): string {
    return `${API_BASE}/cameras/${cameraId}/snapshot`;
  },

  async getVehiclePhotos(): Promise<VehiclePhotoDto[]> {
    const res = await fetch(`${API_BASE}/detection/vehicle-photos`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch vehicle photos');
    return res.json();
  },

  // Incident Alerts
  async getAlerts(severity?: string, status?: string): Promise<AlertDto[]> {
    const params = new URLSearchParams();
    if (severity && severity !== 'all') params.append('severity', severity);
    if (status && status !== 'all') params.append('status', status);
    const url = `${API_BASE}/alerts${params.toString() ? `?${params.toString()}` : ''}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async updateAlert(alertId: string, data: {
    status?: string;
    assigned_operator?: string;
    resolution_notes?: string;
  }): Promise<AlertDto> {
    const res = await fetch(`${API_BASE}/alerts/${alertId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update alert');
    return res.json();
  },

  // Recorded Video Management
  async getVideos(): Promise<VideoDto[]> {
    const res = await fetch(`${API_BASE}/videos`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch videos');
    return res.json();
  },

  async getVideoDetails(videoId: string): Promise<VideoDto> {
    const res = await fetch(`${API_BASE}/videos/${videoId}`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch video details');
    return res.json();
  },

  async uploadVideo(file: File, cameraId: string, frameStride: number = 2): Promise<VideoDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('camera_id', cameraId);
    formData.append('frame_stride', frameStride.toString());

    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/videos/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Failed to upload video');
    }
    return res.json();
  },

  async reprocessVideo(videoId: string, frameStride: number = 2): Promise<VideoDto> {
    const formData = new FormData();
    formData.append('frame_stride', frameStride.toString());

    const token = getStoredToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/videos/${videoId}/reprocess`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to reprocess video');
    return res.json();
  },

  async deleteVideo(videoId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/videos/${videoId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete video');
  },

  getVideoStreamUrl(videoId: string, annotated: boolean = false): string {
    return `${API_BASE}/videos/${videoId}/stream${annotated ? '?annotated=true' : ''}`;
  },

  getVideoAnnotatedStreamUrl(videoId: string): string {
    return `${API_BASE}/videos/${videoId}/annotated-stream`;
  },

  // AI Vehicle Detection (YOLO)
  async processDetection(videoId: string, confidenceThreshold: number = 0.40, frameStride: number = 2, modelName: string = 'yolov8n') {
    const res = await fetch(`${API_BASE}/detection/process/${videoId}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        confidence_threshold: confidenceThreshold,
        frame_stride: frameStride,
        model_name: modelName,
      }),
    });
    if (!res.ok) throw new Error('Inference pipeline failed');
    return res.json();
  },

  async getVideoDetections(videoId: string, category?: string, minConf?: number) {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (minConf !== undefined) params.append('min_confidence', minConf.toString());
    const res = await fetch(`${API_BASE}/detection/videos/${videoId}?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch detections');
    return res.json();
  },

  async getDetectionSummary(videoId: string) {
    const res = await fetch(`${API_BASE}/detection/videos/${videoId}/summary`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch detection summary');
    return res.json();
  },

  getAnnotatedVideoStreamUrl(videoId: string): string {
    return `${API_BASE}/detection/videos/${videoId}/annotated`;
  },

  // Vehicle Tracking & Cross-Camera Association
  async getTrackingStats(): Promise<TrackingStatsDto> {
    const res = await fetch(`${API_BASE}/tracking/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch tracking statistics');
    return res.json();
  },

  async getVideoTracks(videoId: string): Promise<TrackletDto[]> {
    const res = await fetch(`${API_BASE}/tracking/videos/${videoId}/tracks`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch video tracklets');
    return res.json();
  },

  async runVideoTracking(videoId: string): Promise<TrackletDto[]> {
    const res = await fetch(`${API_BASE}/tracking/videos/${videoId}/run`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to execute ByteTrack tracking');
    return res.json();
  },

  async getCrossCameraAssociations(status?: string): Promise<CrossCameraAssociationDto[]> {
    const url = status && status !== 'all'
      ? `${API_BASE}/tracking/associations?status=${status}`
      : `${API_BASE}/tracking/associations`;
    const res = await fetch(url, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch cross-camera associations');
    return res.json();
  },

  async verifyCrossCameraAssociation(
    associationId: string,
    action: 'verify' | 'reject',
    notes?: string
  ): Promise<CrossCameraAssociationDto> {
    const res = await fetch(`${API_BASE}/tracking/associations/${associationId}/verify`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ action, notes }),
    });
    if (!res.ok) throw new Error('Failed to verify cross-camera association');
    return res.json();
  },

  // Trajectory Reconstruction & Exploration
  async getTrajectories(category?: string, clusterId?: number, search?: string): Promise<TrajectoryDto[]> {
    const params = new URLSearchParams();
    if (category && category !== 'all') params.append('category', category);
    if (clusterId !== undefined) params.append('cluster_id', clusterId.toString());
    if (search) params.append('search', search);

    const res = await fetch(`${API_BASE}/trajectories?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch trajectories');
    return res.json();
  },

  async getTrajectoryDetail(trajectoryId: string): Promise<TrajectoryDetailDto> {
    const res = await fetch(`${API_BASE}/trajectories/${trajectoryId}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch trajectory details');
    return res.json();
  },

  getTrajectoryExportGeoJsonUrl(): string {
    return `${API_BASE}/trajectories/export/geojson`;
  },

  getTrajectoryExportCsvUrl(): string {
    return `${API_BASE}/trajectories/export/csv`;
  },

  // Machine Learning Route Clustering
  async runClustering(
    algorithm: string,
    params: { k?: number; eps?: number; min_samples?: number; linkage?: string }
  ): Promise<ClusteringRunResultDto> {
    const res = await fetch(`${API_BASE}/clustering/run`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ algorithm, ...params }),
    });
    if (!res.ok) throw new Error('Clustering execution failed');
    return res.json();
  },

  async getClusteringComparison(): Promise<AlgorithmComparisonDto[]> {
    const res = await fetch(`${API_BASE}/clustering/compare`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch clustering comparison');
    return res.json();
  },

  // Traffic Operations, Congestion & Incident Alerts
  async getCongestionMonitoring(): Promise<CongestionJunctionDto[]> {
    const res = await fetch(`${API_BASE}/analytics/congestion`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch congestion monitoring data');
    return res.json();
  },

  async getAnalyticsOverview(): Promise<AnalyticsOverviewDto> {
    const res = await fetch(`${API_BASE}/analytics/overview`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch traffic analytics overview');
    return res.json();
  },

  // User Management, RBAC & Audit Trails
  async getUsers(): Promise<UserDto[]> {
    const res = await fetch(`${API_BASE}/auth/users`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch authorized platform users');
    return res.json();
  },

  async createUser(payload: UserCreatePayload): Promise<UserDto> {
    const res = await fetch(`${API_BASE}/auth/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create user' }));
      throw new Error(err.detail || 'Failed to create user');
    }
    return res.json();
  },

  async updateUserStatus(userId: number, isActive: boolean): Promise<UserDto> {
    const res = await fetch(`${API_BASE}/auth/users/${userId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ is_active: isActive }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update user status' }));
      throw new Error(err.detail || 'Failed to update user status');
    }
    return res.json();
  },

  async getAuditLogs(limit: number = 50): Promise<AuditLogDto[]> {
    const res = await fetch(`${API_BASE}/auth/audit-logs?limit=${limit}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch security audit logs');
    return res.json();
  },
};
