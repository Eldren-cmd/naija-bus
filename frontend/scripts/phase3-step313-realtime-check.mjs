import { io } from "socket.io-client";

const API_BASE = (process.env.VITE_API_BASE || "http://localhost:5000").replace(/\/+$/, "");
const SOCKET_BASE = (() => {
  try {
    return new URL(API_BASE).origin;
  } catch {
    return API_BASE;
  }
})();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureOk = async (response, context) => {
  if (response.ok) return response;
  let detail = "";
  try {
    detail = await response.text();
  } catch {
    // ignore parse failures
  }
  throw new Error(`${context} failed (${response.status}): ${detail || "no detail"}`);
};

const computeRouteBbox = (coordinates) => {
  const [first] = coordinates;
  if (!first) return null;

  let minLng = first[0];
  let minLat = first[1];
  let maxLng = first[0];
  let maxLat = first[1];

  for (const [lng, lat] of coordinates) {
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }

  return [minLng - 0.01, minLat - 0.01, maxLng + 0.01, maxLat + 0.01];
};

const connectClient = async (name, bbox, routeId) => {
  const received = [];
  const socket = io(`${SOCKET_BASE}/reports`, {
    transports: ["websocket", "polling"],
    timeout: 10000,
  });

  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${name} socket connect timeout`)), 10000);
    socket.on("connect", () => {
      clearTimeout(timer);
      resolve();
    });
    socket.on("connect_error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });

  await new Promise((resolve) => {
    socket.emit("viewport:subscribe", { bbox: bbox.join(",") }, () => resolve());
  });

  await new Promise((resolve) => {
    socket.emit("route:subscribe", { routeId }, () => resolve());
  });

  socket.on("report:created", (payload) => {
    received.push(payload);
  });

  return { socket, received };
};

const main = async () => {
  const startedAt = new Date().toISOString();

  const healthResponse = await fetch(`${API_BASE}/api/v1/health`);
  await ensureOk(healthResponse, "health check");
  const health = await healthResponse.json();

  const routesResponse = await fetch(`${API_BASE}/api/v1/routes?q=Ojota`);
  await ensureOk(routesResponse, "route search");
  const routes = await routesResponse.json();
  if (!Array.isArray(routes) || routes.length === 0) {
    throw new Error("No routes found for query Ojota");
  }
  const routeId = routes[0]._id;

  const routeResponse = await fetch(`${API_BASE}/api/v1/routes/${encodeURIComponent(routeId)}`);
  await ensureOk(routeResponse, "route detail");
  const route = await routeResponse.json();
  const routeBbox = computeRouteBbox(route.polyline?.coordinates || []);
  if (!routeBbox) throw new Error("Unable to compute route bbox");

  const [minLng, minLat, maxLng, maxLat] = routeBbox;
  const insidePoint = [
    Number(((minLng + maxLng) / 2).toFixed(6)),
    Number(((minLat + maxLat) / 2).toFixed(6)),
  ];

  const outsideBbox = [routeBbox[2] + 1, routeBbox[3] + 1, routeBbox[2] + 1.2, routeBbox[3] + 1.2];

  const randomTag = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const registerResponse = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: `Realtime QA ${randomTag}`,
      email: `realtime-${randomTag}@example.com`,
      password: "Passw0rd!234",
    }),
  });
  await ensureOk(registerResponse, "register");
  const registerPayload = await registerResponse.json();
  const token = registerPayload?.token;
  if (typeof token !== "string" || !token) throw new Error("Register did not return token");

  const browserA = await connectClient("browserA", routeBbox, routeId);
  const browserB = await connectClient("browserB", routeBbox, routeId);
  const outsideClient = await connectClient("outsideClient", outsideBbox, routeId);

  const reportResponse = await fetch(`${API_BASE}/api/v1/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      routeId,
      type: "traffic",
      severity: "medium",
      description: `phase3-step313 demo ${randomTag}`,
      coords: {
        type: "Point",
        coordinates: insidePoint,
      },
    }),
  });
  await ensureOk(reportResponse, "report submission");
  const reportPayload = await reportResponse.json();

  await delay(1600);

  browserA.socket.disconnect();
  browserB.socket.disconnect();
  outsideClient.socket.disconnect();

  const postedId = reportPayload?._id;
  const browserAReceived = browserA.received.some((item) => item?.id === postedId);
  const browserBReceived = browserB.received.some((item) => item?.id === postedId);
  const outsideReceived = outsideClient.received.some((item) => item?.id === postedId);

  const result = {
    startedAt,
    endedAt: new Date().toISOString(),
    apiBase: API_BASE,
    socketBase: SOCKET_BASE,
    health,
    routeId,
    reportId: postedId,
    expected: {
      browserAReceived: true,
      browserBReceived: true,
      outsideReceived: false,
    },
    actual: {
      browserAReceived,
      browserBReceived,
      outsideReceived,
      browserAEventCount: browserA.received.length,
      browserBEventCount: browserB.received.length,
      outsideEventCount: outsideClient.received.length,
    },
    pass: browserAReceived && browserBReceived && !outsideReceived,
  };

  console.log(JSON.stringify(result, null, 2));

  if (!result.pass) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
