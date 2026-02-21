import { createContext, useContext } from "react";
import type { AuthLoginResponse, AuthProfileResponse } from "../types";

export type AuthState = {
  accessToken: string | null;
  user: AuthProfileResponse["user"] | null;
  isAuthenticated: boolean;
  applyLogin: (payload: AuthLoginResponse) => void;
  clearSession: () => void;
};

export const AuthContext = createContext<AuthState | null>(null);

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
