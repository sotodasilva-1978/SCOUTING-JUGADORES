import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Building2, Upload, Loader2, CheckCircle, AlertCircle, Copy, Eye, EyeOff, Users as UsersIcon, Pencil, Ban, RotateCcw } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';
import type { Client } from '../types';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  active:  { label: 'Activa',   color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  trial:   { label: 'Prueba',   color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  expired: { label: 'Caducada', color: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
};

function ClubOverviewList({ onSelectClub }: { onSelectClub: (clubId: string) => void }) {
  const [clubs, setClubs] = useState<Client[]>([]);
  const [userCounts, setUserCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadClubs = async () => {
    setLoading(true);
    const { data } = await supabase.from('clients').select('*').order('name', { ascending: true });
    setClubs((data as Client[]) || []);
    const { data: profiles } = await supabase.from('profiles').select('club_id');
    const counts: Record<string, number> = {};
    (profiles || []).forEach((p: { club_id: string | null }) => {
      if (!p.club_id) return;
      counts[p.club_id] = (counts[p.club_id] || 0) + 1;
    });
    setUserCounts(counts);
    setLoading(false);
  };

  useEffect(() => { loadClubs(); }, []);

  const toggleAccess = async (c: Client) => {
    const nextStatus = c.subscription_status === 'active' ? 'expired' : 'active';
    const msg = nextStatus === 'expired'
      ? `¿Cancelar el acceso de "${c.name}"? No podrán entrar hasta que reactives la suscripción.`
      : `¿Reactivar el acceso de "${c.name}"?`;
    if (!window.confirm(msg)) return;
    setUpdatingId(c.id);
    await supabase.from('clients').update({ subscription_status: nextStatus }).eq('id', c.id);
    await loadClubs();
    setUpdatingId(null);
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-600" /></div>;
  if (clubs.length === 0) return <p className="text-sm text-slate-500 py-6 text-center">Todavía no hay clubes dados de alta.</p>;

  return (
    <div className="space-y-2">
      {clubs.map(c => {
        const status = STATUS_LABEL[c.subscription_status || 'trial'];
        const isActive = c.subscription_status === 'active';
        return (
          <div key={c.id} className="flex flex-col gap-3 p-4 bg-slate-950/50 border border-slate-800/80 rounded-2xl sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <img src={c.logo_url || '/icon-master.png'} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" onError={(e) => { e.currentTarget.src = '/icon-master.png'; }} />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-200 text-sm truncate">{c.name}</p>
                <p className="text-[11px] text-slate-500 flex items-center gap-x-3 gap-y-1 flex-wrap">
                  <span className="flex items-center gap-1"><UsersIcon size={11} /> {userCounts[c.id] || 0} usuarios</span>
                  {c.subscription_end_date && <span>Hasta {c.subscription_end_date}</span>}
                  {c.monthly_fee ? <span>{c.monthly_fee}€/mes</span> : null}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap sm:shrink-0 sm:justify-end">
              <span className={cn("text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg border shrink-0", status.color)}>
                {status.label}
              </span>
              <button
                type="button"
                onClick={() => onSelectClub(c.id)}
                className="flex items-center gap-1.5 py-2 px-3 bg-slate-800 text-slate-200 text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-700 transition-colors shrink-0"
                title="Editar foto, logo, colores y precio"
              >
                <Pencil size={12} /> Editar
              </button>
              <button
                type="button"
                onClick={() => toggleAccess(c)}
                disabled={updatingId === c.id}
                className={cn(
                  "flex items-center gap-1.5 py-2 px-3 text-[11px] font-black uppercase tracking-widest rounded-lg transition-colors shrink-0 disabled:opacity-50",
                  isActive ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500/20" : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                )}
                title={isActive ? 'Cancelar acceso (impago / no renovación)' : 'Reactivar acceso'}
              >
                {updatingId === c.id
                  ? <Loader2 size={12} className="animate-spin" />
                  : isActive ? <Ban size={12} /> : <RotateCcw size={12} />}
                {isActive ? 'Cancelar' : 'Activar'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

const generateTempPassword = () =>
  Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-4).toUpperCase() + '!1';

const uploadBrandImage = async (file: File, bucket: string, path: string): Promise<string> => {
  let compressed: File = file;
  try {
    compressed = await imageCompression(file, {
      maxSizeMB: 0.09,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.85,
    });
  } catch {
    // si la compresión falla, sube el original
  }
  const { error } = await supabase.storage.from(bucket).upload(path, compressed, {
    upsert: true,
    contentType: 'image/jpeg',
    cacheControl: '3600',
  });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

interface PlatformAdminProps {
  onViewClub?: (clubId: string) => void;
}

export function PlatformAdmin({ onViewClub }: PlatformAdminProps) {
  const [clubName, setClubName] = useState('');
  const [season, setSeason] = useState('2026/2027');
  const [monthlyFee, setMonthlyFee] = useState('49');
  const [primaryColor, setPrimaryColor] = useState('#10b981');
  const [secondaryColor, setSecondaryColor] = useState('#0f172a');
  const [tertiaryColor, setTertiaryColor] = useState('#f59e0b');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bgFile, setBgFile] = useState<File | null>(null);
  const [bgPreview, setBgPreview] = useState<string | null>(null);
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState(generateTempPassword());
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('');
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [listKey, setListKey] = useState(0);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setClubName('');
    setSeason('2026/2027');
    setMonthlyFee('49');
    setPrimaryColor('#10b981');
    setSecondaryColor('#0f172a');
    setTertiaryColor('#f59e0b');
    setLogoFile(null);
    setLogoPreview(null);
    setBgFile(null);
    setBgPreview(null);
    setAdminName('');
    setAdminEmail('');
    setAdminPassword(generateTempPassword());
  };

  const canSubmit = clubName.trim() && adminName.trim() && adminEmail.trim() && adminPassword.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setResult(null);

    try {
      // 1) Subir escudo y foto de fondo (si se han seleccionado)
      let logoUrl: string | null = null;
      let backgroundUrl: string | null = null;
      const slug = clubName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40);

      if (logoFile) {
        setStep('Subiendo escudo...');
        logoUrl = await uploadBrandImage(logoFile, 'club-logos', `${slug}-${Date.now()}.jpg`);
      }
      if (bgFile) {
        setStep('Subiendo foto de fondo...');
        backgroundUrl = await uploadBrandImage(bgFile, 'imagenes-ayuda', `${slug}-bg-${Date.now()}.jpg`);
      }

      // 2) Crear el cliente (tabla "clients", totalmente separada del catálogo de clubes reales)
      setStep('Creando el club...');
      const clientPayload = {
        name: clubName.trim(),
        current_season: season.trim(),
        logo_url: logoUrl,
        background_image_url: backgroundUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        tertiary_color: tertiaryColor,
        subscription_status: 'active',
        subscription_start_date: new Date().toISOString().slice(0, 10),
        subscription_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        monthly_fee: Number(monthlyFee) || 0,
      };

      const { data: club, error: clubErr } = await supabase
        .from('clients').insert([clientPayload]).select().single();
      if (clubErr) throw clubErr;
      if (!club) throw new Error('No se pudo crear el club.');

      // 3) Crear el usuario administrador (endpoint público de signup, sin service key)
      setStep('Creando la cuenta del administrador...');
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          email: adminEmail.trim(),
          password: adminPassword,
          data: { full_name: adminName.trim() },
        }),
      });
      const authJson = await res.json();
      if (!res.ok) {
        const msg = authJson?.msg || authJson?.message || authJson?.error_description || `Error ${res.status}`;
        throw new Error(msg);
      }
      const authUserId = authJson?.user?.id || authJson?.id;
      if (!authUserId) throw new Error('No se pudo crear el usuario administrador.');

      // 4) Vincular el perfil del administrador a su nuevo club
      setStep('Vinculando el administrador al club...');
      const { error: profileErr } = await supabase.from('profiles').upsert([{
        user_id: authUserId,
        email: adminEmail.trim(),
        full_name: adminName.trim(),
        role: 'ADMIN',
        club_id: club.id,
        active: true,
      }], { onConflict: 'user_id' });
      if (profileErr) throw new Error('Club creado, pero el perfil del admin falló: ' + profileErr.message);

      setResult({
        ok: true,
        msg: `Club "${clubName}" creado. Entrega estas credenciales al responsable:\n\nEmail: ${adminEmail}\nContraseña temporal: ${adminPassword}`,
      });
      resetForm();
      setListKey(k => k + 1);
    } catch (err: any) {
      setResult({ ok: false, msg: err?.message || String(err) });
    } finally {
      setSubmitting(false);
      setStep('');
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: (f: File | null) => void,
    setPreview: (u: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFile(file);
    setPreview(URL.createObjectURL(file));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-20">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Building2 className="text-emerald-500" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white italic uppercase tracking-tight">Clubes clientes o colaboradores</h1>
            <p className="text-xs text-slate-500">Haz clic en un club para verlo y editar su marca, suscripción y usuarios en Configuración.</p>
          </div>
        </div>
        <ClubOverviewList key={listKey} onSelectClub={(id) => onViewClub?.(id)} />
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <Building2 className="text-emerald-500" size={20} />
        </div>
        <div>
          <h1 className="text-xl font-black text-white italic uppercase tracking-tight">Alta de club nuevo</h1>
          <p className="text-xs text-slate-500">Crea un club-cliente con su marca y su administrador, sin tocar Supabase.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-6">
        {/* Datos del club */}
        <section className="space-y-4">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Datos del club</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre del club</span>
              <input value={clubName} onChange={e => setClubName(e.target.value)} required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-emerald-500/60"
                placeholder="Ej. CD Ejemplo FC" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Temporada</span>
              <input value={season} onChange={e => setSeason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-emerald-500/60" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cuota mensual (€)</span>
              <input type="number" min="0" step="0.01" value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-emerald-500/60" />
            </label>
          </div>
        </section>

        {/* Colores */}
        <section className="space-y-4">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Colores del club</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Primario', value: primaryColor, set: setPrimaryColor },
              { label: 'Secundario', value: secondaryColor, set: setSecondaryColor },
              { label: 'Terciario', value: tertiaryColor, set: setTertiaryColor },
            ].map(c => (
              <label key={c.label} className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{c.label}</span>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2">
                  <input type="color" value={c.value} onChange={e => c.set(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent" />
                  <input value={c.value} onChange={e => c.set(e.target.value)} className="flex-1 bg-transparent text-slate-200 text-xs outline-none" />
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Imágenes */}
        <section className="space-y-4">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Escudo y foto de fondo</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <button type="button" onClick={() => logoInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-slate-800 hover:border-emerald-500/50 transition-colors overflow-hidden">
                {logoPreview
                  ? <img src={logoPreview} alt="Escudo" className="h-full object-contain" />
                  : <><Upload size={20} className="text-slate-600" /><span className="text-[10px] text-slate-500 uppercase tracking-widest">Subir escudo</span></>}
              </button>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleFileChange(e, setLogoFile, setLogoPreview)} />
            </div>
            <div>
              <button type="button" onClick={() => bgInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed border-slate-800 hover:border-emerald-500/50 transition-colors overflow-hidden bg-cover bg-center"
                style={bgPreview ? { backgroundImage: `url(${bgPreview})` } : undefined}>
                {!bgPreview && <><Upload size={20} className="text-slate-600" /><span className="text-[10px] text-slate-500 uppercase tracking-widest">Subir foto de fondo</span></>}
              </button>
              <input ref={bgInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => handleFileChange(e, setBgFile, setBgPreview)} />
            </div>
          </div>
        </section>

        {/* Administrador */}
        <section className="space-y-4">
          <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Administrador del club</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nombre</span>
              <input value={adminName} onChange={e => setAdminName(e.target.value)} required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-emerald-500/60" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</span>
              <input type="email" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm outline-none focus:border-emerald-500/60" />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Contraseña temporal</span>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={adminPassword} onChange={e => setAdminPassword(e.target.value)} required minLength={6}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pr-20 text-slate-200 text-sm outline-none focus:border-emerald-500/60" />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button type="button" onClick={() => setAdminPassword(generateTempPassword())} className="p-2 text-slate-600 hover:text-slate-300" title="Generar otra">
                    <Copy size={14} />
                  </button>
                  <button type="button" onClick={() => setShowPassword(p => !p)} className="p-2 text-slate-600 hover:text-slate-300">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <span className="text-[10px] text-slate-600">Se la darás al club para su primer acceso; podrán cambiarla luego con "¿Olvidaste tu contraseña?".</span>
            </label>
          </div>
        </section>

        {result && (
          <div className={cn(
            "flex items-start gap-2 p-4 rounded-xl text-xs font-medium whitespace-pre-line",
            result.ok ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
          )}>
            {result.ok ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <AlertCircle size={16} className="shrink-0 mt-0.5" />}
            <span>{result.msg}</span>
          </div>
        )}

        <button type="submit" disabled={!canSubmit || submitting}
          className={cn(
            "w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2",
            !canSubmit || submitting ? "bg-slate-800 text-slate-500 cursor-not-allowed" : "bg-emerald-600 text-slate-900 hover:bg-emerald-500"
          )}>
          {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
          {submitting ? (step || 'Creando...') : 'Crear club'}
        </button>
      </form>
    </div>
  );
}
