import { useCallback, useMemo } from "react";
import { useAuth } from "../auth/AuthContext";
import type { ToastTone } from "../components/ToastStack";

type ToastHandler = (tone: ToastTone, message: string) => void;

type UseAuthGuardOptions = {
  authToken?: string | null;
  onToast?: ToastHandler;
};

type GuardOptions = {
  action: string;
  blockedMessage?: string;
};

type ActionLabelOptions = {
  authenticated: string;
  unauthenticated: string;
};

export function useAuthGuard({ authToken, onToast }: UseAuthGuardOptions) {
  const { isAuthenticated } = useAuth();
  const normalizedToken = authToken?.trim() || "";

  const canAct = useMemo(() => isAuthenticated && Boolean(normalizedToken), [isAuthenticated, normalizedToken]);

  const requireToken = useCallback(
    ({ action, blockedMessage }: GuardOptions): string | null => {
      if (canAct) return normalizedToken;
      onToast?.("error", blockedMessage || `Sign in to ${action}.`);
      return null;
    },
    [canAct, normalizedToken, onToast],
  );

  const getActionLabel = useCallback(
    ({ authenticated, unauthenticated }: ActionLabelOptions): string =>
      canAct ? authenticated : unauthenticated,
    [canAct],
  );

  return { canAct, requireToken, getActionLabel };
}
