import { FareServiceError, resolveTimeBand, resolveTrafficLevel } from "../src/services/fareService";

describe("fareService helpers", () => {
  describe("resolveTimeBand", () => {
    it("returns rush_hour for morning rush period", () => {
      expect(resolveTimeBand("07:45")).toBe("rush_hour");
    });

    it("returns rush_hour for evening rush period", () => {
      expect(resolveTimeBand("18:10")).toBe("rush_hour");
    });

    it("returns off_peak for late night", () => {
      expect(resolveTimeBand("23:15")).toBe("off_peak");
    });

    it("returns normal for midday", () => {
      expect(resolveTimeBand("13:00")).toBe("normal");
    });

    it("throws for invalid time", () => {
      expect(() => resolveTimeBand("99:00")).toThrow(FareServiceError);
    });
  });

  describe("resolveTrafficLevel", () => {
    it("defaults to medium when omitted", () => {
      expect(resolveTrafficLevel()).toBe("medium");
    });

    it("normalizes valid value", () => {
      expect(resolveTrafficLevel("HIGH")).toBe("high");
    });

    it("throws for invalid value", () => {
      expect(() => resolveTrafficLevel("jammed")).toThrow(FareServiceError);
    });
  });
});
