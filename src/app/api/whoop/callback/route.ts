import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/whoop/oauth";

export const dynamic = "force-dynamic";

// Origine publique réelle (derrière le proxy Render, req.url vaut localhost:PORT,
// donc on se fie aux en-têtes x-forwarded-* posés par le proxy).
function publicOrigin(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host =
    req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? new URL(req.url).host;
  return `${proto}://${host}`;
}

// Callback OAuth Whoop : valide le state (cookie), échange le code contre les
// tokens (stockés en DB), puis redirige vers une page de confirmation.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");
  const origin = publicOrigin(req);

  const redirect = (qs: string) => {
    const res = NextResponse.redirect(new URL(`/settings?${qs}`, origin));
    res.cookies.delete("whoop_oauth_state");
    return res;
  };

  if (oauthError) {
    return redirect(`whoop=error&msg=${encodeURIComponent(oauthError)}`);
  }

  const expectedState = req.cookies.get("whoop_oauth_state")?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirect("whoop=error&msg=state_invalide");
  }

  try {
    await exchangeCodeForTokens(code);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "echec";
    return redirect(`whoop=error&msg=${encodeURIComponent(msg)}`);
  }

  return redirect("whoop=ok");
}
