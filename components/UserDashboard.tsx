
import React from 'react';
import { User, Schedule, Appointment, View } from '../types';

import { api } from '../api';
import { getScheduleTimeRange } from '../lib/utils';

interface UserDashboardProps {
  user: User;
  db: { users: User[], schedules: Schedule[], appointments: Appointment[], announcements?: any[] };
  updateDB?: (updater: (prev: any) => any) => void;
  refreshData: () => Promise<void>;
  onNavigate: (view: View) => void;
  onSelectSchedule: (schedule: Schedule) => void;
  onLogout: () => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, db, refreshData, onNavigate, onSelectSchedule, onLogout }) => {
  const now = new Date();
  const myAppointments = db.appointments.filter(app => {
    if (!app.participants.includes(user.id)) return false;

    // Create Date object for appointment (assuming local time)
    // Using T12:00:00 logic if time is missing, but here we have app.time
    const appDate = new Date(`${app.date}T${app.time}`);
    return appDate > now;
  });

  const [selectedAppointment, setSelectedAppointment] = React.useState<Appointment | null>(null);

  const handleCancel = async (appId: string) => {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      await api.deleteAppointment(appId);
      refreshData();
      setSelectedAppointment(null);
    }
  };

  const getParticipantName = (idOrObj: string | { manualName: string }) => {
    if (typeof idOrObj === 'string') {
      const u = db.users.find(u => u.id === idOrObj);
      return u ? u.name : 'Desconhecido';
    }
    return idOrObj.manualName;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="px-6 pt-12 pb-6 bg-white dark:bg-background-dark sticky top-0 z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-slate-500 font-medium">Bem-vindo,</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user.name.split(' ')[0]}</h1>
          </div>
          <button onClick={() => onNavigate('PROFILE')} className="relative">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border-2 border-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24 space-y-8">
        <section>

          {/* Announcements Section */}
          {db.announcements && db.announcements.filter(a => a.active).length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="material-icons-round text-primary">campaign</span>
                Mural de Avisos
              </h2>
              <div className="space-y-3">
                {db.announcements.filter(a => a.active).map(ann => (
                  <div key={ann.id} className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-900/50">
                    <h3 className="font-bold text-amber-900 dark:text-amber-100">{ann.title}</h3>
                    <p className="text-base text-amber-800 dark:text-amber-200/80 mt-1">{ann.content}</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300/60 mt-2">
                      {new Date(ann.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Meus Próximos Horários</h2>
            <span className="text-xs font-semibold text-primary">{myAppointments.length} agendados</span>
          </div>
          <div className="space-y-4">
            {myAppointments.length === 0 ? (
              <div className="bg-slate-50 dark:bg-slate-800 p-8 rounded-xl text-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                <span className="material-icons-round text-4xl text-slate-300 mb-2">event_busy</span>
                <p className="text-slate-500 text-sm">Você não tem agendamentos próximos.</p>
              </div>
            ) : (
              myAppointments.map(app => {
                const sch = db.schedules.find(s => s.id === app.scheduleId);
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedAppointment(app)}
                    className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 relative overflow-hidden group cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                    <div className="flex justify-between">
                      <h3 className="font-bold">{sch?.name}</h3>
                      <span className="text-xs font-bold text-green-500 uppercase tracking-wide">Confirmado</span>
                    </div>
                    <div className="mt-2 flex justify-between items-end">
                      <div>
                        <p className="text-lg font-bold">{new Date(app.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}</p>
                        <p className="text-slate-500 font-medium">{app.time}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                        <span className="material-icons-round text-sm">info</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold mb-4">Disponíveis para Agendar</h2>
          <div className="grid grid-cols-1 gap-4">
            {db.schedules.filter(s => s.active).map(sch => (
              <div
                key={sch.id}
                onClick={() => onSelectSchedule(sch)}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-4 transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-primary">
                  <span className="material-icons-round text-2xl">event_note</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg">{sch.name}</h3>
                  <p className="text-sm text-slate-500">{sch.category} • {getScheduleTimeRange(sch)}</p>
                </div>
                <span className="material-icons-round text-slate-300">chevron_right</span>
              </div>
            ))}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 w-full bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800 pb-8 pt-3 px-6 flex justify-around items-center z-20">
        <button onClick={() => onNavigate('DASHBOARD')} className="flex flex-col items-center gap-1 text-primary">
          <span className="material-icons-round">home</span>
          <span className="text-[10px] font-bold uppercase">Início</span>
        </button>
        <button onClick={() => onNavigate('PROFILE')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors">
          <span className="material-icons-round">person</span>
          <span className="text-[10px] font-bold uppercase">Perfil</span>
        </button>
      </nav>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelectedAppointment(null)}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full rounded-t-3xl p-6 shadow-2xl animate-fade-in-up">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>

            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Detalhes do Agendamento</h2>
                <p className="text-sm text-slate-500">
                  {db.schedules.find(s => s.id === selectedAppointment.scheduleId)?.name}
                </p>
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs font-bold uppercase">Confirmado</span>
            </div>

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
                        {getParticipantName(p).charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase">Publicador {index + 1}</p>
                        <p className="font-medium">{getParticipantName(p)}</p>
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
                <button
                  onClick={() => handleCancel(selectedAppointment.id)}
                  className="w-full py-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-500 font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-icons-round">cancel</span>
                  Cancelar Agendamento
                </button>
                <button
                  onClick={() => setSelectedAppointment(null)}
                  className="w-full py-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold transition-colors flex items-center justify-center gap-2 hover:bg-slate-200"
                >
                  Voltar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div >
  );
};

export default UserDashboard;
