import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "niwasthan_auth_token";

// Real, deliberate config source: the app's own real backend URL is an
// Expo "extra" config value (set in app.json, or overridden per real
// build profile via eas.json) rather than hardcoded - the same
// deployed backend this whole session has been building against in
// production, or a real local/staging URL during development. Failing
// loudly with a clear, specific error when it's missing is preferable
// to silently pointing at localhost and producing confusing network
// failures on a real device.
function getApiBaseUrl(): string {
  const url = Constants.expoConfig?.extra?.apiBaseUrl;
  if (typeof url !== "string" || !url) {
    throw new Error(
      "NIWASTHAN_API_BASE_URL_NOT_CONFIGURED: set expo.extra.apiBaseUrl in app.json",
    );
  }
  return url;
}

export async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    // Real, possible failure on a device without secure storage
    // available (e.g. some web-preview contexts) - treated the same
    // as "not signed in" rather than crashing the app.
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Real, centralized authenticated fetch - every real screen's data
// call goes through this, not a one-off fetch() with its own,
// possibly-inconsistent header/error handling. A 401 here means the
// real, stored token was rejected by the real backend (expired,
// revoked, or never valid) - callers are expected to react to
// ApiError with status 401 by returning to the real sign-in flow,
// not by retrying or showing a generic error.
export async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> {
  const token = await getStoredToken();
  if (!token) {
    throw new ApiError("NOT_SIGNED_IN", 401);
  }
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      body?.error?.message ?? "Something went wrong. Please try again.",
      response.status,
    );
  }
  return body as T;
}
