import { useEffect, useMemo, useRef, useState } from "react";
import type { TripCheckpoint } from "../types";

type TripRecorderProps = {
  routeName?: string;
};

const CAPTURE_INTERVAL_MS = 5000;

const formatRecordedAt = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString();
};

export function TripRecorder({ routeName }: TripRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [checkpoints, setCheckpoints] = useState<TripCheckpoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastCapturedAtRef = useRef<number>(0);

  const stopRecording = () => {
    if (watchIdRef.current !== null) {
      window.navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        window.navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const startRecording = () => {
    setError(null);
    if (!window.navigator.geolocation) {
      setError("Geolocation is not available in this browser.");
      return;
    }
    if (watchIdRef.current !== null) return;

    lastCapturedAtRef.current = 0;
    setIsRecording(true);

    watchIdRef.current = window.navigator.geolocation.watchPosition(
      (position) => {
        const now = position.timestamp || Date.now();
        const shouldCapture =
          lastCapturedAtRef.current === 0 || now - lastCapturedAtRef.current >= CAPTURE_INTERVAL_MS;

        if (!shouldCapture) return;
        lastCapturedAtRef.current = now;

        const nextCheckpoint: TripCheckpoint = {
          coords: {
            type: "Point",
            coordinates: [position.coords.longitude, position.coords.latitude],
          },
          recordedAt: new Date(now).toISOString(),
          accuracyMeters: Number.isFinite(position.coords.accuracy)
            ? position.coords.accuracy
            : undefined,
        };

        setCheckpoints((previous) => [...previous, nextCheckpoint]);
      },
      () => {
        setError("Unable to track position. Check device location permission and try again.");
        stopRecording();
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 2000,
      },
    );
  };

  const latestCheckpoint = useMemo(
    () => checkpoints[checkpoints.length - 1] ?? null,
    [checkpoints],
  );

  return (
    <section className="trip-recorder-card card">
      <h3 className="panel-title">Trip Recorder</h3>
      <p className="muted">
        {routeName
          ? `Record your live movement for ${routeName}. Checkpoints are sampled every 5 seconds.`
          : "Start a trip recording session. Checkpoints are sampled every 5 seconds."}
      </p>

      <div className="trip-recorder-actions">
        <button
          type="button"
          className="estimate-btn"
          onClick={startRecording}
          disabled={isRecording}
        >
          {isRecording ? "Recording..." : "Start Recording"}
        </button>
        <button
          type="button"
          className="secondary-btn"
          onClick={stopRecording}
          disabled={!isRecording}
        >
          Stop
        </button>
      </div>

      <p className="muted trip-recorder-meta">Checkpoints captured: {checkpoints.length}</p>

      {latestCheckpoint && (
        <div className="trip-recorder-latest">
          <p>
            Latest: {latestCheckpoint.coords.coordinates[1].toFixed(6)},{" "}
            {latestCheckpoint.coords.coordinates[0].toFixed(6)}
          </p>
          <small>
            {formatRecordedAt(latestCheckpoint.recordedAt)}
            {typeof latestCheckpoint.accuracyMeters === "number"
              ? ` • ±${Math.round(latestCheckpoint.accuracyMeters)}m`
              : ""}
          </small>
        </div>
      )}

      {error && <p className="error-text">{error}</p>}
    </section>
  );
}
