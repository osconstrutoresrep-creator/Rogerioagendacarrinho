
import { supabase } from './lib/supabase';
import { User, Schedule, Appointment, Announcement } from './types';

export const api = {
    // Auth
    signIn: async (email: string, password: string): Promise<{ user: User | null, error: any }> => {
        const { data, error } = await supabase.from('profiles').select('*').eq('email', email).eq('password', password).single();
        if (error) {
            console.error('Sign In Error:', error);
            return { user: null, error };
        }
        localStorage.setItem('currentUser', JSON.stringify(data));
        return { user: data as User, error: null };
    },

    signUp: async (email: string, password: string, name: string): Promise<{ user: User | null, error: any }> => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name, role: 'USER' }
            }
        });
        if (error) return { user: null, error };

        // Profiles are usually handled by a trigger, but let's be safe
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user?.id).single();
        return { user: profile as User, error: null };
    },

    signOut: async () => {
        localStorage.removeItem('currentUser');
    },

    getCurrentUser: async (): Promise<User | null> => {
        const saved = localStorage.getItem('currentUser');
        return saved ? JSON.parse(saved) : null;
    },

    // Users / Profiles
    getUsers: async (): Promise<User[]> => {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) {
            console.error('Error fetching users:', error);
            return [];
        }
        return data || [];
    },

    createUser: async (user: Partial<User> & { password?: string }): Promise<User | null> => {
        const generateUUID = () => {
            try {
                if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            } catch (e) {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
        };

        const { data, error } = await supabase.from('profiles').insert([{
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role,
            id: generateUUID()
        }]).select().single();

        if (error) {
            console.error('Error creating user:', error);
            alert("Erro ao criar usuário: " + error.message);
            return null;
        }

        return data as User;
    },

    updateUser: async (user: User): Promise<void> => {
        const { error } = await supabase.from('profiles').update({
            name: user.name,
            email: user.email,
            password: user.password,
            role: user.role
        }).eq('id', user.id);

        if (error) {
            console.error('Error updating user:', error);
            alert("Erro ao atualizar usuário: " + error.message);
        }
    },

    deleteUser: async (id: string): Promise<void> => {
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) {
            console.error('Error deleting user:', error);
            alert("Erro ao excluir usuário: " + error.message);
        }
    },

    createUserPlaceholder: async (user: User): Promise<User | null> => {
        return null; // Deprecated
    },

    // Schedules
    getSchedules: async (): Promise<Schedule[]> => {
        const { data, error } = await supabase.from('schedules').select('*');
        if (error) {
            console.error('Error fetching schedules:', error);
            return [];
        }
        // Transform snake_case to camelCase if needed, but it's better to keep DB identical to types or simple mapping
        // Our types use camelCase. DB uses snake_case mostly, let's map it.
        return data.map((s: any) => ({
            ...s,
            startTime: s.start_time,
            endTime: s.end_time,
            slotDuration: s.slot_duration,
            maxParticipantsPerSlot: s.max_participants,
            daysOfWeek: s.days_of_week || [],
            daysConfig: s.days_config || {},
            active: s.active
        })) as Schedule[];
    },

    createSchedule: async (schedule: Schedule): Promise<{ data: Schedule | null, error: any }> => {
        console.log('API: Creating schedule with data:', schedule);
        const { data, error } = await supabase.from('schedules').insert({
            id: schedule.id,
            name: schedule.name,
            category: schedule.category,
            start_time: schedule.startTime,
            end_time: schedule.endTime,
            slot_duration: schedule.slotDuration,
            max_participants: schedule.maxParticipantsPerSlot,
            days_of_week: schedule.daysOfWeek,
            active: schedule.active,
            observation: schedule.observation,
            days_config: schedule.daysConfig
        }).select().single();

        if (error) {
            console.error('API Error creating schedule:', error);
        }
        return { data, error };
    },

    updateSchedule: async (schedule: Schedule): Promise<void> => {
        const { error } = await supabase.from('schedules').update({
            name: schedule.name,
            category: schedule.category,
            start_time: schedule.startTime,
            end_time: schedule.endTime,
            slot_duration: schedule.slotDuration,
            max_participants: schedule.maxParticipantsPerSlot,
            days_of_week: schedule.daysOfWeek,
            active: schedule.active,
            observation: schedule.observation,
            days_config: schedule.daysConfig
        }).eq('id', schedule.id);

        if (error) console.error('Error updating schedule:', error);
    },

    deleteSchedule: async (id: string): Promise<void> => {
        await supabase.from('schedules').delete().eq('id', id);
    },

    // Appointments
    getAppointments: async (): Promise<Appointment[]> => {
        const { data, error } = await supabase.from('appointments').select('*');
        if (error) {
            console.error('Error fetching appointments:', error);
            return [];
        }
        return data.map((a: any) => ({
            id: a.id,
            scheduleId: a.schedule_id,
            date: a.date,
            time: a.time,
            participants: a.participants || [], // JSONB comes as object/array
            createdBy: a.created_by
        })) as Appointment[];
    },

    createAppointment: async (appointment: Appointment): Promise<{ data: Appointment | null, error: any }> => {
        console.log('API: Creating appointment with data:', appointment);
        const { data, error } = await supabase.from('appointments').insert({
            id: appointment.id,
            schedule_id: appointment.scheduleId,
            date: appointment.date,
            time: appointment.time,
            participants: appointment.participants,
            created_by: appointment.createdBy
        }).select().single();

        if (error) {
            console.error("API Error creating appointment:", error);
        }
        return { data, error };
    },

    deleteAppointment: async (id: string): Promise<void> => {
        await supabase.from('appointments').delete().eq('id', id);
    },

    // Announcements
    getAnnouncements: async (): Promise<Announcement[]> => {
        const { data, error } = await supabase.from('announcements').select('*');
        if (error) {
            console.error('Error fetching announcements:', error);
            return [];
        }
        return data.map((a: any) => ({
            ...a,
            date: a.date, // ISO string
            createdBy: a.created_by
        }));
    },

    createAnnouncement: async (ann: Announcement): Promise<Announcement | null> => {
        const { data, error } = await supabase.from('announcements').insert({
            id: ann.id,
            title: ann.title,
            content: ann.content,
            active: ann.active,
            date: ann.date,
            created_by: ann.createdBy
        }).select().single();

        if (error) {
            console.error('Error creating announcement:', error);
            return null;
        }
        return data;
    },

    updateAnnouncement: async (ann: Announcement): Promise<void> => {
        await supabase.from('announcements').update({
            title: ann.title,
            content: ann.content,
            active: ann.active,
            // date: ann.date // keep original date or update? Usually keep creation date.
        }).eq('id', ann.id);
    },

    deleteAnnouncement: async (id: string): Promise<void> => {
        await supabase.from('announcements').delete().eq('id', id);
    }
};
