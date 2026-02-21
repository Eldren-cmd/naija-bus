import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import type { AuthState } from "./AuthContext";
import type { AuthLoginResponse, AuthProfileResponse } from "../types";

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthProfileResponse["user"] | null>(null);

  const applyLogin = (payload: AuthLoginResponse) => {
    const token = (payload.accessToken || payload.token || "").trim();
    setAccessToken(token || null);
    setUser(payload.user);
  };

  const clearSession = () => {
    setAccessToken(null);
    setUser(null);
  };

  const value = useMemo<AuthState>(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken),
      applyLogin,
      clearSession,
    }),
    [accessToken, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
