import type React from 'react';
import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import { signIn } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: err } = await signIn(email, password);
    setLoading(false);
    if (err) {
      if (err.message.includes('Invalid login credentials')) {
        setError('Email o contraseña incorrectos.');
      } else if (err.message.includes('Email not confirmed')) {
        setError('Debes confirmar tu email antes de acceder.');
      } else {
        setError(err.message);
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(resetEmail);
    setLoading(false);
    if (err) {
      setError(err.message);
    } else {
      setResetSent(true);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-10">
          <img
            src="/logo-as-pro-scout.png"
            alt="AS Pro Scout"
            className="w-56 h-56 object-contain"
            style={{
              maskImage: 'radial-gradient(circle, black 50%, transparent 72%)',
              WebkitMaskImage: 'radial-gradient(circle, black 50%, transparent 72%)',
            }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
          <h1 className="relative z-10 -mt-16 font-black text-4xl text-white italic tracking-tighter uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">AS Pro Scout</h1>
        </div>

        {!showReset ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4 backdrop-blur-sm">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest text-center pb-2">Acceso al Sistema</p>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
                  <AlertCircle size={14} className="shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="tu@email.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-200 text-sm outline-none focus:border-emerald-500/60 transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-11 py-3 text-slate-200 text-sm outline-none focus:border-emerald-500/60 transition-all placeholder:text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2",
                  loading
                    ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                    : "bg-emerald-600 text-slate-900 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20"
                )}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                {loading ? 'Accediendo...' : 'Entrar'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => { setShowReset(true); setResetEmail(email); setError(null); }}
              className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors py-2"
            >
              ¿Olvidaste tu contraseña?
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 space-y-4 backdrop-blur-sm">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest text-center pb-2">Recuperar Contraseña</p>

              {resetSent ? (
                <div className="py-4 text-center space-y-2">
                  <p className="text-emerald-400 font-bold text-sm">Email enviado correctamente.</p>
                  <p className="text-slate-500 text-xs">Revisa tu bandeja de entrada para resetear la contraseña.</p>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-medium">
                      <AlertCircle size={14} className="shrink-0" />
                      {error}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-slate-200 text-sm outline-none focus:border-emerald-500/60 transition-all"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-emerald-600 text-slate-900 font-black text-sm uppercase tracking-widest hover:bg-emerald-500 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : null}
                    Enviar Email de Reset
                  </button>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => { setShowReset(false); setResetSent(false); setError(null); }}
              className="w-full text-center text-xs text-slate-600 hover:text-slate-400 transition-colors py-2"
            >
              Volver al inicio de sesión
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
