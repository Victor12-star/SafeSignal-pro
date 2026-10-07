import React, { useState } from 'react';
import {
  Vibrate,
  ShieldAlert,
  Heart,
  CheckCircle2,
  X,
  Battery,
  Radio,
  Play,
  VolumeX,
  Sparkles,
} from 'lucide-react';
import {
  hapticFeedbackService,
  HAPTIC_PATTERNS,
  HapticType,
} from '../services/hapticFeedbackService';

interface HapticPatternTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HapticPatternTesterModal: React.FC<HapticPatternTesterModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTesting, setActiveTesting] = useState<HapticType | null>(null);
  const isVibrationSupported = hapticFeedbackService.getIsSupported();

  if (!isOpen) return null;

  const handleTestPattern = (type: HapticType) => {
    setActiveTesting(type);
    hapticFeedbackService.trigger(type);
    setTimeout(() => {
      setActiveTesting((curr) => (curr === type ? null : curr));
    }, 1800);
  };

  const patternKeys: HapticType[] = [
    'EMERGENCY_LOUD',
    'EMERGENCY_SILENT',
    'RECIPIENT_ACKNOWLEDGED',
    'INCIDENT_RESOLVED',
    'LOW_BATTERY_WARNING',
    'PACKET_DELIVERED',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600/20 border border-rose-500/40 rounded-xl">
              <Vibrate className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Tactile Haptic Profiles
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                Eyes-Free Physical Differentiation
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sensory Differentiation Notice */}
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 text-xs text-slate-300">
          <p className="text-[11px] leading-relaxed">
            Emergency triggers and standard acknowledgments are engineered with distinct pulse cadences so you can distinguish distress states by feel alone without looking at the screen.
          </p>
          {!isVibrationSupported && (
            <div className="mt-2 p-2 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-200 text-[10px] flex items-center gap-1.5">
              <span>⚠️ Browser running in simulated environment without physical vibration motor. Visual wave indicators show the exact millisecond cadence below.</span>
            </div>
          )}
        </div>

        {/* Pattern List */}
        <div className="p-4 overflow-y-auto space-y-3">
          {patternKeys.map((key) => {
            const def = HAPTIC_PATTERNS[key];
            const isEmergency = def.category === 'EMERGENCY_TRIGGER';
            const isAck = def.category === 'STANDARD_ACKNOWLEDGMENT';
            const isTesting = activeTesting === key;

            return (
              <div
                key={key}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isTesting
                    ? 'border-rose-400 bg-rose-950/40 shadow-lg shadow-rose-950'
                    : isEmergency
                    ? 'border-rose-900/60 bg-slate-950 hover:border-rose-800'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      {isEmergency ? (
                        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : isAck ? (
                        <Heart className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Battery className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="text-xs font-bold text-white leading-tight">
                        {def.name}
                      </span>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded inline-block ${
                        isEmergency
                          ? 'bg-rose-900/60 text-rose-300'
                          : isAck
                          ? 'bg-emerald-950/80 text-emerald-300'
                          : 'bg-amber-950/80 text-amber-300'
                      }`}
                    >
                      {def.category.replace('_', ' ')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestPattern(key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      isEmergency
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-950'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>{isTesting ? 'Pulsing...' : 'Feel'}</span>
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 mb-2 leading-relaxed">
                  {def.description}
                </p>

                {/* Visual Tactile Waveform Bars */}
                <div className="space-y-1 pt-1 border-t border-slate-900">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Cadence: {def.sensoryProfile}</span>
                    <span>[{def.pattern.join(', ')} ms]</span>
                  </div>
                  <div className="flex items-center gap-1 h-3 bg-slate-900/80 rounded-md p-0.5 overflow-hidden">
                    {def.pattern.map((ms, idx) => {
                      const isVibrate = idx % 2 === 0;
                      const widthPercent = Math.min(100, Math.max(8, (ms / 900) * 100));
                      return (
                        <div
                          key={idx}
                          title={`${isVibrate ? 'Vibration' : 'Rest'}: ${ms}ms`}
                          className={`h-full rounded-sm transition-all ${
                            isVibrate
                              ? isEmergency
                                ? isTesting
                                  ? 'bg-rose-400 animate-pulse'
                                  : 'bg-rose-600'
                                : isTesting
                                ? 'bg-emerald-300 animate-pulse'
                                : 'bg-emerald-500'
                              : 'bg-slate-800'
                          }`}
                          style={{ width: `${widthPercent}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-[10px] text-slate-500 font-mono">
            Calibrated for Motor Tactile Differentiation
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
