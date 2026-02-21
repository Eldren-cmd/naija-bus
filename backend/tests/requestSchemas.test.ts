import {
  validateFareReportBody,
  validateIncidentReportBody,
  validateLoginBody,
  validateRegisterBody,
  validateRouteCreateBody,
  validateRouteUpdateBody,
} from "../src/validation/requestSchemas";

describe("request schema validation (zod)", () => {
  it("validates route create payload", () => {
    const result = validateRouteCreateBody({
      name: "Ojota -> CMS",
      origin: "Ojota",
      destination: "CMS",
      baseFare: 300,
      transportType: "danfo",
      polyline: {
        type: "LineString",
        coordinates: [
          [3.37, 6.58],
          [3.39, 6.45],
        ],
      },
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty route update payload", () => {
    const result = validateRouteUpdateBody({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("at least one field is required");
    }
  });

  it("rejects invalid fare report payload", () => {
    const result = validateFareReportBody({
      routeId: "bad-id",
      reportedFare: -1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid incident report payload", () => {
    const result = validateIncidentReportBody({
      type: "traffic",
      coords: { type: "Point", coordinates: [3.37] },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toEqual(expect.any(String));
    }
  });

  it("validates register payload", () => {
    const result = validateRegisterBody({
      fullName: "A. Gabriel",
      email: "rider@example.com",
      password: "password123",
    });

    expect(result.success).toBe(true);
  });

  it("rejects missing login fields", () => {
    const result = validateLoginBody({ email: "rider@example.com" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("email and password are required");
    }
  });
});
