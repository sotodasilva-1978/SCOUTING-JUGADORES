import { useMemo, useState } from 'react';
import { ChevronDown, Filter, User } from 'lucide-react';
import { calculateCategory, cn, formatRating, getSportName, sortCategories } from '../lib/utils';
import type { Player } from '../types';

type FormationSlot = {
  id: string;
  label: string;
  x: number;
  y: number;
  positions: string[];
};

type FormationDefinition = {
  id: string;
  label: string;
  slots: FormationSlot[];
};

type MetricKey =
  | 'global_rating'
  | 'potential_rating'
  | 'club_fit'
  | 'rating_technical'
  | 'rating_tactical'
  | 'rating_physical'
  | 'rating_mental';
type SortDirection = 'desc' | 'asc';
type SlotBoard = FormationSlot & { players: Player[] };

const POSITION_COMPATIBILITY: Record<string, string[]> = {
  POR: ['POR'],
  DFC: ['DFC', 'DF'],
  DF: ['DF', 'DFC'],
  LI: ['LI', 'CARR'],
  LD: ['LD', 'CARR'],
  CARR: ['CARR', 'LI', 'LD', 'MI', 'MD'],
  MCD: ['MCD', 'MC'],
  MC: ['MC', 'MCD', 'MCO'],
  MCO: ['MCO', 'MC', 'SD'],
  MI: ['MI', 'EI', 'CARR'],
  MD: ['MD', 'ED', 'CARR'],
  EI: ['EI', 'MI'],
  ED: ['ED', 'MD'],
  DC: ['DC', 'SD', 'MCO'],
  SD: ['SD', 'DC', 'MCO'],
};

function getSlotBoardDimensions(slot: FormationSlot) {
  const isCenterLane = slot.x >= 42 && slot.x <= 58;

  if (slot.y <= 24) {
    return { width: isCenterLane ? 132 : 124, cardHeight: 28, gap: 4 };
  }
  if (slot.y <= 36) {
    return { width: isCenterLane ? 140 : 132, cardHeight: 30, gap: 4 };
  }
  if (slot.y <= 50) {
    return { width: isCenterLane ? 150 : 140, cardHeight: 31, gap: 5 };
  }
  if (slot.y <= 62) {
    return { width: isCenterLane ? 154 : 146, cardHeight: 32, gap: 5 };
  }
  if (slot.y <= 78) {
    return { width: isCenterLane ? 160 : 150, cardHeight: 33, gap: 5 };
  }
  return { width: isCenterLane ? 146 : 138, cardHeight: 31, gap: 4 };
}

function PitchBoard({
  slotBoards,
  onSelectPlayer,
  metric,
}: {
  slotBoards: SlotBoard[];
  onSelectPlayer: (player: Player, tab?: string) => void;
  metric: MetricKey;
}) {
  const boardWidth = 680;
  const boardHeight = 820;
  const margin = 38;
  const pitchX = margin;
  const pitchY = margin;
  const pitchWidth = boardWidth - margin * 2;
  const pitchHeight = boardHeight - margin * 2;
  const centerX = boardWidth / 2;
  const centerY = boardHeight / 2;

  const penaltyAreaWidth = 360;
  const penaltyAreaDepth = 154;
  const goalAreaWidth = 164;
  const goalAreaDepth = 52;
  const goalWidth = 74;
  const goalDepth = 14;
  const centerCircleRadius = 82;
  const penaltySpotDistance = 102;
  const penaltyArcRadius = 82;
  const penaltyArcOffset = 57;

  return (
    <div className="relative h-[840px] w-[1040px] min-w-[1040px] rounded-[1.8rem] overflow-hidden border border-emerald-200/12 bg-[#0b2825] shadow-[0_30px_100px_rgba(2,8,10,0.55),inset_0_0_0_1px_rgba(255,255,255,0.03)]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_#113e39_0%,_#0e3531_48%,_#0b2b28_100%)]" />
        <div className="absolute inset-0 opacity-50 bg-[repeating-linear-gradient(90deg,_rgba(255,255,255,0.035)_0px,_rgba(255,255,255,0.035)_30px,_rgba(255,255,255,0.012)_30px,_rgba(255,255,255,0.012)_60px)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.08),_transparent_48%)]" />
        <div className="absolute inset-[14px] rounded-[1.35rem] border border-white/8 shadow-[inset_0_0_40px_rgba(255,255,255,0.02)]" />

        <svg
          viewBox={`0 0 ${boardWidth} ${boardHeight}`}
          className="absolute inset-0 w-full h-full"
          aria-hidden="true"
        >
          <g stroke="rgba(235,255,250,0.28)" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <rect x={pitchX} y={pitchY} width={pitchWidth} height={pitchHeight} rx="14" />
            <line x1={pitchX} y1={centerY} x2={pitchX + pitchWidth} y2={centerY} />
            <circle cx={centerX} cy={centerY} r={centerCircleRadius} />
            <circle cx={centerX} cy={centerY} r="3.5" fill="rgba(235,255,250,0.65)" stroke="none" />

            <rect x={centerX - penaltyAreaWidth / 2} y={pitchY} width={penaltyAreaWidth} height={penaltyAreaDepth} />
            <rect x={centerX - goalAreaWidth / 2} y={pitchY} width={goalAreaWidth} height={goalAreaDepth} />
            <rect x={centerX - goalWidth / 2} y={pitchY - goalDepth} width={goalWidth} height={goalDepth} rx="2" />
            <circle cx={centerX} cy={pitchY + penaltySpotDistance} r="3.5" fill="rgba(235,255,250,0.65)" stroke="none" />
            <path d={`M ${centerX - penaltyArcOffset} ${pitchY + penaltyAreaDepth} A ${penaltyArcRadius} ${penaltyArcRadius} 0 0 0 ${centerX + penaltyArcOffset} ${pitchY + penaltyAreaDepth}`} />

            <rect x={centerX - penaltyAreaWidth / 2} y={pitchY + pitchHeight - penaltyAreaDepth} width={penaltyAreaWidth} height={penaltyAreaDepth} />
            <rect x={centerX - goalAreaWidth / 2} y={pitchY + pitchHeight - goalAreaDepth} width={goalAreaWidth} height={goalAreaDepth} />
            <rect x={centerX - goalWidth / 2} y={pitchY + pitchHeight} width={goalWidth} height={goalDepth} rx="2" />
            <circle cx={centerX} cy={pitchY + pitchHeight - penaltySpotDistance} r="3.5" fill="rgba(235,255,250,0.65)" stroke="none" />
            <path d={`M ${centerX - penaltyArcOffset} ${pitchY + pitchHeight - penaltyAreaDepth} A ${penaltyArcRadius} ${penaltyArcRadius} 0 0 1 ${centerX + penaltyArcOffset} ${pitchY + pitchHeight - penaltyAreaDepth}`} />
          </g>
        </svg>

      {slotBoards.map(slot => (
        (() => {
          const dims = getSlotBoardDimensions(slot);
          const emptyCount = Math.max(0, 3 - slot.players.length);
          return (
            <div
              key={slot.id}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${slot.x}%`, top: `${slot.y}%`, width: `${dims.width}px` }}
            >
              <div className="mb-1.5 flex items-center justify-center">
                <div className="px-2.5 py-1 rounded-full bg-slate-950/65 border border-white/15">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300">{slot.label}</span>
                </div>
              </div>

              <div style={{ display: 'grid', rowGap: `${dims.gap}px` }}>
                {slot.players.map((player, index) => (
                  <button
                    key={`${slot.id}-${player.id}`}
                    type="button"
                    onClick={() => onSelectPlayer(player)}
                    className="w-full rounded-xl border border-emerald-300/10 bg-slate-950/58 px-2 py-1 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] transition-colors hover:border-emerald-300/35 hover:bg-slate-950/80"
                    style={{ height: `${dims.cardHeight}px` }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex items-center gap-2">
                        <div className="w-5 h-5 shrink-0 rounded-md overflow-hidden bg-slate-900 border border-white/10">
                          {player.avatar_url ? (
                            <img
                              src={player.avatar_url}
                              alt={getSportName(player.first_name, player.last_name, player.short_name)}
                              className="w-full h-full object-cover object-[center_20%]"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-500">
                              <User size={10} />
                            </div>
                          )}
                        </div>
                        <span className="truncate text-[9px] font-black uppercase tracking-[0.08em] text-slate-100">
                          {getSportName(player.first_name, player.last_name, player.short_name)}
                        </span>
                      </div>
                      <span className="shrink-0 text-[10px] font-black text-emerald-300">
                        {formatRating(getMetricValue(player, metric))}
                      </span>
                    </div>
                  </button>
                ))}
                {Array.from({ length: emptyCount }).map((_, index) => (
                  <div
                    key={`${slot.id}-empty-${index}`}
                    className="rounded-xl border border-dashed border-white/18 bg-slate-950/36 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]"
                    style={{ height: `${dims.cardHeight}px` }}
                  />
                ))}
              </div>
            </div>
          );
        })()
      ))}
    </div>
  );
}

const FORMATIONS: FormationDefinition[] = [
  {
    id: '4-3-3',
    label: '4-3-3',
    slots: [
      { id: 'gk', label: 'POR', x: 50, y: 89, positions: ['POR'] },
      { id: 'lb', label: 'LI', x: 25, y: 72, positions: ['LI'] },
      { id: 'lcb', label: 'DFC', x: 41, y: 73, positions: ['DFC', 'DF'] },
      { id: 'rcb', label: 'DFC', x: 59, y: 73, positions: ['DFC', 'DF'] },
      { id: 'rb', label: 'LD', x: 75, y: 72, positions: ['LD'] },
      { id: 'lcm', label: 'MC', x: 33, y: 49, positions: ['MC'] },
      { id: 'dm', label: 'MCD', x: 50, y: 55, positions: ['MCD'] },
      { id: 'rcm', label: 'MC', x: 67, y: 49, positions: ['MC'] },
      { id: 'lw', label: 'EI', x: 28, y: 28, positions: ['EI'] },
      { id: 'st', label: 'DC', x: 50, y: 20, positions: ['DC', 'SD'] },
      { id: 'rw', label: 'ED', x: 72, y: 28, positions: ['ED'] },
    ],
  },
  {
    id: '4-4-2',
    label: '4-4-2',
    slots: [
      { id: 'gk', label: 'POR', x: 50, y: 89, positions: ['POR'] },
      { id: 'lb', label: 'LI', x: 24, y: 72, positions: ['LI'] },
      { id: 'lcb', label: 'DFC', x: 41, y: 73, positions: ['DFC', 'DF'] },
      { id: 'rcb', label: 'DFC', x: 59, y: 73, positions: ['DFC', 'DF'] },
      { id: 'rb', label: 'LD', x: 76, y: 72, positions: ['LD'] },
      { id: 'lm', label: 'MI', x: 24, y: 47, positions: ['MI'] },
      { id: 'lcm', label: 'MC', x: 41, y: 50, positions: ['MC'] },
      { id: 'rcm', label: 'MC', x: 59, y: 50, positions: ['MC'] },
      { id: 'rm', label: 'MD', x: 76, y: 47, positions: ['MD'] },
      { id: 'stl', label: 'DC', x: 40, y: 19, positions: ['DC', 'SD'] },
      { id: 'str', label: 'DC', x: 60, y: 19, positions: ['DC', 'SD'] },
    ],
  },
  {
    id: '4-2-3-1',
    label: '4-2-3-1',
    slots: [
      { id: 'gk', label: 'POR', x: 50, y: 89, positions: ['POR'] },
      { id: 'lb', label: 'LI', x: 24, y: 72, positions: ['LI'] },
      { id: 'lcb', label: 'DFC', x: 41, y: 73, positions: ['DFC', 'DF'] },
      { id: 'rcb', label: 'DFC', x: 59, y: 73, positions: ['DFC', 'DF'] },
      { id: 'rb', label: 'LD', x: 76, y: 72, positions: ['LD'] },
      { id: 'dm1', label: 'MC', x: 41, y: 53, positions: ['MC'] },
      { id: 'dm2', label: 'MC', x: 59, y: 53, positions: ['MC'] },
      { id: 'lw', label: 'EI', x: 26, y: 34, positions: ['EI'] },
      { id: 'cam', label: 'MCO', x: 50, y: 33, positions: ['MCO'] },
      { id: 'rw', label: 'ED', x: 74, y: 34, positions: ['ED'] },
      { id: 'st', label: 'DC', x: 50, y: 15, positions: ['DC', 'SD'] },
    ],
  },
  {
    id: '4-1-4-1',
    label: '4-1-4-1',
    slots: [
      { id: 'gk', label: 'POR', x: 50, y: 89, positions: ['POR'] },
      { id: 'lb', label: 'LI', x: 23, y: 72, positions: ['LI'] },
      { id: 'lcb', label: 'DFC', x: 40, y: 73, positions: ['DFC', 'DF'] },
      { id: 'rcb', label: 'DFC', x: 60, y: 73, positions: ['DFC', 'DF'] },
      { id: 'rb', label: 'LD', x: 77, y: 72, positions: ['LD'] },
      { id: 'dm', label: 'MCD', x: 50, y: 54, positions: ['MCD'] },
      { id: 'lm', label: 'MI', x: 23, y: 43, positions: ['MI'] },
      { id: 'lcm', label: 'MC', x: 39, y: 39, positions: ['MC'] },
      { id: 'rcm', label: 'MC', x: 61, y: 39, positions: ['MC'] },
      { id: 'rm', label: 'MD', x: 77, y: 43, positions: ['MD'] },
      { id: 'st', label: 'DC', x: 50, y: 18, positions: ['DC', 'SD'] },
    ],
  },
  {
    id: '3-5-2',
    label: '3-5-2',
    slots: [
      { id: 'gk', label: 'POR', x: 50, y: 89, positions: ['POR'] },
      { id: 'lcb', label: 'DFC', x: 32, y: 71, positions: ['DFC', 'DF'] },
      { id: 'cb', label: 'DFC', x: 50, y: 70, positions: ['DFC', 'DF'] },
      { id: 'rcb', label: 'DFC', x: 68, y: 71, positions: ['DFC', 'DF'] },
      { id: 'lwb', label: 'CARR', x: 25, y: 42, positions: ['CARR', 'MI'] },
      { id: 'lcm', label: 'MC', x: 42, y: 51, positions: ['MC'] },
      { id: 'mco', label: 'MCO', x: 50, y: 35, positions: ['MCO'] },
      { id: 'rcm', label: 'MC', x: 58, y: 51, positions: ['MC'] },
      { id: 'rwb', label: 'CARR', x: 75, y: 42, positions: ['CARR', 'MD'] },
      { id: 'stl', label: 'DC', x: 39, y: 19, positions: ['DC', 'SD'] },
      { id: 'str', label: 'DC', x: 61, y: 19, positions: ['DC', 'SD'] },
    ],
  },
  {
    id: '3-4-3',
    label: '3-4-3',
    slots: [
      { id: 'gk', label: 'POR', x: 50, y: 89, positions: ['POR'] },
      { id: 'lcb', label: 'DFC', x: 32, y: 71, positions: ['DFC', 'DF'] },
      { id: 'cb', label: 'DFC', x: 50, y: 70, positions: ['DFC', 'DF'] },
      { id: 'rcb', label: 'DFC', x: 68, y: 71, positions: ['DFC', 'DF'] },
      { id: 'lm', label: 'MI', x: 25, y: 44, positions: ['MI'] },
      { id: 'lcm', label: 'MC', x: 42, y: 48, positions: ['MC'] },
      { id: 'rcm', label: 'MC', x: 58, y: 48, positions: ['MC'] },
      { id: 'rm', label: 'MD', x: 75, y: 44, positions: ['MD'] },
      { id: 'lw', label: 'EI', x: 31, y: 24, positions: ['EI'] },
      { id: 'st', label: 'DC', x: 50, y: 18, positions: ['DC', 'SD'] },
      { id: 'rw', label: 'ED', x: 69, y: 24, positions: ['ED'] },
    ],
  },
];

const METRICS: Record<MetricKey, { label: string }> = {
  global_rating: { label: 'Valoración global' },
  potential_rating: { label: 'Potencial estimado' },
  club_fit: { label: 'Encaje en club' },
  rating_technical: { label: 'Media técnica' },
  rating_tactical: { label: 'Media táctica' },
  rating_physical: { label: 'Media física' },
  rating_mental: { label: 'Media mental' },
};

function normalizePosition(position?: string | null) {
  return (position || '').trim().toUpperCase();
}

function slotMatchesPlayer(slot: FormationSlot, player: Player) {
  return Number.isFinite(getPositionMatchScore(slot, player));
}

function getPositionMatchScore(slot: FormationSlot, player: Player) {
  const playerPosition = normalizePosition(player.main_position);
  if (!playerPosition) return Number.POSITIVE_INFINITY;

  let bestScore = Number.POSITIVE_INFINITY;

  slot.positions.forEach(slotPosition => {
    const normalizedSlotPosition = normalizePosition(slotPosition);
    if (playerPosition === normalizedSlotPosition) {
      bestScore = Math.min(bestScore, 0);
      return;
    }

    const compatible = POSITION_COMPATIBILITY[normalizedSlotPosition] || [];
    if (compatible.includes(playerPosition)) {
      bestScore = Math.min(bestScore, 1);
    }
  });

  return bestScore;
}

function getMetricValue(player: Player, metric: MetricKey) {
  if (metric === 'global_rating') return Number(player.global_rating) || 0;
  if (metric === 'potential_rating') return Number(player.rating_potential ?? player.potential_rating) || 0;
  if (metric === 'club_fit') return Number(player.rating_club_fit) || 0;
  if (metric === 'rating_technical') return Number(player.rating_technical) || 0;
  if (metric === 'rating_tactical') return Number(player.rating_tactical) || 0;
  if (metric === 'rating_physical') return Number(player.rating_physical) || 0;
  if (metric === 'rating_mental') return Number(player.rating_mental) || 0;
  return 0;
}

function comparePlayersByMetric(a: Player, b: Player, metric: MetricKey, direction: SortDirection) {
  const metricDiff = direction === 'desc'
    ? getMetricValue(b, metric) - getMetricValue(a, metric)
    : getMetricValue(a, metric) - getMetricValue(b, metric);
  if (metricDiff !== 0) return metricDiff;

  return getSportName(a.first_name, a.last_name, a.short_name)
    .localeCompare(getSportName(b.first_name, b.last_name, b.short_name), 'es');
}

function buildSlotBoards(
  players: Player[],
  formation: FormationDefinition,
  metric: MetricKey,
  direction: SortDirection,
): SlotBoard[] {
  const sortedPlayers = [...players].sort((a, b) => comparePlayersByMetric(a, b, metric, direction));

  const usedIds = new Set<string>();
  const groupedSlots = new Map<string, FormationSlot[]>();

  formation.slots.forEach(slot => {
    const groupKey = `${slot.label}::${slot.positions.join('|')}`;
    const group = groupedSlots.get(groupKey) || [];
    group.push(slot);
    groupedSlots.set(groupKey, group);
  });

  const slotPlayersById = new Map<string, Player[]>();

  groupedSlots.forEach(group => {
    group.forEach(slot => slotPlayersById.set(slot.id, []));
    const capacity = group.length * 3;

    const exactCandidates = sortedPlayers.filter(player => {
      if (usedIds.has(player.id)) return false;
      return getPositionMatchScore(group[0], player) === 0;
    });

    exactCandidates.slice(0, capacity).forEach((player, index) => {
      const targetSlot = group[index % group.length];
      const assigned = slotPlayersById.get(targetSlot.id) || [];
      if (assigned.length < 3) {
        assigned.push(player);
        slotPlayersById.set(targetSlot.id, assigned);
        usedIds.add(player.id);
      }
    });

    const remainingCapacity = group.reduce((sum, slot) => sum + (3 - (slotPlayersById.get(slot.id)?.length || 0)), 0);
    if (remainingCapacity <= 0) return;

    const compatibleCandidates = sortedPlayers
      .filter(player => {
        if (usedIds.has(player.id)) return false;
        return slotMatchesPlayer(group[0], player);
      })
      .sort((a, b) => {
        const scoreDiff = getPositionMatchScore(group[0], a) - getPositionMatchScore(group[0], b);
        if (scoreDiff !== 0) return scoreDiff;
        return comparePlayersByMetric(a, b, metric, direction);
      });

    compatibleCandidates.slice(0, remainingCapacity).forEach((player) => {
      const targetSlot = group
        .map(slot => ({ slot, filled: slotPlayersById.get(slot.id)?.length || 0 }))
        .filter(entry => entry.filled < 3)
        .sort((a, b) => a.filled - b.filled)[0]?.slot;

      if (!targetSlot) return;

      const assigned = slotPlayersById.get(targetSlot.id) || [];
      assigned.push(player);
      slotPlayersById.set(targetSlot.id, assigned);
      usedIds.add(player.id);
    });

    const groupPlayers = group
      .flatMap(slot => slotPlayersById.get(slot.id) || [])
      .sort((a, b) => comparePlayersByMetric(a, b, metric, direction));

    group.forEach(slot => slotPlayersById.set(slot.id, []));

    groupPlayers.forEach((player, index) => {
      const targetSlot = group[index % group.length];
      const assigned = slotPlayersById.get(targetSlot.id) || [];
      assigned.push(player);
      slotPlayersById.set(targetSlot.id, assigned);
    });
  });

  return formation.slots.map(slot => ({
    ...slot,
    players: [...(slotPlayersById.get(slot.id) || [])].sort((a, b) => comparePlayersByMetric(a, b, metric, direction)),
  }));
}

export function MyBestTeam({
  players,
  onSelectPlayer,
}: {
  players: Player[];
  onSelectPlayer: (player: Player, tab?: string) => void;
}) {
  const [formationId, setFormationId] = useState(FORMATIONS[0].id);
  const [metric, setMetric] = useState<MetricKey>('global_rating');
  const [direction, setDirection] = useState<SortDirection>('desc');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [competitionFilter, setCompetitionFilter] = useState('ALL');

  const categories = useMemo(
    () => sortCategories(['ALL', ...new Set(players.map(player => calculateCategory(player.birth_year, player.birth_date)))]),
    [players],
  );

  const competitions = useMemo(
    () => [
      'ALL',
      ...Array.from(
        new Set(
          players
            .map(player => (player.competition || player.league || '').trim())
            .filter(Boolean),
        ),
      ).sort((a, b) => a.localeCompare(b, 'es')),
    ],
    [players],
  );

  const activeFormation = useMemo(
    () => FORMATIONS.find(formation => formation.id === formationId) || FORMATIONS[0],
    [formationId],
  );

  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const category = calculateCategory(player.birth_year, player.birth_date);
      const competition = (player.competition || player.league || '').trim();
      if (categoryFilter !== 'ALL' && category !== categoryFilter) return false;
      if (competitionFilter !== 'ALL' && competition !== competitionFilter) return false;
      return true;
    });
  }, [players, categoryFilter, competitionFilter]);

  const slotBoards = useMemo(
    () => buildSlotBoards(filteredPlayers, activeFormation, metric, direction),
    [filteredPlayers, activeFormation, metric, direction],
  );

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-emerald-400/80">MBT</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-black text-slate-100 tracking-tight sm:text-3xl">My Best Team</h1>
          <div className="px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300">
              {filteredPlayers.length} jugadores
            </span>
          </div>
        </div>
      </div>

      <section className="rounded-[1.35rem] border border-emerald-500/15 overflow-hidden bg-slate-900/50 backdrop-blur-sm">
        <div className="p-4 border-b border-slate-800/80 text-center">
          <h2
            className="text-[1.45rem] font-black italic uppercase leading-none text-slate-100 tracking-[0.18em] [text-shadow:0_3px_12px_rgba(0,0,0,0.45)] sm:text-[1.75rem] md:text-[2rem] md:tracking-[0.24em]"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {activeFormation.label}
          </h2>
        </div>

        <div className="overflow-x-auto overflow-y-hidden p-4 [touch-action:pan-x_pan-y]">
          <PitchBoard slotBoards={slotBoards} onSelectPlayer={onSelectPlayer} metric={metric} />
        </div>
      </section>

      <div className="rounded-[1.2rem] border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-3">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-emerald-400" />
          <h2 className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-100">Filtros MBT</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Sistema</label>
            <div className="relative">
              <select
                value={formationId}
                onChange={(e) => setFormationId(e.target.value)}
                className="w-full appearance-none bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] text-slate-200 outline-none focus:border-emerald-500 transition-all"
              >
                {FORMATIONS.map(formation => (
                  <option key={formation.id} value={formation.id}>
                    {formation.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Criterio</label>
            <div className="relative">
              <select
                value={metric}
                onChange={(e) => setMetric(e.target.value as MetricKey)}
                className="w-full appearance-none bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] text-slate-200 outline-none focus:border-emerald-500 transition-all"
              >
                {(Object.keys(METRICS) as MetricKey[]).map(metricKey => (
                  <option key={metricKey} value={metricKey}>
                    {METRICS[metricKey].label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Orden</label>
            <div className="relative">
              <select
                value={direction}
                onChange={(e) => setDirection(e.target.value as SortDirection)}
                className="w-full appearance-none bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] text-slate-200 outline-none focus:border-emerald-500 transition-all"
              >
                <option value="desc">Máximo</option>
                <option value="asc">Mínimo</option>
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Categoría</label>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full appearance-none bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] text-slate-200 outline-none focus:border-emerald-500 transition-all"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'ALL' ? 'Todas' : category}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">Liga / competición</label>
            <div className="relative">
              <select
                value={competitionFilter}
                onChange={(e) => setCompetitionFilter(e.target.value)}
                className="w-full appearance-none bg-slate-950/90 border border-slate-800 rounded-lg px-2.5 py-2 text-[11px] text-slate-200 outline-none focus:border-emerald-500 transition-all"
              >
                {competitions.map(competition => (
                  <option key={competition} value={competition}>
                    {competition === 'ALL' ? 'Todas' : competition}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
