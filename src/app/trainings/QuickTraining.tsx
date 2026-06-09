"use client";

import { useState, useTransition } from "react";
import { quickAddTraining } from "./actions";
import { inputClass, labelClass } from "@/components/ui";

const TYPES = ["FB1", "FB2", "H1", "H2", "foot", "course", "natation", "corde"] as const;

const TYPE_COLORS: Record<string, string> = {
  FB1: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700",
  FB2: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-700",
  H1: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-700",
  H2: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-700",
  foot: "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700",
  course: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700",
  natation: "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-700",
  corde: "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700",
};

const ZONES = ["genou", "tibia", "cheville", "cuisse", "mollet", "dos", "hanche", "autre"];

export default function QuickTraining() {
  const [selected, setSelected] = useState<string | null>(null);
  const [rpe, setRpe] = useState<number>(5);
  const [painZone, setPainZone] = useState("");
  const [painIntensity, setPainIntensity] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function handleSubmit() {
    if (!selected) return;
    start(async () => {
      await quickAddTraining({
        type_seance: selected,
        rpe,
        notes: notes || null,
        painZone: painZone || null,
        painIntensity: painZone ? painIntensity : null,
      });
      setMsg(`${selected} enregistre (RPE ${rpe})`);
      setSelected(null);
      setRpe(5);
      setPainZone("");
      setPainIntensity(0);
      setNotes("");
      setTimeout(() => setMsg(null), 3000);
    });
  }

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium">Type de seance</div>
      <div className="grid grid-cols-4 gap-2">
        {TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setSelected(t)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
              selected === t
                ? `${TYPE_COLORS[t]} ring-2 ring-offset-1 ring-neutral-900 dark:ring-white`
                : "border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:border-neutral-700 dark:text-neutral-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {selected && (
        <>
          <div>
            <label className={labelClass}>RPE (1-10)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={1}
                max={10}
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
                className="flex-1"
              />
              <span className="w-8 text-center text-lg font-semibold tabular-nums">{rpe}</span>
            </div>
          </div>

          <div>
            <label className={labelClass}>Douleur (optionnel)</label>
            <div className="flex gap-2">
              <select
                value={painZone}
                onChange={(e) => setPainZone(e.target.value)}
                className={`${inputClass} flex-1`}
              >
                <option value="">Aucune</option>
                {ZONES.map((z) => (
                  <option key={z} value={z}>{z}</option>
                ))}
              </select>
              {painZone && (
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={painIntensity}
                  onChange={(e) => setPainIntensity(Number(e.target.value))}
                  className={`${inputClass} w-20`}
                  placeholder="0-10"
                />
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={pending}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {pending ? "..." : `Enregistrer ${selected}`}
          </button>
        </>
      )}

      {msg && (
        <p className="text-sm text-emerald-600">{msg}</p>
      )}
    </div>
  );
}
