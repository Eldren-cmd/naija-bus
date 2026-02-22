import { expect, test, type Page } from "@playwright/test";

const QUICK_CONDUCTOR = {
  userId: "699935ccba2963016871bba7",
  fullName: "Ojota Conductor",
} as const;

const QUICK_ROUTE = {
  routeId: "699935ccba2963016871bba6",
  name: "Ojota -> CMS",
  origin: "Ojota",
  destination: "CMS",
  corridor: "Ikorodu Road",
  transportType: "danfo",
  baseFare: 300,
} as const;

const json = (payload: unknown): string => JSON.stringify(payload);

async function mockQuickReportApi(page: Page) {
  let quickReportCount = 0;

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

    if (pathname.endsWith("/reports/quick/bootstrap") && method === "GET") {
      const token = (url.searchParams.get("token") || "").trim();
      if (!token || token === "bad-token") {
        return respond(401, { error: "invalid conductor token" });
      }
      return respond(200, {
        conductor: QUICK_CONDUCTOR,
        assignedRoutes: [QUICK_ROUTE],
      });
    }

    if (pathname.endsWith("/reports/quick") && method === "POST") {
      quickReportCount += 1;
      const body = request.postDataJSON() as {
        token?: string;
        routeId?: string;
        reportedFare?: number;
        trafficLevel?: string;
        notes?: string;
      };

      if (!body.token || body.token === "bad-token") {
        return respond(401, { error: "invalid conductor token" });
      }
      if (body.routeId !== QUICK_ROUTE.routeId) {
        return respond(403, { error: "route is not assigned to this conductor" });
      }

      return respond(201, {
        _id: `quick-fare-${quickReportCount}`,
        routeId: QUICK_ROUTE.routeId,
        amount: Number(body.reportedFare) || 0,
        source: "user_report",
        trafficLevel: body.trafficLevel || "medium",
        reportedBy: QUICK_CONDUCTOR.userId,
        notes: body.notes || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return respond(404, { error: `unhandled mocked endpoint: ${method} ${pathname}` });
  });
}

test.beforeEach(async ({ page }) => {
  await mockQuickReportApi(page);
});

test("QuickReport bootstrap loads conductor and assigned route", async ({ page }) => {
  await page.goto("/quick-report");

  await page.getByLabel("Conductor token").fill("quick-conductor-token-123");
  const bootstrapResponse = page.waitForResponse((response) => {
    return (
      response.url().includes("/api/v1/reports/quick/bootstrap") &&
      response.request().method() === "GET" &&
      response.status() === 200
    );
  });

  await page.getByRole("button", { name: "Load Assigned Routes" }).click();
  expect((await bootstrapResponse).ok()).toBeTruthy();

  await expect(page.getByText("Ojota Conductor")).toBeVisible();
  await expect(page.getByRole("button", { name: /Ojota -> CMS/i })).toBeVisible();
});

test("QuickReport submit sends fare update and shows success state", async ({ page }) => {
  await page.goto("/quick-report");

  await page.getByLabel("Conductor token").fill("quick-conductor-token-123");
  await page.getByRole("button", { name: "Load Assigned Routes" }).click();
  await expect(page.getByText("Ojota Conductor")).toBeVisible();

  await page.getByLabel("Fare paid (NGN)").fill("550");
  await page.getByLabel("Traffic level").selectOption("high");
  await page.getByLabel("Notes (optional)").fill("rush-hour surge");

  const submitResponse = page.waitForResponse((response) => {
    return (
      response.url().includes("/api/v1/reports/quick") &&
      response.request().method() === "POST" &&
      response.status() === 201
    );
  });

  await page.getByRole("button", { name: "Submit Quick Report" }).click();
  expect((await submitResponse).ok()).toBeTruthy();

  await expect(page.getByText("Report saved for Ojota -> CMS.")).toBeVisible();
  await expect(page.getByLabel("Fare paid (NGN)")).toHaveValue("");
});
