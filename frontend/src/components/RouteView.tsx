import type { RouteDetail, TripCheckpoint } from "../types";
import { RouteMap } from "./RouteMap";

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
        <h2 className="panel-title">Route View</h2>
        <p className="muted">Loading selected route...</p>
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
      <RouteMap route={route} tripCheckpoints={tripCheckpoints} />
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
