import { useEffect, useState } from "react";
import { FareEstimate } from "./components/FareEstimate";
import { RouteView } from "./components/RouteView";
import { getRouteById, getRoutes } from "./lib/api";
import type { FormEvent } from "react";
import type { RouteDetail, RouteSummary } from "./types";
import "./App.css";

function App() {
  const [searchInput, setSearchInput] = useState("");
  const [activeQuery, setActiveQuery] = useState("");
  const [routes, setRoutes] = useState<RouteSummary[]>([]);
  const [routesLoading, setRoutesLoading] = useState(false);
  const [routesError, setRoutesError] = useState<string | null>(null);

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedRoute, setSelectedRoute] = useState<RouteDetail | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

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

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setActiveQuery(searchInput.trim());
  };

  return (
    <main className="app-shell">
      <header className="hero card">
        <p className="kicker">Phase 2 Core MVP</p>
        <h1>Find your route. Know the fare.</h1>
        <p>
          Search Lagos routes, inspect ordered stops, and pull a live fare estimate with multiplier breakdown.
        </p>
      </header>

      <section className="layout">
        <aside className="left-panel card">
          <form onSubmit={onSearch} className="search-box">
            <input
              type="search"
              placeholder="Search route, origin, destination..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <button type="submit">Search</button>
          </form>

          {routesError && <p className="error-text">{routesError}</p>}
          {routesLoading && <p className="muted">Loading routes...</p>}

          <ul className="route-list">
            {routes.map((route) => (
              <li key={route._id}>
                <button
                  type="button"
                  className={route._id === selectedRouteId ? "active" : ""}
                  onClick={() => setSelectedRouteId(route._id)}
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
          <RouteView route={selectedRoute} loading={routeLoading} error={routeError} />
          <FareEstimate routeId={selectedRouteId} routeName={selectedRoute?.name} />
        </section>
      </section>
    </main>
  );
}

export default App;
