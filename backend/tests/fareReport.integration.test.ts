import request from "supertest";
import { signAccessToken } from "../src/lib/auth";

jest.mock("../src/realtime/reportsSocket", () => ({
  emitFareReported: jest.fn(),
  emitReportCreated: jest.fn(),
  emitTripRecorded: jest.fn(),
  initRealtimeServer: jest.fn(),
}));

jest.mock("../src/models", () => {
  const Route = {
    findOne: jest.fn(),
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

describe("fare report endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when auth header is missing", async () => {
    const response = await request(app).post("/api/v1/fare/report").send({
      routeId: "699935ccba2963016871bba6",
      reportedFare: 300,
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid payload", async () => {
    mockAuthenticatedUser();

    const response = await request(app)
      .post("/api/v1/fare/report")
      .set("Authorization", `Bearer ${createUserToken()}`)
      .send({
        routeId: "bad-id",
        reportedFare: -10,
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual(expect.any(String));
  });

  it("returns 201 and saves report for valid payload", async () => {
    mockAuthenticatedUser();

    const routeId = "699935ccba2963016871bba6";
    const lean = jest.fn().mockResolvedValue({ _id: routeId });
    const select = jest.fn().mockReturnValue({ lean });
    (Route.findOne as unknown as jest.Mock).mockReturnValue({ select });

    (Fare.create as unknown as jest.Mock).mockResolvedValue({
      _id: "f1",
      routeId,
      amount: 300,
      source: "user_report",
      trafficLevel: "high",
      reportedBy: "699935ccba2963016871bba6",
      notes: "rush hour",
    });

    const response = await request(app)
      .post("/api/v1/fare/report")
      .set("Authorization", `Bearer ${createUserToken()}`)
      .send({
        routeId,
        reportedFare: 300,
        trafficLevel: "high",
        notes: "rush hour",
      });

    expect(response.status).toBe(201);
    expect(response.body.amount).toBe(300);
    expect(Fare.create).toHaveBeenCalledWith({
      routeId,
      amount: 300,
      source: "user_report",
      trafficLevel: "high",
      reportedBy: "699935ccba2963016871bba6",
      notes: "rush hour",
    });
    expect(emitFareReported).toHaveBeenCalledTimes(1);
    expect(emitFareReported).toHaveBeenCalledWith(
      expect.objectContaining({
        routeId,
        amount: 300,
        trafficLevel: "high",
      }),
    );
  });
});
