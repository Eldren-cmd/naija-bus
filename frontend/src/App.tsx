import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import type { ReactElement } from "react";
import {
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "./auth/AuthContext";
import { FareEstimate } from "./components/FareEstimate";
import { LoginPage } from "./components/LoginPage";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { Nav } from "./components/Nav";
import { EmptyState } from "./components/EmptyState";
import { OfflineBanner } from "./components/OfflineBanner";
import { ReportFarePanel } from "./components/ReportFarePanel";
import { RouteCardSkeleton } from "./components/RouteCardSkeleton";
import { RouteView } from "./components/RouteView";
import { SearchBar } from "./components/SearchBar";
import { SignupPage } from "./components/SignupPage";
import { ToastStack } from "./components/ToastStack";
import { TrafficReportModal } from "./components/TrafficReportModal";
import { TripRecorder } from "./components/TripRecorder";
import { useAuthGuard } from "./hooks/useAuthGuard";
import { usePullToRefresh } from "./hooks/usePullToRefresh";
import {
  addSavedRoute,
  getAuthProfile,
  getEngagementLeaderboard,
  getMyEngagementSummary,
  getRouteById,
  getRoutes,
  getSavedRoutes,
  getTripsByUser,
  removeSavedRoute,
} from "./lib/api";
import type {
  EngagementLeaderboardEntry,
  EngagementSummary,
  RouteDetail,
  RouteSummary,
  TripCheckpoint,
  TripRecordResponse,
} from "./types";
import type { ToastItem, ToastTone } from "./components/ToastStack";
import { Home } from "./pages/Home";
import { QuickReportPage } from "./pages/QuickReport";
import "./App.css";

const formatDistance = (meters: number): string => {
  if (meters >= 1000) return `${(meters / 1000).toFixed(2)} km`;
  return `${meters} m`;
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

const formatDateTime = (value: string): string => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const formatNaira = (value: number): string =>
  `\u20A6${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(value)}`;

const formatBadgeLabel = (value: string): string =>
  value
    .split("_")
    .map((part) => (part ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join(" ");

const LazyAdminPanel = lazy(async () => {
  const module = await import("./components/AdminPanel");
  return { default: module.AdminPanel };
});

const LazyMyTripMap = lazy(async () => {
  const module = await import("./components/MyTripMap");
  return { default: module.MyTripMap };
});

function ProtectedRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

function AdminRoute({ children }: { children: ReactElement }) {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/map" replace />;
  }

  return children;
}

function RouteFinderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { routeId } = useParams<{ routeId: string }>();
  const { accessToken } = useAuth();
  const initialQuery = (searchParams.get("q") ?? "").trim();

  const [searchInput, setSearchInput] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery);
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery));
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<RouteSummary[]>([]);
  const [savedRoutesLoading, setSavedRoutesLoading] = useState(false);
  const [savedRoutesError, setSavedRoutesError] = useState<string | null>(null);
  const [savingRouteId, setSavingRouteId] = useState<string | null>(null);

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(routeId ?? null);
  const [selectedRoute, setSelectedRoute] = useState<RouteDetail | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [tripCheckpoints, setTripCheckpoints] = useState<TripCheckpoint[]>([]);
  const [fareRefreshNonce, setFareRefreshNonce] = useState(0);
  const [dataRefreshNonce, setDataRefreshNonce] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastTimersRef = useRef<number[]>([]);
  const savedRouteIds = useMemo(() => new Set(savedRoutes.map((route) => route._id)), [savedRoutes]);
  const selectedRouteSummary = useMemo(
    () => routes.find((route) => route._id === selectedRouteId) ?? null,
    [routes, selectedRouteId],
  );

  const dismissToast = (id: number) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  };

  const notify = (tone: ToastTone, message: string) => {
    const id = Date.now() + Math.floor(Math.random() * 10000);
    setToasts((previous) => [...previous, { id, tone, message }]);

    const timer = window.setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
      toastTimersRef.current = toastTimersRef.current.filter((activeTimer) => activeTimer !== timer);
    }, 4500);

    toastTimersRef.current.push(timer);
  };

  const authGuard = useAuthGuard({ authToken: accessToken, onToast: notify });

  useEffect(() => {
    return () => {
      toastTimersRef.current.forEach((timer) => window.clearTimeout(timer));
      toastTimersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (routeId) {
      setSelectedRouteId(routeId);
    }
  }, [routeId]);

  useEffect(() => {
    const urlQuery = (searchParams.get("q") ?? "").trim();
    setSearchInput(urlQuery);
    setActiveQuery(urlQuery);
    setHasSearched(Boolean(urlQuery));
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    const loadRoutes = async () => {
      if (!hasSearched) {
        setRoutes([]);
        setRoutesError(null);
        setRoutesLoading(false);
        return;
      }
      setRoutesLoading(true);
      setRoutesError(null);
      try {
        const data = await getRoutes(activeQuery);
        if (cancelled) return;
        setRoutes(data);
        if (data.length === 0) {
          setSelectedRouteId(null);
          setSelectedRoute(null);
          return;
        }

        setSelectedRouteId((previous) =>
          previous && data.some((item) => item._id === previous) ? previous : data[0]._id,
        );
      } catch (requestError) {
        if (cancelled) return;
        const message = requestError instanceof Error ? requestError.message : "Failed to fetch routes";
        setRoutesError(message);
        setRoutes([]);
      } finally {
        if (!cancelled) setRoutesLoading(false);
      }
    };

    void loadRoutes();
    return () => {
      cancelled = true;
    };
  }, [activeQuery, hasSearched, dataRefreshNonce]);

  useEffect(() => {
    let cancelled = false;
    const token = accessToken?.trim();
    if (!token) {
      setSavedRoutes([]);
      setSavedRoutesError(null);
      setSavedRoutesLoading(false);
      return;
    }

    const loadSavedRoutes = async () => {
      setSavedRoutesLoading(true);
      setSavedRoutesError(null);
      try {
        const data = await getSavedRoutes(token);
        if (cancelled) return;
        setSavedRoutes(data);
      } catch (requestError) {
        if (cancelled) return;
        const message =
          requestError instanceof Error ? requestError.message : "Failed to fetch saved routes";
        setSavedRoutesError(message);
      } finally {
        if (!cancelled) setSavedRoutesLoading(false);
      }
    };

    void loadSavedRoutes();
    return () => {
      cancelled = true;
    };
  }, [accessToken, dataRefreshNonce]);

  useEffect(() => {
    let cancelled = false;
    if (!selectedRouteId) {
      setSelectedRoute(null);
      return;
    }

    const loadRouteDetail = async () => {
      setRouteLoading(true);
      setRouteError(null);
      try {
        const data = await getRouteById(selectedRouteId);
        if (!cancelled) setSelectedRoute(data);
      } catch (requestError) {
        if (cancelled) return;
        const message = requestError instanceof Error ? requestError.message : "Failed to fetch route details";
        setRouteError(message);
        setSelectedRoute(null);
      } finally {
        if (!cancelled) setRouteLoading(false);
      }
    };

    void loadRouteDetail();
    return () => {
      cancelled = true;
    };
  }, [selectedRouteId, dataRefreshNonce]);

  useEffect(() => {
    if (!routeId) return;
    if (!selectedRouteId) return;
    if (routeId === selectedRouteId) return;
    const querySuffix = activeQuery ? `?q=${encodeURIComponent(activeQuery)}` : "";
    navigate(`/route/${selectedRouteId}${querySuffix}`, { replace: true });
  }, [activeQuery, navigate, routeId, selectedRouteId]);

  const onSearch = (query: string) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;
    setHasSearched(true);
    setActiveQuery(normalizedQuery);
    const nextPath = `/map?q=${encodeURIComponent(normalizedQuery)}`;
    navigate(nextPath, { replace: true });
  };

  const onSelectRouteFromList = (routeId: string) => {
    setSelectedRouteId(routeId);
    const querySuffix = activeQuery ? `?q=${encodeURIComponent(activeQuery)}` : "";
    navigate(`/route/${routeId}${querySuffix}`);
  };

  const onToggleSavedRoute = async (route: RouteSummary) => {
    const token = authGuard.requireToken({
      action: "save routes",
      blockedMessage: "Sign in to save routes to your profile.",
    });
    if (!token) {
      return;
    }

    setSavingRouteId(route._id);
    setSavedRoutesError(null);
    try {
      if (savedRouteIds.has(route._id)) {
        await removeSavedRoute(route._id, token);
        setSavedRoutes((previous) => previous.filter((item) => item._id !== route._id));
        notify("info", `Removed ${route.name} from saved routes.`);
      } else {
        await addSavedRoute(route._id, token);
        setSavedRoutes((previous) => {
          if (previous.some((item) => item._id === route._id)) return previous;
          const next = [...previous, route];
          next.sort((a, b) => a.name.localeCompare(b.name));
          return next;
        });
        notify("success", `Saved ${route.name}.`);
      }
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : "Failed to update saved routes";
      setSavedRoutesError(message);
      notify("error", message);
    } finally {
      setSavingRouteId(null);
    }
  };

  const pullRefresh = usePullToRefresh({
    enabled: true,
    onRefresh: async () => {
      setDataRefreshNonce((previous) => previous + 1);
      notify("info", "Refreshing latest route data...");
      await new Promise<void>((resolve) => {
        window.setTimeout(() => resolve(), 700);
      });
    },
  });

  return (
    <>
      <Nav />
      <OfflineBanner />
      <main className="app-shell pull-refresh-shell" {...pullRefresh.bind}>
        <div
          className={`pull-refresh-indicator state-${pullRefresh.pullState}`}
          style={pullRefresh.indicatorHeight > 0 ? { height: `${pullRefresh.indicatorHeight}px` } : undefined}
          aria-hidden={pullRefresh.pullState === "idle"}
        >
          <span className="pull-refresh-icon" aria-hidden="true">
            {pullRefresh.pullState === "refreshing" ? "RF" : "PR"}
          </span>
          <p>{pullRefresh.hint}</p>
        </div>
        <header className="routefinder-hero">
          <div className="routefinder-hero-inner">
            <div className="routefinder-hero-copy">
              <h1>Route Finder</h1>
              <p>Search any Lagos route to see stops, map, and live fare.</p>
            </div>
            <SearchBar
              query={searchInput}
              loading={routesLoading}
              onQueryChange={setSearchInput}
              onSubmit={onSearch}
            />
          </div>
        </header>

        <section className="layout">
          <aside className="left-panel card">

            {accessToken?.trim() && (
              <section className="saved-routes-panel">
                <div className="saved-routes-head">
                  <h3 className="panel-title">Saved Routes</h3>
                </div>
                {savedRoutesError && <p className="error-text">{savedRoutesError}</p>}
                {savedRoutesLoading && (
                  <RouteCardSkeleton count={3} className="saved-route-list-skeleton" />
                )}
                {!savedRoutesLoading && savedRoutes.length === 0 && (
                  <EmptyState
                    tone="route"
                    compact
                    title="No saved routes yet"
                    message="Save frequent routes for instant fare checks and trip recording."
                    action={
                      <div className="saved-empty-actions">
                        {selectedRouteSummary && (
                          <button
                            type="button"
                            className="estimate-btn"
                            onClick={() => void onToggleSavedRoute(selectedRouteSummary)}
                            disabled={savingRouteId === selectedRouteSummary._id}
                          >
                            {savingRouteId === selectedRouteSummary._id ? "Saving..." : "Save Selected Route"}
                          </button>
                        )}
                        <button
                          type="button"
                          className="secondary-btn"
                          onClick={() => {
                            setSearchInput("");
                            setActiveQuery("");
                            navigate("/map", { replace: true });
                          }}
                        >
                          Browse Routes
                        </button>
                      </div>
                    }
                  />
                )}
                {!savedRoutesLoading && savedRoutes.length > 0 && (
                  <ul className="saved-route-list">
                    {savedRoutes.map((route) => (
                      <li key={route._id}>
                        <button
                          type="button"
                          className={route._id === selectedRouteId ? "active" : ""}
                          onClick={() => onSelectRouteFromList(route._id)}
                        >
                          <strong>{route.name}</strong>
                          <span>
                            {route.origin} to {route.destination}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {routesError && <p className="error-text">{routesError}</p>}

            {routesLoading && <RouteCardSkeleton count={5} includeSaveAction />}

            {!routesLoading && (
              <ul className="route-list">
                {routes.map((route, index) => (
                  <li
                    key={route._id}
                    className="route-list-item route-list-item-stagger"
                    style={{ animationDelay: `${index * 55}ms` }}
                  >
                    <button
                      type="button"
                      className={route._id === selectedRouteId ? "active" : ""}
                      onClick={() => onSelectRouteFromList(route._id)}
                    >
                      <strong>{route.name}</strong>
                      <span>
                        {route.origin} to {route.destination}
                      </span>
                    </button>
                    <button
                      type="button"
                      className={`route-save-btn ${savedRouteIds.has(route._id) ? "saved" : ""}`}
                      onClick={() => void onToggleSavedRoute(route)}
                      disabled={savingRouteId === route._id}
                    >
                      {savingRouteId === route._id
                        ? "Updating..."
                        : savedRouteIds.has(route._id)
                          ? "Saved"
                          : authGuard.getActionLabel({
                              authenticated: "Save",
                              unauthenticated: "Login to Save",
                            })}
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {!routesLoading && !hasSearched && (
              <EmptyState
                tone="route"
                compact
                title="Search to begin"
                message="Use the search field above to load routes, stops, and live fare estimates."
              />
            )}

            {!routesLoading && hasSearched && routes.length === 0 && (
              <EmptyState
                tone="route"
                compact
                iconLabel="00"
                title="No routes found"
                message="Try another origin, destination, or a shorter keyword like Ojota or Lekki."
              />
            )}
          </aside>

          <section className="right-panel">
            <RouteView
              route={selectedRoute}
              loading={routeLoading}
              error={routeError}
              tripCheckpoints={tripCheckpoints}
            />
            <TripRecorder
              routeId={selectedRouteId}
              routeName={selectedRoute?.name}
              authToken={accessToken}
              onCheckpointsChange={setTripCheckpoints}
              onToast={notify}
            />
            <FareEstimate
              routeId={selectedRouteId}
              routeName={selectedRoute?.name}
              refreshSignal={fareRefreshNonce}
            />
            <ReportFarePanel
              routeId={selectedRouteId}
              routeName={selectedRoute?.name}
              authToken={accessToken}
              onSubmitted={() => setFareRefreshNonce((previous) => previous + 1)}
              onToast={notify}
            />
            <TrafficReportModal
              routeId={selectedRouteId}
              routeName={selectedRoute?.name}
              authToken={accessToken}
              onToast={notify}
            />
          </section>
        </section>
        <ToastStack toasts={toasts} onDismiss={dismissToast} />
      </main>
      <MobileBottomNav />
    </>
  );
}

function MyTripsPage() {
  const { accessToken, isAuthenticated, user } = useAuth();
  const [profileName, setProfileName] = useState<string | null>(null);
  const [trips, setTrips] = useState<TripRecordResponse[]>([]);
  const [engagement, setEngagement] = useState<EngagementSummary | null>(null);
  const [leaderboard, setLeaderboard] = useState<EngagementLeaderboardEntry[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engagementError, setEngagementError] = useState<string | null>(null);

  const loadTripsWithToken = async (token: string) => {
    setLoading(true);
    setEngagementLoading(true);
    setError(null);
    setEngagementError(null);
    try {
      const profile = await getAuthProfile(token);
      setProfileName(profile.user.fullName);
      const [data, engagementSummary, leaderboardRows] = await Promise.all([
        getTripsByUser(profile.user.id, token),
        getMyEngagementSummary(token),
        getEngagementLeaderboard(token, 5),
      ]);
      setTrips(data);
      setEngagement(engagementSummary);
      setLeaderboard(leaderboardRows);
      setSelectedTripId((previous) => {
        if (previous && data.some((trip) => trip._id === previous)) return previous;
        return data[0]?._id ?? null;
      });
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "Failed to load trip history";
      setError(message);
      setEngagementError(message);
      setTrips([]);
      setEngagement(null);
      setLeaderboard([]);
      setSelectedTripId(null);
    } finally {
      setLoading(false);
      setEngagementLoading(false);
    }
  };

  useEffect(() => {
    const normalizedToken = accessToken?.trim();
    if (!normalizedToken) {
      setTrips([]);
      setSelectedTripId(null);
      setProfileName(null);
      setError(null);
      setEngagement(null);
      setLeaderboard([]);
      setEngagementError(null);
      setEngagementLoading(false);
      return;
    }
    void loadTripsWithToken(normalizedToken);
  }, [accessToken]);

  const selectedTrip =
    selectedTripId && trips.length > 0 ? trips.find((trip) => trip._id === selectedTripId) ?? null : null;

  return (
    <>
      <Nav />
      <OfflineBanner />
      <main className="app-shell">
      <header className="hero card">
        <p className="kicker">Trip History</p>
        <h1>My Recorded Trips</h1>
        <p>Review uploaded trips with distance and duration history for route learning insights.</p>
        <p className="brand-note">A VerityWave Solutions product</p>
      </header>

      <section className="mytrips-layout">
        <section className="mytrips-toolbar card">
          <h3 className="panel-title">Trip History Loader</h3>
          <p className="muted">
            {profileName || user?.fullName
              ? `Signed in as ${profileName || user?.fullName}`
              : "Sign in to load your account profile and trip history."}
          </p>
          {!isAuthenticated && (
            <Link to="/login" className="estimate-btn mytrips-login-link">
              Login to Continue
            </Link>
          )}
          {isAuthenticated && (
            <button
              type="button"
              className="estimate-btn"
              onClick={() => {
                if (!accessToken) return;
                void loadTripsWithToken(accessToken);
              }}
              disabled={loading}
            >
              {loading ? "Loading..." : "Reload My Trips"}
            </button>
          )}
          {error && <p className="error-text">{error}</p>}

          <section className="engagement-card">
            <div className="engagement-head">
              <h3 className="panel-title">Engagement</h3>
              {!engagementLoading && engagement && (
                <span className="engagement-level-chip">Level {engagement.level}</span>
              )}
            </div>

            {engagementLoading && (
              <div className="engagement-skeleton" aria-hidden="true">
                <div className="engagement-grid">
                  <span className="skeleton-card" />
                  <span className="skeleton-card" />
                  <span className="skeleton-card" />
                  <span className="skeleton-card" />
                </div>
                <span className="skeleton-line skeleton-line-lg" />
                <span className="skeleton-line skeleton-line-md" />
              </div>
            )}

            {engagementError && !engagementLoading && <p className="error-text">{engagementError}</p>}

            {!engagementLoading && engagement && (
              <>
                <div className="engagement-grid">
                  <article>
                    <p className="muted small">Points</p>
                    <strong>{engagement.points}</strong>
                  </article>
                  <article>
                    <p className="muted small">Trip Streak</p>
                    <strong>{engagement.tripStreak} days</strong>
                  </article>
                  <article>
                    <p className="muted small">Trips</p>
                    <strong>{engagement.tripCount}</strong>
                  </article>
                  <article>
                    <p className="muted small">Distance</p>
                    <strong>{formatDistance(engagement.totalDistanceMeters)}</strong>
                  </article>
                </div>

                <div className="engagement-progress">
                  <p className="muted small">
                    {engagement.pointsToNextLevel} points to Level {engagement.level + 1}
                  </p>
                  <div className="progress-track" role="presentation" aria-hidden="true">
                    <span style={{ width: `${engagement.progressPercent}%` }} />
                  </div>
                </div>

                <p className="muted small">Airtime earned: {formatNaira(engagement.airtimeEarned)}</p>

                <div>
                  <p className="muted small">Badges</p>
                  {engagement.badges.length === 0 ? (
                    <p className="muted small">No badges yet. Keep recording trips and reporting updates.</p>
                  ) : (
                    <div className="badge-list">
                      {engagement.badges.map((badge) => (
                        <span key={badge}>{formatBadgeLabel(badge)}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="muted small">Leaderboard</p>
                  {leaderboard.length === 0 ? (
                    <p className="muted small">No leaderboard entries yet.</p>
                  ) : (
                    <ol className="leaderboard-list">
                      {leaderboard.map((entry) => (
                        <li key={entry.userId}>
                          <span>
                            {entry.rank}. {entry.fullName}
                          </span>
                          <strong>{entry.points} pts</strong>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </>
            )}
          </section>
        </section>

        <section className="mytrips-main">
          <section className="mytrips-list">
            {!isAuthenticated && (
              <div className="mytrip-empty card">
                <p className="muted">You are signed out. Login first to view your trip history.</p>
              </div>
            )}
            {loading && (
              <ul className="trip-card-list skeleton-list" aria-hidden="true">
                {[1, 2, 3].map((item) => (
                  <li key={`trip-skeleton-${item}`}>
                    <article className="trip-card card skeleton-trip-card">
                      <div className="trip-card-head">
                        <span className="skeleton-line skeleton-line-md" />
                        <span className="skeleton-pill skeleton-pill-sm" />
                      </div>
                      <p className="skeleton-line skeleton-line-md" />
                      <div className="trip-card-meta">
                        <span className="skeleton-pill" />
                        <span className="skeleton-pill" />
                        <span className="skeleton-pill" />
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            )}

            {isAuthenticated && !loading && trips.length === 0 && (
              <div className="mytrip-empty card">
                <p className="muted">No uploaded trips yet. Record and upload your first trip from Route Finder.</p>
              </div>
            )}

            {!loading && (
              <ul className="trip-card-list">
                {trips.map((trip) => {
                  const routeSummary =
                    typeof trip.routeId === "object" && trip.routeId
                      ? `${trip.routeId.name} (${trip.routeId.origin} to ${trip.routeId.destination})`
                      : "Route not specified";
                  const isActive = trip._id === selectedTripId;

                  return (
                    <li key={trip._id}>
                      <button
                        type="button"
                        className={`trip-card card ${isActive ? "is-active" : ""}`}
                        onClick={() => setSelectedTripId(trip._id)}
                      >
                        <div className="trip-card-head">
                          <strong>{formatDateTime(trip.startedAt)}</strong>
                          <span>{formatDistance(trip.distanceMeters)}</span>
                        </div>
                        <p className="trip-card-route">{routeSummary}</p>
                        <div className="trip-card-meta">
                          <span>Duration: {formatDuration(trip.durationSeconds)}</span>
                          <span>Checkpoints: {trip.checkpoints.length}</span>
                          <span>Ended: {formatDateTime(trip.endedAt)}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="mytrips-map-panel card">
            <div className="mytrips-map-head">
              <h3 className="panel-title">Trip Replay Map</h3>
              <p className="muted small">
                Select a trip card to replay its stored checkpoints as a route line.
              </p>
            </div>
            <Suspense fallback={<div className="map-placeholder skeleton-block" aria-hidden="true" />}>
              <LazyMyTripMap trip={selectedTrip} />
            </Suspense>
          </section>
        </section>
      </section>
      </main>
      <MobileBottomNav />
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/" element={<Home />} />
      <Route path="/map" element={<RouteFinderPage />} />
      <Route path="/search" element={<RouteFinderPage />} />
      <Route path="/route/:routeId" element={<RouteFinderPage />} />
      <Route path="/quick-report" element={<QuickReportPage />} />
      <Route
        path="/trips"
        element={
          <ProtectedRoute>
            <MyTripsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-trips"
        element={
          <ProtectedRoute>
            <MyTripsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <>
              <Nav />
              <Suspense
                fallback={
                  <main className="app-shell">
                    <section className="card">
                      <h2 className="panel-title">Admin Panel</h2>
                      <p className="muted">Loading admin controls...</p>
                    </section>
                  </main>
                }
              >
                <LazyAdminPanel />
              </Suspense>
              <MobileBottomNav />
            </>
          </AdminRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
