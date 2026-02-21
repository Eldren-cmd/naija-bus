import request from "supertest";
import { signAccessToken } from "../src/lib/auth";

jest.mock("../src/realtime/reportsSocket", () => ({
  emitFareReported: jest.fn(),
  emitReportCreated: jest.fn(),
  initRealtimeServer: jest.fn(),
}));

jest.mock("../src/models", () => {
  const Route = {
    findOne: jest.fn(),
  };

  const Report = {
    create: jest.fn(),
    find: jest.fn(),
    createIndexes: jest.fn(),
  };

  const Fare = {
    create: jest.fn(),
  };

  const Stop = {
    find: jest.fn(),
    deleteMany: jest.fn(),
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

import { Report, Route, User } from "../src/models";
import { emitReportCreated } from "../src/realtime/reportsSocket";
import { app } from "../src/server";

const createUserToken = (): string =>
  signAccessToken({
    sub: "699935ccba2963016871bba6",
    email: "rider@example.com",
    role: "user",
  });

const mockAuthenticatedUser = () => {
  const lean = jest.fn().mockResolvedValue({
    _id: "699935ccba2963016871bba6",
    email: "rider@example.com",
    role: "user",
    isActive: true,
  });
  const select = jest.fn().mockReturnValue({ lean });
  (User.findById as unknown as jest.Mock).mockReturnValue({ select });
};

describe("incident reports endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when auth header is missing", async () => {
    const response = await request(app).post("/api/v1/reports").send({
      type: "traffic",
      severity: "high",
      coords: { type: "Point", coordinates: [3.37, 6.52] },
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 when bbox is missing on GET /reports", async () => {
    const response = await request(app).get("/api/v1/reports");

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("bbox query is required");
  });

  it("returns 400 for invalid bbox on GET /reports", async () => {
    const response = await request(app).get("/api/v1/reports?bbox=invalid");

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("bbox must be");
  });

  it("returns active reports for a valid viewport bbox", async () => {
    const lean = jest.fn().mockResolvedValue([
      {
        _id: "rep-viewport-1",
        type: "traffic",
        severity: "high",
        coords: { type: "Point", coordinates: [3.37, 6.52] },
        isActive: true,
      },
    ]);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    (Report.find as unknown as jest.Mock).mockReturnValue({ sort });

    const response = await request(app).get("/api/v1/reports?bbox=3.2,6.4,3.5,6.7");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(Report.find).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
        coords: expect.objectContaining({
          $geoWithin: expect.any(Object),
        }),
      }),
    );
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
    expect(limit).toHaveBeenCalledWith(200);
  });

  it("returns 400 for invalid payload", async () => {
    mockAuthenticatedUser();

    const response = await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${createUserToken()}`)
      .send({
        type: "traffic",
        severity: "high",
        coords: { type: "Point", coordinates: [3.37] },
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual(expect.any(String));
  });

  it("returns 404 when routeId is provided but not found", async () => {
    mockAuthenticatedUser();
    const routeId = "699935ccba2963016871bba6";
    const lean = jest.fn().mockResolvedValue(null);
    const select = jest.fn().mockReturnValue({ lean });
    (Route.findOne as unknown as jest.Mock).mockReturnValue({ select });

    const response = await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${createUserToken()}`)
      .send({
        routeId,
        type: "traffic",
        severity: "medium",
        coords: { type: "Point", coordinates: [3.37, 6.52] },
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("route not found");
  });

  it("returns 201 and saves report for valid payload", async () => {
    mockAuthenticatedUser();
    const routeId = "699935ccba2963016871bba6";
    const lean = jest.fn().mockResolvedValue({ _id: routeId });
    const select = jest.fn().mockReturnValue({ lean });
    (Route.findOne as unknown as jest.Mock).mockReturnValue({ select });

    (Report.create as unknown as jest.Mock).mockResolvedValue({
      _id: "rep-1",
      routeId,
      userId: "699935ccba2963016871bba6",
      type: "traffic",
      severity: "high",
      description: "Heavy at Ojodu",
      coords: { type: "Point", coordinates: [3.37, 6.52] },
      isActive: true,
    });

    const response = await request(app)
      .post("/api/v1/reports")
      .set("Authorization", `Bearer ${createUserToken()}`)
      .send({
        routeId,
        type: "traffic",
        severity: "high",
        description: "Heavy at Ojodu",
        coords: { type: "Point", coordinates: [3.37, 6.52] },
      });

    expect(response.status).toBe(201);
    expect(response.body.type).toBe("traffic");
    expect(Report.create).toHaveBeenCalledWith({
      routeId,
      userId: "699935ccba2963016871bba6",
      type: "traffic",
      severity: "high",
      description: "Heavy at Ojodu",
      coords: { type: "Point", coordinates: [3.37, 6.52] },
      isActive: true,
    });
    expect(emitReportCreated).toHaveBeenCalledTimes(1);
    expect(emitReportCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        routeId,
        type: "traffic",
        severity: "high",
      }),
    );
  });
});
