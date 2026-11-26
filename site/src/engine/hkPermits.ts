import { yes,choice,field,when,number,minimum,cents,type Field,type Route,type Facts,type Checks } from "./permitCore";
import { dateValue } from "./jobScreening";

const IMMD="https://www.immd.gov.hk/eng/";
const VISA=IMMD+"services/visas/";
const QMAS=VISA+"quality_migrant_admission_scheme.html";
const ASSESS=VISA+"assessment-routes.html";
const TTPS=VISA+"TTPS.html";
const GEP=VISA+"GEP.html";
const ROA=IMMD+"services/roa/eligible.html";
const FAQ=IMMD+"faq/";
const common:Field[]=[
 yes("scope","Ordinary adult non-Chinese principal applicant, not an extension or special immigration category",true),
 yes("nationality","Nationality is eligible under current scheme rules"),
 yes("general","Valid travel document, returnability, security, character and other normal immigration requirements reviewed"),
];
const qmasCommon:Field[]=[...common,
 field("age","Age in completed years at application"),
 yes("funds","Documented resources to support and accommodate yourself and all accompanying dependants without public assistance"),
 yes("character","No criminal or adverse immigration record in Hong Kong or elsewhere"),
 choice("academic","Basic academic prerequisite",[["degree","Recognised first degree or higher"],["special","Exceptional technical qualifications or proven professional achievements"],["none","Neither"]]),
];
function qmasPrerequisites(i:Facts,o:Checks){
 const age=number(i.age);
 if(age!==null){if(age>120)o.missing.push("Enter a plausible age");else if(age<18)o.failed.push("QMAS requires age 18 or older");}
 if(i.academic==="none")o.failed.push("Basic academic prerequisite not met");
 if(i.academic==="special")o.missing.push("Exceptional academic prerequisite requires individual Immigration Department review");
}
const criteria=[
 ["postgraduate","Eligible university master's or doctorate (recognised equivalent, not honorary or excluded branch qualification)"],
 ["stem","That eligible master's or doctorate is in a qualifying STEM subject"],
 ["languages","Proficient in written and spoken forms of two languages"],
 ["english","Proficient in written and spoken English"],
 ["experience","At least five years of graduate or specialist-level employment"],
 ["mnc","At least three years of graduate/specialist work in multinational or reputable enterprises"],
 ["industry","At least three years of graduate/specialist work in designated fields (innovation/technology, finance or international trade)"],
 ["international","At least two years of graduate/specialist work outside your home country/territory"],
 ["income","Qualifying annual income of at least HKD 1,000,000 in preceding year, with evidence"],
 ["business","Current qualifying ownership/control of business with annual profit at least HKD 5,000,000 in preceding year"],
 ["listed","Current qualifying ownership/control of listed company"]
] as const;
const optional=[["yes","Yes — evidence available"],["no","No"],["unknown","Unknown / not claimed"]] as const;
const criterionFields=criteria.map(([k,label])=>choice(k,label,optional));
function qmasGeneral(i:Facts,o:Checks){
 qmasPrerequisites(i,o);
 const age=number(i.age);
 let confirmed=age!==null&&age>=18&&age<=50?1:0;
 let unknown=age===null||age>120?1:0;
 for(const [key] of criteria){
  const value=i[key];
  if(key==="stem"&&i.postgraduate!=="yes"){
   if(value==="yes")o.missing.push("STEM criterion requires an eligible postgraduate degree; resolve inconsistent evidence");
   if(i.postgraduate!=="no"&&value!=="no")unknown++;
   continue;
  }
  if(value==="yes")confirmed++;
  else if(value!=="no")unknown++;
 }
 o.details.push("Confirmed criteria: "+confirmed+" / 12; possible with unresolved criteria: "+(confirmed+unknown)+" / 12");
 o.details.push("Current application threshold: 6 of 12; selection remains discretionary.");
 if(confirmed+unknown<6)o.failed.push("Fewer than six criteria even if unresolved criteria are met");
 else if(confirmed<6)o.missing.push("At least six independently supported criteria needed before submitting");
}
const ttpsCommon:Field[]=[...common,yes("first","No previous initial TTPS stay granted; ordinary first grant")];
const ttpsDegree:Field[]=[
 yes("degree","Eligible university bachelor-equivalent qualification confirmed on latest official list; no excluded branch or honorary degree"),
 yes("verification","Awarding institution or approved third-party academic verification evidence held"),
 field("graduation","Actual date of qualifying graduation","date"),
 field("workMonths","Completed qualifying full-time or self-employment months after graduation (non-overlapping)"),
 yes("workEvidence","Dates and qualifying employment/self-employment evidence verified"),
];
function durationCheck(i:Facts,t:string,o:Checks,category:"b"|"c"){
 const n=number(i.workMonths);
 if(n===null)return;
 if(category==="b"){
  minimum(i,"workMonths",36,"Category B requires at least 36 qualifying months within the last five years",o);
  if(n>60)o.missing.push("Category B work months cannot exceed the five-year window");
 }else if(n>=36)o.failed.push("Category C requires fewer than 36 qualifying work months");
 if(i.graduation&&dateValue(i.graduation)!==null&&i.graduation<=t){
  const start=new Date(i.graduation+"T00:00:00Z"),end=new Date(t+"T00:00:00Z");
  // Allow a partial calendar month for end-of-month interpretation; exact periods independently verified.
  const months=(end.getUTCFullYear()-start.getUTCFullYear())*12+end.getUTCMonth()-start.getUTCMonth();
  if(n>months)o.missing.push("Claimed employment months exceed elapsed time since graduation");
  if(category==="c"&&end.getUTCFullYear()-start.getUTCFullYear()>5)o.failed.push("Graduation year outside Category C five-year calendar-year rule");
 }
}
export const hkRoutes:Route[]=[
 {id:"qmasGeneral",title:"QMAS — general criteria",kind:"Talent admission · no initial job offer required",
 source:QMAS,links:[["Official criteria and current threshold",ASSESS],["QMAS FAQ",FAQ+"QMAS.html"]],
 intro:"Current 12-criterion questionnaire, not the former numerical points schedule. Confirm the prerequisites and at least six supported criteria. You may explicitly mark optional criteria unknown; this does not award credit. Meeting the threshold only permits consideration.",
 fields:[...qmasCommon,...criterionFields],check:(i,_t,o)=>qmasGeneral(i,o)},
 {id:"qmasAchievement",title:"QMAS — exceptional achievement",kind:"Talent admission · discretionary achievement assessment",
 source:ASSESS,links:[["Prerequisites",QMAS],["Achievement criteria FAQ",FAQ+"QMAS.html"]],
 intro:"Separate exceptional achievement route; no job offer. Ordinary seniority, qualifications or years of experience do not establish exceptional achievement.",
 fields:[...qmasCommon,choice("award","Exceptional recognised achievement award",optional),choice("contribution","Exceptional peer recognition or significant field contribution supported by evidence",optional)],
 check:(i,_t,o)=>{qmasPrerequisites(i,o);
 if(i.award!=="yes"&&i.contribution!=="yes"){if(i.award==="no"&&i.contribution==="no")o.failed.push("Neither exceptional achievement criterion is supported");else o.missing.push("At least one exceptional achievement criterion must be supported");}
 o.details.push("Assessment Panel and Director determine whether achievement qualifies.");}},
 {id:"ttpsA",title:"Top Talent — Category A",kind:"Talent work permission · no initial job offer",source:TTPS,
 intro:"High-income category. Normally 36 months initial stay if approved. Use taxable employment or qualifying business income, not personal investment gains or net worth.",
 links:[["Income evidence and currency conversion",FAQ+"TTPS.html"]],
 fields:[...ttpsCommon,field("income","Qualifying previous-year individual income in HKD equivalent","money"),
 yes("incomeProof","Tax/employer/business evidence supports qualifying annual income, ownership periods and official currency conversion; personal investment income excluded")],
 check:(i,_t,o)=>{const v=cents(i.income);o.details.push("Category A minimum: HKD 2,500,000 in the preceding year");if(v!==null&&v<250000000)o.failed.push("Qualifying income below HKD 2,500,000");}},
 {id:"ttpsB",title:"Top Talent — Category B",kind:"Talent work permission · no initial job offer",source:TTPS,
 intro:"Eligible university graduates with three years of qualifying post-graduation experience in preceding five years. Normally 24 months initial stay if approved.",
 links:[["Eligible university list and degree verification",TTPS],["Experience FAQ",FAQ+"TTPS.html"]],
 fields:[...ttpsCommon,...ttpsDegree,yes("window","Counted only qualifying post-graduation employment in the immediately preceding five years")],
 check:(i,t,o)=>durationCheck(i,t,o,"b")},
 {id:"ttpsC",title:"Top Talent — Category C",kind:"Quota-based talent work permission · no initial job offer",source:TTPS,
 intro:"Eligible recent graduates with fewer than three years of qualifying work. Normally 24 months initial stay if approved. Annual quota is first-come, first-served; this app does not check live quota availability.",
 links:[["Graduation calendar-year rule and quota guidance",FAQ+"TTPS.html"]],
 fields:[...ttpsCommon,...ttpsDegree,yes("notLocalStudent","Not an excluded non-local student with a full-time locally accredited HK undergraduate qualification"),
 yes("quota","Current Category C annual quota availability independently confirmed")],
 check:(i,t,o)=>durationCheck(i,t,o,"c")},
 {id:"gep",title:"General Employment Policy",kind:"Employer-linked employment visa · not permanent residence",source:GEP,
 intro:"Ordinary professional route; no universal salary floor. Confirm genuine employment and market-level compensation. Special technical-professional streams and exceptional qualifications require separate review.",
 fields:[...common,choice("education","Relevant qualification basis",[["degree","Recognised relevant degree"],["exception","Exceptional documented skills/experience"],["none","Neither"]]),
 yes("vacancy","Genuine vacancy and confirmed employment offer from actual Hong Kong employer"),
 yes("relevant","Job duties relevant to qualifications or professional experience"),
 choice("local","Local recruitment requirement",[["ordinary","Employer can substantiate inability to readily fill with local workforce"],["facilitated","Official applicable facilitation measure verified"],["no","Neither"]]),
 when(yes("facilitation","Employer documented exact current Talent List or high-remuneration facilitation eligibility; all other requirements met",true),i=>i.local==="facilitated"),
 yes("market","Complete remuneration package broadly matches current Hong Kong professional market rate"),
 yes("employer","Employer has provided required registration, financial, contract and sponsorship evidence or documented applicable exemption")],
 check:(i,_t,o)=>{if(i.education==="none")o.failed.push("Relevant qualification or exceptional evidence not available");if(i.education==="exception")o.missing.push("Exceptional education/skills basis requires individual review");if(i.local==="no")o.failed.push("Local recruitment requirement or applicable facilitation not demonstrated");}},
 {id:"permanent",title:"Permanent residence — right of abode",kind:"Permanent residence · category (d), non-Chinese applicant",source:ROA,
 intro:"Standard category (d) route for an adult non-Chinese applicant aged at least 21. Seven years of ordinary residence immediately before application, not just visa validity. Status requires approval by the Director of Immigration.",
 links:[["Application and residence evidence",IMMD+"services/right-of-abode-in-hksar/apply.html"],["Non-Chinese citizen position",IMMD+"residents/immigration/roa/eligible-position-non-chinese.html"]],
 fields:[yes("scope","Non-Chinese applicant aged 21+ under ordinary category (d); no transitional, derivative or other special right-of-abode claim",true),
 field("months","Completed consecutive qualifying ordinary residence months immediately before application"),
 yes("entry","Entered Hong Kong on valid travel document"),
 yes("residence","Actual ordinary residence, excluded immigration periods and temporary absences independently reviewed"),
 yes("declaration","Hong Kong is your only place of permanent residence; required declaration and evidence available"),
 yes("evidence","Residence, habitual home, family where applicable, income and tax evidence reviewed for Director's assessment")],
 check:(i,_t,o)=>{minimum(i,"months",84,"At least 84 qualifying consecutive ordinary residence months required",o);o.details.push("Approval of permanent resident status is required; no automatic right of abode from elapsed time.");}},
];
