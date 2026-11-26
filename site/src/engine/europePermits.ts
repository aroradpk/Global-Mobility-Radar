import { compareDutchSponsor, SALARY_RULES } from "./jobScreening";

import { yes, choice, field, when, number, minimum, salary, recentYears, evaluatePermit, type Field, type Route, type Facts } from "./permitCore";
import { nzRoutes } from "./nzPermits";
import { ukRoutes } from "./ukPermits";
import { hkRoutes } from "./hkPermits";
import { sgRoutes } from "./sgPermits";
export type { Facts } from "./permitCore";
export { REVIEWED, REVIEW_BY } from "./permitCore";
export type Country = "ireland" | "netherlands" | "newzealand" | "uk" | "hongkong" | "singapore";
const IE = "https://enterprise.gov.ie/en/what-we-do/workplace-and-skills/employment-permits/";
const ISD = "https://www.irishimmigration.ie/";
const IND = "https://ind.nl/en/";
const PAY = IND+"required-amounts-income-requirements";
const REGISTER = IND+"public-register-recognised-sponsors/public-register-work";
const CSEP = IE+"permit-types/critical-skills-employment-permit/";
const GEP = IE+"permit-types/general-employment-permit/";
const STAMP = ISD+"registering-your-immigration-permission/how-to-renew-your-current-permission/information-on-stamp-4-upgrades/";
const LTR = ISD+"my-situation-has-changed-since-i-arrived-in-ireland/long-term-residency/";
const OCCUPATIONS = IE+"employment-permit-eligibility/highly-skilled-eligible-occupations-list/critical%20skills%20occupations%20list.html";
const LMNT = IE+"employment-permit-eligibility/labour-market-needs-test/";
const HSM = IND+"residence-permits/work/highly-skilled-migrant";
const BLUE = IND+"residence-permits/work/european-blue-card-residence-permit";
const PR = IND+"replace-extend-renew-and-change/permanent-residency/permanent-residence-permit";
const EU_LONG = IND+"residence-permits/long-term-eu-residency/apply-for-a-residence-permit-for-long-term-eu-residents";
const nlAmount=(id:string)=>SALARY_RULES.find(rule=>rule.id===id)!.amount;
const ieCommon:Field[]=[
  yes("scope","Ordinary first employment-permit application for a non-EEA skilled worker; no special sector, renewal or exemption rules",true),
  yes("offer","Specific job offer from a bona-fide Irish employer"),
  yes("employer","Employer trading in Ireland, Revenue and applicable company registration verified; direct employment and pay"),
  yes("ratio","Employer meets applicable 50:50 workforce rule or documented statutory waiver"),
  yes("qualified","Relevant skills, experience, qualifications and any professional registration confirmed"),
  field("salary","Qualifying annual remuneration in EUR (excluding bonuses)","money"),
  yes("pay","Contract is based on 39 hours/week; qualifying pay components and applicable hourly/minimum wage checked",true),
  yes("general","Remaining permit conditions, start-date filing window and entry/registration requirements reviewed and met"),
];
const nlCommon:Field[]=[
  yes("scope","Ordinary first application for an adult non-EU/EEA/Swiss skilled worker; no special mobility, research, medical training or renewal rules",true),
  yes("offer","Qualifying employment contract with an employer in the Netherlands"),
  field("salary","Qualifying gross monthly salary in EUR (excluding holiday allowance)","money"),
  yes("pay","Contractual pay components, monthly payment and applicable income rules verified"),
  yes("general","General residence, entry/MVV and applicable professional requirements reviewed and met"),
];
const sponsorFields:Field[]=[
  field("employerName","Hiring legal entity name","text"),field("employerKvk","Hiring entity KvK number","text"),
  field("registerName","IND register legal name","text"),field("registerKvk","IND register KvK number","text"),
  field("publicationDate","Register publication date","date"),field("checkedDate","Date you checked the register","date"),
  yes("sourceConfirmed","Current official IND work register and actual hiring legal entity checked",true),
];
const ieRoutes:Route[]=[
  {id:"critical",title:"Critical Skills Employment Permit",kind:"Employment permit · not direct PR",source:CSEP,
    intro:"Ordinary skilled employment route: at least a two-year offer. The applicant must verify the actual occupation and remuneration, not just the job title.",
    links:[["Critical Skills Occupations List",OCCUPATIONS]],
    fields:[...ieCommon,choice("tier","Applicable Critical Skills category",[["listed","Listed occupation with relevant qualifying degree"],["graduate","Listed occupation with recent qualifying degree"],["high","High-remuneration eligible occupation"],["special","Public-sector / regulated / other special criterion"]]),
      when(yes("listed","Actual duties and specialism match the current Critical Skills list"),i=>["listed","graduate"].includes(i.tier)),
      when(yes("degree","Relevant degree or higher meets applicable qualification rules"),i=>["listed","graduate"].includes(i.tier)),
      when(field("degreeDate","Qualifying degree award date","date"),i=>i.tier==="graduate"),
      when(yes("eligible","Occupation is not ineligible or contrary to public interest"),i=>i.tier==="high"),
      field("contract","Confirmed offer duration in months (999 for indefinite)")],
    check:(i,t,o)=>{
      minimum(i,"contract",24,"Critical Skills offer must cover at least 24 months",o);
      if(i.tier==="listed")salary(i,40904,"year",o);
      if(i.tier==="graduate"){salary(i,36848,"year",o);if(i.degreeDate&& !recentYears(i.degreeDate,t,1))o.missing.push("Confirm the degree was awarded within 12 months before application");}
      if(i.tier==="high")salary(i,68911,"year",o,true);
      if(i.tier==="special")o.missing.push("Special remuneration/qualification category requires official manual review");
    }},
  {id:"general",title:"General Employment Permit",kind:"Employment permit · not direct PR",source:GEP,
    intro:"Standard General Employment Permit route. Reduced sector-specific thresholds and special exemptions require manual review.",
    links:[["Labour Market Needs Test",LMNT],["Occupation classification",IE+"employment-permit-eligibility/classification-of-employments/"]],
    fields:[...ieCommon,yes("eligible","Occupation is eligible and not on the ineligible occupations list"),
      yes("standard","Standard general remuneration category applies (no reduced sector or graduate exception)",true),
      choice("labour","Labour Market Needs Test evidence",[["passed","Required advertisements completed and evidence held"],["exempt","Documented applicable exemption confirmed"],["no","Not completed and no exemption"]])],
    check:(i,_t,o)=>{if(i.standard==="yes")salary(i,36605,"year",o);if(i.labour==="no")o.failed.push("Required Labour Market Needs Test or valid exemption outstanding");}},
  {id:"stamp4",title:"Stamp 4 upgrade",kind:"Renewable residence permission · not permanent residence",source:STAMP,
    intro:"For workers already in Ireland. Stamp 4 can remove the need for an employment permit; it is not an indefinite residence grant.",
    fields:[choice("basis","Qualifying employment permit basis",[["critical","Critical Skills Employment Permit"],["general","General Employment Permit"],["other","Mixed or other permit history"]]),
      field("months","Completed qualifying employment months in Ireland"),yes("registered","Current qualifying Stamp 1 registration and permit/employment history documented"),
      yes("general","Revenue employment record and current ISD registration documents and conditions verified")],
    check:(i,_t,o)=>{if(i.basis==="other")o.missing.push("Mixed or other permit history requires official review");else if(i.basis==="critical"||i.basis==="general"){const n=i.basis==="critical"?21:57;o.details.push("Required qualifying employment: "+n+" months");minimum(i,"months",n,"Insufficient qualifying employment months",o);}}},
  {id:"longterm",title:"Long Term Residency",kind:"Five-year renewable residence permission",source:LTR,
    intro:"Qualifying residence is counted from immigration stamps/IRP, not the start and end dates of work permits. Successful applicants may work for another five years without an employment permit.",
    fields:[field("months","Completed qualifying legal residence months (IRP or passport stamps)"),
      yes("history","Qualifying employment-permit residence history verified; excluded periods not counted"),
      yes("resident","Currently legally resident in Ireland"),yes("employed","In qualifying employment, not self-employed"),
      yes("character","Good character, compliance with previous permissions and no undue burden on the State"),
      yes("general","Other eligibility and evidence requirements verified")],
    check:(i,_t,o)=>minimum(i,"months",60,"At least 60 qualifying residence months required",o)},
];
const nlRoutes:Route[]=[
  {id:"hsm",title:"Highly Skilled Migrant",kind:"Employment-based residence · not direct PR",source:HSM,
    intro:"A first application requires a recognised IND sponsor and market-rate pay. Register identity does not guarantee that the employer will sponsor this vacancy.",
    links:[["2026 income criteria",PAY],["Official sponsor register",REGISTER]],
    fields:[...nlCommon,choice("tier","Salary criterion",[["age","Standard age-based threshold"],["reduced","Eligible orientation-year / graduate / research reduced criterion"]]),
      when(field("age","Age at first application in completed years"),i=>i.tier==="age"),
      when(yes("reduced","Independent confirmation of orientation-year eligibility and applicable three-year timing or current orientation-year permit"),i=>i.tier==="reduced"),
      yes("market","Agreed pay meets the market rate for this role"),...sponsorFields],
    check:(i,t,o)=>{
      const age=number(i.age);
      if(i.tier==="age"&&age!==null){if(age<18||age>120)o.missing.push("Confirm adult age within supported scope");else salary(i,nlAmount(age<30?"nl-under30":"nl-30plus"),"month",o);}
      if(i.tier==="reduced")salary(i,nlAmount("nl-reduced"),"month",o);
      const result=compareDutchSponsor({employerName:i.employerName??"",employerKvk:i.employerKvk??"",registerName:i.registerName??"",registerKvk:i.registerKvk??"",publicationDate:i.publicationDate??"",checkedDate:i.checkedDate??"",sourceConfirmed:i.sourceConfirmed==="yes"},t);
      if(result==="mismatch")o.failed.push("Hiring legal entity or KvK number differs from the register entry");
      else if(result==="unknown")o.missing.push("Current exact legal-name and KvK register evidence required (manual check)");
      else o.details.push("Manual exact sponsor identity match — not independently verified");
    }},
  {id:"blue",title:"EU Blue Card",kind:"Employment-based residence · not direct PR",source:BLUE,
    intro:"Recognition as an IND sponsor is not mandatory. The employer must still satisfy the Blue Card employer requirements.",
    links:[["2026 income criteria",PAY]],
    fields:[...nlCommon,field("contract","Confirmed contract duration in months (999 for indefinite)"),
      choice("qualification","Qualifying education or experience",[["degree","Relevant higher education of at least three years"],["it","IT manager or professional experience route"],["other","Other higher-education-level professional experience"],["none","None of the above"]]),
      when(yes("degree","Relevant diploma and Nuffic evaluation for foreign degree confirmed"),i=>i.qualification==="degree"),
      when(field("experience","Confirmed relevant experience months at higher-education level (IT: within last seven years)"),i=>["it","other"].includes(i.qualification)),
      when(yes("experienceProof","Experience level, occupational scope and documented qualifying periods confirmed"),i=>["it","other"].includes(i.qualification)),
      choice("tier","Blue Card salary criterion",[["standard","Standard"],["reduced","Recent higher-education graduate / doctoral defence"]]),
      when(field("degreeDate","Graduation or doctoral defence date","date"),i=>i.tier==="reduced"),
      when(yes("reduced","Qualifying higher education and reduced criterion timing confirmed"),i=>i.tier==="reduced"),
      yes("employer","Employer carries out economic activity and has no relevant prohibited fines in previous five years")],
    check:(i,t,o)=>{
      minimum(i,"contract",6,"Employment contract must last at least six months",o);
      if(i.qualification==="none")o.failed.push("Qualifying education or experience is required");
      if(i.qualification==="it"||i.qualification==="other")minimum(i,"experience",i.qualification==="it"?36:60,"Insufficient qualifying professional experience",o);
      const experience=number(i.experience);
      if(i.qualification==="it"&&experience!==null&&experience>84)o.missing.push("IT experience within seven years cannot exceed 84 non-overlapping months");
      if(i.tier==="standard")salary(i,nlAmount("nl-blue"),"month",o);
      if(i.tier==="reduced"){salary(i,nlAmount("nl-blue-reduced"),"month",o);if(i.degreeDate&&!recentYears(i.degreeDate,t,3))o.missing.push("Reduced Blue Card criterion needs a qualifying recent graduation/defence date");}
    }},
  {id:"permanent",title:"Permanent residence",kind:"Permanent regular residence · standard adult route",source:PR,
    intro:"This screen covers the normal five-year Dutch route, not EU long-term residence mobility exceptions or children's rules.",
    links:[["EU long-term residence and Blue Card mobility exceptions",EU_LONG]],
    fields:[yes("scope","Standard adult five-year Dutch route; no special residence-duration exception",true),
      field("months","Completed consecutive qualifying Dutch residence months"),
      yes("main","Main residence in Netherlands throughout; permits extended on time and all conditions met"),
      yes("current","Current valid permit for a non-temporary residence purpose"),
      yes("income","Applicable independent, sustainable and sufficient income requirements verified"),
      yes("brp","Registered with municipality in BRP"),
      yes("integration","Civic integration at least A2 or documented exemption"),
      yes("general","General conditions and truthful previous applications confirmed")],
    check:(i,_t,o)=>minimum(i,"months",60,"At least 60 consecutive qualifying months needed for standard route",o)},
];
export const PERMIT_ROUTES:Record<Country,Route[]>={ireland:ieRoutes,netherlands:nlRoutes,newzealand:nzRoutes,uk:ukRoutes,hongkong:hkRoutes,singapore:sgRoutes};
export function assessPermit(country:Country,id:string,input:Facts,today:string){return evaluatePermit(PERMIT_ROUTES[country]?.find(r=>r.id===id),input,today);}
