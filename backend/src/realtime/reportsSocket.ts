import { Server as HttpServer } from "http";
import { Namespace, Server, Socket } from "socket.io";

type Bbox = [number, number, number, number];
type PointCoords = [number, number];

type FareReportedEvent = {
  id: string;
  routeId: string;
  amount: number;
  trafficLevel: string;
  reportedBy: string;
  createdAt?: Date;
};

type ReportCreatedEvent = {
  id: string;
  routeId?: string;
  userId: string;
  type: string;
  severity: string;
  description: string;
  coords: {
    type: "Point";
    coordinates: number[];
  };
  createdAt?: Date;
};

type TripRecordedEvent = {
  id: string;
  userId: string;
  routeId?: string;
  distanceMeters: number;
  durationSeconds: number;
  checkpointsCount: number;
  startedAt: Date;
  endedAt: Date;
  createdAt?: Date;
};

type ReportsSocketState = {
  viewportBbox?: Bbox;
  routeSubscriptions?: string[];
};

type SocketAckPayload = {
  ok: boolean;
  error?: string;
  bbox?: Bbox;
  routeId?: string;
  routes?: string[];
};

type SocketAck = (payload: SocketAckPayload) => void;

let ioServer: Server | null = null;
let reportsNamespace: Namespace | null = null;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const toBbox = (values: number[]): Bbox | null => {
  if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
    return null;
  }

  const [minLng, minLat, maxLng, maxLat] = values;
  if (
    minLng >= maxLng ||
    minLat >= maxLat ||
    minLng < -180 ||
    maxLng > 180 ||
    minLat < -90 ||
    maxLat > 90
  ) {
    return null;
  }

  return [minLng, minLat, maxLng, maxLat];
};

export const parseBboxSubscription = (value: unknown): Bbox | null => {
  if (Array.isArray(value)) {
    const numbers = value.map((item) => Number(item));
    return toBbox(numbers);
  }

  if (typeof value === "string") {
    const numbers = value.split(",").map((item) => Number(item.trim()));
    return toBbox(numbers);
  }

  if (isObject(value) && "bbox" in value) {
    return parseBboxSubscription(value.bbox);
  }

  return null;
};

const isPointCoords = (value: unknown): value is PointCoords => {
  if (!Array.isArray(value) || value.length !== 2) return false;
  const [lng, lat] = value;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;
  return lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90;
};

export const isPointInsideBbox = (point: PointCoords, bbox: Bbox): boolean => {
  const [lng, lat] = point;
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
};

const parseRouteSubscription = (value: unknown): string | null => {
  if (typeof value === "string") {
    const routeId = value.trim();
    return routeId ? routeId : null;
  }
  if (isObject(value) && "routeId" in value && typeof value.routeId === "string") {
    const routeId = value.routeId.trim();
    return routeId ? routeId : null;
  }
  return null;
};

const getSocketState = (socket: Socket): ReportsSocketState =>
  socket.data as ReportsSocketState;

const handleViewportSubscribe = (socket: Socket, payload: unknown, ack?: SocketAck): void => {
  const bbox = parseBboxSubscription(payload);
  if (!bbox) {
    ack?.({ ok: false, error: "bbox must be minLng,minLat,maxLng,maxLat with valid bounds" });
    return;
  }

  const state = getSocketState(socket);
  state.viewportBbox = bbox;
  ack?.({ ok: true, bbox });
};

const handleViewportUnsubscribe = (socket: Socket, ack?: SocketAck): void => {
  const state = getSocketState(socket);
  delete state.viewportBbox;
  ack?.({ ok: true });
};

const handleRouteSubscribe = (socket: Socket, payload: unknown, ack?: SocketAck): void => {
  const routeId = parseRouteSubscription(payload);
  if (!routeId) {
    ack?.({ ok: false, error: "routeId is required for route subscription" });
    return;
  }

  const state = getSocketState(socket);
  const next = new Set(state.routeSubscriptions || []);
  next.add(routeId);
  state.routeSubscriptions = [...next];
  ack?.({ ok: true, routeId, routes: state.routeSubscriptions });
};

const handleRouteUnsubscribe = (socket: Socket, payload: unknown, ack?: SocketAck): void => {
  const routeId = parseRouteSubscription(payload);
  if (!routeId) {
    ack?.({ ok: false, error: "routeId is required for route unsubscription" });
    return;
  }

  const state = getSocketState(socket);
  const next = new Set(state.routeSubscriptions || []);
  next.delete(routeId);
  state.routeSubscriptions = [...next];
  ack?.({ ok: true, routeId, routes: state.routeSubscriptions });
};

export const initRealtimeServer = (httpServer: HttpServer, corsOrigin: string): Server => {
  ioServer = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
    },
  });

  reportsNamespace = ioServer.of("/reports");
  reportsNamespace.on("connection", (socket) => {
    socket.emit("reports:connected", {
      namespace: "/reports",
      subscriptions: {
        viewport: "emit viewport:subscribe with { bbox: 'minLng,minLat,maxLng,maxLat' }",
        route: "emit route:subscribe with { routeId }",
      },
    });

    socket.on("viewport:subscribe", (payload: unknown, ack?: SocketAck) => {
      handleViewportSubscribe(socket, payload, ack);
    });

    socket.on("viewport:unsubscribe", (ack?: SocketAck) => {
      handleViewportUnsubscribe(socket, ack);
    });

    socket.on("route:subscribe", (payload: unknown, ack?: SocketAck) => {
      handleRouteSubscribe(socket, payload, ack);
    });

    socket.on("route:unsubscribe", (payload: unknown, ack?: SocketAck) => {
      handleRouteUnsubscribe(socket, payload, ack);
    });
  });

  return ioServer;
};

export const emitFareReported = (payload: FareReportedEvent): void => {
  if (!reportsNamespace) return;

  const sockets = [...reportsNamespace.sockets.values()];
  const routeSubscribers = sockets.filter((socket) => {
    const state = getSocketState(socket);
    return (state.routeSubscriptions || []).includes(payload.routeId);
  });

  if (routeSubscribers.length === 0) {
    reportsNamespace.emit("fare:reported", payload);
    return;
  }

  for (const socket of routeSubscribers) {
    socket.emit("fare:reported", payload);
  }
};

export const emitReportCreated = (payload: ReportCreatedEvent): void => {
  if (!reportsNamespace) return;

  const coords = payload.coords?.coordinates;
  if (!isPointCoords(coords)) {
    reportsNamespace.emit("report:created", payload);
    return;
  }

  const sockets = [...reportsNamespace.sockets.values()];
  const viewportSubscribers = sockets.filter((socket) => {
    const state = getSocketState(socket);
    return Array.isArray(state.viewportBbox);
  });

  // Backward compatibility for clients that haven't subscribed yet.
  if (viewportSubscribers.length === 0) {
    reportsNamespace.emit("report:created", payload);
    return;
  }

  for (const socket of viewportSubscribers) {
    const state = getSocketState(socket);
    if (!state.viewportBbox) continue;
    if (isPointInsideBbox(coords, state.viewportBbox)) {
      socket.emit("report:created", payload);
    }
  }
};

export const emitTripRecorded = (payload: TripRecordedEvent): void => {
  if (!reportsNamespace) return;

  if (!payload.routeId) {
    reportsNamespace.emit("trip:recorded", payload);
    return;
  }

  const sockets = [...reportsNamespace.sockets.values()];
  const routeSubscribers = sockets.filter((socket) => {
    const state = getSocketState(socket);
    return (state.routeSubscriptions || []).includes(payload.routeId as string);
  });

  if (routeSubscribers.length === 0) {
    reportsNamespace.emit("trip:recorded", payload);
    return;
  }

  for (const socket of routeSubscribers) {
    socket.emit("trip:recorded", payload);
  }
};
