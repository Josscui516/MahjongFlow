/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS browser acceptance runner */
const fs = require('fs');
const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const { chromium } = require(process.env.S6_PLAYWRIGHT_MODULE || 'playwright');
const runtimeDir = process.env.S6_RUNTIME_DIR;
if (!runtimeDir) throw new Error('Set S6_RUNTIME_DIR to the isolated local acceptance runtime directory.');
const accounts = JSON.parse(fs.readFileSync(runtimeDir + '/accounts.json'));
const ids = JSON.parse(fs.readFileSync(runtimeDir + '/ids.json'));
const base = 'http://127.0.0.1:4336';
let browser, page;
function sql(query) {
  return execFileSync('docker', ['exec', '-i', 'supabase_db_mahjongflow-sprint6-acceptance', 'psql', '-U', 'postgres', '-d', 'postgres', '-At', '-v', 'ON_ERROR_STOP=1'], { input: query, encoding: 'utf8' }).trim();
}
async function main() {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base + '/login');
  await page.locator('[name=email]').fill(accounts.authorised.email);
  await page.locator('[name=password]').fill(accounts.authorised.password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(url => !url.pathname.includes('login'));
  const before = sql(`select (select count(*) from tasks where event_id='${ids.weekly}')||','||(select count(*) from registrations where event_id='${ids.weekly}')||','||(select count(*) from attendance_records where event_id='${ids.weekly}');`);
  assert.equal(before, '3,1,1');
  await page.goto(base + `/events/${ids.weekly}/edit`);
  await page.getByLabel('Date and time').fill('2026-10-02T18:30');
  await page.getByLabel('Location', { exact: true }).fill('Fictional Updated Room');
  await page.getByRole('button', { name: 'Save event', exact: true }).click();
  await page.waitForURL(/saved=1/);
  await page.getByText('Completed 3 of 3', { exact: true }).waitFor();
  const after = sql(`select (select count(*) from tasks where event_id='${ids.weekly}')||','||(select count(*) from registrations where event_id='${ids.weekly}')||','||(select count(*) from attendance_records where event_id='${ids.weekly}');`);
  assert.equal(after, before);
  console.log('PASS Event date/location update preserves task, registration and attendance relationships');
  const eventCount = sql('select count(*) from events;');
  await page.goto(base + '/events/new');
  await page.getByRole('button', { name: 'Create event', exact: true }).click();
  await page.getByText('Name must contain 1 to 200 characters.', { exact: false }).waitFor();
  assert.equal(sql('select count(*) from events;'), eventCount);
  console.log('PASS Invalid event input creates no database row');
  await page.getByLabel('Name', { exact: true }).fill('S6 Browser Tournament');
  await page.getByLabel('Description', { exact: true }).fill('Fictional tournament acceptance.');
  await page.getByRole('combobox', { name: /^Type/ }).selectOption('tournament');
  await page.getByLabel('Date and time').fill('2026-10-04T18:30');
  await page.getByLabel('Location', { exact: true }).fill('Fictional Tournament Hall');
  await page.getByLabel('Require student ID for registration').check();
  await page.getByRole('button', { name: 'Create event', exact: true }).click();
  await page.waitForURL(/saved=1/);
  await page.reload();
  await page.getByText('Tournament', { exact: true }).waitFor();
  await page.getByText('Required', { exact: true }).waitFor();
  console.log('PASS Tournament with student-ID requirement survives reload');
  await page.goto(base + '/events/not-a-uuid');
  await page.getByText(/could not be found|not found/i).first().waitFor();
  console.log('PASS Invalid event URL returns safe not-found state');
  assert.equal(errors.length, 0, errors.join('\n'));
}
main().catch(async error => {
  console.error(error.stack);
  if (page) await page.screenshot({ path: runtimeDir + '/evidence/event-invariants-failure.png', fullPage: true });
  process.exitCode = 1;
}).finally(async () => { if (browser) await browser.close(); });
