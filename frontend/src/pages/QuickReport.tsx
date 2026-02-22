import { type FormEvent, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { MobileBottomNav } from "../components/MobileBottomNav";
import { Nav } from "../components/Nav";
import { OfflineBanner } from "../components/OfflineBanner";
import { getQuickReportBootstrap, submitQuickFareReport } from "../lib/api";
import type { QuickAssignedRoute, QuickReportBootstrapResponse, TrafficLevel } from "../types";

const formatNaira = (value: number): string =>
  `\u20A6${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(value)}`;

const quickTrafficOptions: Array<{ value: TrafficLevel; label: string }> = [
  { value: "low", label: "Low traffic" },
  { value: "medium", label: "Medium traffic" },
  { value: "high", label: "High traffic" },
];

const hasRoute = (routes: QuickAssignedRoute[], routeId: string): boolean =>
  routes.some((route) => route.routeId === routeId);

export function QuickReportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialToken = (searchParams.get("token") || "").trim();

  const [tokenInput, setTokenInput] = useState(initialToken);
  const [activeToken, setActiveToken] = useState(initialToken);
  const [bootstrapData, setBootstrapData] = useState<QuickReportBootstrapResponse | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState("");
  const [reportedFareInput, setReportedFareInput] = useState("");
  const [trafficLevel, setTrafficLevel] = useState<TrafficLevel>("medium");
  const [notes, setNotes] = useState("");

  const [bootstrapLoading, setBootstrapLoading] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const selectedRoute = useMemo(() => {
    if (!bootstrapData || !selectedRouteId) return null;
    return bootstrapData.assignedRoutes.find((route) => route.routeId === selectedRouteId) ?? null;
  }, [bootstrapData, selectedRouteId]);

  const onBootstrap = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const token = tokenInput.trim();
    if (!token) {
      setBootstrapError("Conductor token is required.");
      setBootstrapData(null);
      setActiveToken("");
      setSelectedRouteId("");
      return;
    }

    setBootstrapLoading(true);
    setBootstrapError(null);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const response = await getQuickReportBootstrap(token);
      setBootstrapData(response);
      setActiveToken(token);
      setSelectedRouteId((previous) => {
        if (previous && hasRoute(response.assignedRoutes, previous)) return previous;
        return response.assignedRoutes[0]?.routeId || "";
      });
      setSearchParams({ token }, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to verify conductor token";
      setBootstrapError(message);
      setBootstrapData(null);
      setActiveToken("");
      setSelectedRouteId("");
    } finally {
      setBootstrapLoading(false);
    }
  };

  const onSubmitQuickReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!bootstrapData) {
      setSubmitError("Load assigned routes first.");
      return;
    }

    if (!selectedRouteId) {
      setSubmitError("Select an assigned route first.");
      return;
    }

    const parsedFare = Number(reportedFareInput);
    if (!Number.isFinite(parsedFare) || parsedFare <= 0) {
      setSubmitError("Enter a valid fare amount.");
      return;
    }

    setSubmitLoading(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await submitQuickFareReport({
        token: activeToken,
        routeId: selectedRouteId,
        reportedFare: parsedFare,
        trafficLevel,
        notes: notes.trim() || undefined,
      });

      const routeName =
        bootstrapData.assignedRoutes.find((route) => route.routeId === selectedRouteId)?.name || "selected route";
      setSubmitSuccess(`Report saved for ${routeName}.`);
      setReportedFareInput("");
      setNotes("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit quick fare report";
      setSubmitError(message);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <>
      <Nav />
      <OfflineBanner />
      <main className="app-shell quick-report-shell">
        <header className="quick-report-hero card">
          <p className="quick-report-kicker">Conductor Quick Flow</p>
          <h1>Quick Fare Report</h1>
          <p>
            Use your conductor token, pick an assigned route, and submit fare updates fast from your
            phone.
          </p>
          <div className="quick-report-hero-meta">
            <span>Token bootstrap</span>
            <span>Assigned-route lock</span>
            <span>10-second submit flow</span>
          </div>
        </header>

        <section className="quick-report-grid">
          <article className="quick-report-card card">
            <h2 className="panel-title">Step 1: Verify Token</h2>
            <p className="muted">
              Enter the conductor token assigned by admin. This route list is restricted by backend
              policy.
            </p>

            <form className="quick-report-form" onSubmit={onBootstrap}>
              <label htmlFor="quick-token">Conductor token</label>
              <input
                id="quick-token"
                type="text"
                autoComplete="off"
                value={tokenInput}
                onChange={(event) => setTokenInput(event.target.value)}
                placeholder="Paste conductor token"
                className="quick-input"
              />
              <button type="submit" className="quick-primary-btn" disabled={bootstrapLoading}>
                {bootstrapLoading ? "Verifying..." : "Load Assigned Routes"}
              </button>
            </form>

            {bootstrapError && <p className="error-text">{bootstrapError}</p>}

            {!bootstrapError && !bootstrapData && (
              <p className="muted small">
                No token yet? Contact your admin for a conductor token with assigned routes.
              </p>
            )}

            {bootstrapData && (
              <div className="quick-conductor-summary">
                <p className="quick-conductor-name">{bootstrapData.conductor.fullName}</p>
                <p className="muted small">
                  {bootstrapData.assignedRoutes.length} assigned{" "}
                  {bootstrapData.assignedRoutes.length === 1 ? "route" : "routes"}
                </p>
              </div>
            )}
          </article>

          <article className="quick-report-card card">
            <h2 className="panel-title">Step 2: Choose Route</h2>
            {!bootstrapData && <p className="muted">Verify token first to load assigned routes.</p>}

            {bootstrapData && bootstrapData.assignedRoutes.length === 0 && (
              <p className="error-text">
                No assigned routes found for this conductor. Ask admin to assign at least one route.
              </p>
            )}

            {bootstrapData && bootstrapData.assignedRoutes.length > 0 && (
              <ul className="quick-route-list">
                {bootstrapData.assignedRoutes.map((route) => (
                  <li key={route.routeId}>
                    <button
                      type="button"
                      className={`quick-route-btn ${route.routeId === selectedRouteId ? "active" : ""}`}
                      onClick={() => {
                        setSelectedRouteId(route.routeId);
                        setSubmitError(null);
                        setSubmitSuccess(null);
                      }}
                    >
                      <strong>{route.name}</strong>
                      <span>
                        {route.origin} to {route.destination}
                      </span>
                      <small>Base: {formatNaira(route.baseFare)}</small>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </article>

          <article className="quick-report-card card">
            <h2 className="panel-title">Step 3: Submit Fare</h2>
            {!bootstrapData && <p className="muted">Verify token and select route first.</p>}

            {bootstrapData && (
              <form className="quick-report-form" onSubmit={onSubmitQuickReport}>
                <label htmlFor="quick-fare-amount">Fare paid (NGN)</label>
                <input
                  id="quick-fare-amount"
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={reportedFareInput}
                  onChange={(event) => setReportedFareInput(event.target.value)}
                  placeholder="e.g. 500"
                  className="quick-input"
                  disabled={bootstrapData.assignedRoutes.length === 0}
                />

                <label htmlFor="quick-fare-traffic">Traffic level</label>
                <select
                  id="quick-fare-traffic"
                  value={trafficLevel}
                  onChange={(event) => setTrafficLevel(event.target.value as TrafficLevel)}
                  className="quick-input"
                  disabled={bootstrapData.assignedRoutes.length === 0}
                >
                  {quickTrafficOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>

                <label htmlFor="quick-fare-notes">Notes (optional)</label>
                <textarea
                  id="quick-fare-notes"
                  rows={3}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Context like rush-hour surge or route delay"
                  className="quick-input quick-textarea"
                  disabled={bootstrapData.assignedRoutes.length === 0}
                />

                <button
                  type="submit"
                  className="quick-primary-btn"
                  disabled={submitLoading || bootstrapData.assignedRoutes.length === 0}
                >
                  {submitLoading ? "Saving..." : "Submit Quick Report"}
                </button>
              </form>
            )}

            {selectedRoute && (
              <p className="muted small">
                Active route: <strong>{selectedRoute.name}</strong> ({selectedRoute.origin} to{" "}
                {selectedRoute.destination})
              </p>
            )}

            {submitError && <p className="error-text">{submitError}</p>}
            {submitSuccess && <p className="success-text">{submitSuccess}</p>}

            <p className="muted small">
              Need full rider map and fare flow? <Link to="/map">Open Route Finder</Link>.
            </p>
          </article>
        </section>
      </main>
      <MobileBottomNav />
    </>
  );
}
