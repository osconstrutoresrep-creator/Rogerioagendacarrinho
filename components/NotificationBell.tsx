
import React, { useState, useEffect, useMemo } from 'react';
import { User, Appointment, Schedule } from '../types';

interface NotificationBellProps {
    user: User;
    appointments: Appointment[];
    schedules: Schedule[];
    onSelectAppointment: (app: Appointment) => void;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ user, appointments, schedules, onSelectAppointment }) => {
    const [showNotification, setShowNotification] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [relevantApp, setRelevantApp] = useState<Appointment | null>(null);

    const tomorrowApp = useMemo(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        return appointments.find(app => {
            // Must be a participant
            const isParticipant = app.participants.some(p =>
                typeof p === 'string' ? p === user.id : false
            );

            if (!isParticipant) return false;

            // Must be tomorrow
            return app.date === tomorrowStr;
        });
    }, [appointments, user.id]);

    // Check if there is even an active appointment for the user that is yet to happen
    // to decide if the bell should be visible at all, but the prompt says 
    // "ao ter um agendamento ter um sininho que fica piscando... que ao clicar mostre uma mensagem que diz não esqueça do seu agendamento amanhã"
    // Actually, the prompt says "a ter um agendamento ter um sininho que fica piscando que ao clicar mostre uma mensagem que diz não esqueça do seu agendamento amanhã e ao clicar va para o agendamento"
    // It implies the message is always about "tomorrow".
    // And "que a mesagem no sininho acabe quando passar o data e a hora".

    const activeAppForBell = useMemo(() => {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().split('T')[0];

        // Find the NEXT appointment for tomorrow specifically to blink
        // But also need to hide if it passed.
        const app = appointments.find(app => {
            const isParticipant = app.participants.some(p =>
                typeof p === 'string' ? p === user.id : false
            );
            if (!isParticipant) return false;

            const appDateTime = new Date(`${app.date}T${app.time}`);
            if (appDateTime < now) return false; // Already passed

            return app.date === tomorrowStr;
        });

        return app;
    }, [appointments, user.id]);

    const handleBellClick = () => {
        if (activeAppForBell) {
            setMessage("Não esqueça do seu agendamento amanhã!");
            setRelevantApp(activeAppForBell);
            setShowNotification(true);
        }
    };

    if (!activeAppForBell) return null;

    return (
        <div className="relative">
            <button
                onClick={handleBellClick}
                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 relative group transition-all"
            >
                <span className={`material-icons-round text-2xl ${activeAppForBell ? 'animate-bounce text-amber-500' : 'text-slate-400'}`}>
                    notifications_active
                </span>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                </span>
            </button>

            {showNotification && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xs rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                                <span className="material-icons-round text-3xl">event_upcoming</span>
                            </div>
                            <h3 className="text-lg font-bold mb-2">Lembrete de Agendamento</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                                {message}
                            </p>
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={() => {
                                        setShowNotification(false);
                                        if (relevantApp) onSelectAppointment(relevantApp);
                                    }}
                                    className="w-full bg-primary text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95"
                                >
                                    Ver Agendamento
                                </button>
                                <button
                                    onClick={() => setShowNotification(false)}
                                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold py-3 rounded-xl transition-all active:scale-95"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0) rotate(0); }
          50% { transform: translateY(-3px) rotate(10deg); }
        }
        .animate-bounce {
          animation: bounce-slow 1s infinite;
        }
      `}} />
        </div>
    );
};

export default NotificationBell;
