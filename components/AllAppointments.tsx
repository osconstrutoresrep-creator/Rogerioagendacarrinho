
import React, { useState, useMemo } from 'react';
import { User, Schedule, Appointment } from '../types';
import { api } from '../api';

interface AllAppointmentsProps {
  db: { users: User[], schedules: Schedule[], appointments: Appointment[] };
  updateDB: (updater: (prev: any) => any) => void;
  refreshData: () => Promise<void>;
  onBack: () => void;
}

const AllAppointments: React.FC<AllAppointmentsProps> = ({ db, updateDB, refreshData, onBack }) => {

  const [searchTerm, setSearchTerm] = React.useState('');
  const [dateFilter, setDateFilter] = React.useState('');
  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');

  const handleDelete = async (id: string) => {
    if (confirm('Excluir este agendamento?')) {
      try {
        await api.deleteAppointment(id);
        await refreshData();
        setSelectedAppointment(null);
      } catch (error) {
        console.error("Error deleting appointment", error);
        alert("Erro ao excluir agendamento.");
      }
    }
  };

  const startEdit = () => {
    if (selectedAppointment) {
      setEditDate(selectedAppointment.date);
      setEditTime(selectedAppointment.time);
      setIsEditing(true);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    if (selectedAppointment) {
      setEditDate(selectedAppointment.date);
      setEditTime(selectedAppointment.time);
    }
  };

  const saveEdit = async () => {
    if (!selectedAppointment) return;

    try {
      const updatedApp: Appointment = {
        ...selectedAppointment,
        date: editDate,
        time: editTime
      };

      const { error } = await api.updateAppointment(updatedApp);
      if (error) throw error;

      await refreshData();
      setIsEditing(false);
      setSelectedAppointment(updatedApp); // Update local view
      alert("Agendamento atualizado com sucesso!");
    } catch (error: any) {
      console.error("Error updating appointment", error);
      alert(`Erro ao atualizar agendamento: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const getUserName = (idOrManual: string | { manualName: string }) => {
    if (typeof idOrManual === 'string') {
      return db.users.find(u => u.id === idOrManual)?.name || 'Usuário Removido';
    }
    return idOrManual.manualName;
  };

  const formatDateBR = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const filteredAppointments = db.appointments.filter(app => {
    const matchesDate = dateFilter ? app.date === dateFilter : true;
    const participantNames = app.participants.map(p => getUserName(p).toLowerCase());
    const matchesName = searchTerm ? participantNames.some(name => name.includes(searchTerm.toLowerCase())) : true;
    return matchesDate && matchesName;
  });

  const now = new Date();
  const upcoming = filteredAppointments
    .filter(app => new Date(`${app.date}T${app.time}`) > now)
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());

  const past = filteredAppointments
    .filter(app => new Date(`${app.date}T${app.time}`) <= now)
    .sort((a, b) => new Date(`${b.date}T${b.time}`).getTime() - new Date(`${a.date}T${a.time}`).getTime());

  // Logic to calculate available time slots for editing
  const availableSlots = useMemo(() => {
    if (!selectedAppointment || !editDate) return [];

    const schedule = db.schedules.find(s => s.id === selectedAppointment.scheduleId);
    if (!schedule) return [];

    const slots = [];
    const dateObj = new Date(editDate + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();

    const dayConfig = schedule.daysConfig?.[dayOfWeek];
    const startTimeResult = dayConfig?.startTime || schedule.startTime;
    const endTimeResult = dayConfig?.endTime || schedule.endTime;

    if (!schedule.daysOfWeek.includes(dayOfWeek)) return [];

    let current = new Date(`2023-01-01T${startTimeResult}`);
    const end = new Date(`2023-01-01T${endTimeResult}`);
    const nowLocal = new Date();

    while (current < end) {
      const timeStr = current.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      // Check if slot is in the past (only for today)
      let isSlotPast = false;
      if (editDate === nowLocal.toISOString().split('T')[0]) {
        const slotTimeCount = current.getHours() * 60 + current.getMinutes();
        const currentTimeCount = nowLocal.getHours() * 60 + nowLocal.getMinutes();
        if (slotTimeCount <= currentTimeCount) {
          isSlotPast = true;
        }
      }

      if (!isSlotPast) {
        // Count participants excluding the ONLY current appointment if it is the same slot
        // Actually we just want to know if there's space.
        // If we keep the same time, it's valid.
        const apps = db.appointments.filter(a =>
          a.scheduleId === schedule.id &&
          a.date === editDate &&
          a.time === timeStr &&
          a.id !== selectedAppointment.id // Exclude self from count
        );

        let totalParticipants = 0;
        apps.forEach(a => {
          totalParticipants += a.participants.length;
        });

        // If current appointment is moving here, check if there's enough space for its participants
        const myParticipantsCount = selectedAppointment.participants.length;
        const remainingSlots = Math.max(0, schedule.maxParticipantsPerSlot - totalParticipants);

        if (remainingSlots >= myParticipantsCount) {
          slots.push(timeStr);
        }
      }
      current.setMinutes(current.getMinutes() + schedule.slotDuration);
    }
    return slots;

  }, [selectedAppointment, editDate, db.appointments, db.schedules]);


  const renderAppointmentCard = (app: Appointment) => {
    const sch = db.schedules.find(s => s.id === app.scheduleId);

    const isPast = new Date(`${app.date}T${app.time}`) <= new Date();

    return (
      <div key={app.id} className={`rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:shadow-md ${isPast ? 'bg-slate-50 dark:bg-slate-800/50 opacity-75' : 'bg-white dark:bg-slate-800'}`}>
        <div onClick={() => { setSelectedAppointment(app); setIsEditing(false); }} className="cursor-pointer">
          <div className="flex justify-between items-start mb-3">
            <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded text-xs font-bold uppercase">
              {sch?.name || 'Agenda Removida'}
            </span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {formatDateBR(app.date)}
            </span>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex flex-col items-center justify-center border border-slate-100 dark:border-slate-700">
              <span className="text-[8px] font-bold text-slate-400 uppercase">Início</span>
              <span className="text-lg font-bold">{app.time}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-sm">Participantes:</h3>
              <div className="flex flex-col gap-1 mt-1">
                {app.participants.map((p, idx) => (
                  <p key={idx} className="text-sm text-slate-500 font-medium flex items-center gap-1">
                    <span className="material-icons-round text-xs">person</span>
                    {getUserName(p)}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-3 border-t border-slate-50 dark:border-slate-700">
          <button
            onClick={() => { setSelectedAppointment(app); startEdit(); }}
            className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-sm font-bold uppercase transition-colors hover:bg-slate-200 dark:hover:bg-slate-600"
          >
            Editar
          </button>
          <button
            onClick={() => handleDelete(app.id)}
            className="flex-1 py-2 rounded-lg bg-rose-50 text-rose-500 text-sm font-bold uppercase transition-colors hover:bg-rose-100"
          >
            Excluir
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      <header className="px-4 pt-12 pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
            <span className="material-icons-round">arrow_back_ios_new</span>
          </button>
          <h1 className="text-2xl font-bold">Todos Agendamentos</h1>
          <div className="w-10"></div>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border-none bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-primary text-sm"
            />
          </div>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-40 px-3 py-3 rounded-xl border-none bg-slate-100 dark:bg-slate-800 focus:ring-2 focus:ring-primary text-sm"
          />
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredAppointments.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <span className="material-icons-round text-5xl mb-4">event_busy</span>
            <p>Nenhum agendamento encontrado.</p>
          </div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Próximos Agendamentos ({upcoming.length})</h2>
                {upcoming.map(renderAppointmentCard)}
              </div>
            )}

            {past.length > 0 && (
              <div className="space-y-4 mt-8">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Agendamentos Realizados ({past.length})</h2>
                <div className="opacity-75">
                  {past.map(renderAppointmentCard)}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedAppointment(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full rounded-t-3xl p-6 shadow-2xl animate-fade-in-up">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>

            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{isEditing ? 'Editar Agendamento' : 'Detalhes do Agendamento'}</h2>
                <p className="text-sm text-slate-500">
                  {db.schedules.find(s => s.id === selectedAppointment.scheduleId)?.name}
                </p>
              </div>
              {!isEditing && (
                <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold uppercase">Confirmado</span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-2">Data</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Horário</label>
                  {availableSlots.length > 0 ? (
                    <select
                      value={editTime}
                      onChange={(e) => setEditTime(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-primary"
                    >
                      {/* Ensure current time is selected even if fully booked (though logic handles this) */}
                      {!availableSlots.includes(editTime) && (
                        <option value={editTime}>{editTime} (Atual)</option>
                      )}
                      {availableSlots.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-rose-500 font-bold text-sm">Nenhum horário disponível para esta data.</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={saveEdit}
                    disabled={availableSlots.length === 0 && editTime !== selectedAppointment.time}
                    className="flex-1 bg-primary text-white font-bold py-4 rounded-xl disabled:opacity-50"
                  >
                    Salvar Alterações
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold py-4 rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Data</p>
                    <p className="font-bold">{new Date(selectedAppointment.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</p>
                  </div>
                  <div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Horário</p>
                    <p className="font-bold">{selectedAppointment.time}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <span className="material-icons-round text-primary">people</span>
                    Participantes
                  </h3>
                  <div className="space-y-2">
                    {selectedAppointment.participants.map((p, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {getUserName(p).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase">Publicador {index + 1}</p>
                          <p className="font-medium">{getUserName(p)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {db.schedules.find(s => s.id === selectedAppointment.scheduleId)?.observation && (
                  <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20">
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-100 mb-1 flex items-center gap-2">
                      <span className="material-icons-round text-sm">info</span>
                      Observações da Agenda
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200/80">
                      {db.schedules.find(s => s.id === selectedAppointment.scheduleId)?.observation}
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <div className="flex gap-3">
                    <button
                      onClick={startEdit}
                      className="flex-1 py-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold transition-colors flex items-center justify-center gap-2 hover:bg-slate-200"
                    >
                      <span className="material-icons-round">edit</span>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(selectedAppointment.id)}
                      className="flex-1 py-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 font-bold transition-colors flex items-center justify-center gap-2"
                    >
                      <span className="material-icons-round">delete</span>
                      Excluir
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedAppointment(null)}
                    className="w-full py-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold transition-colors flex items-center justify-center gap-2 hover:bg-slate-200"
                  >
                    Voltar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAppointments;
