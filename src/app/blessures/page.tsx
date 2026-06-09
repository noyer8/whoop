import {
  getInjuries,
  getInjuryPains,
  getInjuryTreatments,
  getWorkouts,
  getTrainings,
} from "@/lib/data";
import {
  addInjury,
  resolveInjury,
  reactivateInjury,
  deleteInjury,
  addInjuryPain,
  deleteInjuryPain,
  addTreatment,
  deleteTreatment,
} from "./actions";
import { Card, EmptyState, PageHeader, inputClass, labelClass } from "@/components/ui";
import { SubmitButton, DeleteButton } from "@/components/forms";
import { InjuryPainChart } from "./InjuryChart";
import type { Injury } from "@/types/db";

export const dynamic = "force-dynamic";

const METHODES = ["repos", "glace", "foam roll", "etirements", "kine", "strapping", "anti-inflammatoire", "autre"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function InjuryDetail({ injury }: { injury: Injury }) {
  const [painPoints, treatments, workouts, trainings] = await Promise.all([
    getInjuryPains(injury.id),
    getInjuryTreatments(injury.id),
    getWorkouts(365),
    getTrainings(365),
  ]);

  const dateRange = painPoints.length > 0
    ? { start: painPoints[0].date, end: painPoints[painPoints.length - 1].date }
    : null;

  const activitiesInRange = dateRange
    ? [
        ...workouts
          .filter((w) => w.date >= dateRange.start && w.date <= dateRange.end)
          .map((w) => ({ date: w.date, label: w.type ?? "Whoop workout", source: "whoop" as const })),
        ...trainings
          .filter((t) => t.date >= dateRange.start && t.date <= dateRange.end)
          .map((t) => ({ date: t.date, label: `${t.type_seance}${t.rpe ? ` RPE${t.rpe}` : ""}`, source: "manual" as const })),
      ].sort((a, b) => a.date.localeCompare(b.date))
    : [];

  const chartData = painPoints.map((p) => {
    const dayActivities = activitiesInRange.filter((a) => a.date === p.date);
    return {
      date: p.date,
      label: p.date.slice(5),
      intensite: p.intensite,
      note: p.note,
      activities: dayActivities.map((a) => a.label).join(", "),
    };
  });

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">{injury.nom}</h3>
          <p className="text-xs text-neutral-400">
            Depuis le {new Date(injury.created_at).toLocaleDateString("fr-FR")}
            {injury.cause && <> — Cause : {injury.cause}</>}
            {injury.statut === "retabli" && injury.resolved_at && (
              <> — Retabli le {new Date(injury.resolved_at).toLocaleDateString("fr-FR")}</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {injury.statut === "active" ? (
            <form action={resolveInjury}>
              <input type="hidden" name="id" value={injury.id} />
              <button
                type="submit"
                className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
              >
                Marquer retabli
              </button>
            </form>
          ) : (
            <form action={reactivateInjury}>
              <input type="hidden" name="id" value={injury.id} />
              <button
                type="submit"
                className="rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-200 dark:bg-amber-950 dark:text-amber-300"
              >
                Reactiver
              </button>
            </form>
          )}
          <form action={deleteInjury}>
            <input type="hidden" name="id" value={injury.id} />
            <DeleteButton />
          </form>
        </div>
      </div>

      {chartData.length > 0 && (
        <div>
          <div className="mb-1 text-xs font-medium text-neutral-500">Courbe de douleur</div>
          <InjuryPainChart data={chartData} />
        </div>
      )}

      {painPoints.length > 0 && (
        <div className="space-y-1">
          <div className="text-xs font-medium text-neutral-500">Points de douleur</div>
          {painPoints.map((p) => {
            const dayActs = activitiesInRange.filter((a) => a.date === p.date);
            return (
              <div key={p.id} className="flex items-center gap-2 text-xs">
                <span className="text-neutral-400">{p.date}</span>
                <span className={`font-medium ${p.intensite >= 7 ? "text-red-600" : p.intensite >= 4 ? "text-amber-600" : "text-emerald-600"}`}>
                  {p.intensite}/10
                </span>
                {dayActs.length > 0 && (
                  <span className="text-neutral-400">[{dayActs.map((a) => a.label).join(", ")}]</span>
                )}
                {p.note && <span className="text-neutral-500">{p.note}</span>}
                <form action={deleteInjuryPain} className="ml-auto">
                  <input type="hidden" name="id" value={p.id} />
                  <DeleteButton />
                </form>
              </div>
            );
          })}
        </div>
      )}

      {injury.statut === "active" && (
        <form action={addInjuryPain} className="flex items-end gap-2">
          <input type="hidden" name="injury_id" value={injury.id} />
          <div>
            <label className={labelClass}>Date</label>
            <input type="date" name="date" defaultValue={today()} required className={`${inputClass} py-1 text-xs`} />
          </div>
          <div className="w-16">
            <label className={labelClass}>0-10</label>
            <input type="number" name="intensite" min={0} max={10} required className={`${inputClass} py-1 text-xs`} />
          </div>
          <div className="flex-1">
            <label className={labelClass}>Note</label>
            <input type="text" name="note" className={`${inputClass} py-1 text-xs`} placeholder="Optionnel" />
          </div>
          <SubmitButton>+</SubmitButton>
        </form>
      )}

      <div>
        <div className="mb-1 text-xs font-medium text-neutral-500">Soins</div>
        {treatments.length > 0 ? (
          <div className="space-y-1">
            {treatments.map((tr) => (
              <div key={tr.id} className="flex items-center gap-2 text-xs">
                <span className="rounded bg-blue-100 px-1.5 py-0.5 font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  {tr.methode}
                </span>
                <span className="text-neutral-400">
                  {tr.date_debut}{tr.date_fin ? ` -> ${tr.date_fin}` : " -> en cours"}
                </span>
                <form action={deleteTreatment} className="ml-auto">
                  <input type="hidden" name="id" value={tr.id} />
                  <DeleteButton />
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-neutral-400">Aucun soin enregistre.</p>
        )}
        {injury.statut === "active" && (
          <form action={addTreatment} className="mt-2 flex items-end gap-2">
            <input type="hidden" name="injury_id" value={injury.id} />
            <div>
              <label className={labelClass}>Debut</label>
              <input type="date" name="date_debut" defaultValue={today()} required className={`${inputClass} py-1 text-xs`} />
            </div>
            <div>
              <label className={labelClass}>Fin</label>
              <input type="date" name="date_fin" className={`${inputClass} py-1 text-xs`} />
            </div>
            <div className="flex-1">
              <label className={labelClass}>Methode</label>
              <select name="methode" required className={`${inputClass} py-1 text-xs`} defaultValue="">
                <option value="" disabled>Choisir...</option>
                {METHODES.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <SubmitButton>+</SubmitButton>
          </form>
        )}
      </div>
    </Card>
  );
}

export default async function BlessuresPage() {
  const [active, archived] = await Promise.all([
    getInjuries("active"),
    getInjuries("retabli"),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <PageHeader
        title="Blessures"
        subtitle="Suivi des blessures : courbe de douleur, activites, timeline soins."
      />

      <Card className="mb-6">
        <form action={addInjury} className="flex items-end gap-3">
          <div className="flex-1">
            <label className={labelClass}>Nouvelle blessure</label>
            <input
              type="text"
              name="nom"
              required
              className={inputClass}
              placeholder="ex. genou droit jumper's knee"
            />
          </div>
          <div className="flex-1">
            <label className={labelClass}>Cause probable</label>
            <input
              type="text"
              name="cause"
              className={inputClass}
              placeholder="ex. surcharge course, choc match..."
            />
          </div>
          <SubmitButton>Ajouter</SubmitButton>
        </form>
      </Card>

      {active.length === 0 && archived.length === 0 && (
        <EmptyState>Aucune blessure enregistree.</EmptyState>
      )}

      {active.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Blessures actives ({active.length})</h2>
          {active.map((inj) => (
            <InjuryDetail key={inj.id} injury={inj} />
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold text-neutral-400">Anciennes blessures ({archived.length})</h2>
          {archived.map((inj) => (
            <InjuryDetail key={inj.id} injury={inj} />
          ))}
        </div>
      )}
    </main>
  );
}
