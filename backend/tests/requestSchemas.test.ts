import {
  validateFareReportBody,
  validateIncidentReportBody,
  validateLoginBody,
  validateRegisterBody,
  validateRouteCreateBody,
  validateRouteUpdateBody,
  validateTripCreateBody,
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

  it("validates trip create payload", () => {
    const result = validateTripCreateBody({
      routeId: "699935ccba2963016871bba6",
      checkpoints: [
        {
          coords: { type: "Point", coordinates: [3.37, 6.52] },
          recordedAt: "2026-02-21T10:00:00.000Z",
        },
        {
          coords: { type: "Point", coordinates: [3.4, 6.53] },
          recordedAt: "2026-02-21T10:01:00.000Z",
        },
      ],
    });

    expect(result.success).toBe(true);
  });

  it("rejects trip create payload with fewer than 2 checkpoints", () => {
    const result = validateTripCreateBody({
      checkpoints: [{ coords: { type: "Point", coordinates: [3.37, 6.52] } }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects missing login fields", () => {
    const result = validateLoginBody({ email: "rider@example.com" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("email and password are required");
    }
  });
});
