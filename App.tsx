import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Room, RoomStatus, OccupancyStats, DailyStats } from './types.ts';
import RoomCard from './components/RoomCard.tsx';
import RoomModal from './components/RoomModal.tsx';
import NotificationModal, { RoomNotification } from './components/NotificationModal.tsx';
import DailyReportModal from './components/DailyReportModal.tsx';
import { generateOccupancyReport } from './services/geminiService.ts';
import { Building2, LayoutGrid, PieChart, Sparkles, RefreshCcw, CheckCircle2, AlertCircle, X, Hotel, MapPin, BarChart3, Tag, Radio } from 'lucide-react';

type PropertyId = 'sweetheart' | 'roygan';

const ROYGAN_ROOM_CONFIG = [
  { type: "Single Standard", rooms: ["206", "302", "209"] },
  { type: "Single Premier", rooms: ["300", "304", "308", "309"] },
  { type: "Double Standard", rooms: ["204", "205", "305", "306", "307"] },
  { type: "Deluxe Room", rooms: ["105", "208", "303"] },
  { type: "Super Deluxe", rooms: ["216", "220"] },
  { type: "Suite Room", rooms: ["214", "215", "217", "218"] },
  { type: "Executive Suite", rooms: ["210", "211"] }
];

const INITIAL_ROOMS: Room[] = [
  ...Array.from({ length: 16 }, (_, i) => ({
    id: i + 1,
    propertyId: 'sweetheart' as PropertyId,
    roomNumber: (i + 1).toString(),
    status: RoomStatus.FREE,
    roomType: 'Hourly Unit'
  })),
  ...ROYGAN_ROOM_CONFIG.flatMap((group, groupIdx) => 
    group.rooms.map((num, roomIdx) => ({
      id: 100 + groupIdx * 100 + roomIdx,
      propertyId: 'roygan' as PropertyId,
      roomNumber: num,
      status: RoomStatus.FREE,
      roomType: group.type
    }))
  )
];

const PROPERTY_NAMES: Record<PropertyId, string> = {
  sweetheart: 'Sweet Heart Inn',
  roygan: 'Roygan Hotel'
};

const WARNING_THRESHOLD = 5 * 60 * 1000;

const syncChannel = new BroadcastChannel('gantuangco_sync_channel_v1');

const App: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('gantuangco_rooms_v2');
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  const [dailyStats, setDailyStats] = useState<DailyStats>(() => {
    const saved = localStorage.getItem('gantuangco_daily_stats_v2');
    const today = new Date().toISOString().split('T')[0];
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) return parsed;
    }
    return { date: today, royganBookings: 0, royganBookedRooms: [], sweetheartRoomHours: {} };
  });
  
  const [activeProperty, setActiveProperty] = useState<PropertyId>('sweetheart');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const [notifications, setNotifications] = useState<RoomNotification[]>([]);
  const notifiedFlags = useRef<{ [roomId: number]: { warning: boolean; expiry: boolean; oneHour: boolean } }>({});

  useEffect(() => {
    const handleSync = (event: MessageEvent) => {
      if (event.data.type === 'SYNC_STATE') {
        const { rooms: remoteRooms, dailyStats: remoteStats } = event.data;
        setRooms(remoteRooms);
        setDailyStats(remoteStats);
        setLastSync(new Date());
      }
    };
    syncChannel.addEventListener('message', handleSync);
    return () => syncChannel.removeEventListener('message', handleSync);
  }, []);

  const broadcastState = (newRooms: Room[], newStats: DailyStats) => {
    syncChannel.postMessage({ type: 'SYNC_STATE', rooms: newRooms, dailyStats: newStats });
    setLastSync(new Date());
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (dailyStats.date !== today) {
      setDailyStats({ date: today, royganBookings: 0, royganBookedRooms: [], sweetheartRoomHours: {} });
    }
  }, [dailyStats.date]);

  useEffect(() => {
    localStorage.setItem('gantuangco_daily_stats_v2', JSON.stringify(dailyStats));
    localStorage.setItem('gantuangco_rooms_v2', JSON.stringify(rooms));
  }, [dailyStats, rooms]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newNotifications: RoomNotification[] = [];
      rooms.forEach(room => {
        if (room.status === RoomStatus.OCCUPIED && room.endTime) {
          const remaining = room.endTime - now;
          if (!notifiedFlags.current[room.id]) notifiedFlags.current[room.id] = { warning: false, expiry: false, oneHour: false };
          const flags = notifiedFlags.current[room.id];
          if (remaining <= 0 && !flags.expiry) {
            newNotifications.push({ id: `${room.id}-expiry-${now}`, roomNumber: room.roomNumber, propertyName: PROPERTY_NAMES[room.propertyId], type: 'expiry', message: 'The stay for this room has expired.', timestamp: now });
            flags.expiry = true;
          } else if (remaining > 0 && remaining <= WARNING_THRESHOLD && !flags.warning) {
            newNotifications.push({ id: `${room.id}-warning-${now}`, roomNumber: room.roomNumber, propertyName: PROPERTY_NAMES[room.propertyId], type: 'warning', message: 'Only 5 minutes remaining for this guest.', timestamp: now });
            flags.warning = true;
          }
        }
      });
      if (newNotifications.length > 0) setNotifications(prev => [...newNotifications, ...prev]);
    }, 5000);
    return () => clearInterval(interval);
  }, [rooms]);

  const activeRooms = useMemo(() => rooms.filter(r => r.propertyId === activeProperty), [rooms, activeProperty]);

  const groupedRooms: Record<string, Room[]> = useMemo(() => {
    const groups: Record<string, Room[]> = {};
    activeRooms.forEach(room => {
      const type = room.roomType || 'Other';
      if (!groups[type]) groups[type] = [];
      groups[type].push(room);
    });
    Object.keys(groups).forEach(type => groups[type].sort((a, b) => parseInt(a.roomNumber) - parseInt(b.roomNumber)));
    if (activeProperty === 'roygan') {
      const orderedTypes = ROYGAN_ROOM_CONFIG.map(c => c.type);
      const sortedEntries = Object.entries(groups).sort((a, b) => orderedTypes.indexOf(a[0]) - orderedTypes.indexOf(b[0]));
      return Object.fromEntries(sortedEntries) as Record<string, Room[]>;
    }
    return groups;
  }, [activeRooms, activeProperty]);

  const activeStats: OccupancyStats = useMemo(() => {
    const propertyRooms = rooms.filter(r => r.propertyId === activeProperty);
    const occupied = propertyRooms.filter(r => r.status === RoomStatus.OCCUPIED).length;
    return { total: propertyRooms.length, occupied, free: propertyRooms.length - occupied, occupancyRate: propertyRooms.length > 0 ? (occupied / propertyRooms.length) * 100 : 0 };
  }, [rooms, activeProperty]);

  const handleRoomClick = (roomId: number) => {
    setSelectedRoomId(roomId);
    setIsModalOpen(true);
  };

  const handleModalSubmit = (guestName: string, durationData: any) => {
    if (selectedRoomId === null) return;
    const updatedStats = { ...dailyStats };
    const updatedRooms = rooms.map(room => {
      if (room.id === selectedRoomId) {
        const now = new Date();
        if (room.propertyId === 'roygan') {
          const { days, earlyCheckIn, lateCheckOut } = durationData;
          const checkOutDate = new Date(now);
          checkOutDate.setDate(now.getDate() + parseInt(days));
          checkOutDate.setHours(lateCheckOut ? 14 : 12, 0, 0, 0); 
          if (room.status !== RoomStatus.OCCUPIED) {
            updatedStats.royganBookings += 1;
            updatedStats.royganBookedRooms = Array.from(new Set([...updatedStats.royganBookedRooms, room.roomNumber]));
          }
          return { ...room, status: RoomStatus.OCCUPIED, guestName, startTime: now.getTime(), endTime: checkOutDate.getTime(), earlyCheckIn, lateCheckOut };
        } else {
          const { totalMinutes } = durationData;
          const status = totalMinutes > 0 ? RoomStatus.OCCUPIED : RoomStatus.FREE;
          if (status === RoomStatus.OCCUPIED) {
            const addedHours = totalMinutes / 60;
            updatedStats.sweetheartRoomHours[room.roomNumber] = (updatedStats.sweetheartRoomHours[room.roomNumber] || 0) + addedHours;
          }
          return { ...room, status, guestName: status === RoomStatus.FREE ? undefined : guestName, startTime: now.getTime(), endTime: status === RoomStatus.FREE ? undefined : Date.now() + (totalMinutes * 60 * 1000) };
        }
      }
      return room;
    });
    setRooms(updatedRooms);
    setDailyStats(updatedStats);
    broadcastState(updatedRooms, updatedStats);
    setIsModalOpen(false);
    setSelectedRoomId(null);
  };

  const handleReserve = (guestName: string) => {
    if (selectedRoomId === null) return;
    const updatedRooms = rooms.map(room => room.id === selectedRoomId ? { ...room, status: RoomStatus.RESERVED, guestName } : room);
    setRooms(updatedRooms);
    broadcastState(updatedRooms, dailyStats);
    setIsModalOpen(false);
  };

  const handleCheckOut = () => {
    if (selectedRoomId === null) return;
    const updatedRooms = rooms.map(room => room.id === selectedRoomId ? { ...room, status: RoomStatus.FREE, guestName: undefined, startTime: undefined, endTime: undefined, earlyCheckIn: false, lateCheckOut: false } : room);
    setRooms(updatedRooms);
    broadcastState(updatedRooms, dailyStats);
    setIsModalOpen(false);
  };

  const fetchAiReport = async () => {
    setIsGeneratingReport(true);
    const report = await generateOccupancyReport(activeRooms);
    setAiReport(report);
    setIsGeneratingReport(false);
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  return (
    <div className="min-h-screen bg-white pb-20 selection:bg-amber-500 selection:text-white">
      <header className="sticky top-0 z-30 border-b shadow-sm bg-white border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl shadow-lg bg-amber-500 text-white"><Building2 size={28} /></div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter italic text-slate-900">Gantuangco Co.</h1>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-50 border border-amber-100">
                    <Radio size={10} className="text-amber-500 animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-amber-600">Live Sync</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">
                    Last: {lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-2 px-4 py-3 rounded-2xl font-black shadow-md bg-white text-slate-900 border border-slate-100"><BarChart3 size={18} className="text-amber-500" /><span className="hidden sm:inline uppercase text-xs tracking-widest">Reports</span></button>
              <button onClick={fetchAiReport} disabled={isGeneratingReport} className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black shadow-lg bg-amber-500 text-white disabled:opacity-50">{isGeneratingReport ? <RefreshCcw className="animate-spin" size={18} /> : <Sparkles size={18} />}<span className="hidden sm:inline uppercase text-xs tracking-widest">AI Insights</span></button>
            </div>
          </div>
          <div className="flex gap-2 pb-0">
            {(Object.keys(PROPERTY_NAMES) as PropertyId[]).map((id) => (
              <button key={id} onClick={() => setActiveProperty(id)} className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeProperty === id ? 'text-amber-600' : 'text-slate-400 opacity-60'}`}>{id === 'sweetheart' ? <Hotel size={14} /> : <MapPin size={14} />}{PROPERTY_NAMES[id]}{activeProperty === id && (<div className="absolute bottom-0 left-0 right-0 h-1 rounded-t-full bg-amber-500" />)}</button>
            ))}
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          <StatCard icon={<LayoutGrid size={18}/>} label="Total Units" value={activeStats.total} color="bg-white border-slate-100" />
          <StatCard icon={<AlertCircle size={18}/>} label="Occupied" value={activeStats.occupied} color="bg-rose-50 border-rose-100 text-rose-600" />
          <StatCard icon={<CheckCircle2 size={18}/>} label="Vacant" value={activeStats.free} color="bg-emerald-50 border-emerald-100 text-emerald-600" />
          <StatCard icon={<PieChart size={18}/>} label="Load Factor" value={`${activeStats.occupancyRate.toFixed(1)}%`} color="bg-amber-50 border-amber-100 text-amber-600" />
        </section>
        {aiReport && (
          <div className="mb-10 bg-amber-500 text-white p-8 rounded-[2.5rem] shadow-xl flex items-start gap-6 relative overflow-hidden group">
            <div className="bg-white p-4 rounded-3xl text-amber-600 shadow-lg"><Sparkles size={28} /></div>
            <div className="flex-1"><h4 className="font-black text-xl mb-2 tracking-tight uppercase">Executive Summary</h4><p className="text-white/90 text-base font-medium leading-relaxed">{aiReport}</p></div>
            <button onClick={() => setAiReport(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X size={24} /></button>
          </div>
        )}
        <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
          <div className="space-y-12">
            {Object.entries(groupedRooms).map(([type, rooms]) => (
              <div key={type} className="space-y-6">
                <div className="flex items-center gap-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50"><div className="bg-amber-500 p-2 rounded-xl text-white"><Tag size={18} /></div><h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">{type}</h3><div className="flex-1 h-[1px] bg-amber-100" /><span className="text-[10px] font-black text-amber-600 bg-white px-3 py-1 rounded-full border border-amber-100">{rooms.length} UNITS</span></div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {rooms.map(room => <RoomCard key={room.id} room={room} onClick={handleRoomClick} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <RoomModal 
        isOpen={isModalOpen} status={selectedRoom?.status || RoomStatus.FREE} propertyId={selectedRoom?.propertyId || 'sweetheart'} 
        onClose={() => setIsModalOpen(false)} roomNumber={selectedRoom?.roomNumber || ''} 
        initialData={selectedRoom ? { guestName: selectedRoom.guestName || '', endTime: selectedRoom.endTime, earlyCheckIn: selectedRoom.earlyCheckIn, lateCheckOut: selectedRoom.lateCheckOut } : undefined}
        onSubmit={handleModalSubmit} onReserve={handleReserve} onCheckOut={handleCheckOut}
      />
      <DailyReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} stats={dailyStats} rooms={rooms} />
      <NotificationModal notifications={notifications} onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} onDismissAll={() => setNotifications([])} />
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) => (
  <div className={`flex flex-col gap-1 px-6 py-6 rounded-[2rem] border transition-all hover:shadow-xl hover:scale-[1.02] ${color}`}>
    <div className="opacity-40 mb-2">{icon}</div><span className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</span><span className="text-2xl font-black tracking-tight">{value}</span>
  </div>
);

export default App;