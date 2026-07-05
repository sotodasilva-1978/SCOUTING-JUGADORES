import type React from 'react';
import { Shield, Users, Database, Save, CheckCircle, AlertCircle, UserPlus, Sliders, Upload, X, ChevronDown, Loader2, Eye, EyeOff, RefreshCw, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import { cn, calculateCategory } from '../lib/utils';
import { supabase } from '../lib/supabase';
import type { UserRole, Profile } from '../types';
import {
  buildRatingWeightsPayload,
  ClubModelWeights,
  DEFAULT_CLUB_MODEL_WEIGHTS,
  mapRatingWeightsToClubModel,
} from '../lib/clubModel';


// ─── Role display config ──────────────────────────────────────────────────────
const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  ADMIN:      { label: 'Administrador',   color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  COORD:      { label: 'Coordinador',     color: 'text-blue-400   bg-blue-500/10   border-blue-500/20'   },
  COORD_F11:  { label: 'Coord. F11',      color: 'text-blue-300   bg-blue-500/10   border-blue-400/20'   },
  COORD_F8:   { label: 'Coord. F8',       color: 'text-sky-400    bg-sky-500/10    border-sky-500/20'    },
  PRESID:     { label: 'Presidente',      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  ENTREN:     { label: 'Entrenador',      color: 'text-amber-400  bg-amber-500/10  border-amber-500/20'  },
  SCOUT:      { label: 'Scout',           color: 'text-slate-300  bg-slate-500/10  border-slate-500/20'  },
  SCOUT_F11:  { label: 'Scout F11',       color: 'text-cyan-400   bg-cyan-500/10   border-cyan-500/20'   },
  SCOUT_F8:   { label: 'Scout F8',        color: 'text-rose-400   bg-rose-500/10   border-rose-500/20'   },
};

// Roles visibles en el selector principal (sin variantes F11/F8 que se eligen con botones)
const BASE_ROLES: UserRole[] = ['ADMIN', 'COORD', 'PRESID', 'ENTREN', 'SCOUT'];
const ALL_ROLES: UserRole[] = ['ADMIN', 'COORD', 'COORD_F11', 'COORD_F8', 'PRESID', 'ENTREN', 'SCOUT', 'SCOUT_F11', 'SCOUT_F8'];

// ─── UsersTab ─────────────────────────────────────────────────────────────────
function UsersTab({ currentUserRole }: { currentUserRole: UserRole }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('SCOUT');
  const [editCategory, setEditCategory] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('SCOUT');
  const [inviteCategory, setInviteCategory] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; ok: boolean; msg: string } | null>(null);

  const isAdmin = currentUserRole === 'ADMIN';

  useEffect(() => { loadProfiles(); }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    if (!error && data) setProfiles(data as Profile[]);
    setLoading(false);
  };

  const startEdit = (p: Profile) => {
    setEditingId(p.id);
    setEditRole(p.role);
    setEditCategory(p.category_id ?? '');
    setEditActive(p.active);
    setFeedback(null);
  };

  const cancelEdit = () => { setEditingId(null); };

  const saveEdit = async (p: Profile) => {
    setSaving(true);
    const updatePayload: Record<string, unknown> = {
      role: editRole,
      active: editActive,
      updated_at: new Date().toISOString(),
      category_id: editRole === 'ENTREN' ? (editCategory || null) : null,
    };
    const { error } = await supabase
      .from('profiles')
      .update(updatePayload)
      .eq('id', p.id);
    setSaving(false);
    if (error) {
      setFeedback({ id: p.id, ok: false, msg: error.message });
    } else {
      setProfiles(prev => prev.map(x => x.id === p.id ? { ...x, role: editRole, active: editActive } : x));
      setEditingId(null);
      setFeedback({ id: p.id, ok: true, msg: 'Guardado correctamente' });
      setTimeout(() => setFeedback(null), 3000);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !invitePassword.trim()) return;
    setInviting(true);
    setInviteResult(null);

    // REST API directa — evita restricciones del SDK sin necesitar service role key
    let authUserId: string | null = null;
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          password: invitePassword,
          data: { full_name: inviteName.trim() },
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        const msg = json?.msg || json?.message || json?.error_description || json?.error || `Error ${res.status}`;
        setInviteResult({ ok: false, msg: String(msg) });
        setInviting(false);
        return;
      }

      // /auth/v1/signup devuelve { user: { id } } o directamente { id }
      const userId = json?.user?.id || json?.id;
      if (!userId) {
        setInviteResult({ ok: false, msg: 'No se pudo crear el usuario. Respuesta: ' + JSON.stringify(json).slice(0, 120) });
        setInviting(false);
        return;
      }

      authUserId = userId;
    } catch (err: any) {
      setInviteResult({ ok: false, msg: err?.message || 'Error de red al crear usuario' });
      setInviting(false);
      return;
    }

    const data = { user: { id: authUserId! } };

    // Insert profile with correct role and optional category
    const profilePayload: Record<string, unknown> = {
      user_id: data.user.id,
      email: inviteEmail.trim(),
      full_name: inviteName.trim() || inviteEmail.split('@')[0],
      role: inviteRole,
      active: true,
    };
    if (inviteRole === 'ENTREN' && inviteCategory) {
      profilePayload.category_id = inviteCategory;
    }

    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert([profilePayload], { onConflict: 'user_id' });

    if (profileErr) {
      setInviteResult({ ok: false, msg: 'Usuario creado pero error al guardar perfil: ' + profileErr.message });
      setInviting(false);
      return;
    }

    setInviting(false);
    setInviteResult({ ok: true, msg: `Usuario ${inviteEmail} creado correctamente. Ya puede acceder a la app.` });
    setInviteEmail('');
    setInviteName('');
    setInvitePassword('');
    setInviteRole('SCOUT');
    setInviteCategory('');
    await loadProfiles();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-100">Gestión de Usuarios</h3>
          <p className="text-sm text-slate-500 mt-0.5">Usuarios con acceso al sistema AS Pro Scout.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadProfiles}
            className="p-2 text-slate-500 hover:text-slate-300 transition-colors"
            title="Recargar"
          >
            <RefreshCw size={15} />
          </button>
          {isAdmin && (
            <button
              onClick={() => { setShowInvite(v => !v); setInviteResult(null); }}
              className="flex items-center gap-2 py-2 px-4 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-600/20 transition-all"
            >
              <UserPlus size={14} />
              Nuevo Usuario
            </button>
          )}
        </div>
      </div>

      {/* Invite form */}
      {showInvite && isAdmin && (
        <motion.form
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleInvite}
          className="bg-slate-950 border border-emerald-500/20 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-black text-emerald-400 uppercase tracking-widest">Crear nuevo usuario</p>
            <button type="button" onClick={() => setShowInvite(false)} className="text-slate-600 hover:text-slate-300 transition-colors">
              <X size={16} />
            </button>
          </div>

          {inviteResult && (
            <div className={cn(
              "flex items-start gap-2 p-3 rounded-xl text-xs font-medium",
              inviteResult.ok ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
            )}>
              {inviteResult.ok ? <CheckCircle size={14} className="shrink-0 mt-0.5" /> : <AlertCircle size={14} className="shrink-0 mt-0.5" />}
              {inviteResult.msg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre completo</label>
              <input
                type="text"
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                placeholder="Juan García"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email *</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="usuario@club.com"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contraseña inicial *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={invitePassword}
                  onChange={e => setInvitePassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 pr-10 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500/50 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rol</label>
              <div className="relative">
                <select
                  value={(['SCOUT_F11','SCOUT_F8'].includes(inviteRole) ? 'SCOUT' : ['COORD_F11','COORD_F8'].includes(inviteRole) ? 'COORD' : inviteRole)}
                  onChange={e => { setInviteRole(e.target.value as UserRole); setInviteCategory(''); }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500/50 transition-all appearance-none"
                >
                  {BASE_ROLES.map(r => (
                    <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {inviteRole === 'ENTREN' && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoría que gestiona *</label>
                <div className="relative">
                  <select
                    value={inviteCategory}
                    onChange={e => setInviteCategory(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-amber-500/60 transition-all appearance-none"
                  >
                    <option value="">-- Selecciona categoría --</option>
                    <option value="SENIOR">Senior</option>
                    <option value="JUVENIL">Juvenil</option>
                    <option value="CADETE">Cadete</option>
                    <option value="INFANTIL">Infantil</option>
                    <option value="ALEVÍN">Alevín</option>
                    <option value="BENJAMÍN">Benjamín</option>
                    <option value="PRE-BENJAMÍN">Pre-Benjamín</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
                <p className="text-[9px] text-amber-500/70 font-bold uppercase tracking-wide px-1">El entrenador solo verá jugadores de esta categoría</p>
              </div>
            )}

            {(inviteRole === 'SCOUT' || inviteRole === 'SCOUT_F11' || inviteRole === 'SCOUT_F8') && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Scout</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['SCOUT', 'SCOUT_F11', 'SCOUT_F8'] as UserRole[]).map(sr => (
                    <button
                      key={sr}
                      type="button"
                      onClick={() => setInviteRole(sr)}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-xs font-black uppercase tracking-wide transition-all",
                        inviteRole === sr
                          ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400"
                          : "bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600"
                      )}
                    >
                      {sr === 'SCOUT' ? 'General' : sr === 'SCOUT_F11' ? 'Fútbol 11' : 'Fútbol 8'}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-cyan-500/60 font-bold uppercase tracking-wide px-1">
                  {inviteRole === 'SCOUT_F11' ? 'Solo verá jugadores F11 (Cadete, Juvenil, Senior)' : inviteRole === 'SCOUT_F8' ? 'Solo verá jugadores F8 (Alevín, Benjamín, etc.)' : 'Acceso completo a todos los jugadores'}
                </p>
              </div>
            )}

            {(inviteRole === 'COORD' || inviteRole === 'COORD_F11' || inviteRole === 'COORD_F8') && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alcance del Coordinador</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['COORD', 'COORD_F11', 'COORD_F8'] as UserRole[]).map(cr => (
                    <button
                      key={cr}
                      type="button"
                      onClick={() => setInviteRole(cr)}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-xs font-black uppercase tracking-wide transition-all",
                        inviteRole === cr
                          ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                          : "bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600"
                      )}
                    >
                      {cr === 'COORD' ? 'General' : cr === 'COORD_F11' ? 'Fútbol 11' : 'Fútbol 8'}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-blue-500/60 font-bold uppercase tracking-wide px-1">
                  {inviteRole === 'COORD_F11' ? 'Solo verá jugadores F11 (Cadete, Juvenil, Senior)' : inviteRole === 'COORD_F8' ? 'Solo verá jugadores F8 (Alevín, Benjamín, etc.)' : 'Acceso completo a todos los jugadores'}
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={inviting || !inviteEmail.trim() || !invitePassword.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {inviting ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
              {inviting ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </motion.form>
      )}

      {/* Users list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <Users size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-bold uppercase tracking-widest">Sin usuarios registrados</p>
        </div>
      ) : (
        <div className="space-y-3">
          {profiles.map(p => {
            const isEditing = editingId === p.id;
            const cfg = ROLE_CONFIG[p.role] ?? ROLE_CONFIG.SCOUT;
            return (
              <div key={p.id} className={cn(
                "border rounded-2xl p-4 transition-all",
                isEditing
                  ? "bg-slate-900 border-emerald-500/30"
                  : "bg-slate-950 border-slate-800 hover:border-slate-700"
              )}>
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-black text-slate-400 text-sm shrink-0">
                    {(p.full_name || p.email)[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-200 truncate">{p.full_name || '—'}</p>
                    <p className="text-xs text-slate-500 truncate">{p.email}</p>
                  </div>

                  {/* Role badge (view mode) */}
                  {!isEditing && (
                    <span className={cn("hidden sm:inline-flex px-2.5 py-0.5 rounded-lg border text-[10px] font-black uppercase tracking-wide shrink-0", cfg.color)}>
                      {cfg.label}
                    </span>
                  )}

                  {/* Active badge (view mode) */}
                  {!isEditing && (
                    <span className={cn("text-[10px] font-bold uppercase shrink-0", p.active ? "text-emerald-500" : "text-rose-500")}>
                      {p.active ? 'Activo' : 'Inactivo'}
                    </span>
                  )}

                  {/* Edit button */}
                  {isAdmin && !isEditing && (
                    <button
                      onClick={() => startEdit(p)}
                      className="p-2 text-slate-600 hover:text-slate-200 transition-colors shrink-0"
                    >
                      <Sliders size={15} />
                    </button>
                  )}
                </div>

                {/* Edit inline */}
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-slate-800 space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rol</label>
                        <div className="relative">
                          <select
                            value={(['SCOUT_F11','SCOUT_F8'].includes(editRole) ? 'SCOUT' : ['COORD_F11','COORD_F8'].includes(editRole) ? 'COORD' : editRole)}
                            onChange={e => setEditRole(e.target.value as UserRole)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500/50 transition-all appearance-none"
                          >
                            {BASE_ROLES.map(r => (
                              <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                            ))}
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado</label>
                        <button
                          type="button"
                          onClick={() => setEditActive(v => !v)}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-bold transition-all",
                            editActive
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-rose-500/10 border-rose-500/30 text-rose-400"
                          )}
                        >
                          {editActive ? 'Activo' : 'Inactivo'}
                          <div className={cn("w-8 h-4 rounded-full transition-colors relative", editActive ? "bg-emerald-500" : "bg-slate-700")}>
                            <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all", editActive ? "left-4" : "left-0.5")} />
                          </div>
                        </button>
                      </div>
                    </div>

                    {editRole === 'ENTREN' && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Categoría que gestiona</label>
                        <div className="relative">
                          <select
                            value={editCategory}
                            onChange={e => setEditCategory(e.target.value)}
                            className="w-full bg-slate-800 border border-amber-500/30 rounded-xl px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-amber-500/60 transition-all appearance-none"
                          >
                            <option value="">-- Sin asignar --</option>
                            <option value="SENIOR">Senior</option>
                            <option value="JUVENIL">Juvenil</option>
                            <option value="CADETE">Cadete</option>
                            <option value="INFANTIL">Infantil</option>
                            <option value="ALEVÍN">Alevín</option>
                            <option value="BENJAMÍN">Benjamín</option>
                            <option value="PRE-BENJAMÍN">Pre-Benjamín</option>
                          </select>
                          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                        </div>
                      </div>
                    )}

                    {(editRole === 'SCOUT' || editRole === 'SCOUT_F11' || editRole === 'SCOUT_F8') && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tipo de Scout</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['SCOUT', 'SCOUT_F11', 'SCOUT_F8'] as UserRole[]).map(sr => (
                            <button key={sr} type="button" onClick={() => setEditRole(sr)}
                              className={cn("py-2 px-3 rounded-xl border text-xs font-black uppercase tracking-wide transition-all",
                                editRole === sr ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-400" : "bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600")}>
                              {sr === 'SCOUT' ? 'General' : sr === 'SCOUT_F11' ? 'F11' : 'F8'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {(editRole === 'COORD' || editRole === 'COORD_F11' || editRole === 'COORD_F8') && (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Alcance del Coordinador</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['COORD', 'COORD_F11', 'COORD_F8'] as UserRole[]).map(cr => (
                            <button key={cr} type="button" onClick={() => setEditRole(cr)}
                              className={cn("py-2 px-3 rounded-xl border text-xs font-black uppercase tracking-wide transition-all",
                                editRole === cr ? "bg-blue-500/15 border-blue-500/40 text-blue-400" : "bg-slate-900 border-slate-700 text-slate-500 hover:border-slate-600")}>
                              {cr === 'COORD' ? 'General' : cr === 'COORD_F11' ? 'F11' : 'F8'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {feedback?.id === p.id && (
                      <div className={cn("flex items-center gap-2 text-xs font-medium", feedback.ok ? "text-emerald-400" : "text-rose-400")}>
                        {feedback.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                        {feedback.msg}
                      </div>
                    )}

                    <div className="flex items-center gap-3 justify-end">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-4 py-2 text-xs font-black text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(p)}
                        disabled={saving}
                        className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-emerald-500 disabled:opacity-50 transition-all"
                      >
                        {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        Guardar
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="pt-4 border-t border-slate-800/50">
        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
          {profiles.length} usuario{profiles.length !== 1 ? 's' : ''} registrado{profiles.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
}

// ─── Season helper ──────────────────────────────────────────────────────────
function advanceSeason(current: string): string {
  const match = current.match(/^(\d{4})\/(\d{4})$/);
  if (!match) return current;
  return `${parseInt(match[1]) + 1}/${parseInt(match[2]) + 1}`;
}

// ─── Main SettingsPanel ───────────────────────────────────────────────────────
export function SettingsPanel({
  userRole,
  initialWeights = DEFAULT_CLUB_MODEL_WEIGHTS,
  onWeightsSaved,
}: {
  userRole?: UserRole;
  initialWeights?: ClubModelWeights;
  onWeightsSaved?: (weights: ClubModelWeights) => void;
}) {
  const currentRole: UserRole = userRole ?? 'SCOUT';
  const [activeTab, setActiveTab] = useState('usuarios');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [clubName, setClubName] = useState('U.D. SANTA MARIÑA');
  const [season, setSeason] = useState('2026/2027');
  const [clubId, setClubId] = useState<string | null>(null);

  const [weights, setWeights] = useState([
    { id: 'tecnica', label: 'Técnica', weight: initialWeights.technique },
    { id: 'tactica', label: 'Táctica', weight: initialWeights.tactics },
    { id: 'fisico', label: 'Físico', weight: initialWeights.physical },
    { id: 'mentalidad', label: 'Mentalidad', weight: initialWeights.mentality },
    { id: 'potencial', label: 'Potencial', weight: initialWeights.potential },
  ]);

  const [rolloverLoading, setRolloverLoading] = useState(false);
  const [rolloverConfirm, setRolloverConfirm] = useState(false);
  const [rolloverResult, setRolloverResult] = useState<{ ok: boolean; msg: string; created: number; skipped: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadSettings().finally(() => {
      setWeights([
        { id: 'tecnica', label: 'Técnica', weight: initialWeights.technique },
        { id: 'tactica', label: 'Táctica', weight: initialWeights.tactics },
        { id: 'fisico', label: 'Físico', weight: initialWeights.physical },
        { id: 'mentalidad', label: 'Mentalidad', weight: initialWeights.mentality },
        { id: 'potencial', label: 'Potencial', weight: initialWeights.potential },
      ]);
    });
  }, []);

  useEffect(() => {
    setWeights([
      { id: 'tecnica', label: 'TÃ©cnica', weight: initialWeights.technique },
      { id: 'tactica', label: 'TÃ¡ctica', weight: initialWeights.tactics },
      { id: 'fisico', label: 'FÃ­sico', weight: initialWeights.physical },
      { id: 'mentalidad', label: 'Mentalidad', weight: initialWeights.mentality },
      { id: 'potencial', label: 'Potencial', weight: initialWeights.potential },
    ]);
  }, [initialWeights]);

  useEffect(() => {
    setWeights(prev => {
      const byId = Object.fromEntries(prev.map(item => [item.id, item.weight]));
      return [
        { id: 'tecnica', label: 'Técnica', weight: Number(byId.tecnica ?? initialWeights.technique) },
        { id: 'tactica', label: 'Táctica', weight: Number(byId.tactica ?? initialWeights.tactics) },
        { id: 'fisico', label: 'Físico', weight: Number(byId.fisico ?? initialWeights.physical) },
        { id: 'mentalidad', label: 'Mentalidad', weight: Number(byId.mentalidad ?? initialWeights.mentality) },
        { id: 'potencial', label: 'Potencial', weight: Number(byId.potencial ?? initialWeights.potential) },
      ];
    });
  }, [initialWeights, clubId]);

  const loadSettings = async () => {
    try {
      const { data: club } = await supabase
        .from('clubs')
        .select('*')
        .eq('name', 'U.D. SANTA MARIÑA')
        .single();
      if (club) {
        setClubId(club.id);
        setClubName(club.name);
        setSeason(club.current_season);
        setLogoPreview(club.logo_url);
      }

      if (club) {
        const { data: rw } = await supabase.from('rating_weights').select('*').eq('club_id', club.id).maybeSingle();
        if (rw) {
           setWeights([
             { id: 'tecnica', label: 'Técnica', weight: Number(rw.technique_weight) * 100 },
             { id: 'tactica', label: 'Táctica', weight: Number(rw.tactics_weight) * 100 },
             { id: 'fisico', label: 'Físico', weight: Number(rw.physical_weight) * 100 },
             { id: 'mentalidad', label: 'Mentalidad', weight: Number(rw.mentality_weight) * 100 },
             { id: 'potencial', label: 'Potencial', weight: Number(rw.potential_weight) * 100 },
             { id: 'encaje', label: 'Encaje Club', weight: Number(rw.club_fit_weight) * 100 },
           ]);
           const mappedWeights = mapRatingWeightsToClubModel(rw);
           setWeights([
             { id: 'tecnica', label: 'TÃ©cnica', weight: mappedWeights.technique },
             { id: 'tactica', label: 'TÃ¡ctica', weight: mappedWeights.tactics },
             { id: 'fisico', label: 'FÃ­sico', weight: mappedWeights.physical },
             { id: 'mentalidad', label: 'Mentalidad', weight: mappedWeights.mentality },
             { id: 'potencial', label: 'Potencial', weight: mappedWeights.potential },
           ]);
        }
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  };

  const totalWeight = weights.reduce((sum, item) => sum + item.weight, 0);
  const canSaveWeights = totalWeight > 0;

  const handleWeightChange = (id: string, value: number) => {
    const nextValue = Math.max(0, Math.min(value, 100));
    setWeights(prev => prev.map(w => w.id === id ? { ...w, weight: nextValue } : w));
  };

  const handleSaveWeights = async () => {
    if (!canSaveWeights) { alert('Debes asignar al menos un peso antes de guardar.'); return; }
    if (!clubId) { alert('No se encontró club para asociar los pesos.'); return; }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert('Sesión expirada. Vuelve a iniciar sesión.'); return; }

      const nextWeights: ClubModelWeights = {
        technique: weights[0].weight,
        tactics: weights[1].weight,
        physical: weights[2].weight,
        mentality: weights[3].weight,
        potential: weights[4].weight,
      };
      const payload = buildRatingWeightsPayload(clubId, nextWeights);

      const { data: existing } = await supabase
        .from('rating_weights').select('id').eq('club_id', clubId).maybeSingle();

      let error;
      if (existing) {
        ({ error } = await supabase.from('rating_weights').update(payload).eq('id', existing.id));
      } else {
        ({ error } = await supabase.from('rating_weights').insert(payload));
      }
      if (error) throw error;
      onWeightsSaved?.(nextWeights);
      alert('Pesos de valoración actualizados correctamente.');
    } catch (err: any) {
      const isRLS = err.message?.includes('row-level security') || err.code === '42501';
      if (isRLS) {
        alert(
          'Sin permisos para crear la configuración inicial.\n\n' +
          'Ve a Supabase → Authentication → Policies → tabla "rating_weights" ' +
          'y añade una política INSERT para usuarios autenticados (auth.uid() IS NOT NULL).'
        );
      } else {
        alert('Error al guardar pesos: ' + err.message);
      }
    }
  };

  const handleSaveClubInfo = async () => {
    try {
      const payload = { name: clubName, current_season: season, logo_url: logoPreview };
      let error;
      if (clubId) {
        ({ error } = await supabase.from('clubs').update(payload).eq('id', clubId));
      } else {
        const { data, error: err } = await supabase.from('clubs').insert([payload]).select().single();
        if (data) setClubId(data.id);
        error = err;
      }
      if (error) throw error;
      alert('Información del club actualizada correctamente.');
    } catch (err: any) {
      alert('Error al guardar info del club: ' + err.message);
    }
  };

  const handleSeasonRollover = async () => {
    if (!clubId) return;
    setRolloverLoading(true);
    setRolloverResult(null);
    try {
      // Obtener temporada actual
      const { data: clubData, error: clubErr } = await supabase
        .from('clubs').select('current_season, name').eq('id', clubId).single();
      if (clubErr || !clubData) throw new Error('No se pudo cargar el club');
      const currentSeason = clubData.current_season as string;
      const nextSeason = advanceSeason(currentSeason);

      // Obtener todos los jugadores
      const { data: playersData, error: playersErr } = await supabase
        .from('players').select('id, club_id, club_name, current_team_id, birth_year, birth_date, league, competition');
      if (playersErr) throw playersErr;
      if (!playersData || playersData.length === 0) {
        setRolloverResult({ ok: true, msg: 'No hay jugadores en la base de datos.', created: 0, skipped: 0 });
        setRolloverLoading(false);
        return;
      }

      // Mapa de equipos
      const { data: teamsData } = await supabase.from('teams').select('id, name');
      const teamMap: Record<string, string> = {};
      (teamsData || []).forEach((t: any) => { teamMap[t.id] = t.name; });

      // Mapa de clubs
      const { data: clubsData } = await supabase.from('clubs').select('id, name');
      const clubMap: Record<string, string> = {};
      (clubsData || []).forEach((c: any) => { clubMap[c.id] = c.name; });

      // Entradas existentes para la temporada actual (evitar duplicados)
      const { data: existing } = await supabase
        .from('player_career_entries').select('player_id').eq('season', currentSeason);
      const existingIds = new Set<string>((existing || []).map((e: any) => e.player_id));

      // Construir entradas
      const toInsert: any[] = [];
      let skipped = 0;
      for (const player of playersData as any[]) {
        if (existingIds.has(player.id)) { skipped++; continue; }
        toInsert.push({
          player_id: player.id,
          club_id: player.club_id || null,
          club_name_snapshot: (player.club_id && clubMap[player.club_id]) || player.club_name || 'Club no especificado',
          season: currentSeason,
          team_name: (player.current_team_id && teamMap[player.current_team_id]) || 'Sin equipo asignado',
          category: calculateCategory(player.birth_year, player.birth_date),
          competition: player.league || player.competition || '',
          matches_played: 0,
          minutes_played: 0,
          goals: 0,
          yellow_cards: 0,
          red_cards: 0,
        });
      }

      if (toInsert.length > 0) {
        const { error: insertErr } = await supabase.from('player_career_entries').insert(toInsert);
        if (insertErr) throw insertErr;
      }

      // Avanzar temporada en el club
      const { error: updateErr } = await supabase.from('clubs').update({ current_season: nextSeason }).eq('id', clubId);
      if (updateErr) throw updateErr;

      setSeason(nextSeason);
      setRolloverConfirm(false);
      setRolloverResult({
        ok: true,
        msg: `Temporada ${currentSeason} cerrada. Nueva temporada activa: ${nextSeason}.`,
        created: toInsert.length,
        skipped,
      });
    } catch (err: any) {
      setRolloverResult({ ok: false, msg: err?.message || 'Error desconocido', created: 0, skipped: 0 });
    } finally {
      setRolloverLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'usuarios', label: 'Usuarios y Roles', icon: Users },
    { id: 'club', label: 'Configuración Club', icon: Shield },
    { id: 'ratings', label: 'Pesos Valoración', icon: Sliders },
    { id: 'database', label: 'Base de Datos', icon: Database },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Configuración del Sistema</h1>
        <p className="text-slate-400">Administra los parámetros globales de la base de datos de scouting.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-64 flex-shrink-0 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm",
                activeTab === tab.id
                  ? "bg-emerald-600 text-slate-900 shadow-lg shadow-emerald-600/20"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-3xl p-6 md:p-8 backdrop-blur-sm">
          {activeTab === 'usuarios' && <UsersTab currentUserRole={currentRole} />}

          {activeTab === 'ratings' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-slate-100">Modelo de Club</h3>
                <p className="text-sm text-slate-500">Define la importancia de cada área para calcular el encaje automático con la idea de juego del club.</p>
              </div>
              <div className="space-y-6">
                {weights.map((item) => (
                  <div key={item.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-bold text-slate-300">{item.label}</label>
                      <span className="text-xs font-black text-slate-300">
                        {item.weight}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={item.weight}
                      onChange={(e) => handleWeightChange(item.id, Number(e.target.value))}
                      className="w-full h-2 bg-slate-950 rounded-full border border-slate-800 appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-full border transition-colors",
                  canSaveWeights
                    ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5"
                    : "text-slate-500 border-slate-700 bg-slate-900/60"
                )}>
                  {canSaveWeights ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span className="text-xs font-bold uppercase tracking-widest">
                    TOTAL ASIGNADO: {totalWeight}%
                  </span>
                </div>
                <p className="text-xs text-slate-500 text-center sm:text-left sm:flex-1">
                  El encaje se recalcula automÃ¡ticamente normalizando estos pesos.
                </p>
                <button
                  onClick={handleSaveWeights}
                  disabled={!canSaveWeights}
                  className={cn(
                    "flex items-center gap-2 py-3 px-6 font-black rounded-xl transition-all shadow-lg active:scale-95",
                    canSaveWeights
                      ? "bg-emerald-600 text-slate-900 hover:bg-emerald-500"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  )}
                >
                  <Save size={18} />
                  GUARDAR CAMBIOS
                </button>
              </div>
            </div>
          )}

          {activeTab === 'club' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-slate-100">Información del Club</h3>
                <p className="text-sm text-slate-500">Configura la identidad visual y parámetros base del club.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Nombre Comercial</label>
                  <input
                    type="text"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-emerald-500 transition-all font-bold"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Temporada por Defecto</label>
                  <input
                    type="text"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 outline-none focus:border-emerald-500 transition-all font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center py-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                <div className="w-24 h-24 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden group/logo relative shadow-inner">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-700">
                      <Shield size={32} strokeWidth={1.5} />
                      <span className="text-[10px] font-black uppercase text-slate-800">No Logo</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-emerald-600/20 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <Upload size={20} className="text-emerald-500" />
                  </div>
                </div>
                <div className="space-y-4 flex-1">
                  <div>
                    <p className="text-sm font-bold text-slate-200">Logo del Club</p>
                    <p className="text-xs text-slate-500">Se usará en informes y barra lateral (Formatos: PNG, JPG, SVG).</p>
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 py-3 px-6 bg-slate-800 text-slate-200 font-black rounded-xl hover:bg-slate-700 transition-all active:scale-95"
                  >
                    <Upload size={18} />
                    Actualizar Logo
                  </button>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-800 flex justify-end">
                <button
                  onClick={handleSaveClubInfo}
                  className="flex items-center gap-2 py-3 px-6 bg-emerald-600 text-slate-900 font-black rounded-xl hover:bg-emerald-500 transition-all shadow-lg active:scale-95"
                >
                  <Save size={18} />
                  GUARDAR CAMBIOS
                </button>
              </div>

              {/* ── Cierre de Temporada (solo ADMIN) ────────────────────── */}
              {currentRole === 'ADMIN' && (
                <div className="border-t border-slate-800 pt-8 space-y-5">
                  <div>
                    <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <Calendar size={16} className="text-amber-400" />
                      Cierre de Temporada
                    </h4>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                      Registra automáticamente un historial de trayectoria para cada jugador con sus datos actuales
                      (equipo, categoría, competición) y estadísticas en cero. Después avanza la temporada activa del club.
                    </p>
                  </div>

                  {/* Preview temporada */}
                  <div className="flex items-center gap-4 bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 w-fit">
                    <div className="text-center">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">Temporada actual</p>
                      <p className="text-lg font-black text-slate-200">{season}</p>
                    </div>
                    <ArrowRight size={18} className="text-slate-600 shrink-0" />
                    <div className="text-center">
                      <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest mb-1">Nueva temporada</p>
                      <p className="text-lg font-black text-amber-400">{advanceSeason(season)}</p>
                    </div>
                  </div>

                  {/* Resultado */}
                  {rolloverResult && (
                    <div className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border text-sm",
                      rolloverResult.ok
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                    )}>
                      {rolloverResult.ok
                        ? <CheckCircle size={16} className="shrink-0 mt-0.5" />
                        : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
                      <div>
                        <p className="font-bold">{rolloverResult.msg}</p>
                        {rolloverResult.ok && (
                          <p className="text-xs mt-1 opacity-80">
                            {rolloverResult.created} registro{rolloverResult.created !== 1 ? 's' : ''} de trayectoria creado{rolloverResult.created !== 1 ? 's' : ''}
                            {rolloverResult.skipped > 0 && ` · ${rolloverResult.skipped} jugador${rolloverResult.skipped !== 1 ? 'es' : ''} ya tenía entrada para esa temporada (omitido${rolloverResult.skipped !== 1 ? 's' : ''})`}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botón / Confirmación */}
                  {!rolloverConfirm ? (
                    <button
                      onClick={() => { setRolloverConfirm(true); setRolloverResult(null); }}
                      className="flex items-center gap-2 py-3 px-6 bg-amber-500/10 text-amber-400 border border-amber-500/20 font-black rounded-xl hover:bg-amber-500/20 transition-all text-sm uppercase tracking-widest active:scale-95"
                    >
                      <Calendar size={16} />
                      CERRAR TEMPORADA {season}
                    </button>
                  ) : (
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-amber-300">¿Confirmar cierre de temporada {season}?</p>
                          <p className="text-xs text-amber-400/70 leading-relaxed">
                            Se creará un registro de trayectoria (sin estadísticas) para cada jugador sin entrada en <strong>{season}</strong>.
                            La temporada activa del club pasará a <strong>{advanceSeason(season)}</strong>.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setRolloverConfirm(false)}
                          disabled={rolloverLoading}
                          className="px-4 py-2 text-xs font-black text-slate-400 hover:text-white transition-colors uppercase tracking-widest disabled:opacity-40"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleSeasonRollover}
                          disabled={rolloverLoading}
                          className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-amber-500 disabled:opacity-50 transition-all active:scale-95"
                        >
                          {rolloverLoading
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Calendar size={14} />}
                          {rolloverLoading ? 'Procesando...' : 'CONFIRMAR CIERRE'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'database' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-100">Base de Datos</h3>
                <p className="text-sm text-slate-500">Información de conexión y estado del sistema.</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Proveedor</span>
                  <span className="text-xs font-bold text-slate-300">Supabase (PostgreSQL)</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-800/50">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Proyecto</span>
                  <span className="text-xs font-bold text-slate-300">xkjzgknmeqmpxoophcka</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Estado</span>
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Conectado
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
