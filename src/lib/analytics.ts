import type {
  WhoopRecovery,
  WhoopWorkout,
  Training,
  Pain,
  Test,
} from "@/types/db";
import { isoWeekFromString, OBJECTIF_Z45_MIN } from "@/lib/utils";

const n = (v: number | null | undefined) => (v == null ? 0 : v);

// ── Agrégat hebdomadaire des workouts Whoop ──────────────────────────────
export type WeekAgg = {
  semaine: string;
  z45: number; // minutes Z4 + Z5
  strain: number; // strain cumulé
  count: number;
};

export function weeklyWorkoutAgg(workouts: WhoopWorkout[]): WeekAgg[] {
  const map = new Map<string, WeekAgg>();
  for (const w of workouts) {
    const semaine = isoWeekFromString(w.date);
    const cur =
      map.get(semaine) ?? { semaine, z45: 0, strain: 0, count: 0 };
    cur.z45 += n(w.minutes_z4) + n(w.minutes_z5);
    cur.strain += n(w.strain);
    cur.count += 1;
    map.set(semaine, cur);
  }
  return [...map.values()].sort((a, b) => a.semaine.localeCompare(b.semaine));
}

// ── Résumé de la semaine courante + alerte charge/récup ──────────────────
export type WeekSummary = {
  semaine: string;
  z45: number;
  objectif: number;
  strain: number;
  recoveryMoy: number | null;
  alerte: "ok" | "warn" | "bad";
  alerteMsg: string;
};

export function currentWeekSummary(
  weekAgg: WeekAgg[],
  recovery: WhoopRecovery[],
  semaine: string
): WeekSummary {
  const wk = weekAgg.find((w) => w.semaine === semaine);
  const z45 = Math.round(wk?.z45 ?? 0);
  const strain = Math.round((wk?.strain ?? 0) * 10) / 10;

  const recThisWeek = recovery.filter(
    (r) => isoWeekFromString(r.date) === semaine && r.recovery_score != null
  );
  const recoveryMoy =
    recThisWeek.length > 0
      ? Math.round(
          recThisWeek.reduce((s, r) => s + n(r.recovery_score), 0) /
            recThisWeek.length
        )
      : null;

  // Heuristique d'alerte : beaucoup d'intensité cumulée + récup basse.
  let alerte: WeekSummary["alerte"] = "ok";
  let alerteMsg = "Charge et récupération équilibrées.";
  if (recoveryMoy != null) {
    if (z45 >= OBJECTIF_Z45_MIN && recoveryMoy < 50) {
      alerte = "bad";
      alerteMsg = "Volume intense élevé + recovery basse : risque de surcharge.";
    } else if (z45 >= OBJECTIF_Z45_MIN * 0.8 && recoveryMoy < 40) {
      alerte = "bad";
      alerteMsg = "Recovery très basse sous charge : lève le pied.";
    } else if (recoveryMoy < 50 || (z45 >= OBJECTIF_Z45_MIN && recoveryMoy < 60)) {
      alerte = "warn";
      alerteMsg = "Vigilance : surveille la récupération cette semaine.";
    }
  }

  return {
    semaine,
    z45,
    objectif: OBJECTIF_Z45_MIN,
    strain,
    recoveryMoy,
    alerte,
    alerteMsg,
  };
}

// ── Séries de tendance (recovery) ────────────────────────────────────────
export function trendSeries(recovery: WhoopRecovery[]) {
  return recovery
    .filter((r) => r.recovery_score != null || r.hrv != null || r.resting_hr != null)
    .map((r) => ({
      label: r.date.slice(5),
      date: r.date,
      hrv: r.hrv != null ? Math.round(Number(r.hrv) * 10) / 10 : null,
      fcRepos: r.resting_hr != null ? Math.round(Number(r.resting_hr)) : null,
      recovery: r.recovery_score != null ? Math.round(Number(r.recovery_score)) : null,
    }));
}

// ── Croisement 1 : douleur ↔ type de séances des jours précédents ─────────
export function painVsSessions(
  pains: Pain[],
  trainings: Training[],
  windowDays = 2
): { type: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const p of pains) {
    const pd = new Date(p.date + "T00:00:00Z").getTime();
    for (const t of trainings) {
      const td = new Date(t.date + "T00:00:00Z").getTime();
      const diff = (pd - td) / 86_400_000;
      if (diff >= 0 && diff <= windowDays) {
        counts.set(t.type_seance, (counts.get(t.type_seance) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

// ── Croisement 2 : recovery ↔ qualité (RPE) des séances foot ──────────────
export function recoveryVsFoot(
  recovery: WhoopRecovery[],
  trainings: Training[]
): { x: number; y: number; label: string }[] {
  const recByDate = new Map(
    recovery.filter((r) => r.recovery_score != null).map((r) => [r.date, Number(r.recovery_score)])
  );
  const out: { x: number; y: number; label: string }[] = [];
  for (const t of trainings) {
    if (t.type_seance !== "foot" || t.rpe == null) continue;
    const rec = recByDate.get(t.date);
    if (rec == null) continue;
    out.push({ x: rec, y: t.rpe, label: t.date });
  }
  return out;
}

// ── Croisement 3 : volume Z4-Z5 hebdo ↔ progression Bronco ────────────────
export function z45VsBronco(
  weekAgg: WeekAgg[],
  tests: Test[]
): { x: number; y: number; label: string }[] {
  const z45ByWeek = new Map(weekAgg.map((w) => [w.semaine, w.z45]));
  const out: { x: number; y: number; label: string }[] = [];
  for (const t of tests) {
    if (t.type !== "Bronco" || t.resultat == null) continue;
    const semaine = isoWeekFromString(t.date);
    const z45 = z45ByWeek.get(semaine);
    if (z45 == null || z45 === 0) continue;
    out.push({ x: Math.round(z45), y: Number(t.resultat), label: t.date });
  }
  return out;
}
