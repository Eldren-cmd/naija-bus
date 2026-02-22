import * as Sentry from "@sentry/node";

type CaptureOptions = {
  operation?: string;
  tags?: Record<string, string>;
  extras?: Record<string, unknown>;
};

const SERVICE_TAG = "naija-bus-backend";

const parseTracesSampleRate = (rawValue: string | undefined): number | undefined => {
  if (!rawValue) return undefined;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return undefined;
  if (parsed < 0 || parsed > 1) return undefined;
  return parsed;
};

const getSentryDsn = (): string => (process.env.SENTRY_DSN || "").trim();

export const isSentryEnabled = (): boolean => Boolean(getSentryDsn());

export const initObservability = (): void => {
  const dsn = getSentryDsn();
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: (process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || "development").trim(),
    tracesSampleRate: parseTracesSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE),
  });
};

const normalizeError = (error: unknown): Error => {
  if (error instanceof Error) return error;
  if (typeof error === "string") return new Error(error);
  return new Error("non-error exception captured");
};

export const captureServerException = (error: unknown, options?: CaptureOptions): void => {
  if (!isSentryEnabled()) return;

  const normalized = normalizeError(error);
  Sentry.withScope((scope) => {
    scope.setTag("service", SERVICE_TAG);
    if (options?.operation) {
      scope.setTag("operation", options.operation);
    }
    if (options?.tags) {
      Object.entries(options.tags).forEach(([key, value]) => scope.setTag(key, value));
    }
    if (options?.extras) {
      Object.entries(options.extras).forEach(([key, value]) => scope.setExtra(key, value));
    }
    Sentry.captureException(normalized);
  });
};

export const flushObservability = async (timeoutMs = 2_000): Promise<boolean> => {
  if (!isSentryEnabled()) return false;
  return Sentry.flush(timeoutMs);
};
