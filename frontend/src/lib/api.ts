import type { FareEstimate, RouteDetail, RouteSummary, TrafficLevel } from "../types";

const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:5000").replace(/\/+$/, "");

const parseErrorMessage = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as { error?: string };
    if (data.error) return data.error;
  } catch {
    // no-op
  }
  return `request failed with status ${response.status}`;
};

const apiGet = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return (await response.json()) as T;
};

export const getRoutes = async (query?: string): Promise<RouteSummary[]> => {
  const q = query?.trim();
  const suffix = q ? `/api/v1/routes?q=${encodeURIComponent(q)}` : "/api/v1/routes";
  return apiGet<RouteSummary[]>(suffix);
};

export const getRouteById = async (routeId: string): Promise<RouteDetail> => {
  return apiGet<RouteDetail>(`/api/v1/routes/${encodeURIComponent(routeId)}`);
};

type GetFareEstimateInput = {
  routeId: string;
  time?: string;
  trafficLevel?: TrafficLevel;
};

export const getFareEstimate = async (input: GetFareEstimateInput): Promise<FareEstimate> => {
  const params = new URLSearchParams();
  params.set("routeId", input.routeId);
  if (input.time) params.set("time", input.time);
  if (input.trafficLevel) params.set("trafficLevel", input.trafficLevel);
  return apiGet<FareEstimate>(`/api/v1/fare/estimate?${params.toString()}`);
};
