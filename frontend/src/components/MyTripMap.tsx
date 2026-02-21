import { useEffect, useMemo, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { FeatureCollection, LineString } from "geojson";
import type { TripRecordResponse } from "../types";
import "mapbox-gl/dist/mapbox-gl.css";

type MyTripMapProps = {
  trip: TripRecordResponse | null;
};

const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
const TRIP_SOURCE_ID = "mytrip-source";
const TRIP_LAYER_ID = "mytrip-layer";
const MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_KEY || "").trim();
const HAS_VALID_TOKEN =
  MAPBOX_TOKEN.length > 0 && !MAPBOX_TOKEN.includes("replace_with_mapbox_token");
const LAGOS_CENTER: [number, number] = [3.3792, 6.5244];
const EMPTY_FEATURES: FeatureCollection<LineString> = { type: "FeatureCollection", features: [] };

const toTripGeoJson = (trip: TripRecordResponse): FeatureCollection<LineString> => {
  const coordinates = trip.checkpoints.map((checkpoint) => checkpoint.coords.coordinates);
  return {
    type: "FeatureCollection",
    features:
      coordinates.length >= 2
        ? [
            {
              type: "Feature",
              properties: { tripId: trip._id },
              geometry: {
                type: "LineString",
                coordinates,
              },
            },
          ]
        : [],
  };
};

export function MyTripMap({ trip }: MyTripMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const tripGeoJson = useMemo(() => (trip ? toTripGeoJson(trip) : EMPTY_FEATURES), [trip]);
  const hasRenderableTrip = Boolean(trip && trip.checkpoints.length >= 2);

  useEffect(() => {
    if (!HAS_VALID_TOKEN || !mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: LAGOS_CENTER,
      zoom: 10.5,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    const draw = () => {
      if (!map.getSource(TRIP_SOURCE_ID)) {
        map.addSource(TRIP_SOURCE_ID, { type: "geojson", data: tripGeoJson });
        map.addLayer({
          id: TRIP_LAYER_ID,
          type: "line",
          source: TRIP_SOURCE_ID,
          layout: {
            "line-cap": "round",
            "line-join": "round",
          },
          paint: {
            "line-color": "#1B8A6B",
            "line-width": 4.4,
            "line-opacity": 0.95,
          },
        });
      } else {
        const source = map.getSource(TRIP_SOURCE_ID) as mapboxgl.GeoJSONSource;
        source.setData(tripGeoJson);
      }

      if (!hasRenderableTrip || !trip) return;
      const coords = trip.checkpoints.map((checkpoint) => checkpoint.coords.coordinates);
      const [first] = coords;
      if (!first) return;

      const bounds = coords.reduce(
        (memo, coordinate) => memo.extend(coordinate),
        new mapboxgl.LngLatBounds(first, first),
      );
      map.fitBounds(bounds, { padding: 44, duration: 650, maxZoom: 15 });
    };

    if (map.isStyleLoaded()) {
      draw();
    } else {
      map.once("load", draw);
    }
  }, [tripGeoJson, trip, hasRenderableTrip]);

  if (!HAS_VALID_TOKEN) {
    return (
      <div className="map-placeholder map-warning">
        <p>Map preview unavailable</p>
        <small>Set `VITE_MAPBOX_KEY` in `frontend/.env` to render selected trip map replay.</small>
      </div>
    );
  }

  return (
    <div className="mytrips-map-wrap">
      <div ref={mapContainerRef} className="mytrips-map-canvas" />
      {!trip && (
        <p className="muted small mytrips-map-hint">
          Select a trip card to replay its recorded checkpoint path.
        </p>
      )}
      {trip && !hasRenderableTrip && (
        <p className="muted small mytrips-map-hint">
          This trip has fewer than 2 checkpoints, so no replay line can be drawn yet.
        </p>
      )}
    </div>
  );
}
