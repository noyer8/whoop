"use client";

import { useState } from "react";

export default function ExportButton() {
  const [pending, setPending] = useState(false);

  async function download(format: "json" | "csv") {
    setPending(true);
    try {
      const res = await fetch(`/api/export?format=${format}`);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `whoop-tracker-export-${new Date().toISOString().slice(0, 10)}.${format === "json" ? "json" : "zip"}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => download("json")}
        disabled={pending}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        {pending ? "..." : "Export JSON"}
      </button>
      <button
        onClick={() => download("csv")}
        disabled={pending}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm transition-colors hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        {pending ? "..." : "Export CSV"}
      </button>
    </div>
  );
}
