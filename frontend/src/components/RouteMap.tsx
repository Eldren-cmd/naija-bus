import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { FeatureCollection, LineString, Point } from "geojson";
import { io, type Socket } from "socket.io-client";
import { getReportsByBbox } from "../lib/api";
import type { Bbox, ReportSeverity, ReportType, RouteDetail, ViewportReport } from "../types";
import "mapbox-gl/dist/mapbox-gl.css";

type RouteMapProps = {
  route: RouteDetail;
};

const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
const ROUTE_SOURCE_ID = "route-line-source";
const STOP_SOURCE_ID = "route-stop-source";
const REPORT_SOURCE_ID = "route-report-source";
const REPORT_LAYER_ID = "route-report-layer";
const LAGOS_CENTER: [number, number] = [3.3792, 6.5244];
const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_KEY || "").trim();
const HAS_VALID_TOKEN =
  MAPBOX_TOKEN.length > 0 && !MAPBOX_TOKEN.includes("replace_with_mapbox_token");
const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:5000").replace(/\/+$/, "");
const SOCKET_BASE = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return API_BASE;
  }
})();

const REPORT_TYPES: ReportType[] = ["traffic", "police", "roadblock", "accident", "hazard", "other"];
const REPORT_SEVERITIES: ReportSeverity[] = ["low", "medium", "high"];
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

type RealtimeStatus = "connecting" | "connected" | "disconnected";
type ReportCreatedEvent = {
  id: string;
  routeId?: string;
  userId: string;
  type: ReportType;
  severity: ReportSeverity;
  description?: string;
  coords: {
    type: "Point";
    coordinates: number[];
  };
  createdAt?: string;
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

const isPoint = (value: unknown): value is [number, number] => {
  if (!Array.isArray(value) || value.length !== 2) return false;
  const [lng, lat] = value;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
};

const isReportType = (value: unknown): value is ReportType => {
  return typeof value === "string" && REPORT_TYPES.includes(value as ReportType);
};

const isReportSeverity = (value: unknown): value is ReportSeverity => {
  return typeof value === "string" && REPORT_SEVERITIES.includes(value as ReportSeverity);
};

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

const toRouteBbox = (route: RouteDetail): Bbox | null => {
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

const isPointInsideBbox = (point: [number, number], bbox: Bbox): boolean => {
  const [lng, lat] = point;
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
};

const normalizeRealtimeReport = (event: unknown): ViewportReport | null => {
  if (typeof event !== "object" || event === null) return null;
  const payload = event as Partial<ReportCreatedEvent>;

  if (typeof payload.id !== "string" || !payload.id.trim()) return null;
  if (typeof payload.userId !== "string" || !payload.userId.trim()) return null;
  if (!isReportType(payload.type)) return null;
  if (!isReportSeverity(payload.severity)) return null;
  if (!payload.coords || payload.coords.type !== "Point" || !isPoint(payload.coords.coordinates)) {
    return null;
  }

  const createdAt =
    typeof payload.createdAt === "string" && payload.createdAt.trim()
      ? payload.createdAt
      : new Date().toISOString();

  return {
    _id: payload.id,
    routeId: typeof payload.routeId === "string" ? payload.routeId : undefined,
    userId: payload.userId,
    type: payload.type,
    severity: payload.severity,
    description: typeof payload.description === "string" ? payload.description : "",
    coords: {
      type: "Point",
      coordinates: payload.coords.coordinates,
    },
    isActive: true,
    createdAt,
    updatedAt: createdAt,
  };
};

const upsertReport = (current: ViewportReport[], incoming: ViewportReport): ViewportReport[] => {
  const existingIndex = current.findIndex((item) => item._id === incoming._id);
  if (existingIndex === -1) {
    return [incoming, ...current];
  }

  return current.map((item, index) => (index === existingIndex ? incoming : item));
};

export function RouteMap({ route }: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [reports, setReports] = useState<ViewportReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>("disconnected");

  const routeLineData = useMemo(() => toRouteFeatureCollection(route), [route]);
  const stopData = useMemo(() => toStopFeatureCollection(route), [route]);
  const routeBbox = useMemo(() => toRouteBbox(route), [route]);
  const routeBboxKey = useMemo(() => (routeBbox ? routeBbox.join(",") : ""), [routeBbox]);
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
    if (!routeBbox) {
      setReports([]);
      return;
    }

    const loadReports = async () => {
      setReportsLoading(true);
      setReportsError(null);

      try {
        const data = await getReportsByBbox(routeBbox);
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
  }, [routeBbox]);

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

      if (!route.polyline.coordinates.length) return;
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
  }, [routeLineData, route, stopData]);

  useEffect(() => {
    if (!HAS_VALID_TOKEN || !mapRef.current) return;
    const map = mapRef.current;

    const drawReports = () => {
      if (!map.getSource(REPORT_SOURCE_ID)) {
        map.addSource(REPORT_SOURCE_ID, { type: "geojson", data: reportData });
        map.addLayer({
          id: REPORT_LAYER_ID,
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

        map.on("mouseenter", REPORT_LAYER_ID, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", REPORT_LAYER_ID, () => {
          map.getCanvas().style.cursor = "";
        });
        map.on("click", REPORT_LAYER_ID, (event) => {
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
    };

    if (map.isStyleLoaded()) {
      drawReports();
    } else {
      map.once("load", drawReports);
    }
  }, [reportData]);

  useEffect(() => {
    if (!routeBbox || !HAS_VALID_TOKEN) {
      setRealtimeStatus("disconnected");
      return;
    }

    let active = true;
    let socket: Socket | null = null;
    setRealtimeStatus("connecting");

    socket = io(`${SOCKET_BASE}/reports`, {
      transports: ["websocket", "polling"],
      timeout: 10000,
    });

    socket.on("connect", () => {
      if (!active || !socket) return;
      setRealtimeStatus("connected");
      socket.emit("viewport:subscribe", { bbox: routeBboxKey });
      socket.emit("route:subscribe", { routeId: route._id });
    });

    socket.on("report:created", (event: unknown) => {
      const incoming = normalizeRealtimeReport(event);
      if (!incoming) return;
      if (!isPointInsideBbox(incoming.coords.coordinates, routeBbox)) return;
      setReports((current) => upsertReport(current, incoming));
    });

    socket.on("connect_error", () => {
      if (!active) return;
      setRealtimeStatus("disconnected");
    });

    socket.on("disconnect", () => {
      if (!active) return;
      setRealtimeStatus("disconnected");
    });

    return () => {
      active = false;
      if (!socket) return;
      socket.emit("route:unsubscribe", { routeId: route._id });
      socket.emit("viewport:unsubscribe");
      socket.disconnect();
    };
  }, [route._id, routeBbox, routeBboxKey]);

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
      <p className="muted map-report-meta">
        Realtime socket:{" "}
        {realtimeStatus === "connected"
          ? "connected"
          : realtimeStatus === "connecting"
            ? "connecting..."
            : "disconnected"}
      </p>
      {reportsError && <p className="error-text map-report-meta">{reportsError}</p>}
    </div>
  );
}
