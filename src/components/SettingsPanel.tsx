import type React from 'react';
import { Shield, Users, Database, Save, CheckCircle, AlertCircle, UserPlus, Sliders, Upload, X, ChevronDown, Loader2, Eye, EyeOff, RefreshCw, Calendar, ArrowRight, Check, Trash2, Printer, PrinterCheck, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useRef, useEffect } from 'react';
import { cn, calculateCategory } from '../lib/utils';
import { supabase } from '../lib/supabase';
import type { UserRole, Profile, Client as ClientType, PaymentEntry, PlanType } from '../types';
import { PLAN_INFO } from '../types';
import {
  buildRatingWeightsPayload,
  ClubModelWeights,
  DEFAULT_CLUB_MODEL_WEIGHTS,
  mapRatingWeightsToClubModel,
} from '../lib/clubModel';


// ─── Role display config ──────────────────────────────────────────────────────
const ROLE_CONFIG: Record<UserRole, { label: string; color: string }> = {
  ADMIN:      { label: 'Administrador',   color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  SUPERADMIN: { label: 'Super Admin',     color: 'text-emerald-300 bg-emerald-500/20 border-emerald-500/40' },
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

// ─── UsersTab ─────────────────────────────────────────────────────────────────
function UsersTab({ currentUserRole, clubId }: { currentUserRole: UserRole; clubId: string | null }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('SCOUT');
  const [editCategory, setEditCategory] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editCanPrint, setEditCanPrint] = useState(false);
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetPasswordVisible, setResetPasswordVisible] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  const isAdmin = currentUserRole === 'ADMIN' || currentUserRole === 'SUPERADMIN';
  const isSuperAdmin = currentUserRole === 'SUPERADMIN';

  const startResetPassword = (p: Profile) => {
    setResetPasswordId(p.id);
    setResetPasswordValue('');
    setFeedback(null);
  };

  const cancelResetPassword = () => { setResetPasswordId(null); setResetPasswordValue(''); };

  const handleResetPassword = async (p: Profile) => {
    if (resetPasswordValue.trim().length < 8) {
      setFeedback({ id: p.id, ok: false, msg: 'La contraseña debe tener al menos 8 caracteres.' });
      return;
    }
    setResettingPassword(true);
    const { data, error } = await supabase.functions.invoke('admin-reset-password', {
      body: { userId: p.user_id, newPassword: resetPasswordValue.trim() },
    });
    setResettingPassword(false);
    if (error || !data?.ok) {
      setFeedback({ id: p.id, ok: false, msg: data?.error || error?.message || 'Error al resetear la contraseña.' });
      return;
    }
    setFeedback({ id: p.id, ok: true, msg: 'Contraseña actualizada correctamente.' });
    setResetPasswordId(null);
    setResetPasswordValue('');
    setTimeout(() => setFeedback(null), 4000);
  };

  useEffect(() => { loadProfiles(); }, [clubId]);

  const loadProfiles = async () => {
    setLoading(true);
    let query = supabase.from('profiles').select('*').order('created_at', { ascending: true });
    if (clubId) query = query.eq('club_id', clubId);
    query = query.neq('role', 'SUPERADMIN');
    const { data, error } = await query;
    if (!error && data) setProfiles((data as Profile[]).filter(profile => profile.role !== 'SUPERADMIN'));
    setLoading(false);
  };

  const startEdit = (p: Profile) => {
    setEditingId(p.id);
    setEditRole(p.role);
    setEditCategory(p.category_id ?? '');
    setEditActive(p.active);
    setEditCanPrint(!!p.can_print);
    setFeedback(null);
  };

  const cancelEdit = () => { setEditingId(null); };

  const handleDelete = async (p: Profile) => {
    if (!window.confirm(`¿Seguro que quieres eliminar a ${p.full_name || p.email}? Perderá el acceso a la plataforma. Esta acción no se puede deshacer.`)) return;
    setDeletingId(p.id);
    // Pedimos de vuelta las filas borradas: si RLS bloquea el DELETE, Supabase
    // no devuelve error (borra 0 filas silenciosamente), así que hay que
    // comprobar que realmente se ha eliminado algo.
    const { data, error } = await supabase.from('profiles').delete().eq('id', p.id).select('id');
    setDeletingId(null);
    if (error) {
      setFeedback({ id: p.id, ok: false, msg: error.message });
    } else if (!data || data.length === 0) {
      setFeedback({ id: p.id, ok: false, msg: 'No se pudo eliminar: faltan permisos (RLS) en la tabla profiles. Ejecuta fix_profiles_delete_policy_migration.sql en Supabase.' });
    } else {
      setProfiles(prev => prev.filter(x => x.id !== p.id));
      if (editingId === p.id) setEditingId(null);
    }
  };

  const saveEdit = async (p: Profile) => {
    setSaving(true);
    const updatePayload: Record<string, unknown> = {
      role: editRole,
      active: editActive,
      can_print: editCanPrint,
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
      setProfiles(prev => prev.map(x => x.id === p.id ? { ...x, role: editRole, active: editActive, can_print: editCanPrint } : x));
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
      can_print: ['ADMIN', 'SUPERADMIN', 'PRESID'].includes(inviteRole),
      ...(clubId ? { club_id: clubId } : {}),
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

                  {/* Print permission badge (view mode) */}
                  {!isEditing && (
                    <span
                      title={p.can_print ? 'Puede imprimir informes' : 'No puede imprimir informes'}
                      className={cn(
                        "hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-bold uppercase shrink-0",
                        p.can_print ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-slate-500 bg-slate-800/50 border-slate-700"
                      )}
                    >
                      {p.can_print ? <PrinterCheck size={12} /> : <Printer size={12} />}
                    </span>
                  )}

                  {/* Edit button */}
                  {isAdmin && !isEditing && resetPasswordId !== p.id && (
                    <button
                      onClick={() => startEdit(p)}
                      className="p-2 text-slate-600 hover:text-slate-200 transition-colors shrink-0"
                      title="Editar usuario"
                    >
                      <Sliders size={15} />
                    </button>
                  )}

                  {/* Reset password button (solo Super Admin) */}
                  {isSuperAdmin && !isEditing && resetPasswordId !== p.id && (
                    <button
                      onClick={() => startResetPassword(p)}
                      className="p-2 text-slate-600 hover:text-amber-400 transition-colors shrink-0"
                      title="Resetear contraseña"
                    >
                      <KeyRound size={15} />
                    </button>
                  )}

                  {/* Delete button */}
                  {isAdmin && !isEditing && resetPasswordId !== p.id && (
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={deletingId === p.id}
                      className="p-2 text-slate-600 hover:text-rose-400 transition-colors shrink-0 disabled:opacity-40"
                      title="Eliminar usuario"
                    >
                      {deletingId === p.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                    </button>
                  )}
                </div>

                {/* Feedback (view mode, p.ej. error al borrar) */}
                {!isEditing && resetPasswordId !== p.id && feedback?.id === p.id && (
                  <div className={cn("flex items-center gap-2 mt-3 pt-3 border-t border-slate-800 text-xs font-medium", feedback.ok ? "text-emerald-400" : "text-rose-400")}>
                    {feedback.ok ? <CheckCircle size={13} className="shrink-0" /> : <AlertCircle size={13} className="shrink-0" />}
                    {feedback.msg}
                  </div>
                )}

                {/* Reset password inline (solo Super Admin) */}
                {resetPasswordId === p.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-slate-800 space-y-3"
                  >
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      Nueva contraseña para {p.full_name || p.email}
                    </label>
                    <div className="relative">
                      <input
                        type={resetPasswordVisible ? 'text' : 'password'}
                        value={resetPasswordValue}
                        onChange={e => setResetPasswordValue(e.target.value)}
                        placeholder="Mínimo 8 caracteres"
                        minLength={8}
                        className="w-full bg-slate-800 border border-amber-500/30 rounded-xl px-4 pr-10 py-2.5 text-sm text-slate-200 outline-none focus:border-amber-500/60 transition-all"
                      />
                      <button type="button" onClick={() => setResetPasswordVisible(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400 transition-colors">
                        {resetPasswordVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>

                    {feedback?.id === p.id && (
                      <div className={cn("flex items-center gap-2 text-xs font-medium", feedback.ok ? "text-emerald-400" : "text-rose-400")}>
                        {feedback.ok ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                        {feedback.msg}
                      </div>
                    )}

                    <div className="flex items-center gap-3 justify-end">
                      <button
                        type="button"
                        onClick={cancelResetPassword}
                        className="px-4 py-2 text-xs font-black text-slate-400 hover:text-white transition-colors uppercase tracking-widest"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResetPassword(p)}
                        disabled={resettingPassword || resetPasswordValue.trim().length < 8}
                        className="flex items-center gap-2 px-5 py-2 bg-amber-500 text-slate-900 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-amber-400 disabled:opacity-50 transition-all"
                      >
                        {resettingPassword ? <Loader2 size={13} className="animate-spin" /> : <KeyRound size={13} />}
                        Fijar contraseña
                      </button>
                    </div>
                  </motion.div>
                )}

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
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Permiso de impresión</label>
                        <button
                          type="button"
                          onClick={() => setEditCanPrint(v => !v)}
                          className={cn(
                            "w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-bold transition-all",
                            editCanPrint
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-slate-800 border-slate-700 text-slate-400"
                          )}
                        >
                          <span className="flex items-center gap-2">
                            {editCanPrint ? <PrinterCheck size={14} /> : <Printer size={14} />}
                            {editCanPrint ? 'Puede imprimir' : 'No puede imprimir'}
                          </span>
                          <div className={cn("w-8 h-4 rounded-full transition-colors relative", editCanPrint ? "bg-emerald-500" : "bg-slate-700")}>
                            <div className={cn("absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all", editCanPrint ? "left-4" : "left-0.5")} />
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

// ─── Calendario de pagos (duración de contrato variable: 3, 6 o 12 meses) ────
const CONTRACT_DURATION_OPTIONS = [3, 6, 12] as const;
type ContractDuration = typeof CONTRACT_DURATION_OPTIONS[number];

function makeEmptyPaymentLog(length: number): PaymentEntry[] {
  return Array.from({ length }, () => ({ paid: false, paid_date: null }));
}

// Normaliza cualquier valor guardado a un array de exactamente `length` entradas.
function normalizePaymentLog(raw: unknown, length: number): PaymentEntry[] {
  const base = makeEmptyPaymentLog(length);
  if (Array.isArray(raw)) {
    for (let i = 0; i < length; i++) {
      const e = raw[i] as any;
      if (e && typeof e === 'object') {
        base[i] = { paid: !!e.paid, paid_date: e.paid_date ?? null };
      }
    }
  }
  return base;
}

// Cambia la longitud del calendario conservando los meses que se solapan.
function resizePaymentLog(prev: PaymentEntry[], newLength: number): PaymentEntry[] {
  const base = makeEmptyPaymentLog(newLength);
  for (let i = 0; i < Math.min(prev.length, newLength); i++) base[i] = prev[i];
  return base;
}

const MONTH_NAMES_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

function addMonthsToDate(startISO: string, months: number): Date | null {
  const start = new Date(startISO + 'T00:00:00');
  if (isNaN(start.getTime())) return null;
  return new Date(start.getFullYear(), start.getMonth() + months, start.getDate());
}

function toISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Fecha teórica de vencimiento de cada mes: fecha de activación + i meses.
function monthLabelFromStart(startISO: string, i: number): { label: string; iso: string } {
  if (!startISO) return { label: `Mes ${i + 1}`, iso: '' };
  const d = addMonthsToDate(startISO, i);
  if (!d) return { label: `Mes ${i + 1}`, iso: '' };
  const label = `${MONTH_NAMES_ES[d.getMonth()]} ${d.getFullYear()}`;
  return { label, iso: toISODate(d) };
}

// Fin de suscripción = fecha de activación + duración del contrato.
function computeEndDate(startISO: string, durationMonths: number): string {
  const d = addMonthsToDate(startISO, durationMonths);
  return d ? toISODate(d) : '';
}

// ─── Main SettingsPanel ───────────────────────────────────────────────────────
export function SettingsPanel({
  userRole,
  client: currentClub,
  initialWeights = DEFAULT_CLUB_MODEL_WEIGHTS,
  onWeightsSaved,
}: {
  userRole?: UserRole;
  client?: ClientType | null;
  initialWeights?: ClubModelWeights;
  onWeightsSaved?: (weights: ClubModelWeights) => void;
}) {
  const currentRole: UserRole = userRole ?? 'SCOUT';
  const isSuperAdmin = currentRole === 'SUPERADMIN';
  const [activeTab, setActiveTab] = useState('usuarios');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [clubName, setClubName] = useState('');
  const [season, setSeason] = useState('2026/2027');
  const [clubId, setClubId] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [secondaryColor, setSecondaryColor] = useState('#0f172a');
  const [tertiaryColor, setTertiaryColor] = useState('#f59e0b');
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('trial');
  const [planType, setPlanType] = useState<PlanType>('basico');
  const [subscriptionStartDate, setSubscriptionStartDate] = useState('');
  const [subscriptionEndDate, setSubscriptionEndDate] = useState('');
  const [contractDuration, setContractDuration] = useState<ContractDuration>(12);
  const [monthlyFee, setMonthlyFee] = useState('0');
  const [paymentLog, setPaymentLog] = useState<PaymentEntry[]>(() => makeEmptyPaymentLog(12));
  const bgFileInputRef = useRef<HTMLInputElement>(null);

  // Fin de suscripción auto-generado: activación + duración del contrato.
  useEffect(() => {
    if (!subscriptionStartDate) return;
    setSubscriptionEndDate(computeEndDate(subscriptionStartDate, contractDuration));
  }, [subscriptionStartDate, contractDuration]);

  // El calendario de pagos se re-dimensiona a la duración elegida (3/6/12 meses),
  // conservando los pagos ya marcados en los meses que coinciden.
  useEffect(() => {
    setPaymentLog(prev => prev.length === contractDuration ? prev : resizePaymentLog(prev, contractDuration));
  }, [contractDuration]);

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
  }, [currentClub?.id]);

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
      const { data: club } = currentClub?.id
        ? await supabase.from('clients').select('*').eq('id', currentClub.id).single()
        : { data: null as ClientType | null };
      if (club) {
        setClubId(club.id);
        setClubName(club.name);
        setSeason(club.current_season);
        setLogoPreview(club.logo_url);
        setPrimaryColor(club.primary_color || '#10b981');
        setSecondaryColor(club.secondary_color || '#0f172a');
        setTertiaryColor(club.tertiary_color || '#f59e0b');
        setBackgroundPreview(club.background_image_url || null);
        setSubscriptionStatus(club.subscription_status || 'trial');
        setPlanType((club.plan_type as PlanType) || 'basico');
        setSubscriptionStartDate(club.subscription_start_date || '');
        setSubscriptionEndDate(club.subscription_end_date || '');
        const savedLength = Array.isArray(club.payment_log) ? club.payment_log.length : 12;
        const duration = (CONTRACT_DURATION_OPTIONS as readonly number[]).includes(savedLength)
          ? (savedLength as ContractDuration)
          : 12;
        setContractDuration(duration);
        setMonthlyFee(String(club.monthly_fee ?? 0));
        setPaymentLog(normalizePaymentLog(club.payment_log, duration));
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
      const payload: Record<string, unknown> = {
        name: clubName,
        current_season: season,
        logo_url: logoPreview,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        tertiary_color: tertiaryColor,
        background_image_url: backgroundPreview,
      };
      if (isSuperAdmin) {
        payload.subscription_status = subscriptionStatus;
        payload.plan_type = planType;
        payload.subscription_start_date = subscriptionStartDate || null;
        payload.subscription_end_date = subscriptionEndDate || null;
        payload.monthly_fee = Number(monthlyFee) || 0;
        payload.payment_log = paymentLog;
      }
      let error;
      if (clubId) {
        ({ error } = await supabase.from('clients').update(payload).eq('id', clubId));
      } else {
        const { data, error: err } = await supabase.from('clients').insert([payload]).select().single();
        if (data) setClubId(data.id);
        error = err;
      }
      if (error?.message?.includes('plan_type')) {
        // `plan_type` es una columna nueva: si la migración todavía no se
        // ejecutó en Supabase, reintentamos sin ese campo para no bloquear
        // el guardado del resto de datos del club.
        const { plan_type: _pt, ...fallbackPayload } = payload;
        if (clubId) {
          ({ error } = await supabase.from('clients').update(fallbackPayload).eq('id', clubId));
        } else {
          const { data, error: err } = await supabase.from('clients').insert([fallbackPayload]).select().single();
          if (data) setClubId(data.id);
          error = err;
        }
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
        .from('clients').select('current_season, name').eq('id', clubId).single();
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
      const { error: updateErr } = await supabase.from('clients').update({ current_season: nextSeason }).eq('id', clubId);
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

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBackgroundPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const tabs = isSuperAdmin
    ? [
        { id: 'usuarios', label: 'Usuarios y Roles', icon: Users },
        { id: 'club', label: 'Configuración Club', icon: Shield },
        { id: 'ratings', label: 'Pesos Valoración', icon: Sliders },
        { id: 'database', label: 'Base de Datos', icon: Database },
      ]
    : [
        { id: 'usuarios', label: 'Usuarios y Roles', icon: Users },
        { id: 'ratings', label: 'Pesos Valoración', icon: Sliders },
      ];

  useEffect(() => {
    if (!tabs.some(tab => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [activeTab, tabs]);

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
          {activeTab === 'usuarios' && <UsersTab currentUserRole={currentRole} clubId={clubId} />}

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
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden group/logo relative">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain" />
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

              {/* ── Foto de fondo ─────────────────────────────────────────── */}
              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center py-4 bg-slate-950/50 p-6 rounded-2xl border border-slate-800/50">
                <div
                  className="w-40 h-24 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden bg-cover bg-center shrink-0"
                  style={backgroundPreview ? { backgroundImage: `url(${backgroundPreview})` } : undefined}
                />
                <div className="space-y-4 flex-1">
                  <div>
                    <p className="text-sm font-bold text-slate-200">Foto de Fondo</p>
                    <p className="text-xs text-slate-500">Se usará en la cabecera del Dashboard (campo o instalaciones del club).</p>
                  </div>
                  <input type="file" ref={bgFileInputRef} onChange={handleBackgroundChange} accept="image/*" className="hidden" />
                  <button
                    onClick={() => bgFileInputRef.current?.click()}
                    className="flex items-center gap-2 py-3 px-6 bg-slate-800 text-slate-200 font-black rounded-xl hover:bg-slate-700 transition-all active:scale-95"
                  >
                    <Upload size={18} />
                    Actualizar Foto
                  </button>
                </div>
              </div>

              {/* ── Colores del club ──────────────────────────────────────── */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest px-1">Colores del club</label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: '1º Color', value: primaryColor, set: setPrimaryColor },
                    { label: '2º Color', value: secondaryColor, set: setSecondaryColor },
                    { label: '3º Color', value: tertiaryColor, set: setTertiaryColor },
                  ].map(c => (
                    <div key={c.label} className="space-y-1">
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{c.label}</span>
                      <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2">
                        <input type="color" value={c.value} onChange={e => c.set(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent" />
                        <input value={c.value} onChange={e => c.set(e.target.value)} className="flex-1 min-w-0 bg-transparent text-slate-200 text-xs outline-none" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── Suscripción (solo SUPERADMIN) ────────────────────────── */}
              {isSuperAdmin && (
                <div className="space-y-3 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5">
                  <label className="text-xs font-black text-emerald-400 uppercase tracking-widest px-1">Suscripción (solo tú la ves)</label>

                  {/* ── Versión contratada ── */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Versión contratada</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {(Object.keys(PLAN_INFO) as PlanType[]).map(plan => {
                        const info = PLAN_INFO[plan];
                        const selected = planType === plan;
                        return (
                          <button
                            key={plan}
                            type="button"
                            onClick={() => setPlanType(plan)}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all active:scale-95",
                              selected
                                ? "border-emerald-500 bg-emerald-500/10"
                                : "border-slate-800 bg-slate-950 hover:border-slate-600"
                            )}
                          >
                            <span className={cn(
                              "w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                              selected ? "bg-emerald-500 border-emerald-500" : "border-slate-600"
                            )}>
                              {selected && <Check size={15} strokeWidth={3.5} className="text-slate-950" />}
                            </span>
                            <span className="min-w-0">
                              <span className={cn("block text-xs font-black uppercase tracking-wide", selected ? "text-emerald-300" : "text-slate-300")}>
                                {info.label}
                              </span>
                              <span className="block text-[10px] text-slate-500">{info.description}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-500 px-1 leading-relaxed">
                      El límite de usuarios se aplica automáticamente: si el club ya supera el límite del plan elegido, la base de datos rechazará el cambio al guardar.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1.5 flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest min-h-[16px] flex items-end">Estado</span>
                      <select value={subscriptionStatus} onChange={e => setSubscriptionStatus(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-slate-200 text-sm outline-none focus:border-emerald-500">
                        <option value="trial">Prueba</option>
                        <option value="active">Activa</option>
                        <option value="expired">Caducada</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest min-h-[16px] flex items-end">Duración contrato</span>
                      <select value={contractDuration} onChange={e => setContractDuration(Number(e.target.value) as ContractDuration)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-slate-200 text-sm outline-none focus:border-emerald-500">
                        <option value={3}>3 meses</option>
                        <option value={6}>6 meses</option>
                        <option value={12}>1 año</option>
                      </select>
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest min-h-[16px] flex items-end">Cuota mensual (€)</span>
                      <div className="relative">
                        <input type="number" min="0" step="0.01" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-7 py-3 text-slate-200 text-sm outline-none focus:border-emerald-500" />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm pointer-events-none">€</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest min-h-[16px] flex items-end">Fecha de activación</span>
                      <input type="date" value={subscriptionStartDate?.slice(0, 10) || ''} onChange={e => setSubscriptionStartDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-3 text-slate-200 text-sm outline-none focus:border-emerald-500 [color-scheme:dark]" />
                    </div>
                    <div className="space-y-1.5 flex flex-col">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest min-h-[16px] flex items-end">Fin de suscripción (auto)</span>
                      <input type="date" value={subscriptionEndDate?.slice(0, 10) || ''} readOnly disabled
                        title="Se calcula automáticamente a partir de la fecha de activación y la duración del contrato."
                        className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-3 text-slate-400 text-sm outline-none cursor-not-allowed [color-scheme:dark]" />
                    </div>
                  </div>

                  {/* ── Calendario de pagos: mes a mes según duración del contrato ── */}
                  <div className="pt-4 mt-2 border-t border-emerald-500/10">
                    <div className="flex items-center justify-between mb-3 px-1 max-w-xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar size={13} className="text-emerald-400" />
                        Pagos ({paymentLog.filter(p => p.paid).length}/{paymentLog.length})
                      </span>
                    </div>
                    {!subscriptionStartDate && (
                      <p className="text-[10px] text-amber-400/80 mb-2 px-1 max-w-xs">Define la fecha de activación para ver los meses.</p>
                    )}
                    <div className="space-y-2 max-w-xs">
                      {paymentLog.map((entry, i) => {
                        const { label } = monthLabelFromStart(subscriptionStartDate?.slice(0, 10) || '', i);
                        const isLast = i === paymentLog.length - 1;
                        return (
                          <div
                            key={i}
                            className={cn(
                              "flex flex-wrap items-center gap-x-2.5 gap-y-1.5 rounded-xl border px-3 py-2.5 transition-colors",
                              isLast
                                ? "border-rose-500/40 bg-rose-500/5"
                                : entry.paid
                                  ? "border-emerald-500/30 bg-emerald-500/5"
                                  : "border-slate-800 bg-slate-950/50"
                            )}
                          >
                            {/* Mes */}
                            <span className={cn(
                              "text-xs font-black uppercase tracking-wide shrink-0",
                              isLast ? "text-rose-400" : "text-slate-300"
                            )}>
                              {label}
                            </span>
                            <div className="flex items-center gap-2 ml-auto">
                              {/* Check de pago */}
                              <button
                                type="button"
                                onClick={() => setPaymentLog(prev => prev.map((p, idx) => idx === i
                                  ? { paid: !p.paid, paid_date: !p.paid
                                      ? (p.paid_date || monthLabelFromStart(subscriptionStartDate?.slice(0, 10) || '', i).iso || new Date().toISOString().slice(0, 10))
                                      : p.paid_date }
                                  : p))}
                                className={cn(
                                  "w-7 h-7 rounded-md border-2 flex items-center justify-center shrink-0 transition-all active:scale-90",
                                  entry.paid
                                    ? (isLast ? "bg-rose-500 border-rose-500" : "bg-emerald-500 border-emerald-500")
                                    : "border-slate-600 hover:border-slate-400"
                                )}
                                aria-label={entry.paid ? 'Marcar como no pagado' : 'Marcar como pagado'}
                              >
                                {entry.paid && <Check size={16} strokeWidth={3.5} className="text-slate-950" />}
                              </button>
                              {/* Fecha del pago */}
                              <input
                                type="date"
                                value={entry.paid_date?.slice(0, 10) || ''}
                                onChange={e => setPaymentLog(prev => prev.map((p, idx) => idx === i
                                  ? { paid: e.target.value ? true : p.paid, paid_date: e.target.value || null }
                                  : p))}
                                className={cn(
                                  "w-[150px] shrink-0 bg-slate-950 border rounded-lg px-2.5 py-2 text-xs outline-none [color-scheme:dark] transition-colors",
                                  isLast
                                    ? "border-rose-500/30 text-rose-300 focus:border-rose-500"
                                    : "border-slate-800 text-slate-300 focus:border-emerald-500"
                                )}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2.5 px-1 leading-relaxed max-w-xs">
                      El último mes aparece <span className="text-rose-400 font-bold">en rojo</span> para recordarte que finaliza la suscripción y toca renovar. Recuerda pulsar <span className="text-emerald-400 font-bold">Guardar cambios</span>.
                    </p>
                  </div>
                </div>
              )}

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
              {(currentRole === 'ADMIN' || isSuperAdmin) && (
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
