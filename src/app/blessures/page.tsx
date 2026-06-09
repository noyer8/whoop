import {
  getInjuries,
  getInjuryPains,
  getInjuryTreatments,
  getWorkouts,
  getTrainings,
  getPains,
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
import { addPain, deletePain } from "@/app/pains/actions";
import { Card, EmptyState, PageHeader, inputClass, labelClass } from "@/components/ui";
import { SubmitButton, DeleteButton } from "@/components/forms";
import { InjuryPainChart } from "./InjuryChart";
import { PainTimeline } from "@/components/charts";
import type { Injury } from "@/types/db";

export const dynamic = "force-dynamic";

const METHODES = ["repos", "glace", "foam roll", "etirements", "kine", "strapping", "anti-inflammatoire", "autre"];
const ZONES = ["genou", "tibia", "cheville", "cuisse", "mollet", "dos", "hanche", "autre"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function intensiteColor(i: number) {
  return i >= 7 ? "bg-red-500" : i >= 4 ? "bg-amber-500" : "bg-emerald-500";
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
            {injury.statut === "retabli" && injury.resolved_at && (
              <> - Retabli le {new Date(injury.resolved_at).toLocaleDateString("fr-FR")}</>
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
  const [active, archived, pains] = await Promise.all([
    getInjuries("active"),
    getInjuries("retabli"),
    getPains(365),
  ]);

  const timeline = pains
    .map((p) => ({
      x: new Date(p.date).getTime(),
      intensite: p.intensite,
      zone: p.zone,
      label: p.date,
    }))
    .sort((a, b) => a.x - b.x);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <PageHeader
        title="Blessures & douleurs"
        subtitle="Suivi blessures, courbes de douleur, timeline soins + log douleurs ponctuelles."
      />

      {/* Timeline globale des douleurs */}
      {timeline.length > 0 && (
        <Card className="mb-6">
          <div className="mb-2 text-sm font-medium">Timeline douleurs (toutes zones)</div>
          <PainTimeline data={timeline} />
        </Card>
      )}

      {/* Douleur ponctuelle (pas liee a une blessure) */}
      <div className="mb-6 grid gap-4 lg:grid-cols-[340px_1fr]">
        <Card>
          <div className="mb-2 text-sm font-medium">Douleur ponctuelle</div>
          <form action={addPain} className="space-y-3">
            <div>
              <label className={labelClass}>Date</label>
              <input type="date" name="date" defaultValue={today()} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Zone</label>
              <select name="zone" required className={inputClass} defaultValue="">
                <option value="" disabled>Choisir...</option>
                {ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Intensite (0-10)</label>
              <input type="number" name="intensite" min={0} max={10} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Contexte</label>
              <textarea name="contexte" rows={2} className={inputClass} placeholder="Apres seance course, en montee..." />
            </div>
            <SubmitButton>Ajouter</SubmitButton>
          </form>
        </Card>

        {/* Historique douleurs ponctuelles */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Historique douleurs</div>
          {pains.length === 0 ? (
            <p className="text-xs text-neutral-400">Aucune douleur enregistree.</p>
          ) : (
            pains.slice(0, 20).map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-lg border border-neutral-200 px-3 py-2 text-xs dark:border-neutral-800">
                <span className={`h-2 w-2 shrink-0 rounded-full ${intensiteColor(p.intensite)}`} />
                <span className="font-medium capitalize">{p.zone}</span>
                <span className="text-neutral-400">{p.intensite}/10</span>
                <span className="text-neutral-500">{p.date}</span>
                {p.contexte && <span className="truncate text-neutral-400">{p.contexte}</span>}
                <form action={deletePain} className="ml-auto">
                  <input type="hidden" name="id" value={p.id} />
                  <DeleteButton />
                </form>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Nouvelle blessure */}
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
