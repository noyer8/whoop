import { getTrainings } from "@/lib/data";
import { addTraining, deleteTraining } from "./actions";
import {
  Card,
  EmptyState,
  PageHeader,
  inputClass,
  labelClass,
} from "@/components/ui";
import { SubmitButton, DeleteButton } from "@/components/forms";

export const dynamic = "force-dynamic";

const TYPES = ["FB1", "FB2", "H1", "H2", "foot", "course", "natation", "corde"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function TrainingsPage() {
  const trainings = await getTrainings();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <PageHeader
        title="Journal d'entraînement"
        subtitle="Saisie rapide de chaque séance."
      />

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card>
          <form action={addTraining} className="space-y-3">
            <div>
              <label className={labelClass}>Date</label>
              <input type="date" name="date" defaultValue={today()} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Type de séance</label>
              <select name="type_seance" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  Choisir…
                </option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>RPE (1-10)</label>
              <input type="number" name="rpe" min={1} max={10} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Exos (une ligne par exo)</label>
              <textarea name="exos" rows={4} className={inputClass} placeholder={"Gainage 3x45s\nPompes 4x15"} />
            </div>
            <div>
              <label className={labelClass}>Notes technique</label>
              <textarea name="notes" rows={2} className={inputClass} />
            </div>
            <SubmitButton>Ajouter la séance</SubmitButton>
          </form>
        </Card>

        <div className="space-y-2">
          {trainings.length === 0 ? (
            <EmptyState>Aucune séance enregistrée pour l’instant.</EmptyState>
          ) : (
            trainings.map((t) => {
              const exos = Array.isArray(t.exos) ? (t.exos as string[]) : [];
              return (
                <Card key={t.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          {t.type_seance}
                        </span>
                        <span className="text-sm text-neutral-500">{t.date}</span>
                        {t.rpe != null && (
                          <span className="text-xs text-neutral-400">RPE {t.rpe}</span>
                        )}
                      </div>
                      {exos.length > 0 && (
                        <ul className="mt-2 list-inside list-disc text-sm text-neutral-600 dark:text-neutral-300">
                          {exos.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      )}
                      {t.notes && (
                        <p className="mt-1 text-sm text-neutral-500">{t.notes}</p>
                      )}
                    </div>
                    <form action={deleteTraining}>
                      <input type="hidden" name="id" value={t.id} />
                      <DeleteButton />
                    </form>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
