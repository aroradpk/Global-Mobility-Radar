import { useState } from "react";
import { assessCanada } from "../engine/canada.js";
const ROOT="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/";
const education=["Less than secondary","Secondary","One-year postsecondary","Two-year postsecondary","Bachelor / 3+ year credential","Two or more, one 3+ years","Master / eligible professional degree","Doctorate"].map((l,i)=>[String(i),l] as const);
const yn=[["yes","Yes — confirmed"],["no","No"]] as const;
export default function CanadaPanel(){
  const [input,setInput]=useState<Record<string,string>>({});
  const [result,setResult]=useState<ReturnType<typeof assessCanada>|null>(null);
  const set=(key:string,value:string)=>{setInput(old=>({...old,[key]:value}));setResult(null);};
  const field=(key:string,label:string,placeholder="",type="text")=><label key={key}>{label}<input type={type} value={input[key]??""} placeholder={placeholder} maxLength={40} onChange={e=>set(key,e.target.value)}/></label>;
  const select=(key:string,label:string,opts:readonly (readonly [string,string])[])=><label key={key}>{label}<select value={input[key]??""} onChange={e=>set(key,e.target.value)}><option value="">Unknown / select</option>{opts.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label>;
  return <div className="card stack">
    <h2>Canada — FSW and CRS scenario</h2>
    <p>Official rules reviewed 25 November 2026. Enter confirmed facts; this is a self-reported scenario, not an official decision. No data leaves this browser. Change inputs to compare scenarios; unknown is not zero.</p>
    <p><a href={ROOT+"who-can-apply/federal-skilled-workers.html"} target="_blank" rel="noopener noreferrer">FSW requirements</a> · <a href={ROOT+"check-score/crs-criteria.html"} target="_blank" rel="noopener noreferrer">CRS criteria</a> · <a href={ROOT+"check-score/high-wage.html"} target="_blank" rel="noopener noreferrer">High-wage NOC list</a></p>
    <details open><summary>Applicant and language</summary>
      {field("age","Age in completed years","","number")}
      {select("education","Highest confirmed Canadian-equivalent education",education)}
      {field("credential","Type canadian for Canadian credential; otherwise ECA report date","canadian or YYYY-MM-DD")}
      {select("firstKind","First official language",[["english","English"],["french","French"]])}
      {field("first","Four first-language approved CLB/NCLC levels, comma-separated, or none","9,9,9,9")}
      {field("firstDate","First approved test result date","","date")}
      {field("second","Four second-language approved benchmarks or none","none")}
      {field("secondDate","Second approved test result date if applicable","","date")}
      <p>Use <a href={ROOT+"documents/language-test.html"} target="_blank" rel="noopener noreferrer">official benchmark conversion</a>, not IELTS bands. Tests must be less than two years old, ECAs less than five. Confirm all required ECAs if claiming multiple credentials.</p>
    </details>
    <details open><summary>Federal Skilled Worker</summary>
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
      {input.spouse==="yes"&&<>{select("spouseEducation","Spouse confirmed education",education)}{field("spouseCredential","Spouse Canadian credential (canadian) or valid ECA date","canadian or YYYY-MM-DD")}{field("spouseLanguage","Spouse four approved language levels or none","none")}{field("spouseLanguageDate","Spouse test result date","","date")}{field("spouseYears","Spouse qualifying Canadian work years","","number")}</>}
      {select("tradeCertificate","Valid qualifying Canadian trade certificate",yn)}
      {select("nomination","Accepted valid provincial nomination",yn)}
      {select("sibling","Eligible adult Canadian citizen/PR sibling living in Canada",yn)}
      {select("canadianStudy","Independently confirmed Canadian education bonus",[["0","0 — none"],["15","15 — eligible 1–2 year credential"],["30","30 — eligible 3+ year or graduate credential"]])}
    </details>
    <button className="btn primary" onClick={()=>setResult(assessCanada(input,new Date().toISOString().slice(0,10)))}>Calculate local scenario</button>
    <button className="btn ghost" onClick={()=>{setInput({});setResult(null);}}>Clear Canada inputs</button>
    {result&&<div role="status" className="stack"><h3>FSW selection: {result.fsw.score??"Unknown"} / 100 (67 threshold)</h3><p>{result.fsw.status==="meets_screen"?"Meets self-reported screening requirements only":result.fsw.status==="does_not_meet_screen"?"Does not meet one or more screening requirements":"Unknown — missing or expired evidence"}</p>{Object.entries(result.fsw.factors).map(([k,v])=><p key={k}>{k}: {v}</p>)}{result.fsw.failed.length>0&&<p>Failed: {result.fsw.failed.join("; ")}</p>}{result.fsw.missing.length>0&&<p>Review: {result.fsw.missing.join("; ")}</p>}
      <h3>CRS scenario: {result.crs.score??"Unknown"} / 1270</h3>{Object.entries(result.crs.factors).map(([k,v])=><p key={k}>{k}: {v}</p>)}{result.crs.missing.length>0&&<p>Review: {result.crs.missing.join("; ")}</p>}<p>CRS is not proof of pool eligibility or invitation. Compare with the <a href={ROOT+"check-score.html"} target="_blank" rel="noopener noreferrer">official calculator</a>. Draw tracking and PNP eligibility pending.</p></div>}
  </div>;
}
