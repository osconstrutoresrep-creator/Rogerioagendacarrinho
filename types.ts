
export type Role = 'ADMIN' | 'USER';

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: Role;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  active: boolean;
  createdBy: string;
}

export interface Schedule {
  id: string;
  name: string;
  category: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  slotDuration: number; // in minutes
  daysOfWeek: number[]; // 0-6
  active: boolean;
  maxParticipantsPerSlot: number;
  observation?: string;
  daysConfig?: {
    [day: number]: {
      startTime: string;
      endTime: string;
    };
  };
}

export interface Appointment {
  id: string;
  scheduleId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  participants: (string | { manualName: string })[]; // IDs of users or manual names
  createdBy: string; // User ID
}

export type View = 'LOGIN' | 'DASHBOARD' | 'USER_MANAGEMENT' | 'SCHEDULE_CONFIG' | 'BOOKING' | 'PROFILE' | 'ALL_APPOINTMENTS';
