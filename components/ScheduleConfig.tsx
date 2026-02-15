
import React, { useState } from 'react';
import { Schedule } from '../types';

import { api } from '../api';
import { getScheduleTimeRange } from '../lib/utils';

interface ScheduleConfigProps {
  db: { schedules: Schedule[] };
  updateDB?: (updater: (prev: any) => any) => void;
  refreshData: () => Promise<void>;
  onBack: () => void;
}

const weekDays = [
  { id: 0, label: 'Dom' },
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sab' },
];

const ScheduleConfig: React.FC<ScheduleConfigProps> = ({ db, refreshData, onBack }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchedule, setNewSchedule] = useState<Partial<Schedule>>({
    name: '',
    category: 'Display',
    startTime: '08:00',
    endTime: '20:00',
    slotDuration: 60,
    maxParticipantsPerSlot: 2,
    active: true,
    daysOfWeek: [1, 2, 3, 4, 5],
    observation: '',
    daysConfig: {}
  });

  const toggleScheduleActive = async (id: string) => {
    const s = db.schedules.find(s => s.id === id);
    if (!s) return;
    await api.updateSchedule({ ...s, active: !s.active });
    refreshData();
  };

  const deleteSchedule = async (id: string) => {
    if (confirm('Excluir esta agenda permanentemente?')) {
      await api.deleteSchedule(id);
      refreshData();
    }
  };

  const [editingId, setEditingId] = useState<string | null>(null);

  const startEdit = (schedule: Schedule) => {
    setNewSchedule({
      name: schedule.name,
      category: schedule.category,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      slotDuration: schedule.slotDuration,
      maxParticipantsPerSlot: schedule.maxParticipantsPerSlot,
      active: schedule.active,
      daysOfWeek: schedule.daysOfWeek,
      observation: schedule.observation || '',
      daysConfig: schedule.daysConfig || {}
    });
    setEditingId(schedule.id);
    setShowAddModal(true);
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setNewSchedule({
      name: '',
      category: 'Display',
      startTime: '08:00',
      endTime: '20:00',
      slotDuration: 60,
      maxParticipantsPerSlot: 2,
      active: true,
      daysOfWeek: [1, 2, 3, 4, 5],
      observation: '',
      daysConfig: {}
    });
  };

  const handleCreateOrUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    const generateId = () => {
      try {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        }
        // Fallback for insecure contexts (non-localhost IP access)
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

    const scheduleData: Schedule = {
      id: editingId || generateId(),
      name: newSchedule.name || 'Nova Agenda',
      category: newSchedule.category || 'Geral',
      startTime: newSchedule.startTime || '08:00',
      endTime: newSchedule.endTime || '18:00',
      slotDuration: Number(newSchedule.slotDuration) || 60,
      maxParticipantsPerSlot: Number(newSchedule.maxParticipantsPerSlot) || 2,
      active: newSchedule.active !== undefined ? newSchedule.active : true,
      daysOfWeek: newSchedule.daysOfWeek || [1, 2, 3, 4, 5],
      observation: newSchedule.observation || '',
      daysConfig: newSchedule.daysConfig || {}
    };

    console.log('UI: Attempting to save schedule:', scheduleData);

    try {
      if (editingId) {
        await api.updateSchedule(scheduleData);
      } else {
        const { data, error } = await api.createSchedule(scheduleData);
        if (error) {
          throw error;
        }
        if (!data) {
          throw new Error("Nenhum dado retornado pela API após inserção.");
        }
      }
      await refreshData();
      closeModal();
    } catch (error: any) {
      console.error("Erro detalhado ao salvar agenda:", error);
      alert(`Erro ao salvar agenda: ${error?.message || error?.details || 'Erro desconhecido'}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      <header className="px-4 pt-12 pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 flex items-center justify-between shadow-sm">
        <button onClick={onBack} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
          <span className="material-icons-round">arrow_back_ios_new</span>
        </button>
        <h1 className="text-2xl font-bold">Configurações de Agendas</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-24">
        <div className="flex justify-between items-center mb-2 px-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Agendas Disponíveis ({db.schedules.length})</h2>
        </div>

        <div className="space-y-4">
          {db.schedules.map(sch => (
            <div key={sch.id} className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary">
                    <span className="material-icons-round">event_note</span>
                  </div>
                  <div>
                    <h3 className="font-bold">{sch.name}</h3>
                    <p className="text-xs text-slate-500">{sch.category} • {getScheduleTimeRange(sch)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${sch.active ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {sch.active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Categoria</p>
                  <p className="font-bold text-sm">{sch.category}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Duração Slot</p>
                  <p className="font-bold text-sm">{sch.slotDuration} min</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Capacidade</p>
                  <p className="font-bold text-sm">{sch.maxParticipantsPerSlot} pessoas</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Status</p>
                  <p className="font-bold text-sm">{sch.active ? 'Funcionando' : 'Pausada'}</p>
                </div>
              </div>

              <div className="flex gap-2 border-t border-slate-100 dark:border-slate-700 pt-4">
                <button
                  onClick={() => startEdit(sch)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-bold transition-colors flex items-center justify-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  <span className="material-icons-round text-sm">edit</span>
                  Editar
                </button>
                <button
                  onClick={() => toggleScheduleActive(sch.id)}
                  className="flex-1 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-bold transition-colors"
                >
                  {sch.active ? 'Pausar' : 'Ativar'}
                </button>
                <button
                  onClick={() => deleteSchedule(sch.id)}
                  className="px-3 py-2 rounded-lg bg-rose-50 text-rose-500 text-xs font-bold transition-colors"
                >
                  <span className="material-icons-round text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <button
        onClick={() => { setEditingId(null); setShowAddModal(true); }}
        className="fixed bottom-6 right-6 px-6 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center gap-2 font-bold active:scale-95 transition-all z-20"
      >
        <span className="material-icons-round">add_circle</span>
        <span>Nova Agenda</span>
      </button>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full rounded-t-3xl p-6 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
            <h2 className="text-xl font-bold mb-6">{editingId ? 'Editar Agenda' : 'Configurar Nova Agenda'}</h2>
            <form onSubmit={handleCreateOrUpdateSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome da Agenda</label>
                <input required type="text" value={newSchedule.name} onChange={e => setNewSchedule({ ...newSchedule, name: e.target.value })} className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Duração Slot (min)</label>
                  <input required type="number" value={newSchedule.slotDuration} onChange={e => setNewSchedule({ ...newSchedule, slotDuration: parseInt(e.target.value) })} className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Máx. Participantes</label>
                  <input required type="number" value={newSchedule.maxParticipantsPerSlot} onChange={e => setNewSchedule({ ...newSchedule, maxParticipantsPerSlot: parseInt(e.target.value) })} className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoria</label>
                <select value={newSchedule.category} onChange={e => setNewSchedule({ ...newSchedule, category: e.target.value })} className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800">
                  <option value="Display">Display</option>
                  <option value="Carrinho">Carrinho</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Observações da Agenda</label>
                <textarea
                  rows={2}
                  value={newSchedule.observation || ''}
                  onChange={e => setNewSchedule({ ...newSchedule, observation: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                  placeholder="Ex: Trazer garrafa de água, Chegar 15min antes..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Dias e Horários de Funcionamento</label>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {weekDays.map(day => {
                    const isSelected = newSchedule.daysOfWeek?.includes(day.id);
                    const dayConfig = newSchedule.daysConfig?.[day.id] || { startTime: newSchedule.startTime || '08:00', endTime: newSchedule.endTime || '18:00' };

                    return (
                      <div key={day.id} className={`p-3 rounded-xl border transition-all ${isSelected ? 'bg-primary/5 border-primary/20' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-70'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`day-${day.id}`}
                              checked={isSelected}
                              onChange={(e) => {
                                const days = newSchedule.daysOfWeek || [];
                                if (e.target.checked) {
                                  setNewSchedule({ ...newSchedule, daysOfWeek: [...days, day.id] });
                                } else {
                                  setNewSchedule({ ...newSchedule, daysOfWeek: days.filter(d => d !== day.id) });
                                }
                              }}
                              className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                            />
                            <label htmlFor={`day-${day.id}`} className="text-sm font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                              {day.label}
                            </label>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="flex items-center gap-2 pl-6">
                            <div className="flex-1">
                              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Início</label>
                              <input
                                type="time"
                                value={dayConfig.startTime}
                                onChange={(e) => {
                                  const newConfig = { ...newSchedule.daysConfig, [day.id]: { ...dayConfig, startTime: e.target.value } };
                                  setNewSchedule({ ...newSchedule, daysConfig: newConfig });
                                }}
                                className="w-full px-2 py-1 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                              />
                            </div>
                            <span className="text-slate-400 pt-4">-</span>
                            <div className="flex-1">
                              <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">Fim</label>
                              <input
                                type="time"
                                value={dayConfig.endTime}
                                onChange={(e) => {
                                  const newConfig = { ...newSchedule.daysConfig, [day.id]: { ...dayConfig, endTime: e.target.value } };
                                  setNewSchedule({ ...newSchedule, daysConfig: newConfig });
                                }}
                                className="w-full px-2 py-1 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="w-full bg-primary text-white font-bold py-4 rounded-xl mt-4">{editingId ? 'Salvar Alterações' : 'Criar Agenda'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleConfig;
