const RAW_MAPBOX_TOKEN = (import.meta.env.VITE_MAPBOX_KEY || "").trim();

const IS_PLACEHOLDER =
  RAW_MAPBOX_TOKEN.length === 0 || RAW_MAPBOX_TOKEN.includes("replace_with_mapbox_token");
const IS_PUBLIC_TOKEN = RAW_MAPBOX_TOKEN.startsWith("pk.");

export const MAPBOX_TOKEN = RAW_MAPBOX_TOKEN;
export const HAS_VALID_MAPBOX_TOKEN = !IS_PLACEHOLDER && IS_PUBLIC_TOKEN;
export const MAPBOX_TOKEN_HELP = !RAW_MAPBOX_TOKEN
  ? "Set `VITE_MAPBOX_KEY` in `.env.local` to render map previews."
  : !IS_PUBLIC_TOKEN
    ? "Use a public Mapbox token (`pk...`) in frontend; never place secret `sk...` tokens in client code."
    : "Set `VITE_MAPBOX_KEY` in `.env.local` to render map previews.";

export const MAPBOX_STYLE = "mapbox://styles/mapbox/navigation-night-v1";
export const LAGOS_CENTER: [number, number] = [3.3792, 6.5244];
export const LAGOS_MAX_BOUNDS: [[number, number], [number, number]] = [
  [2.7, 6.1],
  [4.3, 6.9],
];
export const MAP_MIN_ZOOM = 9;
export const MAP_MAX_ZOOM = 15.5;
