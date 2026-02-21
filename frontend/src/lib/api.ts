import type {
  AuthLoginResponse,
  AuthProfileResponse,
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
  TransportType,
  TripRecordInput,
  TripRecordResponse,
} from "../types";
import axios from "axios";
import { httpClient } from "./http";

const parseApiError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (error.response?.status) return `request failed with status ${error.response.status}`;
    if (error.message) return error.message;
  }
  return "request failed";
};

const apiGet = async <T>(path: string, token?: string): Promise<T> => {
  try {
    const headers = token?.trim() ? { Authorization: `Bearer ${token.trim()}` } : undefined;
    const response = await httpClient.get<T>(path, { headers });
    return response.data;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

const apiPost = async <T>(path: string, body: unknown, token?: string): Promise<T> => {
  try {
    const headers = token?.trim() ? { Authorization: `Bearer ${token.trim()}` } : undefined;
    const response = await httpClient.post<T>(path, body, { headers });
    return response.data;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

const apiPut = async <T>(path: string, body: unknown, token?: string): Promise<T> => {
  try {
    const headers = token?.trim() ? { Authorization: `Bearer ${token.trim()}` } : undefined;
    const response = await httpClient.put<T>(path, body, { headers });
    return response.data;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

const apiDelete = async <T>(path: string, token?: string): Promise<T> => {
  try {
    const headers = token?.trim() ? { Authorization: `Bearer ${token.trim()}` } : undefined;
    const response = await httpClient.delete<T>(path, { headers });
    return response.data;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const getRoutes = async (query?: string): Promise<RouteSummary[]> => {
  const q = query?.trim();
  const suffix = q ? `/api/v1/routes?q=${encodeURIComponent(q)}` : "/api/v1/routes";
  return apiGet<RouteSummary[]>(suffix);
};

export const getSavedRoutes = async (authToken: string): Promise<RouteSummary[]> => {
  return apiGet<RouteSummary[]>("/api/v1/routes/saved", authToken);
};

export const addSavedRoute = async (
  routeId: string,
  authToken: string,
): Promise<{ success: boolean; routeId: string; savedCount: number }> => {
  return apiPost<{ success: boolean; routeId: string; savedCount: number }>(
    "/api/v1/routes/saved",
    { routeId },
    authToken,
  );
};

export const removeSavedRoute = async (
  routeId: string,
  authToken: string,
): Promise<{ success: boolean; routeId: string; savedCount: number }> => {
  return apiDelete<{ success: boolean; routeId: string; savedCount: number }>(
    `/api/v1/routes/saved/${encodeURIComponent(routeId)}`,
    authToken,
  );
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

export const getAuthProfile = async (authToken: string): Promise<AuthProfileResponse> => {
  return apiGet<AuthProfileResponse>("/api/v1/auth/me", authToken);
};

export const getTripsByUser = async (
  userId: string,
  authToken: string,
): Promise<TripRecordResponse[]> => {
  return apiGet<TripRecordResponse[]>(
    `/api/v1/trips?userId=${encodeURIComponent(userId)}`,
    authToken,
  );
};

type LoginInput = {
  email: string;
  password: string;
};

export const loginUser = async (input: LoginInput): Promise<AuthLoginResponse> => {
  try {
    const response = await httpClient.post<AuthLoginResponse>("/api/v1/auth/login", input);
    return response.data;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
};

export const registerUser = async (input: RegisterInput): Promise<AuthLoginResponse> => {
  try {
    const response = await httpClient.post<AuthLoginResponse>("/api/v1/auth/register", input);
    return response.data;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

export const refreshSession = async (): Promise<AuthLoginResponse> => {
  try {
    const response = await httpClient.post<AuthLoginResponse>("/api/v1/auth/refresh");
    return response.data;
  } catch (error) {
    throw new Error(parseApiError(error));
  }
};

type RouteAdminUpdateInput = {
  name?: string;
  origin?: string;
  destination?: string;
  corridor?: string;
  baseFare?: number;
};

export const updateRouteAdmin = async (
  routeId: string,
  input: RouteAdminUpdateInput,
  authToken: string,
): Promise<RouteDetail> => {
  return apiPut<RouteDetail>(`/api/v1/routes/${encodeURIComponent(routeId)}`, input, authToken);
};

export const deleteRouteAdmin = async (
  routeId: string,
  authToken: string,
): Promise<{ success: boolean; deletedRouteId: string }> => {
  return apiDelete<{ success: boolean; deletedRouteId: string }>(
    `/api/v1/routes/${encodeURIComponent(routeId)}`,
    authToken,
  );
};

type RouteAdminCreateInput = {
  name: string;
  origin: string;
  destination: string;
  baseFare: number;
  polyline: {
    type: "LineString";
    coordinates: [number, number][];
  };
  corridor?: string;
  aliases?: string[];
  transportType?: TransportType;
  confidenceScore?: number;
};

export const createRouteAdmin = async (
  input: RouteAdminCreateInput,
  authToken: string,
): Promise<RouteDetail> => {
  return apiPost<RouteDetail>("/api/v1/routes", input, authToken);
};

type StopAdminCreateInput = {
  routeId: string;
  name: string;
  order: number;
  isMajor?: boolean;
  coords: {
    type: "Point";
    coordinates: [number, number];
  };
};

export const createStopAdmin = async (
  input: StopAdminCreateInput,
  authToken: string,
): Promise<{ _id: string; name: string; routeId: string; order: number }> => {
  return apiPost<{ _id: string; name: string; routeId: string; order: number }>(
    "/api/v1/stops",
    input,
    authToken,
  );
};
