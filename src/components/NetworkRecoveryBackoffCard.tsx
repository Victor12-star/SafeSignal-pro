import React from 'react';
import {
  Wifi,
  Radio,
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { BackoffTelemetry } from '../services/networkRetryEngine';
import { NetworkStatus } from '../types/safety';

interface NetworkRecoveryBackoffCardProps {
  networkStatus: NetworkStatus;
  telemetry: BackoffTelemetry;
  onForceRetry: () => void;
}

export const NetworkRecoveryBackoffCard: React.FC<NetworkRecoveryBackoffCardProps> = ({
  networkStatus,
  telemetry,
  onForceRetry,
}) => {
  if (networkStatus !== 'RECOVERING' && !telemetry.isRetrying && telemetry.queuedPacketCount === 0) {
    return null;
  }

  const progressPercent = Math.min(
    100,
    Math.round((telemetry.attemptNumber / Math.max(1, telemetry.maxAttempts)) * 100)
  );

  return (
    <div className="p-3.5 bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/70 border-2 border-amber-500/80 rounded-2xl shadow-xl space-y-3 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/20 border border-amber-500/50 rounded-lg text-amber-300 relative">
            <Radio className="w-4 h-4 animate-pulse" />
            <span className="w-2 h-2 rounded-full bg-amber-400 absolute -top-0.5 -right-0.5 animate-ping" />
          </div>
          <div>
            <div className="text-xs font-black text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
              <span>Cellular Connection Recovering</span>
            </div>
            <div className="text-[10px] text-amber-300/80 font-mono">
              Exponential Backoff Retry Active
            </div>
          </div>
        </div>

        {/* Retry attempt badge */}
        <div className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-200 text-[10px] font-mono font-bold flex items-center gap-1">
          <RefreshCw className={`w-3 h-3 ${telemetry.isRetrying ? 'animate-spin' : ''}`} />
          <span>Attempt {telemetry.attemptNumber}/{telemetry.maxAttempts}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-amber-100/90 leading-relaxed">
        Network signal detected after being offline. SafeSignal is transmitting your critical emergency packets using <strong>exponential backoff + jitter</strong> to ensure delivery without packet loss.
      </p>

      {/* Live Telemetry Progress & Countdown */}
      <div className="p-2.5 bg-slate-950/90 rounded-xl border border-amber-900/60 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            Queued Emergency Packets:
          </span>
          <span className="text-white font-bold">
            {Math.max(1, telemetry.queuedPacketCount)} packet{telemetry.queuedPacketCount !== 1 ? 's' : ''} (SOS + GPS + Battery)
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Next Retry Window:
          </span>
          <span className="text-amber-300 font-bold">
            {telemetry.remainingSeconds > 0
              ? `in ${telemetry.remainingSeconds}s`
              : 'Transmitting payload...'}
          </span>
        </div>

        {/* Backoff Progress bar */}
        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300 rounded-full"
            style={{ width: `${Math.max(15, progressPercent)}%` }}
          />
        </div>
      </div>

      {/* Fast Manual Override Button */}
      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          onClick={onForceRetry}
          className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 active:scale-[0.98] transition-all rounded-xl text-black font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-950/60 cursor-pointer"
        >
          <Zap className="w-3.5 h-3.5 fill-black" />
          <span>Force Dispatch Now (Bypass Backoff)</span>
        </button>
      </div>
    </div>
  );
};
