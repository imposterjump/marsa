import { expect, test, type Page } from "@playwright/test";

/** Put the workspace back to "first run" (welcome dialog) before a test. */
async function resetOnboarding(page: Page) {
  const res = await page.request.put("/api/settings", {
    data: { onboarded: false, organization: "" },
  });
  expect(res.ok()).toBeTruthy();
}

async function onboard(page: Page, name = "Layla Mansour", org = "Northern Gulf Ports Authority") {
  await page.request.put("/api/settings", {
    data: { customerName: name, organization: org, onboarded: true },
  });
}

test.describe("first run (FR-1.4)", () => {
  test("welcome dialog personalises the workspace", async ({ page }) => {
    await resetOnboarding(page);
    await page.goto("/projects");

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Welcome to Marsa")).toBeVisible();

    // Not dismissable with Esc in welcome mode.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeVisible();

    // Validation: name is required.
    await dialog.getByLabel("Your name").fill("");
    await dialog.getByRole("button", { name: /Enter workspace/ }).click();
    await expect(dialog.getByText("Please enter your name.")).toBeVisible();

    await dialog.getByLabel("Your name").fill("Layla Mansour");
    await dialog.getByLabel(/Organization/).fill("Northern Gulf Ports Authority");
    await dialog.getByRole("button", { name: /Enter workspace/ }).click();
    await expect(dialog).toBeHidden();

    await expect(page.getByRole("heading", { level: 1 })).toContainText("Layla");
    await expect(page.getByRole("button", { name: /^Account: Layla Mansour/ })).toBeVisible();
    await expect(page).toHaveTitle("Projects · Marsa — Layla Mansour");
  });

  test("skip for now stores Guest", async ({ page }) => {
    await resetOnboarding(page);
    await page.goto("/projects");
    await page.getByRole("button", { name: "Skip for now" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByRole("button", { name: /^Account: Guest/ })).toBeVisible();
  });
});

test.describe("shell (FR-1.2, FR-1.3, FR-1.5)", () => {
  test.beforeEach(async ({ page }) => {
    await onboard(page);
  });

  test("sidebar has exactly three items and marks the active page", async ({ page }) => {
    await page.goto("/projects");
    const nav = page.getByRole("navigation", { name: "Main navigation" }).getByRole("link");
    await expect(nav.filter({ hasText: /^(Projects|Standards|Settings)$/ })).toHaveCount(3);

    await page.getByRole("link", { name: "Standards", exact: true }).click();
    await expect(page).toHaveURL(/\/standards$/);
    await expect(page.getByRole("link", { name: "Standards", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(page).toHaveTitle("Standards · Marsa — Layla Mansour");

    await page.getByRole("link", { name: "Settings", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
  });

  test("dark theme persists across reloads", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("button", { name: /Change theme/ }).click();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.reload();
    // Applied by the pre-paint boot script, before React hydrates.
    await expect(page.locator("html")).toHaveClass(/dark/);
    await page.getByRole("button", { name: /Change theme/ }).click();
    await page.getByRole("menuitemradio", { name: "Light" }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("Ctrl+B collapses the sidebar and it stays collapsed after reload", async ({ page }) => {
    await page.goto("/projects");
    // Wait until the app is hydrated (the account chip renders after settings load).
    await expect(page.getByRole("button", { name: /^Account:/ })).toBeVisible();
    await page.keyboard.press("Control+b");
    await expect(page.locator("html")).toHaveAttribute("data-sidebar", "collapsed");
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-sidebar", "collapsed");
    await expect(page.getByRole("button", { name: /^Account:/ })).toBeVisible();
    await page.keyboard.press("Control+b");
    await expect(page.locator("html")).not.toHaveAttribute("data-sidebar", "collapsed");
  });

  test("edit profile from the account menu", async ({ page }) => {
    await page.goto("/projects");
    await page.getByRole("button", { name: /^Account:/ }).click();
    await page.getByRole("menuitem", { name: "Edit profile" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByLabel("Your name")).toHaveValue("Layla Mansour");
    await dialog.getByLabel("Your name").fill("ليلى منصور");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("button", { name: /^Account: ليلى منصور/ })).toBeVisible();
    await onboard(page); // restore
  });
});

test.describe("dropzone (P1.5)", () => {
  test.beforeEach(async ({ page }) => onboard(page));

  test("accepts documents, rejects blocked / empty / duplicate files, warns on legacy", async ({
    page,
  }) => {
    await page.goto("/dev/ui#kit-dropzone");
    const input = page.locator("#kit-dropzone input[type=file]").first();
    const pdf = {
      name: "RFP.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("%PDF-1.7 test"),
    };
    await input.setInputFiles([
      pdf,
      { name: "tool.exe", mimeType: "application/octet-stream", buffer: Buffer.from("MZ") },
      { name: "empty.txt", mimeType: "text/plain", buffer: Buffer.alloc(0) },
      {
        name: "old-spec.doc",
        mimeType: "application/msword",
        buffer: Buffer.from("{\\rtf1 legacy}"),
      },
    ]);
    const zone = page.locator("#kit-dropzone");
    await expect(zone.getByText(".exe files are not allowed")).toBeVisible();
    await expect(zone.getByText("This file is empty (0 bytes).")).toBeVisible();
    await expect(zone.getByText(/Legacy \.doc format/)).toBeVisible();
    await expect(zone.getByText("Uploaded").first()).toBeVisible({ timeout: 10_000 });

    await input.setInputFiles([pdf]);
    await expect(zone.getByText("This file is already in the list.")).toBeVisible();
  });
});
