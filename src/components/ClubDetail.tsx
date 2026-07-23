import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { ArrowLeft, Shield, MapPin, Users, Save, Upload, Loader2, X, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { findOrCreateClub, normalizeClubName } from '../lib/clubs';
import { calculateCategory } from '../lib/utils';
import { resolveProvinceAndCommunity } from '../lib/geo';
import imageCompression from 'browser-image-compression';

type CategoryStat = { id: string; count: number };

const CATEGORY_COLORS: Record<string, string> = {
  'SENIOR': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'JUVENIL': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'CADETE': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'INFANTIL': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'ALEVÍN': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'BENJAMÍN': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  'PRE-BENJAMÍN': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

interface Props {
  clubName: string;
  onBack: () => void;
  ownerClubId?: string | null;
}

export function ClubDetail({ clubName, onBack, ownerClubId }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compressing, setCompressing] = useState(false);

  const [clubId, setClubId] = useState<string | null>(null);
  const [name, setName] = useState(clubName);
  const [location, setLocation] = useState('');
  const [province, setProvince] = useState('');
  const [autonomousCommunity, setAutonomousCommunity] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [saved, setSaved] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1>(0);
  const [deleting, setDeleting] = useState(false);
  const [detectingGeo, setDetectingGeo] = useState(false);
  const lastDetectedCity = useRef('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const originalName = useRef(clubName);

  useEffect(() => {
    loadData();
  }, [clubName, ownerClubId]);

  // Autogestiona Provincia y Comunidad Autónoma a partir de la Ciudad: al
  // salir del campo Ciudad se resuelve automáticamente (tabla local de
  // capitales/municipios conocidos y, si no está, geocodificación gratuita
  // vía OpenStreetMap/Nominatim). El usuario puede seguir corrigiendo el
  // resultado a mano si hiciera falta.
  const handleCityBlur = async () => {
    const city = location.trim();
    if (!city || city === lastDetectedCity.current) return;
    lastDetectedCity.current = city;
    setDetectingGeo(true);
    try {
      const geo = await resolveProvinceAndCommunity(city);
      if (geo.province) setProvince(geo.province);
      if (geo.autonomous_community) setAutonomousCommunity(geo.autonomous_community);
    } finally {
      setDetectingGeo(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const targetKey = normalizeClubName(clubName);

      // Club GLOBAL compartido: se busca por nombre normalizado (sin
      // acentos/mayusculas/puntuacion) para que el escudo y la localizacion
      // configurados por un cliente aparezcan igual para todos, sin importar
      // cómo haya escrito el nombre del club cada uno.
      // `province`/`autonomous_community` son columnas nuevas: si la migración
      // todavía no se ejecutó en Supabase, la consulta falla y se reintenta
      // sin esas columnas para no dejar el club sin datos.
      let allClubs: any[] | null = null;
      const extended = await supabase
        .from('clubs')
        .select('id, name, location, province, autonomous_community, logo_url');
      if (extended.error) {
        console.warn('Columnas province/autonomous_community no disponibles todavía en `clubs` (falta ejecutar la migración). Usando consulta básica.', extended.error);
        const basic = await supabase
          .from('clubs')
          .select('id, name, location, logo_url');
        allClubs = basic.data;
      } else {
        allClubs = extended.data;
      }
      const clubData = (allClubs || []).find(c => normalizeClubName(c.name) === targetKey) || null;

      // Detect categories from players — SOLO los jugadores seguidos por el
      // cliente activo (owner_club_id), agrupados por el mismo club
      // normalizado (nunca los de otros clientes que compartan el mismo club).
      let playersQuery = supabase
        .from('players')
        .select('birth_year, club_name');
      if (ownerClubId) playersQuery = playersQuery.eq('owner_club_id', ownerClubId);
      const { data: playersData } = await playersQuery;
      const relevantPlayers = (playersData || []).filter(p => normalizeClubName(p.club_name || '') === targetKey);

      const catMap = new Map<string, number>();
      for (const p of relevantPlayers) {
        const cat = calculateCategory(p.birth_year);
        catMap.set(cat, (catMap.get(cat) || 0) + 1);
      }
      setCategories(Array.from(catMap.entries()).map(([id, count]) => ({ id, count })));

      if (clubData) {
        setClubId(clubData.id);
        setName(clubData.name || clubName);
        setLocation(clubData.location || '');
        setProvince((clubData as any).province || '');
        setAutonomousCommunity((clubData as any).autonomous_community || '');
        setLogoUrl(clubData.logo_url || null);
        lastDetectedCity.current = clubData.location || '';
      } else {
        setClubId(null);
        setName(clubName);
        setLocation('');
        setProvince('');
        setAutonomousCommunity('');
        setLogoUrl(null);
        lastDetectedCity.current = '';
      }
    } catch (err) {
      console.error('Error loading club detail:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCompressing(true);
    try {
      let resolvedClubId = clubId;

      // El ID permite usar siempre el mismo objeto de Storage para este club.
      // Busca primero (catálogo GLOBAL) para no duplicar un club que ya haya
      // dado de alta otro cliente antes de crear uno nuevo.
      if (!resolvedClubId) {
        const club = await findOrCreateClub(name.trim() || clubName, {
          location: location.trim() || null,
          province: province.trim() || null,
          autonomous_community: autonomousCommunity.trim() || null,
        });
        if (!club) throw new Error('No se pudo crear el club.');
        resolvedClubId = club.id;
        setClubId(club.id);
      }

      // Comprimir manteniendo PNG para preservar transparencia de escudos
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.08,
        maxWidthOrHeight: 300,
        useWebWorker: true,
        initialQuality: 0.85,
        fileType: 'image/png',
      });

      // Subir a Supabase Storage (bucket club-logos)
      const path = `${resolvedClubId}.png`;
      const { error } = await supabase.storage
        .from('club-logos')
        .upload(path, compressed, {
          upsert: true,
          contentType: 'image/png',
          cacheControl: '3600',
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('club-logos')
        .getPublicUrl(path);
      const nextLogoUrl = `${publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase
        .from('clubs')
        .update({
          logo_url: nextLogoUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', resolvedClubId);

      if (updateError) throw updateError;

      // Limpia el archivo legado con nombre fechado tras migrar al nombre estable.
      const storageMarker = '/storage/v1/object/public/club-logos/';
      const oldPath = logoUrl?.split(storageMarker)[1]?.split('?')[0];
      if (oldPath && oldPath !== path) {
        const { error: removeError } = await supabase.storage
          .from('club-logos')
          .remove([decodeURIComponent(oldPath)]);

        if (removeError) {
          console.warn('No se pudo borrar el escudo anterior:', removeError);
        }
      }

      setLogoUrl(nextLogoUrl);
    } catch (err: any) {
      console.error('Error uploading logo:', err);
      if (err?.message?.includes('Bucket not found') || err?.statusCode === 404) {
        alert('El bucket "club-logos" no existe todavía.\nEjecuta el archivo club_logos_storage_migration.sql en el editor SQL de Supabase.');
      } else {
        alert('Error al subir el escudo: ' + (err?.message || err));
      }
    } finally {
      setCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        location: location.trim() || null,
        province: province.trim() || null,
        autonomous_community: autonomousCommunity.trim() || null,
        logo_url: logoUrl || null,
        current_season: '2026/2027',
        updated_at: new Date().toISOString(),
      };

      // `province`/`autonomous_community` son columnas nuevas: si la migración
      // aún no se ejecutó en Supabase, el update/insert falla; se reintenta
      // sin esos dos campos para no bloquear el guardado del resto de datos.
      const updateClub = async (id: string) => {
        const { error } = await supabase.from('clubs').update(payload).eq('id', id);
        if (error) {
          console.warn('No se pudieron guardar province/autonomous_community (falta ejecutar la migración). Reintentando sin esos campos.', error);
          const { province: _p, autonomous_community: _ac, ...fallbackPayload } = payload;
          await supabase.from('clubs').update(fallbackPayload).eq('id', id);
        }
      };

      let resolvedClubId = clubId;
      if (clubId) {
        await updateClub(clubId);
      } else {
        // Busca primero (catálogo GLOBAL) para no duplicar un club que ya
        // exista de otro cliente; si existe, actualiza sus datos en vez de
        // crear una fila nueva.
        let club = await findOrCreateClub(payload.name, {
          location: payload.location,
          province: payload.province,
          autonomous_community: payload.autonomous_community,
          logo_url: payload.logo_url,
        });
        if (!club) {
          club = await findOrCreateClub(payload.name, {
            location: payload.location,
            logo_url: payload.logo_url,
          });
        }
        if (club) {
          resolvedClubId = club.id;
          setClubId(club.id);
          await updateClub(club.id);
        }
      }

      // Propaga el cambio de nombre a los jugadores de TODOS los clientes que
      // siguen este club (es un catálogo compartido). Se usa club_id (vínculo
      // fiable) y, como red de seguridad para datos antiguos sin club_id, el
      // texto exacto anterior.
      if (name.trim() !== originalName.current) {
        if (resolvedClubId) {
          await supabase
            .from('players')
            .update({ club_name: name.trim() })
            .eq('club_id', resolvedClubId);
        }
        await supabase
          .from('players')
          .update({ club_name: name.trim() })
          .eq('club_name', originalName.current)
          .is('club_id', null);
        originalName.current = name.trim();
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('Error saving club:', err);
      alert('Error al guardar el club.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!clubId) { onBack(); return; }
    setDeleting(true);
    try {
      // Desligar jugadores para no romper FK
      await supabase.from('players').update({ club_id: null }).eq('club_id', clubId);
      await supabase.from('profiles').update({ club_id: null }).eq('club_id', clubId);
      await supabase.from('categories').delete().eq('club_id', clubId);
      await supabase.from('rating_weights').delete().eq('club_id', clubId);
      const { error } = await supabase.from('clubs').delete().eq('id', clubId);
      if (error) throw error;
      onBack();
    } catch (err: any) {
      alert('Error al eliminar el club: ' + (err?.message || err));
      setDeleting(false);
      setDeleteStep(0);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Cargando...</p>
      </div>
    );
  }

  const totalPlayers = categories.reduce((s, c) => s + c.count, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-2xl">
      {/* Back + title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 text-slate-400 hover:text-white transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-100 leading-tight">{clubName}</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Editor de club</p>
        </div>
      </div>

      {/* Logo */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-5">Escudo del Club</p>
        <div className="flex items-center gap-6">
          {/* Preview */}
          <div className="w-24 h-24 bg-slate-950 border-2 border-dashed border-slate-700 rounded-2xl flex items-center justify-center overflow-hidden relative group shrink-0">
            {compressing ? (
              <Loader2 className="w-7 h-7 text-emerald-500 animate-spin" />
            ) : logoUrl ? (
              <>
                <img src={logoUrl} alt="Escudo" className="w-20 h-20 object-contain" />
                <button
                  onClick={() => setLogoUrl(null)}
                  className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={18} className="text-white" />
                </button>
              </>
            ) : (
              <Shield size={34} className="text-slate-700" />
            )}
          </div>

          {/* Upload controls */}
          <div className="space-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={compressing}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-300 hover:border-emerald-500/40 hover:text-white transition-all font-bold disabled:opacity-50"
            >
              <Upload size={13} />
              {compressing ? 'Comprimiendo...' : 'Subir Escudo'}
            </button>
            <p className="text-[10px] text-slate-600 leading-snug">
              PNG recomendado (transparencia) · máx. 80 KB · 300 px<br />
              Se sube al bucket <span className="font-mono text-slate-500">club-logos</span>
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>
      </div>

      {/* Info fields */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Información</p>

        <div className="space-y-2">
          <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
            Nombre del Club
          </label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50 font-bold transition-colors"
            placeholder="Nombre del club"
          />
          {name !== originalName.current && (
            <p className="text-[10px] text-amber-400 px-1">
              Se actualizará el nombre en todos los jugadores de este club.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1">
              Ciudad
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                onBlur={handleCityBlur}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors"
                placeholder="Vigo, Porriño, Lugo..."
              />
            </div>
            <p className="text-[10px] text-slate-600 px-1">
              Provincia y Comunidad Autónoma se rellenan solas al escribir la ciudad.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
              Provincia
              {detectingGeo && <Loader2 size={10} className="animate-spin text-emerald-500" />}
            </label>
            <input
              value={province}
              onChange={e => setProvince(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors"
              placeholder="Autodetectada al escribir la ciudad..."
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-1 flex items-center gap-1.5">
              Comunidad Autónoma
              {detectingGeo && <Loader2 size={10} className="animate-spin text-emerald-500" />}
            </label>
            <input
              value={autonomousCommunity}
              onChange={e => setAutonomousCommunity(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-emerald-500/50 transition-colors"
              placeholder="Autodetectada al escribir la ciudad..."
            />
          </div>
        </div>
      </div>

      {/* Categories (auto-detected) */}
      {categories.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-5">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Categorías en Seguimiento
            </p>
            <div className="flex items-center gap-1.5 text-slate-500">
              <Users size={12} />
              <span className="text-xs font-bold">{totalPlayers}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map(cat => (
              <div
                key={cat.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${CATEGORY_COLORS[cat.id] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}
              >
                <span className="text-[10px] font-black">
                  {cat.id}
                </span>
                <span className="flex items-center gap-1 text-[9px] opacity-60">
                  <Users size={9} />
                  {cat.count}
                </span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-3">
            Detectadas automáticamente a partir de los jugadores en seguimiento.
          </p>
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || !name.trim()}
        className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 ${
          saved
            ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20'
            : 'bg-emerald-600 text-slate-950 hover:bg-emerald-500 shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
        }`}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Save size={14} />
        )}
        {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar Cambios'}
      </button>

      {/* Delete zone */}
      <div className="border-t border-slate-800 pt-6 space-y-3">
        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Zona de peligro</p>
        {deleteStep === 0 ? (
          <button
            onClick={() => setDeleteStep(1)}
            disabled={deleting}
            className="w-full py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-red-500/20 text-red-500 hover:bg-red-500/10 flex items-center justify-center gap-2"
          >
            <Trash2 size={14} />
            Eliminar Club
          </button>
        ) : (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-black text-red-300">¿Eliminar "{name}"?</p>
                <p className="text-[11px] text-red-400/70 mt-1">
                  Se borrará el registro del club de la base de datos. Los jugadores conservarán su nombre de club pero perderán el vínculo.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteStep(0)}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest bg-red-600 hover:bg-red-500 text-white transition-all flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
