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

  // exos saisis en lignes -> tableau de strings
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

export async function deleteTraining(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getSupabaseAdmin().from("trainings").delete().eq("id", id);
  revalidatePath("/trainings");
}
