import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

// Issue 33 component interactions, not an end-to-end claim for Li's unmounted route.
// Reuse a local Playwright installation; do not change shared package ownership.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.ISSUE33_PLAYWRIGHT_MODULE || "playwright");
const directory = path.dirname(fileURLToPath(import.meta.url));
const repository = path.resolve(directory, "../../../..");
const evidence = process.env.ISSUE33_EVIDENCE_DIR;
const output = await build({
  configFile: false,
  root: repository,
  logLevel: "error",
  define: { "process.env.NODE_ENV": '"production"' },
  resolve: { alias: [{ find: "@", replacement: path.join(repository, "src") }] },
  plugins: [{
    name: "issue33-router-boundary",
    enforce: "pre",
    resolveId(id) { if (id === "next/navigation") return "\0issue33-navigation"; },
    load(id) { if (id === "\0issue33-navigation") return "export function useRouter(){return {refresh(){window.manualAttendanceTest.refreshes += 1;}}}"; },
  }],
  build: {
    write: false, minify: false,
    lib: { entry: path.join(directory, "browser-fixture.tsx"), name: "Issue33Fixture", formats: ["iife"] },
  },
});
const bundle = (Array.isArray(output) ? output[0] : output).output.find((item) => item.type === "chunk").code;
const stylesheet = (Array.isArray(output) ? output[0] : output).output.find((item) => item.type === "asset" && item.fileName.endsWith(".css"))?.source ?? "";
const server = createServer((request, response) => {
  response.setHeader("Cache-Control", "no-store");
  if (request.url === "/fixture.js") {
    response.setHeader("Content-Type", "text/javascript");
    response.end(bundle);
    return;
  }
  if (request.url === "/fixture.css") {
    response.setHeader("Content-Type", "text/css");
    response.end(stylesheet);
    return;
  }
  response.setHeader("Content-Type", "text/html");
  response.end('<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Issue 33 fictional interaction fixture</title><link rel="stylesheet" href="/fixture.css"><style>body{max-width:850px;margin:24px auto;padding:0 16px}</style></head><body><main><div id="root"></div></main><script src="/fixture.js"></script></body></html>');
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
let browser;
let page;
const errors = [];
const base = `http://127.0.0.1:${server.address().port}`;
const recordOne = "33000000-0000-4000-8000-000000000011";
const recordTwo = "33000000-0000-4000-8000-000000000012";
let checks = 0;

async function check(label, action) { await action(); checks += 1; console.log(`PASS ${label}`); }
async function mount(options = {}) {
  await page.evaluate((value) => window.manualAttendanceTest.mount(value), options);
  await page.getByRole("button", { name: "Add attendance", exact: true }).waitFor();
}
async function submitCreate() {
  await page.getByLabel("Participant email").fill("river@example.test");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Add attendance", exact: true }).click();
  await page.waitForFunction(() => window.manualAttendanceTest.calls.length > 0);
}
async function settle(state) {
  await page.evaluate((value) => window.manualAttendanceTest.settle(value), state);
  await page.waitForFunction(() => !document.querySelector('[data-submit-state="pending"]'));
}
async function expectFocusedSummary() {
  await page.waitForFunction(() => document.activeElement?.getAttribute("role") === "alert");
}

try {
  browser = await chromium.launch({ channel: process.env.ISSUE33_BROWSER_CHANNEL || "chrome", headless: true });
  page = await browser.newPage({ viewport: { width: 1280, height: 1050 } });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(base);
  await page.getByRole("heading", { name: "Manual attendance" }).waitFor();

  await check("empty state allows manual create but not correction", async () => {
    await mount({ empty: true });
    assert.equal(await page.getByText(/No attendance records yet/).count(), 1);
    assert.equal(await page.locator('option[value="correct"]').isDisabled(), true);
  });

  await check("pending blocks double-click and repeated programmatic submit", async () => {
    await mount();
    await submitCreate();
    assert.equal(await page.getByRole("button", { name: "Saving attendance…" }).isDisabled(), true);
    assert.equal(await page.getByLabel("Participant email").isDisabled(), true);
    await page.locator("form").evaluate((form) => { form.requestSubmit(); form.requestSubmit(); });
    assert.equal(await page.evaluate(() => window.manualAttendanceTest.calls.length), 1);
    const fields = await page.evaluate(() => window.manualAttendanceTest.calls[0]);
    assert.deepEqual(fields, { operation: "create", email: "river@example.test", confirmation: "confirmed" });
    await settle({ status: "validation", errors: [{ field: "email", message: "First fictional validation failure." }] });
  });

  await check("consecutive validation submissions refocus summary and preserve values", async () => {
    await expectFocusedSummary();
    assert.equal(await page.getByLabel("Participant email").inputValue(), "river@example.test");
    assert.equal(await page.getByRole("checkbox").isChecked(), false);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Add attendance", exact: true }).click();
    await page.waitForFunction(() => window.manualAttendanceTest.calls.length === 2);
    await settle({ status: "validation", errors: [{ field: "email", message: "Second fictional validation failure." }] });
    await expectFocusedSummary();
    await page.getByRole("link", { name: "Second fictional validation failure." }).click();
    assert.equal(await page.getByLabel("Participant email").evaluate((input) => document.activeElement === input), true);
    assert.equal(await page.getByLabel("Participant email").inputValue(), "river@example.test");
  });

  await check("confirmation resets when the participant or operation changes", async () => {
    await page.getByRole("checkbox").check();
    await page.getByLabel("Participant email").fill("taylor@example.test");
    assert.equal(await page.getByRole("checkbox").isChecked(), false);
    await page.getByRole("checkbox").check();
    await page.getByLabel("Operation", { exact: true }).selectOption("correct");
    assert.equal(await page.getByRole("checkbox").isChecked(), false);
    await page.getByLabel("Attendance record").selectOption(recordOne);
    await page.getByRole("checkbox").check();
    await page.getByLabel("Attendance record").selectOption(recordTwo);
    assert.equal(await page.getByRole("checkbox").isChecked(), false);
  });

  await check("void submits exact microsecond version and no fabricated audit fields", async () => {
    await page.getByLabel("Attendance record").selectOption(recordOne);
    assert.equal(await page.getByText(/Original method: QR/).count(), 1);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Void attendance", exact: true }).click();
    await page.waitForFunction(() => window.manualAttendanceTest.calls.length === 3);
    const fields = await page.evaluate(() => window.manualAttendanceTest.calls[2]);
    assert.deepEqual(fields, {
      operation: "correct", recordId: recordOne,
      expectedUpdatedAt: "2026-09-28T08:05:00.123456+00:00", targetStatus: "voided", confirmation: "confirmed",
    });
    await settle({ status: "success", eventId: "33000000-0000-4000-8000-000000000001", updatedAt: "2026-09-28T08:15:00.654321+00:00" });
    assert.equal(await page.getByRole("button", { name: "Void attendance", exact: true }).isDisabled(), true);
    assert.equal(await page.evaluate(() => window.manualAttendanceTest.updates.length), 1);
  });

  await check("only new server props enable a fresh correction and reset confirmation", async () => {
    await page.evaluate(() => window.manualAttendanceTest.updateRecords());
    const button = page.getByRole("button", { name: "Restore attendance", exact: true });
    await button.waitFor();
    assert.equal(await button.isDisabled(), false);
    assert.equal(await page.getByRole("checkbox").isChecked(), false);
    await page.getByRole("checkbox").check();
    await button.click();
    await page.waitForFunction(() => window.manualAttendanceTest.calls.length === 4);
    assert.equal(await page.evaluate(() => window.manualAttendanceTest.calls[3].targetStatus), "confirmed");
    assert.equal(await page.evaluate(() => window.manualAttendanceTest.calls[3].expectedUpdatedAt), "2026-09-28T08:15:00.654321+00:00");
    await settle({ status: "conflict" });
    assert.equal(await page.getByRole("button", { name: "Restore attendance", exact: true }).isDisabled(), true);
    assert.equal(await page.evaluate(() => window.manualAttendanceTest.refreshes), 1);
    await expectFocusedSummary();
  });

  for (const [status, message] of [
    ["duplicate", "Attendance already exists"], ["unavailable", "event or participant is unavailable"],
    ["system-error", "Attendance could not be saved"], ["permission-denied", "do not have permission"],
    ["unauthenticated", "Sign in again"],
  ]) {
    await check(`${status} action response becomes accessible client feedback`, async () => {
      await mount(); await submitCreate(); await settle({ status }); await expectFocusedSummary();
      assert.equal(await page.getByRole("alert").filter({ hasText: message }).count(), 1);
      if (["permission-denied", "unauthenticated"].includes(status)) {
        assert.equal(await page.locator("fieldset").count(), 0);
        assert.equal(await page.getByText("Fictional Spring Social", { exact: true }).count(), 0);
      } else {
        assert.equal(await page.getByLabel("Participant email").inputValue(), "river@example.test");
      }
    });
  }

  await check("transport rejection is safe and preserves fields for recovery", async () => {
    await mount(); await submitCreate();
    await page.evaluate(() => window.manualAttendanceTest.reject());
    await page.getByRole("alert").filter({ hasText: "Attendance could not be saved" }).waitFor();
    assert.equal(await page.getByLabel("Participant email").inputValue(), "river@example.test");
    assert.equal(await page.getByRole("button", { name: "Add attendance", exact: true }).isDisabled(), false);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Add attendance", exact: true }).click();
    await page.waitForFunction(() => window.manualAttendanceTest.calls.length === 2);
    await settle({ status: "success", eventId: "33000000-0000-4000-8000-000000000001", updatedAt: "2026-09-28T08:15:00.654321+00:00" });
    assert.equal(await page.evaluate(() => window.manualAttendanceTest.updates.length), 1);
  });

  await check("rolled-back system error allows reconfirming the same correction version", async () => {
    await mount();
    await page.getByLabel("Operation", { exact: true }).selectOption("correct");
    await page.getByLabel("Attendance record").selectOption(recordOne);
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Void attendance", exact: true }).click();
    await page.waitForFunction(() => window.manualAttendanceTest.calls.length === 1);
    await settle({ status: "system-error" });
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Void attendance", exact: true }).click();
    await page.waitForFunction(() => window.manualAttendanceTest.calls.length === 2);
    const commands = await page.evaluate(() => window.manualAttendanceTest.calls);
    assert.deepEqual(commands[0], commands[1]);
    await settle({ status: "success", eventId: "33000000-0000-4000-8000-000000000001", updatedAt: "2026-09-28T08:15:00.654321+00:00" });
    assert.equal(await page.evaluate(() => window.manualAttendanceTest.updates.length), 1);
  });

  await check("success refreshes the connected router even when cache invalidation failed", async () => {
    await mount({ connected: true }); await submitCreate();
    await settle({ status: "success", eventId: "33000000-0000-4000-8000-000000000001", updatedAt: "2026-09-28T08:15:00.654321+00:00", refreshRequired: true });
    assert.equal(await page.evaluate(() => window.manualAttendanceTest.refreshes), 1);
    assert.equal(await page.getByText(/write succeeded, but the page cache/).count(), 1);
    assert.equal(await page.getByRole("button", { name: "Add attendance", exact: true }).isDisabled(), true);
    await page.getByLabel("Participant email").fill("taylor@example.test");
    assert.equal(await page.getByRole("button", { name: "Add attendance", exact: true }).isDisabled(), false);
  });

  if (evidence) {
    await mkdir(evidence, { recursive: true });
    await mount();
    await page.getByLabel("Operation", { exact: true }).selectOption("correct");
    await page.getByLabel("Attendance record").selectOption(recordOne);
    await page.screenshot({ path: path.join(evidence, "manual-attendance-desktop.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(evidence, "manual-attendance-mobile.png"), fullPage: true });
  }
  assert.deepEqual(errors, [], "Browser console/page errors");
  console.log(`Issue 33: ${checks} real-browser interaction checks passed.`);
} catch (error) {
  if (errors.length) console.error("Fictional fixture browser errors:", errors);
  throw error;
} finally {
  await browser?.close();
  await new Promise((resolve) => server.close(resolve));
}
