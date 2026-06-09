import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getValidAccessToken } from "./oauth";
import { fetchAllRecords } from "./client";

// ── Types bruts Whoop v2 (sous-ensemble utilisé) ──────────────────────────
type RecoveryRecord = {
  cycle_id: number;
  created_at: string;
  score_state: string;
  score?: {
    recovery_score?: number;
    hrv_rmssd_milli?: number;
    resting_heart_rate?: number;
  } | null;
};

type SleepRecord = {
  id: string;
  start: string;
  end: string;
  score_state: string;
  score?: {
    stage_summary?: {
      total_light_sleep_time_milli?: number;
      total_slow_wave_sleep_time_milli?: number;
      total_rem_sleep_time_milli?: number;
    };
    sleep_efficiency_percentage?: number;
  } | null;
};

type WorkoutRecord = {
  id: string;
  start: string;
  end: string;
  sport_name?: string;
  score_state: string;
  score?: {
    strain?: number;
    zone_durations?: {
      zone_zero_milli?: number;
      zone_one_milli?: number;
      zone_two_milli?: number;
      zone_three_milli?: number;
      zone_four_milli?: number;
      zone_five_milli?: number;
    };
  } | null;
};

const toMin = (ms?: number) => (ms == null ? null : Math.round(ms / 60000));
const dayOf = (iso: string) => iso.slice(0, 10);

export type SyncResult = {
  recovery: number;
  sleep: number;
  workouts: number;
  since: string;
};

/**
 * Pull Whoop : récupère les données depuis `sinceDays` jours et upsert
 * dans whoop_recovery / whoop_sleep / whoop_workouts (dedup sur whoop_id).
 */
export async function syncWhoop(sinceDays = 14): Promise<SyncResult> {
  const supabase = getSupabaseAdmin();
  const accessToken = await getValidAccessToken();
  const since = new Date(Date.now() - sinceDays * 86_400_000);

  const [recoveries, sleeps, workouts] = await Promise.all([
    fetchAllRecords<RecoveryRecord>("/v2/recovery", accessToken, since),
    fetchAllRecords<SleepRecord>("/v2/activity/sleep", accessToken, since),
    fetchAllRecords<WorkoutRecord>("/v2/activity/workout", accessToken, since),
  ]);

  // Recovery
  const recoveryRows = recoveries
    .filter((r) => r.score_state === "SCORED" && r.score)
    .map((r) => ({
      whoop_id: String(r.cycle_id),
      date: dayOf(r.created_at),
      recovery_score: r.score?.recovery_score ?? null,
      hrv: r.score?.hrv_rmssd_milli ?? null,
      resting_hr: r.score?.resting_heart_rate ?? null,
      raw: r,
    }));
  if (recoveryRows.length) {
    const { error } = await supabase
      .from("whoop_recovery")
      .upsert(recoveryRows, { onConflict: "whoop_id" });
    if (error) throw new Error(`Upsert recovery: ${error.message}`);
  }

  // Sleep
  const sleepRows = sleeps
    .filter((s) => s.score_state === "SCORED" && s.score?.stage_summary)
    .map((s) => {
      const ss = s.score!.stage_summary!;
      const light = toMin(ss.total_light_sleep_time_milli);
      const deep = toMin(ss.total_slow_wave_sleep_time_milli);
      const rem = toMin(ss.total_rem_sleep_time_milli);
      const duration =
        light != null || deep != null || rem != null
          ? (light ?? 0) + (deep ?? 0) + (rem ?? 0)
          : null;
      return {
        whoop_id: s.id,
        date: dayOf(s.end),
        duration,
        light,
        deep,
        rem,
        efficiency: s.score?.sleep_efficiency_percentage ?? null,
        raw: s,
      };
    });
  if (sleepRows.length) {
    const { error } = await supabase
      .from("whoop_sleep")
      .upsert(sleepRows, { onConflict: "whoop_id" });
    if (error) throw new Error(`Upsert sleep: ${error.message}`);
  }

  // Workouts
  const workoutRows = workouts
    .filter((w) => w.score_state === "SCORED" && w.score)
    .map((w) => {
      const z = w.score?.zone_durations ?? {};
      const duration = Math.round(
        (new Date(w.end).getTime() - new Date(w.start).getTime()) / 60000
      );
      return {
        whoop_id: w.id,
        date: dayOf(w.start),
        type: w.sport_name ?? null,
        strain: w.score?.strain ?? null,
        duration,
        minutes_z1: toMin(z.zone_one_milli),
        minutes_z2: toMin(z.zone_two_milli),
        minutes_z3: toMin(z.zone_three_milli),
        minutes_z4: toMin(z.zone_four_milli),
        minutes_z5: toMin(z.zone_five_milli),
        raw: w,
      };
    });
  if (workoutRows.length) {
    const { error } = await supabase
      .from("whoop_workouts")
      .upsert(workoutRows, { onConflict: "whoop_id" });
    if (error) throw new Error(`Upsert workouts: ${error.message}`);
  }

  return {
    recovery: recoveryRows.length,
    sleep: sleepRows.length,
    workouts: workoutRows.length,
    since: since.toISOString(),
  };
}
