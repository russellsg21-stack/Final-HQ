
import React, { useState, useEffect } from 'react';
import { X, Clock, User, Trash2, Check } from 'lucide-react';

interface RoomModalProps {
  roomNumber: string;
  isOpen: boolean;
  isEditing: boolean;
  onClose: () => void;
  onSubmit: (guestName: string, durationMinutes: number) => void;
  onCheckOut?: () => void;
  initialData?: {
    guestName: string;
    endTime?: number;
  };
}

const RoomModal: React.FC<RoomModalProps> = ({ 
  roomNumber, 
  isOpen, 
  isEditing, 
  onClose, 
  onSubmit, 
  onCheckOut,
  initialData 
}) => {
  const [guestName, setGuestName] = useState('');
  const [days, setDays] = useState<string>('0');
  const [hours, setHours] = useState<string>('0');
  const [minutes, setMinutes] = useState<string>('30');

  useEffect(() => {
    if (isOpen) {
      if (isEditing && initialData) {
        setGuestName(initialData.guestName);
        // When editing, we default to 0 to allow user to add "extra" time or just keep as is
        // But the user requested to be able to edit. Let's just reset timer fields for simplicity
        // or we could calculate remaining. Let's default to '0's for duration to make "Extending" easy.
        setDays('0');
        setHours('0');
        setMinutes('0');
      } else {
        setGuestName('');
        setDays('0');
        setHours('0');
        setMinutes('30');
      }
    }
  }, [isOpen, isEditing, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = parseInt(days) || 0;
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const totalMinutes = (d * 24 * 60) + (h * 60) + m;
    
    // Allow submitting with 0 minutes only if editing (to just update guest name)
    if (!isEditing && totalMinutes <= 0) {
      alert("Please enter a valid stay duration.");
      return;
    }
    
    onSubmit(guestName || 'Anonymous Guest', totalMinutes);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Room {roomNumber}</h2>
            <p className="text-sm text-slate-500">{isEditing ? 'Update occupancy details' : 'New check-in'}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <User size={16} className="text-slate-400" /> Guest Name
            </label>
            <input
              autoFocus
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Clock size={16} className="text-slate-400" /> {isEditing ? 'Add Duration (Time)' : 'Duration of Stay'}
            </label>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Days</label>
                <input
                  type="number"
                  min="0"
                  value={days}
                  onFocus={handleFocus}
                  onChange={(e) => setDays(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-none text-center font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Hours</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={hours}
                  onFocus={handleFocus}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-none text-center font-semibold"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Mins</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onFocus={handleFocus}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:outline-none text-center font-semibold"
                />
              </div>
            </div>
            {isEditing && <p className="text-[10px] text-slate-400 italic text-center">Entering values here will extend the current stay.</p>}
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Check size={20} />
              {isEditing ? 'Save Changes' : 'Confirm Check-In'}
            </button>
            
            {isEditing && onCheckOut && (
              <button
                type="button"
                onClick={onCheckOut}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={20} />
                Check Out Guest
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomModal;
