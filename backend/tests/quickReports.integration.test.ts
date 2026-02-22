import request from "supertest";

jest.mock("../src/realtime/reportsSocket", () => ({
  emitFareReported: jest.fn(),
  emitReportCreated: jest.fn(),
  emitTripRecorded: jest.fn(),
  initRealtimeServer: jest.fn(),
}));

jest.mock("../src/models", () => {
  const Route = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const Fare = {
    create: jest.fn(),
  };

  const Stop = {
    find: jest.fn(),
    deleteMany: jest.fn(),
  };

  const Report = {
    createIndexes: jest.fn(),
  };

  const User = {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const TripRecord = {};

  return {
    Fare,
    Report,
    Route,
    Stop,
    TripRecord,
    User,
  };
});

import { Fare, Route, User } from "../src/models";
import { emitFareReported } from "../src/realtime/reportsSocket";
import { app } from "../src/server";

const CONDUCTOR_ID = "699935ccba2963016871bba7";
const ASSIGNED_ROUTE_ID = "699935ccba2963016871bba6";
const OTHER_ROUTE_ID = "699935ccba2963016871bba8";
const VALID_CONDUCTOR_TOKEN = "quick-conductor-token-123";

const mockConductorLookup = (
  conductor:
    | {
        _id: string;
        fullName: string;
        championRoutes: string[];
      }
    | null,
) => {
  const lean = jest.fn().mockResolvedValue(conductor);
  const select = jest.fn().mockReturnValue({ lean });
  (User.findOne as unknown as jest.Mock).mockReturnValue({ select });
};

describe("quick report endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when bootstrap token query is missing", async () => {
    const response = await request(app).get("/api/v1/reports/quick/bootstrap");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("token query is required");
  });

  it("returns 401 when bootstrap token is invalid", async () => {
    mockConductorLookup(null);

    const response = await request(app).get("/api/v1/reports/quick/bootstrap?token=bad-token");

    expect(response.status).toBe(401);
    expect(response.body.error).toBe("invalid conductor token");
  });

  it("returns 200 with conductor and assigned routes for valid token", async () => {
    mockConductorLookup({
      _id: CONDUCTOR_ID,
      fullName: "Ojota Conductor",
      championRoutes: [ASSIGNED_ROUTE_ID],
    });

    const lean = jest.fn().mockResolvedValue([
      {
        _id: ASSIGNED_ROUTE_ID,
        name: "Ojota -> CMS",
        origin: "Ojota",
        destination: "CMS",
        corridor: "Ikorodu Road",
        transportType: "danfo",
        baseFare: 300,
      },
    ]);
    const select = jest.fn().mockReturnValue({ lean });
    (Route.find as unknown as jest.Mock).mockReturnValue({ select });

    const response = await request(app).get(
      `/api/v1/reports/quick/bootstrap?token=${VALID_CONDUCTOR_TOKEN}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.conductor).toEqual({
      userId: CONDUCTOR_ID,
      fullName: "Ojota Conductor",
    });
    expect(response.body.assignedRoutes).toEqual([
      {
        routeId: ASSIGNED_ROUTE_ID,
        name: "Ojota -> CMS",
        origin: "Ojota",
        destination: "CMS",
        corridor: "Ikorodu Road",
        transportType: "danfo",
        baseFare: 300,
      },
    ]);
  });

  it("supports bootstrap alias route /reports/quick/bootstrap", async () => {
    mockConductorLookup({
      _id: CONDUCTOR_ID,
      fullName: "Ojota Conductor",
      championRoutes: [ASSIGNED_ROUTE_ID],
    });

    const lean = jest.fn().mockResolvedValue([
      {
        _id: ASSIGNED_ROUTE_ID,
        name: "Ojota -> CMS",
        origin: "Ojota",
        destination: "CMS",
        corridor: "Ikorodu Road",
        transportType: "danfo",
        baseFare: 300,
      },
    ]);
    const select = jest.fn().mockReturnValue({ lean });
    (Route.find as unknown as jest.Mock).mockReturnValue({ select });

    const response = await request(app).get(
      `/reports/quick/bootstrap?token=${VALID_CONDUCTOR_TOKEN}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.conductor.userId).toBe(CONDUCTOR_ID);
    expect(response.body.assignedRoutes).toHaveLength(1);
  });

  it("returns 403 when submitting quick fare report for unassigned route", async () => {
    mockConductorLookup({
      _id: CONDUCTOR_ID,
      fullName: "Ojota Conductor",
      championRoutes: [ASSIGNED_ROUTE_ID],
    });

    const response = await request(app).post("/api/v1/reports/quick").send({
      token: VALID_CONDUCTOR_TOKEN,
      routeId: OTHER_ROUTE_ID,
      reportedFare: 450,
      trafficLevel: "high",
      notes: "congestion around Mile 12",
    });

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("route is not assigned to this conductor");
    expect(Fare.create).not.toHaveBeenCalled();
  });

  it("returns 201 and saves quick fare report for assigned route", async () => {
    mockConductorLookup({
      _id: CONDUCTOR_ID,
      fullName: "Ojota Conductor",
      championRoutes: [ASSIGNED_ROUTE_ID],
    });

    const routeLean = jest.fn().mockResolvedValue({ _id: ASSIGNED_ROUTE_ID });
    const routeSelect = jest.fn().mockReturnValue({ lean: routeLean });
    (Route.findOne as unknown as jest.Mock).mockReturnValue({ select: routeSelect });

    (Fare.create as unknown as jest.Mock).mockResolvedValue({
      _id: "quick-fare-1",
      routeId: ASSIGNED_ROUTE_ID,
      amount: 500,
      source: "user_report",
      trafficLevel: "high",
      reportedBy: CONDUCTOR_ID,
      notes: "peak period",
      createdAt: new Date("2026-02-22T10:00:00.000Z"),
    });

    const response = await request(app).post("/api/v1/reports/quick").send({
      token: VALID_CONDUCTOR_TOKEN,
      routeId: ASSIGNED_ROUTE_ID,
      reportedFare: 500,
      trafficLevel: "high",
      notes: "peak period",
    });

    expect(response.status).toBe(201);
    expect(Fare.create).toHaveBeenCalledWith({
      routeId: ASSIGNED_ROUTE_ID,
      amount: 500,
      source: "user_report",
      trafficLevel: "high",
      reportedBy: CONDUCTOR_ID,
      notes: "peak period",
    });
    expect(emitFareReported).toHaveBeenCalledTimes(1);
    expect(response.body.routeId).toBe(ASSIGNED_ROUTE_ID);
  });

  it("supports quick submit alias route /reports/quick", async () => {
    mockConductorLookup({
      _id: CONDUCTOR_ID,
      fullName: "Ojota Conductor",
      championRoutes: [ASSIGNED_ROUTE_ID],
    });

    const routeLean = jest.fn().mockResolvedValue({ _id: ASSIGNED_ROUTE_ID });
    const routeSelect = jest.fn().mockReturnValue({ lean: routeLean });
    (Route.findOne as unknown as jest.Mock).mockReturnValue({ select: routeSelect });

    (Fare.create as unknown as jest.Mock).mockResolvedValue({
      _id: "quick-fare-2",
      routeId: ASSIGNED_ROUTE_ID,
      amount: 450,
      source: "user_report",
      trafficLevel: "medium",
      reportedBy: CONDUCTOR_ID,
      notes: "",
      createdAt: new Date("2026-02-22T10:01:00.000Z"),
    });

    const response = await request(app).post("/reports/quick").send({
      token: VALID_CONDUCTOR_TOKEN,
      routeId: ASSIGNED_ROUTE_ID,
      reportedFare: 450,
      trafficLevel: "medium",
    });

    expect(response.status).toBe(201);
    expect(response.body.routeId).toBe(ASSIGNED_ROUTE_ID);
    expect(Fare.create).toHaveBeenCalledTimes(1);
  });
});
