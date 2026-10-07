import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { BatteryHistoryPoint } from '../types/safety';
import {
  estimateRemainingMinutes,
  generateBatteryHistory,
  CRITICAL_BATTERY_THRESHOLD,
  SHUTDOWN_BATTERY_THRESHOLD,
  isBatteryCritical,
  willBatteryDropBelow5In20Mins,
  getMinutesUntilDropBelow5,
} from '../services/emergencyEngine';
import {
  Battery,
  BatteryCharging,
  AlertTriangle,
  Clock,
  ZapOff,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from 'lucide-react';

interface BatteryHistoryChartProps {
  currentLevel: number;
  isCharging?: boolean;
  history?: BatteryHistoryPoint[];
  compact?: boolean;
  forceHighlight?: boolean;
}

export const BatteryHistoryChart: React.FC<BatteryHistoryChartProps> = ({
  currentLevel,
  isCharging = false,
  history,
  compact = false,
  forceHighlight = false,
}) => {
  const [showDetailedGuide, setShowDetailedGuide] = useState(false);

  // Ensure we have points covering the past hour
  const data = history && history.length >= 4 ? history : generateBatteryHistory(currentLevel);

  const estimatedMins = estimateRemainingMinutes(currentLevel, isCharging);
  const isCritical = isBatteryCritical(currentLevel); // <= 15%
  const isProjectedBelow5In20 = forceHighlight || willBatteryDropBelow5In20Mins(currentLevel, isCharging);
  const minsUntil5 = getMinutesUntilDropBelow5(currentLevel, isCharging);

  // Determine current alert zone
  const currentZone =
    currentLevel <= SHUTDOWN_BATTERY_THRESHOLD
      ? {
          name: 'Shutdown Reserve',
          code: 'shutdown',
          badgeBg: 'bg-rose-950 text-rose-300 border-rose-600',
          textColor: 'text-rose-400',
          borderColor: 'border-rose-500',
          desc: 'Imminent device cutoff (<5%). Final emergency GPS fix dispatched.',
        }
      : currentLevel <= CRITICAL_BATTERY_THRESHOLD
      ? {
          name: 'Critical Warning',
          code: 'critical',
          badgeBg: 'bg-rose-900/60 text-rose-200 border-rose-500/80',
          textColor: 'text-rose-400',
          borderColor: 'border-rose-600',
          desc: 'Automated low-battery SMS alert sent to trusted contacts.',
        }
      : currentLevel <= 49
      ? {
          name: 'Caution Zone',
          code: 'caution',
          badgeBg: 'bg-amber-950/70 text-amber-200 border-amber-600',
          textColor: 'text-amber-400',
          borderColor: 'border-amber-500',
          desc: 'Moderate reserve. Emergency beacon prioritizing GPS telemetry.',
        }
      : {
          name: 'Optimal Zone',
          code: 'optimal',
          badgeBg: 'bg-emerald-950/70 text-emerald-200 border-emerald-600',
          textColor: 'text-emerald-400',
          borderColor: 'border-emerald-500',
          desc: 'Sufficient power for continuous high-rate emergency broadcast.',
        };

  // Line and accent colors based on status
  const lineColor = isProjectedBelow5In20
    ? '#f43f5e'
    : isCritical
    ? '#fb7185'
    : currentLevel <= 49
    ? '#f59e0b'
    : '#10b981';

  const formatEstimatedTime = (mins: number) => {
    if (isCharging) return 'Charging (Unlimited)';
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const rem = mins % 60;
      return `~${hrs}h ${rem}m remaining`;
    }
    return `~${mins}m remaining`;
  };

  return (
    <div
      className={`p-3.5 rounded-xl transition-all duration-300 space-y-3 ${
        isProjectedBelow5In20
          ? 'bg-rose-950/70 border-2 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.65)] ring-2 ring-rose-500/80'
          : isCritical
          ? 'bg-rose-950/30 border border-rose-800/80'
          : 'bg-slate-950 border border-slate-800/90'
      }`}
    >
      {/* Top Banner when projected to drop below 5% in under 20 mins */}
      {isProjectedBelow5In20 && (
        <div className="flex items-center justify-between bg-rose-900/80 px-2.5 py-1.5 rounded-lg border border-rose-600 text-rose-100 text-[11px] font-bold animate-pulse">
          <div className="flex items-center gap-1.5">
            <ZapOff className="w-3.5 h-3.5 text-rose-300 shrink-0" />
            <span>CRITICAL DRAIN: Drops &lt;5% in {minsUntil5 === 0 ? '&lt;1' : `~${minsUntil5}`} mins</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider bg-rose-950 px-1.5 py-0.5 rounded border border-rose-700 font-mono">
            Shutdown Risk
          </span>
        </div>
      )}

      {/* Header with gauge and estimated time */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {isCharging ? (
            <BatteryCharging className="w-4 h-4 text-emerald-400" />
          ) : isProjectedBelow5In20 ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
          ) : isCritical ? (
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
          ) : (
            <Battery className="w-4 h-4 text-slate-400" />
          )}
          <span className={`font-semibold ${isProjectedBelow5In20 ? 'text-rose-200 font-bold' : 'text-slate-200'}`}>
            Battery History &amp; Projection
          </span>
          <span className="text-[10px] text-slate-500">(1-Hour Telemetry)</span>
        </div>

        <div className="flex items-center gap-1 font-mono text-[11px]">
          <Clock className="w-3 h-3 text-slate-500" />
          <span
            className={`font-semibold tabular-nums ${
              isProjectedBelow5In20
                ? 'text-rose-300 font-bold'
                : isCritical
                ? 'text-rose-400 animate-pulse'
                : currentLevel <= 49
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {formatEstimatedTime(estimatedMins)}
          </span>
        </div>
      </div>

      {/* Recharts Line Chart */}
      <div className="w-full h-28 pt-1">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
          >
            <XAxis
              dataKey="timeLabel"
              tickLine={false}
              axisLine={{ stroke: isProjectedBelow5In20 ? '#881337' : '#334155', strokeWidth: 1 }}
              tick={{ fill: isProjectedBelow5In20 ? '#fda4af' : '#64748b', fontSize: 10, fontFamily: 'monospace' }}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 5, 15, 50, 100]}
              tickLine={false}
              axisLine={{ stroke: isProjectedBelow5In20 ? '#881337' : '#334155', strokeWidth: 1 }}
              tick={{ fill: isProjectedBelow5In20 ? '#fda4af' : '#64748b', fontSize: 9, fontFamily: 'monospace' }}
              tickFormatter={(v) => `${v}%`}
            />

            {/* Caution Threshold 50% Reference Line */}
            <ReferenceLine
              y={50}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              strokeWidth={0.8}
              strokeOpacity={0.6}
              label={{
                value: '50% Caution',
                position: 'insideTopRight',
                fill: '#d97706',
                fontSize: 8,
                fontWeight: 500,
              }}
            />

            {/* Critical Threshold 15% Reference Line */}
            <ReferenceLine
              y={CRITICAL_BATTERY_THRESHOLD}
              stroke="#fb7185"
              strokeDasharray="3 3"
              strokeWidth={1.2}
              label={{
                value: '15% Critical Threshold',
                position: 'insideBottomRight',
                fill: '#fb7185',
                fontSize: 8.5,
                fontWeight: 600,
              }}
            />

            {/* Shutdown Reserve 5% Reference Line */}
            <ReferenceLine
              y={SHUTDOWN_BATTERY_THRESHOLD}
              stroke="#e11d48"
              strokeDasharray="2 2"
              strokeWidth={1.5}
              label={{
                value: '5% Shutdown Reserve',
                position: 'insideBottomLeft',
                fill: '#f43f5e',
                fontSize: 8.5,
                fontWeight: 700,
              }}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const pt = payload[0].payload as BatteryHistoryPoint;
                  const zoneLabel =
                    pt.batteryLevel <= 5
                      ? 'Shutdown Reserve'
                      : pt.batteryLevel <= 15
                      ? 'Critical Warning'
                      : pt.batteryLevel <= 49
                      ? 'Caution'
                      : 'Optimal';
                  const zoneColor =
                    pt.batteryLevel <= 5
                      ? 'text-rose-500 font-bold'
                      : pt.batteryLevel <= 15
                      ? 'text-rose-400 font-semibold'
                      : pt.batteryLevel <= 49
                      ? 'text-amber-400'
                      : 'text-emerald-400';

                  return (
                    <div className="bg-slate-900 border border-slate-700 p-2 rounded-lg shadow-xl text-[10px] font-mono space-y-1 z-50">
                      <div className="text-slate-400 font-semibold">{pt.timeLabel}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold">{pt.batteryLevel}%</span>
                        <span className={`text-[9px] uppercase px-1 py-0.2 rounded border border-slate-700 ${zoneColor}`}>
                          {zoneLabel}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400">
                        GPS telemetry drain: ~0.28%/min
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Line
              type="monotone"
              dataKey="batteryLevel"
              stroke={lineColor}
              strokeWidth={isProjectedBelow5In20 ? 2.8 : 2.2}
              dot={{ r: 2.5, fill: lineColor, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#ffffff', stroke: lineColor, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Clear Visual Legend & Alert Zones Panel */}
      <div className="pt-2 border-t border-slate-800/80 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 font-semibold text-slate-300">
            <TrendingDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Chart Legend &amp; Alert Zones</span>
          </div>

          <button
            type="button"
            onClick={() => setShowDetailedGuide(!showDetailedGuide)}
            className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-medium px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 transition-colors"
          >
            <Info className="w-3 h-3" />
            <span>{showDetailedGuide ? 'Hide Zone Guide' : 'Explain Zones'}</span>
            {showDetailedGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* 4-Zone Color-Coded Swatches */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[10px]">
          {/* Optimal Zone */}
          <div
            className={`p-1.5 rounded-lg border flex flex-col justify-between transition-all ${
              currentZone.code === 'optimal'
                ? 'bg-emerald-950/80 border-emerald-500 shadow-sm shadow-emerald-950 ring-1 ring-emerald-500/50'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="font-bold text-emerald-400">&gt;50% Optimal</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">
              Normal Beacon
            </span>
          </div>

          {/* Caution Zone */}
          <div
            className={`p-1.5 rounded-lg border flex flex-col justify-between transition-all ${
              currentZone.code === 'caution'
                ? 'bg-amber-950/80 border-amber-500 shadow-sm shadow-amber-950 ring-1 ring-amber-500/50'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
              <span className="font-bold text-amber-300">16–49% Caution</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">
              Conserve Sync
            </span>
          </div>

          {/* Critical Warning Zone */}
          <div
            className={`p-1.5 rounded-lg border flex flex-col justify-between transition-all ${
              currentZone.code === 'critical'
                ? 'bg-rose-950/90 border-rose-500 shadow-sm shadow-rose-950 ring-1 ring-rose-500/50'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0" />
              <span className="font-bold text-rose-300">6–15% Critical</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">
              SMS Alert Sent
            </span>
          </div>

          {/* Shutdown Reserve Zone */}
          <div
            className={`p-1.5 rounded-lg border flex flex-col justify-between transition-all ${
              currentZone.code === 'shutdown' || isProjectedBelow5In20
                ? 'bg-rose-950 border-rose-500 shadow-md shadow-rose-950 ring-1 ring-rose-500'
                : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse shrink-0" />
              <span className="font-bold text-rose-200">&le;5% Shutdown</span>
            </div>
            <span className="text-[9px] text-slate-400 mt-0.5 leading-tight">
              &lt;20m Cutoff Risk
            </span>
          </div>
        </div>

        {/* Dynamic Depletion Projection Summary Bar */}
        <div className="bg-slate-900/80 rounded-lg p-2 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-300">Current Status:</span>
            <span className={`px-1.5 py-0.5 rounded font-mono font-bold border ${currentZone.badgeBg}`}>
              {currentZone.name} ({currentLevel}%)
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-0.5 bg-slate-400 rounded" />
              <span className="font-mono">Drain ~0.28%/min</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className={`font-mono font-semibold ${isProjectedBelow5In20 ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
              {isCharging
                ? 'Charging'
                : isProjectedBelow5In20
                ? `Shutdown in ~${minsUntil5}m`
                : minsUntil5 > 0
                ? `~${minsUntil5}m to 5% reserve`
                : 'Empty'}
            </span>
          </div>
        </div>

        {/* Detailed Explanatory Guide Drawer (Toggleable) */}
        {showDetailedGuide && (
          <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-800 space-y-2 text-[11px] animate-fadeIn">
            <div className="flex items-start gap-1.5 text-slate-300">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">How Time-to-Depletion Projection Works</span>
                <p className="text-slate-400 text-[10px] leading-relaxed mt-0.5">
                  During an active emergency, continuous GPS broadcasting, cellular radio transmitters, and screen illumination draw approximately <strong className="text-slate-200">0.28% battery per minute (~17%/hour)</strong>. The projection curve calculates real-time remaining minutes until battery reaches critical cutoff thresholds:
                </p>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-[10px]">
              <div className="flex items-start gap-2 bg-slate-950/60 p-1.5 rounded border border-emerald-950">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-emerald-400">🟢 Optimal Zone (50% – 100%):</strong>
                  <span className="text-slate-400 block">Maximum telemetry fidelity. Emergency beacons ping high-frequency 15-second GPS updates with zero power-saving throttling.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-slate-950/60 p-1.5 rounded border border-amber-950">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-300">🟡 Caution Zone (16% – 49%):</strong>
                  <span className="text-slate-400 block">Moderate battery life remaining. Non-essential data synchronization is throttled to conserve power for vital GPS location broadcasts.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-slate-950/60 p-1.5 rounded border border-rose-950">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-rose-400">🔴 Critical Warning Zone (6% – 15%):</strong>
                  <span className="text-slate-400 block">Automated high-priority low-battery SMS alert is immediately dispatched to all trusted emergency contacts with exact timestamp and last-known GPS coordinates.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 bg-slate-950/60 p-1.5 rounded border border-rose-900">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <strong className="text-rose-300">🚨 Shutdown Reserve Zone (&le;5% or &lt;20 mins):</strong>
                  <span className="text-slate-400 block">Emergency power-cutoff safeguard. Triggers an urgent pulsing screen overlay and broadcasts a final high-precision GPS coordinate snapshot before device hardware shutdown.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Insight */}
      <div className="flex items-center justify-between text-[10px] pt-0.5 border-t border-slate-900">
        <span className={isProjectedBelow5In20 ? 'text-rose-300 font-mono' : 'text-slate-500'}>
          {isProjectedBelow5In20
            ? 'Drain rate: ~0.28%/min (~17%/hr)'
            : 'Drain rate: ~16%/hr (Live GPS & telemetry)'}
        </span>
        {isProjectedBelow5In20 ? (
          <span className="text-rose-300 font-bold flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" /> Device shutdown imminent (&lt;20m)
          </span>
        ) : isCritical ? (
          <span className="text-rose-400 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" /> Automatic &lt;15% warning triggered
          </span>
        ) : (
          <span className="text-slate-400">Power reserve optimal</span>
        )}
      </div>
    </div>
  );
};
