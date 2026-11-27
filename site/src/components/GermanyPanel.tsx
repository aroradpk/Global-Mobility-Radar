import { useState } from "react";
import ProfileAgeControl from "./ProfileAgeControl";
import {withProfileAge} from "../engine/unifiedProfile";
import {mapGermanyRecognition,withGermanyRecognition,germanyRecognitionSource} from "../engine/germanyRecognition";
import type {EvidenceRecord} from "../engine/profileEvidence";
import { assessGermany, DE_THRESHOLDS } from "../engine/germany.js";

const BASE = "https://www.make-it-in-germany.com/en/";
const ROUTES = [
  {id:"opportunity",label:"Opportunity Card",source:BASE+"visa-recognition/opportunity-card/job-search"},
  {id:"blue",label:"EU Blue Card",source:BASE+"visa-recognition/visa-types/eu-blue-card"},
  {id:"settlement",label:"Settlement permit",source:BASE+"arriving-living/long-term/settlement-permit"},
] as const;
const YES_NO = [["yes","Yes — confirmed"],["no","No"]] as const;
const GERMAN = [["none","None / below A1"],["A1","A1"],["A2","A2"],["B1","B1"],["B2+","B2 or higher"]] as const;
const STATUS = {review_required:"Review required",requirements_not_met:"Requirements not met / outstanding",meets_self_reported_screen:"Meets self-reported screen only"};
const eur = (v:number) => v.toLocaleString("en-IE",{style:"currency",currency:"EUR"});

export default function GermanyPanel({today,profileAge,evidence}:{today:string;profileAge:string;evidence:EvidenceRecord[]}){
  const [manualInput,setInput]=useState<Record<string,string>>({});
  const [linked,setLinked]=useState(false);
  const [opId,setOpId]=useState("");
  const [blueId,setBlueId]=useState("");
  const input=withGermanyRecognition(withGermanyRecognition(withProfileAge(manualInput,"opAge",linked,profileAge),opId,evidence,today,"opportunity"),blueId,evidence,today,"blue");
  const [active,setActive]=useState<"opportunity"|"blue"|"settlement">("opportunity");
  const [submitted,setSubmitted]=useState(false);
  const change=(key:string,value:string)=>{setInput(old=>({...old,[key]:value}));setSubmitted(false);};
  const field=(key:string,label:string,decimal=false)=><label key={key}>{label}<input type="number" min={0} step={decimal?"0.01":"1"} disabled={key==="opAge"&&linked} value={input[key]??""} onChange={e=>change(key,e.target.value)}/></label>;
  const select=(key:string,label:string,opts:readonly (readonly [string,string])[]=YES_NO)=><label key={key}>{label}<select aria-label={label} disabled={(!!opId&&(key==="opQualification"||key==="opForeignProof"))||(!!blueId&&(key==="blueQualification"||key==="blueDegreeProof"))} value={input[key]??""} onChange={e=>change(key,e.target.value)}><option value="">Unknown / select</option>{opts.map(([value,text])=><option value={value} key={value}>{text}</option>)}</select></label>;
  const result=submitted?assessGermany(input,today).find(r=>r.id===active):undefined;
  const route=ROUTES.find(r=>r.id===active)!;
  const recognitionLink=(mode:"opportunity"|"blue")=>{const id=mode==="opportunity"?opId:blueId;const setId=mode==="opportunity"?setOpId:setBlueId;const label=mode==="opportunity"?"Use saved Opportunity Card qualification":"Use saved Blue Card qualification";const selected=evidence.find(r=>String(r.id)===id);const mapped=mapGermanyRecognition(selected,today);return <><label>{label}<select aria-label={label} value={id} onChange={e=>{setId(e.target.value);setSubmitted(false);}}><option value="">Independent manual input</option>{id&&(!selected||selected.values.germanyCredentialOwner!=="applicant")&&<option value={id}>Previously selected record unavailable</option>}{evidence.filter(r=>r.kind==="education"&&r.values.germanyCredentialOwner==="applicant").map(r=><option key={r.id} value={String(r.id)}>{r.values.qualification} — record {r.id}</option>)}</select></label>{id&&<p role="status">{mapped.ok?(mode==="blue"&&!mapped.blueDegree?"Not sufficient for linked Blue Card degree route":mapped.basis):mapped.reason}. Unlink to restore manual inputs.</p>}<p className="small muted"><a href={germanyRecognitionSource} target="_blank" rel="noopener noreferrer">Official recognition guidance</a>. Self-reported evidence only.</p></>;};
  return <section className="card stack" aria-labelledby="germany-title">
    <h2 id="germany-title">Germany — job search, employment and settlement</h2>
    <p>Choose the pathway you want to assess. All facts are self-reported and remain in this browser. Rules reviewed 26 November 2026; fresh through 26 December 2026 for this preview. Not a grant decision.</p>
    <nav aria-label="German immigration pathways" className="section-nav">{ROUTES.map(r=><button type="button" className="btn small" key={r.id} aria-pressed={active===r.id} onClick={()=>{setActive(r.id);setSubmitted(false);}}>{r.label}</button>)}</nav>
    <a href={route.source} target="_blank" rel="noopener noreferrer">Official requirements for {route.label}</a>
    {active==="opportunity"&&<>
      <p>Temporary job-search permission, initially up to 12 months. A job offer is not required. The blocked-account benchmark is {eur(DE_THRESHOLDS.monthlyFunds)} per month; accepted alternatives need official confirmation.</p>
      {recognitionLink("opportunity")}
      {select("opQualification","Qualification route",[["recognised","German or fully recognised qualification"],["partial","Official partial recognition / compensation notice"],["foreign","Foreign credential recognised in country of acquisition"],["none","No qualifying credential"]])}
      {input.opQualification==="foreign"&&select("opForeignProof","Official proof (Anabin/ZAB/DAB as applicable); vocational training at least two years")}
      {input.opQualification==="partial"||input.opQualification==="foreign"?<>
        <ProfileAgeControl age={profileAge} linked={linked} onChange={v=>{setLinked(v);setSubmitted(false);}}/>
      {field("opAge","Age in completed years at application")}
        <p>Age bands follow official operational guidance: under 35, then 35–39. Confirm precise birthday boundary with the authority.</p>
        {select("opGerman","Verified German level",GERMAN)}
        {select("opEnglish","Verified English level",[["belowB2","None / below B2"],["B2","B2"],["C1+","C1 or above / accepted native-speaker evidence"]])}
        {select("opExperience","Relevant experience after qualifying education",[["none","Below qualifying thresholds"],["two","At least 2 years in last 5"],["five","At least 5 years in last 7"]])}
        {select("opShortage","Formal qualification is in a shortage occupation (not just current job)")}
        {select("opStay","At least 6 qualifying continuous months of legal German residence in last 5 years, not tourism")}
        {select("opPartner","Spouse / registered partner meets requirements and applies jointly at same authority for joint entry")}
      </>:null}
      {field("opMonths","Planned stay in months (1–12)")}
      {select("opFunding","Livelihood evidence",[["blocked","Blocked account"],["commitment","Accepted declaration of commitment"],["mixed","Other officially accepted / mixed funding"],["none","No sufficient funding"]])}
      {input.opFunding==="blocked"&&field("opBlocked","Available blocked-account funds in EUR",true)}
      {["blocked","commitment","mixed"].includes(input.opFunding)&&select("opFundingConfirmed","Funding evidence meets official requirements for entire stay")}
      {select("opportunityGeneral","Other applicable visa, insurance and entry requirements reviewed and met")}
    </>}
    {active==="blue"&&<>
      <p>Qualified employment with a specific job offer. 2026 annual gross thresholds: {eur(DE_THRESHOLDS.standard)} standard; {eur(DE_THRESHOLDS.reduced)} only for qualifying reduced routes.</p>
      {recognitionLink("blue")}
      {select("blueQualification","Qualification route",[["degree","Eligible comparable academic / equivalent tertiary qualification"],["itExperience","Qualifying IT experience without eligible formal qualification"],["none","Neither"]])}
      {input.blueQualification==="degree"&&select("blueDegreeProof","Official degree comparability or eligible 3-year tertiary level-6 credential confirmed")}
      {input.blueQualification==="itExperience"&&<>{field("blueITMonths","Qualifying IT work months in last 7 years")}{select("blueITLevel","Academic-level experience and matching ISCO 133 or 25 occupation confirmed")}</>}
      {select("blueOffer","Specific qualifying offer from employer in Germany")}
      {field("blueMonths","Contract months (enter 999 for indefinite)")}
      {select("blueMatch","Job matches qualification/experience; required professional licence held or in prospect")}
      {field("blueSalary","Confirmed annual gross qualifying salary in EUR",true)}
      {select("bluePayConfirmed","Contractual qualifying gross pay independently confirmed")}
      {input.blueQualification==="degree"&&input.blueSalary!==undefined&&Number(input.blueSalary)<DE_THRESHOLDS.standard&&<>{select("blueReduced","Qualifying shortage occupation or qualifying recent graduate verified")}</>}
      {(input.blueQualification==="itExperience"||(input.blueQualification==="degree"&&input.blueSalary!==undefined&&Number(input.blueSalary)<DE_THRESHOLDS.standard))&&select("blueBA","Required Federal Employment Agency approval confirmed")}
      {select("blueGeneral","Other residence/entry requirements and applicable refusal grounds reviewed")}
    </>}
    {active==="settlement"&&<>
      <p>For applicants already living and working in Germany. These are conditional settlement pathways, not automatic PR on arrival.</p>
      {select("settlementRoute","Current qualifying residence and pathway",[["blue","EU Blue Card"],["skilled","Qualifying skilled residence (sections 18a/18b/18d/18g)"],["germanGraduate","German education graduate with qualifying skilled residence"],["none","None of these"]])}
      {select("settlementGerman","Verified German proficiency",GERMAN)}
      {field("settlementMonths","Qualifying residence/employment months under selected route")}
      {field("settlementPension","Qualifying pension contribution months")}
      {input.settlementRoute==="germanGraduate"&&select("settlementGraduate","Completed qualifying German higher education or vocational training")}
      {select("settlementJob","Current qualifying authorised employment")}
      {select("settlementLiving","Livelihood secured")}
      {select("settlementHousing","Sufficient living space")}
      {select("settlementCivic","Basic German legal and social knowledge")}
      {select("settlementGeneral","Other applicable settlement requirements reviewed")}
    </>}
    <button type="button" className="btn primary" onClick={()=>setSubmitted(true)}>Assess {route.label}</button>
    <button type="button" className="btn ghost" onClick={()=>{setInput({});setLinked(false);setOpId("");setBlueId("");setSubmitted(false);}}>Clear Germany inputs</button>
    {result&&<section className="card stack" role="status">
      <h3>{result.label}</h3><strong>{STATUS[result.status]}</strong>
      {result.details.path&&<p>{result.details.path}</p>}
      {result.details.points!==undefined&&<p>Points: {result.details.points} / minimum 6</p>}
      {result.details.pointBreakdown&&<ul>{Object.entries(result.details.pointBreakdown).map(([key,value])=><li key={key}>{key}: {value}</li>)}</ul>}
      {result.details.blockedAccountRequiredEUR!==undefined&&<p>Blocked-account benchmark for planned stay: {eur(result.details.blockedAccountRequiredEUR)}</p>}
      {result.details.minimumSalaryEUR!==undefined&&<p>Applicable or candidate salary floor: {eur(result.details.minimumSalaryEUR)} annually</p>}
      {result.details.requiredMonths!==undefined&&<p>Required qualifying months: {result.details.requiredMonths}</p>}
      {result.failed.length>0&&<><h4>Outstanding requirements</h4><ul>{result.failed.map(v=><li key={v}>{v}</li>)}</ul></>}
      {result.missing.length>0&&<><h4>Information to confirm</h4><ul>{result.missing.map(v=><li key={v}>{v}</li>)}</ul></>}
      <p>Assessment date (UTC): {today}. Confirm supporting documents and official requirements before applying.</p>
    </section>}
  </section>;
}
