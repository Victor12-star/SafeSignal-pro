import React, { useState, useEffect } from 'react';
import { LocationCoordinate } from '../types/safety';
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
} from 'lucide-react';

interface LiveEmergencyMapProps {
  location?: LocationCoordinate;
  senderName?: string;
  isRecipientView?: boolean;
  onUpdateCoordinates?: (newCoords: LocationCoordinate) => void;
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

// Approximate city / landmark resolver from coordinates
export function getApproximateAddress(lat: number, lng: number): string {
  // Stockholm / Sweden
  if (lat >= 59.2 && lat <= 59.5 && lng >= 17.8 && lng <= 18.2) {
    return 'Norrmalm / Central Station, Stockholm, Sweden';
  }
  // Lagos / Nigeria
  if (lat >= 6.3 && lat <= 6.6 && lng >= 3.2 && lng <= 3.6) {
    return 'Victoria Island / Marina, Lagos, Nigeria';
  }
  // London / UK
  if (lat >= 51.4 && lat <= 51.6 && lng >= -0.3 && lng <= 0.1) {
    return 'Westminster / Thames Embankment, London, UK';
  }
  // New York / USA
  if (lat >= 40.6 && lat <= 40.9 && lng >= -74.1 && lng <= -73.8) {
    return 'Midtown Manhattan, New York, NY, USA';
  }
  // Berlin / Germany
  if (lat >= 52.4 && lat <= 52.6 && lng >= 13.2 && lng <= 13.6) {
    return 'Mitte / Alexanderplatz, Berlin, Germany';
  }
  // Paris / France
  if (lat >= 48.7 && lat <= 48.9 && lng >= 2.2 && lng <= 2.5) {
    return '1st Arrondissement / Châtelet, Paris, France';
  }
  // Tokyo / Japan
  if (lat >= 35.5 && lat <= 35.8 && lng >= 139.6 && lng <= 140.0) {
    return 'Shinjuku / Shibuya, Tokyo, Japan';
  }
  return `${lat.toFixed(5)}°, ${lng.toFixed(5)}° (Live Satellite GPS Fix)`;
}

export const LiveEmergencyMap: React.FC<LiveEmergencyMapProps> = ({
  location,
  senderName = 'Alex',
  isRecipientView = false,
  onUpdateCoordinates,
}) => {
  const [zoom, setZoom] = useState(15);
  const [mapStyle, setMapStyle] = useState<'dark' | 'street' | 'satellite'>('dark');
  const [copied, setCopied] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [breadcrumbTrail, setBreadcrumbTrail] = useState<LocationCoordinate[]>([]);

  const defaultCoords: LocationCoordinate = {
    latitude: 59.3293,
    longitude: 18.0686,
    accuracyMeters: 12.4,
    timestamp: Date.now(),
    isLastKnown: false,
  };

  const currentLoc = location || defaultCoords;

  // Track breadcrumbs when location changes
  useEffect(() => {
    if (location) {
      setBreadcrumbTrail((prev) => {
        const last = prev[prev.length - 1];
        if (!last || last.latitude !== location.latitude || last.longitude !== location.longitude) {
          return [...prev.slice(-10), location];
        }
        return prev;
      });
    }
  }, [location?.latitude, location?.longitude]);

  const handleCopyCoords = () => {
    const text = `${currentLoc.latitude.toFixed(6)}, ${currentLoc.longitude.toFixed(6)}`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulate GPS walking / drift
  const handleSimulateMovement = () => {
    const deltaLat = (Math.random() - 0.5) * 0.0008;
    const deltaLng = (Math.random() - 0.5) * 0.0008;
    const newLoc: LocationCoordinate = {
      latitude: currentLoc.latitude + deltaLat,
      longitude: currentLoc.longitude + deltaLng,
      accuracyMeters: Math.max(5, Math.min(25, currentLoc.accuracyMeters + (Math.random() - 0.5) * 4)),
      timestamp: Date.now(),
      isLastKnown: false,
    };
    if (onUpdateCoordinates) {
      onUpdateCoordinates(newLoc);
    }
  };

  const handleResetCenter = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoom(15);
  };

  // Compute tile URLs for 3x3 grid around current location
  const centerTileX = lon2tile(currentLoc.longitude, zoom);
  const centerTileY = lat2tile(currentLoc.latitude, zoom);

  // Subdomains for CartoDB
  const getTileUrl = (x: number, y: number, z: number) => {
    if (mapStyle === 'street') {
      return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
    }
    // High-contrast dark matter map tiles
    const sub = ['a', 'b', 'c', 'd'][(x + y) % 4];
    return `https://cartodb-basemaps-${sub}.global.ssl.fastly.net/dark_all/${z}/${x}/${y}.png`;
  };

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${currentLoc.latitude},${currentLoc.longitude}`;
  const appleMapsUrl = `https://maps.apple.com/?ll=${currentLoc.latitude},${currentLoc.longitude}&q=Emergency+Location`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-0">
      {/* Map Header with Live Beacon Status & Geocoded Landmark */}
      <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 relative" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-white">
              <span>{isRecipientView ? `${senderName}'s Live GPS Location` : 'Your Live Location (GPS Beacon)'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-rose-950 text-rose-300 rounded border border-rose-800 uppercase">
                Live Fix
              </span>
            </div>
            <div className="text-[11px] text-slate-400 truncate max-w-[240px]">
              {getApproximateAddress(currentLoc.latitude, currentLoc.longitude)}
            </div>
          </div>
        </div>

        {/* GPS Accuracy Pill */}
        <div className="text-right">
          <div className="font-mono text-[11px] text-emerald-400 font-bold">
            ±{currentLoc.accuracyMeters.toFixed(1)}m
          </div>
          <div className="text-[10px] text-slate-500">
            {new Date(currentLoc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Interactive Map Viewport */}
      <div className="relative w-full h-56 bg-slate-950 overflow-hidden select-none touch-none">
        {/* Raster Tile Canvas Background */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-200"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
          }}
        >
          <div className="grid grid-cols-3 grid-rows-3 w-[768px] h-[768px] opacity-85">
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
                      // Fallback tile styling if tiles fail to load
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Tactical Coordinate Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />

        {/* Radar Sweep Effect */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border border-rose-500/20 animate-ping opacity-30" />
        </div>

        {/* Center Live GPS Pin & Accuracy Perimeter */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Accuracy Circle */}
          <div
            className="rounded-full bg-rose-500/15 border border-rose-500/40 animate-pulse pointer-events-none"
            style={{
              width: `${Math.max(48, Math.min(130, currentLoc.accuracyMeters * 3.5))}px`,
              height: `${Math.max(48, Math.min(130, currentLoc.accuracyMeters * 3.5))}px`,
            }}
          />

          {/* Core GPS Pin */}
          <div className="absolute flex flex-col items-center pointer-events-auto">
            <div className="relative flex items-center justify-center">
              <span className="w-5 h-5 rounded-full bg-rose-600 animate-ping absolute opacity-75" />
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-xl shadow-rose-900 border-2 border-white">
                <MapPin className="w-4 h-4 fill-white" />
              </div>
            </div>
            <div className="mt-1 px-2 py-0.5 bg-slate-950/95 border border-rose-500/80 rounded-full text-[10px] font-mono font-bold text-white shadow-lg whitespace-nowrap">
              {isRecipientView ? senderName : 'YOU ARE HERE'}
            </div>
          </div>
        </div>

        {/* Floating Map Controls Top-Right */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-20">
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
            onClick={() => setZoom((z) => Math.max(12, z - 1))}
            className="w-7 h-7 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg border border-slate-700 flex items-center justify-center shadow-md active:scale-95 transition-all"
            title="Zoom Out"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleResetCenter}
            className="w-7 h-7 bg-slate-900/90 hover:bg-slate-800 text-rose-400 rounded-lg border border-slate-700 flex items-center justify-center shadow-md active:scale-95 transition-all"
            title="Recenter on My GPS Fix"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMapStyle((s) => (s === 'dark' ? 'street' : 'dark'))}
            className="w-7 h-7 bg-slate-900/90 hover:bg-slate-800 text-sky-400 rounded-lg border border-slate-700 flex items-center justify-center shadow-md active:scale-95 transition-all text-[9px] font-bold"
            title="Toggle Map Style (Dark / Street)"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bottom Left Coordinate Badge */}
        <div className="absolute bottom-2 left-2 z-20">
          <div className="px-2 py-1 bg-slate-950/90 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-300 shadow-lg flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-rose-400 animate-pulse" />
            <span>
              {currentLoc.latitude.toFixed(5)}°, {currentLoc.longitude.toFixed(5)}°
            </span>
          </div>
        </div>

        {/* Bottom Right Movement Simulator (Only for person in danger) */}
        {!isRecipientView && (
          <div className="absolute bottom-2 right-2 z-20">
            <button
              type="button"
              onClick={handleSimulateMovement}
              className="px-2.5 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-lg text-[10px] font-semibold flex items-center gap-1 shadow-md transition-all active:scale-95"
              title="Simulate GPS movement / walking drift"
            >
              <Footprints className="w-3 h-3 text-emerald-400" />
              <span>Simulate Movement</span>
            </button>
          </div>
        )}
      </div>

      {/* Map Action Bar: Direct 1-Tap Links to Native Maps & Direct Navigation */}
      <div className="p-2.5 bg-slate-950 border-t border-slate-800 grid grid-cols-3 gap-2 text-xs">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl font-semibold text-center flex items-center justify-center gap-1 border border-slate-800 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
          <span>Google Maps</span>
        </a>

        <a
          href={appleMapsUrl}
          target="_blank"
          rel="noreferrer"
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl font-semibold text-center flex items-center justify-center gap-1 border border-slate-800 transition-colors"
        >
          <Compass className="w-3.5 h-3.5 text-sky-400" />
          <span>Apple Maps</span>
        </a>

        <button
          type="button"
          onClick={handleCopyCoords}
          className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl font-semibold text-center flex items-center justify-center gap-1 border border-slate-800 transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-400" />
              <span>Copy Coords</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
