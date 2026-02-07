import React from 'react';
import { X, TrendingUp, Hotel, Clock, Tag, ListCheck } from 'lucide-react';
import { DailyStats, Room } from '../types.ts';

interface DailyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DailyStats;
  rooms: Room[];
}

const DailyReportModal: React.FC<DailyReportModalProps> = ({ isOpen, onClose, stats, rooms }) => {
  if (!isOpen) return null;

  const totalSweetheartHours = (Object.values(stats.sweetheartRoomHours) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-[3rem] w-full max-w-3xl shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="p-10 bg-white text-slate-900 flex justify-between items-center border-b border-slate-50">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-amber-500 rounded-[2rem] shadow-lg text-white"><TrendingUp size={28} /></div>
            <div>
              <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-none mb-1">Performance Hub</h2>
              <p className="text-[10px] font-bold text-amber-500 tracking-[0.3em] uppercase">{stats.date} Operational Audit</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400"><X size={28} /></button>
        </div>
        <div className="p-10 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white border-2 border-slate-50 p-8 rounded-[2.5rem] flex items-center justify-between shadow-sm">
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Roygan Bookings</p><p className="text-5xl font-black text-amber-600 tracking-tighter">{stats.royganBookings}</p></div>
              <div className="p-4 bg-rose-50 rounded-3xl"><Hotel className="text-amber-500" size={40} /></div>
            </div>
            <div className="bg-white border-2 border-slate-50 p-8 rounded-[2.5rem] flex items-center justify-between shadow-sm">
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sweetheart Hours</p><p className="text-5xl font-black text-amber-600 tracking-tighter">{totalSweetheartHours.toFixed(1)}h</p></div>
              <div className="p-4 bg-slate-50 rounded-3xl"><Clock className="text-amber-500" size={40} /></div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-slate-50/50 border-t text-center"><p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Precision Metrics Audit • Finalized at Midnight</p></div>
      </div>
    </div>
  );
};

export default DailyReportModal;