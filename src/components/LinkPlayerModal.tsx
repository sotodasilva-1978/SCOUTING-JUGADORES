import { X, Search, UserCheck, Link, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useMemo, useState } from 'react';
import { Player } from '../types';

interface LinkPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  allPlayers: Player[];
  alreadyLinkedIds: string[];
  onLink: (playerIds: string[]) => void;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Nuevo',
  TRACKING: 'Seguimiento',
  INTERESTING: 'Interesante',
  VERY_INTERESTING: 'Muy interesante',
  PRIORITY: 'Prioridad',
  CONTACTED: 'Contactado',
  ON_TRIAL: 'A prueba',
  SIGNED: 'Fichado',
  DISCARDED: 'Descartado',
  PENDING_VALIDATION: 'Pendiente',
  VALIDATED: 'Validado',
};

export function LinkPlayerModal({ isOpen, onClose, allPlayers, alreadyLinkedIds, onLink }: LinkPlayerModalProps) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [filterClub, setFilterClub] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const base = useMemo(
    () => allPlayers.filter(player => !alreadyLinkedIds.includes(player.id)),
    [allPlayers, alreadyLinkedIds],
  );

  const clubs = useMemo(
    () => [...new Set(base.map(player => player.club_name).filter(Boolean))].sort() as string[],
    [base],
  );

  const positions = useMemo(
    () => [...new Set(base.map(player => player.main_position).filter(Boolean))].sort() as string[],
    [base],
  );

  const statuses = useMemo(
    () => [...new Set(base.map(player => player.status).filter(Boolean))].sort() as string[],
    [base],
  );

  const available = useMemo(() => {
    let list = base;

    if (filterClub) list = list.filter(player => player.club_name === filterClub);
    if (filterPosition) list = list.filter(player => player.main_position === filterPosition);
    if (filterStatus) list = list.filter(player => player.status === filterStatus);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(player =>
        player.full_name.toLowerCase().includes(q) ||
        (player.club_name || '').toLowerCase().includes(q) ||
        (player.main_position || '').toLowerCase().includes(q),
      );
    }

    return list;
  }, [base, search, filterClub, filterPosition, filterStatus]);

  const activeFilters = [filterClub, filterPosition, filterStatus].filter(Boolean).length;

  const handleClose = () => {
    onClose();
    setSearch('');
    setSelected([]);
    setFilterClub('');
    setFilterPosition('');
    setFilterStatus('');
  };

  const handleConfirm = () => {
    if (selected.length === 0) return;
    onLink(selected);
    handleClose();
  };

  const togglePlayer = (playerId: string) => {
    setSelected(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId],
    );
  };

  const SelectFilter = ({
    value,
    onChange,
    options,
    placeholder,
  }: {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder: string;
  }) => (
    <div className="relative flex-1 min-w-0">
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className={`w-full appearance-none text-[11px] font-bold pr-6 pl-2.5 py-1.5 rounded-lg border transition-colors focus:outline-none cursor-pointer truncate ${
          value
            ? 'bg-emerald-900/40 border-emerald-500/50 text-emerald-400'
            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
        }`}
      >
        <option value="">{placeholder}</option>
        {options.map(option => (
          <option key={option} value={option}>{STATUS_LABELS[option] ?? option}</option>
        ))}
      </select>
      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="flex items-center justify-between mb-5 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-emerald-900/30 p-2.5 rounded-xl border border-emerald-700/40">
                  <Link size={18} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-100">Vincular jugadores</h2>
                  <p className="text-xs text-slate-500 font-medium">Selecciona uno o varios jugadores en seguimiento</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-slate-500 hover:text-slate-300 bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative mb-3 flex-shrink-0">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar por nombre, club o posicion..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                autoFocus
              />
            </div>

            <div className="flex gap-2 mb-4 flex-shrink-0">
              <SelectFilter value={filterClub} onChange={setFilterClub} options={clubs} placeholder="Equipo" />
              <SelectFilter value={filterPosition} onChange={setFilterPosition} options={positions} placeholder="Posicion" />
              <SelectFilter value={filterStatus} onChange={setFilterStatus} options={statuses} placeholder="Estado" />
              {activeFilters > 0 && (
                <button
                  onClick={() => {
                    setFilterClub('');
                    setFilterPosition('');
                    setFilterStatus('');
                  }}
                  className="flex-shrink-0 text-[11px] font-black text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/30 border border-red-800/40 px-2 py-1.5 rounded-lg transition-colors"
                >
                  x{activeFilters}
                </button>
              )}
            </div>

            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 flex-shrink-0">
              {available.length} jugador{available.length !== 1 ? 'es' : ''}
              {selected.length > 0 && <span className="text-emerald-500"> · {selected.length} seleccionado{selected.length > 1 ? 's' : ''}</span>}
            </p>

            <div className="overflow-y-auto flex-1 space-y-2 pr-1">
              {available.length === 0 && (
                <div className="py-10 text-center">
                  <UserCheck size={36} className="mx-auto text-slate-700 mb-3" />
                  <p className="text-slate-500 text-sm font-bold">
                    {allPlayers.length === alreadyLinkedIds.length
                      ? 'Todos los jugadores ya estan vinculados'
                      : 'No se encontraron jugadores'}
                  </p>
                </div>
              )}
              {available.map(player => {
                const isSelected = selected.includes(player.id);

                return (
                  <button
                    key={player.id}
                    onClick={() => togglePlayer(player.id)}
                    className={`w-full flex items-center gap-3 p-3 border rounded-2xl transition-all text-left group ${
                      isSelected
                        ? 'bg-emerald-900/30 border-emerald-500/60'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/50 hover:border-emerald-500/40'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-black text-base flex-shrink-0 transition-all ${
                      isSelected
                        ? 'bg-emerald-600 border-emerald-500 text-white'
                        : 'bg-slate-700 border-slate-600 text-emerald-400'
                    }`}>
                      {isSelected ? <Check size={18} /> : player.full_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-sm truncate transition-colors ${isSelected ? 'text-emerald-400' : 'text-slate-100 group-hover:text-emerald-400'}`}>
                        {player.full_name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {player.main_position} {player.club_name ? `- ${player.club_name}` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] font-black text-slate-500 bg-slate-700 px-2 py-0.5 rounded-full uppercase tracking-wider flex-shrink-0">
                      {STATUS_LABELS[player.status] ?? player.status}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex-shrink-0 pt-4 border-t border-slate-800 mt-3">
              <button
                onClick={handleConfirm}
                disabled={selected.length === 0}
                className="w-full py-3 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30"
              >
                {selected.length === 0
                  ? 'Selecciona jugadores'
                  : `Vincular ${selected.length} jugador${selected.length > 1 ? 'es' : ''}`}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
