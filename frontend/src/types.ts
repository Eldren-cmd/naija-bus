export type TransportType = "danfo" | "brt" | "keke" | "bus" | "ferry" | "mixed";
export type TrafficLevel = "low" | "medium" | "high";
export type TimeBand = "off_peak" | "normal" | "rush_hour";

export type RouteSummary = {
  _id: string;
  name: string;
  origin: string;
  destination: string;
  corridor: string;
  aliases: string[];
  transportType: TransportType;
  baseFare: number;
  confidenceScore: number;
};

export type StopPoint = {
  _id: string;
  routeId: string;
  name: string;
  order: number;
  coords: {
    type: "Point";
    coordinates: [number, number];
  };
  isMajor: boolean;
};

export type RouteDetail = RouteSummary & {
  polyline: {
    type: "LineString";
    coordinates: [number, number][];
  };
  stops: StopPoint[];
};

export type FareEstimate = {
  routeId: string;
  routeName: string;
  origin: string;
  destination: string;
  currency: "NGN";
  confidence: number;
  trafficLevel: TrafficLevel;
  timeBand: TimeBand;
  baseFare: number;
  trafficMultiplier: number;
  timeMultiplier: number;
  estimatedFare: number;
  computedAt: string;
};
