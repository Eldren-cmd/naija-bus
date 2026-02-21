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

  const TripRecord = {
    create: jest.fn(),
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

  return {
    Fare,
    Report,
    Route,
    Stop,
    TripRecord,
    User,
  };
});

import { Route, TripRecord, User } from "../src/models";
import { emitTripRecorded } from "../src/realtime/reportsSocket";
import { app } from "../src/server";

const FIXTURE_USER_ID = "111111111111111111111111";
const FIXTURE_OTHER_USER_ID = "222222222222222222222222";
const FIXTURE_ADMIN_ID = "333333333333333333333333";
const FIXTURE_ROUTE_ID = "444444444444444444444444";

const createUserToken = (
  userId = FIXTURE_USER_ID,
  role: "user" | "admin" = "user",
): string =>
  signAccessToken({
    sub: userId,
    email: "rider@example.com",
    role,
  });

const mockAuthenticatedUser = (
  userId = FIXTURE_USER_ID,
  role: "user" | "admin" = "user",
) => {
  const lean = jest.fn().mockResolvedValue({
    _id: userId,
    email: "rider@example.com",
    role,
    isActive: true,
  });
  const select = jest.fn().mockReturnValue({ lean });
  (User.findById as unknown as jest.Mock).mockReturnValue({ select });
};

describe("trip record endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when auth header is missing", async () => {
    const response = await request(app).post("/api/v1/trips").send({
      checkpoints: [],
    });

    expect(response.status).toBe(401);
  });

  it("returns 400 when userId query is missing on GET /trips", async () => {
    mockAuthenticatedUser();

    const response = await request(app)
      .get("/api/v1/trips")
      .set("Authorization", `Bearer ${createUserToken()}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("userId query is required");
  });

  it("returns 400 when userId query is invalid on GET /trips", async () => {
    mockAuthenticatedUser();

    const response = await request(app)
      .get("/api/v1/trips?userId=bad-id")
      .set("Authorization", `Bearer ${createUserToken()}`);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain("userId must be a valid id");
  });

  it("returns 403 when non-admin requests another user's trips", async () => {
    mockAuthenticatedUser(FIXTURE_USER_ID, "user");

    const response = await request(app)
      .get(`/api/v1/trips?userId=${FIXTURE_OTHER_USER_ID}`)
      .set("Authorization", `Bearer ${createUserToken(FIXTURE_USER_ID, "user")}`);

    expect(response.status).toBe(403);
    expect(response.body.error).toBe("forbidden");
  });

  it("returns 200 with trip history for requested user", async () => {
    const userId = FIXTURE_USER_ID;
    mockAuthenticatedUser(userId, "user");

    const lean = jest.fn().mockResolvedValue([
      {
        _id: "trip-2",
        userId,
        distanceMeters: 2200,
        durationSeconds: 510,
        startedAt: "2026-02-21T11:00:00.000Z",
      },
      {
        _id: "trip-1",
        userId,
        distanceMeters: 1500,
        durationSeconds: 380,
        startedAt: "2026-02-20T10:00:00.000Z",
      },
    ]);
    const populate = jest.fn().mockReturnValue({ lean });
    const limit = jest.fn().mockReturnValue({ populate });
    const sort = jest.fn().mockReturnValue({ limit });
    (TripRecord.find as unknown as jest.Mock).mockReturnValue({ sort });

    const response = await request(app)
      .get(`/api/v1/trips?userId=${userId}`)
      .set("Authorization", `Bearer ${createUserToken(userId)}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(TripRecord.find).toHaveBeenCalledWith({ userId });
    expect(sort).toHaveBeenCalledWith({ startedAt: -1 });
    expect(limit).toHaveBeenCalledWith(200);
    expect(populate).toHaveBeenCalledWith("routeId", "name origin destination transportType");
  });

  it("allows admin to request another user's trips", async () => {
    const adminId = FIXTURE_ADMIN_ID;
    const targetUserId = FIXTURE_USER_ID;
    mockAuthenticatedUser(adminId, "admin");

    const lean = jest.fn().mockResolvedValue([]);
    const populate = jest.fn().mockReturnValue({ lean });
    const limit = jest.fn().mockReturnValue({ populate });
    const sort = jest.fn().mockReturnValue({ limit });
    (TripRecord.find as unknown as jest.Mock).mockReturnValue({ sort });

    const response = await request(app)
      .get(`/api/v1/trips?userId=${targetUserId}`)
      .set("Authorization", `Bearer ${createUserToken(adminId, "admin")}`);

    expect(response.status).toBe(200);
    expect(TripRecord.find).toHaveBeenCalledWith({ userId: targetUserId });
  });

  it("returns 400 for invalid payload", async () => {
    mockAuthenticatedUser();

    const response = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${createUserToken()}`)
      .send({
        checkpoints: [{ coords: { type: "Point", coordinates: [3.38] } }],
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual(expect.any(String));
  });

  it("returns 404 when routeId is provided but route is missing", async () => {
    mockAuthenticatedUser();
    const routeId = FIXTURE_ROUTE_ID;
    const lean = jest.fn().mockResolvedValue(null);
    const select = jest.fn().mockReturnValue({ lean });
    (Route.findOne as unknown as jest.Mock).mockReturnValue({ select });

    const response = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${createUserToken()}`)
      .send({
        routeId,
        checkpoints: [
          {
            coords: { type: "Point", coordinates: [3.37, 6.52] },
            recordedAt: "2026-02-21T10:00:00.000Z",
          },
          {
            coords: { type: "Point", coordinates: [3.39, 6.53] },
            recordedAt: "2026-02-21T10:02:00.000Z",
          },
        ],
      });

    expect(response.status).toBe(404);
    expect(response.body.error).toBe("route not found");
  });

  it("returns 201 and stores trip with computed polyline + distance", async () => {
    mockAuthenticatedUser();
    const routeId = FIXTURE_ROUTE_ID;
    const lean = jest.fn().mockResolvedValue({ _id: routeId });
    const select = jest.fn().mockReturnValue({ lean });
    (Route.findOne as unknown as jest.Mock).mockReturnValue({ select });

    (TripRecord.create as unknown as jest.Mock).mockResolvedValue({
      _id: "trip-1",
      userId: FIXTURE_USER_ID,
      routeId,
      checkpoints: [
        {
          coords: { type: "Point", coordinates: [3.37, 6.52] },
          recordedAt: "2026-02-21T10:00:00.000Z",
        },
        {
          coords: { type: "Point", coordinates: [3.385, 6.525] },
          recordedAt: "2026-02-21T10:01:00.000Z",
        },
        {
          coords: { type: "Point", coordinates: [3.4, 6.53] },
          recordedAt: "2026-02-21T10:02:00.000Z",
        },
      ],
      polyline: {
        type: "LineString",
        coordinates: [
          [3.37, 6.52],
          [3.385, 6.525],
          [3.4, 6.53],
        ],
      },
      distanceMeters: 3500,
      durationSeconds: 120,
      startedAt: "2026-02-21T10:00:00.000Z",
      endedAt: "2026-02-21T10:02:00.000Z",
    });

    const response = await request(app)
      .post("/api/v1/trips")
      .set("Authorization", `Bearer ${createUserToken()}`)
      .send({
        routeId,
        checkpoints: [
          {
            coords: { type: "Point", coordinates: [3.37, 6.52] },
            recordedAt: "2026-02-21T10:00:00.000Z",
          },
          {
            coords: { type: "Point", coordinates: [3.385, 6.525] },
            recordedAt: "2026-02-21T10:01:00.000Z",
          },
          {
            coords: { type: "Point", coordinates: [3.4, 6.53] },
            recordedAt: "2026-02-21T10:02:00.000Z",
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body._id).toBe("trip-1");
    expect(TripRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: FIXTURE_USER_ID,
        routeId,
        polyline: expect.objectContaining({
          type: "LineString",
          coordinates: expect.any(Array),
        }),
        distanceMeters: expect.any(Number),
        durationSeconds: 120,
      }),
    );

    const createPayload = (TripRecord.create as unknown as jest.Mock).mock.calls[0][0] as {
      distanceMeters: number;
      polyline: { coordinates: number[][] };
    };
    expect(createPayload.distanceMeters).toBeGreaterThan(0);
    expect(createPayload.polyline.coordinates.length).toBeGreaterThanOrEqual(2);
    expect(emitTripRecorded).toHaveBeenCalledTimes(1);
    expect(emitTripRecorded).toHaveBeenCalledWith(
      expect.objectContaining({
        routeId,
        distanceMeters: expect.any(Number),
        durationSeconds: 120,
        checkpointsCount: 3,
      }),
    );
  });
});
