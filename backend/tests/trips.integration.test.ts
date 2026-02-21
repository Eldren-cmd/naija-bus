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

  const TripRecord = {
    create: jest.fn(),
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
    const routeId = "699935ccba2963016871bba6";
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
    const routeId = "699935ccba2963016871bba6";
    const lean = jest.fn().mockResolvedValue({ _id: routeId });
    const select = jest.fn().mockReturnValue({ lean });
    (Route.findOne as unknown as jest.Mock).mockReturnValue({ select });

    (TripRecord.create as unknown as jest.Mock).mockResolvedValue({
      _id: "trip-1",
      userId: "699935ccba2963016871bba6",
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
        userId: "699935ccba2963016871bba6",
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
  });
});
