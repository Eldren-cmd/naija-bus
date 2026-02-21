import type {
  Bbox,
  FareEstimate,
  FareReportInput,
  FareReportResponse,
  IncidentReportInput,
  IncidentReportResponse,
  RouteDetail,
  RouteSummary,
  SearchResponse,
  TrafficLevel,
  TripRecordInput,
  TripRecordResponse,
} from "../types";

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

const apiPost = async <T>(path: string, body: unknown, token?: string): Promise<T> => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token?.trim()) {
    headers.Authorization = `Bearer ${token.trim()}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

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

export const reportFare = async (
  input: FareReportInput,
  authToken: string,
): Promise<FareReportResponse> => {
  return apiPost<FareReportResponse>("/api/v1/fare/report", input, authToken);
};

export const searchRoutesAndStops = async (query: string): Promise<SearchResponse> => {
  return apiGet<SearchResponse>(`/api/v1/search?q=${encodeURIComponent(query.trim())}`);
};

export const reportIncident = async (
  input: IncidentReportInput,
  authToken: string,
): Promise<IncidentReportResponse> => {
  return apiPost<IncidentReportResponse>("/api/v1/reports", input, authToken);
};

export const getReportsByBbox = async (bbox: Bbox): Promise<IncidentReportResponse[]> => {
  const query = bbox.join(",");
  return apiGet<IncidentReportResponse[]>(`/api/v1/reports?bbox=${encodeURIComponent(query)}`);
};

export const createTripRecord = async (
  input: TripRecordInput,
  authToken: string,
): Promise<TripRecordResponse> => {
  return apiPost<TripRecordResponse>("/api/v1/trips", input, authToken);
};
