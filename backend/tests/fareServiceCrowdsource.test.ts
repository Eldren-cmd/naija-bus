jest.mock("../src/models", () => ({
  Route: {
    findOne: jest.fn(),
  },
  Fare: {
    find: jest.fn(),
  },
}));

import { Fare, Route } from "../src/models";
import { FareServiceError, estimateRouteFare } from "../src/services/fareService";

const mockRouteLookup = (route: {
  _id: string;
  name: string;
  origin: string;
  destination: string;
  baseFare: number;
  confidenceScore: number;
} | null) => {
  const lean = jest.fn().mockResolvedValue(route);
  const select = jest.fn().mockReturnValue({ lean });
  (Route.findOne as unknown as jest.Mock).mockReturnValue({ select });
};

const mockRecentFares = (amounts: number[]) => {
  const docs = amounts.map((amount) => ({ amount }));
  const lean = jest.fn().mockResolvedValue(docs);
  const select = jest.fn().mockReturnValue({ lean });
  const limit = jest.fn().mockReturnValue({ select });
  const sort = jest.fn().mockReturnValue({ limit });
  (Fare.find as unknown as jest.Mock).mockReturnValue({ sort });
};

describe("fareService crowdsourced adjustment", () => {
  const baseRoute = {
    _id: "699935ccba2963016871bba6",
    name: "Ojota -> CMS",
    origin: "Ojota",
    destination: "CMS",
    baseFare: 300,
    confidenceScore: 0.6,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("keeps rule-based estimate when there are no recent fare reports", async () => {
    mockRouteLookup(baseRoute);
    mockRecentFares([]);

    const result = await estimateRouteFare({
      routeId: "699935ccba2963016871bba6",
      time: "13:00",
      trafficLevel: "medium",
    });

    expect(result.ruleBasedFare).toBe(300);
    expect(result.estimatedFare).toBe(300);
    expect(result.recentReportsCount).toBe(0);
    expect(result.crowdsourcedAverageFare).toBeNull();
    expect(result.crowdsourcedWeightApplied).toBe(0);
    expect(result.confidence).toBe(0.6);
  });

  it("blends in crowdsourced reports when recent data exists", async () => {
    mockRouteLookup(baseRoute);
    mockRecentFares([500, 520, 480]);

    const result = await estimateRouteFare({
      routeId: "699935ccba2963016871bba6",
      time: "13:00",
      trafficLevel: "medium",
    });

    expect(result.ruleBasedFare).toBe(300);
    expect(result.crowdsourcedAverageFare).toBe(500);
    expect(result.recentReportsCount).toBe(3);
    expect(result.crowdsourcedWeightApplied).toBeCloseTo(0.3, 5);
    expect(result.estimatedFare).toBe(360);
    expect(result.confidence).toBeCloseTo(0.66, 5);
  });

  it("throws 404 when route does not exist", async () => {
    mockRouteLookup(null);
    mockRecentFares([]);

    await expect(
      estimateRouteFare({
        routeId: "699935ccba2963016871bba6",
      }),
    ).rejects.toMatchObject({ message: "route not found", statusCode: 404 });
  });

  it("throws 400 for invalid routeId", async () => {
    await expect(
      estimateRouteFare({
        routeId: "bad-id",
      }),
    ).rejects.toBeInstanceOf(FareServiceError);
  });
});
