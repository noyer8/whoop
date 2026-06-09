import { getPains } from "@/lib/data";
import { addPain, deletePain } from "./actions";
import { Card, EmptyState, PageHeader, inputClass, labelClass } from "@/components/ui";
import { SubmitButton, DeleteButton } from "@/components/forms";
import { PainTimeline } from "@/components/charts";

export const dynamic = "force-dynamic";

const ZONES = ["genou", "tibia", "cheville", "cuisse", "mollet", "dos", "hanche", "autre"];

function today() {
  return new Date().toISOString().slice(0, 10);
}

function intensiteColor(i: number) {
  return i >= 7 ? "bg-red-500" : i >= 4 ? "bg-amber-500" : "bg-emerald-500";
}

export default async function PainsPage() {
  const pains = await getPains();
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
        title="Suivi blessures / douleurs"
        subtitle="Genou (jumper's knee), périostite tibiale… log par zone et intensité."
      />

      {timeline.length > 0 && (
        <Card className="mb-6">
          <div className="mb-2 text-sm font-medium">Timeline</div>
          <PainTimeline data={timeline} />
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card>
          <form action={addPain} className="space-y-3">
            <div>
              <label className={labelClass}>Date</label>
              <input type="date" name="date" defaultValue={today()} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Zone</label>
              <select name="zone" required className={inputClass} defaultValue="">
                <option value="" disabled>
                  Choisir…
                </option>
                {ZONES.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Intensité (0-10)</label>
              <input type="number" name="intensite" min={0} max={10} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Contexte</label>
              <textarea name="contexte" rows={3} className={inputClass} placeholder="Après séance course, en montée…" />
            </div>
            <SubmitButton>Ajouter</SubmitButton>
          </form>
        </Card>

        <div className="space-y-2">
          {pains.length === 0 ? (
            <EmptyState>Aucune douleur enregistrée. Tant mieux 💪</EmptyState>
          ) : (
            pains.map((p) => (
              <Card key={p.id}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${intensiteColor(p.intensite)}`} />
                      <span className="font-medium capitalize">{p.zone}</span>
                      <span className="text-sm text-neutral-400">{p.intensite}/10</span>
                      <span className="text-sm text-neutral-500">{p.date}</span>
                    </div>
                    {p.contexte && <p className="mt-1 text-sm text-neutral-500">{p.contexte}</p>}
                  </div>
                  <form action={deletePain}>
                    <input type="hidden" name="id" value={p.id} />
                    <DeleteButton />
                  </form>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
