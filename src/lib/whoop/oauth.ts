import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  WHOOP_AUTH_URL,
  WHOOP_TOKEN_URL,
  WHOOP_SCOPES,
  getWhoopEnv,
} from "./config";

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number; // secondes
  scope: string;
  token_type: string;
};

/** URL de consentement OAuth (étape 1, à ouvrir dans le navigateur). */
export function getAuthorizeUrl(state: string): string {
  const { clientId, redirectUri } = getWhoopEnv();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: WHOOP_SCOPES.join(" "),
    state,
  });
  return `${WHOOP_AUTH_URL}?${params.toString()}`;
}

async function persistTokens(t: TokenResponse) {
  const supabase = getSupabaseAdmin();
  const expiresAt = new Date(Date.now() + t.expires_in * 1000).toISOString();
  const { error } = await supabase.from("whoop_tokens").upsert({
    id: true,
    access_token: t.access_token,
    refresh_token: t.refresh_token,
    expires_at: expiresAt,
    scope: t.scope,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Persist tokens: ${error.message}`);
}

/** Échange le code d'autorisation contre des tokens (callback OAuth). */
export async function exchangeCodeForTokens(code: string): Promise<void> {
  const { clientId, clientSecret, redirectUri } = getWhoopEnv();
  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    throw new Error(`Token exchange ${res.status}: ${await res.text()}`);
  }
  await persistTokens((await res.json()) as TokenResponse);
}

/** Rafraîchit l'access token via le refresh token stocké, et le persiste. */
async function refreshTokens(refreshToken: string): Promise<string> {
  const { clientId, clientSecret } = getWhoopEnv();
  const res = await fetch(WHOOP_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      scope: "offline",
    }),
  });
  if (!res.ok) {
    throw new Error(`Token refresh ${res.status}: ${await res.text()}`);
  }
  const tokens = (await res.json()) as TokenResponse;
  await persistTokens(tokens);
  return tokens.access_token;
}

/**
 * Renvoie un access token valide.
 * Rafraîchit automatiquement s'il expire dans moins de 2 min.
 */
export async function getValidAccessToken(): Promise<string> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("whoop_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("id", true)
    .maybeSingle();

  if (error) throw new Error(`Lecture token: ${error.message}`);
  if (!data?.refresh_token) {
    throw new Error(
      "Aucun token Whoop. Lance d'abord le flow OAuth via /api/whoop/authorize."
    );
  }

  const expiresAt = data.expires_at ? new Date(data.expires_at).getTime() : 0;
  const stillValid = data.access_token && expiresAt - Date.now() > 120_000;
  if (stillValid) return data.access_token as string;

  return refreshTokens(data.refresh_token as string);
}
