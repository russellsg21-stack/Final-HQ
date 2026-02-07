import React from 'react';
import { X, Bell, AlertTriangle, Clock } from 'lucide-react';

export interface RoomNotification {
  id: string;
  roomNumber: string;
  propertyName: string;
  type: 'warning' | 'expiry';
  message: string;
  timestamp: number;
}

interface NotificationModalProps {
  notifications: RoomNotification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

const NotificationModal: React.FC<NotificationModalProps> = ({ notifications, onDismiss, onDismissAll }) => {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-10 sm:pt-20 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden animate-in slide-in-from-top-10 duration-500 border border-slate-100">
        <div className="p-8 bg-white flex justify-between items-center border-b border-slate-50">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-500 rounded-2xl animate-bounce shadow-[0_5px_15px_rgba(245,158,11,0.4)] text-white">
              <Bell size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter uppercase italic text-slate-900">Live Alerts</h2>
              <p className="text-[10px] font-black text-amber-500 tracking-widest uppercase">Operational Stream</p>
            </div>
          </div>
          <button 
            onClick={onDismissAll}
            className="text-[10px] font-black px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl transition-all border border-amber-100 uppercase tracking-widest"
          >
            Clear All
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-6 space-y-4 bg-white custom-scrollbar">
          {notifications.map((note) => (
            <div 
              key={note.id}
              className={`flex items-center gap-5 p-5 rounded-3xl border-2 transition-all shadow-sm group ${
                note.type === 'expiry' 
                  ? 'bg-rose-50 border-rose-100 text-rose-900' 
                  : 'bg-amber-50 border-amber-100 text-amber-900'
              }`}
            >
              <div className={`p-4 rounded-2xl shadow-lg ${note.type === 'expiry' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'}`}>
                {note.type === 'expiry' ? <AlertTriangle size={24} /> : <Clock size={24} />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-black text-xl leading-none mb-1 tracking-tighter">ROOM {note.roomNumber}</h3>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-50 mb-2">{note.propertyName}</p>
                  </div>
                  <span className="text-[9px] font-black opacity-40 uppercase bg-black/5 px-2 py-1 rounded-lg">
                    {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm font-bold opacity-80 leading-snug">{note.message}</p>
              </div>
              <button 
                onClick={() => onDismiss(note.id)}
                className="p-2 hover:bg-black/5 rounded-xl transition-colors"
              >
                <X size={20} className="opacity-40 group-hover:opacity-100" />
              </button>
            </div>
          ))}
        </div>
        
        <div className="p-6 bg-slate-50 text-center">
          <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em]">
            System Auto-monitoring Active
          </p>
        </div>
      </div>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default NotificationModal;