import {
  getRecovery,
  getWorkouts,
  getTrainings,
  getPains,
  getTests,
  getLastSync,
  isSupabaseConfigured,
} from "@/lib/data";
import {
  weeklyWorkoutAgg,
  currentWeekSummary,
  trendSeries,
  painVsSessions,
  recoveryVsFoot,
  z45VsBronco,
} from "@/lib/analytics";
import { isoWeek, OBJECTIF_Z45_MIN, secToChrono } from "@/lib/utils";
import { Card, StatCard, EmptyState, PageHeader } from "@/components/ui";
import {
  TrendChart,
  WeeklyGoalBars,
  CrossScatter,
} from "@/components/charts";
import SyncButton from "@/app/settings/SyncButton";
import ExportButton from "@/components/ExportButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const [recovery, workouts, trainings, pains, tests, lastSync] = await Promise.all([
    getRecovery(120),
    getWorkouts(120),
    getTrainings(120),
    getPains(180),
    getTests(),
    getLastSync(),
  ]);

  const semaine = isoWeek(new Date());
  const weekAgg = weeklyWorkoutAgg(workouts);
  const summary = currentWeekSummary(weekAgg, recovery, semaine);
  const trends = trendSeries(recovery);

  const weeklyBars = weekAgg.slice(-8).map((w) => ({
    label: w.semaine.replace(/^\d+-/, ""),
    value: Math.round(w.z45),
  }));

  const painSessions = painVsSessions(pains, trainings);
  const recFoot = recoveryVsFoot(recovery, trainings);
  const z45Bronco = z45VsBronco(weekAgg, tests);

  const vo2maxData = tests
    .filter((t) => t.type === "VO2max" && t.resultat != null)
    .map((t) => ({ label: t.date.slice(5), value: Number(t.resultat) }));

  const hasWhoop = recovery.length > 0 || workouts.length > 0;
  const z45Pct = Math.min(100, Math.round((summary.z45 / OBJECTIF_Z45_MIN) * 100));

  const alerteTone =
    summary.alerte === "bad" ? "bad" : summary.alerte === "warn" ? "warn" : "good";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <PageHeader
        title="Dashboard"
        subtitle={`Semaine ${semaine}`}
        action={
          <div className="flex items-center gap-3">
            <ExportButton />
            <SyncButton lastSync={lastSync} />
          </div>
        }
      />

      {!isSupabaseConfigured() && (
        <div className="mb-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Supabase pas encore configure. Renseigne les variables d env puis
          execute les migrations.
        </div>
      )}

      {/* KPIs semaine */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Z4-Z5 cette semaine"
          value={`${summary.z45} min`}
          hint={`Objectif ${OBJECTIF_Z45_MIN} min - ${z45Pct}%`}
          tone={summary.z45 >= OBJECTIF_Z45_MIN ? "good" : "default"}
        />
        <StatCard label="Strain cumule" value={summary.strain || "---"} />
        <StatCard
          label="Recovery moy."
          value={summary.recoveryMoy != null ? `${summary.recoveryMoy}%` : "---"}
          tone={
            summary.recoveryMoy == null
              ? "default"
              : summary.recoveryMoy >= 60
                ? "good"
                : summary.recoveryMoy >= 45
                  ? "warn"
                  : "bad"
          }
        />
        <StatCard
          label="Alerte charge"
          value={summary.alerte === "ok" ? "OK" : summary.alerte === "warn" ? "Vigilance" : "Surcharge"}
          tone={alerteTone}
          hint={summary.alerteMsg}
        />
      </div>

      {!hasWhoop ? (
        <div className="mt-6">
          <EmptyState>
            Aucune donnee Whoop encore. Connecte Whoop dans Reglages et lance une synchro.
          </EmptyState>
        </div>
      ) : (
        <>
          {/* Z4-Z5 hebdo vs objectif */}
          <Card className="mt-6">
            <div className="mb-2 text-sm font-medium">
              Minutes Z4-Z5 par semaine vs objectif
            </div>
            <WeeklyGoalBars data={weeklyBars} goal={OBJECTIF_Z45_MIN} />
          </Card>

          {/* Tendances */}
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Card>
              <div className="mb-2 text-sm font-medium">HRV (ms)</div>
              <TrendChart data={trends} dataKey="hrv" color="#10b981" unit=" ms" />
            </Card>
            <Card>
              <div className="mb-2 text-sm font-medium">FC repos (bpm)</div>
              <TrendChart data={trends} dataKey="fcRepos" color="#0ea5e9" unit=" bpm" />
            </Card>
            <Card>
              <div className="mb-2 text-sm font-medium">Recovery (%)</div>
              <TrendChart data={trends} dataKey="recovery" color="#a855f7" unit="%" domain={[0, 100]} />
            </Card>
          </div>

          {vo2maxData.length > 0 && (
            <Card className="mt-6">
              <div className="mb-2 text-sm font-medium">VO2max (ml/kg/min)</div>
              <TrendChart data={vo2maxData} dataKey="value" color="#f43f5e" unit=" ml/kg/min" />
            </Card>
          )}
        </>
      )}

      {/* Croisements intelligents */}
      <h2 className="mt-10 mb-3 text-lg font-semibold">Croisements</h2>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <div className="mb-1 text-sm font-medium">Douleurs - seances (J-2)</div>
          <p className="mb-3 text-xs text-neutral-400">
            Types de seances dans les 2 jours avant une douleur.
          </p>
          {painSessions.length === 0 ? (
            <p className="text-sm text-neutral-400">Pas assez de donnees.</p>
          ) : (
            <ul className="space-y-1.5">
              {painSessions.map((s) => {
                const max = painSessions[0].count;
                return (
                  <li key={s.type} className="flex items-center gap-2 text-sm">
                    <span className="w-16 shrink-0">{s.type}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                      <div className="h-full rounded-full bg-red-400" style={{ width: `${(s.count / max) * 100}%` }} />
                    </div>
                    <span className="w-6 text-right tabular-nums text-neutral-500">{s.count}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-1 text-sm font-medium">Recovery - RPE foot</div>
          <p className="mb-3 text-xs text-neutral-400">
            Recovery du jour (x) vs RPE seance foot (y).
          </p>
          {recFoot.length === 0 ? (
            <p className="text-sm text-neutral-400">Pas assez de donnees.</p>
          ) : (
            <CrossScatter data={recFoot} xLabel="Recovery %" yLabel="RPE" color="#10b981" />
          )}
        </Card>

        <Card>
          <div className="mb-1 text-sm font-medium">Volume Z4-Z5 - Bronco</div>
          <p className="mb-3 text-xs text-neutral-400">
            Z4-Z5 hebdo (x) vs chrono Bronco (y, plus bas = mieux).
          </p>
          {z45Bronco.length === 0 ? (
            <p className="text-sm text-neutral-400">
              Pas assez de donnees (ajoute des tests Bronco).
            </p>
          ) : (
            <CrossScatter
              data={z45Bronco}
              xLabel="Z4-Z5 min/sem"
              yLabel="Bronco (s)"
              color="#0ea5e9"
            />
          )}
        </Card>
      </div>

      {tests.filter((t) => t.type === "Bronco" && t.resultat != null).length > 0 && (
        <p className="mt-4 text-xs text-neutral-400">
          Dernier Bronco :{" "}
          {secToChrono(
            Number(
              tests.filter((t) => t.type === "Bronco" && t.resultat != null).at(-1)!.resultat
            )
          )}{" "}
          - cible fin aout &lt; 4&apos;15.
        </p>
      )}
    </main>
  );
}
