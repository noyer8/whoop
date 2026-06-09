import { getTrainings } from "@/lib/data";
import { addTraining, deleteTraining } from "./actions";
import {
  Card,
  EmptyState,
  PageHeader,
  inputClass,
  labelClass,
} from "@/components/ui";
import { DeleteButton } from "@/components/forms";
import QuickTraining from "./QuickTraining";

export const dynamic = "force-dynamic";

export default async function TrainingsPage() {
  const trainings = await getTrainings();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <PageHeader
        title="Journal d'entrainement"
        subtitle="Saisie rapide : 1 tap sur le type, RPE + douleur optionnelle."
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <Card>
          <QuickTraining />
        </Card>

        <div className="space-y-2">
          {trainings.length === 0 ? (
            <EmptyState>Aucune seance enregistree pour l instant.</EmptyState>
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
