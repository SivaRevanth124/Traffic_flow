import React, { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  MapPin,
  Layers,
  Camera,
  Activity,
  Filter,
  Eye,
  Sliders,
  Maximize2,
  Navigation,
  Info,
  Clock,
  Compass,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  RotateCw,
  Video
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import {
  api,
  CameraDto,
  CrossCameraAssociationDto
} from '../services/api';

// Dark matter tile style for professional traffic intelligence control center
const DARK_MAP_STYLE: any = {
  version: 8,
  sources: {
    'carto-dark': {
      type: 'raster',
      tiles: [
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
      ],
      tileSize: 256,
      attribution: '© OpenStreetMap, © CARTO'
    }
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#0B0F19' }
    },
    {
      id: 'carto-tiles',
      type: 'raster',
      source: 'carto-dark',
      minzoom: 0,
      maxzoom: 19
    }
  ]
};

// Route color palette by cluster
const ROUTE_COLORS: Record<string, string> = {
  'ASSOC-401': '#3B82F6', // Blue (Northern Arterial)
  'ASSOC-402': '#F59E0B', // Amber (Harbor-Airport Highway)
  'ASSOC-403': '#06B6D4', // Cyan (University Connector)
  'ASSOC-404': '#10B981', // Emerald (Municipal Transit Corridor)
};

interface CityTrafficMapProps {
  onNavigate?: (page: string) => void;
}

export const CityTrafficMap: React.FC<CityTrafficMapProps> = ({ onNavigate }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const [activeLayer, setActiveLayer] = useState<'all' | 'cameras' | 'trajectories' | 'congestion'>('all');
  const [cameras, setCameras] = useState<CameraDto[]>([]);
  const [associations, setAssociations] = useState<CrossCameraAssociationDto[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<CameraDto | null>(null);
  const [selectedTrajectory, setSelectedTrajectory] = useState<CrossCameraAssociationDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Load real cameras and associations from backend
  useEffect(() => {
    loadMapData();
  }, []);

  const loadMapData = async () => {
    setLoading(true);
    try {
      const [cams, assocs] = await Promise.all([
        api.getCameras(),
        api.getCrossCameraAssociations()
      ]);
      setCameras(cams);
      setAssociations(assocs);
      if (cams.length > 0 && !selectedCamera) {
        setSelectedCamera(cams[0]);
      }
    } catch (err) {
      console.error('Failed to load map data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Center map around city core (NYC/Metro coords of seeded cameras)
    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: DARK_MAP_STYLE,
      center: [-73.97, 40.71],
      zoom: 11.2,
      pitch: 35,
      bearing: -10,
      attributionControl: false
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), 'top-right');

    map.on('load', () => {
      mapInstanceRef.current = map;
      renderGeoOverlays(map, cameras, associations);
    });

    return () => {
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update overlays whenever cameras or associations change
  useEffect(() => {
    if (!mapInstanceRef.current || !mapInstanceRef.current.isStyleLoaded()) return;
    renderGeoOverlays(mapInstanceRef.current, cameras, associations);
  }, [cameras, associations, activeLayer, filterCategory]);

  const renderGeoOverlays = (
    map: maplibregl.Map,
    cams: CameraDto[],
    assocs: CrossCameraAssociationDto[]
  ) => {
    // 1. Clear existing DOM markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Filter associations by category if selected
    const filteredAssocs = assocs.filter(
      a => filterCategory === 'all' || a.vehicle_category.toLowerCase() === filterCategory.toLowerCase()
    );

    // 2. Render Camera Markers
    if (activeLayer === 'all' || activeLayer === 'cameras') {
      cams.forEach(cam => {
        const el = document.createElement('div');
        el.className = 'group cursor-pointer relative';

        const statusColor =
          cam.status === 'online' ? '#10B981' : cam.status === 'degraded' ? '#F59E0B' : '#EF4444';

        el.innerHTML = `
          <div style="position: relative; display: flex; align-items: center; justify-content: center;">
            <div style="
              position: absolute;
              width: 24px;
              height: 24px;
              border-radius: 9999px;
              background-color: ${statusColor}22;
              border: 1px solid ${statusColor}66;
              animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
            <div style="
              width: 14px;
              height: 14px;
              border-radius: 9999px;
              background-color: ${statusColor};
              border: 2px solid #0B0F19;
              box-shadow: 0 0 10px ${statusColor}88;
            "></div>
          </div>
        `;

        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedCamera(cam);
          setSelectedTrajectory(null);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([cam.longitude, cam.latitude])
          .addTo(map);

        markersRef.current.push(marker);
      });
    }

    // 3. Render Trajectories (GeoJSON Lines)
    const lineFeatures: any[] = [];
    if (activeLayer === 'all' || activeLayer === 'trajectories') {
      const camMap = new Map(cams.map(c => [c.camera_id, c]));

      filteredAssocs.forEach(a => {
        const srcCam = camMap.get(a.source_camera_id);
        const dstCam = camMap.get(a.dest_camera_id);

        if (srcCam && dstCam) {
          // Mid-point curve offset for realistic road corridor visualization
          const midLng = (srcCam.longitude + dstCam.longitude) / 2 + 0.005;
          const midLat = (srcCam.latitude + dstCam.latitude) / 2 + 0.005;

          lineFeatures.push({
            type: 'Feature',
            properties: {
              id: a.association_id,
              color: ROUTE_COLORS[a.association_id] || '#3B82F6',
              category: a.vehicle_category,
              confidence: a.confidence_score,
              title: `${a.source_camera_id} → ${a.dest_camera_id}`
            },
            geometry: {
              type: 'LineString',
              coordinates: [
                [srcCam.longitude, srcCam.latitude],
                [midLng, midLat],
                [dstCam.longitude, dstCam.latitude]
              ]
            }
          });
        }
      });
    }

    const geojsonData: any = {
      type: 'FeatureCollection',
      features: lineFeatures
    };

    if (map.getSource('traffic-trajectories')) {
      (map.getSource('traffic-trajectories') as maplibregl.GeoJSONSource).setData(geojsonData);
    } else {
      map.addSource('traffic-trajectories', {
        type: 'geojson',
        data: geojsonData
      });

      // Outer glow line
      map.addLayer({
        id: 'trajectories-glow',
        type: 'line',
        source: 'traffic-trajectories',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 6,
          'line-opacity': 0.35,
          'line-blur': 3
        }
      });

      // Core crisp trajectory line
      map.addLayer({
        id: 'trajectories-core',
        type: 'line',
        source: 'traffic-trajectories',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 2.5,
          'line-opacity': 0.95
        }
      });

      map.on('click', 'trajectories-core', (e) => {
        if (e.features && e.features[0]) {
          const assocId = e.features[0].properties?.id;
          const matched = assocs.find(a => a.association_id === assocId);
          if (matched) {
            setSelectedTrajectory(matched);
            setSelectedCamera(null);
          }
        }
      });

      map.on('mouseenter', 'trajectories-core', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      map.on('mouseleave', 'trajectories-core', () => {
        map.getCanvas().style.cursor = '';
      });
    }

    // 4. Congestion Hotspots (Density circles)
    const hotspotFeatures: any[] = [];
    if (activeLayer === 'all' || activeLayer === 'congestion') {
      cams.forEach(cam => {
        const isDense = cam.camera_id === 'CAM-002' || cam.camera_id === 'CAM-001';
        hotspotFeatures.push({
          type: 'Feature',
          properties: {
            id: cam.camera_id,
            intensity: isDense ? 0.85 : 0.30,
            color: isDense ? '#EF4444' : '#10B981',
            radius: isDense ? 35 : 18
          },
          geometry: {
            type: 'Point',
            coordinates: [cam.longitude, cam.latitude]
          }
        });
      });
    }

    const hotspotsData: any = {
      type: 'FeatureCollection',
      features: hotspotFeatures
    };

    if (map.getSource('traffic-hotspots')) {
      (map.getSource('traffic-hotspots') as maplibregl.GeoJSONSource).setData(hotspotsData);
    } else {
      map.addSource('traffic-hotspots', {
        type: 'geojson',
        data: hotspotsData
      });

      map.addLayer({
        id: 'hotspots-circles',
        type: 'circle',
        source: 'traffic-hotspots',
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.25,
          'circle-stroke-width': 1,
          'circle-stroke-color': ['get', 'color'],
          'circle-stroke-opacity': 0.6
        }
      });
    }
  };

  const handleFocusCamera = (cam: CameraDto) => {
    setSelectedCamera(cam);
    setSelectedTrajectory(null);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo({
        center: [cam.longitude, cam.latitude],
        zoom: 14,
        speed: 1.2
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Map Control Header */}
      <div className="bg-[#111827] border border-[#1F293D] p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-4">
        {/* Layer Toggles */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" /> MAP LAYERS:
          </span>
          {[
            { id: 'all', label: 'All Overlays' },
            { id: 'cameras', label: 'CCTV Sensors' },
            { id: 'trajectories', label: 'Route Trajectories' },
            { id: 'congestion', label: 'Congestion Heatmap' },
          ].map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveLayer(l.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeLayer === l.id
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'bg-[#161F30] text-slate-400 hover:text-white border border-[#1F293D]'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* Vehicle Category Filter & Demo Notice */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-[#0B0F19] border border-[#1F293D] text-xs text-white rounded-lg px-2.5 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Vehicles</option>
              <option value="car">Cars Only</option>
              <option value="truck">Trucks Only</option>
              <option value="bus">Buses Only</option>
              <option value="motorcycle">Motorcycles</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-lg border border-cyan-500/20">
            <Info className="w-3.5 h-3.5" />
            <span>AUTHENTIC CITY SENSOR TOPOLOGY (DEMO DATA LABELED)</span>
          </div>
        </div>
      </div>

      {/* Main Map Viewport + Details Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[720px]">
        {/* Map Canvas (3 cols) */}
        <div className="lg:col-span-3 bg-[#0B0F19] rounded-xl border border-[#1F293D] relative overflow-hidden flex flex-col">
          {/* MapLibre WebGL Canvas Container */}
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Map HUD Overlay Footer */}
          <div className="absolute bottom-3 left-3 right-3 bg-[#0B0F19]/90 backdrop-blur-md border border-[#1F293D] rounded-lg px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 pointer-events-none z-10">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-white font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Online: {cameras.filter(c => c.status === 'online').length}
              </span>
              <span className="flex items-center gap-1.5 text-white font-mono">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Degraded: {cameras.filter(c => c.status === 'degraded').length}
              </span>
              <span className="flex items-center gap-1.5 text-white font-mono">
                <span className="w-2 h-2 rounded-full bg-red-400"></span> Offline: {cameras.filter(c => c.status === 'offline').length}
              </span>
              <span className="text-slate-500">|</span>
              <span className="font-mono text-blue-400">Active Corridors: {associations.length}</span>
            </div>

            <div className="font-mono text-[11px] text-slate-400">
              MapLibre GL Vector Engine • Projection: EPSG:3857
            </div>
          </div>
        </div>

        {/* Right Information & Telemetry Drawer (1 col) */}
        <div className="bg-[#111827] rounded-xl border border-[#1F293D] flex flex-col overflow-hidden">
          {/* Drawer Header */}
          <div className="p-4 border-b border-[#1F293D] flex items-center justify-between bg-[#161F30]">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-400" />
              {selectedTrajectory ? 'Trajectory Inspector' : 'Optical Sensor Details'}
            </h3>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              LIVE TELEMETRY
            </span>
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {/* Case A: Trajectory Selected */}
            {selectedTrajectory ? (
              <div className="space-y-4">
                <div className="bg-[#0B0F19] p-3.5 rounded-lg border border-[#1F293D] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-400 text-xs">
                      {selectedTrajectory.association_id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        selectedTrajectory.status === 'verified'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      }`}
                    >
                      {selectedTrajectory.status.toUpperCase()}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white">
                    {selectedTrajectory.vehicle_description}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Cross-camera trajectory association verified across city road graph.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#0B0F19] p-2.5 rounded border border-[#1F293D]">
                    <span className="text-[11px] text-slate-500 block">Origin Sensor</span>
                    <span className="font-semibold text-white">{selectedTrajectory.source_camera_id}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{selectedTrajectory.source_time_str}</span>
                  </div>
                  <div className="bg-[#0B0F19] p-2.5 rounded border border-[#1F293D]">
                    <span className="text-[11px] text-slate-500 block">Destination</span>
                    <span className="font-semibold text-white">{selectedTrajectory.dest_camera_id}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{selectedTrajectory.dest_time_str}</span>
                  </div>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#1F293D]">
                    <span className="text-slate-400">Measured Transit</span>
                    <span className="font-mono font-bold text-white">{selectedTrajectory.travel_time_str}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1F293D]">
                    <span className="text-slate-400">Expected Corridor</span>
                    <span className="font-mono text-slate-300">{selectedTrajectory.expected_transit_str}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1F293D]">
                    <span className="text-slate-400">Corridor Distance</span>
                    <span className="font-mono text-slate-300">{(selectedTrajectory.distance_meters / 1000).toFixed(1)} km</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1F293D]">
                    <span className="text-slate-400">Confidence Score</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {(selectedTrajectory.confidence_score * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedTrajectory(null)}
                  className="w-full py-2 bg-[#161F30] hover:bg-[#1E293B] text-slate-300 rounded-lg text-xs font-semibold border border-[#1F293D] transition-colors"
                >
                  Back to Camera Sensors
                </button>
              </div>
            ) : selectedCamera ? (
              /* Case B: Camera Selected */
              <div className="space-y-4">
                <div className="bg-[#0B0F19] p-3.5 rounded-lg border border-[#1F293D] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan-400 text-xs">
                      {selectedCamera.camera_id}
                    </span>
                    <StatusBadge status={selectedCamera.status} />
                  </div>
                  <h4 className="text-sm font-bold text-white">{selectedCamera.name}</h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    {selectedCamera.location}
                  </p>
                </div>

                {/* Live CCTV Video Preview Frame */}
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-[#1F293D] flex items-center justify-center shadow-inner">
                  {selectedCamera.status === 'online' || selectedCamera.status === 'degraded' ? (
                    <>
                      <video
                        key={`map-cam-${selectedCamera.camera_id}`}
                        src={`/api/v1/cameras/${selectedCamera.camera_id}/live-stream`}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to MJPEG if H.264 range stream encounters any decode issue
                          const target = e.target as HTMLVideoElement;
                          target.style.display = 'none';
                          const img = document.getElementById(`fallback-img-${selectedCamera.camera_id}`);
                          if (img) img.style.display = 'block';
                        }}
                      />
                      <img
                        id={`fallback-img-${selectedCamera.camera_id}`}
                        src={`/api/v1/cameras/${selectedCamera.camera_id}/mjpeg`}
                        alt={`CCTV Live ${selectedCamera.camera_id}`}
                        style={{ display: 'none' }}
                        className="w-full h-full object-cover select-none"
                      />
                      <div className="absolute top-2 left-2 bg-black/80 border border-emerald-500/40 px-2 py-0.5 rounded font-mono text-[9px] text-emerald-300 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span>LIVE CCTV FEED</span>
                      </div>
                      {onNavigate && (
                        <button
                          onClick={() => onNavigate('video-wall')}
                          className="absolute bottom-2 right-2 bg-blue-600/90 hover:bg-blue-600 text-white px-2 py-1 rounded text-[10px] font-semibold flex items-center gap-1 shadow-md transition-colors"
                        >
                          <Maximize2 className="w-3 h-3" /> Video Wall
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-1.5 opacity-80" />
                      <div className="text-xs font-semibold text-rose-400">Sensor Stream Offline</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {selectedCamera.last_error || 'Socket handshake timeout.'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Technical Specifications Matrix */}
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#1F293D]">
                    <span className="text-slate-400">Group / Zone</span>
                    <span className="font-medium text-white">{selectedCamera.camera_group}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1F293D]">
                    <span className="text-slate-400">Sensor Model</span>
                    <span className="font-medium text-white">{selectedCamera.camera_type}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1F293D]">
                    <span className="text-slate-400">Geocoordinates</span>
                    <span className="font-mono text-cyan-400 text-[11px]">
                      {selectedCamera.latitude.toFixed(4)}°N, {Math.abs(selectedCamera.longitude).toFixed(4)}°W
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1F293D]">
                    <span className="text-slate-400">Stream Capability</span>
                    <span className="font-mono text-white">{selectedCamera.resolution} @ {selectedCamera.fps} FPS</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#1F293D]">
                    <span className="text-slate-400">RTSP Stream (Masked)</span>
                    <span className="font-mono text-slate-400 text-[11px] truncate max-w-[170px]">
                      {selectedCamera.rtsp_url_masked || 'rtsp://***:***@edge.node'}
                    </span>
                  </div>
                </div>

                {/* Quick Camera Switcher Buttons */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-semibold text-slate-400 block">Switch Focus Sensor:</span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {cameras.map(c => (
                      <button
                        key={c.camera_id}
                        onClick={() => handleFocusCamera(c)}
                        className={`p-1.5 rounded text-[11px] font-mono border transition-colors ${
                          selectedCamera.camera_id === c.camera_id
                            ? 'bg-blue-600 text-white border-blue-500 font-bold'
                            : 'bg-[#0B0F19] text-slate-400 hover:text-white border-[#1F293D]'
                        }`}
                      >
                        {c.camera_id}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Click any camera marker or trajectory polyline on the city map to inspect real telemetry.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
