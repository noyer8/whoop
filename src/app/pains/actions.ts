"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function addPain(formData: FormData) {
  const date = String(formData.get("date") || "");
  const zone = String(formData.get("zone") || "").trim();
  const intensite = Number(formData.get("intensite"));
  const contexte = String(formData.get("contexte") || "").trim() || null;

  if (!date || !zone || Number.isNaN(intensite)) return;

  await getSupabaseAdmin().from("pains").insert({ date, zone, intensite, contexte });
  revalidatePath("/pains");
}

export async function deletePain(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getSupabaseAdmin().from("pains").delete().eq("id", id);
  revalidatePath("/pains");
}
