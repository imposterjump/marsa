import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const RFP_PDF = path.join(process.cwd(), "test-inputs/phase-1/rfp-pack/01-RFP-NGPA-T-2026-014.pdf");
const NAME = "High-Energy Cargo X-Ray Inspection Systems — Port of Al-Noor";

/** A deadline ~6 weeks out, as YYYY-MM-DD (the date input's value format). */
const deadline = (() => {
  const d = new Date(Date.now() + 42 * 86_400_000);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
})();

async function reset(page: Page) {
  for (const url of ["/api/projects", "/api/standards"]) {
    const list = (await (await page.request.get(url)).json()) as { id: string }[];
    for (const x of list) await page.request.delete(`${url}/${x.id}`);
  }
  await page.request.put("/api/settings", {
    data: { customerName: "Layla Mansour", organization: "NGPA", onboarded: true },
  });
  // One active and one inactive standard: only the active one is pre-selected.
  await page.request.post("/api/standards", {
    data: {
      code: "CITS-2026",
      title: "Customs IT Security & Data Residency",
      category: "IT & security",
    },
  });
  await page.request.post("/api/standards", {
    data: {
      code: "PESE-03",
      title: "Port Equipment Safety",
      category: "Safety & environment",
      isActive: false,
    },
  });
}

test.describe("projects (P3.3–P3.6)", () => {
  test.beforeEach(async ({ page }) => reset(page));

  test("wizard: details → RFP upload → standards → publish → workspace tabs", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.getByText("No projects yet")).toBeVisible();
    await page.getByRole("link", { name: "New project" }).first().click();
    await expect(page).toHaveURL(/\/projects\/new/);

    // Step 1 — validation, then a valid draft
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByText(/at least 3 characters/)).toBeVisible();
    await page.getByLabel("Project name").fill(NAME);
    await page
      .getByLabel("Description")
      .fill("Four drive-through cargo scanners. Tender NGPA/T/2026/014.");
    await page.getByLabel("Submission deadline").fill(deadline);
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/projects\/new\?id=prj_[^&]+&step=2/);
    await expect(page.getByText(/PRJ-\d{4}-001 · Draft saved/)).toBeVisible();

    // Step 2 — Continue is blocked until a document is uploaded
    await expect(page.getByRole("button", { name: "Continue" })).toBeDisabled();
    await page.locator("input[type=file]").setInputFiles(RFP_PDF);
    const docs = page.getByRole("list", { name: "Uploaded RFP documents" });
    await expect(docs.getByText("01-RFP-NGPA-T-2026-014.pdf")).toBeVisible({ timeout: 20_000 });
    await expect(docs.getByText("AI-readable")).toBeVisible();

    // A reload resumes the same draft on the same step
    await page.reload();
    await expect(page.getByRole("list", { name: "Uploaded RFP documents" })).toContainText(
      "01-RFP-NGPA-T-2026-014.pdf",
    );
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 3 — active standard pre-selected, inactive one hidden and unselected
    await expect(page.getByRole("checkbox", { name: /CITS-2026/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await expect(page.getByText("1 of 2 selected")).toBeVisible();
    await page.getByRole("button", { name: /Inactive standards \(1\)/ }).click();
    await expect(page.getByRole("checkbox", { name: /PESE-03/ })).toHaveAttribute(
      "aria-checked",
      "false",
    );
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 4 — review and publish
    await expect(page).toHaveURL(/step=4/);
    await expect(page.getByText("1 RFP document uploaded")).toBeVisible();
    await expect(page.getByText("1 standard applied")).toBeVisible();
    await page.getByRole("button", { name: "Publish to vendors" }).click();

    // Workspace
    await expect(page).toHaveURL(/\/projects\/prj_[^/?]+$/);
    await expect(page.getByRole("heading", { level: 1, name: NAME })).toBeVisible();
    await expect(page.getByText("Open for proposals", { exact: true }).first()).toBeVisible();
    // Publishing must not reset the fields (G-42)
    await expect(page.getByText(/Closes in \d+ days/).first()).toBeVisible();
    await expect(page.getByText("Four drive-through cargo scanners").first()).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Breadcrumb" })).toContainText(
      /PRJ-\d{4}-001/,
    );
    await expect(page.getByRole("list", { name: "RFP documents" })).toContainText(
      "01-RFP-NGPA-T-2026-014.pdf",
    );
    // The only RFP of an open tender can't be deleted
    await expect(page.getByRole("button", { name: /^Delete 01-RFP/ })).toHaveCount(0);
    await expect(page.getByRole("link", { name: /CITS-2026/ })).toBeVisible();

    await page.getByRole("link", { name: "Proposals" }).click();
    await expect(page).toHaveURL(/\/proposals$/);
    await expect(page.getByText("Waiting for proposals")).toBeVisible();
    await page.getByRole("link", { name: "Evaluation" }).click();
    await expect(page.getByText("Evaluation is locked")).toBeVisible();

    // Home lists it with real counts; search filters it out and back
    await page.getByRole("link", { name: "Projects", exact: true }).first().click();
    await expect(page).toHaveURL(/\/projects$/);
    const card = page.getByRole("article").filter({ hasText: NAME });
    await expect(card).toContainText("Open");
    await expect(card).toContainText("1 RFP");
    await page.getByLabel("Search projects").fill("zzz");
    await expect(page.getByText("No projects match")).toBeVisible();
    await page.getByLabel("Search projects").fill("al-noor");
    await expect(card).toBeVisible();
  });

  test("edit, archive / restore and delete with type-to-confirm", async ({ page }) => {
    const created = await (
      await page.request.post("/api/projects", {
        data: { name: "Mobile Harbour Cranes", deadline },
      })
    ).json();
    await page.goto(`/projects/${created.id}`);
    await expect(page.getByText(/This tender is a draft/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Publish to vendors" })).toBeDisabled();

    // Edit details
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    const dlg = page.getByRole("dialog");
    await dlg.getByLabel("Project name").fill("Mobile Harbour Cranes (2 units)");
    await dlg.getByRole("button", { name: "Save changes" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Mobile Harbour Cranes (2 units)" }),
    ).toBeVisible();

    // Archive → read-only → restore
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Archive project" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Archive project" }).click();
    await expect(page.getByText(/archived.*read-only/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Restore" }).click();
    await expect(page.getByText(/This tender is a draft/)).toBeVisible();

    // Delete
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Delete project" }).click();
    const confirm = page.getByRole("dialog");
    await expect(confirm.getByRole("button", { name: "Delete project" })).toBeDisabled();
    await confirm.getByRole("textbox").fill(created.code);
    await confirm.getByRole("button", { name: "Delete project" }).click();
    await expect(page).toHaveURL(/\/projects$/);
    await expect(page.getByText("No projects yet")).toBeVisible();
  });
});
