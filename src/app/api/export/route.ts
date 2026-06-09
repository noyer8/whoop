import { NextResponse } from "next/server";
import {
  getRecovery,
  getWorkouts,
  getSleep,
  getTrainings,
  getPains,
  getTests,
  getPlanning,
} from "@/lib/data";

export const dynamic = "force-dynamic";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const keys = Object.keys(rows[0]);
  const header = keys.join(",");
  const lines = rows.map((row) =>
    keys
      .map((k) => {
        const v = row[k];
        if (v == null) return "";
        const s = typeof v === "object" ? JSON.stringify(v) : String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n")
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      })
      .join(",")
  );
  return [header, ...lines].join("\n");
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "json";

  const [recovery, sleep, workouts, trainings, pains, tests, planning] =
    await Promise.all([
      getRecovery(9999),
      getSleep(9999),
      getWorkouts(9999),
      getTrainings(9999),
      getPains(9999),
      getTests(),
      getPlanning(),
    ]);

  if (format === "json") {
    const data = { recovery, sleep, workouts, trainings, pains, tests, planning };
    return NextResponse.json(data, {
      headers: {
        "Content-Disposition": `attachment; filename="whoop-tracker-export.json"`,
      },
    });
  }

  const sections = [
    { name: "recovery", rows: recovery },
    { name: "sleep", rows: sleep },
    { name: "workouts", rows: workouts },
    { name: "trainings", rows: trainings },
    { name: "pains", rows: pains },
    { name: "tests", rows: tests },
    { name: "planning", rows: planning },
  ];

  const csvParts = sections
    .filter((s) => s.rows.length > 0)
    .map((s) => `=== ${s.name.toUpperCase()} ===\n${toCsv(s.rows as Record<string, unknown>[])}`)
    .join("\n\n");

  return new Response(csvParts, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="whoop-tracker-export.csv"`,
    },
  });
}
