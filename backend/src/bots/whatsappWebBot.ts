import qrcode from "qrcode-terminal";
import { Client, LocalAuth, type Message } from "whatsapp-web.js";
import type { BotContext, BotIngestResult, BotReportPayload } from "../types/bot";

const REPORT_TYPES = ["traffic", "police", "roadblock", "accident", "hazard", "other"] as const;
const REPORT_SEVERITIES = ["low", "medium", "high"] as const;

const isReportType = (
  value: string,
): value is BotReportPayload["type"] => REPORT_TYPES.includes(value as (typeof REPORT_TYPES)[number]);

const isReportSeverity = (
  value: string,
): value is NonNullable<BotReportPayload["severity"]> =>
  REPORT_SEVERITIES.includes(value as (typeof REPORT_SEVERITIES)[number]);

const parseSender = (rawFrom: string): string => rawFrom.replace(/@.+$/, "").trim();

const parseAllowlist = (raw: string | undefined): Set<string> =>
  new Set(
    (raw || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => item.replace(/^\+/, "")),
  );

type ParseResult =
  | { kind: "ignore" }
  | { kind: "help" }
  | { kind: "error"; message: string }
  | { kind: "report"; payload: BotReportPayload };

const parseReportCommand = (text: string): ParseResult => {
  const trimmed = text.trim();
  if (!trimmed) return { kind: "ignore" };

  const lower = trimmed.toLowerCase();
  if (lower === "help" || lower === "/help" || lower === "report help") {
    return { kind: "help" };
  }

  const match = trimmed.match(
    /^report\s+([a-z_]+)\s+([a-z_]+)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)(?:\s+([a-fA-F0-9]{24}))?(?:\s+(.+))?$/i,
  );
  if (!match) {
    return {
      kind: "error",
      message:
        "Invalid format. Use: report <type> <severity> <lng> <lat> [routeId] [description]",
    };
  }

  const [, typeRaw, severityRaw, lngRaw, latRaw, routeIdRaw, descriptionRaw] = match;
  const type = typeRaw.toLowerCase();
  const severity = severityRaw.toLowerCase();
  if (!isReportType(type)) {
    return {
      kind: "error",
      message: `Invalid type. Allowed: ${REPORT_TYPES.join(", ")}`,
    };
  }
  if (!isReportSeverity(severity)) {
    return {
      kind: "error",
      message: `Invalid severity. Allowed: ${REPORT_SEVERITIES.join(", ")}`,
    };
  }

  const lng = Number(lngRaw);
  const lat = Number(latRaw);
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || lng < -180 || lng > 180 || lat < -90 || lat > 90) {
    return { kind: "error", message: "Invalid coordinates. Use valid lng/lat values." };
  }

  return {
    kind: "report",
    payload: {
      routeId: routeIdRaw,
      type,
      severity,
      description: descriptionRaw?.trim() || "",
      coords: {
        type: "Point",
        coordinates: [lng, lat],
      },
    },
  };
};

const helpText =
  "Naija bot commands:\n" +
  "1) report <type> <severity> <lng> <lat> [routeId] [description]\n" +
  `2) type: ${REPORT_TYPES.join(", ")}\n` +
  `3) severity: ${REPORT_SEVERITIES.join(", ")}`;

type StartBotOptions = {
  onReport: (payload: BotReportPayload, context: BotContext) => Promise<BotIngestResult>;
};

export const startWhatsAppWebBot = async ({ onReport }: StartBotOptions): Promise<void> => {
  const isEnabled = String(process.env.WHATSAPP_BOT_ENABLED || "").toLowerCase() === "true";
  if (!isEnabled) {
    return;
  }

  const botUserId = (process.env.BOT_REPORT_USER_ID || "").trim();
  if (!botUserId) {
    console.warn("[whatsapp-bot] BOT_REPORT_USER_ID missing. Bot is disabled.");
    return;
  }

  const allowlist = parseAllowlist(process.env.WHATSAPP_ALLOWED_SENDERS);
  const sessionPath = (process.env.WHATSAPP_SESSION_PATH || ".wwebjs_auth").trim();
  const executablePath = (process.env.WHATSAPP_PUPPETEER_EXECUTABLE_PATH || "").trim();

  const client = new Client({
    authStrategy: new LocalAuth({ dataPath: sessionPath }),
    puppeteer: {
      headless: true,
      executablePath: executablePath || undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", (qr) => {
    console.log("[whatsapp-bot] Scan QR code with linked WhatsApp account:");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    console.log("[whatsapp-bot] Ready.");
  });

  client.on("authenticated", () => {
    console.log("[whatsapp-bot] Authenticated.");
  });

  client.on("auth_failure", (message) => {
    console.error("[whatsapp-bot] Auth failure:", message);
  });

  client.on("disconnected", (reason) => {
    console.warn("[whatsapp-bot] Disconnected:", reason);
  });

  client.on("message", async (message: Message) => {
    try {
      const sender = parseSender(message.from);
      if (allowlist.size > 0 && !allowlist.has(sender)) {
        await message.reply("Unauthorized sender for this bot.");
        return;
      }

      const result = parseReportCommand(message.body || "");
      if (result.kind === "ignore") return;
      if (result.kind === "help") {
        await message.reply(helpText);
        return;
      }
      if (result.kind === "error") {
        await message.reply(`${result.message}\n\n${helpText}`);
        return;
      }

      const ingestResult = await onReport(result.payload, {
        channel: "whatsapp",
        userId: botUserId,
      });
      await message.reply(ingestResult.message);
    } catch (error) {
      console.error("[whatsapp-bot] Failed to process message:", error);
      await message.reply("Failed to process report. Please try again.");
    }
  });

  await client.initialize();
};
