
import { User, Schedule, Appointment, Role, Announcement } from './types';

const STORAGE_KEY = 'agendai_data_v1';

interface DB {
  users: User[];
  schedules: Schedule[];
  appointments: Appointment[];
  announcements: Announcement[];
}

const initialData: DB = {
  users: [
    {
      id: 'admin-1',
      name: 'João Silva',
      email: 'admin@empresa.com',
      password: '123',
      role: 'ADMIN' as Role
    },
    {
      id: 'user-1',
      name: 'Ana Silva',
      email: 'ana@teste.com',
      password: '123',
      role: 'USER' as Role
    },
    {
      id: 'admin-rogerio',
      name: 'Rogerio',
      email: 'wallanrogerio@gmail.com',
      password: '123456',
      role: 'ADMIN' as Role
    }
  ],
  schedules: [
    {
      id: 'sch-1',
      name: 'Quadra A',
      category: 'Esportes',
      startTime: '08:00',
      endTime: '22:00',
      slotDuration: 60,
      daysOfWeek: [1, 2, 3, 4, 5],
      active: true,
      maxParticipantsPerSlot: 2
    },
    {
      id: 'sch-2',
      name: 'Consultório 1',
      category: 'Saúde',
      startTime: '09:00',
      endTime: '18:00',
      slotDuration: 30,
      daysOfWeek: [1, 2, 3, 4, 5],
      active: true,
      maxParticipantsPerSlot: 2
    }
  ],
  appointments: [
    {
      id: 'app-1',
      scheduleId: 'sch-1',
      date: '2023-10-24',
      time: '10:00',
      participants: ['user-1'],
      createdBy: 'user-1'
    }
  ],
  announcements: []
};

export const loadDB = (): DB => {
  const data = localStorage.getItem(STORAGE_KEY);
  let db: DB;

  if (!data) {
    db = initialData;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } else {
    db = JSON.parse(data);
  }

  if (!db.announcements) {
    db.announcements = [];
  }

  // Ensure Rogerio exists (Migration)
  const rogerioEmail = 'wallanrogerio@gmail.com';
  if (!db.users.find(u => u.email === rogerioEmail)) {
    const newAdmin = initialData.users.find(u => u.email === rogerioEmail);
    if (newAdmin) {
      db.users.push(newAdmin);
      saveDB(db);
    }
  }

  return db;
};

export const saveDB = (db: DB) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
};
