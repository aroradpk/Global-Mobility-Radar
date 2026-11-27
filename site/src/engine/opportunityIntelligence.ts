import type {Answers,Profile,Job} from "../types";
import {isRecentObservation,type LocalJobs} from "../localJobs";
import {matchJobs} from "./jobs";
import {advertisedSalary} from "./advertisedSalary";
import {radarRoutes,routeKey,type RadarCountry} from "./routeRadar";
import {ruleReviewHold,countryRuleHold} from "./policyOperations";
import type {PolicyLedger} from "./policyReview";
import type {EvidenceRecord} from "./profileEvidence";
import {assessCanada} from "./canada";
import {assessAustralia} from "./australia";
import {assessGermany} from "./germany";
import {resolveCanadaLanguage,withCanadaLanguage} from "./canadaLanguage";
import {mapCanadaEducation,withCanadaEducation} from "./canadaEducation";
import {mapAustraliaSkill,withAustraliaSkill} from "./australiaOccupation";
import {mapAustraliaEnglish,withAustraliaEnglish} from "./australiaEnglish";
import {mapGermanyRecognition,withGermanyRecognition} from "./germanyRecognition";
const codes:Record<RadarCountry,string>={canada:"CA",australia:"AU",germany:"DE",ireland:"IE",netherlands:"NL",newzealand:"NZ",uk:"GB",hongkong:"HK",singapore:"SG",uae:"AE",us:"US"};
const employerRoutes:Partial<Record<string,string[]>>={DE:["germany:blue"],NL:["netherlands:hsm","netherlands:blue"],IE:["ireland:critical","ireland:general"],GB:["uk:skilled"],US:["us:h1b"]};
export const directKeys=["canada:fsw","australia:189","australia:190","australia:491","germany:opportunity","uk:talentVisa","us:niw","us:eb1a"] as const;
const unique=(records:readonly EvidenceRecord[],check:(r:EvidenceRecord)=>boolean)=>{const a=records.filter(check);return a.length===1?String(a[0].id):"";};
const selected=(a:Answers,c:RadarCountry)=>!a.targets.length||a.targets.includes(codes[c]);
export function assessProfileRoutes(answers:Answers,age:string,evidence:readonly EvidenceRecord[],policy:PolicyLedger,today:string){
 const caFirst=unique(evidence,r=>resolveCanadaLanguage(r,today,"first","english").ok||resolveCanadaLanguage(r,today,"first","french").ok);
 let ca:Record<string,string>={age};
 if(caFirst){const record=evidence.find(r=>String(r.id)===caFirst)!;ca.firstKind=resolveCanadaLanguage(record,today,"first","english").ok?"english":"french";ca=withCanadaLanguage(ca,caFirst,evidence,today);}
 ca=withCanadaEducation(ca,unique(evidence,r=>mapCanadaEducation(r,today).ok),evidence,today);
 const au=withAustraliaSkill(withAustraliaEnglish({age},unique(evidence,r=>mapAustraliaEnglish(r,today).ok),evidence,today),unique(evidence,r=>mapAustraliaSkill(r,today).ok),evidence,today,"");
 const de=withGermanyRecognition({opAge:age},unique(evidence,r=>mapGermanyRecognition(r,today).ok),evidence,today,"opportunity");
 const canada=assessCanada(ca,today).fsw,australia=assessAustralia(au,today),germany=assessGermany(de,today);
 return directKeys.flatMap(key=>{
  const route=radarRoutes.find(r=>routeKey(r)===key);
  if(!route||!selected(answers,route.country)||answers.citizenships.includes(codes[route.country])||answers.livesIn===codes[route.country])return [];
  const hold=route.country==="australia"?countryRuleHold(policy,"australia",today):ruleReviewHold(policy,key,today);
  const result=key==="canada:fsw"?canada:route.country==="australia"?australia.routes.find(r=>r.id===route.id):key==="germany:opportunity"?germany.find(r=>r.id==="opportunity"):undefined;
  const missing=hold?[hold]:result?.missing??["Discretionary or route-specific evidence requires manual review"];
  const failed=hold?[]:result?.failed??[];
  return [{key,route,status:hold?"Rule review required":failed.length?"Known requirement gap":missing.length?"Evidence needed":"Self-reported screening only",missing,failed}];
 });
}
export function sponsorshipEvidence(job:Job,snapshot:LocalJobs,now:number){
 const e=snapshot.evidence.get(job.id);
 if(!e||!isRecentObservation(snapshot.generatedAt,now)||!isRecentObservation(e.observedAt,now)||!isRecentObservation(e.descriptionCheckedAt,now)||e.sourceUrl!==job.url)return {state:"unknown" as const,reason:"No fresh vacancy description evidence"};
 if(e.negative)return {state:e.positive?"conditional" as const:"excluded" as const,reason:e.positive?"Conflicting imported wording":e.negative};
 if(e.positive&&job.visa==="explicit")return {state:"explicit_wording" as const,reason:e.positive};
 if(e.positive)return {state:"conditional" as const,reason:e.positive};
 if(e.relocation)return {state:"relocation_only" as const,reason:e.relocation};
 return {state:"unknown" as const,reason:"No explicit vacancy wording"};
}
export function assessJobOpportunities(snapshot:LocalJobs|null,profile:Profile,answers:Answers,policy:PolicyLedger,today:string,now:number){
 if(!snapshot)return [];
 const order=answers.targets.length?answers.targets:[...new Set(snapshot.jobs.flatMap(j=>j.countries))];
 const matches=matchJobs(snapshot.jobs.map(j=>({...j,visa:"unknown" as const,registerIn:[]})),profile,answers,order,new Set(),30000,true);
 const originals=new Map(snapshot.jobs.map(j=>[j.id,j]));
 return matches.map(m=>{
  const job=originals.get(m.job.id)!;
  const sponsor=sponsorshipEvidence(job,snapshot,now);
  const country=job.countries.length===1?job.countries[0]:"";
  const routes=(employerRoutes[country]??[]).flatMap(key=>{const r=radarRoutes.find(r=>routeKey(r)===key);return r?[{route:r,hold:ruleReviewHold(policy,key,today)}]:[];});
  const e=snapshot.evidence.get(job.id);
  const fresh=!!e&&isRecentObservation(snapshot.generatedAt,now)&&isRecentObservation(e.observedAt,now)&&isRecentObservation(e.descriptionCheckedAt,now);
  const salaries=advertisedSalary(job.countries,job.salary,fresh,today).filter(s=>routes.some(r=>!r.hold&&(s.rule.id.startsWith("de-")&&routeKey(r.route)==="germany:blue"||s.rule.id.startsWith("nl-blue")&&routeKey(r.route)==="netherlands:blue"||s.rule.id.startsWith("nl-")&&!s.rule.id.startsWith("nl-blue")&&routeKey(r.route)==="netherlands:hsm")));
  const blocked=job.visa==="blocked"||job.visa==="employer-no"||sponsor.state==="excluded";
  const status=blocked?"excluded":m.languageBlock.length?"language_review":!fresh?"stale_or_unknown":sponsor.state==="explicit_wording"?"review_priority":"evidence_needed";
  const action=blocked?"Do not prioritise without resolving restrictive wording":m.languageBlock.length?"Check required language against your actual proficiency":!fresh?"Reopen the original vacancy and verify availability and description":sponsor.state!=="explicit_wording"?"Ask employer about role-specific sponsorship":!salaries.length?"Confirm applicable immigration route and contractual salary":"Verify salary criterion, contract, employer and immigration conditions";
  return {job,match:m,sponsor,routes,salaries,status,action,fresh};
 }).sort((a,b)=>{const order=["review_priority","evidence_needed","stale_or_unknown","language_review","excluded"];return order.indexOf(a.status)-order.indexOf(b.status)||b.match.score-a.match.score||a.job.id.localeCompare(b.job.id);});
}
