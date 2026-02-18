
import React, { useState } from 'react';
import { User, Role } from '../types';

import { api } from '../api';

interface UserManagementProps {
  db: { users: User[] };
  updateDB?: (updater: (prev: any) => any) => void;
  refreshData: () => Promise<void>;
  onBack: () => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ db, refreshData, onBack }) => {
  const [showModal, setShowModal] = useState<'ADD' | 'EDIT' | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formState, setFormState] = useState({ name: '', username: '', password: '', role: 'USER' as Role });

  const resetForm = () => {
    setFormState({ name: '', username: '', password: '', role: 'USER' });
    setEditingUser(null);
    setShowModal(null);
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    if (!formState.password || formState.password.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    const newUser = {
      name: formState.name,
      username: formState.username,
      password: formState.password,
      role: formState.role
    };

    const created = await api.createUser(newUser);

    if (created) {
      alert("Usuário criado com sucesso!");
      refreshData();
      resetForm();
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const updatedUser: User = {
      ...editingUser,
      name: formState.name,
      username: formState.username,
      password: formState.password,
      role: formState.role
    };

    await api.updateUser(updatedUser);
    alert("Usuário atualizado com sucesso!");
    refreshData();
    resetForm();
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Deseja realmente excluir este usuário?')) {
      await api.deleteUser(id);
      refreshData();
    }
  };

  const startEdit = (user: User) => {
    setEditingUser(user);
    setFormState({
      name: user.name,
      username: user.username,
      password: user.password || '',
      role: user.role
    });
    setShowModal('EDIT');
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      <header className="px-4 pt-12 pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 flex items-center justify-between">
        <button onClick={onBack} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
          <span className="material-icons-round">arrow_back_ios_new</span>
        </button>
        <h1 className="text-2xl font-bold">Gestão de Publicadores</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        <div className="relative mb-6">
          <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          <input
            type="text"
            placeholder="Buscar por nome ou usuário..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border-none bg-white dark:bg-slate-800 shadow-sm focus:ring-2 focus:ring-primary text-sm"
          />
        </div>

        <div className="flex justify-between items-center mb-2 px-1">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Listagem ({db.users.length})</h2>
        </div>

        <div className="space-y-3">
          {[...db.users].sort((a, b) => a.name.localeCompare(b.name)).map(u => (
            <div key={u.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="font-bold text-xl">{u.name}</h3>
                  <span className={`inline-block mt-1 text-xs font-bold uppercase px-2 py-1 rounded ${u.role === 'ADMIN' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    {u.role}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(u)} className="text-slate-400 hover:text-primary p-2 transition-colors">
                  <span className="material-icons-round text-3xl">edit</span>
                </button>
                <button onClick={() => handleDeleteUser(u.id)} className="text-slate-400 hover:text-rose-500 p-2 transition-colors">
                  <span className="material-icons-round text-3xl">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <button
        onClick={() => { resetForm(); setShowModal('ADD'); }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg shadow-primary/40 flex items-center justify-center transition-transform active:scale-95 z-20"
      >
        <span className="material-icons-round text-2xl">person_add</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={resetForm}></div>
          <div className="relative bg-white dark:bg-slate-900 w-full rounded-t-3xl p-6 shadow-2xl animate-fade-in-up">
            <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
            <h2 className="text-xl font-bold mb-6">{showModal === 'ADD' ? 'Novo Usuário' : 'Editar Usuário'}</h2>
            <form onSubmit={showModal === 'ADD' ? handleAddUser : handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome Completo</label>
                <input required type="text" value={formState.name} onChange={e => setFormState({ ...formState, name: e.target.value })} className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Usuário</label>
                <input required type="text" value={formState.username} onChange={e => setFormState({ ...formState, username: e.target.value })} className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Senha {showModal === 'ADD' ? 'Provisória' : '(Deixe em branco para manter)'}</label>
                <input type="text" value={formState.password} onChange={e => setFormState({ ...formState, password: e.target.value })} className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800" />
              </div>
              <div className="flex items-center gap-4 py-2">
                <label className="text-sm font-medium">Permissão Administrativa?</label>
                <input type="checkbox" checked={formState.role === 'ADMIN'} onChange={e => setFormState({ ...formState, role: e.target.checked ? 'ADMIN' : 'USER' })} className="rounded text-primary focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <button type="button" onClick={resetForm} className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold py-4 rounded-xl hover:bg-slate-200 transition-all active:scale-[0.98]">
                  Voltar
                </button>
                <button type="submit" className="bg-primary text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98]">
                  {showModal === 'ADD' ? 'Criar Usuário' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
