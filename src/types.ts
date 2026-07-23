/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'ADMIN' | 'COORD' | 'COORD_F11' | 'COORD_F8' | 'PRESID' | 'ENTREN' | 'SCOUT' | 'SCOUT_F11' | 'SCOUT_F8' | 'SUPERADMIN';

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  club_id: string;
  category_id?: string;
  active: boolean;
  can_print?: boolean;
  created_at: string;
  updated_at: string;
}

// Catálogo de clubes REALES (a los que pertenecen los jugadores observados).
// NO son clientes de la plataforma — ver `Client` para eso.
export interface Club {
  id: string;
  ref_code?: string;
  ref_seq?: number;
  name: string;
  current_season: string;
  logo_url?: string;
  location?: string;
  province?: string;
  autonomous_community?: string;
  created_at: string;
  updated_at: string;
}

// Registro de un pago mensual dentro del ciclo anual de suscripción.
export interface PaymentEntry {
  paid: boolean;        // ¿Pagado este mes?
  paid_date?: string | null; // Fecha real en que se registró el pago (YYYY-MM-DD)
}

// Un club-cliente que paga la suscripción a la plataforma (tabla "clients").
// Totalmente independiente del catálogo de clubes reales (`Club`).
export interface Client {
  id: string;
  name: string;
  current_season: string;
  logo_url?: string | null;
  background_image_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  tertiary_color?: string | null;
  location?: string | null;
  subscription_status?: 'trial' | 'active' | 'expired';
  subscription_start_date?: string | null;
  subscription_end_date?: string | null;
  monthly_fee?: number | null;
  // Registro manual de pagos: 12 meses desde la fecha de activación.
  // Cada posición es un mes (índice 0 = mes de activación).
  payment_log?: PaymentEntry[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  club_id: string;
  name: string;
  season: string;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  club_name: string;
  category_id: string;
  league?: string;
  zone?: string;
  home_field?: string;
  season: string;
  notes?: string;
  created_at: string;
}

export type PlayerStatus = 
  | 'NEW' 
  | 'PENDING_VALIDATION' 
  | 'VALIDATED' 
  | 'TRACKING' 
  | 'INTERESTING' 
  | 'VERY_INTERESTING' 
  | 'PRIORITY' 
  | 'CONTACTED' 
  | 'ON_TRIAL' 
  | 'SIGNED' 
  | 'DISCARDED';

export type Foot = 'LEFT' | 'RIGHT' | 'BOTH' | 'UNKNOWN';

export interface CustomRating {
  label: string;
  value: number;
}

export interface ContactEntry {
  id?: string;
  player_id?: string;
  contact_type: string;
  note: string;
  created_at?: string;
  updated_at?: string;
}

export interface TrajectoryEntry {
  id?: string;
  player_id?: string;
  club_id?: string | null;
  club_name_snapshot?: string;
  season: string;
  team: string;
  category: string;
  competition?: string;
  matches_played: number;
  minutes_played?: number;
  minutes?: number;
  starts?: number;
  substitutes?: number;
  goals: number;
  assists?: number;
  yellow_cards: number;
  red_cards: number;
  created_at?: string;
  updated_at?: string;
}

export interface Player {
  id: string;
  ref_code?: string;
  ref_seq?: number;
  club_id: string;
  owner_club_id?: string | null;
  first_name: string;
  last_name?: string;
  full_name: string;
  birth_date?: string;
  birth_year?: number;
  calculated_age?: number;
  nationality?: string;
  category_id: string;
  current_team_id: string;
  club_name?: string;
  league?: string;
  usual_number?: string;
  main_position: string;
  secondary_positions?: string[];
  dominant_foot: Foot;
  approximate_height?: number;
  approximate_weight?: number;
  area?: string;
  source?: string;
  avatar_url?: string;
  contact_own?: string;
  contact_tutor1?: string;
  contact_tutor1_role?: string;
  contact_other?: string;
  contact_other_role?: string;
  status: PlayerStatus;
  interest_level: number; // 1-5
  global_rating?: number;
  potential_rating?: number;
  // Perfil detallado
  strengths?: string[];
  weaknesses?: string[];
  why_interested?: string;
  main_strength?: string;
  main_doubt?: string;
  differential_talent?: string;
  short_name?: string; // Nombre deportivo - si está vacío, se usa first_name + primer apellido
  competition?: string;
  lateralidad?: string;
  trajectory?: TrajectoryEntry[];
  contacts?: ContactEntry[];

  // Perfil detallado (Ratings 1-5)
  // Físicas
  rating_velo_despl?: number;
  rating_acel?: number;
  rating_fuerza?: number;
  rating_resis?: number;
  rating_agil?: number;
  rating_coord?: number;
  rating_velo_reac?: number;
  rating_poten?: number;
  rating_recup_fatiga?: number;
  rating_tenden_lesion?: number;

  // Técnicas
  rating_pase_corto?: number;
  rating_pase_largo?: number;
  rating_ctrl_balon?: number;
  rating_tiro?: number;
  rating_regate?: number;
  rating_conduc?: number;
  rating_superf_cont?: number;
  rating_despeje?: number;
  rating_entrada?: number;
  rating_pierna_menos?: number;

  // Tácticas
  rating_posic?: number;
  rating_cobertura?: number;
  rating_repliegue?: number;
  rating_ayuda_def?: number;
  rating_marcajes?: number;
  rating_dom_espacios?: number;
  rating_vigilancias?: number;
  rating_apoyos_off?: number;
  rating_desmarques?: number;
  rating_temporiz?: number;

  // Cognitivas
  rating_liderazgo?: number;
  rating_caracter?: number;
  rating_competitiv?: number;
  rating_companerismo?: number;
  rating_mentalidad?: number;
  rating_agresividad?: number;
  rating_polivalencia?: number;
  rating_inteligencia?: number;
  rating_comunicacion?: number;
  rating_personalidad?: number;

  // Especificas
  rating_juego_aereo?: number;
  custom_ratings?: CustomRating[];

  club_fit?: string;
  risk_level?: 'LOW' | 'MEDIUM' | 'HIGH';
  next_step?: string;
  decision_final?: string;
  decision_date?: string;
  tracking_history?: { date: string; note: string; status: string }[];
  
  // Perfil Futbolístico (Ratings 1-5)
  rating_technical?: number;
  rating_tactical?: number;
  rating_physical?: number;
  rating_mental?: number;
  rating_competitive?: number;
  rating_decision_making?: number;
  rating_pace?: number;
  rating_intelligence?: number;
  rating_personality?: number;
  rating_potential?: number;
  rating_club_fit?: number;

  // Perfil Futbolístico (Textos)
  risks_analysis?: string;
  improvement_margin?: string;
  player_type?: string;
  ideal_role?: string;
  current_level_club?: string;
  future_level_estimated?: string;
  comparison_players?: string;

  technical_profile?: string;
  tactical_profile?: string;
  physical_profile?: string;
  mental_profile?: string;
  birth_place?: string;
  passport?: string;
  agent_name?: string;
  weight_kg?: number;
  info_source?: string;
  general_observations?: string;
  verification_status?: Record<string, 'CONFIRMED' | 'APPROXIMATE' | 'NOT_REGISTERED' | 'PENDING'>;
  has_video: boolean;
  has_images: boolean;
  possible_duplicate: boolean;
  created_by: string;
  validated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: string;
  date: string;
  home_team: string;
  away_team: string;
  competition: string;
  venue?: string;
  score?: string;
  observed_players_ids: string[];
  created_at: string;
}

export interface Report {
  id: string;
  player_id: string;
  match_id?: string;
  observer_id: string;
  report_date: string;
  category_id?: string;
  position_played?: string;
  minutes_observed?: number;
  match_context?: string;
  observer_role?: string;
  technical_comment?: string;
  tactical_comment?: string;
  physical_comment?: string;
  mental_comment?: string;
  strengths: string[];
  weaknesses: string[];
  key_actions?: string;
  doubts?: string;
  recommendation: string;
  next_step?: string;
  match_rating: number; // 1-5
  rating_physical?: number;
  rating_technical?: number;
  rating_tactical?: number;
  rating_mental?: number;
  custom_ratings?: CustomRating[];
  video_urls?: string[];
  created_at: string;
}

export interface Video {
  id: string;
  player_id: string;
  match_id?: string;
  report_id?: string;
  url: string;
  platform: string;
  title: string;
  description?: string;
  start_min?: number;
  end_min?: number;
  action_type?: string;
  rating?: number;
  is_key: boolean;
  pending_review: boolean;
  created_at: string;
}

export interface HistoryLog {
  id: string;
  player_id: string;
  user_id?: string | null;
  field: string;
  old_value?: string | null;
  new_value?: string | null;
  created_at: string;
}

export interface RatingWeights {
  id: string;
  club_id: string;
  technique_weight: number;
  tactics_weight: number;
  physical_weight: number;
  mentality_weight: number;
  potential_weight: number;
  club_fit_weight: number;
  active: boolean;
}
