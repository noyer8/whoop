import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens } from "@/lib/whoop/oauth";

export const dynamic = "force-dynamic";

// Callback OAuth Whoop : valide le state, échange le code contre les tokens
// (stockés en DB), puis redirige vers une page de confirmation.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?whoop=error&msg=${encodeURIComponent(error)}`, url.origin)
    );
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("whoop_oauth_state")?.value;
  cookieStore.delete("whoop_oauth_state");

  if (!code || !state || state !== expectedState) {
    return NextResponse.redirect(
      new URL("/settings?whoop=error&msg=state_invalide", url.origin)
    );
  }

  try {
    await exchangeCodeForTokens(code);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "echec";
    return NextResponse.redirect(
      new URL(`/settings?whoop=error&msg=${encodeURIComponent(msg)}`, url.origin)
    );
  }

  return NextResponse.redirect(new URL("/settings?whoop=ok", url.origin));
}
