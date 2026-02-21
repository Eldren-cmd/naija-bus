import { isPointInsideBbox, parseBboxSubscription } from "../src/realtime/reportsSocket";

describe("reports socket bbox helpers", () => {
  it("parses bbox from comma-delimited string", () => {
    const result = parseBboxSubscription("3.2,6.4,3.6,6.8");
    expect(result).toEqual([3.2, 6.4, 3.6, 6.8]);
  });

  it("parses bbox from payload object", () => {
    const result = parseBboxSubscription({ bbox: [3.2, 6.4, 3.6, 6.8] });
    expect(result).toEqual([3.2, 6.4, 3.6, 6.8]);
  });

  it("rejects invalid bbox payloads", () => {
    expect(parseBboxSubscription("invalid")).toBeNull();
    expect(parseBboxSubscription([3.2, 6.4, 3.6])).toBeNull();
    expect(parseBboxSubscription({ bbox: "3.6,6.8,3.2,6.4" })).toBeNull();
  });

  it("matches points within bbox boundaries", () => {
    const bbox: [number, number, number, number] = [3.2, 6.4, 3.6, 6.8];

    expect(isPointInsideBbox([3.3, 6.5], bbox)).toBe(true);
    expect(isPointInsideBbox([3.2, 6.4], bbox)).toBe(true);
    expect(isPointInsideBbox([3.6, 6.8], bbox)).toBe(true);
    expect(isPointInsideBbox([3.7, 6.5], bbox)).toBe(false);
    expect(isPointInsideBbox([3.3, 6.9], bbox)).toBe(false);
  });
});
