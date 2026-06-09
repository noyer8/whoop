import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens } from "@/lib/whoop/oauth";

export const dynamic = "force-dynamic";

// Callback OAuth Whoop : valide le state (cookie), échange le code contre les
// tokens (stockés en DB), puis redirige vers une page de confirmation.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const oauthError = url.searchParams.get("error");

  const redirect = (qs: string) => {
    const res = NextResponse.redirect(new URL(`/settings?${qs}`, url.origin));
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
