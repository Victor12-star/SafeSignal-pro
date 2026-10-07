import React, { useState } from 'react';
import {
  Shield,
  Lock,
  MapPin,
  Trash2,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  Smartphone,
  EyeOff,
  Database,
} from 'lucide-react';

interface PlayStoreComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurgeAllData: () => void;
}

export const PlayStoreComplianceModal: React.FC<PlayStoreComplianceModalProps> = ({
  isOpen,
  onClose,
  onPurgeAllData,
}) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'location' | 'disclaimer' | 'deletion'>('privacy');
  const [purgedSuccess, setPurgedSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePurge = () => {
    onPurgeAllData();
    setPurgedSuccess(true);
    setTimeout(() => setPurgedSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600/20 border border-rose-500/40 rounded-xl">
              <Shield className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white uppercase tracking-wider">
                Google Play Compliance &amp; Privacy Center
              </h2>
              <span className="text-[10px] text-slate-400 font-mono">
                GDPR • NDPR • Location Privacy Standard
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

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 bg-slate-950/70 border-b border-slate-800 p-1.5 text-xs font-semibold shrink-0 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 text-[11px] ${
              activeTab === 'privacy'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="truncate">Privacy</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('location')}
            className={`py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 text-[11px] ${
              activeTab === 'location'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate">Location</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('disclaimer')}
            className={`py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 text-[11px] ${
              activeTab === 'disclaimer'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="truncate">Disclaimer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('deletion')}
            className={`py-1.5 px-2 rounded-xl transition-all flex items-center justify-center gap-1 text-[11px] ${
              activeTab === 'deletion'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-950'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="truncate">Data Rights</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300">
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                  Zero Monetization Policy
                </span>
                <h3 className="text-sm font-bold text-white">Your Safety Data is Never Sold or Monitized</h3>
                <p className="text-[11px] text-slate-300">
                  SafeSignal was built on a non-negotiable principle: personal distress telemetries belong exclusively to you and your chosen trusted contacts. We do not sell, rent, or commercialize your location or personal information to third parties, advertising networks, or data brokers.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-rose-400" />
                  Data We Collect During Emergency Sessions
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-slate-400">
                  <li><strong>Precise Geolocation:</strong> Latitude, longitude, altitude, and accuracy radius during active SOS sessions.</li>
                  <li><strong>Battery Status:</strong> Percentage and charging status to notify responders if device power is dying.</li>
                  <li><strong>Trusted Contact Info:</strong> Normalized E.164 phone numbers stored locally for SMS dispatch.</li>
                  <li><strong>Breadcrumb Telemetry:</strong> Last 5 coordinates to visualize speed and direction of travel.</li>
                </ul>
              </div>

              <div className="p-3 bg-rose-950/40 border border-rose-900/60 rounded-2xl space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-rose-300">
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>48-Hour Ephemeral Purge Guarantee</span>
                </div>
                <p className="text-[11px] text-rose-200/90 leading-relaxed">
                  All GPS telemetry and tracking tokens expire automatically within 24–48 hours of an incident being resolved. SafeSignal operates a strict zero-retention policy for historical tracking data.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PROMINENT LOCATION DISCLOSURE */}
          {activeTab === 'location' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-rose-950/70 border-2 border-rose-500 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-rose-400 shrink-0" />
                  <h3 className="text-sm font-bold text-white">
                    Google Play Prominent Location Disclosure
                  </h3>
                </div>
                <p className="text-[11px] text-rose-100 leading-relaxed">
                  SafeSignal collects and transmits <strong>precise location data</strong> (including in the background when the app is minimized or the screen is locked) <strong>ONLY when you explicitly trigger an Emergency SOS or Safe Journey timer</strong>.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  How Location Data is Used:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-white block">1. Distress SMS Broadcast</span>
                    <span className="text-slate-400">Generates Google Maps coordinates included in the emergency SMS blast to contacts.</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-white block">2. 5-Point Breadcrumb Trail</span>
                    <span className="text-slate-400">Illustrates vector and direction of travel so family members know where you moved.</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-white block">3. Immediate Daemon Shutdown</span>
                    <span className="text-slate-400">GPS location hardware is completely powered off the moment an incident is resolved.</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-white block">4. Zero Inactive Tracking</span>
                    <span className="text-slate-400">SafeSignal NEVER monitors your location when no SOS or Safe Journey is running.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EMERGENCY DISCLAIMER */}
          {activeTab === 'disclaimer' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-amber-950/60 border border-amber-800 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <h3 className="text-sm font-bold text-white">
                    Emergency Services &amp; Regulatory Notice
                  </h3>
                </div>
                <p className="text-[11px] text-amber-100 leading-relaxed">
                  <strong>SafeSignal is a secondary personal safety and broadcast platform.</strong> It does NOT replace official national emergency telephone services (such as 112 in Sweden/Europe, 112/199 in Nigeria, or 911 in the USA).
                </p>
              </div>

              <div className="space-y-2 text-[11px] text-slate-300 leading-relaxed">
                <p>
                  In the event of immediate danger to life or physical safety, you should always dial your country's official emergency dispatch number if it is safe to speak.
                </p>
                <p>
                  SafeSignal provides rapid SMS dispatch and web tracking so family and trusted individuals can assist or relay your exact location to local authorities on your behalf when you cannot speak or dial.
                </p>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>International Dispatch Routing:</span>
                <span className="text-emerald-400 font-mono font-bold">112 / 911 / 999 Supported</span>
              </div>
            </div>
          )}

          {/* TAB 4: DATA RIGHTS & DELETION */}
          {activeTab === 'deletion' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-mono text-rose-400 font-bold uppercase tracking-wider">
                  Google Play Account / Data Deletion Compliance
                </span>
                <h3 className="text-sm font-bold text-white">Full Right to Erasure</h3>
                <p className="text-[11px] text-slate-300">
                  Under GDPR Article 17 and Google Play Developer Policy, you have the absolute right to purge all data cached on this device at any time.
                </p>
              </div>

              <div className="p-3.5 bg-rose-950/50 border border-rose-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-rose-300">
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Purge All Local Emergency History &amp; Cache</span>
                </div>
                <p className="text-[11px] text-rose-200/90 leading-relaxed">
                  Tapping the button below will immediately wipe all recorded breadcrumb coordinates, cached emergency session states, and offline queue logs from device storage.
                </p>

                <button
                  type="button"
                  onClick={handlePurge}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-98 transition-all rounded-xl text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-950 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Purge Stored Cache &amp; Ephemeral Coordinates Now</span>
                </button>

                {purgedSuccess && (
                  <div className="p-2 bg-emerald-950/80 border border-emerald-600 text-emerald-200 rounded-xl text-center font-bold text-[11px] flex items-center justify-center gap-1.5 animate-fadeIn">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Local emergency data and coordinates purged successfully!</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            SafeSignal v1.2.0 • Play Store Ready
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
