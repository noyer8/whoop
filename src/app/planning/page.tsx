import Link from "next/link";
import { getPlanning } from "@/lib/data";
import { addPlanned, toggleRealise, deletePlanned } from "./actions";
import { Card, PageHeader, inputClass } from "@/components/ui";
import { DeleteButton } from "@/components/forms";
import { isoWeek, JOURS } from "@/lib/utils";

export const dynamic = "force-dynamic";

const JOURS_LONG: Record<string, string> = {
  lun: "Lundi",
  mar: "Mardi",
  mer: "Mercredi",
  jeu: "Jeudi",
  ven: "Vendredi",
  sam: "Samedi",
  dim: "Dimanche",
};

function shift(dateStr: string, days: number) {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const refDate = date || new Date().toISOString().slice(0, 10);
  const semaine = isoWeek(new Date(refDate + "T00:00:00Z"));

  const rows = await getPlanning(semaine);
  const byDay = (j: string) => rows.filter((r) => r.jour === j);
  const done = rows.filter((r) => r.realise).length;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <PageHeader
        title="Planning"
        subtitle={`Semaine ${semaine} · ${done}/${rows.length} séances réalisées`}
        action={
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/planning?date=${shift(refDate, -7)}`} className="rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
              ← Préc.
            </Link>
            <Link href={`/planning?date=${shift(refDate, 7)}`} className="rounded-lg border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800">
              Suiv. →
            </Link>
          </div>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {JOURS.map((j) => (
          <Card key={j}>
            <div className="mb-2 text-sm font-semibold">{JOURS_LONG[j]}</div>
            <div className="space-y-1.5">
              {byDay(j).map((r) => (
                <div key={r.id} className="flex items-center gap-2 text-sm">
                  <form action={toggleRealise}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="realise" value={String(r.realise)} />
                    <button
                      type="submit"
                      className={`flex h-5 w-5 items-center justify-center rounded border text-xs ${
                        r.realise
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : "border-neutral-300 dark:border-neutral-600"
                      }`}
                    >
                      {r.realise ? "✓" : ""}
                    </button>
                  </form>
                  <span className={`flex-1 ${r.realise ? "text-neutral-400 line-through" : ""}`}>
                    {r.seance_prevue}
                  </span>
                  <form action={deletePlanned}>
                    <input type="hidden" name="id" value={r.id} />
                    <DeleteButton />
                  </form>
                </div>
              ))}
              {byDay(j).length === 0 && (
                <p className="text-xs text-neutral-400">—</p>
              )}
            </div>

            <form action={addPlanned} className="mt-2 flex gap-1">
              <input type="hidden" name="semaine" value={semaine} />
              <input type="hidden" name="jour" value={j} />
              <input name="seance_prevue" placeholder="+ séance" className={`${inputClass} py-1 text-xs`} />
            </form>
          </Card>
        ))}
      </div>

      <p className="mt-4 text-xs text-neutral-400">
        Tape une séance et valide (Entrée) pour l’ajouter. Coche pour marquer comme réalisée.
      </p>
    </main>
  );
}
