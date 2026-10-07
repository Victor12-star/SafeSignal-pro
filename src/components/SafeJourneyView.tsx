import React, { useState, useEffect } from 'react';
import { SafeJourney, TrustedContact } from '../types/safety';
import { Footprints, Clock, ShieldCheck, AlertTriangle, ArrowRight, X } from 'lucide-react';

interface SafeJourneyViewProps {
  contacts: TrustedContact[];
  activeJourney: SafeJourney | null;
  onStartJourney: (destination: string, durationMinutes: number, contactIds: string[]) => void;
  onConfirmSafe: () => void;
  onCancelJourney: () => void;
}

export const SafeJourneyView: React.FC<SafeJourneyViewProps> = ({
  contacts,
  activeJourney,
  onStartJourney,
  onConfirmSafe,
  onCancelJourney,
}) => {
  const [destination, setDestination] = useState('Walking home from transit');
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [selectedContacts, setSelectedContacts] = useState<string[]>(
    contacts.slice(0, 2).map((c) => c.id)
  );

  // Time remaining calculation
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  useEffect(() => {
    if (!activeJourney || activeJourney.status === 'SAFE') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((activeJourney.expiresAt - now) / 1000));
      setRemainingSeconds(diffSec);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeJourney]);

  const toggleContact = (id: string) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (activeJourney && activeJourney.status !== 'SAFE') {
    const isOverdue = remainingSeconds === 0;

    return (
      <div className="p-4 space-y-4 bg-white text-slate-800 font-sans">
        {/* Active Journey Card */}
        <div className={`p-5 rounded-2xl border shadow-xs ${isOverdue ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'} space-y-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Footprints className="w-5 h-5 text-sky-600" />
              <span className="text-xs font-bold tracking-wider uppercase text-slate-800">
                Safe Journey Active
              </span>
            </div>
            <span className="text-xs font-mono text-slate-500 font-semibold">
              {isOverdue ? 'CHECK-IN DUE' : 'MONITORING'}
            </span>
          </div>

          <div className="text-center py-4">
            <div className="text-xs text-slate-500 mb-1">Destination</div>
            <div className="text-base font-bold text-slate-900 mb-3">{activeJourney.destination}</div>

            <div className="text-4xl font-extrabold font-mono tabular-nums text-slate-900">
              {formatTime(remainingSeconds)}
            </div>
            <div className="text-xs text-slate-500 mt-1">Estimated Arrival Time Remaining</div>
          </div>

          {isOverdue && (
            <div className="p-3 bg-amber-100 rounded-xl border border-amber-300 text-xs text-amber-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Are you safe?</span> SafeSignal has started a 3-minute grace countdown. If unconfirmed, emergency escalation will dispatch your location silently to the Reserve End.
              </div>
            </div>
          )}

          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={onConfirmSafe}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" /> I Have Arrived Safely
            </button>

            <button
              onClick={onCancelJourney}
              className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
            >
              Cancel Journey Monitoring
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
          <div className="font-semibold text-slate-800">Designated Contacts ({activeJourney.contactIds.length})</div>
          <div className="space-y-1">
            {contacts
              .filter((c) => activeJourney.contactIds.includes(c.id))
              .map((c) => (
                <div key={c.id} className="flex justify-between text-[11px]">
                  <span>{c.name} ({c.relationship})</span>
                  <span className="font-mono text-slate-400">{c.phone}</span>
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5 bg-white text-slate-800 font-sans">
      <div className="space-y-1">
        <h2 className="text-base font-bold text-slate-900 tracking-tight">Start Safe Journey</h2>
        <p className="text-xs text-slate-500">
          Monitors transit timer quietly. If you don't check in upon arrival, alerts dispatch to the Reserve End automatically.
        </p>
      </div>

      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 shadow-xs">
        {/* Destination input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Destination / Route
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
            placeholder="e.g. Walking home from Metro station"
          />
        </div>

        {/* Estimated Duration Slider */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-slate-700 uppercase tracking-wider">Estimated Duration</span>
            <span className="font-mono text-slate-900 font-bold">{durationMinutes} minutes</span>
          </div>
          <input
            type="range"
            min="5"
            max="90"
            step="5"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full accent-slate-900 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>5 mins</span>
            <span>30 mins</span>
            <span>60 mins</span>
            <span>90 mins</span>
          </div>
        </div>

        {/* Contacts to notify */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
            Contacts to Notify Upon Delay
          </label>
          <div className="space-y-1.5">
            {contacts.map((c) => {
              const isSelected = selectedContacts.includes(c.id);
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => toggleContact(c.id)}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white border-slate-400 text-slate-900 shadow-2xs'
                      : 'bg-white/60 border-slate-200 text-slate-500'
                  }`}
                >
                  <div className="text-xs">
                    <span className="font-semibold text-slate-800">{c.name}</span>
                    <span className="text-slate-500 ml-1.5 text-[11px]">· {c.relationship}</span>
                  </div>
                  <span className={`text-[11px] font-semibold ${isSelected ? 'text-slate-900' : 'text-slate-400'}`}>
                    {isSelected ? 'Monitored' : 'Exclude'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onStartJourney(destination, durationMinutes, selectedContacts)}
          disabled={selectedContacts.length === 0}
          className="w-full h-11 bg-slate-900 hover:bg-black active:scale-[0.98] disabled:opacity-50 transition-all rounded-xl text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <Footprints className="w-4 h-4" />
          <span>Begin Journey Monitoring</span>
        </button>
      </div>

      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed">
        <strong>Privacy Note:</strong> Coordinates are only transmitted to the Reserve End if arrival is unconfirmed after the grace window.
      </div>
    </div>
  );
};
