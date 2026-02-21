import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { FeatureCollection, LineString, Point } from "geojson";
import type { RouteDetail } from "../types";
import "mapbox-gl/dist/mapbox-gl.css";

type RouteMapProps = {
  route: RouteDetail;
};

const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
const ROUTE_SOURCE_ID = "route-line-source";
const STOP_SOURCE_ID = "route-stop-source";
const LAGOS_CENTER: [number, number] = [3.3792, 6.5244];
const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_KEY || "").trim();
const HAS_VALID_TOKEN =
  MAPBOX_TOKEN.length > 0 && !MAPBOX_TOKEN.includes("replace_with_mapbox_token");

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

export function RouteMap({ route }: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const routeLineData = useMemo(() => toRouteFeatureCollection(route), [route]);
  const stopData = useMemo(() => toStopFeatureCollection(route), [route]);

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

  return <div ref={mapContainerRef} className="route-map-canvas" />;
}
