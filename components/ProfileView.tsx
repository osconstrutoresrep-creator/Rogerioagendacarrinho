
import React, { useState } from 'react';
import { User } from '../types';

interface ProfileViewProps {
  user: User;
  updateDB: (updater: (prev: any) => any) => void;
  onBack: () => void;
  onLogout: () => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, updateDB, onBack, onLogout }) => {
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState(user.password || '');
  const [message, setMessage] = useState('');

  const handleSave = () => {
    updateDB(prev => ({
      ...prev,
      users: prev.users.map((u: User) => u.id === user.id ? { ...u, name, password } : u)
    }));
    setMessage('Perfil atualizado com sucesso!');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-background-light dark:bg-background-dark">
      <header className="px-4 pt-12 pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10 flex items-center justify-between">
        <button onClick={onBack} className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors">
          <span className="material-icons-round">arrow_back_ios_new</span>
        </button>
        <h1 className="text-lg font-bold">Meu Perfil</h1>
        <button onClick={onLogout} className="text-sm font-bold text-rose-500">Sair</button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8">
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl border-4 border-white shadow-xl">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold mt-4">{user.name}</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{user.role}</p>
        </div>

        <div className="space-y-6">
          <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Dados Pessoais</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-primary"
              />
            </div>
            <div className="opacity-60">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail (Inalterável)</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-xl border-slate-200 bg-slate-50 dark:bg-slate-900/50"
              />
            </div>
          </section>

          <section className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Segurança</h3>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nova Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-xl border-slate-200 dark:border-slate-700 dark:bg-slate-900 focus:ring-primary"
              />
            </div>
          </section>
        </div>

        {message && (
          <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl text-center font-bold animate-fade-in">
            {message}
          </div>
        )}
      </main>

      <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={handleSave}
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-95"
        >
          Salvar Alterações
        </button>
      </div>
    </div>
  );
};

export default ProfileView;
