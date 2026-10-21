import { expect, test } from "@playwright/test";

test("health endpoint reports ok in mock mode", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body.ai.mode).toBe("mock");
});

test("home page renders and the health check works", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Marsa/);
  await expect(page.getByRole("heading", { name: "Marsa" })).toBeVisible();

  await page.getByRole("button", { name: /health check/i }).click();
  await expect(page.getByText("Database: ok")).toBeVisible();
  await expect(page.getByText("Storage: ok")).toBeVisible();
});
