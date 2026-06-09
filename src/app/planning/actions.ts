"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function addPlanned(formData: FormData) {
  const semaine = String(formData.get("semaine") || "");
  const jour = String(formData.get("jour") || "");
  const seance_prevue = String(formData.get("seance_prevue") || "").trim();
  if (!semaine || !jour || !seance_prevue) return;

  await getSupabaseAdmin().from("planning").insert({ semaine, jour, seance_prevue, realise: false });
  revalidatePath("/planning");
}

export async function toggleRealise(formData: FormData) {
  const id = Number(formData.get("id"));
  const realise = String(formData.get("realise")) === "true";
  if (!id) return;
  await getSupabaseAdmin().from("planning").update({ realise: !realise }).eq("id", id);
  revalidatePath("/planning");
}

export async function deletePlanned(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getSupabaseAdmin().from("planning").delete().eq("id", id);
  revalidatePath("/planning");
}
