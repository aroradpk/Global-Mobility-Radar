import { useState } from "react";
import ProfileAgeControl from "./ProfileAgeControl";
import {withProfileAge} from "../engine/unifiedProfile";
import { assessAustralia } from "../engine/australia.js";

const ROOT = "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/";
const ROUTES = [{id:"189",label:"189 · Skilled Independent",path:"skilled-independent-189/points-table"},{id:"190",label:"190 · Skilled Nominated",path:"skilled-nominated-190/points-table"},{id:"491",label:"491 · Skilled Work Regional",path:"skilled-work-regional-provisional-491/points-table"}];
const YES_NO = [["yes","Yes — confirmed"],["no","No"]] as const;
const STATUS = {requirements_not_met:"Requirements not met / still outstanding",review_required:"Review required",potential_eoi_candidate:"Potential EOI candidate — not invited",meets_self_reported_screen:"Meets self-reported screen only"} as const;

export default function AustraliaPanel({today,profileAge}:{today:string;profileAge:string}){
  const [manualInput,setInput]=useState<Record<string,string>>({});
  const [linked,setLinked]=useState(false);
  const input=withProfileAge(manualInput,"age",linked,profileAge);
  const [submitted,setSubmitted]=useState(false);
  const result=submitted?assessAustralia(input,today):null;
  const update=(key:string,value:string)=>{setInput(old=>({...old,[key]:value}));setSubmitted(false);};
  const select=(key:string,label:string,opts:readonly (readonly [string,string])[]=YES_NO)=><label key={key}>{label}<select aria-label={label} value={input[key]??""} onChange={e=>update(key,e.target.value)}><option value="">Unknown / select</option>{opts.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>;
  const field=(key:string,label:string,type="number")=><label key={key}>{label}<input type={type} disabled={key==="age"&&linked} value={input[key]??""} onChange={e=>update(key,e.target.value)} min={type==="number"?0:undefined} step={type==="number"?1:undefined}/></label>;
  return <section className="card stack" aria-labelledby="australia-title">
    <h2 id="australia-title">Australia — skilled migration points</h2>
    <p>Compare 189 and 190 permanent visas with 491 regional provisional residence. This is a private, self-reported scenario, not a visa decision. 65 points is a minimum, not a guarantee of invitation.</p>
    <p>Rules reviewed 26 November 2026; recheck after 26 December 2026. Assess facts as of today; invitation-date assessment may differ.</p>
    <details open><summary>1. Your points</summary>
      <ProfileAgeControl age={profileAge} linked={linked} onChange={v=>{setLinked(v);setSubmitted(false);}}/>
      {field("age","Age in completed years")}
      {select("english","Confirmed English level",[["below","Below competent"],["competent","Competent — 0 points"],["proficient","Proficient — 10 points"],["superior","Superior — 20 points"]])}
      {select("englishEvidence","English evidence",[["passport","Eligible citizenship and valid passport (competent only)"],["test","Approved test with verified scores"],["none","None"]])}
      {input.englishEvidence==="test"&&field("englishDate","Approved test date","date")}
      <p><a href="https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language" target="_blank" rel="noopener noreferrer">Check approved tests and English thresholds</a>. Test rules changed in August 2025; use the applicable official table.</p>
      {field("overseasMonths","Qualifying overseas skilled work months (last 10 years)")}
      {field("australianMonths","Qualifying Australian skilled work months (last 10 years)")}
      <p>Use assessed, relevant employment periods, not raw CV years. Do not count overlapping months or work outside the applicable period.</p>
      {select("education","Highest recognised qualification",[["none","No recognised points qualification"],["recognised10","Eligible diploma, trade or recognised award — 10"],["bachelor","Recognised bachelor or masters — 15"],["doctorate","Recognised doctorate — 20"]])}
      {select("partner","Confirmed partner category",[["singleOrCitizen","Single, or partner Australian citizen/PR — 10"],["skilled","Eligible accompanying skilled partner — 10"],["english","Eligible accompanying partner with competent English — 5"],["other","Other partner category — 0"]])}
      {(input.partner==="skilled"||input.partner==="english")&&select("partnerConfirmed","Same visa applicant, not citizen/PR, competent English; if skilled, under 45 with suitable assessment and occupation on same list")}
    </details>
    <details><summary>2. Additional points</summary>
      {select("study","Meet Australian study requirement")}
      {select("specialist","Eligible Australian research masters/doctorate (specified STEM/ICT, two academic years)")}
      {select("regional","Eligible regional Australian study (lived and studied in designated area, not distance study)")}
      {select("community","Recognised current NAATI community language credential")}
      {select("professional","Eligible Professional Year in Australia (authorised provider, relevant occupation, at least 12 months)")}
      {input.professional==="yes"&&field("professionalDate","Professional Year completion date","date")}
    </details>
    <details open><summary>3. Required evidence and route conditions</summary>
      {select("skills","Suitable skills assessment in nominated occupation")}
      {input.skills==="yes"&&<>{field("skillsDate","Skills assessment issue date","date")}{select("skillsValid","Still valid under assessor's shorter expiry if applicable; not for subclass 485")}</>}
      {select("health","Health requirements met (self-reported)")}
      {select("character","Character requirements met (self-reported)")}
      {select("otherRequirements","Other applicable visa conditions reviewed and met (self-reported)")}
      {ROUTES.map(route=><fieldset key={route.id}><legend>{route.label}</legend>
        <a href={ROOT+route.path} target="_blank" rel="noopener noreferrer">Official points table</a>
        {select("occupation"+route.id,"Occupation on relevant skilled occupation list for this pathway")}
        {route.id!=="189"&&select("support"+route.id,route.id==="190"?"Current state/territory nomination":"Current state nomination or accepted eligible family sponsorship")}
        {select("invited"+route.id,"Invitation received for this route")}
        {input["invited"+route.id]==="yes"&&field("invitedPoints"+route.id,"Points stated in invitation")}
      </fieldset>)}
    </details>
    <button type="button" className="btn primary" onClick={()=>setSubmitted(true)}>Compare visa pathways</button>
    <button type="button" className="btn ghost" onClick={()=>{setInput({});setSubmitted(false);}}>Clear Australia inputs</button>
    {result&&<div role="status" className="stack">
      <h3>Base points: {result.basePoints??"Unknown"}</h3>
      {Object.entries(result.factors).map(([k,v])=><p key={k}>{k.replace(/([A-Z])/g," $1")}: {v}</p>)}
      {result.missing.length>0&&<p>Needs review: {result.missing.join("; ")}</p>}
      {result.failed.length>0&&<p>Outstanding: {result.failed.join("; ")}</p>}
      {result.routes.map(r=><article className="card" key={r.id}><h3>{r.id} — {r.kind}</h3><p>Confirmed-input score: {r.points??"Unknown"}. Potential score including applicable nomination/sponsorship: {r.potentialPoints??"Unknown"}.</p><strong>{STATUS[r.status]}</strong>{r.failed.length>0&&<p>Outstanding: {r.failed.join("; ")}</p>}{r.missing.length>0&&<p>Review: {r.missing.join("; ")}</p>}</article>)}
      <p>491 is not direct PR. State criteria, occupation-specific assessments, invitation rounds, current nomination availability and the separate 191 permanent residence pathway require further review. <a href="https://immi.homeaffairs.gov.au/visas/working-in-australia/skillselect/expression-of-interest" target="_blank" rel="noopener noreferrer">Official SkillSelect guidance</a>.</p>
    </div>}
  </section>;
}
