import {dateValue} from "./jobScreening";
import {radarRoutes,routeKey,type RadarCountry} from "./routeRadar";
import {policySources,policyView,policyStateLabels,serializePolicy,restorePolicyAudit,policyAuditMaxBytes,type PolicyLedger} from "./policyReview";

// Compiled releases are not changed by editable policy observations.
// Release IDs identify the existing implementation, not official law versions.
export const ruleVersions=radarRoutes.map(r=>({route:routeKey(r),country:r.country,version:"screen-"+(r.country==="canada"?"2026-11-25":"2026-11-26")+"-v1",source:r.source,reviewed:r.reviewed,reviewBy:r.reviewBy}));
export function ruleReviewHold(ledger:PolicyLedger,route:string,today:string):string{
 const version=ruleVersions.find(v=>v.route===route);
 if(!version||dateValue(today)===null||today<version.reviewed||today>version.reviewBy)return "Compiled rules require a current maintainer review.";
 const observation=policyView(ledger,route,today);
 if(observation.latest)return "Policy evidence was recorded for this route. The compiled calculator has not been reconciled with that evidence; use official requirements until a reviewed rule release.";
 return "";
}
export function countryRuleHold(ledger:PolicyLedger,country:RadarCountry,today:string):string{
 for(const r of ruleVersions.filter(v=>v.country===country)){const reason=ruleReviewHold(ledger,r.route,today);if(reason)return reason;}
 return "";
}
const DAY=86400000;
export type DueCheck={route:string;title:string;source:string;state:string;dueOn:string;key:string};
export function duePolicyChecks(ledger:PolicyLedger,today:string):DueCheck[]{
 if(dateValue(today)===null)return [];
 return policySources.flatMap(s=>{
  const view=policyView(ledger,s.key,today);
  const r=ruleVersions.find(v=>v.route===s.key)!;
  const last=view.latest?.observedOn;
  const dueOn=last&&dateValue(last)!==null?new Date(dateValue(last)!+31*DAY).toISOString().slice(0,10):r.reviewBy;
  const state=view.state==="unobserved"?(today>r.reviewBy?"Bundled rule review overdue":"Not checked in this session"):policyStateLabels[view.state];
  if(view.state==="reviewed"&&today<dueOn)return [];
  if(view.state==="unobserved"&&today<=r.reviewBy)return [];
  const event=ledger.reviews.filter(x=>x.route===s.key).slice(-1)[0];
  return [{route:s.key,title:s.route,source:s.url,state,dueOn,key:[s.key,view.state,view.latest?.id??0,event?.id??0].join("|")}];
 });
}
export type LocalNotice={key:string;route:string;title:string;state:string;firstSeen:string;readOn:string|null;resolvedOn:string|null};
export function reconcileNotices(prior:readonly LocalNotice[],checks:readonly DueCheck[],today:string):LocalNotice[]{
 if(dateValue(today)===null)return [...prior];
 const active=new Set(checks.map(c=>c.key));
 const result=prior.map(n=>!n.resolvedOn&&!active.has(n.key)?{...n,resolvedOn:today}:n);
 for(const c of checks){
  if(result.some(n=>n.key===c.key&&!n.resolvedOn))continue;
  // A repeated active event is not appended by repeated ticks. A reopened
  // event is distinct from its resolved historical occurrence.
  result.push({key:c.key,route:c.route,title:c.title,state:c.state,firstSeen:today,readOn:null,resolvedOn:null});
 }
 return result.slice(-600);
}
export function acknowledgeNotice(history:readonly LocalNotice[],key:string,today:string):LocalNotice[]{
 if(dateValue(today)===null)return [...history];
 return history.map(n=>n.key===key&&!n.resolvedOn&&!n.readOn?{...n,readOn:today}:n);
}
export const policyCheckpointKey="gmr.policy.audit.v1";
type StoragePort=Pick<Storage,"getItem"|"setItem"|"removeItem">;
type Outcome<T>={ok:true;value:T}|{ok:false;error:string};
export function savePolicyCheckpoint(storage:StoragePort,ledger:PolicyLedger,today:string):Outcome<number>{
 if(!ledger.observations.length)return {ok:false,error:"No policy history to save."};
 const raw=serializePolicy(ledger,today);
 const bytes=new TextEncoder().encode(raw).length;
 if(bytes>policyAuditMaxBytes)return {ok:false,error:"Policy history exceeds the checkpoint size limit."};
 try{storage.setItem(policyCheckpointKey,raw);return {ok:true,value:bytes};}catch{return {ok:false,error:"Browser storage is unavailable or full. Export a JSON audit instead."};}
}
export async function loadPolicyCheckpoint(storage:StoragePort,today:string,epoch:number):Promise<Outcome<PolicyLedger>>{
 try{const raw=storage.getItem(policyCheckpointKey);if(raw===null)return {ok:false,error:"No saved policy checkpoint found."};return await restorePolicyAudit(raw,today,epoch);}catch{return {ok:false,error:"Browser storage is unavailable."};}
}
export function clearPolicyCheckpoint(storage:StoragePort):boolean{
 try{storage.removeItem(policyCheckpointKey);return storage.getItem(policyCheckpointKey)===null;}catch{return false;}
}
