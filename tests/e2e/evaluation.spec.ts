import { expect, test, type Page } from "@playwright/test";

/** Sample data loaded, returns the two sample tenders. */
async function sampleTenders(page: Page) {
  await page.request.post("/api/dev/reset", { data: { confirm: "RESET" } });
  await page.request.put("/api/settings", {
    data: { customerName: "Layla Mansour", organization: "NGPA", onboarded: true },
  });
  expect((await page.request.post("/api/dev/seed")).ok()).toBe(true);
  const projects = (await (await page.request.get("/api/projects")).json()) as {
    id: string;
    code: string;
    name: string;
  }[];
  return {
    xray: projects.find((p) => p.name.startsWith("Cargo X-Ray"))!,
    pcs: projects.find((p) => p.name.startsWith("Port Community System"))!,
  };
}

/** P6 + P7 with the mock AI (MOCK_STEP_MS = 400). */
test.describe("analysis pipeline and live progress (P6, P7)", () => {
  test("start → mission control → pill + toast → ranking; cancel and resume", async ({ page }) => {
    const { xray } = await sampleTenders(page);

    // Proposals tab → Analyse & process → mission control on the Evaluation tab
    await page.goto(`/projects/${xray.id}/proposals`);
    const panel = page.getByRole("region", { name: /Analyse & process/ });
    await expect(panel).toContainText("14 (3 × 4 + 2)");
    await panel.getByRole("button", { name: "Analyse & process" }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${xray.id}/evaluation`));
    const mission = page.getByRole("region", { name: "Evaluating 4 proposals" });
    await expect(mission).toBeVisible();
    await expect(mission.getByText(/Step \d+ of 14/)).toBeVisible();
    await expect(mission.getByRole("progressbar", { name: "Analysis progress" })).toBeVisible();
    await expect(mission.getByRole("list", { name: "Phases" })).toContainText("Checklist");

    // Leave the page: the top-bar pill follows the run, and the toast announces the end
    await page.getByRole("link", { name: "Overview" }).click();
    const pill = page.getByRole("banner").getByRole("link", { name: /\d+\/14/ });
    await expect(pill).toBeVisible();
    await expect(page.getByText(`Analysis complete · ${xray.code}`)).toBeVisible({
      timeout: 60_000,
    });
    await expect(pill).toHaveCount(0);
    await page.getByRole("button", { name: "View results" }).click();
    await expect(page).toHaveURL(new RegExp(`/projects/${xray.id}/evaluation`));

    // Finished: ranking with all four vendors, scores and risk; the project is evaluated
    await expect(page.getByRole("heading", { name: "Analysis complete" })).toBeVisible();
    const ranking = page.getByRole("region", { name: "Ranking" });
    await expect(ranking.getByRole("row")).toHaveCount(5); // header + 4 vendors
    await expect(ranking).toContainText("Meridian Scan Technologies");
    await expect(ranking).toContainText(/\d+(\.\d)?%/);
    await expect(page.getByText("14 of 14 steps finished")).toBeVisible();

    // Per-vendor results: Compliance tab with numbered findings
    await ranking.getByRole("link", { name: "Open Meridian Scan Technologies" }).click();
    await page.getByRole("tab", { name: "Compliance" }).click();
    await expect(page.getByText("weighted compliance")).toBeVisible();
    await page.getByRole("tab", { name: "Risk" }).click();
    await expect(page.getByText("Overall risk of awarding to this vendor")).toBeVisible();

    // Run again, cancel it, then resume to completion
    await page.goto(`/projects/${xray.id}/evaluation`);
    await page.getByRole("button", { name: "Run again" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "Analysis cancelled" })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: "Resume" }).click();
    await expect(page.getByRole("heading", { name: "Analysis complete" })).toBeVisible({
      timeout: 60_000,
    });
  });

  test("generate proposals with AI (mock writer, real DOCX + PDF)", async ({ page }) => {
    const { pcs } = await sampleTenders(page);
    await page.goto(`/projects/${pcs.id}/proposals`);
    await page.getByRole("button", { name: "Generate with AI" }).click();
    const dialog = page.getByRole("dialog", { name: "Generate proposals with AI" });
    await expect(dialog).toContainText("free (demo AI)");
    await dialog.getByLabel(/^Budget/).click(); // leave only "Strong"
    await dialog.getByRole("button", { name: "Generate 1" }).click();
    await expect(dialog.getByText("Submitted")).toBeVisible({ timeout: 60_000 });
    await dialog.getByRole("button", { name: "Done" }).click();
    const table = page.getByRole("table");
    await expect(table.getByRole("row")).toHaveCount(2); // header + 1
    await table.getByRole("link", { name: /^View / }).click();
    const reader = page.getByRole("dialog");
    await expect(reader.getByRole("img", { name: /Financial-Proposal\.pdf, page 1/ })).toBeVisible({
      timeout: 20_000,
    });
    await expect(reader).toContainText("Financial proposal (Envelope 2)");
    await reader.getByRole("tab", { name: "Technical" }).click();
    await expect(reader.getByRole("img", { name: /Technical-Proposal\.docx, page 1/ })).toBeVisible(
      {
        timeout: 20_000,
      },
    );
  });
});
