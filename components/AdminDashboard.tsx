
import React, { useState } from 'react';
import { User, Schedule, Appointment, View } from '../types';

import { api } from '../api';
import { getScheduleTimeRange } from '../lib/utils';

interface AdminDashboardProps {
  user: User;
  db: { users: User[], schedules: Schedule[], appointments: Appointment[], announcements?: any[] };
  updateDB?: any;
  refreshData: () => Promise<void>;
  onNavigate: (view: View) => void;
  onSelectSchedule: (schedule: Schedule) => void;
  onLogout: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, db, refreshData, onNavigate, onSelectSchedule, onLogout }) => {
  // Announcement State
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<string | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '', active: true });

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();

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

    const annData = {
      id: editingAnnouncementId || generateId(),
      title: newAnnouncement.title,
      content: newAnnouncement.content,
      active: newAnnouncement.active,
      date: new Date().toISOString(),
      createdBy: user.id
    };

    try {
      if (editingAnnouncementId) {
        await api.updateAnnouncement(annData as any);
      } else {
        const result = await api.createAnnouncement(annData as any);
        if (!result) throw new Error("Erro da API");
      }
      await refreshData();
      setShowAnnouncementModal(false);
      setEditingAnnouncementId(null);
      setNewAnnouncement({ title: '', content: '', active: true });
    } catch (error) {
      console.error("Erro ao salvar aviso:", error);
      alert("Erro ao salvar aviso. Tente novamente.");
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (confirm('Excluir este aviso?')) {
      await api.deleteAnnouncement(id);
      refreshData();
    }
  };
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="px-6 pt-12 pb-6 bg-white dark:bg-background-dark sticky top-0 z-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-slate-500 font-medium">Bom dia, {user.name.split(' ')[0]}</p>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Painel de Gestão</h1>
          </div>
          <button onClick={() => onNavigate('PROFILE')} className="relative">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg border-2 border-primary">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-background-dark"></span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 pb-24 space-y-8">
        <section>
          <div className="flex justify-between items-end mb-4">
            <h2 className="text-lg font-bold">Resumo do Dia</h2>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">Hoje, {today}</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-primary p-4 rounded-xl shadow-lg shadow-primary/20 text-white flex items-center justify-between">
              <div>
                <span className="material-icons-round mb-2 block">event_available</span>
                <div className="text-[10px] font-medium opacity-80 uppercase tracking-wide">Agendamentos Totais</div>
              </div>
              <div className="text-4xl font-bold">{db.appointments.length}</div>
            </div>
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Mural de Avisos</h2>
            <button
              onClick={() => {
                setEditingAnnouncementId(null);
                setNewAnnouncement({ title: '', content: '', active: true });
                setShowAnnouncementModal(true);
              }}
              className="text-sm font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
            >
              + Novo Aviso
            </button>
          </div>

          <div className="space-y-3">
            {(!db.announcements || db.announcements.length === 0) ? (
              <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-slate-400 text-sm">Nenhum aviso publicado.</p>
              </div>
            ) : (
              db.announcements.map(ann => (
                <div key={ann.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">{ann.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${ann.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {ann.active ? 'Ativo' : 'Inativo'}
                      </span>
                      <button
                        onClick={() => {
                          setEditingAnnouncementId(ann.id);
                          setNewAnnouncement({ title: ann.title, content: ann.content, active: ann.active });
                          setShowAnnouncementModal(true);
                        }}
                        className="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400"
                      >
                        <span className="material-icons-round text-sm">edit</span>
                      </button>
                      <button
                        onClick={() => deleteAnnouncement(ann.id)}
                        className="w-6 h-6 rounded-full hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-500"
                      >
                        <span className="material-icons-round text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">{ann.content}</p>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">
                    {new Date(ann.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Agendas Ativas</h2>
            <button className="text-sm font-semibold text-primary">Ver todas</button>
          </div>
          <div className="space-y-4">
            {db.schedules.map(sch => (
              <div
                key={sch.id}
                onClick={() => onSelectSchedule(sch)}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all active:scale-[0.98] cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-primary">
                      <span className="material-icons-round text-2xl">event_note</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">{sch.name}</h3>
                      <p className="text-xs text-slate-500">{sch.category} • {getScheduleTimeRange(sch)}</p>
                    </div>
                  </div>
                  <button className="text-slate-400"><span className="material-icons-round">more_vert</span></button>
                </div>
                <div className="mt-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${sch.active ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {sch.active ? 'Ativo' : 'Pausado'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <nav className="fixed bottom-0 w-full bg-white dark:bg-background-dark border-t border-slate-100 dark:border-slate-800 pb-8 pt-3 px-6 flex justify-between items-center z-20">
        <button onClick={() => onNavigate('DASHBOARD')} className="flex flex-col items-center gap-1 text-primary">
          <span className="material-icons-round">dashboard</span>
          <span className="text-[10px] font-bold uppercase">Painel</span>
        </button>
        <button onClick={() => onNavigate('ALL_APPOINTMENTS')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors">
          <span className="material-icons-round">calendar_today</span>
          <span className="text-[10px] font-bold uppercase">Agenda</span>
        </button>
        <button onClick={() => onNavigate('USER_MANAGEMENT')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors">
          <span className="material-icons-round">people</span>
          <span className="text-[10px] font-bold uppercase">Usuários</span>
        </button>
        <button onClick={() => onNavigate('SCHEDULE_CONFIG')} className="flex flex-col items-center gap-1 text-slate-400 hover:text-primary transition-colors">
          <span className="material-icons-round">settings</span>
          <span className="text-[10px] font-bold uppercase">Ajustes</span>
        </button>
      </nav>

      <button
        onClick={() => onNavigate('SCHEDULE_CONFIG')}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary rounded-full shadow-lg shadow-primary/40 text-white flex items-center justify-center active:scale-95 transition-all"
      >
        <span className="material-icons-round text-2xl">add</span>
      </button>
      {/* Announcement Modal */}
      {showAnnouncementModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-lg">{editingAnnouncementId ? 'Editar Aviso' : 'Novo Aviso'}</h3>
              <button
                onClick={() => setShowAnnouncementModal(false)}
                className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors"
              >
                <span className="material-icons-round text-sm">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={newAnnouncement.title}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                  placeholder="Ex: Manutenção no sistema"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Conteúdo</label>
                <textarea
                  required
                  rows={4}
                  value={newAnnouncement.content}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                  placeholder="Digite a mensagem..."
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="announcementActive"
                  checked={newAnnouncement.active}
                  onChange={e => setNewAnnouncement({ ...newAnnouncement, active: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                />
                <label htmlFor="announcementActive" className="text-sm font-medium text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                  Aviso ativo (visível para todos)
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98]"
                >
                  {editingAnnouncementId ? 'Salvar Alterações' : 'Publicar Aviso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
