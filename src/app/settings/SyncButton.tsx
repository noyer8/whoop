"use client";

import { useState, useTransition } from "react";
import { runSyncAction } from "./actions";

export default function SyncButton({ lastSync }: { lastSync: string | null }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null);
  const [syncTime, setSyncTime] = useState(lastSync);

  const formatted = syncTime
    ? new Date(syncTime).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() =>
          start(async () => {
            const r = await runSyncAction();
            setMsg({ ok: r.ok, text: r.message ?? "" });
            if (r.ok) setSyncTime(new Date().toISOString());
          })
        }
        disabled={pending}
        className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
      >
        {pending ? "Sync..." : "Synchroniser Whoop"}
      </button>
      <span className="text-xs text-neutral-400">
        {msg ? (
          <span className={msg.ok ? "text-emerald-600" : "text-red-600"}>{msg.text}</span>
        ) : formatted ? (
          `Derniere synchro : ${formatted}`
        ) : (
          "Jamais synchronise"
        )}
      </span>
    </div>
  );
}
