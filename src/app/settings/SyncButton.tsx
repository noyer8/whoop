"use client";

import { useState, useTransition } from "react";
import { runSyncAction } from "./actions";

export default function SyncButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);

  return (
    <div className="space-y-2">
      <button
        onClick={() =>
          start(async () => {
            const r = await runSyncAction();
            setMsg({ ok: r.ok, text: r.message ?? "" });
          })
        }
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {pending ? "Sync en cours…" : "Lancer un pull Whoop maintenant"}
      </button>
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-emerald-600" : "text-red-600"}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
