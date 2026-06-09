"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({ children = "Enregistrer" }: { children?: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
    >
      {pending ? "…" : children}
    </button>
  );
}

export function DeleteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md px-2 py-1 text-xs text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950"
      aria-label="Supprimer"
      title="Supprimer"
    >
      ✕
    </button>
  );
}
