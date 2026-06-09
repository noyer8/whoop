import { NextResponse } from "next/server";
import { syncWhoop } from "@/lib/whoop/sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Endpoint de pull, déclenché par le Cron Job Render (et utilisable à la main).
// Protégé par CRON_SECRET via le header Authorization: Bearer <secret>.
async function handle(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const days = Number(url.searchParams.get("days")) || 14;
    const result = await syncWhoop(days);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erreur";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
