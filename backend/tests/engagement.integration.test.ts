import request from "supertest";
import { signAccessToken } from "../src/lib/auth";

jest.mock("../src/realtime/reportsSocket", () => ({
  emitFareReported: jest.fn(),
  emitReportCreated: jest.fn(),
  emitTripRecorded: jest.fn(),
  initRealtimeServer: jest.fn(),
}));

jest.mock("../src/models", () => {
  const User = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
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
    find: jest.fn(),
    create: jest.fn(),
  };

  const Fare = {
    create: jest.fn(),
  };
  const TripRecord = {
    create: jest.fn(),
    find: jest.fn(),
  };

  return {
    User,
    Route,
    Stop,
    Report,
    Fare,
    TripRecord,
  };
});

import { User } from "../src/models";
import { app } from "../src/server";

const FIXTURE_USER_ID = "111111111111111111111111";

const createUserToken = (): string =>
  signAccessToken({
    sub: FIXTURE_USER_ID,
    email: "rider@example.com",
    role: "user",
  });

const mockAuthUserLookup = () => {
  const lean = jest.fn().mockResolvedValue({
    _id: FIXTURE_USER_ID,
    email: "rider@example.com",
    role: "user",
    isActive: true,
  });
  const select = jest.fn().mockReturnValue({ lean });
  (User.findById as unknown as jest.Mock).mockReturnValue({ select });
};

describe("engagement endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("GET /api/v1/engagement/me returns 401 without auth", async () => {
    const response = await request(app).get("/api/v1/engagement/me");
    expect(response.status).toBe(401);
    expect(response.body.error).toBe("missing or invalid authorization header");
  });

  it("GET /api/v1/engagement/me returns user engagement summary", async () => {
    const lean = jest.fn().mockResolvedValue({
      _id: FIXTURE_USER_ID,
      reportCount: 6,
      streak: 3,
      tripStreak: 2,
      tripCount: 11,
      totalDistanceMeters: 15000,
      engagementPoints: 275,
      level: 3,
      airtimeEarned: 50,
      badges: ["first_trip", "distance_10km"],
    });
    const select = jest.fn().mockReturnValue({ lean });
    (User.findById as unknown as jest.Mock).mockReturnValue({ select });

    const response = await request(app)
      .get("/api/v1/engagement/me")
      .set("Authorization", `Bearer ${createUserToken()}`);

    expect(response.status).toBe(200);
    expect(response.body.userId).toBe(FIXTURE_USER_ID);
    expect(response.body.points).toBe(275);
    expect(response.body.level).toBe(3);
    expect(response.body.tripCount).toBe(11);
    expect(response.body.badges).toEqual(expect.arrayContaining(["first_trip", "distance_10km"]));
  });

  it("GET /api/v1/engagement/leaderboard returns ranked rows", async () => {
    mockAuthUserLookup();

    const lean = jest.fn().mockResolvedValue([
      {
        _id: "u-1",
        fullName: "Rider One",
        engagementPoints: 420,
        level: 4,
        tripCount: 15,
        reportCount: 9,
        badges: ["first_trip"],
      },
      {
        _id: "u-2",
        fullName: "Rider Two",
        engagementPoints: 300,
        level: 3,
        tripCount: 9,
        reportCount: 12,
        badges: [],
      },
    ]);
    const limit = jest.fn().mockReturnValue({ lean });
    const sort = jest.fn().mockReturnValue({ limit });
    const select = jest.fn().mockReturnValue({ sort });
    (User.find as unknown as jest.Mock).mockReturnValue({ select });

    const response = await request(app)
      .get("/api/v1/engagement/leaderboard?limit=2")
      .set("Authorization", `Bearer ${createUserToken()}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        rank: 1,
        userId: "u-1",
        fullName: "Rider One",
        points: 420,
      }),
    );
    expect(User.find).toHaveBeenCalledWith({ isActive: true });
    expect(limit).toHaveBeenCalledWith(2);
  });
});
