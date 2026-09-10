/* eslint-disable @typescript-eslint/no-require-imports -- standalone CommonJS browser acceptance runner */
const runtimeDir = process.env.S6_RUNTIME_DIR;
if (!runtimeDir) throw new Error("Set S6_RUNTIME_DIR to the isolated local acceptance runtime directory.");
const fs=require('fs');const assert=require('assert/strict');
const {chromium}=require(process.env.S6_PLAYWRIGHT_MODULE || 'playwright');
const accounts=JSON.parse(fs.readFileSync(runtimeDir+'/accounts.json','utf8'));const base='http://127.0.0.1:4336';
const evidence=runtimeDir+'/evidence';fs.mkdirSync(evidence,{recursive:true});
let page,browser;const checks=[],errors=[];
async function check(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
async function login(role){await page.goto(base+'/login');await page.locator('[name=email]').fill(accounts[role].email);await page.locator('[name=password]').fill(accounts[role].password);await page.getByRole('button',{name:/sign in/i}).click();await page.waitForURL(u=>!u.pathname.includes('login'));}
async function textHas(text){await page.getByText(text,{exact:false}).first().waitFor();}
async function main(){
browser=await chromium.launch({channel:'chrome',headless:true});page=await browser.newPage({viewport:{width:1280,height:900}});page.on('pageerror',e=>errors.push(e.message));
await check('Anonymous events access redirects to login',async()=>{await page.goto(base+'/events');assert.match(page.url(),/login/)});
await login('authorised');
await check('Real Dashboard providers and upcoming events',async()=>{await page.goto(base+'/dashboard');await textHas('Fictional Open Session');assert(!await page.getByText('Fictional Expired Session',{exact:true}).count());assert(!await page.getByText('Fictional Cancelled Tournament',{exact:true}).count());assert(!((await page.locator('body').innerText()).includes('not connected')));});
await page.screenshot({path:evidence+'/dashboard-desktop.png',fullPage:true});
const ids={};
await check('Create real weekly event and empty preparation',async()=>{
await page.goto(base+'/events/new');await page.getByLabel('Name',{exact:true}).fill('S6 Browser Weekly');await page.getByLabel('Description',{exact:true}).fill('Fictional acceptance event');await page.getByLabel('Date and time').fill('2026-10-01T18:30');await page.getByLabel('Location',{exact:true}).fill('Fictional Room S6');await page.getByRole('button',{name:'Create event',exact:true}).click();await page.waitForURL(/\/events\/[0-9a-f-]+\?saved=1/);ids.weekly=page.url().match(/events\/([^?]+)/)[1];await textHas('Completed 0 of 0');});
await check('Edit preserves Sydney local datetime',async()=>{await page.goto(base+`/events/${ids.weekly}/edit`);assert.equal(await page.getByLabel('Date and time').inputValue(),'2026-10-01T18:30');await page.getByLabel('Name',{exact:true}).fill('S6 Browser Weekly Updated');await page.getByRole('button',{name:'Save event',exact:true}).click();await page.waitForURL(/saved=1/);await page.reload();await textHas('S6 Browser Weekly Updated');});
ids.tasks=[];
await check('Create three real tasks including two completed',async()=>{for(let i=0;i<3;i++){await page.goto(base+'/tasks/new');await page.getByLabel('Title',{exact:true}).fill(`S6 Browser Task ${i+1}`);await page.getByLabel('Description',{exact:true}).fill('Fictional preparation work');await page.getByRole('combobox',{name:/^Assignee/}).selectOption(accounts.authorised.id);await page.getByLabel('Due date').fill('2026-09-12');await page.getByRole('combobox',{name:/^Status/}).selectOption(i<2?'completed':'in_progress');await page.getByRole('button',{name:'Create task',exact:true}).click();await page.waitForURL(/\/tasks\/[0-9a-f-]+\?saved=1/);ids.tasks.push(page.url().match(/tasks\/([^?]+)/)[1]);}});
await check('Link preparation tasks updates progress to 2/3',async()=>{for(const id of ids.tasks){await page.goto(base+`/events/${ids.weekly}`);await page.getByRole('combobox',{name:/^Link a task/}).selectOption(id);await page.getByRole('button',{name:'Link task',exact:true}).click();await page.waitForURL(/preparation=saved/);}await textHas('Completed 2 of 3');await page.reload();await textHas('Completed 2 of 3');});
await page.screenshot({path:evidence+'/preparation-desktop.png',fullPage:true});
await check('Task event filter uses real event choices',async()=>{await page.goto(base+'/tasks');await page.getByRole('combobox',{name:/^Event/}).selectOption(ids.weekly);await page.getByRole('button',{name:'Apply',exact:true}).click();await page.waitForURL(/eventId=/);await textHas('Showing 3 of 3');});
await check('Unlink only changes relationship and progress',async()=>{await page.goto(base+`/events/${ids.weekly}`);await page.locator('li').filter({hasText:'S6 Browser Task 1'}).getByRole('button',{name:'Unlink'}).click();await page.waitForURL(/preparation=saved/);await textHas('Completed 1 of 2');await page.goto(base+`/tasks/${ids.tasks[0]}`);await textHas('S6 Browser Task 1');await textHas('Completed');});
await page.goto(base+`/registrations/${ids.weekly}`);await page.getByRole('heading',{name:'Event registrations',exact:true}).waitFor();
fs.writeFileSync(runtimeDir+'/ids.json',JSON.stringify(ids));
await page.screenshot({path:evidence+'/registrations-desktop.png',fullPage:true});
fs.writeFileSync(evidence+'/results.json',JSON.stringify({checks,errors},null,2));
assert.equal(errors.length,0,errors.join('\n'));
}
main().catch(async e=>{console.error(e.stack);if(page){console.log((await page.locator('body').innerText()).slice(0,12000));await page.screenshot({path:evidence+'/failure.png',fullPage:true});}process.exitCode=1}).finally(async()=>{if(browser)await browser.close()});
