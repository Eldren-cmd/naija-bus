import { Suspense, lazy } from "react";
import type { RouteDetail, TripCheckpoint } from "../types";

const LazyRouteMap = lazy(async () => {
  const module = await import("./RouteMap");
  return { default: module.RouteMap };
});

type RouteViewProps = {
  route: RouteDetail | null;
  loading: boolean;
  error: string | null;
  tripCheckpoints: TripCheckpoint[];
};

export function RouteView({ route, loading, error, tripCheckpoints }: RouteViewProps) {
  if (loading) {
    return (
      <section className="route-view card">
        <div className="route-head">
          <h2 className="panel-title">Route View</h2>
          <span className="skeleton-pill skeleton-pill-sm" aria-hidden="true" />
        </div>
        <div className="route-subtitle-skeleton" aria-hidden="true">
          <span className="skeleton-line skeleton-line-lg" />
        </div>
        <div className="route-meta" aria-hidden="true">
          <span className="skeleton-pill" />
          <span className="skeleton-pill" />
          <span className="skeleton-pill" />
        </div>
        <div className="map-placeholder skeleton-block" aria-hidden="true" />
        <h3 className="panel-title">Stops</h3>
        <ol className="stops-list skeleton-list" aria-hidden="true">
          {[1, 2, 3, 4].map((item) => (
            <li key={`route-stop-skeleton-${item}`}>
              <span className="stop-order skeleton-pill skeleton-pill-circle" />
              <div>
                <p className="skeleton-line skeleton-line-md" />
                <small className="skeleton-line skeleton-line-sm" />
              </div>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  if (error) {
    return (
      <section className="route-view card">
        <h2 className="panel-title">Route View</h2>
        <p className="error-text">{error}</p>
      </section>
    );
  }

  if (!route) {
    return (
      <section className="route-view card">
        <h2 className="panel-title">Route View</h2>
        <p className="muted">Select a route from search results to view stops and fare details.</p>
      </section>
    );
  }

  return (
    <section className="route-view card">
      <div className="route-head">
        <h2 className="route-name">{route.name}</h2>
        <span className="type-pill">{route.transportType}</span>
      </div>
      <p className="route-subtitle">
        {route.origin} <span>to</span> {route.destination}
      </p>
      <div className="route-meta">
        <span>Corridor: {route.corridor || "N/A"}</span>
        <span>Stops: {route.stops.length}</span>
        <span>Path points: {route.polyline.coordinates.length}</span>
      </div>
      <Suspense fallback={<div className="map-placeholder skeleton-block" aria-hidden="true" />}>
        <LazyRouteMap route={route} tripCheckpoints={tripCheckpoints} />
      </Suspense>
      <h3 className="panel-title">Stops</h3>
      <ol className="stops-list">
        {route.stops.map((stop) => (
          <li key={stop._id}>
            <span className="stop-order">{stop.order}</span>
            <div>
              <p>{stop.name}</p>
              <small>
                {stop.coords.coordinates[1].toFixed(5)}, {stop.coords.coordinates[0].toFixed(5)}
              </small>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
