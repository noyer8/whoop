// Types des lignes Supabase (alignés sur supabase/migrations/0001_init.sql)

export type WhoopRecovery = {
  id: number;
  whoop_id: string | null;
  date: string;
  recovery_score: number | null;
  hrv: number | null;
  resting_hr: number | null;
  raw: unknown;
  created_at: string;
};

export type WhoopSleep = {
  id: number;
  whoop_id: string | null;
  date: string;
  duration: number | null;
  light: number | null;
  deep: number | null;
  rem: number | null;
  efficiency: number | null;
  raw: unknown;
  created_at: string;
};

export type WhoopWorkout = {
  id: number;
  whoop_id: string | null;
  date: string;
  type: string | null;
  strain: number | null;
  duration: number | null;
  minutes_z1: number | null;
  minutes_z2: number | null;
  minutes_z3: number | null;
  minutes_z4: number | null;
  minutes_z5: number | null;
  raw: unknown;
  created_at: string;
};

export type TypeSeance =
  | "FB1"
  | "FB2"
  | "H1"
  | "H2"
  | "foot"
  | "course"
  | "natation"
  | "corde";

export type Training = {
  id: number;
  date: string;
  type_seance: TypeSeance | string;
  exos: unknown;
  rpe: number | null;
  notes: string | null;
  created_at: string;
};

export type Pain = {
  id: number;
  date: string;
  zone: string;
  intensite: number;
  contexte: string | null;
  created_at: string;
};

export type Test = {
  id: number;
  date: string;
  type: string;
  resultat: number | null;
  conditions: string | null;
  created_at: string;
};

export type Planning = {
  id: number;
  semaine: string;
  jour: string;
  seance_prevue: string;
  realise: boolean;
  created_at: string;
};
