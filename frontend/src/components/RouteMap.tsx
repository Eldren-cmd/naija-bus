import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { FeatureCollection, LineString, Point } from "geojson";
import { getReportsByBbox } from "../lib/api";
import type { ReportSeverity, RouteDetail, ViewportReport } from "../types";
import "mapbox-gl/dist/mapbox-gl.css";

type RouteMapProps = {
  route: RouteDetail;
};

const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
const ROUTE_SOURCE_ID = "route-line-source";
const STOP_SOURCE_ID = "route-stop-source";
const REPORT_SOURCE_ID = "route-report-source";
const LAGOS_CENTER: [number, number] = [3.3792, 6.5244];
const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_KEY || "").trim();
const HAS_VALID_TOKEN =
  MAPBOX_TOKEN.length > 0 && !MAPBOX_TOKEN.includes("replace_with_mapbox_token");
const SEVERITY_COLORS: Record<ReportSeverity, string> = {
  low: "#2C9C6A",
  medium: "#E08C2C",
  high: "#D43D2D",
};
const SEVERITY_RADIUS: Record<ReportSeverity, number> = {
  low: 5.6,
  medium: 6.8,
  high: 8.4,
};

const toRouteFeatureCollection = (route: RouteDetail): FeatureCollection<LineString> => ({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { routeName: route.name },
      geometry: {
        type: "LineString",
        coordinates: route.polyline.coordinates,
      },
    },
  ],
});

const toStopFeatureCollection = (route: RouteDetail): FeatureCollection<Point> => ({
  type: "FeatureCollection",
  features: route.stops.map((stop) => ({
    type: "Feature",
    properties: { name: stop.name, order: stop.order, isMajor: stop.isMajor },
    geometry: {
      type: "Point",
      coordinates: stop.coords.coordinates,
    },
  })),
});

const toReportFeatureCollection = (reports: ViewportReport[]): FeatureCollection<Point> => ({
  type: "FeatureCollection",
  features: reports.map((report) => ({
    type: "Feature",
    properties: {
      reportId: report._id,
      type: report.type,
      severity: report.severity,
      severityColor: SEVERITY_COLORS[report.severity],
      severityRadius: SEVERITY_RADIUS[report.severity],
      description: report.description || "",
    },
    geometry: {
      type: "Point",
      coordinates: report.coords.coordinates,
    },
  })),
});

const toRouteBbox = (route: RouteDetail): [number, number, number, number] | null => {
  const [firstPoint] = route.polyline.coordinates;
  if (!firstPoint) return null;

  let minLng = firstPoint[0];
  let minLat = firstPoint[1];
  let maxLng = firstPoint[0];
  let maxLat = firstPoint[1];

  for (const [lng, lat] of route.polyline.coordinates) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }

  return [minLng, minLat, maxLng, maxLat];
};

export function RouteMap({ route }: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [reports, setReports] = useState<ViewportReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);

  const routeLineData = useMemo(() => toRouteFeatureCollection(route), [route]);
  const stopData = useMemo(() => toStopFeatureCollection(route), [route]);
  const reportData = useMemo(() => toReportFeatureCollection(reports), [reports]);

  useEffect(() => {
    if (!HAS_VALID_TOKEN || !mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: LAGOS_CENTER,
      zoom: 11.5,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const bbox = toRouteBbox(route);
    if (!bbox) {
      setReports([]);
      return;
    }

    const loadReports = async () => {
      setReportsLoading(true);
      setReportsError(null);

      try {
        const data = await getReportsByBbox(bbox);
        if (!cancelled) {
          setReports(data);
        }
      } catch (requestError) {
        if (cancelled) return;
        const message = requestError instanceof Error ? requestError.message : "Failed to load incident reports";
        setReports([]);
        setReportsError(message);
      } finally {
        if (!cancelled) setReportsLoading(false);
      }
    };

    void loadReports();
    return () => {
      cancelled = true;
    };
  }, [route]);

  useEffect(() => {
    if (!HAS_VALID_TOKEN || !mapRef.current) return;
    const map = mapRef.current;

    const draw = () => {
      if (!map.getSource(ROUTE_SOURCE_ID)) {
        map.addSource(ROUTE_SOURCE_ID, { type: "geojson", data: routeLineData });
        map.addLayer({
          id: "route-line-layer",
          type: "line",
          source: ROUTE_SOURCE_ID,
          paint: {
            "line-color": "#CC5500",
            "line-width": 5,
            "line-opacity": 0.95,
          },
        });
      } else {
        const source = map.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource;
        source.setData(routeLineData);
      }

      if (!map.getSource(STOP_SOURCE_ID)) {
        map.addSource(STOP_SOURCE_ID, { type: "geojson", data: stopData });
        map.addLayer({
          id: "route-stop-layer",
          type: "circle",
          source: STOP_SOURCE_ID,
          paint: {
            "circle-radius": 5,
            "circle-color": "#0D1B2A",
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "#FFFFFF",
          },
        });
      } else {
        const source = map.getSource(STOP_SOURCE_ID) as mapboxgl.GeoJSONSource;
        source.setData(stopData);
      }

      if (!map.getSource(REPORT_SOURCE_ID)) {
        map.addSource(REPORT_SOURCE_ID, { type: "geojson", data: reportData });
        map.addLayer({
          id: "route-report-layer",
          type: "circle",
          source: REPORT_SOURCE_ID,
          paint: {
            "circle-color": ["get", "severityColor"] as mapboxgl.Expression,
            "circle-radius": ["get", "severityRadius"] as mapboxgl.Expression,
            "circle-stroke-width": 1.35,
            "circle-stroke-color": "#FFFFFF",
            "circle-opacity": 0.93,
          },
        });

        map.on("mouseenter", "route-report-layer", () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", "route-report-layer", () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("click", "route-report-layer", (event) => {
          const [feature] = event.features ?? [];
          if (!feature || feature.geometry.type !== "Point") return;
          const geometry = feature.geometry as Point;
          const coordinates = geometry.coordinates as [number, number];
          const properties = (feature.properties as Record<string, unknown> | undefined) ?? {};
          const reportType = typeof properties.type === "string" ? properties.type : "report";
          const severity = typeof properties.severity === "string" ? properties.severity : "medium";
          const description =
            typeof properties.description === "string" ? properties.description.trim() : "";
          const summary = description
            ? `${reportType} (${severity}) - ${description}`
            : `${reportType} (${severity})`;

          new mapboxgl.Popup({ offset: 12 }).setLngLat(coordinates).setText(summary).addTo(map);
        });
      } else {
        const source = map.getSource(REPORT_SOURCE_ID) as mapboxgl.GeoJSONSource;
        source.setData(reportData);
      }

      const firstPoint = route.polyline.coordinates[0];
      if (!firstPoint) return;
      const bounds = route.polyline.coordinates.reduce(
        (memo, coord) => memo.extend(coord),
        new mapboxgl.LngLatBounds(firstPoint, firstPoint),
      );
      map.fitBounds(bounds, { padding: 44, duration: 700, maxZoom: 14 });
    };

    if (map.isStyleLoaded()) {
      draw();
    } else {
      map.once("load", draw);
    }
  }, [routeLineData, route, stopData, reportData]);

  if (!HAS_VALID_TOKEN) {
    return (
      <div className="map-placeholder map-warning">
        <p>Map preview unavailable</p>
        <small>
          Set `VITE_MAPBOX_KEY` in `frontend/.env` to render the live map polyline.
        </small>
      </div>
    );
  }

  return (
    <div className="route-map-wrap">
      <div ref={mapContainerRef} className="route-map-canvas" />
      <div className="map-report-legend">
        <span>Live reports:</span>
        <span className="legend-item">
          <i className="report-dot report-dot-high" />
          High
        </span>
        <span className="legend-item">
          <i className="report-dot report-dot-medium" />
          Medium
        </span>
        <span className="legend-item">
          <i className="report-dot report-dot-low" />
          Low
        </span>
      </div>
      <p className="muted map-report-meta">
        {reportsLoading ? "Loading live reports..." : `${reports.length} active reports in this route area.`}
      </p>
      {reportsError && <p className="error-text map-report-meta">{reportsError}</p>}
    </div>
  );
}
