import bcrypt from "bcryptjs";
import request from "supertest";

jest.mock("../src/models", () => {
  const User = {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  };

  const Route = {
    find: jest.fn(),
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    create: jest.fn(),
  };

  const Stop = {
    find: jest.fn(),
    deleteMany: jest.fn(),
  };

  const Report = {
    createIndexes: jest.fn(),
  };

  const Fare = {};
  const TripRecord = {};

  return {
    User,
    Route,
    Stop,
    Report,
    Fare,
    TripRecord,
  };
});

jest.mock("../src/services/fareService", () => {
  class FareServiceError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
      super(message);
      this.name = "FareServiceError";
      this.statusCode = statusCode;
    }
  }

  return {
    FareServiceError,
    estimateRouteFare: jest.fn(),
  };
});

import { Route, User } from "../src/models";
import { app } from "../src/server";
import { estimateRouteFare, FareServiceError } from "../src/services/fareService";

describe("Phase 2 integration endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/v1/auth/login returns JWT for valid credentials", async () => {
    const password = "password123";
    const passwordHash = await bcrypt.hash(password, 12);
    const save = jest.fn().mockResolvedValue(undefined);

    (User.findOne as unknown as jest.Mock).mockResolvedValue({
      _id: "u1",
      fullName: "Test Rider",
      email: "rider@example.com",
      role: "user",
      passwordHash,
      save,
    });

    const response = await request(app).post("/api/v1/auth/login").send({
      email: "rider@example.com",
      password,
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user.email).toBe("rider@example.com");
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("GET /api/v1/routes returns route list", async () => {
    const mockRoutes = [
      {
        _id: "r1",
        name: "Ojota -> CMS",
        origin: "Ojota",
        destination: "CMS",
      },
    ];

    const lean = jest.fn().mockResolvedValue(mockRoutes);
    const sort = jest.fn().mockReturnValue({ lean });
    (Route.find as unknown as jest.Mock).mockReturnValue({ sort });

    const response = await request(app).get("/api/v1/routes");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].name).toBe("Ojota -> CMS");
    expect(Route.find).toHaveBeenCalledWith({ isActive: true });
  });

  it("GET /api/v1/fare/estimate returns fare breakdown", async () => {
    const mockEstimate = {
      routeId: "699935ceba2963016871bbaa",
      routeName: "Ojota -> CMS",
      origin: "Ojota",
      destination: "CMS",
      currency: "NGN",
      confidence: 0.74,
      trafficLevel: "medium",
      timeBand: "rush_hour",
      baseFare: 700,
      trafficMultiplier: 1,
      timeMultiplier: 1.15,
      estimatedFare: 810,
      computedAt: "2026-02-21T10:00:00.000Z",
    };

    (estimateRouteFare as unknown as jest.Mock).mockResolvedValue(mockEstimate);

    const response = await request(app)
      .get("/api/v1/fare/estimate")
      .query({ routeId: "699935ceba2963016871bbaa", time: "08:30" });

    expect(response.status).toBe(200);
    expect(response.body.estimatedFare).toBe(810);
    expect(response.body.timeBand).toBe("rush_hour");
    expect(estimateRouteFare).toHaveBeenCalledWith({
      routeId: "699935ceba2963016871bbaa",
      time: "08:30",
      trafficLevel: undefined,
    });
  });

  it("GET /api/v1/fare/estimate returns 404 for unknown routeId", async () => {
    (estimateRouteFare as unknown as jest.Mock).mockRejectedValue(
      new FareServiceError("route not found", 404),
    );

    const response = await request(app)
      .get("/api/v1/fare/estimate")
      .query({ routeId: "507f1f77bcf86cd799439011", time: "08:30" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("route not found");
  });
});
