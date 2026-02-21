/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

const mongoose = require(path.resolve(__dirname, "../backend/node_modules/mongoose"));
const dotenv = require(path.resolve(__dirname, "../backend/node_modules/dotenv"));

dotenv.config({ path: path.resolve(__dirname, "../backend/.env") });

const routeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    origin: { type: String, required: true, trim: true },
    destination: { type: String, required: true, trim: true },
    corridor: { type: String, default: "", trim: true },
    aliases: { type: [String], default: [] },
    transportType: {
      type: String,
      enum: ["danfo", "brt", "keke", "bus", "ferry", "mixed"],
      default: "danfo",
    },
    baseFare: { type: Number, required: true, min: 0 },
    confidenceScore: { type: Number, min: 0, max: 1, default: 0.5 },
    polyline: {
      type: {
        type: String,
        enum: ["LineString"],
        required: true,
        default: "LineString",
      },
      coordinates: { type: [[Number]], required: true, default: [] },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

const stopSchema = new mongoose.Schema(
  {
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
    name: { type: String, required: true, trim: true },
    order: { type: Number, required: true, min: 0 },
    isMajor: { type: Boolean, default: false },
    coords: {
      type: {
        type: String,
        enum: ["Point"],
        required: true,
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: (coords) => Array.isArray(coords) && coords.length === 2,
          message: "Point coordinates must be [lng, lat]",
        },
      },
    },
  },
  { timestamps: true },
);

const Route = mongoose.models.Route || mongoose.model("Route", routeSchema);
const Stop = mongoose.models.Stop || mongoose.model("Stop", stopSchema);

const isValidCoordinatePair = (value) =>
  Array.isArray(value) &&
  value.length === 2 &&
  Number.isFinite(value[0]) &&
  Number.isFinite(value[1]);

const loadSeedData = () => {
  const filePath = path.resolve(__dirname, "../seed/initialRoutes.json");
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);

  if (!Array.isArray(data) || data.length !== 5) {
    throw new Error("seed/initialRoutes.json must contain exactly 5 routes");
  }

  data.forEach((route, idx) => {
    const label = `route[${idx}]`;
    if (!route.name || !route.origin || !route.destination) {
      throw new Error(`${label} is missing name/origin/destination`);
    }
    if (!route.polyline || route.polyline.type !== "LineString") {
      throw new Error(`${label} must include polyline.type=LineString`);
    }
    if (!Array.isArray(route.polyline.coordinates) || route.polyline.coordinates.length < 2) {
      throw new Error(`${label} must include at least 2 polyline coordinates`);
    }
    route.polyline.coordinates.forEach((pair, pairIdx) => {
      if (!isValidCoordinatePair(pair)) {
        throw new Error(`${label}.polyline.coordinates[${pairIdx}] must be [lng, lat] numbers`);
      }
    });
    if (!Array.isArray(route.stops) || route.stops.length < 2) {
      throw new Error(`${label} must include at least 2 stops`);
    }
    route.stops.forEach((stop, stopIdx) => {
      if (!stop.name || !isValidCoordinatePair(stop.coords)) {
        throw new Error(`${label}.stops[${stopIdx}] must include name and coords [lng, lat]`);
      }
    });
  });

  return data;
};

const run = async () => {
  const dryRun = process.argv.includes("--dry-run");
  const routes = loadSeedData();

  console.log(`[seed] Loaded ${routes.length} routes from seed/initialRoutes.json`);
  routes.forEach((route, idx) => {
    console.log(
      `[seed] ${idx + 1}. ${route.name} | baseFare=NGN ${route.baseFare} | stops=${route.stops.length}`,
    );
  });

  if (dryRun) {
    console.log("[seed] Dry run complete. No database writes performed.");
    return;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not set in backend/.env");
  }

  await mongoose.connect(mongoUri);

  let seededStops = 0;
  for (const route of routes) {
    const routePayload = {
      name: route.name,
      origin: route.origin,
      destination: route.destination,
      corridor: route.corridor || "",
      aliases: Array.isArray(route.aliases) ? route.aliases : [],
      transportType: route.transportType || "danfo",
      baseFare: route.baseFare,
      confidenceScore: route.confidenceScore ?? 0.5,
      polyline: route.polyline,
      isActive: true,
    };

    const routeDoc = await Route.findOneAndUpdate(
      {
        name: routePayload.name,
        origin: routePayload.origin,
        destination: routePayload.destination,
      },
      { $set: routePayload },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await Stop.deleteMany({ routeId: routeDoc._id });
    const stopsToInsert = route.stops.map((stop, index) => ({
      routeId: routeDoc._id,
      name: stop.name,
      order: index,
      isMajor: Boolean(stop.isMajor),
      coords: {
        type: "Point",
        coordinates: stop.coords,
      },
    }));
    await Stop.insertMany(stopsToInsert);
    seededStops += stopsToInsert.length;
  }

  const routeCount = await Route.countDocuments();
  const stopCount = await Stop.countDocuments();

  console.log(`[seed] Completed. Total routes in DB: ${routeCount}`);
  console.log(`[seed] Completed. Total stops in DB: ${stopCount}`);
  console.log(`[seed] Stops inserted/updated in this run: ${seededStops}`);
};

run()
  .catch((error) => {
    console.error("[seed] Failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
