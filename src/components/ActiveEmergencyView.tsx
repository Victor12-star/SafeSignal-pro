import React, { useState, useEffect } from 'react';
import {
  CountrySafetyConfig,
  EmergencyIncident,
  LocationCoordinate,
  NetworkStatus,
} from '../types/safety';
import {
  ShieldAlert,
  PhoneCall,
  MapPin,
  Battery,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Globe,
  ZapOff,
  AlertTriangle,
  X,
  Activity,
  Send,
  Eye,
  EyeOff,
  Radio,
  Share2,
  WifiOff,
  Database,
  HardDrive,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { BatteryHistoryChart } from './BatteryHistoryChart';
import { RealTimeMapPreview } from './RealTimeMapPreview';
import { NetworkRecoveryBackoffCard } from './NetworkRecoveryBackoffCard';
import { BackoffTelemetry } from '../services/networkRetryEngine';
import { hapticFeedbackService } from '../services/hapticFeedbackService';
import { DecoyCamouflageView } from './DecoyCamouflageView';
import {
  willBatteryDropBelow5In20Mins,
  getMinutesUntilDropBelow5,
  formatDirectEmergencySms,
  createDirectSmsUri,
} from '../services/emergencyEngine';

interface ActiveEmergencyViewProps {
  incident: EmergencyIncident;
  countryConfig: CountrySafetyConfig;
  networkStatus: NetworkStatus;
  backoffTelemetry?: BackoffTelemetry;
  onResolve: () => void;
  onSimulateAcknowledgement: (contactId: string) => void;
  onOpenRecipientView: () => void;
  onRetrySync: () => void;
  onForceRetry?: () => void;
  onUpdateLocation?: (loc: LocationCoordinate) => void;
}

export const ActiveEmergencyView: React.FC<ActiveEmergencyViewProps> = ({
  incident,
  countryConfig,
  networkStatus,
  backoffTelemetry,
  onResolve,
  onSimulateAcknowledgement,
  onOpenRecipientView,
  onRetrySync,
  onForceRetry,
  onUpdateLocation,
}) => {
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showBatteryOverlay, setShowBatteryOverlay] = useState(false);
  const [hasAutoOpenedBatteryOverlay, setHasAutoOpenedBatteryOverlay] = useState(false);
  const [showSmsPreviewModal, setShowSmsPreviewModal] = useState(false);
  const [isCamouflageActive, setIsCamouflageActive] = useState(false);

  // Critical battery projection calculation (<5% in 20 minutes)
  const isProjectedBelow5In20 = willBatteryDropBelow5In20Mins(
    incident.batteryLevel,
    incident.batteryCharging
  );
  const minsUntil5 = getMinutesUntilDropBelow5(
    incident.batteryLevel,
    incident.batteryCharging
  );

  // Trigger notification specifically when battery depletion projects <5% in 20 minutes
  useEffect(() => {
    if (isProjectedBelow5In20 && !hasAutoOpenedBatteryOverlay) {
      setShowBatteryOverlay(true);
      setHasAutoOpenedBatteryOverlay(true);
      hapticFeedbackService.trigger('LOW_BATTERY_WARNING');
    }
  }, [isProjectedBelow5In20, hasAutoOpenedBatteryOverlay]);

  // If Camouflage Mode is toggled on, render the innocent Notes screen
  if (isCamouflageActive) {
    return (
      <DecoyCamouflageView
        incident={incident}
        onExitCamouflage={() => setIsCamouflageActive(false)}
        onOpenReserveEnd={onOpenRecipientView}
      />
    );
  }

  // Truthful contact delivery counts
  const deliveredCount = incident.recipients.filter((r) => r.status === 'DELIVERED' || r.status === 'ACKNOWLEDGED').length;
  const acknowledgedCount = incident.recipients.filter((r) => r.status === 'ACKNOWLEDGED').length;
  const totalCount = incident.recipients.length;

  // Direct SMS formatting
  const directSmsMessage = formatDirectEmergencySms({
    senderName: 'Alex',
    countryName: countryConfig.countryName,
    location: incident.location,
    batteryLevel: incident.batteryLevel,
    accessToken: incident.accessToken,
    isSilent: incident.isSilent,
  });

  const allRecipientPhones = incident.recipients.map((r) => r.phone);
  const directSmsBlastUri = createDirectSmsUri(allRecipientPhones, directSmsMessage);
  const primaryEmergencyNumber = countryConfig.emergencyNumbers[0]?.number || '112';

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 overflow-y-auto pb-10 font-sans selection:bg-rose-100">
      {/* 1. Critical Battery Depletion Overlay Notification (<5% in 20 mins) */}
      {showBatteryOverlay && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border border-rose-300 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <ZapOff className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Critical Battery Reserve
                  </h3>
                  <span className="text-[10px] font-mono text-rose-600">
                    Depleting to &lt;5% in ~{minsUntil5} mins
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBatteryOverlay(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              High-accuracy GPS tracking may drain the remaining battery. Final known coordinates and power telemetry have been prioritized to the Reserve End.
            </p>

            <button
              type="button"
              onClick={() => setShowBatteryOverlay(false)}
              className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Covert Sender Protection Header */}
      <div className="p-4 bg-white border-b border-slate-200 sticky top-0 z-30 space-y-2.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold tracking-tight text-slate-900 uppercase">
              Stealth Distress Active
            </h2>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Covert Mode
            </span>
          </div>

          {/* Quick Camouflage Decoy Button */}
          <button
            type="button"
            onClick={() => setIsCamouflageActive(true)}
            className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            title="Immediately disguise screen as an innocent Notes app"
          >
            <EyeOff className="w-3.5 h-3.5 text-amber-700" />
            <span>Camouflage Screen</span>
          </button>
        </div>

        {/* Sender Safety Reassurance: Everything runs on the Reserve End */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Sender Protection Safeguard
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              Handset Silent
            </span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Your phone remains calm and quiet so hostile observers cannot see that you reached out. <strong>All active tracking, sirens, and rescue dispatch are coordinated on the Reserve End (trusted contacts portal).</strong>
          </p>
        </div>

        {/* Persistent Offline Cache Banner */}
        {networkStatus === 'OFFLINE' && (
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-1.5 text-xs text-amber-900">
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5 text-amber-700" />
                Zero Cellular Internet Detected
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-100 rounded border border-amber-200">
                Local GPS Cache
              </span>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              GPS coordinates are safely enqueued in local SQLite. They will automatically sync to the Reserve End when connection returns.
            </p>
            <div className="flex items-center justify-between text-[10px] font-mono text-amber-700 pt-1 border-t border-amber-200/80">
              <span>{incident.locationHistory?.length || 1} breadcrumb(s) cached</span>
              <span>Auto-sync pending</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* THE RESERVE END COMMAND CENTER BANNER & LAUNCHER */}
        <div className="p-4 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-rose-500/20 border border-rose-500/30 rounded-xl text-rose-400">
                <Radio className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  The Reserve End · Responder System
                </h3>
                <span className="text-[11px] text-slate-300">
                  {acknowledgedCount > 0
                    ? `${acknowledgedCount} responder active`
                    : `Alerts dispatched to ${deliveredCount} of ${totalCount} contacts`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenRecipientView}
              className="px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 active:scale-95 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
              <span>Inspect Reserve End</span>
            </button>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed border-t border-slate-700/80 pt-2.5">
            This is where your emergency contacts monitor your live location, battery percentage, and dispatch local first responders—leaving zero evidence on your screen.
          </p>
        </div>

        {/* Exponential Backoff Retry Telemetry */}
        {backoffTelemetry && (
          <NetworkRecoveryBackoffCard
            networkStatus={networkStatus}
            telemetry={backoffTelemetry}
            onForceRetry={onForceRetry || onRetrySync}
          />
        )}

        {/* Direct Native SMS Fallback Card */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                <Send className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Direct SMS Dispatch (0-Data Fallback)
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Ready
            </span>
          </div>

          <p className="text-[11px] text-slate-600 leading-relaxed">
            Pre-fills coordinate link directly in your phone's SMS app with no cellular data required.
          </p>

          <a
            href={directSmsBlastUri}
            className="w-full py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Send className="w-3.5 h-3.5 text-rose-600" />
            <span>Open Native SMS App</span>
          </a>
        </div>

        {/* Real-Time Live Map Preview (Clean white frame) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-600" />
              Live Breadcrumb Trail (Streaming to Reserve End)
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {incident.location?.accuracyMeters.toFixed(1)}m accuracy
            </span>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-200">
            <RealTimeMapPreview
              location={incident.location}
              locationHistory={incident.locationHistory}
              networkStatus={networkStatus}
              isEmergencyActive={true}
              onSimulateMovement={() => {
                if (!incident.location || !onUpdateLocation) return;
                const jitterLat = (Math.random() - 0.5) * 0.0006;
                const jitterLon = (Math.random() - 0.5) * 0.0006;
                onUpdateLocation({
                  latitude: incident.location.latitude + jitterLat,
                  longitude: incident.location.longitude + jitterLon,
                  accuracyMeters: 7.8,
                  timestamp: Date.now(),
                  isLastKnown: false,
                });
              }}
            />
          </div>
        </div>

        {/* Battery Health Chart Section */}
        <div id="emergency-battery-chart-section" className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs">
          <BatteryHistoryChart
            batteryLevel={incident.batteryLevel}
            batteryHistory={incident.batteryHistory}
            isCharging={incident.batteryCharging}
            isEmergencyActive={true}
          />
        </div>

        {/* Trusted Contacts Transmission Audit */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">
              Trusted Contacts Status
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {deliveredCount}/{totalCount} Active
            </span>
          </div>

          <div className="space-y-1.5">
            {incident.recipients.map((recipient) => (
              <div
                key={recipient.contactId}
                className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800">{recipient.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{recipient.phone}</div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      recipient.status === 'ACKNOWLEDGED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : recipient.status === 'DELIVERED'
                        ? 'bg-sky-50 text-sky-700 border-sky-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    {recipient.status === 'ACKNOWLEDGED'
                      ? 'Responding'
                      : recipient.status === 'DELIVERED'
                      ? 'Delivered'
                      : 'Queued'}
                  </span>

                  {recipient.status !== 'ACKNOWLEDGED' && (
                    <button
                      type="button"
                      onClick={() => onSimulateAcknowledgement(recipient.contactId)}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded text-[10px] font-semibold border border-slate-200 cursor-pointer shadow-2xs"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resolve Emergency Safe Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowResolveModal(true)}
            className="w-full h-11 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] border border-slate-300 rounded-xl text-slate-800 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Resolve Emergency (I Am Safe)</span>
          </button>
        </div>
      </div>

      {/* Confirmation Modal to prevent accidental resolution */}
      {showResolveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Resolve Emergency Incident?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will notify your trusted contacts that you are safe. Live location tracking will be stopped immediately, and all ephemeral coordinates will enter the 48-hour purge schedule.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowResolveModal(false);
                  onResolve();
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-xs font-bold text-white cursor-pointer shadow-sm"
              >
                Confirm I Am Safe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
