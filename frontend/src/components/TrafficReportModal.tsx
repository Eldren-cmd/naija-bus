import { useEffect, useState } from "react";
import { reportIncident } from "../lib/api";
import type { FormEvent } from "react";
import type { ReportSeverity, ReportType } from "../types";

type TrafficReportModalProps = {
  routeId: string | null;
  routeName?: string;
};

const TOKEN_STORAGE_KEY = "naija_transport_jwt";

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

export function TrafficReportModal({ routeId, routeName }: TrafficReportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState("");
  const [type, setType] = useState<ReportType>("traffic");
  const [severity, setSeverity] = useState<ReportSeverity>("medium");
  const [description, setDescription] = useState("");
  const [lng, setLng] = useState("");
  const [lat, setLat] = useState("");
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (saved) {
      setToken(saved);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    if (lng && lat) return;
    void requestLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleTokenChange = (nextToken: string) => {
    setToken(nextToken);
    const normalized = nextToken.trim();
    if (!normalized) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(TOKEN_STORAGE_KEY, normalized);
  };

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
    setError(null);
    setLocationError(null);
    setSuccess(null);
  };

  const openModal = () => {
    resetModalState();
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setSubmitting(false);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const authToken = token.trim();
    if (!authToken) {
      setError("JWT is required. Login first, then paste your token.");
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
      setError("Valid lng/lat coordinates are required.");
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
        authToken,
      );

      setSuccess("Incident report submitted successfully.");
      setIsOpen(false);
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to submit report";
      setError(message);
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
      <button type="button" className="estimate-btn report-open-btn" onClick={openModal}>
        Open Traffic Report Modal
      </button>
      {success && <p className="success-text report-status">{success}</p>}
      {error && <p className="error-text report-status">{error}</p>}

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
              <label>
                JWT token
                <input
                  type="password"
                  placeholder="Paste Bearer token from login"
                  value={token}
                  onChange={(event) => handleTokenChange(event.target.value)}
                />
              </label>

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
