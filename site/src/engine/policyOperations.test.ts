import {describe,it,expect} from "vitest";
import {blankPolicyLedger,blankPolicyDraft,preparePolicySnapshot,addPolicyObservation,reviewPolicy,recordPolicyFailure,policyView} from "./policyReview";
import {ruleVersions,ruleReviewHold,countryRuleHold,duePolicyChecks,reconcileNotices,acknowledgeNotice,savePolicyCheckpoint,loadPolicyCheckpoint,clearPolicyCheckpoint,policyCheckpointKey} from "./policyOperations";
const today="2026-11-27",route="germany:blue";
function unwrap<T>(r:{ok:true;value:T}|{ok:false;error:string}):T{if(!r.ok)throw Error(r.error);return r.value;}
async function staged(){const s=unwrap(await preparePolicySnapshot({...blankPolicyDraft(route,today),phase:"in_force",effectiveOn:"2026-11-01",excerpt:"Synthetic fixture only",confirmed:true},today));return unwrap(addPolicyObservation(blankPolicyLedger(),s,today));}
function storage(){const values=new Map<string,string>();return {getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v);},removeItem:(k:string)=>{values.delete(k);}};}
describe("Compiled rule review guard",()=>{
 it("covers all eleven countries",()=>expect(new Set(ruleVersions.map(r=>r.country)).size).toBe(11));
 it("fresh unobserved route retains baseline calculator",()=>expect(ruleReviewHold(blankPolicyLedger(),route,today)).toBe(""));
 it("unknown route and stale rules hold",()=>{expect(ruleReviewHold(blankPolicyLedger(),"invalid",today)).toBeTruthy();expect(ruleReviewHold(blankPolicyLedger(),route,"2026-12-27")).toBeTruthy();});
 it("new observation and approval cannot change rule version",async()=>{const l=await staged();expect(ruleReviewHold(l,route,today)).toBeTruthy();expect(ruleReviewHold(unwrap(reviewPolicy(l,route,1,"approve",today)),route,today)).toBeTruthy();expect(ruleReviewHold(l,"germany:opportunity",today)).toBe("");});
 it("source failure holds affected rule",()=>{const l=unwrap(recordPolicyFailure(blankPolicyLedger(),"australia:491",today,"Synthetic failure",today));expect(countryRuleHold(l,"australia",today)).toBeTruthy();expect(countryRuleHold(l,"germany",today)).toBe("");});
});
describe("Local review checks and delivery history",()=>{
 it("unobserved sources due only after bundled review window",()=>{expect(duePolicyChecks(blankPolicyLedger(),today)).toHaveLength(0);expect(duePolicyChecks(blankPolicyLedger(),"2026-12-27")).toHaveLength(ruleVersions.length);});
 it("new pending observation creates one notice",async()=>{const l=await staged(),checks=duePolicyChecks(l,today);expect(checks).toHaveLength(1);const h=reconcileNotices([],checks,today);expect(h).toHaveLength(1);expect(reconcileNotices(h,checks,today)).toEqual(h);});
 it("acknowledgement is retained on repeated check",async()=>{const checks=duePolicyChecks(await staged(),today),h=reconcileNotices([],checks,today);const read=acknowledgeNotice(h,h[0].key,today);expect(read[0].readOn).toBe(today);expect(reconcileNotices(read,checks,today)).toEqual(read);});
 it("approval resolves pending notice without deletion",async()=>{const l=await staged(),h=reconcileNotices([],duePolicyChecks(l,today),today);const approved=unwrap(reviewPolicy(l,route,1,"approve",today));expect(reconcileNotices(h,duePolicyChecks(approved,today),today)[0].resolvedOn).toBe(today);});
 it("failure after approval creates new notice",async()=>{const l=unwrap(reviewPolicy(await staged(),route,1,"approve",today));const failed=unwrap(recordPolicyFailure(l,route,today,"Synthetic error",today));expect(duePolicyChecks(failed,today)[0].state).toBe("Source check failed");});
 it("stale review is detected on later UTC date",async()=>{const l=unwrap(reviewPolicy(await staged(),route,1,"approve",today));expect(duePolicyChecks(l,"2026-12-28").some(x=>x.route===route&&x.state==="Review overdue")).toBe(true);});
});
describe("Explicit policy checkpoint",()=>{
 it("does not save empty ledger",()=>expect(savePolicyCheckpoint(storage(),blankPolicyLedger(),today).ok).toBe(false));
 it("restores historical approval only",async()=>{const s=storage(),l=unwrap(reviewPolicy(await staged(),route,1,"approve",today));expect(savePolicyCheckpoint(s,l,today).ok).toBe(true);const restored=unwrap(await loadPolicyCheckpoint(s,today,5));expect(restored.epoch).toBe(5);expect(policyView(restored,route,today).state).toBe("restored_review");expect(ruleReviewHold(restored,route,today)).toBeTruthy();});
 it("delete removes only dedicated key",async()=>{const s=storage();s.setItem("other","keep");savePolicyCheckpoint(s,await staged(),today);expect(clearPolicyCheckpoint(s)).toBe(true);expect(s.getItem("other")).toBe("keep");expect(s.getItem(policyCheckpointKey)).toBeNull();});
 it("corrupt checkpoint rejected",async()=>{const s=storage();s.setItem(policyCheckpointKey,"invalid");expect((await loadPolicyCheckpoint(s,today,0)).ok).toBe(false);});
 it("handles storage unavailable",async()=>{const s={getItem:()=>{throw Error("denied");},setItem:()=>{throw Error("denied");},removeItem:()=>{throw Error("denied");}};expect(savePolicyCheckpoint(s,await staged(),today).ok).toBe(false);expect((await loadPolicyCheckpoint(s,today,0)).ok).toBe(false);expect(clearPolicyCheckpoint(s)).toBe(false);});
});
