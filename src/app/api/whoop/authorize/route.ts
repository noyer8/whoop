import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthorizeUrl } from "@/lib/whoop/oauth";

export const dynamic = "force-dynamic";

// Démarre le flow OAuth Whoop : génère un state anti-CSRF puis redirige
// vers la page de consentement.
export async function GET() {
  const state = crypto.randomUUID();
  (await cookies()).set("whoop_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return NextResponse.redirect(getAuthorizeUrl(state));
}
