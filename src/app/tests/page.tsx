import { getTests } from "@/lib/data";
import { addTest, deleteTest } from "./actions";
import { Card, EmptyState, PageHeader, StatCard, inputClass, labelClass } from "@/components/ui";
import { SubmitButton, DeleteButton } from "@/components/forms";
import { BroncoChart, TrendChart } from "@/components/charts";
import { BRONCO_PALIERS, broncoPalier, secToChrono } from "@/lib/utils";

export const dynamic = "force-dynamic";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export default async function TestsPage() {
  const tests = await getTests();
  const bronco = tests
    .filter((t) => t.type === "Bronco" && t.resultat != null)
    .map((t) => ({ label: t.date.slice(5), sec: Number(t.resultat), date: t.date }));

  const vo2maxTests = tests
    .filter((t) => t.type === "VO2max" && t.resultat != null)
    .map((t) => ({ label: t.date.slice(5), value: Number(t.resultat), date: t.date }));

  const best = bronco.length ? Math.min(...bronco.map((b) => b.sec)) : null;
  const last = bronco.length ? bronco[bronco.length - 1].sec : null;
  const lastVo2 = vo2maxTests.length ? vo2maxTests[vo2maxTests.length - 1].value : null;
  const bestVo2 = vo2maxTests.length ? Math.max(...vo2maxTests.map((v) => v.value)) : null;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <PageHeader
        title="Tests & benchmarks"
        subtitle="Bronco Test : correct 5'30 · bon 5'00 · très bon 4'30 · élite <4'15."
      />

      {bronco.length > 0 && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Dernier Bronco" value={secToChrono(last)} hint={last != null ? broncoPalier(last).label : ""} />
            <StatCard label="Record" value={secToChrono(best)} tone="good" hint={best != null ? broncoPalier(best).label : ""} />
            <StatCard label="Cible fin août" value="< 4'15" hint="palier élite" />
          </div>
          <Card className="mb-6">
            <div className="mb-2 text-sm font-medium">Progression Bronco</div>
            <BroncoChart data={bronco} paliers={BRONCO_PALIERS as unknown as { label: string; max: number; color: string }[]} />
          </Card>
        </>
      )}

      {vo2maxTests.length > 0 && (
        <>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Dernier VO2max" value={lastVo2 != null ? `${lastVo2}` : "---"} hint="ml/kg/min" />
            <StatCard label="Record VO2max" value={bestVo2 != null ? `${bestVo2}` : "---"} tone="good" hint="ml/kg/min" />
          </div>
          <Card className="mb-6">
            <div className="mb-2 text-sm font-medium">Progression VO2max (ml/kg/min)</div>
            <TrendChart data={vo2maxTests} dataKey="value" color="#f43f5e" unit=" ml/kg/min" />
          </Card>
        </>
      )}

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card>
          <form action={addTest} className="space-y-3">
            <div>
              <label className={labelClass}>Date</label>
              <input type="date" name="date" defaultValue={today()} required className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Type</label>
              <select name="type" required className={inputClass} defaultValue="Bronco">
                <option value="Bronco">Bronco</option>
                <option value="VO2max">VO2max</option>
                <option value="sprint">Sprint</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Bronco — min</label>
                <input type="number" name="min" min={0} max={20} className={inputClass} placeholder="5" />
              </div>
              <div>
                <label className={labelClass}>sec</label>
                <input type="number" name="sec" min={0} max={59} className={inputClass} placeholder="00" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Résultat (autres tests)</label>
              <input type="number" step="any" name="resultat" className={inputClass} placeholder="ex. temps sprint (s)" />
            </div>
            <div>
              <label className={labelClass}>Conditions</label>
              <textarea name="conditions" rows={2} className={inputClass} placeholder="Terrain, météo, fatigue…" />
            </div>
            <SubmitButton>Ajouter le test</SubmitButton>
          </form>
        </Card>

        <div className="space-y-2">
          {tests.length === 0 ? (
            <EmptyState>Aucun test enregistré.</EmptyState>
          ) : (
            [...tests].reverse().map((t) => {
              const isBronco = t.type === "Bronco" && t.resultat != null;
              const palier = isBronco ? broncoPalier(Number(t.resultat)) : null;
              return (
                <Card key={t.id}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.type}</span>
                        <span className="text-sm text-neutral-500">{t.date}</span>
                        {isBronco && (
                          <span className="rounded-md px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: palier!.color }}>
                            {secToChrono(Number(t.resultat))} · {palier!.label}
                          </span>
                        )}
                        {!isBronco && t.resultat != null && (
                          <span className="text-sm text-neutral-400">{t.resultat}</span>
                        )}
                      </div>
                      {t.conditions && <p className="mt-1 text-sm text-neutral-500">{t.conditions}</p>}
                    </div>
                    <form action={deleteTest}>
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
