import {radarRoutes,routeKey,type RadarRoute} from "./routeRadar";
import {dateValue} from "./jobScreening";

// Existing official route references are allowed for manual review only.
// Source permission and automated retrieval must be approved separately.
export const policySources=radarRoutes.map(r=>({key:routeKey(r),url:r.source,route:r.title,country:r.country,referenceReviewed:r.reviewed,automatedAccess:"disabled" as const,termsReview:"not approved" as const}));
export const policyFields=[
 ["phase","Publication status"],["effectiveOn","Effective date"],["availability","Application availability"],
 ["window","Application window / intake"],["feeAmount","Fee amount"],["feeCurrency","Fee currency"],["feeBasis","Fee scope / applicant category"],
 ["fundsAmount","Funds amount"],["fundsCurrency","Funds currency"],["fundsBasis","Funds scope / period / family size"],
 ["processing","Published processing estimate and scope"],["documents","Required documents"],["settlement","Settlement pathway / conditions"],
 ["quota","Quota / invitation / draw information"],["requirements","Other changed requirements"],["excerpt","Short supporting evidence excerpt"]
] as const;
export type PolicyField=typeof policyFields[number][0];
export type PolicyFacts=Record<PolicyField,string>;
export type PolicyDraft=PolicyFacts&{route:string;observedOn:string;confirmed:boolean};
export type Snapshot={kind:"snapshot";id:number;route:string;source:string;observedOn:string;facts:PolicyFacts;sha256:string};
export type Failure={kind:"failure";id:number;route:string;source:string;observedOn:string;reason:string};
export type Observation=Snapshot|Failure;
export type Review={id:number;route:string;target:number;action:"approve"|"reject"|"rollback";reviewedOn:string};
export type PolicyLedger={epoch:number;restoredThrough:number;observations:Observation[];reviews:Review[]};
export const blankPolicyLedger=(epoch=0):PolicyLedger=>({epoch,restoredThrough:0,observations:[],reviews:[]});
export function blankPolicyDraft(route:string,today:string):PolicyDraft{
 return {...Object.fromEntries(policyFields.map(([key])=>[key,""])) as PolicyFacts,route,observedOn:today,confirmed:false,phase:"unknown",availability:"unknown"};
}
const valid=(s:string)=>typeof s==="string"&&dateValue(s)!==null;
const sourceFor=(key:string)=>policySources.find(s=>s.key===key);
const DAY=86400000;
const fresh=(s:Snapshot,today:string)=>valid(today)&&valid(s.observedOn)&&today>=s.observedOn&&dateValue(today)!-dateValue(s.observedOn)!<=30*DAY;
const latest=(l:PolicyLedger,route:string)=>l.observations.filter(o=>o.route===route).slice(-1)[0];
const lastReview=(l:PolicyLedger,route:string)=>l.reviews.filter(r=>r.route===route).slice(-1)[0];
const nextId=(l:PolicyLedger)=>Math.max(0,...l.observations.map(o=>o.id),...l.reviews.map(r=>r.id))+1;
type Result<T>={ok:true;value:T}|{ok:false;error:string};
const fail=<T>(error:string):Result<T>=>({ok:false,error});
const success=<T>(value:T):Result<T>=>({ok:true,value});
export function validatePolicyDraft(draft:PolicyDraft,today:string):Result<PolicyFacts>{
 if(!sourceFor(draft.route))return fail("Select a registered official source.");
 if(!valid(today)||!valid(draft.observedOn)||draft.observedOn>today)return fail("Use a valid observation date no later than today.");
 if(!draft.confirmed)return fail("Confirm you checked the registered official page.");
 const facts={} as PolicyFacts;
 for(const [key,label] of policyFields){
  const raw=draft[key];
  if(typeof raw!=="string"||raw.length>(key==="excerpt"?500:300))return fail(label+": text is too long or invalid.");
  facts[key]=raw.trim().replace(/\r\n/g,"\n");
 }
 if(!["unknown","proposed","enacted","in_force","withdrawn"].includes(facts.phase))return fail("Select a recognised publication status.");
 if(!["unknown","open","closed","paused"].includes(facts.availability))return fail("Select a recognised availability status.");
 if(facts.effectiveOn&&!valid(facts.effectiveOn))return fail("Invalid effective date.");
 if(facts.phase==="in_force"&&(!facts.effectiveOn||facts.effectiveOn>draft.observedOn))return fail("In-force observations require an effective date on or before observation.");
 if(!facts.excerpt)return fail("Enter a short supporting excerpt from the official source.");
 for(const [prefix,amountKey,currencyKey,basisKey] of [["fee","feeAmount","feeCurrency","feeBasis"],["funds","fundsAmount","fundsCurrency","fundsBasis"]] as const){
  const amount=facts[amountKey],currency=facts[currencyKey],basis=facts[basisKey];
  if(amount||currency||basis){
   if(!/^\d{1,9}(?:\.\d{1,2})?$/.test(amount)||!(/^[A-Za-z]{3}$/.test(currency))||!basis)return fail("For "+prefix+" supply amount, three-letter currency and exact scope, or leave all three unknown.");
   facts[currencyKey]=currency.toUpperCase();
  }
 }
 return success(facts);
}
export function canonicalPolicy(route:string,facts:PolicyFacts):string{
 return JSON.stringify([route,sourceFor(route)?.url??"",policyFields.map(([key])=>[key,facts[key]])]);
}
export async function preparePolicySnapshot(draft:PolicyDraft,today:string):Promise<Result<Omit<Snapshot,"id">>>{
 const checked=validatePolicyDraft(draft,today);
 if(!checked.ok)return checked;
 if(!globalThis.crypto?.subtle)return fail("Snapshot hashing requires a secure browser context (HTTPS or localhost).");
 try{
  const bytes=await globalThis.crypto.subtle.digest("SHA-256",new TextEncoder().encode(canonicalPolicy(draft.route,checked.value)));
  const sha256=Array.from(new Uint8Array(bytes),n=>n.toString(16).padStart(2,"0")).join("");
  return success({kind:"snapshot",route:draft.route,source:sourceFor(draft.route)!.url,observedOn:draft.observedOn,facts:checked.value,sha256});
 }catch{return fail("Snapshot hashing failed; no observation saved.");}
}
export function addPolicyObservation(l:PolicyLedger,observation:Omit<Snapshot,"id">|Omit<Failure,"id">,today:string):Result<PolicyLedger>{
 const source=sourceFor(observation.route);
 if(!source||source.url!==observation.source||!valid(today)||!valid(observation.observedOn)||observation.observedOn>today)return fail("Invalid observation source or date.");
 const prior=latest(l,observation.route);
 if(prior&&observation.observedOn<prior.observedOn)return fail("Observation predates the latest record for this route.");
 if(l.observations.length>=200)return fail("Observation limit reached. Export the audit before clearing local data.");
 if(observation.kind==="snapshot"){
  const checked=validatePolicyDraft({...observation.facts,route:observation.route,observedOn:observation.observedOn,confirmed:true},today);
  if(!checked.ok)return checked;
  if(!/^[0-9a-f]{64}$/.test(observation.sha256)||canonicalPolicy(observation.route,checked.value)!==canonicalPolicy(observation.route,observation.facts))return fail("Invalid snapshot content or digest.");
  if(prior?.kind==="snapshot"&&prior.observedOn===observation.observedOn&&canonicalPolicy(prior.route,prior.facts)===canonicalPolicy(observation.route,observation.facts))return fail("Identical snapshot already recorded for this date.");
 }else if(typeof observation.reason!=="string"||!observation.reason.trim()||observation.reason.length>300)return fail("Provide a short source failure reason.");
 return success({...l,observations:[...l.observations,{...observation,id:nextId(l)}]});
}
export function recordPolicyFailure(l:PolicyLedger,route:string,observedOn:string,reason:string,today:string):Result<PolicyLedger>{
 return addPolicyObservation(l,{kind:"failure",route,source:sourceFor(route)?.url??"",observedOn,reason:reason.trim()},today);
}
export function reviewPolicy(l:PolicyLedger,route:string,target:number,action:Review["action"],today:string):Result<PolicyLedger>{
 if(!valid(today)||!sourceFor(route)||!["approve","reject","rollback"].includes(action)||l.reviews.length>=400)return fail("Invalid review or review limit reached.");
 const s=l.observations.find((o):o is Snapshot=>o.kind==="snapshot"&&o.route===route&&o.id===target);
 const prior=lastReview(l,route),current=latest(l,route);
 if(!s||s.observedOn>today||prior&&prior.reviewedOn>today)return fail("No valid matching snapshot.");
 if(action==="rollback"){
  if(!prior||prior.target===target||!l.reviews.some(r=>r.route===route&&r.target===target&&r.action==="approve"))return fail("Rollback requires an earlier approved version.");
 }else{
  if(current?.id!==target)return fail("Review the latest observation; older versions cannot become current directly.");
  if(prior?.target===target&&prior.action===action&&action!=="approve")return fail("This decision is already recorded.");
  if(action==="approve"&&(!fresh(s,today)||s.facts.phase!=="in_force"||!valid(s.facts.effectiveOn)||s.facts.effectiveOn>today))return fail("Only fresh, effective in-force evidence can be approved for current reference.");
 }
 return success({...l,reviews:[...l.reviews,{id:nextId(l),route,target,action,reviewedOn:today}]});
}
export type PolicyState="unobserved"|"source_failure"|"pending_review"|"not_in_force"|"rejected"|"stale"|"rollback_reference"|"restored_review"|"reviewed";
export function policyView(l:PolicyLedger,route:string,today:string):{state:PolicyState;snapshot:Snapshot|null;latest:Observation|undefined}{
 const observation=latest(l,route),decision=lastReview(l,route);
 const result=(state:PolicyState,snapshot:Snapshot|null=null)=>({state,snapshot,latest:observation});
 if(!observation)return result("unobserved");
 if(observation.kind==="failure")return result("source_failure");
 if(decision?.action==="rollback"&&decision.id>observation.id)return result("rollback_reference");
 if(!fresh(observation,today))return result("stale");
 if(observation.facts.phase!=="in_force"||observation.facts.effectiveOn>today)return result("not_in_force");
 if(decision?.target!==observation.id)return result("pending_review");
 if(decision.action==="reject")return result("rejected");
 if(decision.id<=l.restoredThrough)return result("restored_review");
 return result("reviewed",observation);
}
export const policyStateLabels:Record<PolicyState,string>={unobserved:"Not checked in this session",source_failure:"Source check failed",pending_review:"Pending review",not_in_force:"Not confirmed in force",rejected:"Rejected — recheck required",stale:"Review overdue",rollback_reference:"Rolled back — recheck required",restored_review:"Restored history — approval requires fresh review",reviewed:"Manually reviewed reference"};
export function policyDiff(l:PolicyLedger,snapshot:Snapshot){
 const before=l.observations.filter((o):o is Snapshot=>o.kind==="snapshot"&&o.route===snapshot.route&&o.id<snapshot.id).slice(-1)[0];
 return policyFields.filter(([key])=>!before||before.facts[key]!==snapshot.facts[key]).map(([key,label])=>({key,label,before:before?.facts[key]??"",after:snapshot.facts[key]}));
}
export function policyAlerts(l:PolicyLedger,today:string){
 return policySources.map(s=>({source:s,state:policyView(l,s.key,today).state})).filter(a=>a.state!=="reviewed"&&a.state!=="unobserved");
}
export function policyRouteReference(l:PolicyLedger,r:RadarRoute,today:string){return policyView(l,routeKey(r),today);}
export function serializePolicy(l:PolicyLedger,today:string):string{
 return JSON.stringify({schemaVersion:1,exportedOn:today,scope:"Manually reviewed reference only; no eligibility rule activation",sources:policySources,observations:l.observations,reviews:l.reviews},null,2);
}

// Import is a replay of the bounded audit, never deserialization into trusted state.
// Each digest is recomputed from allowlisted fields. Restored approvals remain
// historical until a new explicit approval against the registered source.
export const policyAuditMaxBytes=2_000_000;
const isObject=(x:unknown):x is Record<string,unknown>=>x!==null&&typeof x==="object"&&!Array.isArray(x);
export async function restorePolicyAudit(raw:string,today:string,epoch=0):Promise<Result<PolicyLedger>>{
 if(typeof raw!=="string"||new TextEncoder().encode(raw).length>policyAuditMaxBytes||!valid(today))return fail("Invalid or oversized audit file.");
 try{
  const data:unknown=JSON.parse(raw);
  if(!isObject(data)||data.schemaVersion!==1||typeof data.exportedOn!=="string"||!valid(data.exportedOn)||data.exportedOn>today||!Array.isArray(data.observations)||!Array.isArray(data.reviews)||data.observations.length>200||data.reviews.length>400)return fail("Unsupported policy audit schema or dates.");
  const exportedOn=data.exportedOn;
  const events=[...data.observations.map((item:unknown)=>({item,observation:true})),...data.reviews.map((item:unknown)=>({item,observation:false}))];
  if(events.some(e=>!isObject(e.item)||!Number.isSafeInteger(e.item.id)))return fail("Invalid audit event identifier.");
  events.sort((a,b)=>Number((a.item as Record<string,unknown>).id)-Number((b.item as Record<string,unknown>).id));
  let ledger=blankPolicyLedger(epoch);
  for(const event of events){
   const item=event.item as Record<string,unknown>;
   if(item.id!==nextId(ledger)||typeof item.route!=="string"||!sourceFor(item.route))return fail("Audit history contains invalid or missing events.");
   const route=item.route;
   if(event.observation){
    if(typeof item.observedOn!=="string"||!valid(item.observedOn)||item.observedOn>exportedOn||item.source!==sourceFor(route)?.url)return fail("Audit observation source or date is invalid.");
    let added:Result<PolicyLedger>;
    if(item.kind==="failure"){
     if(typeof item.reason!=="string")return fail("Invalid source failure.");
     added=recordPolicyFailure(ledger,route,item.observedOn,item.reason,exportedOn);
    }else if(item.kind==="snapshot"&&isObject(item.facts)&&typeof item.sha256==="string"){
     const facts={} as PolicyFacts;
     for(const [key] of policyFields){const v=item.facts[key];if(typeof v!=="string")return fail("Invalid snapshot field.");facts[key]=v;}
     const prepared=await preparePolicySnapshot({...facts,route,observedOn:item.observedOn,confirmed:true},exportedOn);
     if(!prepared.ok||prepared.value.sha256!==item.sha256)return fail("Snapshot digest mismatch or invalid content.");
     added=addPolicyObservation(ledger,prepared.value,exportedOn);
    }else return fail("Unknown observation type.");
    if(!added.ok)return added;
    ledger=added.value;
   }else{
    if(typeof item.reviewedOn!=="string"||!valid(item.reviewedOn)||item.reviewedOn>exportedOn||typeof item.target!=="number"||!Number.isSafeInteger(item.target)||!(item.action==="approve"||item.action==="reject"||item.action==="rollback"))return fail("Invalid review event.");
    const reviewed=reviewPolicy(ledger,route,item.target,item.action,item.reviewedOn);
    if(!reviewed.ok)return reviewed;
    ledger=reviewed.value;
   }
  }
  return success({...ledger,restoredThrough:nextId(ledger)-1});
 }catch{return fail("Could not read or validate policy audit.");}
}
