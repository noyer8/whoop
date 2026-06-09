// Configuration Whoop API v2

export const WHOOP_API_BASE = "https://api.prod.whoop.com/developer";
export const WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth";
export const WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token";

// `offline` est requis pour obtenir un refresh token.
export const WHOOP_SCOPES = [
  "offline",
  "read:recovery",
  "read:sleep",
  "read:workout",
  "read:cycles",
  "read:body_measurement",
  "read:profile",
] as const;

export function getWhoopEnv() {
  const clientId = process.env.WHOOP_CLIENT_ID;
  const clientSecret = process.env.WHOOP_CLIENT_SECRET;
  const redirectUri = process.env.WHOOP_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error(
      "Variables Whoop manquantes : WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET, WHOOP_REDIRECT_URI."
    );
  }
  return { clientId, clientSecret, redirectUri };
}
