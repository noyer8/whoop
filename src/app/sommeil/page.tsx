import { getSleep, getRecovery } from "@/lib/data";
import { isoWeekFromString } from "@/lib/utils";
import { Card, StatCard, EmptyState, PageHeader } from "@/components/ui";
import {
  SleepStagesChart,
  SleepDurationChart,
  SleepPhasesBar,
  TrendChart,
  CrossScatter,
} from "@/components/charts";

export const dynamic = "force-dynamic";

const n = (v: number | null | undefined) => (v == null ? 0 : v);

function fmtH(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}h${String(m).padStart(2, "0")}`;
}

export default async function SommeilPage() {
  const [sleep, recovery] = await Promise.all([getSleep(120), getRecovery(120)]);

  if (sleep.length === 0) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <PageHeader title="Sommeil" subtitle="Analyse detaillee du sommeil Whoop." />
        <EmptyState>
          Aucune donnee de sommeil. Synchronise Whoop depuis le dashboard.
        </EmptyState>
      </main>
    );
  }

  // --- KPIs globaux ---
  const recent = sleep.slice(-30);
  const avgDuration = Math.round(recent.reduce((s, r) => s + n(r.duration), 0) / recent.length);
  const avgEfficiency =
    recent.filter((r) => r.efficiency != null).length > 0
      ? Math.round(
          recent.filter((r) => r.efficiency != null).reduce((s, r) => s + Number(r.efficiency), 0) /
            recent.filter((r) => r.efficiency != null).length
        )
      : null;
  const avgDeep = Math.round(recent.reduce((s, r) => s + n(r.deep), 0) / recent.length);
  const avgRem = Math.round(recent.reduce((s, r) => s + n(r.rem), 0) / recent.length);
  const avgLight = Math.round(recent.reduce((s, r) => s + n(r.light), 0) / recent.length);

  const last = sleep[sleep.length - 1];
  const lastDuration = n(last.duration);
  const lastEfficiency = last.efficiency != null ? Math.round(Number(last.efficiency)) : null;

  // --- 7 derniers jours ---
  const last7 = sleep.slice(-7);
  const avg7Duration = Math.round(last7.reduce((s, r) => s + n(r.duration), 0) / last7.length);
  const avg7Deep = Math.round(last7.reduce((s, r) => s + n(r.deep), 0) / last7.length);
  const avg7Rem = Math.round(last7.reduce((s, r) => s + n(r.rem), 0) / last7.length);

  // --- Tendance duree (dette de sommeil) ---
  const durationTrend = sleep.map((s) => ({
    label: s.date.slice(5),
    duration: n(s.duration),
    efficiency: s.efficiency != null ? Math.round(Number(s.efficiency)) : null,
  }));

  // --- Phases stackees ---
  const stagesData = sleep.map((s) => ({
    label: s.date.slice(5),
    deep: n(s.deep),
    rem: n(s.rem),
    light: n(s.light),
  }));

  // --- Efficacite seule ---
  const efficiencyData = sleep
    .filter((s) => s.efficiency != null)
    .map((s) => ({
      label: s.date.slice(5),
      efficiency: Math.round(Number(s.efficiency)),
    }));

  // --- Deep + REM en % du total ---
  const qualityData = sleep.map((s) => {
    const total = n(s.deep) + n(s.rem) + n(s.light);
    return {
      label: s.date.slice(5),
      deepPct: total > 0 ? Math.round((n(s.deep) / total) * 100) : 0,
      remPct: total > 0 ? Math.round((n(s.rem) / total) * 100) : 0,
    };
  });

  // --- Moyennes hebdo ---
  const weekMap = new Map<string, { durations: number[]; deeps: number[]; rems: number[]; efficiencies: number[] }>();
  for (const s of sleep) {
    const sem = isoWeekFromString(s.date);
    const entry = weekMap.get(sem) ?? { durations: [], deeps: [], rems: [], efficiencies: [] };
    entry.durations.push(n(s.duration));
    entry.deeps.push(n(s.deep));
    entry.rems.push(n(s.rem));
    if (s.efficiency != null) entry.efficiencies.push(Number(s.efficiency));
    weekMap.set(sem, entry);
  }
  const weeklyAvg = [...weekMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([sem, v]) => ({
      label: sem.replace(/^\d+-/, ""),
      duration: Math.round(v.durations.reduce((a, b) => a + b, 0) / v.durations.length),
      deep: Math.round(v.deeps.reduce((a, b) => a + b, 0) / v.deeps.length),
      rem: Math.round(v.rems.reduce((a, b) => a + b, 0) / v.rems.length),
      efficiency: v.efficiencies.length > 0
        ? Math.round(v.efficiencies.reduce((a, b) => a + b, 0) / v.efficiencies.length)
        : null,
    }));

  // --- Correlation sommeil vs recovery ---
  const recByDate = new Map(
    recovery.filter((r) => r.recovery_score != null).map((r) => [r.date, Number(r.recovery_score)])
  );
  const sleepVsRecovery = sleep
    .filter((s) => s.duration != null && recByDate.has(s.date))
    .map((s) => ({
      x: n(s.duration),
      y: recByDate.get(s.date)!,
      label: s.date,
    }));
  const deepVsRecovery = sleep
    .filter((s) => s.deep != null && recByDate.has(s.date))
    .map((s) => ({
      x: n(s.deep),
      y: recByDate.get(s.date)!,
      label: s.date,
    }));

  // --- Regularity (ecart type heure de coucher estimee) ---
  const durationStdDev = recent.length > 1
    ? Math.round(
        Math.sqrt(
          recent.reduce((s, r) => s + Math.pow(n(r.duration) - avgDuration, 2), 0) / (recent.length - 1)
        )
      )
    : null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <PageHeader
        title="Sommeil"
        subtitle="Analyse detaillee du sommeil via Whoop."
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard
          label="Derniere nuit"
          value={fmtH(lastDuration)}
          hint={lastEfficiency != null ? `Efficacite ${lastEfficiency}%` : undefined}
          tone={lastDuration >= 420 ? "good" : lastDuration >= 360 ? "warn" : "bad"}
        />
        <StatCard
          label="Moy. 30j"
          value={fmtH(avgDuration)}
          hint={`${recent.length} nuits`}
          tone={avgDuration >= 420 ? "good" : avgDuration >= 360 ? "warn" : "bad"}
        />
        <StatCard
          label="Moy. 7j"
          value={fmtH(avg7Duration)}
          hint={`Deep ${fmtH(avg7Deep)} / REM ${fmtH(avg7Rem)}`}
          tone={avg7Duration >= 420 ? "good" : avg7Duration >= 360 ? "warn" : "bad"}
        />
        <StatCard
          label="Efficacite moy."
          value={avgEfficiency != null ? `${avgEfficiency}%` : "---"}
          tone={avgEfficiency != null ? (avgEfficiency >= 85 ? "good" : avgEfficiency >= 70 ? "warn" : "bad") : "default"}
        />
        <StatCard
          label="Regularite"
          value={durationStdDev != null ? `+/- ${durationStdDev} min` : "---"}
          hint="Ecart-type duree 30j"
          tone={durationStdDev != null ? (durationStdDev <= 30 ? "good" : durationStdDev <= 60 ? "warn" : "bad") : "default"}
        />
      </div>

      {/* Repartition moyenne phases */}
      <Card className="mt-6">
        <div className="mb-3 text-sm font-medium">Repartition moyenne des phases (30 derniers jours)</div>
        <SleepPhasesBar deep={avgDeep} rem={avgRem} light={avgLight} total={avgDeep + avgRem + avgLight} />
        <div className="mt-2 text-xs text-neutral-400">
          Objectifs : profond 15-20% ({fmtH(Math.round(avgDuration * 0.175))}) | REM 20-25% ({fmtH(Math.round(avgDuration * 0.225))})
        </div>
      </Card>

      {/* Duree + efficacite jour par jour */}
      <Card className="mt-6">
        <div className="mb-2 text-sm font-medium">Duree de sommeil + efficacite</div>
        <SleepDurationChart data={durationTrend} />
      </Card>

      {/* Phases stackees */}
      <Card className="mt-6">
        <div className="mb-2 text-sm font-medium">Phases de sommeil (empilees)</div>
        <SleepStagesChart data={stagesData} />
      </Card>

      {/* Qualite : deep + REM en % */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-2 text-sm font-medium">Sommeil profond (% du total)</div>
          <TrendChart data={qualityData} dataKey="deepPct" color="#6366f1" unit="%" domain={[0, 50]} />
        </Card>
        <Card>
          <div className="mb-2 text-sm font-medium">Sommeil REM (% du total)</div>
          <TrendChart data={qualityData} dataKey="remPct" color="#a855f7" unit="%" domain={[0, 50]} />
        </Card>
      </div>

      {/* Efficacite seule */}
      <Card className="mt-6">
        <div className="mb-2 text-sm font-medium">Efficacite du sommeil (%)</div>
        <TrendChart data={efficiencyData} dataKey="efficiency" color="#10b981" unit="%" domain={[50, 100]} />
      </Card>

      {/* Moyennes hebdo */}
      <Card className="mt-6">
        <div className="mb-2 text-sm font-medium">Moyennes hebdomadaires</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-700">
                <th className="pb-2 pr-4">Semaine</th>
                <th className="pb-2 pr-4">Duree</th>
                <th className="pb-2 pr-4">Profond</th>
                <th className="pb-2 pr-4">REM</th>
                <th className="pb-2">Efficacite</th>
              </tr>
            </thead>
            <tbody>
              {weeklyAvg.map((w) => (
                <tr key={w.label} className="border-b border-neutral-100 dark:border-neutral-800">
                  <td className="py-1.5 pr-4 font-medium">{w.label}</td>
                  <td className={`py-1.5 pr-4 tabular-nums ${w.duration >= 420 ? "text-emerald-600" : w.duration >= 360 ? "text-amber-600" : "text-red-600"}`}>
                    {fmtH(w.duration)}
                  </td>
                  <td className="py-1.5 pr-4 tabular-nums">{fmtH(w.deep)}</td>
                  <td className="py-1.5 pr-4 tabular-nums">{fmtH(w.rem)}</td>
                  <td className="py-1.5 tabular-nums">{w.efficiency != null ? `${w.efficiency}%` : "---"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Correlations */}
      <h2 className="mt-10 mb-3 text-lg font-semibold">Correlations sommeil - recovery</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <div className="mb-1 text-sm font-medium">Duree totale vs Recovery</div>
          <p className="mb-3 text-xs text-neutral-400">
            Plus de sommeil = meilleure recovery ?
          </p>
          {sleepVsRecovery.length < 3 ? (
            <p className="text-sm text-neutral-400">Pas assez de donnees.</p>
          ) : (
            <CrossScatter data={sleepVsRecovery} xLabel="Duree (min)" yLabel="Recovery %" color="#6366f1" />
          )}
        </Card>
        <Card>
          <div className="mb-1 text-sm font-medium">Sommeil profond vs Recovery</div>
          <p className="mb-3 text-xs text-neutral-400">
            Le deep sleep predit-il la recovery ?
          </p>
          {deepVsRecovery.length < 3 ? (
            <p className="text-sm text-neutral-400">Pas assez de donnees.</p>
          ) : (
            <CrossScatter data={deepVsRecovery} xLabel="Profond (min)" yLabel="Recovery %" color="#a855f7" />
          )}
        </Card>
      </div>

      <p className="mt-6 text-xs text-neutral-400">
        Recommendations : 7-9h de sommeil total, 15-20% profond, 20-25% REM, efficacite &gt; 85%.
      </p>
    </main>
  );
}
