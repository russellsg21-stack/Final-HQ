import React, { useState, useEffect } from 'react';
import { X, Clock, User, Trash2, Check, Calendar, Sun, Moon, CalendarPlus } from 'lucide-react';
import { RoomStatus } from '../types.ts';

interface RoomModalProps {
  roomNumber: string;
  propertyId: 'sweetheart' | 'roygan';
  isOpen: boolean;
  status: RoomStatus;
  onClose: () => void;
  onSubmit: (guestName: string, durationData: any) => void;
  onReserve?: (guestName: string) => void;
  onCheckOut?: () => void;
  initialData?: {
    guestName: string;
    endTime?: number;
    earlyCheckIn?: boolean;
    lateCheckOut?: boolean;
  };
}

const RoomModal: React.FC<RoomModalProps> = ({ 
  roomNumber, 
  propertyId,
  isOpen, 
  status,
  onClose, 
  onSubmit, 
  onReserve,
  onCheckOut,
  initialData 
}) => {
  const [guestName, setGuestName] = useState('');
  const [days, setDays] = useState<string>('0');
  const [hours, setHours] = useState<string>('0');
  const [minutes, setMinutes] = useState<string>('30');
  const [royganDays, setRoyganDays] = useState<string>('1');
  const [earlyCheckIn, setEarlyCheckIn] = useState(false);
  const [lateCheckOut, setLateCheckOut] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if ((status === RoomStatus.OCCUPIED || status === RoomStatus.RESERVED) && initialData) {
        setGuestName(initialData.guestName);
        if (propertyId === 'roygan') {
          setEarlyCheckIn(initialData.earlyCheckIn || false);
          setLateCheckOut(initialData.lateCheckOut || false);
          if (initialData.endTime) {
            const diff = initialData.endTime - Date.now();
            const d = Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)));
            setRoyganDays(d.toString());
          }
        }
      } else {
        setGuestName(''); setDays('0'); setHours('0'); setMinutes('30'); setRoyganDays('1'); setEarlyCheckIn(false); setLateCheckOut(false);
      }
    }
  }, [isOpen, status, initialData, propertyId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (propertyId === 'roygan') {
      onSubmit(guestName || 'Anonymous Guest', { days: royganDays, earlyCheckIn, lateCheckOut });
    } else {
      const d = parseInt(days) || 0;
      const h = parseInt(hours) || 0;
      const m = parseInt(minutes) || 0;
      onSubmit(guestName || 'Anonymous Guest', { totalMinutes: (d * 24 * 60) + (h * 60) + m });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b flex justify-between items-center bg-white">
          <h2 className="text-2xl font-black text-slate-800 tracking-tighter uppercase italic">Room {roomNumber}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400">Guest Identity</label>
            <input autoFocus type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Full Guest Name" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border focus:ring-4 transition-all font-bold" />
          </div>
          {propertyId === 'roygan' ? (
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400">Planned Duration (Days)</label>
              <input type="number" min="1" value={royganDays} onChange={(e) => setRoyganDays(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white border text-center font-black text-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {['Days', 'Hours', 'Mins'].map((label, idx) => (
                <div key={label}><label className="text-[8px] uppercase font-black text-slate-400 block text-center">{label}</label><input type="number" min="0" value={idx === 0 ? days : idx === 1 ? hours : minutes} onChange={(e) => (idx === 0 ? setDays : idx === 1 ? setHours : setMinutes)(e.target.value)} className="w-full px-3 py-3 rounded-xl bg-slate-50 border text-center font-black" /></div>
              ))}
            </div>
          )}
          <div className="flex flex-col gap-4 pt-4">
            <button type="submit" className="w-full font-black py-5 rounded-[2rem] bg-amber-500 hover:bg-amber-600 text-white shadow-xl active:scale-95 uppercase tracking-widest text-sm"><Check size={24} className="inline mr-2" />Confirm Check-In</button>
            {status !== RoomStatus.FREE && onCheckOut && <button type="button" onClick={onCheckOut} className="w-full bg-rose-50 hover:bg-rose-100 text-rose-500 font-black py-4 rounded-[2rem] transition-all uppercase tracking-widest text-[10px]"><Trash2 size={16} className="inline mr-2" />Release Unit</button>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomModal;