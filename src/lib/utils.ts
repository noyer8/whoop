// ── Semaines ISO ──────────────────────────────────────────────────────────

/** Clé de semaine ISO, ex. "2026-W24". */
export function isoWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // lundi = 0
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // jeudi de la semaine
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86_400_000 -
        ((firstThursday.getUTCDay() + 6) % 7) +
        3) /
        7
    );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function isoWeekFromString(dateStr: string): string {
  return isoWeek(new Date(dateStr + "T00:00:00Z"));
}

/** Jours (lun→dim) de la semaine ISO courante. */
export const JOURS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"] as const;

// ── Format ──────────────────────────────────────────────────────────────

/** Secondes → "m'ss" (ex. 330 → "5'30"). */
export function secToChrono(sec: number | null | undefined): string {
  if (sec == null) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}'${String(s).padStart(2, "0")}`;
}

export function round(n: number | null | undefined, d = 0): number | null {
  if (n == null || Number.isNaN(n)) return null;
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

// ── Bronco Test : paliers (temps total en secondes, plus bas = mieux) ──────
export const BRONCO_PALIERS = [
  { label: "Élite", max: 255, color: "#a855f7" }, // < 4'15
  { label: "Très bon", max: 270, color: "#22c55e" }, // 4'30
  { label: "Bon", max: 300, color: "#3b82f6" }, // 5'00
  { label: "Correct", max: 330, color: "#eab308" }, // 5'30
] as const;

export function broncoPalier(sec: number): { label: string; color: string } {
  for (const p of BRONCO_PALIERS) {
    if (sec < p.max) return { label: p.label, color: p.color };
  }
  return { label: "À travailler", color: "#ef4444" };
}

// ── Objectifs ────────────────────────────────────────────────────────────
export const OBJECTIF_Z45_MIN = 150; // min/semaine en Z4-Z5
