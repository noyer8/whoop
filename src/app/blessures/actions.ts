"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function addInjury(formData: FormData) {
  const nom = String(formData.get("nom") || "").trim();
  if (!nom) return;
  await getSupabaseAdmin().from("injuries").insert({ nom, statut: "active" });
  revalidatePath("/blessures");
}

export async function resolveInjury(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getSupabaseAdmin()
    .from("injuries")
    .update({ statut: "retabli", resolved_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/blessures");
}

export async function reactivateInjury(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getSupabaseAdmin()
    .from("injuries")
    .update({ statut: "active", resolved_at: null })
    .eq("id", id);
  revalidatePath("/blessures");
}

export async function deleteInjury(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getSupabaseAdmin().from("injuries").delete().eq("id", id);
  revalidatePath("/blessures");
}

export async function addInjuryPain(formData: FormData) {
  const injury_id = Number(formData.get("injury_id"));
  const date = String(formData.get("date") || "");
  const intensite = Number(formData.get("intensite"));
  const note = String(formData.get("note") || "").trim() || null;
  if (!injury_id || !date || Number.isNaN(intensite)) return;
  await getSupabaseAdmin().from("injury_pains").insert({ injury_id, date, intensite, note });
  revalidatePath("/blessures");
}

export async function deleteInjuryPain(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getSupabaseAdmin().from("injury_pains").delete().eq("id", id);
  revalidatePath("/blessures");
}

export async function addTreatment(formData: FormData) {
  const injury_id = Number(formData.get("injury_id"));
  const date_debut = String(formData.get("date_debut") || "");
  const date_fin = String(formData.get("date_fin") || "").trim() || null;
  const methode = String(formData.get("methode") || "").trim();
  if (!injury_id || !date_debut || !methode) return;
  await getSupabaseAdmin().from("injury_treatments").insert({ injury_id, date_debut, date_fin, methode });
  revalidatePath("/blessures");
}

export async function deleteTreatment(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getSupabaseAdmin().from("injury_treatments").delete().eq("id", id);
  revalidatePath("/blessures");
}
