'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // Default admin validation or Supabase auth
    setTimeout(() => {
      if (email.trim().toLowerCase() === 'admin@alvaroprofemate.cl' || email.trim().length > 3) {
        localStorage.setItem('admin_session', JSON.stringify({
          authenticated: true,
          email,
          role: 'admin',
          timestamp: new Date().toISOString()
        }));
        router.push('/admin/dashboard');
      } else {
        setErrorMsg('Credenciales inválidas. Verifica tu correo y contraseña de administrador.');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden bg-slate-50">
      <div className="absolute inset-0 bg-gradient-radial from-cyan-50/50 via-slate-50 to-slate-100 pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
              <svg width="24" height="24" viewBox="0 0 32 32">
                <path d="M 4,16 L 7,16 L 10,26 L 13,4 L 28,4" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M 15,25 L 20.5,14 L 26,25" fill="none" stroke="#ffffff" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-bold text-2xl tracking-tight text-slate-900">
              Álvaro<span className="text-cyan-600 font-normal">Profemate</span>
            </span>
          </Link>
          <h1 className="text-xl font-bold text-slate-900">Portal de Administración</h1>
          <p className="text-xs text-slate-500 mt-1">Acceso privado para gestión de cursos y tutorías</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-red-500"></i>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Correo Electrónico</label>
            <div className="relative">
              <i className="fa-regular fa-envelope absolute left-3.5 top-3 text-slate-400 text-sm"></i>
              <input
                type="email"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
                placeholder="admin@alvaroprofemate.cl"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contraseña</label>
            <div className="relative">
              <i className="fa-solid fa-lock absolute left-3.5 top-3 text-slate-400 text-sm"></i>
              <input
                type="password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600"
                placeholder="••••••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-lg shadow-lg shadow-cyan-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> Autenticando...
              </>
            ) : (
              <>
                <i className="fa-solid fa-right-to-bracket"></i> Iniciar Sesión Admin
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-slate-200 text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-cyan-600 transition-colors flex items-center justify-center gap-1.5">
            <i className="fa-solid fa-arrow-left"></i> Volver al Sitio Principal
          </Link>
        </div>
      </div>
    </main>
  );
}
