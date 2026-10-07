import React, { useState } from 'react';
import {
  Battery,
  BatteryCharging,
  BatteryWarning,
  Zap,
  Sliders,
  AlertTriangle,
  X,
} from 'lucide-react';
import { isBatteryCritical } from '../services/emergencyEngine';

interface BatteryStatusBarWidgetProps {
  batteryLevel: number;
  isCharging: boolean;
  isEmergencyActive: boolean;
  isLowBatteryAlertSent?: boolean;
  onUpdateBattery: (level: number, charging: boolean) => void;
}

export const BatteryStatusBarWidget: React.FC<BatteryStatusBarWidgetProps> = ({
  batteryLevel,
  isCharging,
  isEmergencyActive,
  isLowBatteryAlertSent,
  onUpdateBattery,
}) => {
  const [showSimulator, setShowSimulator] = useState(false);
  const isCritical = isBatteryCritical(batteryLevel);

  // Color dynamics
  const batteryColor = isCritical
    ? 'text-rose-500 fill-rose-500'
    : batteryLevel < 50
    ? 'text-amber-400 fill-amber-400'
    : 'text-emerald-400 fill-emerald-400';

  const badgeBg = isCritical
    ? 'bg-rose-950/90 border-rose-800 text-rose-300'
    : 'bg-slate-900 border-slate-800 text-slate-300';

  return (
    <div className="relative">
      {/* Clickable Battery Indicator in Status Bar */}
      <button
        type="button"
        onClick={() => setShowSimulator(!showSimulator)}
        title="Real-Time Battery Status Monitor (Click to simulate levels)"
        className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[11px] font-mono transition-all ${badgeBg} ${
          isCritical && isEmergencyActive ? 'animate-pulse ring-1 ring-rose-500' : ''
        }`}
      >
        {isCharging ? (
          <Zap className="w-3 h-3 text-amber-400 animate-bounce" />
        ) : isCritical ? (
          <BatteryWarning className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
        ) : (
          <Battery className={`w-3.5 h-3.5 ${batteryColor}`} />
        )}

        <span className={`tabular-nums font-bold ${isCritical ? 'text-rose-400' : 'text-slate-300'}`}>
          {batteryLevel}%
        </span>
      </button>

      {/* Low Battery Alert Popover / Simulator */}
      {showSimulator && (
        <div className="absolute right-0 top-7 z-50 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-4 text-xs space-y-3 backdrop-blur-md animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-white">
              <Sliders className="w-4 h-4 text-rose-500" />
              <span>Real-Time Battery Monitor</span>
            </div>
            <button
              onClick={() => setShowSimulator(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center text-slate-300">
              <span>Battery Level:</span>
              <span className={`font-mono font-bold text-sm ${isCritical ? 'text-rose-400' : 'text-emerald-400'}`}>
                {batteryLevel}% {isCharging ? '(Charging)' : '(Discharging)'}
              </span>
            </div>

            {/* Slider to change battery level */}
            <input
              type="range"
              min="1"
              max="100"
              value={batteryLevel}
              onChange={(e) => onUpdateBattery(Number(e.target.value), isCharging)}
              className="w-full accent-rose-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span className="text-rose-400 font-bold">1% (Depleted)</span>
              <span className="text-amber-400 font-bold">15% (Threshold)</span>
              <span className="text-emerald-400">100% (Full)</span>
            </div>
          </div>

          {/* Quick Trigger Buttons */}
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => onUpdateBattery(14, false)}
              className="p-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 rounded-lg font-bold text-[10px] flex flex-col items-center justify-center gap-0.5 text-center"
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>14% (&lt;15%)</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateBattery(9, false)}
              className="p-1.5 bg-rose-950 hover:bg-rose-900 border-2 border-rose-500 text-rose-100 rounded-lg font-extrabold text-[10px] flex flex-col items-center justify-center gap-0.5 text-center shadow-md shadow-rose-950"
            >
              <Zap className="w-3 h-3 text-rose-300" />
              <span>9% (&lt;5% in 20m)</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateBattery(85, !isCharging)}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold text-[10px] flex flex-col items-center justify-center gap-0.5 text-center"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{isCharging ? 'Unplug' : 'Plug In'}</span>
            </button>
          </div>

          {/* Directive Explanation */}
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[10px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Directive Trigger Logic:</strong>
            <br />
            During an active SOS, dropping below <strong>15%</strong> automatically broadcasts a high-priority Low Battery Alert with current GPS coordinates to all configured contacts before the phone can shut down.
            {isEmergencyActive && isLowBatteryAlertSent && (
              <div className="mt-1 text-rose-400 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Low battery warning already dispatched for current SOS.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
