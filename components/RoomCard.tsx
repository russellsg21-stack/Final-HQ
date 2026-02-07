import React, { useState, useEffect } from 'react';
import { Room, RoomStatus } from '../types.ts';
import { Clock, User, Sun, Moon, CalendarCheck } from 'lucide-react';

interface RoomCardProps {
  room: Room;
  onClick: (roomId: number) => void;
}

const RoomCard: React.FC<RoomCardProps> = ({ room, onClick }) => {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (room.status === RoomStatus.OCCUPIED && room.endTime) {
      const updateTimer = () => {
        const now = Date.now();
        const diff = Math.max(0, room.endTime! - now);
        setTimeLeft(diff);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [room.status, room.endTime]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusStyles = () => {
    switch (room.status) {
      case RoomStatus.FREE: return 'bg-emerald-500 border-emerald-400 text-white';
      case RoomStatus.RESERVED: return 'bg-blue-500 border-blue-400 text-white';
      default: return 'bg-rose-500 border-rose-400 text-white';
    }
  };

  return (
    <button onClick={() => onClick(room.id)} className={`room-transition aspect-square w-full rounded-2xl border-4 flex flex-col items-center justify-center p-4 relative overflow-hidden group shadow-sm hover:shadow-xl active:scale-95 outline-none focus:ring-4 ${getStatusStyles()}`}>
      <div className="flex flex-col items-center">
        {room.roomType && <span className="text-[8px] font-black uppercase tracking-widest opacity-60 mb-0.5">{room.roomType}</span>}
        <span className="text-4xl md:text-5xl font-black tracking-tighter drop-shadow-sm mb-1">{room.roomNumber}</span>
      </div>
      <div className="flex flex-col items-center gap-1 mt-1 w-full px-2">
        {room.status === RoomStatus.OCCUPIED ? (
          <>
            <div className="flex items-center gap-1.5 bg-black/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
              <Clock size={12} className="text-white/80" />
              <span className="text-xs font-mono font-bold">{formatTime(timeLeft)}</span>
            </div>
            <div className="flex items-center gap-1 opacity-80 truncate w-full justify-center">
              <User size={10} /><span className="text-[10px] font-bold uppercase truncate">{room.guestName}</span>
            </div>
          </>
        ) : room.status === RoomStatus.RESERVED ? (
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-1.5 bg-black/10 px-2 py-0.5 rounded-full backdrop-blur-sm mb-1"><CalendarCheck size={12} className="text-white/80" /><span className="text-[10px] font-black uppercase">RESERVED</span></div>
            <div className="flex items-center gap-1 opacity-80 truncate w-full justify-center"><span className="text-[10px] font-bold uppercase truncate">{room.guestName}</span></div>
          </div>
        ) : <span className="text-[10px] font-black opacity-60 uppercase tracking-widest">FREE</span>}
      </div>
    </button>
  );
};

export default RoomCard;