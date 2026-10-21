import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const STD_PDF = path.join(
  process.cwd(),
  "test-inputs/phase-2/standards/STD-1-CITS-2026-IT-Security-and-Data-Residency.pdf",
);

async function resetStandards(page: Page) {
  const list = (await (await page.request.get("/api/standards")).json()) as { id: string }[];
  for (const s of list) await page.request.delete(`/api/standards/${s.id}`);
  await page.request.put("/api/settings", {
    data: { customerName: "Layla Mansour", organization: "NGPA", onboarded: true },
  });
}

test.describe("standards library (P2.2–P2.4)", () => {
  test.beforeEach(async ({ page }) => resetStandards(page));

  test("create → paste rules → upload PDF → reorder → undo delete → delete", async ({ page }) => {
    await page.goto("/standards");
    await expect(page.getByText("No standards yet")).toBeVisible();

    // Create
    await page.getByRole("button", { name: "New standard" }).first().click();
    const dlg = page.getByRole("dialog");
    await dlg.getByLabel("Code").fill("cits-2026");
    await dlg.getByLabel("Title").fill("Customs IT Security & Data Residency Standard");
    await dlg.getByRole("button", { name: "Create standard" }).click();
    await expect(page).toHaveURL(/\/standards\/std_/);
    await expect(
      page.getByRole("heading", { level: 1, name: /Customs IT Security/ }),
    ).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText("CITS-2026");

    // Paste rules (one invalid line first)
    await page.getByRole("button", { name: "Paste rules" }).first().click();
    const paste = page.getByRole("dialog");
    await paste
      .getByLabel("Rules to paste")
      .fill(
        "SEC-01 | Data stays in-country. | mandatory\nSEC-02 | MFA for admins | M\nX-1 | bad | urgent",
      );
    await expect(paste.getByText(/Unknown priority "urgent"/)).toBeVisible();
    await expect(paste.getByRole("button", { name: /Add 2 rules/ })).toBeDisabled();
    await paste
      .getByLabel("Rules to paste")
      .fill(
        "SEC-01 | Data stays in-country. | mandatory\nSEC-02 | MFA for admins | M\nSEC-03 | Daily encrypted backups | important",
      );
    await paste.getByRole("button", { name: /Add 3 rules/ }).click();
    await expect(page.getByText("3 rules · 2 mandatory · 1 important")).toBeVisible();

    // Add a rule with an auto code
    await page.getByLabel("New rule text").fill("Architecture documentation before SAT");
    await page.getByRole("button", { name: "Add rule" }).click();
    await expect(page.getByLabel(/^Rule SEC-04/)).toBeVisible();

    // Keyboard reorder: move SEC-04 up one, survives reload
    await page.getByLabel(/^Rule SEC-04/).focus();
    await page.keyboard.press("Alt+ArrowUp");
    await expect
      .poll(async () =>
        (await page.request.get(page.url().replace("/standards/", "/api/standards/")))
          .json()
          .then((s) => s.rules.map((r: { code: string }) => r.code).join()),
      )
      .toBe("SEC-01,SEC-02,SEC-04,SEC-03");
    await page.reload();
    await expect(page.locator("[aria-label^='Rule SEC-']").nth(2)).toHaveAttribute(
      "aria-label",
      /^Rule SEC-04/,
    );

    // Delete + Undo
    await page.getByRole("button", { name: "Actions for rule SEC-02" }).click();
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await expect(page.getByText("Rule SEC-02 deleted")).toBeVisible();
    await page.getByRole("button", { name: "Undo" }).click();
    await expect(page.getByText("SEC-02 restored.")).toBeVisible();
    await expect(page.locator("[aria-label^='Rule SEC-']").nth(1)).toHaveAttribute(
      "aria-label",
      /^Rule SEC-02/,
    );

    // Upload the real standard PDF
    await page
      .locator("section[aria-labelledby='docs-title'] input[type=file]")
      .setInputFiles(STD_PDF);
    await expect(page.getByRole("link", { name: /STD-1-CITS-2026/ }).first()).toBeVisible({
      timeout: 15_000,
    });
    const docs = page.getByRole("list", { name: "Uploaded documents" });
    await expect(docs.getByText("4 pages")).toBeVisible();
    await expect(docs.getByText("AI-readable")).toBeVisible();

    // File is served inline with the right type
    const href = await page
      .getByRole("link", { name: /STD-1-CITS-2026/ })
      .first()
      .getAttribute("href");
    const file = await page.request.get(href!);
    expect(file.headers()["content-type"]).toBe("application/pdf");
    const ranged = await page.request.get(href!, { headers: { Range: "bytes=0-7" } });
    expect(ranged.status()).toBe(206);
    expect(ranged.headers()["content-range"]).toMatch(/^bytes 0-7\/\d+$/);
    expect((await ranged.body()).subarray(0, 5).toString()).toBe("%PDF-");

    // Duplicate code is refused inline
    await page.goto("/standards");
    await page.getByRole("button", { name: "New standard" }).click();
    await page.getByRole("dialog").getByLabel("Code").fill("CITS-2026");
    await page.getByRole("dialog").getByLabel("Title").fill("Duplicate");
    await page.getByRole("dialog").getByRole("button", { name: "Create standard" }).click();
    await expect(page.getByText("CITS-2026 is already used by another standard.")).toBeVisible();
    await page.keyboard.press("Escape");

    // Card shows counts; delete requires typing the code
    await expect(page.getByText("4 rules")).toBeVisible();
    await page.getByRole("button", { name: "Actions for CITS-2026" }).click();
    await page.getByRole("menuitem", { name: "Delete standard" }).click();
    const confirm = page.getByRole("dialog");
    await expect(confirm.getByRole("button", { name: "Delete standard" })).toBeDisabled();
    await confirm.getByRole("textbox").fill("cits-2026");
    await confirm.getByRole("button", { name: "Delete standard" }).click();
    await expect(page.getByText("No standards yet")).toBeVisible();
  });

  test("server rejects a renamed (fake) PDF", async ({ page }) => {
    const s = await (
      await page.request.post("/api/standards", {
        data: { code: "PESE-03", title: "Safety standard", category: "Safety & environment" },
      })
    ).json();
    const res = await page.request.post(`/api/standards/${s.id}/documents`, {
      multipart: {
        file: {
          name: "fake.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("this is not a pdf"),
        },
      },
    });
    expect(res.status()).toBe(415);
    expect((await res.json()).error.code).toBe("file_content_mismatch");
  });
});

test.describe("settings scoring (P2.1)", () => {
  test("live example reacts to partial credit and resets", async ({ page }) => {
    await page.request.put("/api/settings", {
      data: {
        onboarded: true,
        customerName: "Layla Mansour",
        weights: { mandatory: 3, important: 2, desirable: 1 },
        partialCredit: 0.5,
      },
    });
    await page.goto("/settings#settings-scoring");
    const example = page.getByRole("meter", { name: "Example compliance score" });
    await expect(example).toHaveAttribute("aria-valuenow", "67");
    await page.getByLabel("Credit for “partially compliant”").fill("0");
    await expect(example).toHaveAttribute("aria-valuenow", "52");
    await expect(page.getByText("Saved ✓").first()).toBeVisible({ timeout: 5_000 });
    await page.reload();
    await expect(page.getByRole("meter", { name: "Example compliance score" })).toHaveAttribute(
      "aria-valuenow",
      "52",
    );
    await page.getByRole("button", { name: "Reset to defaults" }).click();
    await expect(page.getByRole("meter", { name: "Example compliance score" })).toHaveAttribute(
      "aria-valuenow",
      "67",
    );
  });
});
