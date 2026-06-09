import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type {
  WhoopRecovery,
  WhoopSleep,
  WhoopWorkout,
  Training,
  Pain,
  Test,
  Planning,
  Injury,
  InjuryPain,
  InjuryTreatment,
} from "@/types/db";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Lecture générique tolérante : si la DB n'est pas configurée / en erreur,
// renvoie un tableau vide pour que l'UI affiche un état vide plutôt que crash.
async function safeSelect<T>(
  table: string,
  build: (q: ReturnType<ReturnType<typeof getSupabaseAdmin>["from"]>) => unknown
): Promise<T[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = getSupabaseAdmin();
    const query = build(supabase.from(table)) as Promise<{
      data: T[] | null;
      error: unknown;
    }>;
    const { data, error } = await query;
    if (error) {
      console.error(`[data] ${table}:`, error);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.error(`[data] ${table}:`, e);
    return [];
  }
}

const sinceISO = (days: number) =>
  new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

export const getRecovery = (days = 120) =>
  safeSelect<WhoopRecovery>("whoop_recovery", (q) =>
    q.select("*").gte("date", sinceISO(days)).order("date", { ascending: true })
  );

export const getSleep = (days = 120) =>
  safeSelect<WhoopSleep>("whoop_sleep", (q) =>
    q.select("*").gte("date", sinceISO(days)).order("date", { ascending: true })
  );

export const getWorkouts = (days = 120) =>
  safeSelect<WhoopWorkout>("whoop_workouts", (q) =>
    q.select("*").gte("date", sinceISO(days)).order("date", { ascending: true })
  );

export const getTrainings = (days = 120) =>
  safeSelect<Training>("trainings", (q) =>
    q.select("*").gte("date", sinceISO(days)).order("date", { ascending: false })
  );

export const getPains = (days = 365) =>
  safeSelect<Pain>("pains", (q) =>
    q.select("*").gte("date", sinceISO(days)).order("date", { ascending: false })
  );

export const getTests = () =>
  safeSelect<Test>("tests", (q) =>
    q.select("*").order("date", { ascending: true })
  );

export const getPlanning = (semaine?: string) =>
  safeSelect<Planning>("planning", (q) => {
    const base = q.select("*").order("jour", { ascending: true });
    return semaine ? base.eq("semaine", semaine) : base;
  });

export const getInjuries = (statut?: "active" | "retabli") =>
  safeSelect<Injury>("injuries", (q) => {
    const base = q.select("*").order("created_at", { ascending: false });
    return statut ? base.eq("statut", statut) : base;
  });

export const getInjuryPains = (injuryId: number) =>
  safeSelect<InjuryPain>("injury_pains", (q) =>
    q.select("*").eq("injury_id", injuryId).order("date", { ascending: true })
  );

export const getInjuryTreatments = (injuryId: number) =>
  safeSelect<InjuryTreatment>("injury_treatments", (q) =>
    q.select("*").eq("injury_id", injuryId).order("date_debut", { ascending: true })
  );

export const getAllInjuryPains = () =>
  safeSelect<InjuryPain>("injury_pains", (q) =>
    q.select("*").order("date", { ascending: true })
  );

export async function getLastSync(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("whoop_tokens")
      .select("last_sync")
      .eq("id", true)
      .single();
    return data?.last_sync ?? null;
  } catch {
    return null;
  }
}
