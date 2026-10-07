import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldAlert, Smartphone, Zap } from 'lucide-react';
import { shakeDetectionService } from '../services/shakeDetectionService';
import { hapticFeedbackService } from '../services/hapticFeedbackService';

interface LockScreenOverlayProps {
  isLocked: boolean;
  onUnlock: () => void;
  onTriggerSos: (isSilent: boolean) => void;
  batteryLevel: number;
}

export const LockScreenOverlay: React.FC<LockScreenOverlayProps> = ({
  isLocked,
  onUnlock,
  onTriggerSos,
  batteryLevel,
}) => {
  const [timeString, setTimeString] = useState('');
  const [dateString, setDateString] = useState('');
  const [shakeDetectedVisual, setShakeDetectedVisual] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setDateString(
        now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isLocked) return null;

  const handleSimulateShake = () => {
    setShakeDetectedVisual(true);
    hapticFeedbackService.trigger('HOLD_ESCALATE');
    shakeDetectionService.playCountdownTone(1000, 150);

    setTimeout(() => {
      setShakeDetectedVisual(false);
      onTriggerSos(true); // Stealth SOS default for sender safety
    }, 250);
  };

  return (
    <div className="absolute inset-0 z-40 bg-gradient-to-b from-slate-100 via-white to-slate-50 flex flex-col justify-between p-6 select-none animate-in fade-in duration-200 text-slate-800">
      {/* Top Status */}
      <div className="flex flex-col items-center pt-2">
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
          <Lock className="w-3.5 h-3.5 text-slate-500" />
          <span>Device Locked</span>
        </div>
        <div className="text-6xl font-extralight text-slate-900 tracking-tight mt-4 font-mono">
          {timeString || '09:41'}
        </div>
        <div className="text-sm font-medium text-slate-600 mt-1">
          {dateString || 'Tuesday, September 29'}
        </div>
      </div>

      {/* Middle: Shake Detection Active Indicator */}
      <div className="my-auto space-y-4">
        <div
          className={`p-4 rounded-2xl border transition-all duration-300 shadow-sm ${
            shakeDetectedVisual
              ? 'bg-rose-50 border-rose-400 scale-105 shadow-md'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Stealth Shake-to-SOS Armed
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Lock Screen Active
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Shake device firmly to trigger covert distress immediately without unlocking. All tracking streams to the Reserve End.
          </p>

          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
            <span>Battery: {batteryLevel}%</span>
            <span className="text-emerald-700 flex items-center gap-1 font-semibold">
              <Zap className="w-3 h-3 text-emerald-600" /> Accelerometer Vigilant
            </span>
          </div>
        </div>

        {/* Quick Testing Trigger on Lock Screen */}
        <button
          type="button"
          onClick={handleSimulateShake}
          className="w-full py-3 px-4 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <Smartphone className="w-4 h-4 text-rose-600 animate-pulse" />
          <span>Simulate Hardware Shake Gesture</span>
        </button>
      </div>

      {/* Bottom Unlock / Emergency Bar */}
      <div className="space-y-3 pb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onTriggerSos(true)}
            className="flex-1 py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <span>Stealth SOS</span>
          </button>

          <button
            type="button"
            onClick={onUnlock}
            className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Unlock className="w-4 h-4 text-slate-500" />
            <span>Tap to Unlock</span>
          </button>
        </div>

        <div className="text-center">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            SafeSignal Lockscreen Guard
          </span>
        </div>
      </div>
    </div>
  );
};
