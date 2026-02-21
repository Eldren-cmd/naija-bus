import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { AuthState } from "./AuthContext";
import type { AuthLoginResponse, AuthProfileResponse } from "../types";
import { refreshSession } from "../lib/api";
import { setHttpAccessToken, setHttpRefreshHandler } from "../lib/http";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [user, setUser] = useState<AuthProfileResponse["user"] | null>(null);

  const applyLogin = useCallback((payload: AuthLoginResponse) => {
    const token = (payload.accessToken || payload.token || "").trim();
    setAccessTokenState(token || null);
    setUser(payload.user);
  }, []);

  const clearSession = useCallback(() => {
    setAccessTokenState(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setHttpAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    setHttpRefreshHandler(async () => {
      try {
        const refreshed = await refreshSession();
        const nextToken = (refreshed.accessToken || refreshed.token || "").trim();
        if (!nextToken) {
          clearSession();
          return null;
        }
        setAccessTokenState(nextToken);
        setUser(refreshed.user);
        return nextToken;
      } catch {
        clearSession();
        return null;
      }
    });

    return () => {
      setHttpRefreshHandler(null);
    };
  }, [clearSession]);

  const value = useMemo<AuthState>(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken),
      applyLogin,
      clearSession,
    }),
    [accessToken, user, applyLogin, clearSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
