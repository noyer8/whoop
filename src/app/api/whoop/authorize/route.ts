import { NextResponse } from "next/server";
import { getAuthorizeUrl } from "@/lib/whoop/oauth";

export const dynamic = "force-dynamic";

// Démarre le flow OAuth Whoop : génère un state anti-CSRF posé en cookie
// (sur la réponse de redirection) puis redirige vers le consentement.
export async function GET() {
  const state = crypto.randomUUID();
  const res = NextResponse.redirect(getAuthorizeUrl(state));
  res.cookies.set("whoop_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return res;
}
