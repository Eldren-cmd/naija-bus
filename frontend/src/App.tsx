import { useEffect, useRef, useState } from "react";
import { Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { FareEstimate } from "./components/FareEstimate";
import { ReportFarePanel } from "./components/ReportFarePanel";
import { RouteView } from "./components/RouteView";
import { SearchInput } from "./components/SearchInput";
import { ToastStack } from "./components/ToastStack";
import { TrafficReportModal } from "./components/TrafficReportModal";
import { TripRecorder } from "./components/TripRecorder";
import { getRouteById, getRoutes } from "./lib/api";
import type { RouteDetail, RouteSummary, TripCheckpoint } from "./types";
import type { ToastItem, ToastTone } from "./components/ToastStack";
import "./App.css";

function RouteFinderPage() {
  const navigate = useNavigate();
  const { routeId } = useParams<{ routeId: string }>();

  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(routeId ?? null);
  const [selectedRoute, setSelectedRoute] = useState<RouteDetail | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [tripCheckpoints, setTripCheckpoints] = useState<TripCheckpoint[]>([]);
  const [fareRefreshNonce, setFareRefreshNonce] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const toastTimersRef = useRef<number[]>([]);

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
    let cancelled = false;

    const loadRoutes = async () => {
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
  }, [activeQuery]);

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
  }, [selectedRouteId]);

  useEffect(() => {
    if (!routeId) return;
    if (!selectedRouteId) return;
    if (routeId === selectedRouteId) return;
    navigate(`/route/${selectedRouteId}`, { replace: true });
  }, [navigate, routeId, selectedRouteId]);

  const onSearch = (query: string) => {
    setActiveQuery(query);
    if (!query.trim()) {
      navigate("/", { replace: true });
    }
  };

  const onSelectRouteFromSearch = (routeId: string, nextQuery: string) => {
    setSearchInput(nextQuery);
    setActiveQuery(nextQuery.trim());
    setSelectedRouteId(routeId);
    navigate(`/route/${routeId}`);
  };

  const onSelectRouteFromList = (routeId: string) => {
    setSelectedRouteId(routeId);
    navigate(`/route/${routeId}`);
  };

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

  return (
    <main className="app-shell">
      <header className="hero card">
        <p className="kicker">Phase 2 Core MVP</p>
        <h1>Find your route. Know the fare.</h1>
        <p>
          Search Lagos routes, inspect ordered stops, and pull a live fare estimate with multiplier breakdown.
        </p>
        <p className="brand-note">A VerityWave Solutions product</p>
      </header>

      <section className="layout">
        <aside className="left-panel card">
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={onSearch}
            onSelectRoute={onSelectRouteFromSearch}
          />

          {routesError && <p className="error-text">{routesError}</p>}
          {routesLoading && <p className="muted">Loading routes...</p>}

          <ul className="route-list">
            {routes.map((route) => (
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

          {!routesLoading && routes.length === 0 && <p className="muted">No routes matched your search.</p>}
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
            onSubmitted={() => setFareRefreshNonce((previous) => previous + 1)}
            onToast={notify}
          />
          <TrafficReportModal routeId={selectedRouteId} routeName={selectedRoute?.name} onToast={notify} />
        </section>
      </section>
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RouteFinderPage />} />
      <Route path="/route/:routeId" element={<RouteFinderPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
