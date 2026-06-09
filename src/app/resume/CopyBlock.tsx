"use client";

import { useState } from "react";

export default function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <pre className="max-h-[500px] overflow-auto rounded-lg bg-neutral-50 p-4 text-xs leading-relaxed text-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
        {text}
      </pre>
      <button
        onClick={handleCopy}
        className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
      >
        {copied ? "Copie !" : "Copier dans le presse-papier"}
      </button>
    </div>
  );
}
