import { Server as HttpServer } from "http";
import { Namespace, Server } from "socket.io";

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

let ioServer: Server | null = null;
let reportsNamespace: Namespace | null = null;

export const initRealtimeServer = (httpServer: HttpServer, corsOrigin: string): Server => {
  ioServer = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"],
    },
  });

  reportsNamespace = ioServer.of("/reports");
  reportsNamespace.on("connection", (socket) => {
    socket.emit("reports:connected", { namespace: "/reports" });
  });

  return ioServer;
};

export const emitFareReported = (payload: FareReportedEvent): void => {
  if (!reportsNamespace) return;
  reportsNamespace.emit("fare:reported", payload);
};

export const emitReportCreated = (payload: ReportCreatedEvent): void => {
  if (!reportsNamespace) return;
  reportsNamespace.emit("report:created", payload);
};
