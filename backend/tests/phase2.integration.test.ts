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
    create: jest.fn(),
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

import { Route, Stop, User } from "../src/models";
import { app } from "../src/server";
import { estimateRouteFare, FareServiceError } from "../src/services/fareService";
import { signAccessToken, signRefreshToken } from "../src/lib/auth";

const FIXTURE_USER_ID = "111111111111111111111111";
const FIXTURE_ROUTE_ID = "444444444444444444444444";
const FIXTURE_MISSING_ROUTE_ID = "555555555555555555555555";

const createUserToken = (role: "user" | "admin" = "user"): string =>
  signAccessToken({
    sub: FIXTURE_USER_ID,
    email: "rider@example.com",
    role,
  });

const mockAuthenticatedUser = (role: "user" | "admin" = "user") => {
  const lean = jest.fn().mockResolvedValue({
    _id: FIXTURE_USER_ID,
    email: "rider@example.com",
    role,
    isActive: true,
  });
  const select = jest.fn().mockReturnValue({ lean });
  (User.findById as unknown as jest.Mock).mockReturnValue({ select });
};

describe("Phase 2 integration endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("POST /api/v1/auth/register returns JWT and refresh cookie", async () => {
    const lean = jest.fn().mockResolvedValue(null);
    (User.findOne as unknown as jest.Mock).mockReturnValue({ lean });
    (User.create as unknown as jest.Mock).mockResolvedValue({
      _id: "u-register-1",
      fullName: "New Rider",
      email: "newrider@example.com",
      role: "user",
    });

    const response = await request(app).post("/api/v1/auth/register").send({
      fullName: "New Rider",
      email: "newrider@example.com",
      password: "password123",
    });

    expect(response.status).toBe(201);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.email).toBe("newrider@example.com");
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringMatching(/^naija_refresh_token=/)]),
    );
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
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.email).toBe("rider@example.com");
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringMatching(/^naija_refresh_token=/)]),
    );
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("POST /api/v1/auth/refresh returns new access token when refresh cookie is valid", async () => {
    const refreshToken = signRefreshToken({
      sub: FIXTURE_USER_ID,
      email: "rider@example.com",
      role: "user",
    });

    const select = jest.fn().mockResolvedValue({
      _id: FIXTURE_USER_ID,
      fullName: "Test Rider",
      email: "rider@example.com",
      role: "user",
      isActive: true,
    });
    (User.findById as unknown as jest.Mock).mockReturnValue({ select });

    const response = await request(app)
      .post("/api/v1/auth/refresh")
      .set("Cookie", [`naija_refresh_token=${refreshToken}`]);

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.email).toBe("rider@example.com");
    expect(response.headers["set-cookie"]).toEqual(
      expect.arrayContaining([expect.stringMatching(/^naija_refresh_token=/)]),
    );
  });

  it("POST /api/v1/auth/refresh returns 401 when refresh cookie is missing", async () => {
    const response = await request(app).post("/api/v1/auth/refresh");
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("refresh token missing");
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
      routeId: FIXTURE_ROUTE_ID,
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
      .query({ routeId: FIXTURE_ROUTE_ID, time: "08:30" });

    expect(response.status).toBe(200);
    expect(response.body.estimatedFare).toBe(810);
    expect(response.body.timeBand).toBe("rush_hour");
    expect(estimateRouteFare).toHaveBeenCalledWith({
      routeId: FIXTURE_ROUTE_ID,
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
      .query({ routeId: FIXTURE_MISSING_ROUTE_ID, time: "08:30" });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("route not found");
  });

  it("GET /api/v1/search returns 400 when q is missing", async () => {
    const response = await request(app).get("/api/v1/search");

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("q query is required");
  });

  it("GET /api/v1/search aggregates route and stop matches", async () => {
    const routeLean = jest.fn().mockResolvedValue([
      {
        _id: "r1",
        name: "Ojota -> CMS",
        origin: "Ojota",
        destination: "CMS",
        transportType: "danfo",
      },
    ]);
    const routeLimit = jest.fn().mockReturnValue({ lean: routeLean });
    const routeSort = jest.fn().mockReturnValue({ limit: routeLimit });
    (Route.find as unknown as jest.Mock).mockReturnValue({ sort: routeSort });

    const stopLean = jest.fn().mockResolvedValue([
      {
        _id: "s1",
        name: "Ojota",
        order: 0,
        isMajor: true,
        coords: { type: "Point", coordinates: [3.3788, 6.5839] },
        routeId: {
          _id: "r1",
          name: "Ojota -> CMS",
          origin: "Ojota",
          destination: "CMS",
          transportType: "danfo",
          isActive: true,
        },
      },
    ]);
    const stopPopulate = jest.fn().mockReturnValue({ lean: stopLean });
    const stopLimit = jest.fn().mockReturnValue({ populate: stopPopulate });
    const stopSort = jest.fn().mockReturnValue({ limit: stopLimit });
    (Stop.find as unknown as jest.Mock).mockReturnValue({ sort: stopSort });

    const response = await request(app).get("/api/v1/search").query({ q: "ojota" });

    expect(response.status).toBe(200);
    expect(response.body.query).toBe("ojota");
    expect(response.body.counts).toEqual({ routes: 1, stops: 1, total: 2 });
    expect(response.body.routes[0].name).toBe("Ojota -> CMS");
    expect(response.body.stops[0].name).toBe("Ojota");
    expect(response.body.stops[0].route.name).toBe("Ojota -> CMS");

    expect(Route.find).toHaveBeenCalledWith(
      expect.objectContaining({
        isActive: true,
        $or: expect.any(Array),
      }),
    );
    expect(Stop.find).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.any(RegExp),
      }),
    );
  });

  it("POST /api/v1/stops returns 401 when auth header is missing", async () => {
    const response = await request(app).post("/api/v1/stops").send({
      routeId: FIXTURE_ROUTE_ID,
      name: "Ojodu",
      order: 1,
      coords: { type: "Point", coordinates: [3.38, 6.58] },
    });

    expect(response.status).toBe(401);
  });

  it("POST /api/v1/stops allows admin to create a stop", async () => {
    mockAuthenticatedUser("admin");
    const routeId = FIXTURE_ROUTE_ID;

    const routeLean = jest.fn().mockResolvedValue({ _id: routeId });
    const routeSelect = jest.fn().mockReturnValue({ lean: routeLean });
    (Route.findOne as unknown as jest.Mock).mockReturnValue({ select: routeSelect });

    (Stop.create as unknown as jest.Mock).mockResolvedValue({
      _id: "s-create-1",
      routeId,
      name: "Ojodu",
      order: 1,
      isMajor: true,
      coords: { type: "Point", coordinates: [3.38, 6.58] },
    });

    const response = await request(app)
      .post("/api/v1/stops")
      .set("Authorization", `Bearer ${createUserToken("admin")}`)
      .send({
        routeId,
        name: "Ojodu",
        order: 1,
        isMajor: true,
        coords: { type: "Point", coordinates: [3.38, 6.58] },
      });

    expect(response.status).toBe(201);
    expect(response.body.name).toBe("Ojodu");
    expect(Stop.create).toHaveBeenCalledWith({
      routeId,
      name: "Ojodu",
      order: 1,
      isMajor: true,
      coords: { type: "Point", coordinates: [3.38, 6.58] },
    });
  });
});
