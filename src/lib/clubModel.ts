import { Player, RatingWeights } from '../types';

export type ClubModelWeights = {
  technique: number;
  tactics: number;
  physical: number;
  mentality: number;
  potential: number;
};

export const DEFAULT_CLUB_MODEL_WEIGHTS: ClubModelWeights = {
  technique: 25,
  tactics: 20,
  physical: 15,
  mentality: 15,
  potential: 25,
};

const roundToOneDecimal = (value: number) => Math.round(value * 10) / 10;

const toPercentage = (value: number | null | undefined, fallback: number) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, roundToOneDecimal(parsed * 100));
};

export function mapRatingWeightsToClubModel(
  row?: Partial<RatingWeights> | null,
): ClubModelWeights {
  if (!row) return DEFAULT_CLUB_MODEL_WEIGHTS;

  return {
    technique: toPercentage(row.technique_weight, DEFAULT_CLUB_MODEL_WEIGHTS.technique),
    tactics: toPercentage(row.tactics_weight, DEFAULT_CLUB_MODEL_WEIGHTS.tactics),
    physical: toPercentage(row.physical_weight, DEFAULT_CLUB_MODEL_WEIGHTS.physical),
    mentality: toPercentage(row.mentality_weight, DEFAULT_CLUB_MODEL_WEIGHTS.mentality),
    potential: toPercentage(row.potential_weight, DEFAULT_CLUB_MODEL_WEIGHTS.potential),
  };
}

export function buildRatingWeightsPayload(clubId: string, weights: ClubModelWeights) {
  return {
    club_id: clubId,
    technique_weight: weights.technique / 100,
    tactics_weight: weights.tactics / 100,
    physical_weight: weights.physical / 100,
    mentality_weight: weights.mentality / 100,
    potential_weight: weights.potential / 100,
    club_fit_weight: 0,
    active: true,
  };
}

function resolvePotentialRating(player: Partial<Player>): number {
  return Number(player.rating_potential ?? player.potential_rating) || 0;
}

export function calculateClubFitScore(
  player: Partial<Player>,
  weights: ClubModelWeights,
): number | undefined {
  const metrics = [
    { value: Number(player.rating_technical) || 0, weight: weights.technique },
    { value: Number(player.rating_tactical) || 0, weight: weights.tactics },
    { value: Number(player.rating_physical) || 0, weight: weights.physical },
    { value: Number(player.rating_mental) || 0, weight: weights.mentality },
    { value: resolvePotentialRating(player), weight: weights.potential },
  ].filter(metric => metric.value > 0 && metric.weight > 0);

  if (metrics.length === 0) return undefined;

  const totalWeight = metrics.reduce((sum, metric) => sum + metric.weight, 0);
  if (totalWeight <= 0) return undefined;

  const weightedScore = metrics.reduce((sum, metric) => sum + (metric.value * metric.weight), 0) / totalWeight;
  return roundToOneDecimal(weightedScore);
}

export function getClubFitLabel(score?: number) {
  if (score === undefined) return '';
  if (score >= 4.5) return 'Excelente';
  if (score >= 4.0) return 'Muy alto';
  if (score >= 3.5) return 'Alto';
  if (score >= 3.0) return 'Medio';
  if (score >= 2.0) return 'Bajo';
  return 'Muy bajo';
}

export function applyClubModelToPlayer(player: Player, weights: ClubModelWeights): Player {
  const score = calculateClubFitScore(player, weights);

  return {
    ...player,
    rating_club_fit: score,
    club_fit: score === undefined ? '' : getClubFitLabel(score),
  };
}

export function formatClubFitDisplay(player: Partial<Player>) {
  const score = Number(player.rating_club_fit);
  if (!Number.isFinite(score) || score <= 0) return 'Pendiente de cálculo';
  const label = player.club_fit || getClubFitLabel(score);
  return `${label} · ${roundToOneDecimal(score)}/5`;
}
