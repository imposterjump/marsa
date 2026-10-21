import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const ROOT = path.join(process.cwd(), "test-inputs");
const RFP_PDF = path.join(ROOT, "phase-1/rfp-pack/01-RFP-NGPA-T-2026-014.pdf");
const COMMERCIAL = path.join(ROOT, "phase-4/proposals/3-Harborline-Systems-Commercial.pdf");
const TECHNICAL = path.join(ROOT, "phase-4/proposals/3-Harborline-Systems-Technical.pdf");

/** Empty workspace + one open tender with its RFP. */
async function openTender(page: Page) {
  await page.request.post("/api/dev/reset", { data: { confirm: "RESET" } });
  await page.request.put("/api/settings", {
    data: { customerName: "Layla Mansour", organization: "NGPA", onboarded: true },
  });
  const project = await (
    await page.request.post("/api/projects", { data: { name: "Cargo X-Ray Inspection Systems" } })
  ).json();
  await page.request.post(`/api/projects/${project.id}/documents`, {
    multipart: {
      file: {
        name: path.basename(RFP_PDF),
        mimeType: "application/pdf",
        buffer: fs.readFileSync(RFP_PDF),
      },
    },
  });
  await page.request.patch(`/api/projects/${project.id}`, { data: { status: "open" } });
  return project as { id: string; code: string };
}

test.describe("vendor proposals (P4.4–P4.5, P5.1 first cut)", () => {
  test("simulate a vendor submission → proposals table → proposal workspace", async ({ page }) => {
    const project = await openTender(page);
    await page.goto(`/projects/${project.id}/proposals`);
    await expect(page.getByText("Waiting for proposals")).toBeVisible();
    await page.getByRole("link", { name: "Simulate a vendor submission" }).first().click();

    await expect(page).toHaveURL(/\/vendor-portal\?project=/);
    await expect(page.getByText("Demo tool.")).toBeVisible();
    await expect(page.getByRole("combobox").first()).toContainText(project.code);

    // No vendors yet → the new-vendor form shows directly. Submit with nothing to see validation.
    await page.getByRole("button", { name: "Submit proposal" }).click();
    await expect(page.getByText("Enter the vendor's company name.")).toBeVisible();
    await expect(page.getByText("Add the commercial proposal (at least one file).")).toBeVisible();

    await page.getByLabel("Company name").fill("Harborline Systems");
    await page.getByLabel("Country").fill("Netherlands");
    const inputs = page.locator("input[type=file]");
    await inputs.nth(0).setInputFiles(COMMERCIAL);
    await inputs.nth(1).setInputFiles(TECHNICAL);
    await expect(page.getByText("2 files ready")).toBeVisible();
    await page.getByRole("button", { name: "Submit proposal" }).click();

    await expect(page.getByRole("heading", { name: "Proposal submitted" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(`Harborline Systems → ${project.code}`)).toBeVisible();
    await page.getByRole("link", { name: "View proposals" }).click();

    // Proposals table
    await expect(page).toHaveURL(new RegExp(`/projects/${project.id}/proposals$`));
    const table = page.getByRole("table", { name: /Proposals received/ });
    await expect(table).toContainText("Harborline Systems");
    await expect(table).toContainText("1 commercial · 1 technical");
    await expect(page.getByRole("link", { name: /Proposals/ }).first()).toContainText("1");

    // Workspace: Commercial first, then Technical; analysis tabs locked
    await page.getByRole("link", { name: "View Harborline Systems's proposal" }).click();
    await expect(page).toHaveURL(/\?tab=commercial/);
    await expect(page.getByRole("heading", { name: "Harborline Systems" })).toBeVisible();
    await expect(page.getByText("3-Harborline-Systems-Commercial.pdf").first()).toBeVisible();
    await expect(page.getByRole("tab", { name: "Compliance" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await page.getByRole("tab", { name: "Technical" }).click();
    await expect(page).toHaveURL(/tab=technical/);
    await expect(page.getByText("3-Harborline-Systems-Technical.pdf").first()).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText(
      "Harborline Systems",
    );

    // A published tender with proposals can no longer go back to draft
    await page.getByRole("button", { name: "More actions" }).click();
    await expect(page.getByRole("menuitem", { name: "Move back to draft" })).toHaveCount(0);
    await page.keyboard.press("Escape");

    // Resubmitting with the existing vendor warns that files will be replaced
    await page.goto(`/vendor-portal?project=${project.id}`);
    await page.getByRole("combobox").nth(1).click();
    await page.getByRole("option", { name: /Harborline Systems/ }).click();
    await expect(page.getByText(/already submitted to this tender/)).toBeVisible();
  });

  test("Demo tools: load and remove sample data", async ({ page }) => {
    await page.request.post("/api/dev/reset", { data: { confirm: "RESET" } });
    await page.goto("/settings#demo");
    await expect(page.getByRole("heading", { name: "Demo tools" })).toBeVisible();
    await page.getByRole("button", { name: "Load sample data" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Load sample data" }).click();
    await expect(page.getByText(/Loaded: 2 sample projects with 4 vendor proposals/)).toBeVisible({
      timeout: 60_000,
    });

    await page.goto("/projects");
    const card = page.getByRole("article").filter({ hasText: "Cargo X-Ray Inspection Systems" });
    await expect(card).toContainText("Sample");
    await expect(card).toContainText("4 proposals");
    await card.getByRole("link").first().click();
    await page
      .getByRole("link", { name: /Proposals/ })
      .first()
      .click();
    const table = page.getByRole("table", { name: /Proposals received/ });
    for (const v of [
      "Atlas Port Technologies",
      "Nile Gate Solutions",
      "Harborline Systems",
      "Meridian Scan Technologies",
    ]) {
      await expect(table).toContainText(v);
    }

    await page.goto("/settings#demo");
    await page.getByRole("button", { name: "Remove" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Remove sample data" }).click();
    await expect(page.getByText(/Two sample tenders/)).toBeVisible();
    await page.goto("/projects");
    await expect(page.getByText("No projects yet")).toBeVisible();
  });
});
