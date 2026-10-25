import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

/**
 * Building works tenders (2026-10-25): the fictional tender of test-inputs/works-tender imported
 * through the import API (as the dialog does), analysed with the demo AI, then the results page:
 * the works sections and the Prices tab.
 */
const TENDER = path.join(
  process.cwd(),
  "test-inputs",
  "works-tender",
  "مناقصة صيانة مبنى مركز خدمات المتعاملين - تجريبية",
);

function files(root: string) {
  const base = path.dirname(root);
  const out: { path: string; abs: string }[] = [];
  const walk = (p: string) => {
    if (fs.statSync(p).isDirectory()) for (const e of fs.readdirSync(p)) walk(path.join(p, e));
    else out.push({ path: path.relative(base, p).split(path.sep).join("/"), abs: p });
  };
  walk(root);
  return out;
}

async function importTender(page: Page) {
  await page.request.post("/api/dev/reset", { data: { confirm: "RESET" } });
  await page.request.put("/api/settings", {
    data: { customerName: "Layla Mansour", organization: "DPW", onboarded: true },
  });
  const { id } = await (await page.request.post("/api/imports")).json();
  for (const f of files(TENDER)) {
    const res = await page.request.post(`/api/imports/${id}/files`, {
      multipart: {
        path: f.path,
        file: {
          name: path.basename(f.abs),
          mimeType: "application/octet-stream",
          buffer: fs.readFileSync(f.abs),
        },
      },
    });
    expect(res.ok()).toBe(true);
  }
  const preview = await (await page.request.post(`/api/imports/${id}/scan`)).json();
  expect(preview.estimate.amount).toBe(310000);
  expect(preview.rounds[0].vendors).toHaveLength(3);
  const res = await page.request.post(`/api/imports/${id}/commit`, {
    data: {
      name: "Customer centre maintenance (E2E)",
      category: "Construction & maintenance",
      round: "opening",
      estimateAmount: 310000,
      estimateCurrency: "AED",
    },
  });
  expect(res.status()).toBe(201);
  return (await res.json()).projectId as string;
}

test.describe("building works tenders (import, prices)", () => {
  test("import → demo analysis → works sections and the Prices tab", async ({ page }) => {
    test.setTimeout(120_000);
    const projectId = await importTender(page);

    // The project: open, its three companies, ready to analyse.
    await page.goto(`/projects/${projectId}/proposals`);
    await expect(page.getByText("Al Wadi Building Contracting LLC")).toBeVisible();
    await expect(page.getByText("Coastline Engineering & Maintenance LLC")).toBeVisible();

    const run = await (await page.request.post(`/api/projects/${projectId}/runs`)).json();
    await expect
      .poll(async () => (await (await page.request.get(`/api/runs/${run.id}`)).json()).run.status, {
        timeout: 60_000,
      })
      .toBe("completed");

    // RFP tab: the building works sections.
    await page.goto(`/analysis/${projectId}?tab=rfp`);
    await expect(page.getByText("Priced bill of quantities").first()).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("Bid bond & guarantees").first()).toBeVisible();

    // Prices tab: the bids ranked, the estimate, the line-by-line table.
    await page.goto(`/analysis/${projectId}?tab=prices`);
    const tab = page.getByRole("tab", { name: "Prices" });
    await expect(tab).toBeVisible({ timeout: 20_000 });
    await expect(tab).toHaveAttribute("aria-selected", "true");
    const main = page.locator("main");
    await expect(main).toContainText("310,000");
    await expect(main).toContainText("219,120");
    await expect(main).toContainText("801,420");
    await expect(main).toContainText("1 added line"); // Coastline's own extra line
    await expect(main).not.toContainText("$");
  });

  test("Import tender: choose the folder, check the preview, import", async ({ page }) => {
    test.setTimeout(90_000);
    await page.request.post("/api/dev/reset", { data: { confirm: "RESET" } });
    await page.request.put("/api/settings", { data: { onboarded: true } });
    await page.goto("/projects");
    await page.getByRole("button", { name: "Import tender" }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.locator('input[type="file"][webkitdirectory]').setInputFiles(TENDER);
    // The preview: the estimate read from the internal approval, three companies.
    await expect(dialog.getByRole("textbox", { name: /Cost estimate/ })).toHaveValue(/310,000/, {
      timeout: 60_000,
    });
    await expect(dialog).toContainText("Coastline Engineering & Maintenance LLC");
    await expect(dialog).toContainText("1 duplicate file left out");
    await dialog.getByRole("button", { name: "Import tender" }).click();
    await expect(page).toHaveURL(/\/projects\/prj_/, { timeout: 60_000 });
    const project = page.url().split("/projects/")[1].split(/[/?]/)[0];
    const detail = await (await page.request.get(`/api/projects/${project}`)).json();
    expect(detail).toMatchObject({
      category: "Construction & maintenance",
      estimateAmount: 310000,
    });
  });

  test("an IT tender has no Prices tab", async ({ page }) => {
    await page.request.post("/api/dev/reset", { data: { confirm: "RESET" } });
    await page.request.put("/api/settings", { data: { onboarded: true } });
    expect((await page.request.post("/api/dev/seed")).ok()).toBe(true);
    const projects = (await (await page.request.get("/api/projects")).json()) as {
      id: string;
      name: string;
    }[];
    const xray = projects.find((p) => p.name.startsWith("Cargo X-Ray"))!;
    const boq = await (await page.request.get(`/api/projects/${xray.id}/boq`)).json();
    expect(boq.comparison).toBeNull();
  });
});
