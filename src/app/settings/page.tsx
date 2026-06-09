import { Card, PageHeader } from "@/components/ui";
import { isSupabaseConfigured } from "@/lib/data";
import SyncButton from "./SyncButton";

export const dynamic = "force-dynamic";

function Status({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`h-2.5 w-2.5 rounded-full ${ok ? "bg-emerald-500" : "bg-neutral-300 dark:bg-neutral-600"}`} />
      {label}
    </div>
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ whoop?: string; msg?: string }>;
}) {
  const { whoop, msg } = await searchParams;
  const supabaseOk = isSupabaseConfigured();
  const whoopEnvOk = Boolean(
    process.env.WHOOP_CLIENT_ID && process.env.WHOOP_CLIENT_SECRET && process.env.WHOOP_REDIRECT_URI
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <PageHeader title="Réglages" subtitle="Connexions Supabase & Whoop." />

      {whoop === "ok" && (
        <div className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          ✓ Whoop connecté. Le refresh token est stocké, le pull peut tourner.
        </div>
      )}
      {whoop === "error" && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          ✗ Échec connexion Whoop : {msg || "erreur inconnue"}
        </div>
      )}

      <div className="space-y-4">
        <Card>
          <h2 className="mb-2 font-semibold">Supabase</h2>
          <Status ok={supabaseOk} label={supabaseOk ? "Variables configurées" : "Variables manquantes (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)"} />
        </Card>

        <Card>
          <h2 className="mb-2 font-semibold">Whoop</h2>
          <div className="space-y-2">
            <Status ok={whoopEnvOk} label={whoopEnvOk ? "Client ID / Secret configurés" : "Variables Whoop manquantes"} />
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="/api/whoop/authorize"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Connecter Whoop (OAuth)
              </a>
              <SyncButton />
            </div>
            <p className="pt-1 text-xs text-neutral-400">
              1. « Connecter Whoop » lance le consentement OAuth et stocke le refresh token.
              2. Ensuite le cron nocturne (ou le bouton ci-dessus) récupère les données.
            </p>
          </div>
        </Card>
      </div>
    </main>
  );
}
