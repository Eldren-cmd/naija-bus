import { useCallback, useMemo, useRef, useState } from "react";
import type { TouchEvent } from "react";

type PullState = "idle" | "pulling" | "release" | "refreshing";

type UsePullToRefreshOptions = {
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
  threshold?: number;
  maxPull?: number;
};

const PULL_RESISTANCE = 0.45;

const isInteractiveElement = (target: EventTarget | null): boolean => {
  if (!(target instanceof Element)) return false;
  const selector = "input, textarea, select, button, a, [data-no-pull-refresh]";
  return Boolean(target.closest(selector));
};

export function usePullToRefresh({
  onRefresh,
  enabled = true,
  threshold = 72,
  maxPull = 112,
}: UsePullToRefreshOptions) {
  const [distance, setDistance] = useState(0);
  const [pullState, setPullState] = useState<PullState>("idle");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);
  const touchingRef = useRef(false);

  const reset = useCallback(() => {
    startYRef.current = null;
    touchingRef.current = false;
    setDistance(0);
    if (!isRefreshing) setPullState("idle");
  }, [isRefreshing]);

  const runRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setPullState("refreshing");
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setDistance(0);
      setPullState("idle");
      startYRef.current = null;
      touchingRef.current = false;
    }
  }, [onRefresh]);

  const onTouchStart = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      if (!enabled || isRefreshing) return;
      if (event.touches.length !== 1) return;
      if (window.scrollY > 0) return;
      if (isInteractiveElement(event.target)) return;
      touchingRef.current = true;
      startYRef.current = event.touches[0].clientY;
      setPullState("pulling");
    },
    [enabled, isRefreshing],
  );

  const onTouchMove = useCallback(
    (event: TouchEvent<HTMLElement>) => {
      if (!enabled || isRefreshing) return;
      if (!touchingRef.current || startYRef.current == null) return;
      const touchY = event.touches[0]?.clientY;
      if (typeof touchY !== "number") return;
      const delta = touchY - startYRef.current;

      if (delta <= 0 || window.scrollY > 0) {
        setDistance(0);
        setPullState("idle");
        return;
      }

      event.preventDefault();
      const dampedDistance = Math.min(maxPull, delta * PULL_RESISTANCE);
      setDistance(dampedDistance);
      setPullState(dampedDistance >= threshold ? "release" : "pulling");
    },
    [enabled, isRefreshing, maxPull, threshold],
  );

  const onTouchEnd = useCallback(async () => {
    if (!enabled || isRefreshing) return;
    if (!touchingRef.current) return;
    if (distance >= threshold) {
      await runRefresh();
      return;
    }
    reset();
  }, [distance, enabled, isRefreshing, reset, runRefresh, threshold]);

  const indicatorHeight = useMemo(() => {
    if (pullState === "refreshing") return 52;
    return Math.min(52, distance);
  }, [distance, pullState]);

  const hint = useMemo(() => {
    if (pullState === "refreshing") return "Refreshing latest route data...";
    if (pullState === "release") return "Release to refresh";
    if (pullState === "pulling") return "Pull down to refresh";
    return "";
  }, [pullState]);

  return {
    bind: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: onTouchEnd,
    },
    distance,
    indicatorHeight,
    hint,
    isRefreshing,
    pullState,
  };
}
