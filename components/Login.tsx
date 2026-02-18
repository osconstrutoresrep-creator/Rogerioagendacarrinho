
import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../api';

interface LoginProps {
  onLogin: (user: User) => void;
  db?: { users: User[] };
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { user, error } = await api.signIn(username, password);

    if (error) {
      setError('Usuário ou senha incorretos.');
      return;
    }

    if (user) {
      onLogin(user);
    }
  };

  return (
    <div className="flex flex-col h-full justify-center px-8 py-12">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-primary rounded-3xl mx-auto flex items-center justify-center text-white mb-6 shadow-lg shadow-primary/20">
          <span className="material-icons-round text-5xl">event</span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Agenda de Carrinho e Display</h1>
      </div>

      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Usuário</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Seu usuário"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            placeholder="Sua senha"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 transition-all active:scale-[0.98]"
        >
          Entrar
        </button>
      </form>

      <div className="mt-12 text-center text-xs text-slate-400">
        Acesso restrito para publicadores cadastrados.
      </div>
    </div>
  );
};

export default Login;
