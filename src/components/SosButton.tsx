import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { hapticFeedbackService } from '../services/hapticFeedbackService';

interface SosButtonProps {
  onTrigger: () => void;
  isSilent: boolean;
  disabled?: boolean;
}

export const SosButton: React.FC<SosButtonProps> = ({ onTrigger, isSilent, disabled = false }) => {
  const [progress, setProgress] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const pressStartTime = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const holdDurationMs = 2000; // Exact 2.0-second hold requirement

  const startPress = () => {
    if (disabled) return;
    setIsPressing(true);
    pressStartTime.current = performance.now();
    // Metronome tick at touch start
    hapticFeedbackService.trigger('HOLD_TICK');

    let triggered50 = false;
    let triggered80 = false;

    const updateLoop = () => {
      if (!pressStartTime.current) return;
      const elapsed = performance.now() - pressStartTime.current;
      const currentProgress = Math.min((elapsed / holdDurationMs) * 100, 100);
      setProgress(currentProgress);

      // Tactile escalating pulses during hold
      if (currentProgress >= 50 && !triggered50) {
        triggered50 = true;
        hapticFeedbackService.trigger('HOLD_TICK');
      } else if (currentProgress >= 80 && !triggered80) {
        triggered80 = true;
        hapticFeedbackService.trigger('HOLD_ESCALATE');
      }

      if (elapsed >= holdDurationMs) {
        // Differentiated emergency trigger confirmation:
        // Prolonged heavy shockwave for standard emergency vs crisp covert pulse for silent SOS
        if (isSilent) {
          hapticFeedbackService.trigger('EMERGENCY_SILENT');
        } else {
          hapticFeedbackService.trigger('EMERGENCY_LOUD');
        }
        setIsPressing(false);
        setProgress(100);
        onTrigger();
      } else {
        animationFrameRef.current = requestAnimationFrame(updateLoop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateLoop);
  };

  const endPress = () => {
    if (!isPressing) return;
    setIsPressing(false);
    pressStartTime.current = null;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // Reset progress smoothly
    setProgress(0);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // SVG circular progress calculation
  const size = 190;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center select-none py-6">
      <div className="relative flex items-center justify-center">
        {/* SVG Circular Progress Track */}
        <svg width={size} height={size} className="transform -rotate-90 pointer-events-none">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-200"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className={`transition-all duration-75 ${
              isSilent ? 'text-slate-500' : 'text-rose-600'
            }`}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>

        {/* Primary Interactive Touch Target (180px hit area) */}
        <button
          type="button"
          onMouseDown={startPress}
          onMouseUp={endPress}
          onMouseLeave={endPress}
          onTouchStart={startPress}
          onTouchEnd={endPress}
          onTouchCancel={endPress}
          disabled={disabled}
          aria-label={isSilent ? 'Hold for Silent SOS' : 'Hold for Emergency SOS'}
          className={`absolute inset-3 rounded-full flex flex-col items-center justify-center transition-all duration-150 active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-400 shadow-lg cursor-pointer ${
            isPressing
              ? isSilent
                ? 'bg-slate-100 border-2 border-slate-400 scale-95'
                : 'bg-rose-700 text-white scale-95 shadow-rose-300'
              : isSilent
              ? 'bg-white border-2 border-slate-300 text-slate-800 hover:bg-slate-50 hover:border-slate-400 shadow-slate-200'
              : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
          }`}
        >
          <ShieldAlert className={`w-9 h-9 mb-1.5 transition-transform ${isPressing ? 'scale-110' : ''} ${isSilent ? 'text-slate-700' : 'text-white'}`} />
          <span className={`text-xs font-bold tracking-wider uppercase text-center leading-tight ${isSilent ? 'text-slate-800' : 'text-white'}`}>
            {isPressing ? 'HOLDING...' : isSilent ? 'HOLD FOR STEALTH SOS' : 'HOLD FOR SOS'}
          </span>
          <span className={`text-[10px] font-semibold mt-0.5 tabular-nums ${isSilent ? 'text-slate-500' : 'text-rose-100'}`}>
            {isPressing ? `${((holdDurationMs - (progress / 100) * holdDurationMs) / 1000).toFixed(1)}s` : '2 SECONDS'}
          </span>
        </button>
      </div>

      <p className="text-[11px] text-slate-500 mt-3 text-center max-w-[260px] leading-relaxed">
        {isSilent
          ? 'Stealth SOS: Eyes-free haptic confirmation. No sirens or strobe lights on your phone—dispatches directly to the Reserve End.'
          : 'Press and hold for 2 seconds to alert trusted contacts and responders.'}
      </p>
    </div>
  );
};
