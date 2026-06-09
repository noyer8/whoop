"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function addTest(formData: FormData) {
  const date = String(formData.get("date") || "");
  const type = String(formData.get("type") || "").trim();
  const conditions = String(formData.get("conditions") || "").trim() || null;

  // Pour Bronco : saisie en minutes + secondes -> stockage en secondes.
  const min = Number(formData.get("min") || 0);
  const sec = Number(formData.get("sec") || 0);
  const resultatRaw = formData.get("resultat");

  let resultat: number | null = null;
  if (type === "Bronco") {
    resultat = min * 60 + sec;
    if (resultat === 0) resultat = null;
  } else if (resultatRaw != null && String(resultatRaw) !== "") {
    resultat = Number(resultatRaw);
  }

  if (!date || !type) return;

  await getSupabaseAdmin().from("tests").insert({ date, type, resultat, conditions });
  revalidatePath("/tests");
}

export async function deleteTest(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return;
  await getSupabaseAdmin().from("tests").delete().eq("id", id);
  revalidatePath("/tests");
}
