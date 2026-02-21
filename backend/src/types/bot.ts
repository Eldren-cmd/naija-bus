export type BotChannel = "bot" | "whatsapp";

export type BotContext = {
  channel: BotChannel;
  userId: string;
};

export type BotReportPayload = {
  routeId?: string;
  type: "traffic" | "police" | "roadblock" | "accident" | "hazard" | "other";
  severity?: "low" | "medium" | "high";
  description?: string;
  coords: {
    type: "Point";
    coordinates: [number, number];
  };
};

export type BotIngestResult = {
  ok: boolean;
  message: string;
};
