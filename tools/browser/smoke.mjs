import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const site = fileURLToPath(new URL("../../site/", import.meta.url));
const origin = "http://127.0.0.1:4173";
const server = spawn(process.execPath, ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", "4173", "--strictPort"], {cwd:site,stdio:["ignore","inherit","inherit"]});
const SYNTHETIC_CV = "Synthetic applicant — software engineer. Professional experience: 8 years. Skills: JavaScript, TypeScript, React, Node.js, SQL, Git, HTML, CSS. Built and tested web applications, maintained APIs, improved accessibility, and worked on automated tests and continuous integration. Education: Bachelor of Computer Science. Languages: English fluent.";
const fields = ["id","title","company","location","countries","url","posted","firstSeen","family","seniority","remote","visa","registerIn","skills","langs","salary"];
const job = ["synthetic:1","Synthetic Software Engineer","Example Employer","Berlin",["DE"],"https://example.com/job","","","software","senior",0,"unknown",[],["javascript"],[],""];
const snapshot = {generatedAt:"2026-11-26T00:00:00Z",fields,rows:[job,job]};
const date = new Date("2026-11-26T12:00:00Z");
let browser;
const pass = text => console.log("PASS " + text);
async function ready() {
  for(let i=0;i<60;i++){
    if(server.exitCode!==null)throw Error("Preview server exited");
    try{if((await fetch(origin)).ok)return;}catch{}
    await delay(250);
  }
  throw Error("Preview server did not start");
}
async function noOverflow(page, label) {
  const widths = await page.evaluate(()=>{ const client=document.documentElement.clientWidth; const scroll=document.documentElement.scrollWidth; const offenders=scroll>client+1?Array.from(document.querySelectorAll("body *")).filter(el=>el.getBoundingClientRect().right>client+1).slice(0,12).map(el=>({tag:el.tagName,cls:typeof el.className==="string"?el.className:"",right:Math.round(el.getBoundingClientRect().right)})):[]; return {scroll,client,offenders}; });
  assert.ok(widths.scroll <= widths.client+1, label+" horizontal overflow: "+JSON.stringify(widths));
}
async function visible(locator){await locator.waitFor({state:"visible"});}
async function inputValue(locator,value){assert.equal(await locator.inputValue(),value);}
async function openSection(page,name){await page.getByRole("navigation",{name:"Application sections"}).getByRole("button",{name,exact:true}).click();}
const panel = page => page.locator("main > div:not([hidden])");
async function run(viewport) {
  const context=await browser.newContext({viewport,serviceWorkers:"block",reducedMotion:"reduce"});
  const external=[],unexpected=[],errors=[];
  await context.route("**/*",async route=>{
    const req=route.request(),url=new URL(req.url());
    if(url.origin!==origin){external.push(url.origin);await route.abort();return;}
    if(!["GET","HEAD"].includes(req.method())||url.search){unexpected.push(req.method()+" "+url.pathname);await route.abort();return;}
    await route.continue();
  });
  const page=await context.newPage();
  page.setDefaultTimeout(10000);
  page.on("pageerror",err=>errors.push(err.message));
  page.on("websocket",()=>unexpected.push("websocket"));
  await page.clock.setFixedTime(date);
  try {
    await page.goto(origin);
    await visible(page.getByRole("heading",{name:/Where are you flying/}));
    await noOverflow(page,"upload");
    const ticket=page.getByRole("button",{name:/Drop your CV here/});
    await ticket.focus();
    const [chooser]=await Promise.all([page.waitForEvent("filechooser"),ticket.press("Space")]);
    // A short file exercises the error path without navigating away.
    await chooser.setFiles({name:"short.txt",mimeType:"text/plain",buffer:Buffer.from("too short")});
    await visible(page.getByRole("alert"));
    pass(viewport.width+" keyboard file chooser and short-CV validation");
    await page.getByText("No PDF? Paste the text of your CV instead",{exact:true}).click();
    await page.getByLabel("CV text",{exact:true}).fill(SYNTHETIC_CV);
    await page.getByRole("button",{name:"Read my CV",exact:true}).click();
    await visible(page.getByRole("heading",{name:/Here's what we read/}));
    await noOverflow(page,"profile review");
    await page.getByLabel("Years of professional experience").fill("8");
    await page.getByRole("button",{name:"Next",exact:true}).click();
    await visible(page.getByRole("heading",{name:"Where do you live now?"}));
    await page.getByLabel("Where do you live now?").selectOption("IN");
    await page.getByRole("button",{name:/Software engineering/i}).click();
    await noOverflow(page,"preferences");
    await page.getByRole("button",{name:"Open local dashboard",exact:true}).click();
    await visible(page.getByRole("heading",{name:"Global mobility dashboard"}));
    await visible(page.getByText("No job data loaded.",{exact:false}));
    const file=page.getByLabel("Choose job data (JSON, up to 10 MiB)");
    await file.setInputFiles({name:"jobs.json",mimeType:"application/json",buffer:Buffer.from(JSON.stringify(snapshot))});
    await visible(page.getByRole("link",{name:"Synthetic Software Engineer",exact:true}));
    await visible(page.getByText(/1 records · 1 duplicate IDs skipped/));
    await noOverflow(page,"job dashboard");
    await file.setInputFiles({name:"bad.json",mimeType:"application/json",buffer:Buffer.from("{")});
    await visible(page.getByText(/Previous snapshot retained/));
    await visible(page.getByRole("link",{name:"Synthetic Software Engineer",exact:true}));
    pass(viewport.width+" CV, preferences, job import, deduplication and malformed replacement");
    await page.getByLabel("Filter title, employer or location").fill("Synthetic");
    await page.getByRole("button",{name:"Edit preferences",exact:true}).click();
    await visible(page.getByRole("heading",{name:"Where do you live now?"}));
    await page.getByRole("button",{name:"Open local dashboard",exact:true}).click();
    await visible(page.getByRole("link",{name:"Synthetic Software Engineer",exact:true}));
    await inputValue(page.getByLabel("Filter title, employer or location"),"Synthetic");
    pass(viewport.width+" snapshot and filter retained through preferences");
    await openSection(page,"Canada PR");
    await visible(page.getByRole("heading",{name:"Canada — FSW and CRS scenario"}));
    await panel(page).getByLabel("Age in completed years",{exact:true}).fill("30");
    await panel(page).getByRole("button",{name:"Calculate local scenario"}).click();
    await visible(panel(page).getByText(/FSW selection: Unknown/));
    await noOverflow(page,"Canada");
    await openSection(page,"Australia skilled visas");
    await panel(page).getByLabel("Age in completed years",{exact:true}).fill("31");
    await panel(page).getByRole("button",{name:"Compare visa pathways"}).click();
    await visible(panel(page).getByText(/Base points: Unknown/));
    await noOverflow(page,"Australia");
    await openSection(page,"Germany visas");
    await visible(page.getByRole("heading",{name:"Germany — job search, employment and settlement"}));
    await panel(page).getByRole("combobox",{name:"Qualification route",exact:true}).selectOption("foreign");
    await panel(page).getByLabel("Age in completed years at application").fill("32");
    await noOverflow(page,"Germany");
    await openSection(page,"Ireland permits");
    await visible(page.getByRole("heading",{name:"Ireland — employment and residence pathways"}));
    await panel(page).getByRole("button",{name:"Stamp 4 upgrade",exact:true}).click();
    await panel(page).getByRole("combobox",{name:"Qualifying employment permit basis"}).selectOption("critical");
    await panel(page).getByLabel("Completed qualifying employment months in Ireland").fill("21");
    await panel(page).getByRole("combobox",{name:/Current qualifying Stamp 1/}).selectOption("yes");
    await panel(page).getByRole("combobox",{name:/Revenue employment record/}).selectOption("yes");
    await panel(page).getByRole("button",{name:"Assess selected pathway"}).click();
    await visible(panel(page).getByRole("heading",{name:"Meets self-reported screen only"}));
    await noOverflow(page,"Ireland Stamp 4");
    await panel(page).getByRole("button",{name:"Critical Skills Employment Permit",exact:true}).click();
    await panel(page).getByRole("button",{name:"Assess selected pathway"}).click();
    await visible(panel(page).getByRole("heading",{name:"Review required"}));
    await noOverflow(page,"Ireland Critical Skills");
    await openSection(page,"Netherlands permits");
    await visible(page.getByRole("heading",{name:"Netherlands — employment and residence pathways"}));
    await panel(page).getByRole("button",{name:"EU Blue Card",exact:true}).click();
    await panel(page).getByRole("combobox",{name:"Qualifying education or experience"}).selectOption("it");
    await panel(page).getByLabel(/Confirmed relevant experience months/).fill("36");
    await panel(page).getByRole("button",{name:"Assess selected pathway"}).click();
    await visible(panel(page).getByRole("heading",{name:"Review required"}));
    await noOverflow(page,"Netherlands Blue Card");
    await openSection(page,"Ireland permits");
    await panel(page).getByRole("button",{name:"Stamp 4 upgrade",exact:true}).click();
    await inputValue(panel(page).getByLabel("Completed qualifying employment months in Ireland"),"21");
    await openSection(page,"Netherlands permits");
    await inputValue(panel(page).getByLabel(/Confirmed relevant experience months/),"36");
    pass(viewport.width+" Ireland and Netherlands route navigation, results and retention");
    await openSection(page,"Canada PR");
    await inputValue(panel(page).getByLabel("Age in completed years",{exact:true}),"30");
    await openSection(page,"Australia skilled visas");
    await inputValue(panel(page).getByLabel("Age in completed years",{exact:true}),"31");
    await openSection(page,"Germany visas");
    await inputValue(panel(page).getByLabel("Age in completed years at application"),"32");
    await openSection(page,"Jobs");
    await visible(page.getByRole("link",{name:"Synthetic Software Engineer",exact:true}));
    const activeStorage = await page.evaluate(async()=>({local:localStorage.length,session:sessionStorage.length,databases:(await indexedDB.databases()).length,caches:(await caches.keys()).length}));
    assert.deepEqual(activeStorage,{local:0,session:0,databases:0,caches:0});
    assert.deepEqual(await context.cookies(),[]);
    pass(viewport.width+" navigation retains independent scenario and job state");
    page.once("dialog",dialog=>dialog.dismiss());
    await page.getByRole("button",{name:"Clear all local data",exact:true}).click();
    await visible(page.getByRole("link",{name:"Synthetic Software Engineer",exact:true}));
    page.once("dialog",dialog=>dialog.accept());
    await page.getByRole("button",{name:"Clear all local data",exact:true}).click();
    await visible(page.getByRole("heading",{name:/Where are you flying/}));
    await openSection(page,"Canada PR");
    await inputValue(panel(page).getByLabel("Age in completed years",{exact:true}),"");
    await openSection(page,"Australia skilled visas");
    await inputValue(panel(page).getByLabel("Age in completed years",{exact:true}),"");
    await openSection(page,"Germany visas");
    await inputValue(panel(page).getByLabel("Qualification route",{exact:true}),"");
    await openSection(page,"Ireland permits");
    await panel(page).getByRole("button",{name:"Stamp 4 upgrade",exact:true}).click();
    await inputValue(panel(page).getByLabel("Completed qualifying employment months in Ireland"),"");
    await openSection(page,"Netherlands permits");
    await panel(page).getByRole("button",{name:"EU Blue Card",exact:true}).click();
    await inputValue(panel(page).getByRole("combobox",{name:"Qualifying education or experience"}),"");
    await openSection(page,"Jobs");
    await page.reload();
    await visible(page.getByRole("heading",{name:/Where are you flying/}));
    const storage=await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}));
    assert.deepEqual(storage,{local:0,session:0});
    assert.deepEqual(await context.cookies(),[]);
    assert.deepEqual(external,[],"Unexpected third-party traffic");
    assert.deepEqual(unexpected,[],"Unexpected local API, query or websocket traffic");
    assert.deepEqual(errors,[],"Unhandled browser errors");
    pass(viewport.width+" clear confirmation, reload, zero storage and no outgoing data");
  } finally {await context.close();}
}
try {
  await ready();
  browser=await chromium.launch({headless:true});
  for(const viewport of [{width:1280,height:800},{width:320,height:720},{width:390,height:844}])await run(viewport);
  console.log("BROWSER_SMOKE_PASS 3 viewports, synthetic data only");
} finally {
  await browser?.close();
  server.kill();
}
