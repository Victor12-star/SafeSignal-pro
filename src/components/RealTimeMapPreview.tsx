import React, { useState, useMemo } from 'react';
import { LocationCoordinate } from '../types/safety';
import {
  calculateDistanceMeters,
  generateInitialBreadcrumbs,
} from '../services/emergencyEngine';
import {
  MapPin,
  Compass,
  Navigation,
  ExternalLink,
  Copy,
  Check,
  Plus,
  Minus,
  Crosshair,
  Layers,
  Footprints,
  Radio,
  Clock,
  ArrowRight,
  TrendingUp,
  Info,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react';

interface RealTimeMapPreviewProps {
  currentLocation?: LocationCoordinate;
  locationHistory?: LocationCoordinate[];
  onUpdateLocation?: (loc: LocationCoordinate) => void;
  senderName?: string;
  isRecipientView?: boolean;
}

// Convert Lat/Lng to Web Mercator tile coordinates
function lon2tile(lon: number, zoom: number): number {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 -
      Math.log(
        Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
      ) /
        Math.PI) /
      2) *
      Math.pow(2, zoom)
  );
}

// Approximate city / landmark resolver
export function getApproximateAddress(lat: number, lng: number): string {
  if (lat >= 59.2 && lat <= 59.5 && lng >= 17.8 && lng <= 18.2) {
    return 'Norrmalm / Central Station, Stockholm, Sweden';
  }
  if (lat >= 6.3 && lat <= 6.6 && lng >= 3.2 && lng <= 3.6) {
    return 'Victoria Island / Marina, Lagos, Nigeria';
  }
  if (lat >= 51.4 && lat <= 51.6 && lng >= -0.3 && lng <= 0.1) {
    return 'Westminster / Thames Embankment, London, UK';
  }
  if (lat >= 40.6 && lat <= 40.9 && lng >= -74.1 && lng <= -73.8) {
    return 'Midtown Manhattan, New York, NY, USA';
  }
  if (lat >= 52.4 && lat <= 52.6 && lng >= 13.2 && lng <= 13.6) {
    return 'Mitte / Alexanderplatz, Berlin, Germany';
  }
  if (lat >= 48.7 && lat <= 48.9 && lng >= 2.2 && lng <= 2.5) {
    return '1st Arrondissement / Châtelet, Paris, France';
  }
  if (lat >= 35.5 && lat <= 35.8 && lng >= 139.6 && lng <= 140.0) {
    return 'Shinjuku / Shibuya, Tokyo, Japan';
  }
  return `${lat.toFixed(5)}°, ${lng.toFixed(5)}° (Live Satellite GPS Fix)`;
}

export const RealTimeMapPreview: React.FC<RealTimeMapPreviewProps> = ({
  currentLocation,
  locationHistory,
  onUpdateLocation,
  senderName = 'You',
  isRecipientView = false,
}) => {
  const [zoom, setZoom] = useState(16);
  const [mapStyle, setMapStyle] = useState<'dark' | 'street'>('dark');
  const [copied, setCopied] = useState(false);
  const [recenterSuccess, setRecenterSuccess] = useState(false);

  // Selected stop index (0 = Stop #1, 1 = Stop #2, 2 = Stop #3, 3 = Stop #4, 4 = Stop #5 Most Recent Fix)
  // Default to the last item (the most recent current location)
  const [selectedStopIndex, setSelectedStopIndex] = useState<number>(4);
  const [centerOnSelectedStop, setCenterOnSelectedStop] = useState<boolean>(true);

  // Fallback location if none provided
  const fallbackCoords: LocationCoordinate = useMemo(
    () => ({
      latitude: 59.32932,
      longitude: 18.06858,
      accuracyMeters: 11.8,
      timestamp: Date.now(),
      isLastKnown: false,
    }),
    []
  );

  const activeLoc = currentLocation || fallbackCoords;

  // Last 5 location updates for the emergency session breadcrumb trail
  const last5Updates: LocationCoordinate[] = useMemo(() => {
    if (locationHistory && locationHistory.length > 0) {
      const list = [...locationHistory];
      const last = list[list.length - 1];
      if (
        !last ||
        Math.abs(last.latitude - activeLoc.latitude) > 0.00001 ||
        Math.abs(last.longitude - activeLoc.longitude) > 0.00001
      ) {
        list.push(activeLoc);
      }
      return list.slice(-5);
    }
    return generateInitialBreadcrumbs(activeLoc);
  }, [locationHistory, activeLoc]);

  // Keep selected index within valid bounds
  const safeSelectedIndex = Math.min(
    Math.max(0, selectedStopIndex),
    Math.max(0, last5Updates.length - 1)
  );
  const selectedStop = last5Updates[safeSelectedIndex] || activeLoc;
  const isSelectedStopLive = safeSelectedIndex === last5Updates.length - 1;

  // Center coordinate for the map viewport (centers on the selected stop or most recent live fix)
  const mapCenterLoc = centerOnSelectedStop ? selectedStop : activeLoc;

  // Total trail distance across the 5 points
  const totalTrailDistance = useMemo(() => {
    let dist = 0;
    for (let i = 1; i < last5Updates.length; i++) {
      dist += calculateDistanceMeters(
        last5Updates[i - 1].latitude,
        last5Updates[i - 1].longitude,
        last5Updates[i].latitude,
        last5Updates[i].longitude
      );
    }
    return Math.round(dist);
  }, [last5Updates]);

  // Trail duration in seconds from first waypoint to most recent
  const trailDurationSeconds = useMemo(() => {
    if (last5Updates.length < 2) return 0;
    const first = last5Updates[0].timestamp;
    const last = last5Updates[last5Updates.length - 1].timestamp;
    return Math.max(1, Math.round((last - first) / 1000));
  }, [last5Updates]);

  // Distance from selected stop to current live fix (most recent position)
  const distanceToLive = useMemo(() => {
    if (isSelectedStopLive) return 0;
    const livePoint = last5Updates[last5Updates.length - 1];
    return Math.round(
      calculateDistanceMeters(
        selectedStop.latitude,
        selectedStop.longitude,
        livePoint.latitude,
        livePoint.longitude
      )
    );
  }, [selectedStop, last5Updates, isSelectedStopLive]);

  // Distance from previous stop
  const distanceFromPrev = useMemo(() => {
    if (safeSelectedIndex === 0) return 0;
    const prev = last5Updates[safeSelectedIndex - 1];
    return Math.round(
      calculateDistanceMeters(
        prev.latitude,
        prev.longitude,
        selectedStop.latitude,
        selectedStop.longitude
      )
    );
  }, [selectedStop, safeSelectedIndex, last5Updates]);

  const handleCopyCoords = (coord: LocationCoordinate) => {
    const text = `${coord.latitude.toFixed(6)}, ${coord.longitude.toFixed(6)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulate movement update to advance the breadcrumb trail live
  const handleSimulateMovement = () => {
    const angle = Math.random() * 2 * Math.PI;
    const stepDeg = 0.00022; // ~20 meters
    const newLat = activeLoc.latitude + Math.cos(angle) * stepDeg;
    const newLng = activeLoc.longitude + Math.sin(angle) * stepDeg;

    const newLoc: LocationCoordinate = {
      latitude: newLat,
      longitude: newLng,
      accuracyMeters: Math.max(6, Math.min(18, activeLoc.accuracyMeters + (Math.random() - 0.5) * 2)),
      timestamp: Date.now(),
      isLastKnown: false,
    };

    if (onUpdateLocation) {
      onUpdateLocation(newLoc);
    }
    // Automatically select the new latest position
    setSelectedStopIndex(last5Updates.length);
  };

  // Automatically pan the map to the most recent coordinate in the breadcrumb trail
  const handleRecenterToLatest = () => {
    setSelectedStopIndex(last5Updates.length - 1);
    setCenterOnSelectedStop(true);
    setZoom(16);
    setRecenterSuccess(true);
    setTimeout(() => setRecenterSuccess(false), 2200);
  };

  // Center coordinate for map tiles
  const centerTileX = lon2tile(mapCenterLoc.longitude, zoom);
  const centerTileY = lat2tile(mapCenterLoc.latitude, zoom);

  const getTileUrl = (x: number, y: number, z: number) => {
    if (mapStyle === 'street') {
      return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    }
    const sub = ['a', 'b', 'c', 'd'][(x + y) % 4];
    return `https://cartodb-basemaps-${sub}.global.ssl.fastly.net/dark_all/${z}/${x}/${y}.png`;
  };

  // Viewport dimensions for relative pixel projection
  const viewportWidth = 380;
  const viewportHeight = 240;

  // Project lat/lng offset to pixel coordinates relative to mapCenterLoc
  const projectToPixels = (lat: number, lng: number) => {
    const pixelsPerLonDegree = (256 * Math.pow(2, zoom)) / 360;
    const latRad = (mapCenterLoc.latitude * Math.PI) / 180;
    const pixelsPerLatDegree = pixelsPerLonDegree / Math.cos(latRad);

    const deltaX = (lng - mapCenterLoc.longitude) * pixelsPerLonDegree;
    const deltaY = -(lat - mapCenterLoc.latitude) * pixelsPerLatDegree;

    return {
      x: viewportWidth / 2 + deltaX,
      y: viewportHeight / 2 + deltaY,
    };
  };

  // Calculated SVG points for the breadcrumb line
  const pixelPoints = useMemo(() => {
    return last5Updates.map((pt, index) => {
      const { x, y } = projectToPixels(pt.latitude, pt.longitude);
      const isLatest = index === last5Updates.length - 1;
      return {
        ...pt,
        x,
        y,
        stepNumber: index + 1,
        isLatest,
        isSelected: index === safeSelectedIndex,
        // Opacity gradient for historical dots: #1 is 50%, #4 is 85%
        trailOpacity: isLatest ? 1 : 0.45 + index * 0.12,
      };
    });
  }, [last5Updates, zoom, mapCenterLoc, safeSelectedIndex]);

  // SVG polyline points string
  const polylinePoints = useMemo(() => {
    return pixelPoints.map((p) => `${p.x},${p.y}`).join(' ');
  }, [pixelPoints]);

  const selectedPixel = pixelPoints[safeSelectedIndex];
  const mostRecentPixel = pixelPoints[pixelPoints.length - 1];

  const selectedGoogleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${selectedStop.latitude},${selectedStop.longitude}`;
  const selectedAppleMapsUrl = `https://maps.apple.com/?ll=${selectedStop.latitude},${selectedStop.longitude}&q=Stop+${safeSelectedIndex + 1}+Location`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl space-y-0">
      {/* Real-Time Preview Header with Clear Hierarchy */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping absolute opacity-75" />
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 relative" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span>{isRecipientView ? `${senderName}'s Real-Time GPS` : 'Real-Time Emergency Map Preview'}</span>
              <span className="text-[10px] font-mono px-2 py-0.5 bg-rose-600 text-white rounded-full uppercase font-black tracking-wider shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live Position #5
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[240px]">
              {getApproximateAddress(activeLoc.latitude, activeLoc.longitude)}
            </div>
          </div>
        </div>

        {/* Trail Stats & GPS Accuracy */}
        <div className="text-right space-y-0.5">
          <div className="font-mono text-[11px] text-emerald-400 font-bold flex items-center justify-end gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ±{activeLoc.accuracyMeters.toFixed(1)}m
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {last5Updates.length}/5 Stops • ~{totalTrailDistance}m
          </div>
        </div>
      </div>

      {/* Visual Guide Banner: Explains Breadcrumbs vs Most Recent Position */}
      <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-slate-400 font-medium shrink-0">Map Legend:</span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-800/60 text-amber-300 font-mono text-[10px] shrink-0">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            #1–#4 Previous Fixes
          </span>
          <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-950/80 border border-rose-600 text-rose-200 font-mono text-[10px] font-bold shrink-0 ring-1 ring-rose-500/40">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            #5 Most Recent (Current)
          </span>
        </div>
        <span className="text-[10px] text-slate-400 font-mono hidden sm:inline-block">
          Direction of Travel ➔
        </span>
      </div>

      {/* Map Viewport with Breadcrumb Trail Overlay */}
      <div className="relative w-full h-72 bg-slate-950 overflow-hidden select-none">
        {/* Background Map Tiles (3x3 Grid) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-80">
          <div className="grid grid-cols-3 grid-rows-3 w-[768px] h-[768px]">
            {[-1, 0, 1].map((dy) =>
              [-1, 0, 1].map((dx) => {
                const tx = centerTileX + dx;
                const ty = centerTileY + dy;
                return (
                  <img
                    key={`${tx}-${ty}-${zoom}`}
                    src={getTileUrl(tx, ty, zoom)}
                    alt=""
                    className="w-[256px] h-[256px] object-cover bg-slate-900 border border-slate-900/30"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Tactical Coordinate Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />

        {/* Radar Sweep Effect centered on mapCenterLoc */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-60 h-60 rounded-full border border-rose-500/20 animate-ping opacity-20" />
        </div>

        {/* SVG Breadcrumb Vector Trail Layer */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
          preserveAspectRatio="none"
        >
          <defs>
            {/* Gradient for breadcrumb trajectory line: Faded Amber to High-Intensity Crimson */}
            <linearGradient id="trailGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.4" />
              <stop offset="60%" stopColor="#f43f5e" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#e11d48" stopOpacity="1" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Arrowhead marker pointing along direction of travel towards most recent fix */}
            <marker
              id="trailArrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#f43f5e" fillOpacity="0.85" />
            </marker>
          </defs>

          {/* Polyline Path connecting the 5 updates */}
          {pixelPoints.length > 1 && (
            <>
              {/* Outer soft glow line */}
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="4"
                strokeOpacity="0.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Core dashed trajectory line with arrow to latest */}
              <polyline
                points={polylinePoints}
                fill="none"
                stroke="url(#trailGradient)"
                strokeWidth="2.8"
                strokeDasharray="5 3"
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd="url(#trailArrow)"
                filter="url(#glow)"
              />
            </>
          )}

          {/* Render Trail Dots 1 to 4 (Historical stops) - Styled with muted amber & opacity progression */}
          {pixelPoints.map((pt, i) => {
            if (pt.isLatest) return null; // Latest point rendered with prominent beacon below
            const isSelected = safeSelectedIndex === i;
            return (
              <g
                key={`crumb-${i}-${pt.timestamp}`}
                className="cursor-pointer pointer-events-auto transition-transform"
                onClick={() => {
                  setSelectedStopIndex(i);
                  setCenterOnSelectedStop(true);
                }}
              >
                {/* Accuracy perimeter halo */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={Math.max(8, Math.min(22, pt.accuracyMeters * 0.7))}
                  fill="#f59e0b"
                  fillOpacity={isSelected ? 0.35 : 0.08}
                  stroke="#f59e0b"
                  strokeWidth={isSelected ? '2' : '1'}
                  strokeDasharray={isSelected ? 'none' : '2 2'}
                  strokeOpacity={isSelected ? '0.9' : pt.trailOpacity}
                />

                {/* Animated selection targeting reticle for clicked stop */}
                {isSelected && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="15"
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                    strokeDasharray="4 2"
                    className="animate-spin"
                    style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                  />
                )}

                {/* Historical point pin base (Muted tone compared to the glowing red beacon) */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isSelected ? 9 : 6.5}
                  fill={isSelected ? '#78350f' : '#0f172a'}
                  stroke={isSelected ? '#fbbf24' : '#d97706'}
                  strokeWidth={isSelected ? '2.5' : '1.8'}
                  strokeOpacity={pt.trailOpacity}
                  filter="url(#glow)"
                />

                {/* Number inside point */}
                <text
                  x={pt.x}
                  y={pt.y + 3.5}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize={isSelected ? '10' : '8'}
                  fontWeight="bold"
                  fontFamily="monospace"
                  fillOpacity={isSelected ? '1' : pt.trailOpacity}
                >
                  {pt.stepNumber}
                </text>

                {/* Small indicator label below historical pin */}
                <text
                  x={pt.x}
                  y={pt.y + 16}
                  textAnchor="middle"
                  fill="#fbbf24"
                  fontSize="7.5"
                  fontFamily="monospace"
                  fontWeight="bold"
                  fillOpacity={isSelected ? '1' : 0.75}
                >
                  #{pt.stepNumber}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Live GPS Beacon (#5 - MOST RECENT POSITION) - High Visual Contrast */}
        {mostRecentPixel && (
          <div
            className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
            style={{
              left: `${mostRecentPixel.x}px`,
              top: `${mostRecentPixel.y}px`,
            }}
          >
            {/* Outer Expanding Radar Waves (Double Pulse) */}
            <div
              className="rounded-full bg-rose-500/20 border-2 border-rose-500/70 animate-ping pointer-events-none"
              style={{
                width: `${Math.max(48, Math.min(120, activeLoc.accuracyMeters * 3.6))}px`,
                height: `${Math.max(48, Math.min(120, activeLoc.accuracyMeters * 3.6))}px`,
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            <div
              className="rounded-full bg-rose-600/10 border border-rose-400 animate-pulse pointer-events-none"
              style={{
                width: `${Math.max(34, Math.min(90, activeLoc.accuracyMeters * 2.8))}px`,
                height: `${Math.max(34, Math.min(90, activeLoc.accuracyMeters * 2.8))}px`,
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />

            {/* Core Most Recent Position Pin (Elevated, Bright Crimson, High Priority) */}
            <button
              type="button"
              onClick={() => {
                setSelectedStopIndex(last5Updates.length - 1);
                setCenterOnSelectedStop(true);
              }}
              className="relative flex flex-col items-center pointer-events-auto group focus:outline-none"
              title="Click to view Most Recent Position (#5 Live Fix)"
            >
              <div
                className={`w-9 h-9 rounded-full bg-gradient-to-tr from-rose-700 via-rose-600 to-red-500 text-white flex items-center justify-center shadow-2xl shadow-rose-950 border-2 transition-all ${
                  isSelectedStopLive
                    ? 'scale-125 border-white ring-4 ring-rose-500/80 shadow-rose-500/50'
                    : 'border-white/90 ring-2 ring-rose-500/50 hover:scale-110'
                }`}
              >
                <MapPin className="w-5 h-5 fill-white drop-shadow" />
              </div>

              {/* High-Visibility Banner Badge for the Latest Position */}
              <div className="mt-1 px-2.5 py-0.5 bg-rose-950/95 border-2 border-rose-500 rounded-full text-[9px] font-mono font-black text-rose-100 shadow-2xl whitespace-nowrap flex items-center gap-1.5 ring-1 ring-white/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm" />
                <span>#5 MOST RECENT</span>
              </div>
            </button>
          </div>
        )}

        {/* Floating Callout Bubble for Selected Stop on the Map */}
        {selectedPixel && (
          <div
            className="absolute z-25 pointer-events-auto transform -translate-x-1/2 transition-all duration-200"
            style={{
              left: `${Math.max(90, Math.min(viewportWidth - 90, selectedPixel.x))}px`,
              top: `${Math.max(12, selectedPixel.y - 64)}px`,
            }}
          >
            <div
              className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono shadow-2xl backdrop-blur-md whitespace-nowrap flex items-center gap-2 ${
                isSelectedStopLive
                  ? 'bg-rose-950/95 border-rose-500 text-rose-100 ring-2 ring-rose-500/40 shadow-rose-950'
                  : 'bg-slate-950/95 border-amber-500 text-amber-100 ring-1 ring-amber-500/30'
              }`}
            >
              <div className="flex items-center gap-1.5 font-black">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSelectedStopLive ? 'bg-rose-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                <span>{isSelectedStopLive ? '★ MOST RECENT (#5)' : `Stop #${safeSelectedIndex + 1}`}</span>
              </div>
              <span className="text-slate-400">|</span>
              <span className="font-semibold">
                {selectedStop.latitude.toFixed(5)}°, {selectedStop.longitude.toFixed(5)}°
              </span>
              <span className="text-slate-400">|</span>
              <span className={isSelectedStopLive ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                {isSelectedStopLive
                  ? 'Active Now'
                  : `${Math.round((Date.now() - selectedStop.timestamp) / 1000)}s ago`}
              </span>
            </div>
            {/* Pointer arrow */}
            <div
              className={`w-2.5 h-2.5 mx-auto rotate-45 transform -translate-y-1.5 ${
                isSelectedStopLive
                  ? 'bg-rose-950 border-r-2 border-b-2 border-rose-500'
                  : 'bg-slate-950 border-r border-b border-amber-500'
              }`}
            />
          </div>
        )}

        {/* Dedicated 'Re-center to Latest' Button Top-Left */}
        <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRecenterToLatest}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xl transition-all active:scale-95 border ${
              isSelectedStopLive && !recenterSuccess
                ? 'bg-slate-900/95 hover:bg-slate-800 text-slate-200 border-slate-700/80 hover:text-white'
                : 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 shadow-rose-950/80 animate-pulse'
            }`}
            title="Automatically pan the map to the most recent coordinate in the breadcrumb trail"
          >
            <Crosshair className="w-3.5 h-3.5 text-white" />
            <span>Re-center to Latest</span>
          </button>

          {recenterSuccess && (
            <div className="px-2.5 py-1 bg-emerald-950/95 border border-emerald-500 text-emerald-200 text-[10px] font-mono font-bold rounded-lg shadow-lg flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Centered on #5</span>
            </div>
          )}
        </div>

        {/* Floating Map Controls Top-Right */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-30">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(18, z + 1))}
            className="w-7 h-7 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg border border-slate-700 flex items-center justify-center shadow-md active:scale-95 transition-all"
            title="Zoom In"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(13, z - 1))}
            className="w-7 h-7 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg border border-slate-700 flex items-center justify-center shadow-md active:scale-95 transition-all"
            title="Zoom Out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleRecenterToLatest}
            className="w-7 h-7 bg-slate-900/90 hover:bg-rose-900/80 text-rose-400 hover:text-white rounded-lg border border-rose-700/60 flex items-center justify-center shadow-md active:scale-95 transition-all"
            title="Re-center to Latest (#5)"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMapStyle((s) => (s === 'dark' ? 'street' : 'dark'))}
            className="w-7 h-7 bg-slate-900/90 hover:bg-slate-800 text-sky-400 rounded-lg border border-slate-700 flex items-center justify-center shadow-md active:scale-95 transition-all"
            title="Toggle Map Style (Dark / Street)"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom Left Coordinate Indicator */}
        <div className="absolute bottom-2 left-2 z-30">
          <div className="px-2.5 py-1 bg-slate-950/90 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-300 shadow-lg flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
            <span>
              {isSelectedStopLive ? '🔴 Most Recent #5:' : `Stop #${safeSelectedIndex + 1}:`}{' '}
              {selectedStop.latitude.toFixed(5)}°, {selectedStop.longitude.toFixed(5)}°
            </span>
          </div>
        </div>

        {/* Bottom Right Movement Simulator (Advances Breadcrumb Trail) */}
        {!isRecipientView && (
          <div className="absolute bottom-2 right-2 z-30">
            <button
              type="button"
              onClick={handleSimulateMovement}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-black flex items-center gap-1.5 shadow-lg shadow-rose-950 transition-all active:scale-95 border border-rose-400"
              title="Simulate GPS movement update (advances the last 5 breadcrumb updates)"
            >
              <Footprints className="w-3.5 h-3.5" />
              <span>Simulate Movement (+1 Fix)</span>
            </button>
          </div>
        )}
      </div>

      {/* Breadcrumb Trail Timeline: Interactive 5-Stop Selector with Clear Distinction */}
      <div className="p-3 bg-slate-950/90 border-t border-slate-800 space-y-3">
        {/* Trail Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] gap-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-200">
            <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
            <span>Breadcrumb Sequence: 4 Historical Fixes ➔ Most Recent Position</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
            <span>Trail Window: ~{trailDurationSeconds}s</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">● Active Tracking</span>
          </div>
        </div>

        {/* 5-Step Breadcrumb Strip (Divided: Previous Stops #1-#4 vs Most Recent Stop #5) */}
        <div className="grid grid-cols-5 gap-1.5 text-center">
          {pixelPoints.map((pt, i) => {
            const isLatest = pt.isLatest;
            const isSelected = safeSelectedIndex === i;
            const timeLabel = isLatest
              ? 'LIVE NOW'
              : `${Math.round((Date.now() - pt.timestamp) / 1000)}s ago`;

            if (isLatest) {
              // Standout Most Recent Stop Card (Crimson, Glowing, Elevated)
              return (
                <button
                  type="button"
                  key={`step-${i}-${pt.timestamp}`}
                  onClick={() => {
                    setSelectedStopIndex(i);
                    setCenterOnSelectedStop(true);
                  }}
                  className={`p-1.5 rounded-xl border text-[10px] font-mono transition-all text-left space-y-0.5 cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-rose-900 border-rose-400 text-white ring-2 ring-rose-500 shadow-xl shadow-rose-950'
                      : 'bg-rose-950/60 border-rose-700/80 text-rose-200 hover:border-rose-500 shadow-md shadow-rose-950/50'
                  }`}
                >
                  <div className="flex items-center justify-between font-black">
                    <span className="text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      #{pt.stepNumber}
                    </span>
                    <span className="text-[8px] bg-rose-600 text-white px-1 py-0.2 rounded font-black tracking-tighter">
                      LATEST
                    </span>
                  </div>
                  <div className="text-[9px] font-bold text-rose-100 truncate">
                    {timeLabel}
                  </div>
                  <div className="text-[9px] text-emerald-300 font-mono">
                    ±{pt.accuracyMeters.toFixed(0)}m
                  </div>
                </button>
              );
            }

            // Historical Stops #1 to #4 (Muted Amber/Slate)
            return (
              <button
                type="button"
                key={`step-${i}-${pt.timestamp}`}
                onClick={() => {
                  setSelectedStopIndex(i);
                  setCenterOnSelectedStop(true);
                }}
                className={`p-1.5 rounded-xl border text-[10px] font-mono transition-all text-left space-y-0.5 cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-amber-950/90 border-amber-400 text-amber-100 ring-2 ring-amber-400/80 shadow-lg shadow-amber-950'
                    : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold">
                  <span className={isSelected ? 'text-amber-300 font-extrabold' : 'text-amber-400/80'}>
                    #{pt.stepNumber}
                  </span>
                  <span className="text-[8px] text-slate-400">{timeLabel}</span>
                </div>
                <div className="text-[9px] text-slate-400 truncate">
                  Past Fix
                </div>
                <div className="text-[9px] text-slate-500">
                  ±{pt.accuracyMeters.toFixed(0)}m
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Stop Inspector Card: Displays Location of Clicked Stop */}
        <div
          className={`p-3 rounded-xl border transition-all space-y-2.5 ${
            isSelectedStopLive
              ? 'bg-gradient-to-b from-rose-950/50 to-slate-950/90 border-rose-600/80 shadow-lg shadow-rose-950/40'
              : 'bg-amber-950/20 border-amber-800/60'
          }`}
        >
          {/* Stop Title & Context */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
                  isSelectedStopLive
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-amber-900 text-amber-100 border border-amber-700'
                }`}
              >
                {isSelectedStopLive ? '★ MOST RECENT POSITION' : `Stop #${safeSelectedIndex + 1} (Historical)`}
              </span>
              <span className="text-xs font-bold text-white">
                {isSelectedStopLive
                  ? 'Active Emergency Distress Coordinates'
                  : `Position Registered at Stop #${safeSelectedIndex + 1}`}
              </span>
            </div>

            <span className="text-[10px] font-mono text-slate-400">
              {new Date(selectedStop.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
          </div>

          {/* Coordinate & Accuracy Data Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
            {/* Latitude & Longitude */}
            <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800/80 space-y-0.5">
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold flex items-center justify-between">
                <span>Coordinates</span>
                <button
                  type="button"
                  onClick={() => handleCopyCoords(selectedStop)}
                  className="hover:text-amber-400 text-slate-400"
                  title="Copy this stop's coordinates"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
              <div className="text-white font-bold truncate">
                {selectedStop.latitude.toFixed(5)}°, {selectedStop.longitude.toFixed(5)}°
              </div>
            </div>

            {/* GPS Accuracy */}
            <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800/80 space-y-0.5">
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                GPS Accuracy
              </div>
              <div className="text-emerald-400 font-bold">
                ±{selectedStop.accuracyMeters.toFixed(1)} meters
              </div>
            </div>

            {/* Distance Delta Relative to Most Recent */}
            <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800/80 space-y-0.5 col-span-2 sm:col-span-1">
              <div className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">
                {isSelectedStopLive ? 'Active Telemetry' : 'Distance to Latest'}
              </div>
              <div className={isSelectedStopLive ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                {isSelectedStopLive ? '0m (Current Point)' : `${distanceToLive}m behind latest fix`}
              </div>
            </div>
          </div>

          {/* Street / Landmark Address for this specific stop */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
            <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">
              <strong>Area:</strong> {getApproximateAddress(selectedStop.latitude, selectedStop.longitude)}
            </span>
          </div>

          {/* Explanatory Context for Family / Responders */}
          <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
            <span>
              {isRecipientView
                ? isSelectedStopLive
                  ? `${senderName}'s current real-time GPS location. Responders should navigate here.`
                  : `${senderName} was registered at Stop #${safeSelectedIndex + 1} (${Math.round(
                      (Date.now() - selectedStop.timestamp) / 1000
                    )}s ago) before moving.`
                : isSelectedStopLive
                ? 'Your active emergency satellite beacon. Broadcasting live coordinates to responders.'
                : `Recorded past fix from ${Math.round(
                    (Date.now() - selectedStop.timestamp) / 1000
                  )}s ago (${distanceFromPrev > 0 ? `+${distanceFromPrev}m from previous stop` : 'origin point'}).`}
            </span>

            {/* Quick jump to most recent fix if past stop selected */}
            {!isSelectedStopLive && (
              <button
                type="button"
                onClick={() => {
                  setSelectedStopIndex(last5Updates.length - 1);
                  setCenterOnSelectedStop(true);
                }}
                className="text-rose-400 hover:text-rose-300 font-bold underline flex items-center gap-0.5 shrink-0 ml-2 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60"
              >
                <span>Snap to Most Recent (#5)</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar: Direct Links to Native Maps for the Selected Stop */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800 grid grid-cols-3 gap-2 text-xs">
        <a
          href={selectedGoogleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="py-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all text-center"
        >
          <ExternalLink className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="truncate">
            {isSelectedStopLive ? 'Google Maps (Live)' : `Stop #${safeSelectedIndex + 1} Google Maps`}
          </span>
        </a>

        <a
          href={selectedAppleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="py-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all text-center"
        >
          <Navigation className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span className="truncate">Apple Maps</span>
        </a>

        <button
          type="button"
          onClick={() => handleCopyCoords(selectedStop)}
          className="py-2 px-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition-all"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="text-emerald-400 truncate">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">
                {isSelectedStopLive ? 'Copy Live Fix' : `Copy Stop #${safeSelectedIndex + 1}`}
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
