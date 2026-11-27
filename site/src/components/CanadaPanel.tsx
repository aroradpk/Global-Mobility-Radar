import { useState } from "react";
import ProfileAgeControl from "./ProfileAgeControl";
import {withProfileAge} from "../engine/unifiedProfile";
import {mapCanadaLanguage,withCanadaLanguage} from "../engine/canadaLanguage";
import {mapCanadaEducation,withCanadaEducation,canadaEducationSource,canadaEducationReview} from "../engine/canadaEducation";
import {lookupCanadaOccupation,lookupEmploymentOccupation,nocSource,nocDutiesSource,nocReview} from "../engine/canadaOccupation";
import type {EvidenceRecord} from "../engine/profileEvidence";
import { assessCanada } from "../engine/canada.js";
const ROOT="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/";
const education=["Less than secondary","Secondary","One-year postsecondary","Two-year postsecondary","Bachelor / 3+ year credential","Two or more, one 3+ years","Master / eligible professional degree","Doctorate"].map((l,i)=>[String(i),l] as const);
const yn=[["yes","Yes — confirmed"],["no","No"]] as const;
export default function CanadaPanel({today,profileAge,evidence}:{today:string;profileAge:string;evidence:EvidenceRecord[]}){
  const [manualInput,setInput]=useState<Record<string,string>>({});
  const [linked,setLinked]=useState(false);
  const [languageId,setLanguageId]=useState("");
  const [educationId,setEducationId]=useState("");
  const [spouseEducationId,setSpouseEducationId]=useState("");
  const [occupationId,setOccupationId]=useState("");
  const [occupationCode,setOccupationCode]=useState("");
  const occupationRecord=evidence.find(r=>String(r.id)===occupationId&&r.kind==="employment");
  const occupation=occupationId?lookupEmploymentOccupation(occupationRecord,today):lookupCanadaOccupation("NOC 2021",occupationCode,today);
  const selected=evidence.find(r=>String(r.id)===languageId);
  const languageResult=mapCanadaLanguage(selected,today);
  const baseInput=withCanadaLanguage(withProfileAge(manualInput,"age",linked,profileAge),languageId,evidence,today);
  const input=withCanadaEducation(withCanadaEducation(baseInput,educationId,evidence,today),spouseEducationId,evidence,today,"spouse");
  const [submitted,setSubmitted]=useState(false);
  const result=submitted?assessCanada(input,today):null;
  const set=(key:string,value:string)=>{setInput(old=>({...old,[key]:value}));setSubmitted(false);};
  const field=(key:string,label:string,placeholder="",type="text")=><label key={key}>{label}<input type={type} disabled={(key==="age"&&linked)||((key==="first"||key==="firstDate")&&!!languageId)||(key==="credential"&&!!educationId)||(key==="spouseCredential"&&!!spouseEducationId)} value={input[key]??""} placeholder={placeholder} maxLength={40} onChange={e=>set(key,e.target.value)}/></label>;
  const select=(key:string,label:string,opts:readonly (readonly [string,string])[])=><label key={key}>{label}<select aria-label={label} disabled={(key==="education"&&!!educationId)||(key==="spouseEducation"&&!!spouseEducationId)} value={input[key]??""} onChange={e=>set(key,e.target.value)}><option value="">Unknown / select</option>{opts.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>;
  const credentialLink=(owner:"applicant"|"spouse",id:string,change:(v:string)=>void)=>{
    const record=evidence.find(r=>String(r.id)===id&&r.kind==="education");
    const mapped=mapCanadaEducation(record,today,owner);
    return <><label>{owner==="applicant"?"Use saved applicant education":"Use saved spouse education"}<select aria-label={owner==="applicant"?"Use saved applicant education":"Use saved spouse education"} value={id} onChange={e=>{change(e.target.value);setSubmitted(false);}}><option value="">Independent manual input</option>{id&&(!record||record.values.canadaEducationOwner!==owner)&&<option value={id}>Previously selected record unavailable</option>}{evidence.filter(r=>r.kind==="education"&&r.values.canadaEducationOwner===owner).map(r=><option key={r.id} value={String(r.id)}>{r.values.qualification} — record {r.id}</option>)}</select></label>
    {id&&<p role="status">{mapped.ok?mapped.label+(mapped.validUntil?"; ECA last valid date "+mapped.validUntil:"; Canadian credential (no ECA required)")+". Self-reported evidence only.":mapped.reason} Unlink to restore your independent input.</p>}</>;
  };
  return <div className="card stack">
    <h2>Canada — FSW and CRS scenario</h2>
    <p>Official rules reviewed 25 November 2026. Enter confirmed facts; this is a self-reported scenario, not an official decision. No data leaves this browser. Change inputs to compare scenarios; unknown is not zero.</p>
    <p><a href={ROOT+"who-can-apply/federal-skilled-workers.html"} target="_blank" rel="noopener noreferrer">FSW requirements</a> · <a href={ROOT+"check-score/crs-criteria.html"} target="_blank" rel="noopener noreferrer">CRS criteria</a> · <a href={ROOT+"check-score/high-wage.html"} target="_blank" rel="noopener noreferrer">High-wage NOC list</a></p>
    <details open><summary>Applicant and language</summary>
      <ProfileAgeControl age={profileAge} linked={linked} onChange={v=>{setLinked(v);setSubmitted(false);}}/>
      {field("age","Age in completed years","","number")}
      {credentialLink("applicant",educationId,setEducationId)}
      <p className="small muted">Single-credential mapping reviewed {canadaEducationReview.reviewedOn}. <a href={canadaEducationSource} target="_blank" rel="noopener noreferrer">Official ECA and equivalency guidance</a>. Multiple credentials and regulated professional equivalencies require manual review; this is not independent document verification.</p>
      {select("education","Highest confirmed Canadian-equivalent education",education)}
      {field("credential","Type canadian for Canadian credential; otherwise ECA report date","canadian or YYYY-MM-DD")}
      {select("firstKind","First official language",[["english","English"],["french","French"]])}
      <label>Use saved first-language evidence<select value={languageId} onChange={e=>{setLanguageId(e.target.value);setSubmitted(false);}}><option value="">Independent manual input</option>{languageId&&!selected&&<option value={languageId}>Previously selected record removed</option>}{evidence.filter(r=>r.kind==="language").map(r=><option key={r.id} value={String(r.id)}>{r.values.test} — record {r.id}</option>)}</select></label>
      {languageId&&<p role="status">{languageResult.ok?languageResult.kind===input.firstKind?"Linked benchmark levels (speaking, listening, reading, writing): "+languageResult.levels.join(", "):"Select the matching first official language to use the linked record.":languageResult.reason} Unlink to restore your independent input.</p>}
      {field("first","Four first-language approved CLB/NCLC levels, comma-separated, or none","9,9,9,9")}
      {field("firstDate","First approved test result date","","date")}
      {field("second","Four second-language approved benchmarks or none","none")}
      {field("secondDate","Second approved test result date if applicable","","date")}
      <p>Use <a href={ROOT+"documents/language-test.html"} target="_blank" rel="noopener noreferrer">official benchmark conversion</a>, not IELTS bands. Tests must be less than two years old, ECAs less than five. Confirm all required ECAs if claiming multiple credentials.</p>
    </details>
    <details open><summary>Federal Skilled Worker</summary>
      <div className="card stack"><h3>Canadian occupation reference</h3><p>Reference subset, {nocReview.version}; reviewed {nocReview.reviewedOn}. Check duties against the <a href={nocDutiesSource} target="_blank" rel="noopener noreferrer">official NOC site</a> and <a href={nocSource} target="_blank" rel="noopener noreferrer">full IRCC code list</a>. A listed code and TEER alone do not prove qualifying work or eligibility.</p>
      <label>Use saved employment occupation<select value={occupationId} onChange={e=>setOccupationId(e.target.value)}><option value="">Independent NOC lookup</option>{occupationId&&!occupationRecord&&<option value={occupationId}>Previously selected record removed</option>}{evidence.filter(r=>r.kind==="employment").map(r=><option key={r.id} value={String(r.id)}>{r.values.role} — record {r.id}</option>)}</select></label>
      <label>NOC 2021 code<input value={occupationId?(occupationRecord?.values.occupation??""):occupationCode} disabled={!!occupationId} maxLength={5} onChange={e=>setOccupationCode(e.target.value)}/></label>
      <p role="status">{occupation.status==="listed"?occupation.occupation.code+" — "+occupation.occupation.title+" — TEER "+occupation.occupation.teer+". "+(occupation.fswTeerBand?"Within the FSW occupation TEER range only.":"Outside the FSW TEER 0–3 range.")+" Duties, paid work, hours and dates require separate review.":occupation.reason}</p>
      </div>
      {field("fswYears","Qualifying full-time equivalent skilled years in last ten years","","number")}
      {select("continuousWork","At least one continuous year / 1,560 hours paid in primary TEER 0–3 NOC within last ten years; duties match; hours capped at 30/week",yn)}
      {select("validOffer","Qualifying arranged-employment offer under FSW rules, not a listing",yn)}
      {select("otherAdaptability","Other independently confirmed adaptability points (exclude arranged employment)",[["0","0 — none"],["5","5"],["10","10 or more before cap"]])}
      <p>Consult IRCC for qualifying spouse language, prior Canadian study/work and relatives. Applicant Canadian work may give 10, other qualifying factors 5 each. Do not double count.</p>
      {select("funds","Sufficient settlement funds for family size or valid exemption",yn)}
      {select("outsideQuebec","Intend to settle outside Quebec",yn)}
      {select("admissibility","Self-assessed admissibility requirements met (not official clearance)",yn)}
    </details>
    <details><summary>CRS — work and extra points</summary>
      {select("spouse","Accompanying spouse/partner who is not Canadian citizen or PR",yn)}
      {field("canadianYears","Confirmed qualifying Canadian work years in last ten","","number")}
      {field("foreignYears","Confirmed qualifying foreign work years in last ten, non-overlapping","","number")}
      {select("highWageWork","Verified Canadian high-wage work points (at least 12 qualifying months; official NOC tier)",[["0","0 — none"],["20","20 — 1.3×"],["40","40 — 1.5×"],["70","70 — 2×"]])}
      {select("highWageOffer","Verified qualifying high-wage job offer NOC tier",[["0","0 — none"],["50","50 — 1.3×"],["70","70 — 1.5×"],["100","100 — 2×"]])}
      <p>Use official NOC median wage tiers, not advertised salary. Work and offer LMI points are alternatives, not additive.</p>
      {input.spouse==="yes"&&<>{credentialLink("spouse",spouseEducationId,setSpouseEducationId)}{select("spouseEducation","Spouse confirmed education",education)}{field("spouseCredential","Spouse Canadian credential (canadian) or valid ECA date","canadian or YYYY-MM-DD")}{field("spouseLanguage","Spouse four approved language levels or none","none")}{field("spouseLanguageDate","Spouse test result date","","date")}{field("spouseYears","Spouse qualifying Canadian work years","","number")}</>}
      {select("tradeCertificate","Valid qualifying Canadian trade certificate",yn)}
      {select("nomination","Accepted valid provincial nomination",yn)}
      {select("sibling","Eligible adult Canadian citizen/PR sibling living in Canada",yn)}
      {select("canadianStudy","Independently confirmed Canadian education bonus",[["0","0 — none"],["15","15 — eligible 1–2 year credential"],["30","30 — eligible 3+ year or graduate credential"]])}
    </details>
    <button className="btn primary" onClick={()=>setSubmitted(true)}>Calculate local scenario</button>
    <button className="btn ghost" onClick={()=>{setInput({});setLanguageId("");setEducationId("");setSpouseEducationId("");setOccupationId("");setOccupationCode("");setSubmitted(false);}}>Clear Canada inputs</button>
    {result&&<div role="status" className="stack"><h3>FSW selection: {result.fsw.score??"Unknown"} / 100 (67 threshold)</h3><p>{result.fsw.status==="meets_screen"?"Meets self-reported screening requirements only":result.fsw.status==="does_not_meet_screen"?"Does not meet one or more screening requirements":"Unknown — missing or expired evidence"}</p>{Object.entries(result.fsw.factors).map(([k,v])=><p key={k}>{k}: {v}</p>)}{result.fsw.failed.length>0&&<p>Failed: {result.fsw.failed.join("; ")}</p>}{result.fsw.missing.length>0&&<p>Review: {result.fsw.missing.join("; ")}</p>}
      <h3>CRS scenario: {result.crs.score??"Unknown"} / 1270</h3>{Object.entries(result.crs.factors).map(([k,v])=><p key={k}>{k}: {v}</p>)}{result.crs.missing.length>0&&<p>Review: {result.crs.missing.join("; ")}</p>}<p>CRS is not proof of pool eligibility or invitation. Compare with the <a href={ROOT+"check-score.html"} target="_blank" rel="noopener noreferrer">official calculator</a>. Draw tracking and PNP eligibility pending.</p></div>}
  </div>;
}
