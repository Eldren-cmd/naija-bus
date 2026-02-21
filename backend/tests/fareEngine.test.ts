import { estimateFare } from "../src/lib/fareEngine";

describe("fareEngine estimateFare", () => {
  it("uses default multipliers when traffic/time are omitted", () => {
    const result = estimateFare({ baseFare: 300 });
    expect(result.trafficMultiplier).toBe(1);
    expect(result.timeMultiplier).toBe(1);
    expect(result.estimatedFare).toBe(300);
  });

  it("applies rush hour and high traffic multipliers", () => {
    const result = estimateFare({
      baseFare: 300,
      trafficLevel: "high",
      timeBand: "rush_hour",
    });
    expect(result.trafficMultiplier).toBe(1.2);
    expect(result.timeMultiplier).toBe(1.15);
    expect(result.estimatedFare).toBe(410);
  });

  it("applies off-peak and low traffic multipliers", () => {
    const result = estimateFare({
      baseFare: 300,
      trafficLevel: "low",
      timeBand: "off_peak",
    });
    expect(result.trafficMultiplier).toBe(0.95);
    expect(result.timeMultiplier).toBe(0.9);
    expect(result.estimatedFare).toBe(260);
  });

  it("handles medium traffic with rush hour", () => {
    const result = estimateFare({
      baseFare: 500,
      trafficLevel: "medium",
      timeBand: "rush_hour",
    });
    expect(result.trafficMultiplier).toBe(1);
    expect(result.timeMultiplier).toBe(1.15);
    expect(result.estimatedFare).toBe(580);
  });

  it("throws for negative base fare", () => {
    expect(() => estimateFare({ baseFare: -50 })).toThrow(
      "baseFare must be a non-negative number",
    );
  });
});
