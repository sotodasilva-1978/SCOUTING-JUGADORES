import type React from 'react';
import { X, Calendar, Trophy, MapPin, Tag, ChevronDown, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useRef, useEffect } from 'react';

interface NewMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  clubs?: string[];
}

interface TeamComboProps {
  value: string;
  onChange: (val: string) => void;
  clubs: string[];
  placeholder?: string;
}

function TeamCombo({ value, onChange, clubs, placeholder }: TeamComboProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (!value) setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [value]);

  const filtered = query.trim()
    ? clubs.filter(c => c.toLowerCase().includes(query.toLowerCase()))
    : clubs;

  const exactMatch = clubs.some(c => c.toLowerCase() === query.trim().toLowerCase());

  const select = (name: string) => {
    onChange(name);
    setQuery(name);
    setOpen(false);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onChange(e.target.value);
    setOpen(true);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={handleInput}
          onFocus={() => setOpen(true)}
          required
          placeholder={placeholder}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 pr-8 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        <ChevronDown
          size={14}
          className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>

      <AnimatePresence>
        {open && (filtered.length > 0 || (query.trim() && !exactMatch)) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute z-50 top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden max-h-48 flex flex-col"
          >
            <div className="overflow-y-auto flex-1">
              {filtered.map(club => (
                <button
                  key={club}
                  type="button"
                  onClick={() => select(club)}
                  className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                >
                  {club}
                </button>
              ))}
            </div>

            {query.trim() && !exactMatch && (
              <button
                type="button"
                onClick={() => select(query.trim())}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-emerald-400 hover:bg-slate-700 border-t border-slate-700 transition-colors shrink-0"
              >
                <Plus size={13} />
                <span>Añadir <strong>"{query.trim()}"</strong> como nuevo equipo</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function NewMatchModal({ isOpen, onClose, onSave, clubs = [] }: NewMatchModalProps) {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    date: today,
    home_team: '',
    away_team: '',
    category: '',
    competition: '',
    venue: '',
    score: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.home_team.trim() || !formData.away_team.trim() || !formData.competition.trim()) return;
    onSave({ ...formData, date: new Date(formData.date).toISOString() });
    setFormData({ date: today, home_team: '', away_team: '', category: '', competition: '', venue: '', score: '' });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-900/30 p-2.5 rounded-xl border border-emerald-700/40">
                  <Trophy size={20} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-100">Nuevo Partido</h2>
                  <p className="text-xs text-slate-500 font-medium">Registra un encuentro observado</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-300 bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Fecha */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Fecha
                </label>
                <div className="relative">
                  <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    required
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Equipos */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Equipo Local
                  </label>
                  <TeamCombo
                    value={formData.home_team}
                    onChange={val => setFormData(prev => ({ ...prev, home_team: val }))}
                    clubs={clubs}
                    placeholder="Buscar equipo…"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                    Equipo Visitante
                  </label>
                  <TeamCombo
                    value={formData.away_team}
                    onChange={val => setFormData(prev => ({ ...prev, away_team: val }))}
                    clubs={clubs}
                    placeholder="Buscar equipo…"
                  />
                </div>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Categoria
                </label>
                <div className="relative">
                  <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                  >
                    <option value="">Selecciona categoría</option>
                    <option value="Prebenjamin">Prebenjamín</option>
                    <option value="Benjamin">Benjamín</option>
                    <option value="Alevin">Alevín</option>
                    <option value="Infantil">Infantil</option>
                    <option value="Cadete">Cadete</option>
                    <option value="Juvenil">Juvenil</option>
                    <option value="Sub-23">Sub-23</option>
                    <option value="Senior">Sénior</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Futsal">Fútsal</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* Resultado */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Resultado <span className="text-slate-600 font-normal">(opcional)</span>
                </label>
                <input
                  type="text"
                  name="score"
                  value={formData.score}
                  onChange={handleChange}
                  placeholder="Ej: 2-1"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Competicion */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Competicion
                </label>
                <input
                  type="text"
                  name="competition"
                  value={formData.competition}
                  onChange={handleChange}
                  required
                  placeholder="Ej: Preferente Futsal Juvenil, 1ª Futgal Vigo..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>

              {/* Estadio */}
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">
                  Estadio / Campo <span className="text-slate-600 font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    name="venue"
                    value={formData.venue}
                    onChange={handleChange}
                    placeholder="Ej: Campo Municipal Norte"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-xl font-bold text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-black text-sm transition-all active:scale-95 shadow-lg shadow-emerald-900/30"
                >
                  Guardar Partido
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
