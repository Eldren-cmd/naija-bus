import { isValidObjectId } from "mongoose";
import { z } from "zod";

type ValidationResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: string;
    };

const TRANSPORT_TYPES = ["danfo", "brt", "keke", "bus", "ferry", "mixed"] as const;
const TRAFFIC_LEVELS = ["low", "medium", "high"] as const;
const FARE_REPORT_SOURCES = ["system", "user_report", "admin_update"] as const;
const REPORT_TYPES = ["traffic", "police", "roadblock", "accident", "hazard", "other"] as const;
const REPORT_SEVERITIES = ["low", "medium", "high"] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const getFirstIssueMessage = (error: z.ZodError): string =>
  error.issues[0]?.message || "invalid request body";

const coordinatePairSchema = z
  .tuple([z.number().finite(), z.number().finite()])
  .refine(
    ([lng, lat]) => lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90,
    "polyline must be a valid GeoJSON LineString with at least 2 coordinates",
  );

const lineStringSchema = z
  .object({
    type: z.literal("LineString"),
    coordinates: z.array(coordinatePairSchema).min(2),
  })
  .refine(
    (value) => value.coordinates.length >= 2,
    "polyline must be a valid GeoJSON LineString with at least 2 coordinates",
  );

const routeCreateSchema = z.object({
  name: z.string().trim().min(1, "name is required"),
  origin: z.string().trim().min(1, "origin is required"),
  destination: z.string().trim().min(1, "destination is required"),
  baseFare: z.number().finite().min(0, "baseFare must be a non-negative number"),
  polyline: lineStringSchema,
  corridor: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  transportType: z.enum(TRANSPORT_TYPES).optional(),
  confidenceScore: z
    .number()
    .finite()
    .refine(
      (value) => value >= 0 && value <= 1,
      "confidenceScore must be between 0 and 1",
    )
    .optional(),
});

const routeUpdateSchema = z
  .object({
    name: z.string().trim().min(1, "name must be a non-empty string").optional(),
    origin: z.string().trim().min(1, "origin must be a non-empty string").optional(),
    destination: z
      .string()
      .trim()
      .min(1, "destination must be a non-empty string")
      .optional(),
    baseFare: z.number().finite().min(0, "baseFare must be a non-negative number").optional(),
    transportType: z.enum(TRANSPORT_TYPES).optional(),
    confidenceScore: z
      .number()
      .finite()
      .refine(
        (value) => value >= 0 && value <= 1,
        "confidenceScore must be between 0 and 1",
      )
      .optional(),
    polyline: lineStringSchema.optional(),
    aliases: z.array(z.string()).optional(),
    corridor: z.string().optional(),
    isActive: z.boolean({ error: "isActive must be boolean" }).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "at least one field is required");

const fareReportSchema = z.object({
  routeId: z
    .string()
    .trim()
    .refine((value) => isValidObjectId(value), "routeId is required and must be a valid id"),
  reportedFare: z.number().finite().gt(0, "reportedFare must be a positive number"),
  trafficLevel: z.enum(TRAFFIC_LEVELS).optional(),
  notes: z.string().optional(),
  source: z.enum(FARE_REPORT_SOURCES).optional(),
});

const pointSchema = z
  .object({
    type: z.literal("Point"),
    coordinates: z.tuple([z.number().finite(), z.number().finite()]),
  })
  .refine(
    (value) =>
      value.coordinates[0] >= -180 &&
      value.coordinates[0] <= 180 &&
      value.coordinates[1] >= -90 &&
      value.coordinates[1] <= 90,
    "coords must be GeoJSON Point with [lng, lat]",
  );

const incidentReportSchema = z.object({
  routeId: z
    .string()
    .trim()
    .refine((value) => isValidObjectId(value), "routeId must be a valid id when provided")
    .optional(),
  type: z.enum(REPORT_TYPES),
  severity: z.enum(REPORT_SEVERITIES).optional(),
  description: z.string().optional(),
  coords: pointSchema,
});

const stopCreateSchema = z.object({
  routeId: z
    .string()
    .trim()
    .refine((value) => isValidObjectId(value), "routeId is required and must be a valid id"),
  name: z.string().trim().min(1, "name is required"),
  order: z.number().int().min(0, "order must be a non-negative integer"),
  isMajor: z.boolean().optional(),
  coords: pointSchema,
});

const tripCheckpointSchema = z.object({
  coords: pointSchema,
  recordedAt: z.coerce.date().optional(),
});

const tripCreateSchema = z.object({
  routeId: z
    .string()
    .trim()
    .refine((value) => isValidObjectId(value), "routeId must be a valid id when provided")
    .optional(),
  checkpoints: z
    .array(tripCheckpointSchema)
    .min(2, "at least 2 checkpoints are required to record a trip"),
  startedAt: z.coerce.date().optional(),
  endedAt: z.coerce.date().optional(),
});

const registerRequiredSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  password: z.string(),
});

const registerSchema = z.object({
  fullName: z.string().trim().min(1, "fullName cannot be empty"),
  email: z
    .string()
    .trim()
    .refine((value) => EMAIL_REGEX.test(value), "email is invalid")
    .transform((value) => value.toLowerCase()),
  password: z.string().min(8, "password must be at least 8 characters"),
});

const loginRequiredSchema = z.object({
  email: z.string(),
  password: z.string(),
});

const loginSchema = z.object({
  email: z.string().trim().transform((value) => value.toLowerCase()),
  password: z.string(),
});

const fail = <T>(error: string): ValidationResult<T> => ({ success: false, error });

export const validateRouteCreateBody = (
  body: unknown,
): ValidationResult<z.infer<typeof routeCreateSchema>> => {
  if (!isObject(body)) return fail("request body must be an object");

  const parsed = routeCreateSchema.safeParse(body);
  if (!parsed.success) return fail(getFirstIssueMessage(parsed.error));
  return { success: true, data: parsed.data };
};

export const validateRouteUpdateBody = (
  body: unknown,
): ValidationResult<z.infer<typeof routeUpdateSchema>> => {
  if (!isObject(body)) return fail("request body must be an object");

  const parsed = routeUpdateSchema.safeParse(body);
  if (!parsed.success) return fail(getFirstIssueMessage(parsed.error));
  return { success: true, data: parsed.data };
};

export const validateFareReportBody = (
  body: unknown,
): ValidationResult<z.infer<typeof fareReportSchema>> => {
  if (!isObject(body)) return fail("request body must be an object");

  const parsed = fareReportSchema.safeParse(body);
  if (!parsed.success) return fail(getFirstIssueMessage(parsed.error));
  return { success: true, data: parsed.data };
};

export const validateIncidentReportBody = (
  body: unknown,
): ValidationResult<z.infer<typeof incidentReportSchema>> => {
  if (!isObject(body)) return fail("request body must be an object");

  const parsed = incidentReportSchema.safeParse(body);
  if (!parsed.success) return fail(getFirstIssueMessage(parsed.error));
  return { success: true, data: parsed.data };
};

export const validateTripCreateBody = (
  body: unknown,
): ValidationResult<z.infer<typeof tripCreateSchema>> => {
  if (!isObject(body)) return fail("request body must be an object");

  const parsed = tripCreateSchema.safeParse(body);
  if (!parsed.success) return fail(getFirstIssueMessage(parsed.error));
  return { success: true, data: parsed.data };
};

export const validateStopCreateBody = (
  body: unknown,
): ValidationResult<z.infer<typeof stopCreateSchema>> => {
  if (!isObject(body)) return fail("request body must be an object");

  const parsed = stopCreateSchema.safeParse(body);
  if (!parsed.success) return fail(getFirstIssueMessage(parsed.error));
  return { success: true, data: parsed.data };
};

export const validateRegisterBody = (
  body: unknown,
): ValidationResult<z.infer<typeof registerSchema>> => {
  const requiredCheck = registerRequiredSchema.safeParse(body);
  if (!requiredCheck.success) return fail("fullName, email, and password are required");

  const parsed = registerSchema.safeParse(requiredCheck.data);
  if (!parsed.success) return fail(getFirstIssueMessage(parsed.error));
  return { success: true, data: parsed.data };
};

export const validateLoginBody = (
  body: unknown,
): ValidationResult<z.infer<typeof loginSchema>> => {
  const requiredCheck = loginRequiredSchema.safeParse(body);
  if (!requiredCheck.success) return fail("email and password are required");

  const parsed = loginSchema.safeParse(requiredCheck.data);
  if (!parsed.success) return fail(getFirstIssueMessage(parsed.error));
  return { success: true, data: parsed.data };
};
