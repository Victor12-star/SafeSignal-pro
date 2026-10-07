import React, { useState } from 'react';
import { Search, Plus, CheckSquare, ChevronLeft, ShieldCheck, EyeOff, Radio } from 'lucide-react';
import { EmergencyIncident } from '../types/safety';

interface DecoyCamouflageViewProps {
  incident: EmergencyIncident | null;
  onExitCamouflage: () => void;
  onOpenReserveEnd: () => void;
}

export const DecoyCamouflageView: React.FC<DecoyCamouflageViewProps> = ({
  incident,
  onExitCamouflage,
  onOpenReserveEnd,
}) => {
  const [selectedNote, setSelectedNote] = useState<number | null>(null);
  const [notes, setNotes] = useState([
    {
      id: 1,
      title: 'Weekend Grocery & Household List',
      date: 'Today, 08:30 AM',
      preview: 'Oat milk, Greek yogurt, sourdough bread, organic eggs, apples...',
      body: '1. Oat milk (barista blend)\n2. Sourdough bread\n3. Organic free-range eggs\n4. Olive oil\n5. Honeycrisp apples\n6. Ground coffee beans',
    },
    {
      id: 2,
      title: 'Work Project Follow-ups',
      date: 'Yesterday, 4:15 PM',
      preview: 'Review Q3 performance report and sync with design team on Monday...',
      body: 'Schedule check-in with design lead on Monday morning.\nFinalize Q3 milestone deck.\nCheck client invoice delivery status.',
    },
    {
      id: 3,
      title: 'Apartment Maintenance Tasks',
      date: 'Sep 27, 2026',
      preview: 'Check HVAC filter replacement date, call plumber about balcony drain...',
      body: 'Balcony drain inspection.\nHVAC filter size 16x25x1.\nPick up spare key copy from lobby concierge.',
    },
  ]);

  return (
    <div className="flex flex-col h-full bg-white text-slate-800 select-none overflow-hidden relative animate-in fade-in duration-200 font-sans">
      {/* Discreet Covert Under-the-Hood Telemetry Strip (Very subtle, blends as note sync) */}
      <div className="bg-slate-100/80 px-3 py-1 border-b border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Cloud Notes Sync: Idle</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Subtle exit button disguised as simple sync button */}
          <button
            type="button"
            onClick={onOpenReserveEnd}
            className="text-[10px] text-slate-400 hover:text-slate-600 underline cursor-pointer"
            title="Inspect Reserve End Responder Portal"
          >
            Reserve End Live
          </button>
          <button
            type="button"
            onClick={onExitCamouflage}
            className="text-[10px] text-slate-400 hover:text-slate-700 font-medium cursor-pointer"
            title="Exit Decoy Screen"
          >
            Exit Decoy
          </button>
        </div>
      </div>

      {selectedNote !== null ? (
        /* Note Detail View */
        <div className="flex-1 flex flex-col p-4 bg-white overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedNote(null)}
              className="flex items-center gap-1 text-xs text-amber-600 font-semibold cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Notes</span>
            </button>
            <span className="text-[11px] text-slate-400">Saved</span>
          </div>

          <div className="mt-4 space-y-2">
            <h2 className="text-base font-bold text-slate-900">
              {notes.find((n) => n.id === selectedNote)?.title}
            </h2>
            <div className="text-[11px] text-slate-400">
              {notes.find((n) => n.id === selectedNote)?.date}
            </div>
            <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pt-2">
              {notes.find((n) => n.id === selectedNote)?.body}
            </p>
          </div>
        </div>
      ) : (
        /* Notes List View */
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-3 bg-white">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Notes</h1>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{notes.length} notes</span>
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center hover:bg-slate-200"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              readOnly
              placeholder="Search notes"
              className="w-full pl-8 pr-3 py-1.5 bg-slate-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 border-none focus:outline-none"
            />
          </div>

          {/* Notes Cards */}
          <div className="space-y-2 pt-1">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => setSelectedNote(note.id)}
                className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 cursor-pointer transition-colors space-y-1"
              >
                <div className="font-semibold text-xs text-slate-800">{note.title}</div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500">
                  <span className="font-medium text-slate-600">{note.date}</span>
                  <span className="truncate">{note.preview}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Innocent Bottom Banner */}
          <div className="mt-auto pt-4 text-center">
            <p className="text-[10px] text-slate-400">
              All personal notes encrypted with local device key.
            </p>
          </div>
        </div>
      )}

      {/* Safety Reassurance for the user / tester */}
      <div className="p-2.5 bg-amber-50 border-t border-amber-200 text-amber-900 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 truncate">
          <EyeOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="truncate font-medium">
            <strong>Camouflage Active:</strong> Attacker sees normal notes.
          </span>
        </div>
        <button
          type="button"
          onClick={onExitCamouflage}
          className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded font-semibold text-[10px] shrink-0 cursor-pointer"
        >
          View Controls
        </button>
      </div>
    </div>
  );
};
