import React, { useState } from 'react';
import { TrustedContact } from '../types/safety';
import { UserPlus, Trash2, Phone, X, Globe, Radio, ShieldCheck } from 'lucide-react';
import { normalizePhoneNumber } from '../services/emergencyEngine';
import { ALL_SUPPORTED_COUNTRIES } from '../config/countries';

interface ContactsManagerProps {
  contacts: TrustedContact[];
  onAddContact: (contact: Omit<TrustedContact, 'id'>) => void;
  onDeleteContact: (id: string) => void;
  defaultCallingCode: string;
}

export const ContactsManager: React.FC<ContactsManagerProps> = ({
  contacts,
  onAddContact,
  onDeleteContact,
  defaultCallingCode,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [callingCode, setCallingCode] = useState(defaultCallingCode);
  const [relationship, setRelationship] = useState<TrustedContact['relationship']>('Family');
  const [group, setGroup] = useState<TrustedContact['group']>('Primary');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const normalized = normalizePhoneNumber(phone.trim(), callingCode);

    onAddContact({
      name: name.trim(),
      phone: normalized,
      relationship,
      group,
      isActive: true,
    });

    setName('');
    setPhone('');
    setShowAddModal(false);
  };

  return (
    <div className="flex-1 p-4 space-y-4 overflow-y-auto bg-white text-slate-800 font-sans">
      {/* Header and Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Trusted Contacts (Reserve End)
          </h2>
          <p className="text-xs text-slate-500">
            Responders who receive your coordinates and power telemetry
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="p-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Contact</span>
        </button>
      </div>

      {/* Reserve End Covert Safety Banner */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Covert Responder Network</span>
        </div>
        <p className="text-[11px] text-slate-600 leading-relaxed">
          When an emergency or shake SOS is triggered, your contacts are alerted on the Reserve End command center. Your handset stays quiet to avoid tipping off any attackers.
        </p>
      </div>

      {/* Contacts List */}
      <div className="space-y-2">
        {contacts.map((contact) => (
          <div
            key={contact.id}
            className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-100/60 transition-colors"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 text-sm">{contact.name}</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  · {contact.relationship}
                </span>
              </div>
              <div className="text-xs font-mono text-slate-600 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-slate-400" /> {contact.phone}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-slate-600 px-2 py-0.5 bg-white border border-slate-200 rounded-md">
                {contact.group}
              </span>
              <button
                onClick={() => onDeleteContact(contact.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                title="Remove Contact"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {contacts.length === 0 && (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500 text-xs">
            No trusted contacts configured. Add at least one contact to receive emergency alerts.
          </div>
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-rose-600" /> Add Global Contact
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Elena Rostova"
                className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Phone Number (International E.164)</label>
              <div className="flex gap-2">
                <select
                  value={callingCode}
                  onChange={(e) => setCallingCode(e.target.value)}
                  className="px-2 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs text-slate-800 font-mono focus:outline-none max-w-[130px]"
                >
                  {ALL_SUPPORTED_COUNTRIES.map((c) => (
                    <option key={c.countryCode} value={c.callingCode}>
                      {c.flagEmoji} {c.callingCode}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="070 123 4567"
                  className="flex-1 px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs text-slate-900 font-mono focus:outline-none focus:border-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Relationship</label>
                <select
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Family">Family</option>
                  <option value="Partner">Partner</option>
                  <option value="Friend">Friend</option>
                  <option value="Neighbour">Neighbour</option>
                  <option value="Medical">Medical</option>
                  <option value="Work">Work</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Alert Priority</label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-300 text-xs text-slate-800 focus:outline-none"
                >
                  <option value="Primary">Primary (Always Alert)</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Night Commute">Night Commute</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-sm"
            >
              Save Contact
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
