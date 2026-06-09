import type {
  WhoopRecovery,
  WhoopWorkout,
  Training,
  Pain,
  Test,
  Planning,
} from "@/types/db";
import { isoWeek, isoWeekFromString, OBJECTIF_Z45_MIN, secToChrono } from "@/lib/utils";

const n = (v: number | null | undefined) => (v == null ? 0 : v);

// ── Agregat hebdomadaire des workouts Whoop ──────────────────────────────
export type WeekAgg = {
  semaine: string;
  z45: number;
  strain: number;
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

// ── Resume de la semaine courante + alerte charge/recup ──────────────────
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

  let alerte: WeekSummary["alerte"] = "ok";
  let alerteMsg = "Charge et recuperation equilibrees.";
  if (recoveryMoy != null) {
    if (z45 >= OBJECTIF_Z45_MIN && recoveryMoy < 50) {
      alerte = "bad";
      alerteMsg = "Volume intense eleve + recovery basse : risque de surcharge.";
    } else if (z45 >= OBJECTIF_Z45_MIN * 0.8 && recoveryMoy < 40) {
      alerte = "bad";
      alerteMsg = "Recovery tres basse sous charge : leve le pied.";
    } else if (recoveryMoy < 50 || (z45 >= OBJECTIF_Z45_MIN && recoveryMoy < 60)) {
      alerte = "warn";
      alerteMsg = "Vigilance : surveille la recuperation cette semaine.";
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

// ── Series de tendance (recovery) ────────────────────────────────────────
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

// ── Croisement 1 : douleur <-> type de seances des jours precedents ─────────
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

// ── Croisement 2 : recovery <-> qualite (RPE) des seances foot ──────────────
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

// ── Croisement 3 : volume Z4-Z5 hebdo <-> progression Bronco ────────────────
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

// ── Resume hebdomadaire (texte compact pour Claude) ──────────────────────
export function generateWeeklySummary(input: {
  semaine: string;
  recovery: WhoopRecovery[];
  workouts: WhoopWorkout[];
  trainings: Training[];
  pains: Pain[];
  tests: Test[];
  planning: Planning[];
}): string {
  const { semaine, recovery, workouts, trainings, pains, tests, planning } = input;

  const recWeek = recovery.filter(
    (r) => isoWeekFromString(r.date) === semaine && r.recovery_score != null
  );
  const wkWorkouts = workouts.filter((w) => isoWeekFromString(w.date) === semaine);
  const wkTrainings = trainings.filter((t) => isoWeekFromString(t.date) === semaine);
  const wkPains = pains.filter((p) => isoWeekFromString(p.date) === semaine);

  const z45 = Math.round(
    wkWorkouts.reduce((s, w) => s + n(w.minutes_z4) + n(w.minutes_z5), 0)
  );

  const recoveryMoy =
    recWeek.length > 0
      ? Math.round(recWeek.reduce((s, r) => s + n(r.recovery_score), 0) / recWeek.length)
      : null;

  const hrvValues = recWeek.filter((r) => r.hrv != null).map((r) => Number(r.hrv));
  const hrvMoy = hrvValues.length > 0
    ? Math.round(hrvValues.reduce((s, v) => s + v, 0) / hrvValues.length * 10) / 10
    : null;

  const fcValues = recWeek.filter((r) => r.resting_hr != null).map((r) => Number(r.resting_hr));
  const fcMoy = fcValues.length > 0
    ? Math.round(fcValues.reduce((s, v) => s + v, 0) / fcValues.length)
    : null;

  const hrvTrend = hrvValues.length >= 3
    ? (hrvValues[hrvValues.length - 1] > hrvValues[0] ? "hausse" : hrvValues[hrvValues.length - 1] < hrvValues[0] ? "baisse" : "stable")
    : null;
  const fcTrend = fcValues.length >= 3
    ? (fcValues[fcValues.length - 1] < fcValues[0] ? "baisse (bien)" : fcValues[fcValues.length - 1] > fcValues[0] ? "hausse (vigilance)" : "stable")
    : null;

  const prevues = planning.length;
  const realisees = planning.filter((p) => p.realise).length;

  const lastBronco = tests
    .filter((t) => t.type === "Bronco" && t.resultat != null)
    .at(-1);

  const lines: string[] = [];
  lines.push(`RESUME SEMAINE ${semaine}`);
  lines.push(`${"=".repeat(40)}`);
  lines.push("");
  lines.push(`CARDIO INTENSE`);
  lines.push(`  Z4-Z5 : ${z45} min / objectif ${OBJECTIF_Z45_MIN} min (${Math.round((z45 / OBJECTIF_Z45_MIN) * 100)}%)`);
  lines.push("");
  lines.push(`RECUPERATION`);
  lines.push(`  Recovery moy : ${recoveryMoy != null ? `${recoveryMoy}%` : "N/A"}`);
  lines.push(`  HRV moy : ${hrvMoy != null ? `${hrvMoy} ms` : "N/A"}${hrvTrend ? ` (${hrvTrend})` : ""}`);
  lines.push(`  FC repos moy : ${fcMoy != null ? `${fcMoy} bpm` : "N/A"}${fcTrend ? ` (${fcTrend})` : ""}`);
  lines.push("");
  lines.push(`SEANCES`);
  lines.push(`  Prevues : ${prevues} | Realisees : ${realisees}${prevues > 0 ? ` (${Math.round((realisees / prevues) * 100)}%)` : ""}`);
  if (wkTrainings.length > 0) {
    lines.push(`  Detail : ${wkTrainings.map((t) => `${t.type_seance}${t.rpe ? ` RPE${t.rpe}` : ""}`).join(", ")}`);
  }
  lines.push("");
  if (wkPains.length > 0) {
    lines.push(`DOULEURS`);
    for (const p of wkPains) {
      lines.push(`  ${p.date} : ${p.zone} ${p.intensite}/10${p.contexte ? ` (${p.contexte})` : ""}`);
    }
    lines.push("");
  } else {
    lines.push(`DOULEURS : aucune`);
    lines.push("");
  }
  if (lastBronco) {
    lines.push(`DERNIER BRONCO : ${secToChrono(Number(lastBronco.resultat))} (${lastBronco.date})`);
  }

  return lines.join("\n");
}

// ── Resume mensuel (4 semaines) ──────────────────────────────────────────
export function generateMonthlySummary(input: {
  recovery: WhoopRecovery[];
  workouts: WhoopWorkout[];
  tests: Test[];
}): string {
  const { recovery, workouts, tests } = input;

  const now = new Date();
  const weeks: string[] = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    weeks.push(isoWeek(d));
  }
  const uniqueWeeks = [...new Set(weeks)];

  const lines: string[] = [];
  lines.push(`RESUME MENSUEL (4 dernieres semaines)`);
  lines.push(`${"=".repeat(40)}`);
  lines.push("");
  lines.push(`SEM     | Z4-Z5  | Recovery | HRV      | FC repos`);
  lines.push(`--------|--------|----------|----------|--------`);

  for (const sem of uniqueWeeks) {
    const recWeek = recovery.filter(
      (r) => isoWeekFromString(r.date) === sem && r.recovery_score != null
    );
    const wkW = workouts.filter((w) => isoWeekFromString(w.date) === sem);

    const z45 = Math.round(wkW.reduce((s, w) => s + n(w.minutes_z4) + n(w.minutes_z5), 0));
    const recMoy = recWeek.length > 0
      ? Math.round(recWeek.reduce((s, r) => s + n(r.recovery_score), 0) / recWeek.length)
      : null;
    const hrvMoy = recWeek.filter((r) => r.hrv != null).length > 0
      ? Math.round(recWeek.filter((r) => r.hrv != null).reduce((s, r) => s + Number(r.hrv), 0) / recWeek.filter((r) => r.hrv != null).length)
      : null;
    const fcMoy = recWeek.filter((r) => r.resting_hr != null).length > 0
      ? Math.round(recWeek.filter((r) => r.resting_hr != null).reduce((s, r) => s + Number(r.resting_hr), 0) / recWeek.filter((r) => r.resting_hr != null).length)
      : null;

    const semLabel = sem.replace(/^\d+-/, "");
    lines.push(
      `${semLabel.padEnd(8)}| ${String(z45).padStart(3)} min | ${recMoy != null ? `${recMoy}%`.padStart(7) : "   N/A "} | ${hrvMoy != null ? `${hrvMoy} ms`.padStart(7) : "   N/A "} | ${fcMoy != null ? `${fcMoy} bpm`.padStart(7) : "   N/A"}`
    );
  }

  const broncoTests = tests
    .filter((t) => t.type === "Bronco" && t.resultat != null)
    .slice(-5);
  if (broncoTests.length > 0) {
    lines.push("");
    lines.push("PROGRESSION BRONCO");
    for (const t of broncoTests) {
      lines.push(`  ${t.date} : ${secToChrono(Number(t.resultat))}`);
    }
  }

  return lines.join("\n");
}
