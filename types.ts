export enum RoomStatus {
  FREE = 'FREE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED'
}

export interface Room {
  id: number;
  propertyId: 'sweetheart' | 'roygan';
  roomNumber: string;
  status: RoomStatus;
  roomType?: string;
  guestName?: string;
  startTime?: number; // Timestamp
  endTime?: number;   // Timestamp
  earlyCheckIn?: boolean;
  lateCheckOut?: boolean;
}

export interface OccupancyStats {
  total: number;
  occupied: number;
  free: number;
  occupancyRate: number;
}

export interface DailyStats {
  date: string; // ISO date string (YYYY-MM-DD)
  royganBookings: number;
  royganBookedRooms: string[]; // List of room numbers rented today
  sweetheartRoomHours: Record<string, number>; // roomNumber -> total hours
}