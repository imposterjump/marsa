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

/** P8 AI analysis with the mock AI (MOCK_STEP_MS = 400). */
test.describe("AI analysis and its results page (P7, P8)", () => {
  test("run → mission control → pill + toast → results tabs; run again, cancel, resume; AI quality", async ({
    page,
  }) => {
    test.setTimeout(120_000); // one long journey: two runs, every tab, the reader and a review
    const { xray } = await sampleTenders(page);

    // Proposals tab → AI analysis panel → the results page, where mission control shows the run
    await page.goto(`/projects/${xray.id}/proposals`);
    const panel = page.getByRole("region", { name: "AI analysis" });
    await expect(panel).toContainText("14 (3 × 4 + 2)");
    await panel.getByRole("button", { name: "Run AI analysis" }).click();
    // A fresh test server parses the sample PDFs as the run starts; the first route load can lag.
    await expect(page).toHaveURL(new RegExp(`/analysis/${xray.id}\\?run=`), { timeout: 30_000 });
    // Its own full-width page: the sidebar collapses here
    await expect(page.locator("html")).toHaveAttribute("data-sidebar", "collapsed");
    const mission = page.getByRole("region", { name: "Evaluating 4 proposals" });
    await expect(mission).toBeVisible();
    await expect(mission.getByText(/Step \d+ of 14/)).toBeVisible();
    await expect(mission.getByRole("progressbar", { name: "Analysis progress" })).toBeVisible();
    await expect(mission.getByRole("list", { name: "Phases" })).toContainText("Standards");

    // Leave the page: the sidebar comes back, the top-bar pill follows the run, a toast ends it
    await page
      .getByRole("navigation", { name: "Breadcrumb" })
      .getByRole("link", { name: xray.code })
      .click();
    await expect(page).toHaveURL(new RegExp(`/projects/${xray.id}$`));
    await expect(page.locator("html")).not.toHaveAttribute("data-sidebar", "collapsed");
    const pill = page.getByRole("banner").getByRole("link", { name: /\d+\/14/ });
    await expect(pill).toBeVisible();
    await expect(page.getByText(`Analysis complete · ${xray.code}`)).toBeVisible({
      timeout: 60_000,
    });
    await expect(pill).toHaveCount(0);
    await page.getByRole("button", { name: "View results" }).click();
    await expect(page).toHaveURL(new RegExp(`/analysis/${xray.id}`));

    // Overview: the recommended vendor and every vendor's numbers
    await expect(page.getByRole("tab", { name: "Overview", selected: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("14 of 14 steps")).toBeVisible();
    const hero = page.getByRole("region", { name: "Recommended vendor" });
    await expect(hero).toContainText("Rank 1 of 4");
    await expect(hero).toContainText("AI-generated");
    await expect(page.getByRole("heading", { name: "Standards compliance" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "RFP compliance" })).toBeVisible();
    await expect(page.getByRole("list", { name: "Meridian Scan Technologies: rules" })).toContainText(
      "compliant",
    );

    // RFP and Standards tabs, each with its own section cards (sections without points listed
    // once at the end); one row per vendor, points behind the dropdown
    await expect(page.getByRole("tab", { name: "Compliance" })).toHaveCount(0);
    await page.getByRole("tab", { name: "RFP" }).click();
    await expect(page).toHaveURL(/tab=rfp/);
    const sections = page.locator("section[id^=sec-]");
    await expect(sections.first()).toBeVisible();
    const meridian = page.locator("section[id^=sec-] li > button", {
      hasText: "Meridian Scan Technologies",
    });
    for (let i = 0; i < (await meridian.count()); i++) await meridian.nth(i).click();
    // Each dropdown groups the points by status: one pill per status, one group shown at a time
    const pills = page.getByRole("radiogroup", { name: "Meridian Scan Technologies: show points" }).first();
    await expect(pills.getByRole("radio")).toHaveCount(4);
    await expect(pills.getByRole("radio", { checked: true })).toHaveCount(1);
    // An RFP clause opens the reader on the RFP
    await page
      .getByRole("button", { name: /01-RFP-NGPA-T-2026-014\.pdf/ })
      .first()
      .click();
    const reader = page.getByRole("dialog");
    await expect(reader.getByRole("tab", { name: "RFP", selected: true })).toBeVisible({
      timeout: 20_000,
    });
    await page.keyboard.press("Escape");
    await expect(page).not.toHaveURL(/reader=/);
    // The Standards tab: a standard rule links to the rule in its standard
    await page.getByRole("tab", { name: "Standards" }).click();
    await expect(page).toHaveURL(/tab=standards/);
    for (let i = 0; i < (await meridian.count()); i++) await meridian.nth(i).click();
    const rule = page.getByRole("link", { name: /CITS-2026 SEC-\d+/ }).first();
    const ruleCode = ((await rule.textContent()) ?? "").match(/SEC-\d+/)![0];
    await rule.click();
    await expect(page).toHaveURL(new RegExp(`/standards/.+\\?rule=${ruleCode}`));
    await expect(page.locator(`#rule-${ruleCode}`)).toBeVisible();
    await page.goBack();

    // A spreadsheet clause opens highlighted across the whole row, and the highlight stays put
    // (pages rebuilt on every render once made it re-highlight ~1,800 times a second, G-72).
    const detail = (await (await page.request.get(`/api/projects/${xray.id}`)).json()) as {
      rfpDocuments: { id: string; originalName: string }[];
    };
    const annexB = detail.rfpDocuments.find((d) => d.originalName.endsWith(".xlsx"))!;
    await page.goto(
      `/analysis/${xray.id}?tab=rfp&reader=${annexB.id}&q=${encodeURIComponent(
        "TB-24 Software Hosting of all components (incl. licensing, telemetry, updates)",
      )}`,
    );
    await expect(page.locator("mark.marsa-hit").first()).toBeVisible({ timeout: 20_000 });
    expect(await page.locator("mark.marsa-hit").count()).toBeGreaterThanOrEqual(3);
    const churn = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let n = 0;
          const obs = new MutationObserver((ms) => {
            for (const m of ms) for (const x of m.addedNodes) if (x.nodeName === "MARK") n++;
          });
          obs.observe(document.body, { childList: true, subtree: true });
          setTimeout(() => {
            obs.disconnect();
            resolve(n);
          }, 1500);
        }),
    );
    expect(churn).toBe(0);
    await page.keyboard.press("Escape");

    // Risks: a 0–100 score per vendor, then the same numbered sections
    await page.getByRole("tab", { name: "Risks" }).click();
    await expect(page.getByRole("region", { name: "Risk scores" })).toContainText("/100");
    await expect(page.locator("section[id^=risk-]").first()).toBeVisible();
    // A risk links to what it is about, and to its section's points in Compliance
    const riskRow = page.locator("section[id^=risk-] li > button[aria-expanded]").first();
    await riskRow.click();
    await page.getByRole("button", { name: "View more" }).first().click();
    await page.getByRole("button", { name: /see its points/ }).first().click();
    await expect(page).toHaveURL(/tab=(rfp|standards)/);
    await page.getByRole("tab", { name: "Risks" }).click();

    // Comparison (pricing-page table): one column per picked vendor, one row per aspect
    await page.getByRole("tab", { name: "Comparison" }).click();
    await expect(page.getByRole("button", { name: "Pick at least 2 vendors" })).toBeDisabled();
    await page.getByRole("checkbox", { name: "Compare Meridian Scan Technologies" }).click();
    await page.getByRole("checkbox", { name: "Compare Harborline Systems" }).click();
    await page.getByRole("button", { name: "Compare 2 vendors" }).click();
    const table = page.getByRole("table", { name: "Vendor comparison" });
    await expect(table.getByRole("columnheader")).toHaveCount(3);
    await expect(table.getByRole("columnheader", { name: /Meridian Scan Technologies/ })).toBeVisible();
    await expect(table.getByRole("columnheader", { name: /Harborline Systems/ })).toBeVisible();
    await expect(table.getByRole("rowheader", { name: "Risk score" })).toBeVisible();
    await expect(table.getByText("Best in this row").first()).toBeAttached();
    // A section row opens the points where the two differ, in the same columns
    const sectionRow = table.getByRole("button", { name: /differences? of \d+/ }).first();
    await sectionRow.click();
    await expect(sectionRow).toHaveAttribute("aria-expanded", "true");

    // Run a new analysis, cancel it, then resume to completion
    await page.getByRole("button", { name: "Run a new analysis" }).click();
    await expect(page.getByRole("region", { name: "Evaluating 4 proposals" })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("Analysis cancelled", { exact: true })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole("button", { name: "Resume" }).click();
    await expect(page.getByText("Analysis complete", { exact: true })).toBeVisible({
      timeout: 60_000,
    });
    await page.getByRole("button", { name: /Latest analysis/ }).click();
    await expect(page.getByRole("menuitem")).toHaveCount(2);
    await page.keyboard.press("Escape");

    // AI quality: the run's report, and a human review saved with it
    await page.getByRole("tab", { name: "AI quality" }).click();
    await expect(page.getByText("Confidence score")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Files scanned")).toBeVisible();
    await expect(page.getByText("16 / 16")).toBeVisible(); // processed correctly
    await page
      .getByRole("radiogroup", { name: "Overall rating" })
      .getByRole("radio", { name: "4 of 5" })
      .click();
    await page.getByRole("radio", { name: "Trust with corrections" }).click();
    await page.getByLabel("Comments").fill("Two partial findings needed corrections.");
    await page.getByRole("button", { name: "Submit review" }).click();
    await expect(page.getByText("Review saved")).toBeVisible();
    await expect(page.getByText("Reviews of this run (1)")).toBeVisible();
    const exported = await (await page.request.get("/api/reviews/export")).json();
    expect(exported.reviews).toHaveLength(1);
    expect(exported.reviews[0]).toMatchObject({ overall: 4, verdict: "trust_with_edits" });

    // The old Evaluation and AI review addresses lead here
    await page.goto(`/projects/${xray.id}/evaluation`);
    await expect(page).toHaveURL(new RegExp(`/analysis/${xray.id}$`));
    await page.goto(`/projects/${xray.id}/ai-review`);
    await expect(page).toHaveURL(new RegExp(`/analysis/${xray.id}\\?tab=quality$`));
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
