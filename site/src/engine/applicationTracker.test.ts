import {describe,it,expect} from "vitest";
import {blankTracker,addTarget,updateEntry,changeTask,removeEntry,serializeTracker,restoreTracker,trackerDueChecks,routeTarget,type Tracker,type Target} from "./applicationTracker";
import {radarRoutes} from "./routeRadar";
import {encryptTracker,decryptTracker,storeTrackerVault,clearTrackerVault,trackerVaultKey} from "./trackerVault";
const today="2026-11-26",manual:Target={kind:"manual",key:"",title:"Synthetic opportunity",location:"Example",url:"https://example.com/jobs"};
function unwrap<T>(r:{ok:true;value:T}|{ok:false;error:string}):T{if(!r.ok)throw Error(r.error);return r.value;}
const saved=()=>unwrap(addTarget(blankTracker(),manual,today));
describe("Application tracker",()=>{
 it("starts shortlisted and records history",()=>expect(saved().entries[0]).toMatchObject({stage:"shortlisted",history:[{stage:"shortlisted",on:today}]}));
 it("deduplicates manual and route",()=>{expect(addTarget(saved(),manual,today).ok).toBe(false);const r=routeTarget(radarRoutes[0]);expect(addTarget(unwrap(addTarget(blankTracker(),r,today)),r,today).ok).toBe(false);});
 it("deduplicates job URLs ignoring fragments",()=>{const j={...manual,kind:"job" as const,key:"job1"};expect(addTarget(unwrap(addTarget(blankTracker(),j,today)),{...j,key:"job2",url:j.url+"#details"},today).ok).toBe(false);});
 it("rejects insecure URL and spoofed route",()=>{expect(addTarget(blankTracker(),{...manual,url:"javascript:alert(1)"},today).ok).toBe(false);expect(addTarget(blankTracker(),{...routeTarget(radarRoutes[0]),url:"https://example.com"},today).ok).toBe(false);});
 it("tracks changes and preserves prior entries",()=>{const original=saved(),t=unwrap(updateEntry(original,1,{stage:"applied",deadline:"2026-12-01",notes:" synthetic "},today));expect(t.entries[0]).toMatchObject({stage:"applied",notes:"synthetic",history:[{stage:"shortlisted",on:today},{stage:"applied",on:today}]});expect(original.entries[0].stage).toBe("shortlisted");});
 it("rejects invalid date",()=>expect(updateEntry(saved(),1,{stage:"applied",deadline:"2026-02-30",notes:""},today).ok).toBe(false));
 it("adds toggles and removes checklist task",()=>{let t=unwrap(changeTask(saved(),1,{kind:"add",label:"CV"},today));expect(changeTask(t,1,{kind:"add",label:"cv"},today).ok).toBe(false);t=unwrap(changeTask(t,1,{kind:"toggle",taskId:1},today));expect(t.entries[0].tasks[0].done).toBe(true);expect(unwrap(changeTask(t,1,{kind:"remove",taskId:1},today)).entries[0].tasks).toEqual([]);});
 it("keeps monotonic ID after delete",()=>expect(unwrap(addTarget(removeEntry(saved(),1),manual,today)).entries[0].id).toBe(2));
 it("reminders use saved date only and terminal stages excluded",()=>{const t=unwrap(updateEntry(saved(),1,{stage:"applied",deadline:"2026-12-03",notes:""},today));expect(trackerDueChecks(t,today)[0].state).toContain("within 7");expect(trackerDueChecks(t,"2026-12-03")[0].state).toContain("today");expect(trackerDueChecks(t,"2026-12-04")[0].state).toContain("overdue");expect(trackerDueChecks(unwrap(updateEntry(t,1,{stage:"rejected",deadline:"2026-12-03",notes:""},today)),today)).toEqual([]);});
 it("restores only validated saved fields",()=>{const raw=JSON.parse(serializeTracker(saved(),today));raw.entries[0].secret="discard";const t=unwrap(restoreTracker(JSON.stringify(raw),today,3));expect(t.epoch).toBe(3);expect(t.entries).toEqual(saved().entries);});
 it("rejects tampered status history",()=>{const raw=JSON.parse(serializeTracker(saved(),today));raw.entries[0].stage="completed";expect(restoreTracker(JSON.stringify(raw),today).ok).toBe(false);});
 it("rejects duplicate IDs and malformed backup",()=>{const raw=JSON.parse(serializeTracker(saved(),today));raw.entries.push(raw.entries[0]);expect(restoreTracker(JSON.stringify(raw),today).ok).toBe(false);expect(restoreTracker("bad",today).ok).toBe(false);});
});
describe("Encrypted tracker",()=>{
 const secret="synthetic-long-passphrase";
 it("encrypts with fresh salt and nonce and restores correctly",async()=>{const a=unwrap(await encryptTracker(saved(),today,secret)),b=unwrap(await encryptTracker(saved(),today,secret));expect(a).not.toBe(b);expect(a).not.toContain(manual.title);expect(unwrap(await decryptTracker(a,today,secret)).entries).toEqual(saved().entries);},15000);
 it("wrong passphrase and tampered ciphertext fail",async()=>{const raw=unwrap(await encryptTracker(saved(),today,secret));expect((await decryptTracker(raw,today,"different-long-passphrase")).ok).toBe(false);const d=JSON.parse(raw);d.ciphertext=(d.ciphertext[0]==="A"?"B":"A")+d.ciphertext.slice(1);expect((await decryptTracker(JSON.stringify(d),today,secret)).ok).toBe(false);},15000);
 it("rejects short passphrase or empty tracker",async()=>{expect((await encryptTracker(saved(),today,"short")).ok).toBe(false);expect((await encryptTracker(blankTracker(),today,secret)).ok).toBe(false);});
 it("deletes dedicated checkpoint only",()=>{const m=new Map<string,string>([["other","keep"]]);const port={getItem:(k:string)=>m.get(k)??null,setItem:(k:string,v:string)=>{m.set(k,v);},removeItem:(k:string)=>{m.delete(k);}};expect(storeTrackerVault(port,"fixture")).toBe(true);expect(clearTrackerVault(port)).toBe(true);expect(m.has(trackerVaultKey)).toBe(false);expect(m.get("other")).toBe("keep");});
});
