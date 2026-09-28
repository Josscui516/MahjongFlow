// Local fictional acceptance only. Credentials stay in memory and are never
// written to fixtures, traces, screenshots, logs or browser storage-state files.
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";

const base = "http://127.0.0.1:4337";
const url = process.env.ISSUE35_LOCAL_URL;
if (url !== "http://127.0.0.1:45321") throw new Error("Dedicated local fixture stack required");
const evidence = resolve(process.env.DINNER_EVIDENCE_DIR || "tmp/dinner-evidence");
mkdirSync(evidence, { recursive: true });
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(url, process.env.ISSUE35_LOCAL_FIXTURE_KEY, options);
const client = () => createClient(url, process.env.ISSUE35_LOCAL_PUBLIC_KEY, options);
const accounts = [];
const eventId = randomUUID(), emptyEventId = randomUUID(), participantId = randomUUID(), otherId = randomUUID();
const checks = [], pageErrors = [], consoleErrors = [];
let browser, server, page, stage = "initialisation", actionId;
function checkDb(error) { if (error) throw new Error("Fictional fixture operation failed"); }
function sql(input) {
  try { return execFileSync("docker", ["exec", "-i", "supabase_db_MahjongFlow", "psql", "-U", "postgres", "-d", "postgres", "-At", "-v", "ON_ERROR_STOP=1"], { input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }); }
  catch { throw new Error("Fictional SQL operation failed"); }
}
async function check(name, run) { stage = name; await run(); checks.push(name); console.log(`PASS ${name}`); }
async function login(page, account) {
  await page.goto(`${base}/login?next=${encodeURIComponent(`/dinner-verification/${eventId}`)}`);
  await page.locator('[name="email"]').fill(account.email);
  await page.locator('[name="password"]').fill(account.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((value) => !value.pathname.includes("login"));
}
async function fresh(page) {
  const response = page.waitForResponse((response) => response.request().method() === "POST" && Boolean(response.request().headers()["next-action"]));
  await page.getByRole("button", { name: "Refresh eligibility", exact: true }).click();
  await response;
  await page.getByText(/Last checked.*Sydney/).waitFor();
}
async function row(page, name, status) {
  await page.getByRole("listitem").filter({ hasText: name }).getByText(status, { exact: true }).waitFor();
}

try {
  for (const role of ["authorised", "committee", null]) {
    const email = `dinner-browser-${randomUUID()}@example.test`, password = randomBytes(24).toString("hex");
    const created = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    checkDb(created.error); assert(created.data.user);
    const id = created.data.user.id, db = client();
    accounts.push({ id, email, password, db });
    if (role) sql(`insert into public.profiles (id,display_name,committee_role) values ('${id}','Fictional Dinner Staff','${role}');`);
    checkDb((await db.auth.signInWithPassword({ email, password })).error);
  }
  sql(`begin;
    insert into public.events (id,name,event_type,starts_at,location,description,created_by) values
    ('${eventId}','Fictional Spring Mahjong Night','weekly_session','2026-09-28T08:00:00Z','Fictional Club Room','Fictional acceptance event','${accounts[0].id}'),
    ('${emptyEventId}','Fictional Empty Event','weekly_session','2026-09-28T08:00:00Z','Fictional Club Room','Fictional empty event','${accounts[0].id}');
    insert into public.participants (id,full_name,email) values
    ('${participantId}','Fictional Casey Tan','casey.dinner@example.test'),('${otherId}','Fictional Jamie Lee','jamie.dinner@example.test');
    insert into public.registrations (event_id,participant_id,recorded_by) values ('${eventId}','${participantId}','${accounts[0].id}');
    insert into public.attendance_records (event_id,participant_id,check_in_method,attendance_status,recorded_by) values
    ('${eventId}','${participantId}','qr','confirmed',null),('${eventId}','${otherId}','manual','voided','${accounts[0].id}');
    commit;`);

  const appEnvironment = { ...process.env, NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.ISSUE35_LOCAL_PUBLIC_KEY, NEXT_TELEMETRY_DISABLED: "1" };
  // The app needs only the public key, never fixture administrator credentials.
  delete appEnvironment.ISSUE35_LOCAL_FIXTURE_KEY;
  stage = "Production build for browser acceptance";
  const build = spawnSync(process.execPath, ["node_modules/next/dist/bin/next", "build", "--webpack"], { env: appEnvironment, stdio: "pipe", timeout: 120000, windowsHide: true });
  assert.equal(build.status, 0, "Production build failed");
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "4337"], {
    env: appEnvironment,
    stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  // Drain framework logs without printing request/session payloads.
  server.stdout.on("data", () => {}); server.stderr.on("data", () => {});
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt++) {
    try { if ((await fetch(`${base}/login`)).ok) { ready = true; break; } } catch {}
    await delay(500);
  }
  assert(ready, "Local app did not start");
  const { chromium } = process.env.DINNER_PLAYWRIGHT_MODULE
    ? await import(pathToFileURL(process.env.DINNER_PLAYWRIGHT_MODULE).href)
    : await import("playwright");
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  page = await context.newPage();
  page.on("pageerror", () => pageErrors.push("Browser runtime error"));
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push("Browser console error"); });
  page.on("request", (request) => { if (request.headers()["next-action"]) actionId = request.headers()["next-action"]; });
  await check("Anonymous list and detail redirect to login", async () => {
    for (const path of ["/dinner-verification", `/dinner-verification/${eventId}`]) {
      await page.goto(base + path); assert(new URL(page.url()).pathname === "/login");
      assert(!(await page.locator("body").innerText()).includes("casey.dinner@example.test"));
    }
  });
  await login(page, accounts[0]);
  await check("Authorised real provider result and minimal fields", async () => {
    await row(page, "Fictional Casey Tan", "Eligible"); await row(page, "Fictional Jamie Lee", "Not Eligible Yet");
    assert((await page.locator("body").innerText()).includes("of 2 recorded attendees"));
    const body = await page.locator("body").innerText();
    assert(!/student id|recorded by|check.in method/i.test(body));
    await page.screenshot({ path: resolve(evidence, "dinner-desktop.png"), fullPage: true });
  });
  await check("Search, no-match and keyboard refresh", async () => {
    await page.getByLabel("Find a recorded attendee").fill("not-a-person");
    await page.getByText(/No matching recorded attendees/).waitFor();
    await page.getByLabel("Find a recorded attendee").fill("jamie");
    assert.equal(await page.getByRole("list", { name: "Recorded attendees" }).getByRole("listitem").count(), 1);
    await page.getByLabel("Find a recorded attendee").fill("");
    await page.getByRole("button", { name: "Refresh eligibility" }).focus();
    await page.keyboard.press("Enter"); await page.getByText(/Last checked.*Sydney/).waitFor();
  });
  await check("Mobile layout has no horizontal overflow", async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
    await page.screenshot({ path: resolve(evidence, "dinner-mobile.png"), fullPage: true });
    await page.setViewportSize({ width: 1280, height: 900 });
  });
  await check("Current attendance correction updates visible eligibility and count", async () => {
    checkDb((await accounts[0].db.from("attendance_records").update({ attendance_status: "voided" }).eq("event_id", eventId).eq("participant_id", participantId)).error);
    await fresh(page); await row(page, "Fictional Casey Tan", "Not Eligible Yet");
    checkDb((await accounts[0].db.from("attendance_records").update({ attendance_status: "confirmed" }).eq("event_id", eventId).eq("participant_id", participantId)).error);
    await fresh(page); await row(page, "Fictional Casey Tan", "Eligible");
  });
  await check("Failed committee correction preserves confirmed eligibility", async () => {
    await accounts[1].db.from("attendance_records").update({ attendance_status: "voided" }).eq("event_id", eventId).eq("participant_id", participantId);
    await fresh(page); await row(page, "Fictional Casey Tan", "Eligible");
  });
  await check("Returning from another view refreshes the current database fact", async () => {
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await page.getByText(/Attendance may have changed/).waitFor();
    checkDb((await accounts[0].db.from("attendance_records").update({ attendance_status: "voided" }).eq("event_id", eventId).eq("participant_id", participantId)).error);
    await page.evaluate(() => window.dispatchEvent(new Event("focus")));
    await row(page, "Fictional Casey Tan", "Not Eligible Yet");
  });
  await check("Slow refresh disables duplicate action and labels old results", async () => {
    await page.route(`**/dinner-verification/${eventId}`, async (route) => {
      if (route.request().method() === "POST") await delay(1200);
      await route.continue();
    });
    await page.getByRole("button", { name: "Refresh eligibility" }).click();
    await page.getByRole("button", { name: "Refreshing…" }).waitFor();
    assert(await page.getByRole("button", { name: "Refreshing…" }).isDisabled());
    await page.getByText("Previous: Not Eligible Yet", { exact: true }).first().waitFor();
    await page.getByText(/Last checked.*Sydney/).waitFor();
    await page.unroute(`**/dinner-verification/${eventId}`);
  });
  await check("Network failure keeps previous result explicitly stale", async () => {
    const previousConsoleErrors = consoleErrors.length;
    await page.route(`**/dinner-verification/${eventId}`, (route) => route.request().method() === "POST" ? route.abort() : route.continue());
    await page.getByRole("button", { name: "Refresh eligibility" }).click();
    await page.getByText(/Refresh failed. The previous result/).waitFor();
    await page.screenshot({ path: resolve(evidence, "dinner-stale.png"), fullPage: true });
    await page.unroute(`**/dinner-verification/${eventId}`);
    // A deliberately aborted HTTP request produces a Chrome network diagnostic.
    consoleErrors.splice(previousConsoleErrors);
    await fresh(page);
  });
  await check("Authorised event selection, empty event and invalid event", async () => {
    await page.goto(`${base}/dinner-verification`);
    await page.getByRole("link").filter({ hasText: "Fictional Spring Mahjong Night" }).click();
    await page.getByRole("heading", { name: "Fictional Spring Mahjong Night" }).waitFor();
    await page.goto(`${base}/dinner-verification/${emptyEventId}`);
    await page.getByText(/Nobody is eligible for dinner yet/).waitFor();
    await page.screenshot({ path: resolve(evidence, "dinner-empty.png"), fullPage: true });
    await page.goto(`${base}/dinner-verification/not-an-event`);
    await page.getByText("Choose a valid event to verify dinner eligibility.").waitFor();
  });
  await check("An old open view is labelled stale before further serving", async () => {
    await page.goto(`${base}/dinner-verification/${eventId}`);
    await fresh(page);
    await page.getByText(/Attendance may have changed since this check/).waitFor({ timeout: 65_000 });
    await fresh(page);
  });
  await check("Committee and participant sessions cannot read pages or refresh endpoint", async () => {
    assert(actionId);
    for (const account of accounts.slice(1)) {
      const deniedContext = await browser.newContext();
      const denied = await deniedContext.newPage();
      await login(denied, account);
      for (const path of ["/dinner-verification", `/dinner-verification/${eventId}`]) {
        await denied.goto(base + path);
        assert(!(await denied.locator("body").innerText()).includes("casey.dinner@example.test"));
        await denied.getByText("You cannot access this page", { exact: true }).waitFor();
      }
      const response = await deniedContext.request.post(`${base}/dinner-verification/${eventId}`, { headers: { "Next-Action": actionId, "Content-Type": "text/plain;charset=UTF-8", Origin: base }, data: JSON.stringify([eventId]) });
      const body = await response.text(); assert(!body.includes("casey.dinner@example.test")); assert(body.includes("PERMISSION_DENIED"));
      await denied.screenshot({ path: resolve(evidence, account === accounts[1] ? "dinner-denied.png" : "dinner-participant-denied.png"), fullPage: true });
      await deniedContext.close();
    }
    const anonymous = await browser.newContext();
    const response = await anonymous.request.post(`${base}/dinner-verification/${eventId}`, { headers: { "Next-Action": actionId, "Content-Type": "text/plain;charset=UTF-8", Origin: base }, data: JSON.stringify([eventId]), maxRedirects: 0 });
    assert([303, 307, 401].includes(response.status())); assert(!(await response.text()).includes("casey.dinner@example.test"));
    await anonymous.close();
  });
  await check("Permission loss during a refresh removes previously visible identities", async () => {
    stage = "Permission loss: load current page";
    await page.goto(`${base}/dinner-verification/${eventId}`);
    await page.getByText("casey.dinner@example.test", { exact: true }).waitFor();
    stage = "Permission loss: change fictional role";
    sql(`update public.profiles set committee_role='committee' where id='${accounts[0].id}';`);
    stage = "Permission loss: refresh response";
    await page.getByRole("button", { name: "Refresh eligibility" }).click();
    await page.getByText("You cannot access this page", { exact: true }).waitFor();
    stage = "Permission loss: remove identities";
    assert(!(await page.locator("body").innerText()).includes("casey.dinner@example.test"));
  });
  await check("No unexpected browser runtime or console errors", async () => {
    assert.equal(pageErrors.length, 0); assert.equal(consoleErrors.length, 0);
  });
  writeFileSync(resolve(evidence, "results.json"), JSON.stringify({ checks, pageErrors, consoleErrors, note: "Correction uses the real authorised database boundary. Issue #33 manual UI is not yet available." }, null, 2));
} catch {
  await page?.screenshot({ path: resolve(evidence, "failure.png"), fullPage: true }).catch(() => {});
  console.error(`FAIL ${stage}; private diagnostics suppressed. No credentials were persisted.`);
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (server?.pid) {
    if (process.platform === "win32") { try { execFileSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" }); } catch {} }
    else server.kill("SIGTERM");
  }
  try {
    sql(`begin;
      delete from public.attendance_records where event_id in ('${eventId}','${emptyEventId}');
      delete from public.registrations where event_id in ('${eventId}','${emptyEventId}');
      delete from public.events where id in ('${eventId}','${emptyEventId}');
      delete from public.participants where id in ('${participantId}','${otherId}');
      ${accounts.length ? `delete from public.profiles where id in (${accounts.map((account) => `'${account.id}'`).join(",")});` : ""}
      commit;`);
    for (const account of accounts) checkDb((await admin.auth.admin.deleteUser(account.id)).error);
  } catch { console.error("Fictional fixture cleanup needs inspection"); process.exitCode = 1; }
}
