import { expect, test } from "@playwright/test";

test("health endpoint reports ok in mock mode", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body.ai.mode).toBe("mock");
});

test("/ redirects to /projects (FR-1.1)", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/projects$/);
});

test("settings API validates input", async ({ request }) => {
  const bad = await request.put("/api/settings", { data: { theme: "sepia" } });
  expect(bad.status()).toBe(400);
  expect((await bad.json()).error.code).toBe("validation_error");

  const notJson = await request.put("/api/settings", {
    headers: { "Content-Type": "application/json" },
    data: "{not json",
  });
  expect(notJson.status()).toBe(400);
});
