import {
  getRecovery,
  getWorkouts,
  getTrainings,
  getPains,
  getTests,
  getPlanning,
} from "@/lib/data";
import { generateWeeklySummary, generateMonthlySummary } from "@/lib/analytics";
import { isoWeek } from "@/lib/utils";
import { Card, PageHeader } from "@/components/ui";
import CopyBlock from "./CopyBlock";

export const dynamic = "force-dynamic";

export default async function ResumePage() {
  const semaine = isoWeek(new Date());

  const [recovery, workouts, trainings, pains, tests, planning] =
    await Promise.all([
      getRecovery(120),
      getWorkouts(120),
      getTrainings(120),
      getPains(120),
      getTests(),
      getPlanning(semaine),
    ]);

  const weeklySummary = generateWeeklySummary({
    semaine,
    recovery,
    workouts,
    trainings,
    pains,
    tests,
    planning,
  });

  const monthlySummary = generateMonthlySummary({
    recovery,
    workouts,
    tests,
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <PageHeader
        title="Resume"
        subtitle="Texte compact a copier dans Claude pour ton bilan."
      />

      <div className="space-y-6">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Resume semaine ({semaine})</h2>
          </div>
          <CopyBlock text={weeklySummary} />
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Resume mensuel (4 semaines)</h2>
          </div>
          <CopyBlock text={monthlySummary} />
        </Card>
      </div>
    </main>
  );
}
