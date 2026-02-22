import { useEffect, useMemo, useRef, useState } from "react";
import { getFareEstimate } from "../lib/api";
import { EmptyState } from "./EmptyState";
import { PanelCard } from "./PanelCard";
import type { FareEstimate as FareEstimateData, TrafficLevel } from "../types";

type FareEstimateProps = {
  routeId: string | null;
  routeName?: string;
  refreshSignal?: number;
};

const getCurrentClockTime = (): string => {
  const now = new Date();
  const hh = `${now.getHours()}`.padStart(2, "0");
  const mm = `${now.getMinutes()}`.padStart(2, "0");
  return `${hh}:${mm}`;
};

const formatNaira = (value: number): string =>
  `\u20A6${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(value)}`;

const AnimatedFare = ({ target }: { target: number }) => {
  const [value, setValue] = useState(target);
  const previousValueRef = useRef(target);

  useEffect(() => {
    const start = previousValueRef.current;
    const delta = target - start;
    if (delta === 0) return;

    const duration = 700;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (timestamp: number) => {
      const elapsed = Math.min(timestamp - startTime, duration);
      const progress = elapsed / duration;
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(start + delta * eased));
      if (elapsed < duration) {
        rafId = requestAnimationFrame(tick);
      } else {
        previousValueRef.current = target;
      }
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target]);

  return <span className="fare-amount">{formatNaira(value)}</span>;
};

export function FareEstimate({ routeId, routeName, refreshSignal = 0 }: FareEstimateProps) {
  const [time, setTime] = useState(getCurrentClockTime);
  const [trafficLevel, setTrafficLevel] = useState<TrafficLevel>("medium");
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<FareEstimateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const confidencePercent = useMemo(() => {
    if (!estimate) return 0;
    return Math.max(0, Math.min(100, Math.round(estimate.confidence * 100)));
  }, [estimate]);
  const showSkeleton = loading && !estimate && !error;

  const loadEstimate = async () => {
    if (!routeId) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getFareEstimate({ routeId, time, trafficLevel });
      setEstimate(data);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to estimate fare";
      setError(message);
      setEstimate(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!routeId) {
      setEstimate(null);
      return;
    }
    void loadEstimate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId, refreshSignal]);

  if (!routeId) {
    return (
      <PanelCard title="Fare Estimate" tone="fare" iconLabel="NG" className="fare-card">
        <EmptyState
          tone="fare"
          title="Route required for pricing"
          message="Select a route to calculate an estimated fare with time and traffic multipliers."
        />
      </PanelCard>
    );
  }

  return (
    <PanelCard
      title="Fare Estimate"
      subtitle={routeName || "Selected route"}
      tone="fare"
      iconLabel="NG"
      className="fare-card"
    >
      <div className="fare-controls">
        <label>
          Time
          <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </label>
        <label>
          Traffic
          <select
            value={trafficLevel}
            onChange={(event) => setTrafficLevel(event.target.value as TrafficLevel)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <button className="estimate-btn" type="button" onClick={() => void loadEstimate()} disabled={loading}>
          {loading ? "Updating..." : "Update Estimate"}
        </button>
      </div>

      {error && <p className="error-text">{error}</p>}

      {showSkeleton && (
        <div className="fare-breakdown fare-breakdown-skeleton" aria-hidden="true">
          <p className="skeleton-line skeleton-line-sm" />
          <p className="skeleton-line skeleton-line-xl" />
          <span className="skeleton-pill skeleton-pill-sm" />
          <ul className="skeleton-list">
            <li className="skeleton-line skeleton-line-md" />
            <li className="skeleton-line skeleton-line-md" />
            <li className="skeleton-line skeleton-line-md" />
            <li className="skeleton-line skeleton-line-sm" />
          </ul>
        </div>
      )}

      {estimate && !showSkeleton && (
        <div className="fare-breakdown">
          <p className="muted small">Estimated fare</p>
          <AnimatedFare target={estimate.estimatedFare} />
          <div className="confidence-chip">Confidence: {confidencePercent}%</div>
          <ul>
            <li>Base fare: {formatNaira(estimate.baseFare)}</li>
            <li>Traffic multiplier: {estimate.trafficMultiplier.toFixed(2)}</li>
            <li>Time multiplier: {estimate.timeMultiplier.toFixed(2)}</li>
            <li>Time band: {estimate.timeBand.replace("_", " ")}</li>
          </ul>
          <p className="muted small">Last updated: {new Date(estimate.computedAt).toLocaleString()}</p>
        </div>
      )}
    </PanelCard>
  );
}
