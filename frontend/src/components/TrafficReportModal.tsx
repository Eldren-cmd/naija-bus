import { useEffect, useState } from "react";
import { reportIncident } from "../lib/api";
import { useAuthGuard } from "../hooks/useAuthGuard";
import type { ToastTone } from "./ToastStack";
import type { FormEvent } from "react";
import type { ReportSeverity, ReportType } from "../types";

type TrafficReportModalProps = {
  routeId: string | null;
  routeName?: string;
  authToken?: string | null;
  onToast?: (tone: ToastTone, message: string) => void;
};

const REPORT_TYPE_OPTIONS: ReportType[] = [
  "traffic",
  "police",
  "roadblock",
  "accident",
  "hazard",
  "other",
];

const REPORT_SEVERITY_OPTIONS: ReportSeverity[] = ["low", "medium", "high"];

const formatTypeLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export function TrafficReportModal({ routeId, routeName, authToken, onToast }: TrafficReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<ReportType>("traffic");
  const [severity, setSeverity] = useState<ReportSeverity>("medium");
  const [description, setDescription] = useState("");
  const [lng, setLng] = useState("");
  const [lat, setLat] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const authGuard = useAuthGuard({ authToken, onToast });

  useEffect(() => {
    if (!isOpen) return;
    if (lng && lat) return;
    void requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const requestLocation = async () => {
    if (!window.navigator.geolocation) {
      setLocationError("Geolocation is not available in this browser.");
      return;
    }

    setLocating(true);
    setLocationError(null);

    await new Promise<void>((resolve) => {
      window.navigator.geolocation.getCurrentPosition(
        (position) => {
          setLng(position.coords.longitude.toFixed(6));
          setLat(position.coords.latitude.toFixed(6));
          setLocating(false);
          resolve();
        },
        () => {
          setLocationError("Unable to auto-detect location. Enter coordinates manually.");
          setLocating(false);
          resolve();
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  };

  const resetModalState = () => {
    setType("traffic");
    setSeverity("medium");
    setDescription("");
    setLocationError(null);
  };

  const openModal = () => {
    const normalizedToken = authGuard.requireToken({
      action: "submit incident reports",
      blockedMessage: "Sign in first to submit incident reports.",
    });
    if (!normalizedToken) {
      return;
    }
    resetModalState();
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSubmitting(false);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedToken = authGuard.requireToken({
      action: "submit incident reports",
      blockedMessage: "Sign in first to submit incident reports.",
    });
    if (!normalizedToken) {
      return;
    }

    const parsedLng = Number(lng);
    const parsedLat = Number(lat);
    if (
      !Number.isFinite(parsedLng) ||
      !Number.isFinite(parsedLat) ||
      parsedLng < -180 ||
      parsedLng > 180 ||
      parsedLat < -90 ||
      parsedLat > 90
    ) {
      onToast?.("error", "Valid lng/lat coordinates are required.");
      return;
    }

    setSubmitting(true);
    try {
      await reportIncident(
        {
          routeId: routeId || undefined,
          type,
          severity,
          description: description.trim() || undefined,
          coords: {
            type: "Point",
            coordinates: [parsedLng, parsedLat],
          },
        },
        normalizedToken,
      );

      onToast?.("success", "Incident report submitted successfully.");
      setIsOpen(false);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to submit report";
      onToast?.("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="report-card card">
      <h3 className="panel-title">Traffic Reports</h3>
      <p className="muted">
        {routeName
          ? `Report live conditions for ${routeName}.`
          : "Report traffic, police stops, roadblocks, and hazards around you."}
      </p>
      {!authGuard.canAct && (
        <p className="muted small">Sign in from `/login` to submit traffic reports.</p>
      )}
      <button type="button" className="estimate-btn report-open-btn" onClick={openModal}>
        {authGuard.getActionLabel({
          authenticated: "Open Traffic Report Modal",
          unauthenticated: "Login to Report Traffic",
        })}
      </button>

      {isOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Traffic report modal">
          <div className="modal-card">
            <div className="modal-head">
              <h3 className="panel-title">Submit Traffic Report</h3>
              <button type="button" className="modal-close-btn" onClick={closeModal}>
                Close
              </button>
            </div>

            <form className="report-form" onSubmit={onSubmit}>
              <div className="report-grid">
                <label>
                  Type
                  <select value={type} onChange={(event) => setType(event.target.value as ReportType)}>
                    {REPORT_TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {formatTypeLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Severity
                  <select
                    value={severity}
                    onChange={(event) => setSeverity(event.target.value as ReportSeverity)}
                  >
                    {REPORT_SEVERITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {formatTypeLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Description
                <textarea
                  rows={3}
                  placeholder="Describe what commuters should know..."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </label>

              <div className="location-row">
                <div className="location-grid">
                  <label>
                    Longitude
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={lng}
                      onChange={(event) => setLng(event.target.value)}
                      placeholder="e.g. 3.3792"
                    />
                  </label>

                  <label>
                    Latitude
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={lat}
                      onChange={(event) => setLat(event.target.value)}
                      placeholder="e.g. 6.5244"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  className="location-btn"
                  onClick={() => void requestLocation()}
                  disabled={locating}
                >
                  {locating ? "Locating..." : "Auto-fill Location"}
                </button>
              </div>

              {locationError && <p className="error-text">{locationError}</p>}

              <div className="modal-actions">
                <button type="button" className="secondary-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="estimate-btn" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
