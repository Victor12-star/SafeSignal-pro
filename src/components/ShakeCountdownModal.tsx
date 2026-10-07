import React, { useEffect, useState, useRef } from 'react';
import { ShieldAlert, X, Zap, EyeOff } from 'lucide-react';
import { shakeDetectionService } from '../services/shakeDetectionService';
import { hapticFeedbackService } from '../services/hapticFeedbackService';

interface ShakeCountdownModalProps {
  isOpen: boolean;
  isSilent: boolean;
  totalSeconds?: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ShakeCountdownModal: React.FC<ShakeCountdownModalProps> = ({
  isOpen,
  isSilent,
  totalSeconds = 3,
  onConfirm,
  onCancel,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (timerRef.current) clearInterval(timerRef.current);
      setSecondsLeft(totalSeconds);
      return;
    }

    setSecondsLeft(totalSeconds);
    // Tactile bump only (silent acoustic tones to protect sender from attacker)
    hapticFeedbackService.trigger('HOLD_ESCALATE');
    if (!isSilent) {
      shakeDetectionService.playCountdownTone(880, 100);
    }

    let remaining = totalSeconds;
    timerRef.current = setInterval(() => {
      remaining -= 1;
      setSecondsLeft(remaining);

      if (remaining > 0) {
        hapticFeedbackService.trigger('HOLD_TICK');
        if (!isSilent) {
          shakeDetectionService.playCountdownTone(remaining === 1 ? 1200 : 960, 120);
        }
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        onConfirm();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, totalSeconds, onConfirm, isSilent]);

  if (!isOpen) return null;

  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;

  return (
    <div className="absolute inset-0 z-50 bg-white/98 backdrop-blur-md flex flex-col items-center justify-between p-6 animate-in fade-in zoom-in-95 duration-200 text-slate-800">
      {/* Top Banner */}
      <div className="w-full text-center space-y-1.5 pt-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider">
          <Zap className="w-3.5 h-3.5 text-amber-600" />
          <span>Shake Gesture Detected</span>
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          Dispatching to Reserve End
        </h2>
        <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
          Broadcasting live coordinates silently to trusted contacts without siren alerts on this handset.
        </p>
      </div>

      {/* Center Countdown Meter */}
      <div className="relative flex items-center justify-center my-6">
        <div className="relative w-44 h-44 rounded-full border-4 border-slate-200 flex items-center justify-center bg-white shadow-xl">
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="88"
              cy="88"
              r="80"
              className="text-slate-100"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="88"
              cy="88"
              r="80"
              className="text-slate-800 transition-all duration-1000 ease-linear"
              strokeWidth="8"
              strokeDasharray={2 * Math.PI * 80}
              strokeDashoffset={2 * Math.PI * 80 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          <div className="flex flex-col items-center justify-center z-10">
            <span className="text-6xl font-black font-mono text-slate-900 tabular-nums">
              {secondsLeft}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mt-1">
              Seconds
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full space-y-3 pb-4">
        <button
          type="button"
          onClick={onCancel}
          className="w-full py-3.5 px-6 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border border-slate-300 shadow-xs cursor-pointer transition-all active:scale-[0.98]"
        >
          <X className="w-4 h-4 text-slate-500" />
          <span>CANCEL (Accidental Shake)</span>
        </button>

        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-3 px-6 bg-slate-900 hover:bg-black active:bg-slate-800 text-white rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all"
        >
          <ShieldAlert className="w-4 h-4 text-rose-400" />
          <span>Dispatch Immediately to Reserve End</span>
        </button>
      </div>
    </div>
  );
};
