import { Suspense, lazy } from "react";
import { EmptyState } from "./EmptyState";
import { PanelCard } from "./PanelCard";
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
      <PanelCard
        title="Route View"
        tone="route"
        iconLabel="RT"
        className="route-view"
        headerMeta={<span className="skeleton-pill skeleton-pill-sm" aria-hidden="true" />}
      >
        <div className="route-subtitle-skeleton" aria-hidden="true">
          <span className="skeleton-line skeleton-line-lg" />
        </div>
        <div className="route-meta" aria-hidden="true">
          <span className="skeleton-pill" />
          <span className="skeleton-pill" />
          <span className="skeleton-pill" />
        </div>
        <div className="map-placeholder skeleton-block" aria-hidden="true" />
        <h4 className="panel-section-title">Stops</h4>
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
      </PanelCard>
    );
  }

  if (error) {
    return (
      <PanelCard title="Route View" tone="route" iconLabel="RT" className="route-view">
        <EmptyState
          tone="route"
          iconLabel="ER"
          title="Unable to load route details"
          message={error}
          className="empty-state-danger"
        />
      </PanelCard>
    );
  }

  if (!route) {
    return (
      <PanelCard title="Route View" tone="route" iconLabel="RT" className="route-view">
        <EmptyState
          tone="route"
          title="Select a route"
          message="Pick any route from search results to load the map, ordered stops, and route metadata."
        />
      </PanelCard>
    );
  }

  return (
    <PanelCard
      title="Route View"
      subtitle={`${route.origin} to ${route.destination}`}
      tone="route"
      iconLabel="RT"
      className="route-view"
      headerMeta={<span className="type-pill">{route.transportType}</span>}
    >
      <div className="route-head">
        <h2 className="route-name">{route.name}</h2>
      </div>
      <div className="route-meta">
        <span>Corridor: {route.corridor || "N/A"}</span>
        <span>Stops: {route.stops.length}</span>
        <span>Path points: {route.polyline.coordinates.length}</span>
      </div>
      <Suspense fallback={<div className="map-placeholder skeleton-block" aria-hidden="true" />}>
        <LazyRouteMap route={route} tripCheckpoints={tripCheckpoints} />
      </Suspense>
      <h4 className="panel-section-title">Stops</h4>
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
    </PanelCard>
  );
}
