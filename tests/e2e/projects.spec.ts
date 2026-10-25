import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const RFP_PDF = path.join(process.cwd(), "test-inputs/phase-1/rfp-pack/01-RFP-NGPA-T-2026-014.pdf");
const COMMERCIAL = path.join(
  process.cwd(),
  "test-inputs/phase-4/proposals/3-Harborline-Systems-Commercial.pdf",
);
const TECHNICAL = path.join(
  process.cwd(),
  "test-inputs/phase-4/proposals/3-Harborline-Systems-Technical.pdf",
);
const RULES_CSV = path.join(
  process.cwd(),
  "test-inputs/poc-inputs/2-meeting-e-seals/Standard-CTS-2026-rules.csv",
);
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

test.describe("projects (P3.3–P3.6, P8 guided form)", () => {
  test.beforeEach(async ({ page }) => reset(page));

  test("guided form: project + RFP → standards (pick, or new from a file) → vendors → project", async ({
    page,
  }) => {
    await page.goto("/projects");
    await expect(page.getByText("No projects yet")).toBeVisible();
    await page.getByRole("link", { name: "New project" }).first().click();
    await expect(page).toHaveURL(/\/projects\/new/);

    // Every step opens before anything is filled in (to show the steps); nothing is saved
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/projects\/new\?step=2$/);
    await page.getByRole("button", { name: /Vendors/ }).click(); // the stepper itself
    await expect(page).toHaveURL(/step=3$/);
    await expect(page.getByRole("region", { name: "Add a vendor" })).toBeVisible();
    // Create checks what is required and sends us back to the exact field
    await page.getByRole("button", { name: /create project/i }).click();
    await expect(page).toHaveURL(/step=1$/);
    await expect(page.getByText(/at least 3 characters/)).toBeVisible();
    await expect(page.getByLabel("Project name")).toBeFocused();
    expect((await (await page.request.get("/api/projects")).json()) as unknown[]).toHaveLength(0);

    // Step 1 · Project — a name alone is not enough: Create then asks for the RFP
    await page.getByLabel("Project name").fill(NAME);
    await page.getByRole("button", { name: /Vendors/ }).click();
    await page.getByRole("button", { name: /create project/i }).click();
    await expect(page).toHaveURL(/step=1$/);
    await expect(page.getByText("Add at least one RFP document.").last()).toBeVisible();
    await expect(page.getByLabel("Project name")).toHaveValue(NAME); // kept across the steps

    // The first RFP upload saves the draft
    await page
      .getByLabel("Description")
      .fill("Four drive-through cargo scanners. Tender NGPA/T/2026/014.");
    await page.getByLabel("Submission deadline").fill(deadline);
    await page.locator("input[type=file]").setInputFiles(RFP_PDF);
    const docs = page.getByRole("list", { name: "Uploaded RFP documents" });
    await expect(docs.getByText("01-RFP-NGPA-T-2026-014.pdf")).toBeVisible({ timeout: 20_000 });
    await expect(docs.getByText("AI-readable")).toBeVisible();
    await expect(page).toHaveURL(/\/projects\/new\?id=prj_[^&]+&step=1/);
    await expect(page.getByText(/PRJ-\d{4}-001 · Draft saved/)).toBeVisible();

    // A reload resumes the same draft on the same step
    await page.reload();
    await expect(page.getByRole("list", { name: "Uploaded RFP documents" })).toContainText(
      "01-RFP-NGPA-T-2026-014.pdf",
    );
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 2 · Standards — active standard pre-selected, inactive one hidden and unselected
    await expect(page).toHaveURL(/step=2/);
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
    // A new standard on the spot, its rules dropped as a CSV file
    await page.getByRole("button", { name: "New standard" }).click();
    const std = page.getByRole("dialog", { name: "New standard" });
    await std.getByLabel("Code").fill("CTS-2026");
    await std.getByLabel("Title").fill("Customs Transit Security Standard");
    await std.locator("input[type=file]").setInputFiles(RULES_CSV);
    await expect(std.getByRole("region", { name: "Rules found" })).toContainText("TR-12", {
      timeout: 20_000,
    });
    await std.getByRole("button", { name: "Create standard" }).click();
    await expect(std).toBeHidden({ timeout: 20_000 });
    await expect(page.getByRole("checkbox", { name: /CTS-2026/ })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    // Its card counts the rules dropped with it, not the 0 it had a moment before (user report)
    await expect(page.getByText("12 rules · 6 mandatory")).toBeVisible();
    await page.getByRole("button", { name: "Continue" }).click();

    // Step 3 · Vendors — one vendor with its two envelopes, then create the project
    await expect(page).toHaveURL(/step=3/);
    const form = page.getByRole("region", { name: "Add a vendor" });
    await form.getByRole("button", { name: "Save vendor" }).click();
    await expect(form.getByText("Enter the vendor's company name.")).toBeVisible();
    await form.getByLabel("Company name").fill("Harborline Systems");
    const inputs = form.locator("input[type=file]");
    await inputs.nth(0).setInputFiles(COMMERCIAL);
    await inputs.nth(1).setInputFiles(TECHNICAL);
    await form.getByRole("button", { name: "Save vendor" }).click();
    await expect(page.getByRole("list", { name: "Vendors added" })).toContainText(
      "Harborline Systems",
      { timeout: 30_000 },
    );
    await page.getByRole("button", { name: "Create project" }).click();

    // The project: open, fields kept, standards applied, the vendor in, AI analysis ready
    await expect(page).toHaveURL(/\/projects\/prj_[^/?]+$/);
    await expect(page.getByRole("heading", { level: 1, name: NAME })).toBeVisible();
    await expect(page.getByText("Open for proposals", { exact: true }).first()).toBeVisible();
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
    await expect(page.getByRole("link", { name: /CTS-2026/ })).toBeVisible();
    await expect(page.getByRole("button", { name: "Run AI analysis" })).toBeEnabled();
    // Only Overview and Proposals: the AI analysis has its own page
    await expect(page.getByRole("link", { name: "Evaluation" })).toHaveCount(0);

    await page
      .getByRole("link", { name: /Proposals/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/proposals$/);
    await expect(page.getByRole("table", { name: /Proposals received/ })).toContainText(
      "Harborline Systems",
    );

    // The standards library shows the new standard with its rules (no stale "0 rules")
    await page.getByRole("link", { name: "Standards", exact: true }).first().click();
    await expect(page.getByRole("article").filter({ hasText: "CTS-2026" })).toContainText(
      "12 rules",
    );

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
    await expect(page.getByText(/still being set up/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Continue setup" })).toBeVisible();
    // No AI analysis for a project that is not created yet
    await expect(page.getByRole("button", { name: "Run AI analysis" })).toHaveCount(0);

    // Edit details
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    const dlg = page.getByRole("dialog");
    await dlg.getByLabel("Project name").fill("Mobile Harbour Cranes (2 units)");
    await dlg.getByRole("button", { name: "Save changes" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Mobile Harbour Cranes (2 units)" }),
    ).toBeVisible();

    // Category filter (user decision 2026-10-21): CITS-2026 (IT & security) was pre-selected
    // because a new project is General; switching to Safety & environment drops it.
    await expect(page.getByRole("link", { name: /CITS-2026/ })).toBeVisible();
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await page.getByRole("dialog").getByRole("combobox").click();
    await page.getByRole("option", { name: "Safety & environment" }).click();
    await expect(page.getByRole("dialog")).toContainText(
      "removes this applied standard: CITS-2026",
    );
    await page.getByRole("dialog").getByRole("button", { name: "Save changes" }).click();
    await expect(
      page.getByText("None. Proposals will be checked against the RFP only."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Edit standards" }).click();
    await expect(page.getByRole("dialog")).toContainText("1 standard is hidden");
    await expect(page.getByRole("dialog").getByRole("checkbox", { name: /CITS-2026/ })).toHaveCount(
      0,
    );
    await page.keyboard.press("Escape");

    // Archive → read-only → restore
    await page.getByRole("button", { name: "More actions" }).click();
    await page.getByRole("menuitem", { name: "Archive project" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Archive project" }).click();
    await expect(page.getByText(/archived.*read-only/)).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Restore" }).click();
    await expect(page.getByText(/still being set up/)).toBeVisible();

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
