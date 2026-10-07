import React, { useState, useEffect } from 'react';
import { EmergencyIncident } from '../types/safety';
import {
  ShieldAlert,
  MapPin,
  Battery,
  PhoneCall,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  BellRing,
  AlertTriangle,
  Radio,
  Zap,
  ShieldCheck,
  ArrowRight,
  EyeOff,
  Navigation,
} from 'lucide-react';
import { BatteryHistoryChart } from './BatteryHistoryChart';
import { RealTimeMapPreview } from './RealTimeMapPreview';
import { emergencyAlarmService } from '../services/emergencyAlarmService';

interface RecipientEmergencyModalProps {
  incident: EmergencyIncident;
  onClose: () => void;
  onAcknowledge: (recipientName: string) => void;
}

export const RecipientEmergencyModal: React.FC<RecipientEmergencyModalProps> = ({
  incident,
  onClose,
  onAcknowledge,
}) => {
  const [hasResponded, setHasResponded] = useState(false);
  const [responderName, setResponderName] = useState('Astrid Lind');
  const [isSirenActive, setIsSirenActive] = useState(false);
  const [audioBlockedByBrowser, setAudioBlockedByBrowser] = useState(false);
  const [showStopAlarmModal, setShowStopAlarmModal] = useState(false);
  const [hasAcknowledgedAlarm, setHasAcknowledgedAlarm] = useState(false);

  useEffect(() => {
    // Subscribe to alarm service state changes
    const unsubscribe = emergencyAlarmService.subscribe((ringing) => {
      setIsSirenActive(ringing);
      if (ringing && !hasAcknowledgedAlarm) {
        setShowStopAlarmModal(true);
      }
    });

    // Attempt to automatically sound the emergency siren immediately on responder's device
    emergencyAlarmService
      .startAlarm()
      .then((success) => {
        if (!success) {
          setAudioBlockedByBrowser(true);
        } else {
          setShowStopAlarmModal(true);
        }
      })
      .catch(() => {
        setAudioBlockedByBrowser(true);
      });

    return () => {
      emergencyAlarmService.stopAlarm();
      unsubscribe();
    };
  }, [hasAcknowledgedAlarm]);

  const handleDismissAudioBlocker = async () => {
    setAudioBlockedByBrowser(false);
    const success = await emergencyAlarmService.startAlarm();
    if (success) {
      setShowStopAlarmModal(true);
    }
  };

  const handleConfirmStopAlarm = () => {
    emergencyAlarmService.stopAlarm();
    setShowStopAlarmModal(false);
    setHasAcknowledgedAlarm(true);
  };

  const handleAcknowledgeAndRespond = () => {
    emergencyAlarmService.stopAlarm();
    setShowStopAlarmModal(false);
    setHasAcknowledgedAlarm(true);
    setHasResponded(true);
    onAcknowledge(responderName);
  };

  const handleRestartAlarm = async () => {
    setAudioBlockedByBrowser(false);
    await emergencyAlarmService.startAlarm();
  };

  const handleResponse = () => {
    setHasResponded(true);
    emergencyAlarmService.stopAlarm();
    setHasAcknowledgedAlarm(true);
    onAcknowledge(responderName);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh] relative text-slate-800 font-sans">
        {/* Top Header Badge */}
        <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider block">
                The Reserve End · Responder Command Center
              </span>
              <span className="text-[10px] text-slate-300 font-mono">
                safesignal.app/reserve/{incident.accessToken.slice(0, 10)}
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              emergencyAlarmService.stopAlarm();
              onClose();
            }}
            className="p-1 text-slate-300 hover:text-white rounded-lg cursor-pointer"
            title="Close Reserve End"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SIREN ALARM BANNER FOR RESPONDER */}
        {isSirenActive ? (
          <div className="bg-rose-600 text-white p-3 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <BellRing className="w-5 h-5 text-white animate-bounce shrink-0" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider">
                  Audible Distress Siren Ringing
                </div>
                <div className="text-[10px] text-rose-100 font-normal">
                  High-volume acoustic alarm active on this responder console
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowStopAlarmModal(true)}
              className="px-3 py-1 bg-white text-rose-700 hover:bg-rose-50 active:scale-95 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-xs"
            >
              Stop Siren
            </button>
          </div>
        ) : (
          <div className="bg-slate-50 px-3.5 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-500 text-[11px]">
              {hasAcknowledgedAlarm ? 'Audible siren acknowledged' : 'Siren muted'}
            </span>
            <button
              type="button"
              onClick={handleRestartAlarm}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Sound Siren Alarm</span>
            </button>
          </div>
        )}

        {/* AUTOPLAY UNLOCK */}
        {audioBlockedByBrowser && (
          <div
            onClick={handleDismissAudioBlocker}
            className="p-2.5 bg-amber-50 border-b border-amber-200 flex items-center justify-between cursor-pointer hover:bg-amber-100 text-amber-900 text-xs"
          >
            <span className="font-medium text-[11px]">
              Tap here to enable emergency audio siren
            </span>
            <span className="px-2 py-0.5 bg-amber-200 text-amber-900 font-bold text-[10px] rounded uppercase">
              Enable Sound
            </span>
          </div>
        )}

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* COVER SENDER PROTECTION EXPLAINER BANNER */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1 text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-xs">
              <EyeOff className="w-4 h-4 text-emerald-700" />
              <span>Covert Sender Protection Active</span>
            </div>
            <p className="text-[11px] text-emerald-900/90 leading-relaxed">
              Alex's phone is operating silently in camouflage mode so that observers or attackers cannot see that an emergency alert was sent. <strong>All active surveillance, GPS fixes, and emergency dispatch are managed here on the Reserve End.</strong>
            </p>
          </div>

          {/* Distress Summary Banner */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Distress Broadcast: {incident.emergencyType}
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">
                  Triggered at {new Date(incident.createdAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-200 italic">
              "{incident.customMessage || 'I am in severe danger. Please reach out to authorities or check my coordinates.'}"
            </p>
          </div>

          {/* Live Coordinates and Map Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                Live Satellite Coordinates
              </span>
              <span className="font-mono text-slate-600 flex items-center gap-1">
                <Battery className="w-3.5 h-3.5 text-slate-500" />
                {incident.batteryLevel}% Battery {incident.batteryLevel <= 15 ? '(Critical)' : ''}
              </span>
            </div>

            {/* Map Preview */}
            <div className="rounded-xl overflow-hidden border border-slate-200">
              <RealTimeMapPreview
                currentLocation={incident.location}
                locationHistory={incident.locationHistory}
                senderName="Alex"
                isRecipientView={true}
              />
            </div>
          </div>

          {/* Battery History Trend on Reserve End */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-xs">
            <h4 className="text-xs font-semibold text-slate-800">
              Sender Handset Battery Drain Trend
            </h4>
            <BatteryHistoryChart
              currentLevel={incident.batteryLevel}
              isCharging={incident.batteryCharging}
              history={incident.batteryHistory}
            />
          </div>

          {/* Responder Action Buttons */}
          <div className="space-y-2.5 pt-1">
            {hasResponded ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto" />
                <div className="text-xs font-bold text-emerald-950">Acknowledgement Dispatched to Alex</div>
                <div className="text-[11px] text-emerald-800">
                  Alex's phone received a discreet, eyes-free haptic heartbeat confirming help is on the way.
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleResponse}
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>I'm Responding (Send Haptic Confirmation)</span>
              </button>
            )}

            <a
              href="tel:112"
              className="w-full h-11 bg-slate-900 hover:bg-black rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs"
            >
              <PhoneCall className="w-4 h-4 text-rose-400" />
              <span>Call Emergency Dispatch (112 / 911)</span>
            </a>
          </div>
        </div>

        {/* STOP ALARM CONFIRMATION MODAL */}
        {showStopAlarmModal && (
          <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                  <BellRing className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Acknowledge Emergency Alarm?
                  </h3>
                  <span className="text-[10px] font-mono text-rose-600 font-semibold uppercase">
                    Audible Siren Active
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Alex triggered this distress broadcast from an active duress situation. Acknowledging confirms that you are taking action.
              </p>

              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleAcknowledgeAndRespond}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Acknowledge & Notify Alex (Stop Siren)</span>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmStopAlarm}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  <span>Mute Siren Only</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
