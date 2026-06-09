"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function addTraining(formData: FormData) {
  const date = String(formData.get("date") || "");
  const type_seance = String(formData.get("type_seance") || "");
  const rpeRaw = formData.get("rpe");
  const exosRaw = String(formData.get("exos") || "").trim();
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!date || !type_seance) return;

  const exos = exosRaw
    ? exosRaw.split("\n").map((l) => l.trim()).filter(Boolean)
    : null;

  const supabase = getSupabaseAdmin();
  await supabase.from("trainings").insert({
    date,
    type_seance,
    rpe: rpeRaw ? Number(rpeRaw) : null,
    exos,
    notes,
  });
  revalidatePath("/trainings");
}

export async function quickAddTraining(input: {
  type_seance: string;
  rpe: number;
  notes: string | null;
  painZone: string | null;
  painIntensity: number | null;
}) {
  const supabase = getSupabaseAdmin();
  const date = new Date().toISOString().slice(0, 10);

  await supabase.from("trainings").insert({
    date,
    type_seance: input.type_seance,
    rpe: input.rpe,
    exos: null,
    notes: input.notes,
  });

  if (input.painZone && input.painIntensity != null) {
    await supabase.from("pains").insert({
      date,
      zone: input.painZone,
      intensite: input.painIntensity,
      contexte: `Apres seance ${input.type_seance}`,
    });
  }

  revalidatePath("/trainings");
  revalidatePath("/pains");
  revalidatePath("/");
}

export async function deleteTraining(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getSupabaseAdmin().from("trainings").delete().eq("id", id);
  revalidatePath("/trainings");
}
