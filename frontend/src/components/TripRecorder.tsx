import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createTripRecord } from "../lib/api";
import { EmptyState } from "./EmptyState";
import { PanelCard } from "./PanelCard";
import { useAuthGuard } from "../hooks/useAuthGuard";
import type { TripCheckpoint } from "../types";
import type { ToastTone } from "./ToastStack";

type TripRecorderProps = {
  routeId?: string | null;
  routeName?: string;
  authToken?: string | null;
  onCheckpointsChange?: (checkpoints: TripCheckpoint[]) => void;
  onToast?: (tone: ToastTone, message: string) => void;
};

type GeoPermissionState = PermissionState | "unsupported" | "unknown";
type StopRecordingOptions = {
  suppressPreview?: boolean;
  skipCheckpointError?: boolean;
};

const CAPTURE_INTERVAL_MS = 5000;
const PREVIEW_WIDTH = 640;
const PREVIEW_HEIGHT = 220;
const PREVIEW_PADDING = 16;

const formatRecordedAt = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString();
};

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const haversineDistanceMeters = (from: [number, number], to: [number, number]): number => {
  const EARTH_RADIUS_METERS = 6_371_000;
  const [fromLng, fromLat] = from;
  const [toLng, toLat] = to;

  const latDelta = toRadians(toLat - fromLat);
  const lngDelta = toRadians(toLng - fromLng);
  const fromLatRad = toRadians(fromLat);
  const toLatRad = toRadians(toLat);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLatRad) * Math.cos(toLatRad) * Math.sin(lngDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
};

const computeDistanceMeters = (checkpoints: TripCheckpoint[]): number => {
  if (checkpoints.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < checkpoints.length; i += 1) {
    total += haversineDistanceMeters(
      checkpoints[i - 1].coords.coordinates,
      checkpoints[i].coords.coordinates,
    );
  }
  return Math.round(total);
};

const formatDistance = (meters: number): string => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${meters} m`;
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const formatPermissionState = (state: GeoPermissionState): string => {
  if (state === "granted") return "granted";
  if (state === "denied") return "blocked";
  if (state === "prompt") return "prompt";
  if (state === "unsupported") return "not detectable";
  return "checking";
};

const getGeoErrorMessage = (
  positionError: GeolocationPositionError,
): { message: string; denied: boolean } => {
  if (positionError.code === positionError.PERMISSION_DENIED) {
    return {
      message:
        "Location access is blocked. Enable location permission for this site in browser settings, then retry.",
      denied: true,
    };
  }

  if (positionError.code === positionError.TIMEOUT) {
    return {
      message: "Location request timed out. Move to a clear-signal area and retry recording.",
      denied: false,
    };
  }

  return {
    message: "Unable to track position. Check location services and try again.",
    denied: false,
  };
};

const toPolylinePoints = (checkpoints: TripCheckpoint[]): string | null => {
  if (checkpoints.length < 2) return null;

  const coords = checkpoints.map((checkpoint) => checkpoint.coords.coordinates);
  const lngs = coords.map(([lng]) => lng);
  const lats = coords.map(([, lat]) => lat);

  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);

  const spanLng = maxLng - minLng || 0.000001;
  const spanLat = maxLat - minLat || 0.000001;
  const drawWidth = PREVIEW_WIDTH - PREVIEW_PADDING * 2;
  const drawHeight = PREVIEW_HEIGHT - PREVIEW_PADDING * 2;

  return coords
    .map(([lng, lat]) => {
      const x = PREVIEW_PADDING + ((lng - minLng) / spanLng) * drawWidth;
      const y = PREVIEW_HEIGHT - PREVIEW_PADDING - ((lat - minLat) / spanLat) * drawHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
};

export function TripRecorder({
  routeId,
  routeName,
  authToken,
  onCheckpointsChange,
  onToast,
}: TripRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [checkpoints, setCheckpoints] = useState<TripCheckpoint[]>([]);
  const [tripStartedAt, setTripStartedAt] = useState<string | null>(null);
  const [tripEndedAt, setTripEndedAt] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [geoPermissionState, setGeoPermissionState] = useState<GeoPermissionState>("unknown");
  const [permissionDenied, setPermissionDenied] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastCapturedAtRef = useRef<number>(0);
  const authGuard = useAuthGuard({ authToken, onToast });

  useEffect(() => {
    onCheckpointsChange?.(checkpoints);
  }, [checkpoints, onCheckpointsChange]);

  useEffect(() => {
    if (!("permissions" in window.navigator) || typeof window.navigator.permissions.query !== "function") {
      setGeoPermissionState("unsupported");
      return;
    }

    let mounted = true;
    let permissionStatus: PermissionStatus | null = null;

    const loadPermissionState = async () => {
      try {
        permissionStatus = await window.navigator.permissions.query({ name: "geolocation" });
        if (!mounted) return;
        setGeoPermissionState(permissionStatus.state);
        permissionStatus.onchange = () => setGeoPermissionState(permissionStatus?.state ?? "unknown");
      } catch {
        if (mounted) setGeoPermissionState("unsupported");
      }
    };

    void loadPermissionState();
    return () => {
      mounted = false;
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        window.navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isPreviewOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isPreviewOpen]);

  const stopRecording = (options: StopRecordingOptions = {}) => {
    if (watchIdRef.current !== null) {
      window.navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsRecording(false);

    const stoppedAt = new Date().toISOString();
    setTripEndedAt(stoppedAt);

    if (options.suppressPreview) return;

    if (checkpoints.length < 2) {
      if (options.skipCheckpointError) return;
      const message = "At least 2 checkpoints are required before preview and upload.";
      setError(message);
      onToast?.("error", message);
      return;
    }

    setIsPreviewOpen(true);
  };

  const startRecording = () => {
    setError(null);
    setIsPreviewOpen(false);
    setPermissionDenied(false);

    if (!window.navigator.geolocation) {
      const message = "Geolocation is not available in this browser.";
      setError(message);
      onToast?.("error", message);
      return;
    }

    if (geoPermissionState === "denied") {
      const message =
        "Location access is currently blocked. Enable location permission for this site, then retry.";
      setError(message);
      setPermissionDenied(true);
      onToast?.("error", message);
      return;
    }

    if (watchIdRef.current !== null) return;

    const startedAt = new Date().toISOString();
    lastCapturedAtRef.current = 0;
    setTripStartedAt(startedAt);
    setTripEndedAt(null);
    setCheckpoints([]);
    setIsRecording(true);

    watchIdRef.current = window.navigator.geolocation.watchPosition(
      (position) => {
        const now = position.timestamp || Date.now();
        const shouldCapture =
          lastCapturedAtRef.current === 0 || now - lastCapturedAtRef.current >= CAPTURE_INTERVAL_MS;

        if (!shouldCapture) return;
        lastCapturedAtRef.current = now;
        setPermissionDenied(false);
        setError(null);

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
      (positionError) => {
        const { message, denied } = getGeoErrorMessage(positionError);
        setError(message);
        setPermissionDenied(denied);
        if (denied) setGeoPermissionState("denied");
        onToast?.("error", message);
        stopRecording({ suppressPreview: true, skipCheckpointError: true });
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 2000,
      },
    );
  };

  const uploadTrip = async () => {
    setError(null);
    if (checkpoints.length < 2) {
      const message = "At least 2 checkpoints are required for upload.";
      setError(message);
      onToast?.("error", message);
      return;
    }

    const normalizedToken = authGuard.requireToken({
      action: "upload trip records",
      blockedMessage: "Sign in first to upload trip records.",
    });
    if (!normalizedToken) {
      setError("Sign in first to upload trip records.");
      return;
    }

    const startedAt = tripStartedAt || checkpoints[0].recordedAt;
    const endedAt = tripEndedAt || checkpoints[checkpoints.length - 1].recordedAt;

    setUploading(true);
    try {
      const response = await createTripRecord(
        {
          routeId: routeId || undefined,
          checkpoints,
          startedAt,
          endedAt,
        },
        normalizedToken,
      );

      onToast?.(
        "success",
        `Trip uploaded: ${formatDistance(response.distanceMeters)} in ${formatDuration(response.durationSeconds)}.`,
      );
      setIsPreviewOpen(false);
      setCheckpoints([]);
      setTripStartedAt(null);
      setTripEndedAt(null);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to upload trip";
      setError(message);
      onToast?.("error", message);
    } finally {
      setUploading(false);
    }
  };

  const latestCheckpoint = useMemo(() => checkpoints[checkpoints.length - 1] ?? null, [checkpoints]);
  const previewDistanceMeters = useMemo(() => computeDistanceMeters(checkpoints), [checkpoints]);
  const previewPolylinePoints = useMemo(() => toPolylinePoints(checkpoints), [checkpoints]);
  const previewDurationSeconds = useMemo(() => {
    const startValue = tripStartedAt ? new Date(tripStartedAt).getTime() : NaN;
    const endValue = tripEndedAt ? new Date(tripEndedAt).getTime() : Date.now();
    if (!Number.isFinite(startValue) || !Number.isFinite(endValue)) return 0;
    return Math.max(0, Math.round((endValue - startValue) / 1000));
  }, [tripStartedAt, tripEndedAt]);

  const tripPreviewModal =
    isPreviewOpen && typeof document !== "undefined"
      ? createPortal(
          <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Trip preview modal">
            <div className="modal-card trip-preview-modal">
              <div className="modal-head trip-preview-head">
                <h3 className="panel-title">Trip Preview</h3>
                <button type="button" className="modal-close-btn" onClick={() => setIsPreviewOpen(false)}>
                  Close
                </button>
              </div>

              <div className="trip-preview-body">
                <div className="trip-preview-meta">
                  <span>Route: {routeName || "Unspecified route"}</span>
                  <span>Points: {checkpoints.length}</span>
                  <span>Distance: {formatDistance(previewDistanceMeters)}</span>
                  <span>Duration: {formatDuration(previewDurationSeconds)}</span>
                </div>

                <div className="trip-preview-canvas">
                  {previewPolylinePoints ? (
                    <svg viewBox={`0 0 ${PREVIEW_WIDTH} ${PREVIEW_HEIGHT}`} aria-label="Trip path preview">
                      <rect x="0" y="0" width={PREVIEW_WIDTH} height={PREVIEW_HEIGHT} rx="12" />
                      <polyline points={previewPolylinePoints} />
                    </svg>
                  ) : (
                    <p className="muted">Trip path preview requires at least 2 checkpoints.</p>
                  )}
                </div>
              </div>

              <div className="modal-actions trip-preview-actions">
                <button type="button" className="secondary-btn" onClick={() => setIsPreviewOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="estimate-btn" onClick={() => void uploadTrip()} disabled={uploading}>
                  {uploading
                    ? "Uploading..."
                    : authGuard.getActionLabel({
                        authenticated: "Upload Trip",
                        unauthenticated: "Login to Upload",
                      })}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <PanelCard
        title="Trip Recorder"
        subtitle={
          routeName
            ? `Record your live movement for ${routeName}. Checkpoints are sampled every 5 seconds.`
            : "Start a trip recording session. Checkpoints are sampled every 5 seconds."
        }
        tone="trip"
        iconLabel="TR"
        className="trip-recorder-card"
      >
        {!authGuard.canAct && (
          <EmptyState
            tone="trip"
            compact
            iconLabel="IN"
            title="Sign in to upload trip history"
            message="You can record now, but upload requires login from /login."
          />
        )}
        <p className="muted small">Location permission: {formatPermissionState(geoPermissionState)}</p>

        {(permissionDenied || geoPermissionState === "denied") && (
          <div className="trip-permission-warning">
            <p>
              Location permission is blocked for this site. Enable location in your browser settings and retry.
            </p>
            <button type="button" className="secondary-btn" onClick={startRecording} disabled={isRecording}>
              Retry Location Access
            </button>
          </div>
        )}

        <div className="trip-recorder-actions">
          <button type="button" className="estimate-btn" onClick={startRecording} disabled={isRecording}>
            {isRecording ? "Recording..." : "Start Recording"}
          </button>
          <button type="button" className="secondary-btn" onClick={() => stopRecording()} disabled={!isRecording}>
            Stop & Preview
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
                ? ` | +/-${Math.round(latestCheckpoint.accuracyMeters)}m`
                : ""}
            </small>
          </div>
        )}

        {error && <p className="error-text">{error}</p>}
      </PanelCard>
      {tripPreviewModal}
    </>
  );
}
