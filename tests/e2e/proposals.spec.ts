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

test.describe("vendor proposals (P4.4–P4.5, P5.1, P8 Add vendor)", () => {
  test("add a vendor → proposals table → proposal workspace", async ({ page }) => {
    const project = await openTender(page);
    await page.goto(`/projects/${project.id}/proposals`);
    await expect(page.getByText("No vendors yet")).toBeVisible();
    await page.getByRole("button", { name: "Add vendor" }).first().click();
    const dlg = page.getByRole("dialog", { name: "Add vendor" });

    // Save with nothing to see validation
    await dlg.getByRole("button", { name: "Save vendor" }).click();
    await expect(dlg.getByText("Enter the vendor's company name.")).toBeVisible();
    await expect(dlg.getByText("Add the commercial and the technical proposal.")).toBeVisible();

    await dlg.getByLabel("Company name").fill("Harborline Systems");
    await dlg.getByLabel("Country").fill("Netherlands");
    const inputs = dlg.locator("input[type=file]");
    await inputs.nth(0).setInputFiles(COMMERCIAL);
    await inputs.nth(1).setInputFiles(TECHNICAL);
    await dlg.getByRole("button", { name: "Save vendor" }).click();
    await expect(page.getByText("Harborline Systems added · 2 files")).toBeVisible({
      timeout: 30_000,
    });
    await expect(dlg).toBeHidden();
    // The same vendor can't be added twice to one project
    await page.getByRole("button", { name: "Add vendor" }).first().click();
    await dlg.getByLabel("Company name").fill("harborline systems");
    await dlg.getByRole("button", { name: "Save vendor" }).click();
    await expect(dlg.getByText("Harborline Systems is already on this project.")).toBeVisible();
    await page.keyboard.press("Escape");

    // Proposals table
    await expect(page).toHaveURL(new RegExp(`/projects/${project.id}/proposals$`));
    const table = page.getByRole("table", { name: /Proposals received/ });
    await expect(table).toContainText("Harborline Systems");
    await expect(table).toContainText("1 commercial · 1 technical");
    await expect(page.getByRole("link", { name: /Proposals/ }).first()).toContainText("1");

    // View opens the full-screen reader on the Commercial envelope (user feedback 2026-10-21)
    await page.getByRole("link", { name: "View Harborline Systems's proposal" }).click();
    await expect(page).toHaveURL(/\?tab=commercial&reader=/);
    const reader = page.getByRole("dialog", { name: "Harborline Systems" });
    await expect(reader).toBeVisible();
    await expect(
      reader.getByRole("img", { name: /3-Harborline-Systems-Commercial\.pdf, page 1/ }),
    ).toBeVisible({
      timeout: 20_000,
    });
    await expect(reader.getByText("/ 5")).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(page).toHaveURL(/page=2/);
    await expect(reader.getByLabel(/Page number/)).toHaveValue("2");
    await reader.getByRole("button", { name: "Page 4" }).click(); // filmstrip
    await expect(reader.getByLabel(/Page number/)).toHaveValue("4");
    await reader.getByRole("tab", { name: "Technical" }).click();
    await expect(page).toHaveURL(/tab=technical/);
    await expect(reader.getByText("/ 11")).toBeVisible();
    await reader.getByRole("button", { name: "Zoom in (+)" }).click();
    await expect(reader.getByRole("button", { name: /Reset zoom/ })).toHaveText("125%");
    await page.keyboard.press("Escape");
    await expect(reader).toBeHidden();
    await expect(page).not.toHaveURL(/reader=/);

    // Underneath: the envelope's document cards; analysis tabs locked
    await expect(page.getByRole("heading", { name: "Harborline Systems" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Technical proposal" })).toBeVisible();
    await expect(page.getByText("3-Harborline-Systems-Technical.pdf").first()).toBeVisible();
    await expect(page.getByRole("tab", { name: "Compliance" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    await page.getByRole("button", { name: "Open reader" }).click();
    await expect(page.getByRole("dialog", { name: "Harborline Systems" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText(
      "Harborline Systems",
    );

    // Compact project header on a proposal page (P5.3): no description, no header actions
    await expect(page.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0);

    // Deep link with an evidence quote (P5.7): jumps to the page and highlights it
    const proposalUrl = page.url().split("?")[0];
    await page.goto(
      `${proposalUrl}?tab=technical&reader=1&q=${encodeURIComponent("Harborline is the OEM of all inspection systems offered (Form F-3 not applicable)")}`,
    );
    const quoted = page.getByRole("dialog", { name: "Harborline Systems" });
    await expect(quoted.getByText("Evidence:")).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/page=3/);
    await expect(quoted.getByLabel(/Page number/)).toHaveValue("3");
    await expect(quoted.locator("mark.marsa-hit").first()).toBeAttached({ timeout: 20_000 });
    await page.keyboard.press("Escape");
    await expect(page).not.toHaveURL(/[?&]q=/);

    // AI analysis panel under the table (P8): steps = checklist + per vendor + recommendation
    await page.goto(`/projects/${project.id}/proposals`);
    const panel = page.getByRole("region", { name: "AI analysis" });
    await expect(panel).toContainText(/\d+ \([23] × 1 \+ 2\)/);
    await expect(panel).toContainText("Free (demo AI)");
    await expect(panel.getByRole("button", { name: "Run AI analysis" })).toBeEnabled();

    // A published tender with proposals can no longer go back to draft
    await page.getByRole("button", { name: "More actions", exact: true }).click();
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

  test("reader opens Excel, Word, image and single-page files (P5.6)", async ({ page }) => {
    const project = await openTender(page);
    const add = async (f: string, mimeType: string) =>
      page.request.post(`/api/projects/${project.id}/documents`, {
        multipart: {
          file: {
            name: f,
            mimeType,
            buffer: fs.readFileSync(path.join(ROOT, "phase-1/rfp-pack", f)),
          },
        },
      });
    await add(
      "03-Annex-B-Technical-Specifications.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    await add(
      "04-Annex-C-Draft-Contract.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    await add("02-Annex-A-2-T2-Site-Plan.png", "image/png");
    await add("05-Addendum-No-1.pdf", "application/pdf");
    await page.goto(`/projects/${project.id}`);

    const open = async (name: string) => {
      await page.getByRole("button", { name: `Preview ${name}` }).click();
      return page.getByRole("dialog", { name });
    };

    let reader = await open("03-Annex-B-Technical-Specifications.xlsx");
    await expect(
      reader.getByRole("img", { name: /xlsx, page 1/ }).getByText("Sheet: Read me"),
    ).toBeVisible({ timeout: 20_000 });
    await expect(reader.getByText("/ 6")).toBeVisible();
    await page.keyboard.press("ArrowRight");
    // Scope to the main sheet: thumbnails render the same text.
    await expect(
      reader.getByRole("img", { name: /xlsx, page 2/ }).getByText("Sheet: Technical specs"),
    ).toBeVisible();
    await expect(reader.getByText("Steel penetration (ANSI N42.46-2008)").first()).toBeAttached();
    await page.keyboard.press("Escape");

    reader = await open("04-Annex-C-Draft-Contract.docx");
    await expect(reader.getByText("Part A — General Conditions (GC)").first()).toBeAttached({
      timeout: 20_000,
    });
    await expect(reader.getByText(/^\/ \d+$/)).toBeVisible();
    await page.keyboard.press("Escape");

    reader = await open("02-Annex-A-2-T2-Site-Plan.png");
    await expect(
      reader.getByRole("img", { name: "02-Annex-A-2-T2-Site-Plan.png" }).last(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(reader.getByText("1 page", { exact: true })).toBeVisible();
    await expect(reader.getByLabel(/Page number/)).toHaveCount(0); // no pagination for a single page
    await page.keyboard.press("Escape");

    reader = await open("05-Addendum-No-1.pdf");
    await expect(reader.getByRole("img", { name: /05-Addendum-No-1\.pdf, page 1/ })).toBeVisible({
      timeout: 20_000,
    });
    await expect(reader.getByText("1 page", { exact: true })).toBeVisible();
    await expect(reader.getByRole("navigation", { name: "Pages" })).toHaveCount(0);
  });
});
