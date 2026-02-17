
import React, { useState, useMemo } from 'react';
import { User, Schedule, Appointment } from '../types';
import TutorialOverlay, { TutorialStep } from './TutorialOverlay';

import { api } from '../api';
import { getScheduleTimeRange } from '../lib/utils';

interface BookingFlowProps {
  user: User;
  schedule: Schedule;
  db: { users: User[], appointments: Appointment[] };
  updateDB?: (updater: (prev: any) => any) => void;
  refreshData: () => Promise<void>;
  onBack: () => void;
}

const BookingFlow: React.FC<BookingFlowProps> = ({ user, schedule, db, refreshData, onBack }) => {
  const isAdmin = user.role === 'ADMIN';

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [schedule.id]);

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const tutorialSteps: TutorialStep[] = [
    {
      targetId: 'booking-flow-title',
      title: 'Agendar',
      content: 'Área de agendamento. Escolha o dia no calendário e selecione um dos horários disponíveis para reservar.'
    }
  ];

  // Participant State
  const [primaryUserId, setPrimaryUserId] = useState<string>(user.id);
  const [primarySearch, setPrimarySearch] = useState(user.name);
  const [showPrimaryResults, setShowPrimaryResults] = useState(false);

  const [withPartner, setWithPartner] = useState(true);
  const [partnerId, setPartnerId] = useState<string>('');
  const [manualPartnerName, setManualPartnerName] = useState('');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [showPartnerResults, setShowPartnerResults] = useState(false);

  const dates = useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      list.push({
        full: d.toISOString().split('T')[0],
        day: d.getDate(),
        weekday: d.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase().replace('.', '')
      });
    }
    return list;
  }, []);

  const timeSlots = useMemo(() => {
    const slots = [];
    const dateObj = new Date(selectedDate + 'T12:00:00');
    const dayOfWeek = dateObj.getDay(); // 0-6

    // Check for specific daily config or fall back to global
    const dayConfig = schedule.daysConfig?.[dayOfWeek];
    const startTimeResult = dayConfig?.startTime || schedule.startTime;
    const endTimeResult = dayConfig?.endTime || schedule.endTime;

    let current = new Date(`2023-01-01T${startTimeResult}`);
    const end = new Date(`2023-01-01T${endTimeResult}`);

    // If start time is after end time (e.g. crossing midnight or invalid), don't generate slots
    // Also if the day is not in daysOfWeek (though UI shouldn't allow selecting it, good to be safe)
    // If start time is after end time (e.g. crossing midnight or invalid), don't generate slots
    // Also if the day is not in daysOfWeek (though UI shouldn't allow selecting it, good to be safe)
    if (!schedule.daysOfWeek.includes(dayOfWeek)) return [];

    const now = new Date();

    while (current < end) {
      const timeStr = current.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // Check if slot is in the past (only for today)
      let isSlotPast = false;
      if (selectedDate === now.toISOString().split('T')[0]) {
        const slotTimeCount = current.getHours() * 60 + current.getMinutes();
        const currentTimeCount = now.getHours() * 60 + now.getMinutes();
        if (slotTimeCount <= currentTimeCount) {
          isSlotPast = true;
        }
      }

      if (!isSlotPast) {
        const apps = db.appointments.filter(a => a.scheduleId === schedule.id && a.date === selectedDate && a.time === timeStr);

        let totalParticipants = 0;
        apps.forEach(a => {
          totalParticipants += a.participants.length;
        });

        slots.push({
          time: timeStr,
          availableSlots: Math.max(0, schedule.maxParticipantsPerSlot - totalParticipants)
        });
      }
      current.setMinutes(current.getMinutes() + schedule.slotDuration);
    }


    return slots;
  }, [schedule, selectedDate, db.appointments]);

  const filterUsers = (query: string) => {
    if (!query) return [];
    return db.users
      .filter(u => u.name.toLowerCase().startsWith(query.toLowerCase()))
      .slice(0, 5);
  };

  const handleBooking = async () => {
    if (!selectedTime) return;

    const participants: (string | { manualName: string })[] = [primaryUserId];

    if (withPartner) {
      if (!partnerId && !manualPartnerName) {
        alert('Por favor, selecione ou informe o nome do Publicador 2.');
        return;
      }
      if (partnerId) participants.push(partnerId);
      else if (manualPartnerName) participants.push({ manualName: manualPartnerName });
    }

    const generateId = () => {
      try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      } catch (e) {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
    };

    const newApp: Appointment = {
      id: generateId(),
      scheduleId: schedule.id,
      date: selectedDate,
      time: selectedTime,
      participants,
      createdBy: user.id
    };

    console.log('UI: Attempting to book appointment:', newApp);

    try {
      const { data, error } = await api.createAppointment(newApp);
      if (error) throw error;
      if (!data) throw new Error("Nenhum dado retornado pela API");

      await refreshData();
      alert(`Agendamento realizado com sucesso! ${withPartner && participants.length > 1 ? 'O outro participante será notificado no painel.' : ''}`);
      onBack();
    } catch (error: any) {
      console.error("Erro detalhado ao agendar:", error);
      alert(`Erro ao realizar agendamento: ${error?.message || error?.details || 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      <header className="px-5 pt-12 pb-4 flex items-center justify-between sticky top-0 z-20 bg-white dark:bg-background-dark border-b border-slate-100 dark:border-slate-800">
        <button onClick={onBack} className="p-2 text-primary rounded-full hover:bg-primary/10 transition-colors">
          <span className="material-icons-round">arrow_back_ios_new</span>
        </button>
        <div id="booking-flow-title" className="text-center">
          <h1 className="text-2xl font-bold">{schedule.name}</h1>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{schedule.category} • {getScheduleTimeRange(schedule)}</p>
        </div>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto pb-48">
        <section id="booking-calendar" className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 py-6">
          {/* Calendar View */}
          <div className="px-5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const d = new Date(selectedDate + 'T12:00:00');
                    d.setMonth(d.getMonth() - 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                    setSelectedTime(null);
                  }}
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="material-icons-round">chevron_left</span>
                </button>
                <button
                  onClick={() => {
                    const d = new Date(selectedDate + 'T12:00:00');
                    d.setMonth(d.getMonth() + 1);
                    setSelectedDate(d.toISOString().split('T')[0]);
                    setSelectedTime(null);
                  }}
                  className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="material-icons-round">chevron_right</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
                <div key={day} className="text-center text-[10px] font-bold text-slate-400 uppercase py-2">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {(() => {
                const date = new Date(selectedDate + 'T12:00:00');
                const year = date.getFullYear();
                const month = date.getMonth();
                const firstDayOfMonth = new Date(year, month, 1).getDay();
                const daysInMonth = new Date(year, month + 1, 0).getDate();
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                const calendarDays = [];
                // Add empty slots for the first week
                for (let i = 0; i < firstDayOfMonth; i++) {
                  calendarDays.push(<div key={`empty-${i}`} className="h-12" />);
                }

                // Add real days
                for (let day = 1; day <= daysInMonth; day++) {
                  const dayDate = new Date(year, month, day);
                  const dateStr = dayDate.toISOString().split('T')[0];
                  const isToday = dayDate.getTime() === today.getTime();
                  const isPast = dayDate.getTime() < today.getTime();
                  const isSelected = selectedDate === dateStr;
                  const isAvailable = schedule.daysOfWeek.includes(dayDate.getDay());

                  calendarDays.push(
                    <button
                      key={day}
                      disabled={isPast || !isAvailable}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setSelectedTime(null);
                      }}
                      className={`h-12 w-full rounded-xl flex flex-col items-center justify-center transition-all relative ${isSelected
                        ? 'bg-primary text-white shadow-md shadow-primary/30 z-10'
                        : isPast || !isAvailable
                          ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      <span className="text-sm font-bold">{day}</span>
                      {isToday && !isSelected && (
                        <div className="absolute bottom-1.5 w-1 h-1 bg-primary rounded-full"></div>
                      )}
                    </button>
                  );
                }
                return calendarDays;
              })()}
            </div>
          </div>
        </section>

        <section id="booking-slots" className="px-5 py-6">
          <h3 className="flex items-center gap-2 font-bold mb-4 text-slate-700 dark:text-slate-300">
            <span className="material-icons-round text-primary">schedule</span>
            Horários Disponíveis
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {timeSlots.map(slot => (
              <button
                key={slot.time}
                disabled={slot.availableSlots <= 0}
                onClick={() => setSelectedTime(slot.time)}
                className={`p-3 rounded-xl border flex flex-col items-center transition-all ${selectedTime === slot.time
                  ? 'bg-primary border-primary text-white ring-2 ring-primary ring-offset-2 dark:ring-offset-background-dark'
                  : slot.availableSlots <= 0
                    ? 'bg-slate-100 dark:bg-slate-800/50 border-transparent text-slate-300 cursor-not-allowed opacity-50'
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-primary'
                  }`}
              >
                <span className="text-lg font-bold">{slot.time}</span>
                {slot.availableSlots <= 0 && (
                  <span className="text-[8px] font-bold uppercase tracking-tighter opacity-70 mt-1 leading-tight text-center">
                    Agendado por outro publicador
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      </main>

      {selectedTime && (
        <div id="booking-action" className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] p-6 z-30 animate-fade-in-up">
          <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>

          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-sm text-slate-500 font-bold uppercase tracking-wide">Data e Horário</p>
              <h4 className="text-3xl font-bold">{selectedTime} <span className="text-lg font-medium text-slate-400">em {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span></h4>
            </div>
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center">
              <span className="material-icons-round text-2xl">check_circle</span>
            </div>
          </div>

          <div className="space-y-6 mb-8">
            {/* Primary Participant Selection - Only for Admins */}
            {isAdmin && (
              <div className="relative">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-2 block">Publicador 1</label>
                <div className="relative">
                  <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person</span>
                  <input
                    type="text"
                    placeholder="Quem irá participar?"
                    value={primarySearch}
                    onChange={(e) => {
                      setPrimarySearch(e.target.value);
                      setShowPrimaryResults(true);
                    }}
                    onFocus={() => setShowPrimaryResults(true)}
                    className="w-full pl-12 pr-4 py-4 text-lg rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-800"
                  />
                  {showPrimaryResults && primarySearch.length > 0 && (
                    <div className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-2xl max-h-60 overflow-y-auto z-40 border border-slate-100">
                      {filterUsers(primarySearch).map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setPrimaryUserId(u.id);
                            setPrimarySearch(u.name);
                            setShowPrimaryResults(false);
                          }}
                          className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-left border-b last:border-0 border-slate-50 dark:border-slate-700"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-base font-bold">{u.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {withPartner && (
              <div className="relative">
                <label className="text-xs font-bold text-slate-400 uppercase ml-1 mb-2 block">Publicador 2</label>
                <div className="relative">
                  <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">person_add</span>
                  <input
                    type="text"
                    placeholder="Parceiro ou nome manual..."
                    value={partnerSearch}
                    onChange={(e) => {
                      setPartnerSearch(e.target.value);
                      setManualPartnerName(e.target.value);
                      setPartnerId('');
                      setShowPartnerResults(true);
                    }}
                    className="w-full pl-12 pr-4 py-4 text-lg rounded-2xl border-slate-200 dark:border-slate-700 dark:bg-slate-800"
                  />
                  {showPartnerResults && partnerSearch.length > 0 && (
                    <div className="absolute bottom-full mb-2 left-0 right-0 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-2xl max-h-60 overflow-y-auto z-40">
                      {filterUsers(partnerSearch).filter(u => u.id !== primaryUserId).map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setPartnerId(u.id);
                            setPartnerSearch(u.name);
                            setManualPartnerName('');
                            setShowPartnerResults(false);
                          }}
                          className="w-full px-6 py-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700 text-left border-b last:border-0 border-slate-50 dark:border-slate-700"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="text-base font-bold">{u.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleBooking}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-5 rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-xl"
            >
              Confirmar Reserva
              <span className="material-icons-round text-2xl">arrow_forward</span>
            </button>
            <button
              onClick={() => setSelectedTime(null)}
              className="w-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] text-lg hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
      <TutorialOverlay pageKey="booking_flow" steps={tutorialSteps} />
    </div>
  );
};

export default BookingFlow;
