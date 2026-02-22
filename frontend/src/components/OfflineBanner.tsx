import { useEffect, useRef, useState } from "react";

const ONLINE_PULSE_MS = 2400;

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.navigator.onLine;
  });
  const [showOnlinePulse, setShowOnlinePulse] = useState(false);
  const pulseTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const onOffline = () => {
      if (pulseTimerRef.current) {
        window.clearTimeout(pulseTimerRef.current);
        pulseTimerRef.current = null;
      }
      setShowOnlinePulse(false);
      setIsOnline(false);
    };

    const onOnline = () => {
      setIsOnline(true);
      setShowOnlinePulse(true);
      if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
      pulseTimerRef.current = window.setTimeout(() => {
        setShowOnlinePulse(false);
        pulseTimerRef.current = null;
      }, ONLINE_PULSE_MS);
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
    };
  }, []);

  if (isOnline && !showOnlinePulse) return null;

  return (
    <aside
      className={`offline-banner ${isOnline ? "is-online" : "is-offline"}`}
      role="status"
      aria-live="polite"
    >
      <span className="offline-banner-dot" aria-hidden="true" />
      <p>
        {isOnline
          ? "Back online. Sync is active again."
          : "You are offline. Actions are limited until connection returns."}
      </p>
    </aside>
  );
}
