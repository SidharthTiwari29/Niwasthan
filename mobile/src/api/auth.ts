import { useCallback, useEffect, useState } from "react";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import {
  apiFetch,
  clearStoredToken,
  getStoredToken,
  storeToken,
} from "./client";

// Required once, at module load, for the OAuth redirect back into the
// app to actually complete - expo-auth-session's own documented setup
// step, not something either screen needs to think about.
WebBrowser.maybeCompleteAuthSession();

export type SignedInUser = { id: string; email: string; name: string | null };

type AuthState =
  | { status: "loading" }
  | { status: "signedOut" }
  | { status: "signedIn"; user: SignedInUser }
  | { status: "notConfigured" };

// Real Google Cloud client IDs the founder configures in app.json's
// expo.extra - the same "external credential this session cannot
// provide itself" pattern as every other unconfigured provider
// throughout this project. Google requires separate client IDs per
// platform (web/iOS/Android); an empty one is treated as genuinely
// unconfigured rather than silently attempted.
function getGoogleClientIds() {
  const extra = Constants.expoConfig?.extra ?? {};
  const webClientId = extra.googleWebClientId as string | undefined;
  const iosClientId = extra.googleIosClientId as string | undefined;
  const androidClientId = extra.googleAndroidClientId as string | undefined;
  const configured = Boolean(webClientId);
  return { webClientId, iosClientId, androidClientId, configured };
}

export function useNiwasthanAuth() {
  const [state, setState] = useState<AuthState>({ status: "loading" });
  const { webClientId, iosClientId, androidClientId, configured } =
    getGoogleClientIds();

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId,
    iosClientId,
    androidClientId,
  });

  // Real, previously-missing check: a stored token from a prior real
  // sign-in is restored on launch, so a customer isn't asked to sign
  // in again every time they open the app - but never assumed valid
  // without checking, since a token can genuinely expire between
  // sessions.
  const restoreSession = useCallback(async () => {
    if (!configured) {
      setState({ status: "notConfigured" });
      return;
    }
    const token = await getStoredToken();
    if (!token) {
      setState({ status: "signedOut" });
      return;
    }
    try {
      const result = await apiFetch<{ user: SignedInUser }>("/api/mobile/me");
      setState({ status: "signedIn", user: result.user });
    } catch {
      // The real, stored token was rejected by the real backend -
      // clear it rather than keep presenting a broken signed-in state.
      await clearStoredToken();
      setState({ status: "signedOut" });
    }
  }, [configured]);

  useEffect(() => {
    (async () => {
      await restoreSession();
    })();
  }, [restoreSession]);

  useEffect(() => {
    if (response?.type !== "success") return;
    const idToken = response.params.id_token;
    if (!idToken) return;
    (async () => {
      try {
        const result = await apiFetch<{
          token: string;
          user: SignedInUser;
        }>("/api/mobile/auth/google", {
          method: "POST",
          body: { idToken },
        });
        await storeToken(result.token);
        setState({ status: "signedIn", user: result.user });
      } catch {
        setState({ status: "signedOut" });
      }
    })();
  }, [response]);

  async function signIn() {
    if (!configured || !request) return;
    await promptAsync();
  }

  async function signOut() {
    await clearStoredToken();
    setState({ status: "signedOut" });
  }

  return { state, signIn, signOut };
}
