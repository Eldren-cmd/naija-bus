import pino from "pino";

const LOG_LEVELS = new Set(["fatal", "error", "warn", "info", "debug", "trace", "silent"]);

const resolveLogLevel = (): pino.LevelWithSilent => {
  const defaultLevel = process.env.NODE_ENV === "test" ? "silent" : "info";
  const raw = (process.env.LOG_LEVEL || defaultLevel).trim().toLowerCase();
  if (LOG_LEVELS.has(raw)) {
    return raw as pino.LevelWithSilent;
  }
  return defaultLevel as pino.LevelWithSilent;
};

const logger = pino({
  level: resolveLogLevel(),
  base: {
    service: "naija-bus-backend",
    environment: process.env.NODE_ENV || "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "headers.authorization",
      "headers.cookie",
      "req.headers.authorization",
      "req.headers.cookie",
      "request.headers.authorization",
      "request.headers.cookie",
      "token",
      "refreshToken",
      "accessToken",
    ],
    censor: "[REDACTED]",
  },
});

export { logger };
