"use server";

import { revalidatePath } from "next/cache";
import { syncWhoop } from "@/lib/whoop/sync";

export type SyncState = { ok?: boolean; message?: string };

export async function runSyncAction(): Promise<SyncState> {
  try {
    const r = await syncWhoop(30);
    revalidatePath("/");
    return {
      ok: true,
      message: `Sync OK — ${r.recovery} recovery, ${r.sleep} sommeil, ${r.workouts} workouts.`,
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Erreur sync" };
  }
}
