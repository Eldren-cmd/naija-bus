import { expect, test, type Page } from "@playwright/test";

const FIXTURE_ROUTE = {
  _id: "699935ccba2963016871bba6",
  name: "Ojota -> CMS",
  origin: "Ojota",
  destination: "CMS",
  corridor: "Ikorodu Road",
  aliases: ["Ojota CMS"],
  transportType: "danfo",
  baseFare: 300,
  confidenceScore: 0.72,
} as const;

const FIXTURE_ROUTE_DETAIL = {
  ...FIXTURE_ROUTE,
  polyline: {
    type: "LineString",
    coordinates: [
      [3.3788, 6.5839],
      [3.377, 6.559],
      [3.37, 6.5469],
      [3.3953, 6.4892],
      [3.3976, 6.4479],
    ],
  },
  stops: [
    {
      _id: "stop-ojota",
      routeId: FIXTURE_ROUTE._id,
      name: "Ojota",
      order: 0,
      coords: { type: "Point", coordinates: [3.3788, 6.5839] },
      isMajor: true,
    },
    {
      _id: "stop-anthony",
      routeId: FIXTURE_ROUTE._id,
      name: "Anthony",
      order: 1,
      coords: { type: "Point", coordinates: [3.3589, 6.5469] },
      isMajor: false,
    },
    {
      _id: "stop-cms",
      routeId: FIXTURE_ROUTE._id,
      name: "CMS",
      order: 2,
      coords: { type: "Point", coordinates: [3.3976, 6.4479] },
      isMajor: true,
    },
  ],
} as const;

const FIXTURE_USER = {
  id: "69992a99aafdad26a210de4b",
  fullName: "Test Rider",
  email: "rider@example.com",
  role: "user",
} as const;

const FIXTURE_ENGAGEMENT = {
  userId: FIXTURE_USER.id,
  points: 245,
  level: 3,
  nextLevelAtPoints: 360,
  progressPercent: 4,
  pointsToNextLevel: 115,
  reportCount: 8,
  reportStreak: 2,
  tripCount: 12,
  tripStreak: 3,
  totalDistanceMeters: 22300,
  airtimeEarned: 50,
  badges: ["first_trip", "trip_streak_3", "distance_10km"],
} as const;

const FIXTURE_FARE_ESTIMATE = {
  routeId: FIXTURE_ROUTE._id,
  routeName: FIXTURE_ROUTE.name,
  origin: FIXTURE_ROUTE.origin,
  destination: FIXTURE_ROUTE.destination,
  currency: "NGN",
  confidence: 0.72,
  trafficLevel: "medium",
  timeBand: "normal",
  baseFare: 300,
  trafficMultiplier: 1,
  timeMultiplier: 1,
  estimatedFare: 300,
  computedAt: "2026-02-22T16:30:00.000Z",
} as const;

const json = (payload: unknown): string => JSON.stringify(payload);

async function mockApi(page: Page) {
  const savedRouteIds = new Set<string>();
  let fareReportCount = 0;
  let incidentReportCount = 0;

  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const pathname = url.pathname;
    const origin = "http://127.0.0.1:4173";

    const respond = (status: number, payload: unknown) =>
      route.fulfill({
        status,
        contentType: "application/json",
        headers: {
          "access-control-allow-origin": origin,
          "access-control-allow-credentials": "true",
          "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
          "access-control-allow-headers": "Content-Type,Authorization",
        },
        body: json(payload),
      });

    if (method === "OPTIONS") {
      return route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": origin,
          "access-control-allow-credentials": "true",
          "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
          "access-control-allow-headers": "Content-Type,Authorization",
        },
      });
    }

    if (pathname.endsWith("/auth/login") && method === "POST") {
      return respond(200, {
        token: "test-access-token",
        accessToken: "test-access-token",
        user: FIXTURE_USER,
      });
    }

    if (pathname.endsWith("/auth/refresh") && method === "POST") {
      return respond(401, { error: "refresh token missing" });
    }

    if (pathname.endsWith("/auth/me") && method === "GET") {
      return respond(200, { user: FIXTURE_USER });
    }

    if (pathname.endsWith("/routes") && method === "GET") {
      const query = (url.searchParams.get("q") || "").trim().toLowerCase();
      const matches =
        query.length === 0 ||
        FIXTURE_ROUTE.name.toLowerCase().includes(query) ||
        FIXTURE_ROUTE.origin.toLowerCase().includes(query) ||
        FIXTURE_ROUTE.destination.toLowerCase().includes(query);
      return respond(200, matches ? [FIXTURE_ROUTE] : []);
    }

    if (pathname.endsWith("/routes/saved") && method === "GET") {
      return respond(200, savedRouteIds.has(FIXTURE_ROUTE._id) ? [FIXTURE_ROUTE] : []);
    }

    if (pathname.endsWith("/routes/saved") && method === "POST") {
      const body = request.postDataJSON() as { routeId?: string };
      const routeId = typeof body.routeId === "string" ? body.routeId : "";
      if (routeId) savedRouteIds.add(routeId);
      return respond(200, { success: true, routeId, savedCount: savedRouteIds.size });
    }

    if (pathname.includes("/routes/saved/") && method === "DELETE") {
      const routeId = decodeURIComponent(pathname.split("/").pop() || "");
      if (routeId) savedRouteIds.delete(routeId);
      return respond(200, { success: true, routeId, savedCount: savedRouteIds.size });
    }

    if (pathname.endsWith(`/routes/${FIXTURE_ROUTE._id}`) && method === "GET") {
      return respond(200, FIXTURE_ROUTE_DETAIL);
    }

    if (pathname.endsWith("/search") && method === "GET") {
      const query = (url.searchParams.get("q") || "").trim();
      return respond(200, {
        query,
        routes: [FIXTURE_ROUTE],
        stops: [],
        counts: { routes: 1, stops: 0, total: 1 },
      });
    }

    if (pathname.endsWith("/fare/estimate") && method === "GET") {
      return respond(200, FIXTURE_FARE_ESTIMATE);
    }

    if (pathname.endsWith("/fare/report") && method === "POST") {
      fareReportCount += 1;
      const body = request.postDataJSON() as { reportedFare?: number; trafficLevel?: string; notes?: string };
      const amount = Number(body.reportedFare) || 500;
      return respond(201, {
        _id: `fare-report-${fareReportCount}`,
        routeId: FIXTURE_ROUTE._id,
        amount,
        source: "user_report",
        trafficLevel: body.trafficLevel || "medium",
        reportedBy: FIXTURE_USER.id,
        notes: body.notes || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (pathname.endsWith("/reports") && method === "GET") {
      return respond(200, []);
    }

    if (pathname.endsWith("/reports") && method === "POST") {
      incidentReportCount += 1;
      const body = request.postDataJSON() as {
        type?: string;
        severity?: string;
        description?: string;
        coords?: { type: string; coordinates: [number, number] };
      };
      return respond(201, {
        _id: `incident-${incidentReportCount}`,
        routeId: FIXTURE_ROUTE._id,
        userId: FIXTURE_USER.id,
        type: body.type || "traffic",
        severity: body.severity || "medium",
        description: body.description || "",
        coords: body.coords || { type: "Point", coordinates: [3.3788, 6.5839] },
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (pathname.endsWith("/trips") && method === "GET") {
      return respond(200, []);
    }

    if (pathname.endsWith("/engagement/me") && method === "GET") {
      return respond(200, FIXTURE_ENGAGEMENT);
    }

    if (pathname.endsWith("/engagement/leaderboard") && method === "GET") {
      return respond(200, [
        {
          rank: 1,
          userId: FIXTURE_USER.id,
          fullName: FIXTURE_USER.fullName,
          points: FIXTURE_ENGAGEMENT.points,
          level: FIXTURE_ENGAGEMENT.level,
          tripCount: FIXTURE_ENGAGEMENT.tripCount,
          reportCount: FIXTURE_ENGAGEMENT.reportCount,
          badgesCount: FIXTURE_ENGAGEMENT.badges.length,
        },
      ]);
    }

    return respond(404, { error: `unhandled mocked endpoint: ${method} ${pathname}` });
  });
}

async function loginViaUi(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill("rider@example.com");
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByText("Signed in: Test Rider")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("Phase 5 auth login flow redirects into Route Finder", async ({ page }) => {
  await loginViaUi(page);
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: /Find your route/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Search" })).toBeVisible();
});

test("Phase 5 saved-route flow saves selected route and updates panel", async ({ page }) => {
  await loginViaUi(page);

  const saveButton = page.locator(".route-list .route-save-btn").first();
  await expect(saveButton).toHaveText("Save");
  await saveButton.click();

  await expect(saveButton).toHaveText("Saved");
  await expect(page.getByText("Saved Ojota -> CMS.")).toBeVisible();
  await expect(page.locator(".saved-route-list button").first()).toContainText("Ojota -> CMS");
});

test("Phase 5 report action submits incident update from modal", async ({ page }) => {
  await loginViaUi(page);

  await page.getByRole("button", { name: "Open Traffic Report Modal" }).click();
  await expect(page.getByRole("heading", { name: "Submit Traffic Report" })).toBeVisible();

  await page.getByLabel("Description").fill("Heavy hold-up near Ojota bridge");
  await page.getByLabel("Longitude").fill("3.3788");
  await page.getByLabel("Latitude").fill("6.5839");

  const incidentResponse = page.waitForResponse((response) => {
    return (
      response.url().includes("/api/v1/reports") &&
      response.request().method() === "POST" &&
      response.status() === 201
    );
  });
  await page.getByRole("button", { name: "Submit Report" }).click();
  expect((await incidentResponse).ok()).toBeTruthy();
  await expect(page.getByRole("heading", { name: "Submit Traffic Report" })).toHaveCount(0);
});
