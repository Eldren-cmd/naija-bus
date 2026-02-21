import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:5000").replace(/\/+$/, "");

let accessToken: string | null = null;
let refreshHandler: null | (() => Promise<string | null>) = null;
let refreshPromise: Promise<string | null> | null = null;

type RetriableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export const setHttpAccessToken = (token: string | null) => {
  const normalized = token?.trim();
  accessToken = normalized ? normalized : null;
};

export const setHttpRefreshHandler = (handler: null | (() => Promise<string | null>)) => {
  refreshHandler = handler;
};

export const httpClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

httpClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;
    const status = error.response?.status;
    const requestUrl = originalRequest?.url || "";
    const isRefreshRequest = requestUrl.includes("/auth/refresh");

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isRefreshRequest &&
      refreshHandler
    ) {
      originalRequest._retry = true;
      refreshPromise =
        refreshPromise ||
        refreshHandler().finally(() => {
          refreshPromise = null;
        });

      const nextToken = await refreshPromise;
      if (nextToken) {
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${nextToken}`;
        return httpClient(originalRequest);
      }
    }

    return Promise.reject(error);
  },
);
