import { yes, choice, field, when, number, cents, minimum, type Field, type Route, type Facts, type Checks } from "./permitCore";
import { dateValue } from "./jobScreening";

const GOV="https://www.gov.uk/";
const RULES=GOV+"guidance/immigration-rules/immigration-rules-appendix-";
const SW=GOV+"skilled-worker-visa";
const GT=GOV+"global-talent-digital-technology";
const SWILR=GOV+"indefinite-leave-to-remain-tier-2-t2-skilled-worker-visa";
const GTILR=GOV+"indefinite-leave-to-remain-business-investor-global-talent";
const SPONSORS=GOV+"government/publications/register-of-licensed-sponsors-workers";
const FUTURE=GOV+"government/consultations/earned-settlement/outcome/a-fairer-pathway-to-settlement-government-response-to-the-consultation";
// Appendix Skilled Occupations Table 1: full, 90%, 80%, 70% annual columns,
// not percentages recalculated from rounded full rates. All rows based on 37.5h.
export const UK_IT_RATES=[
 ["2131","IT project managers",58200,52400,46600,40700],
 ["2132","IT managers",55000,49500,44000,38500],
 ["2133","IT business analysts, architects and systems designers",54900,49400,43900,38400],
 ["2134","Programmers and software development professionals",54700,49200,43700,38300],
 ["2135","Cyber security professionals",48500,43700,38800,34000],
 ["2136","IT quality and testing professionals",41200,37100,33400,33400],
 ["2137","IT network professionals",45600,41100,36500,33400],
 ["2139","Other IT professionals (including DevOps)",52300,47100,41800,36600],
 ["2141","Web design professionals",43800,39400,35100,33400],
] as const;
const roleOptions=UK_IT_RATES.map(r=>[r[0],r[0]+" — "+r[1]] as const);
const roles:Field[]=[
 choice("soc","Verified SOC 2020 code", [...roleOptions,["other","Other occupation — manual official rate"]]),
 yes("occupation","Actual duties and eligible skill level match current occupation rules; appropriate sponsor occupation code confirmed"),
 when(field("manualRate","Exact applicable official annual going-rate column at 37.5 hours (GBP)","money"),i=>i.soc==="other"),
 when(yes("manualRateConfirmed","Official table, occupation, category and published column independently checked",true),i=>i.soc==="other"),
 field("hours","Contractual weekly hours, regular pattern (up to 48)","money"),
 field("salary","Qualifying annual salary in GBP after applicable deductions (not total compensation)","money"),
 yes("pay","Guaranteed basic qualifying pay, deductions, pay periods, minimum wage and working-time rules confirmed",true),
];
const salaryOptions=[
 ["standard","A — standard"],["phd","B — qualifying relevant doctorate"],["stem","C — qualifying relevant STEM doctorate"],
 ["isl","D — Immigration Salary List"],["entrant","E — qualifying new entrant"]
] as const;
const initial:Field[]=[
 yes("scope","Ordinary adult first Skilled Worker application under options A–E; no transitional, health/education, special or irregular work rules",true),
 yes("sponsor","Actual hiring entity has the current appropriate Skilled Worker sponsor licence"),
 yes("cos","Valid job-specific Certificate of Sponsorship, current timing, start date and genuine job confirmed"),
 yes("english","B2 English in all four abilities or recognised exemption/evidence under current rules"),
 yes("funds","£1,270 held for required 28 days with timely evidence, or valid sponsor certification / exemption"),
 yes("general","All remaining entry or switching, suitability, identity, TB if applicable, fee and other validity requirements reviewed"),
];
function ukSalary(i:Facts,o:Checks,settlement=false){
 const option=i.option;
 const column=settlement?2:option==="standard"||option==="isl"?2:option==="phd"?3:option==="stem"?4:option==="entrant"?5:null;
 if(column===null)return;
 const floor=settlement?(option==="isl"?33400:41700):option==="standard"?41700:option==="phd"?37500:33400;
 const row=UK_IT_RATES.find(r=>r[0]===i.soc);
 const base=row?Number(row[column])*100:i.soc==="other"&&i.manualRateConfirmed==="yes"?cents(i.manualRate):null;
 const hours=cents(i.hours),pay=cents(i.salary);
 if(hours!==null&&hours>4800){o.missing.push("Over 48 hours or irregular hours require manual pay calculation");return;}
 if(base===null||hours===null||pay===null)return;
 // Exact integer arithmetic. Ceil fractional pennies, not approximate discount percentages.
 const rate=Math.ceil(base*hours/3750);
 const threshold=Math.max(rate,floor*100);
 o.details.push("General annual floor: GBP "+floor.toLocaleString("en-GB"));
 o.details.push("Going rate at entered hours: GBP "+(rate/100).toFixed(2));
 o.details.push("Required qualifying annual pay: GBP "+(threshold/100).toFixed(2));
 if(pay<threshold)o.failed.push("Qualifying pay below the higher applicable salary requirement");
}
const discountFields:Field[]=[
 choice("option","Applicable salary points option",salaryOptions),
 when(yes("phd","Eligible occupation for doctorate points; UK doctorate or verified equivalent and sponsor relevance explanation"),i=>i.option==="phd"||i.option==="stem"),
 when(yes("stem","Sponsor confirms eligible STEM subject"),i=>i.option==="stem"),
 when(yes("isl","Exact job and location qualify under the current Immigration Salary List"),i=>i.option==="isl"),
 when(yes("entrant","Qualifying new entrant basis under SW 12.2 verified"),i=>i.option==="entrant"),
 when(field("entrantMonths","Total combined Skilled Worker, Graduate and Tier 2 permission months including proposed grant"),i=>i.option==="entrant"),
 when(yes("entrantPeriod","Exact combined permission duration checked against four-year limit"),i=>i.option==="entrant"),
];
const settle:Field[]=[
 yes("scope","Ordinary current adult principal-applicant settlement, no exceptional residence or early-application calculation",true),
 field("months","Completed qualifying continuous residence months"),
 field("absence","Maximum non-exempt absence days in any rolling 12-month period"),
 yes("residence","Qualifying permission periods, actual dates and continuous-residence rules independently checked; not dependent time"),
 yes("life","Life in the UK requirement met or documented exemption"),
 yes("general","Current permission, suitability, lawful residence and other settlement requirements reviewed"),
];
function continuous(i:Facts,o:Checks,months:number){
 minimum(i,"months",months,"Required completed qualifying residence: "+months+" months",o);
 const absence=number(i.absence);
 if(absence!==null){if(absence>366)o.missing.push("Invalid rolling twelve-month absence total");else if(absence>180)o.failed.push("More than 180 non-exempt days absent in a rolling twelve-month period");}
}
const talentCriteria=[
 ["innovation","Innovation as qualifying founder, executive or employee"],
 ["outside","Recognition for contribution outside normal employment"],
 ["impact","Significant product-led digital technology contributions"],
 ["research","Published or expert-endorsed research"]
] as const;
export const ukRoutes:Route[]=[
 {id:"skilled",title:"Skilled Worker",kind:"Sponsored work visa · not direct PR",source:SW,
 intro:"A valid sponsor and job-specific CoS are mandatory. Salary must meet both the applicable general floor and the published going-rate column, adjusted to regular hours.",
 links:[["Immigration Rules",RULES+"skilled-worker"],["Occupation rates",RULES+"skilled-occupations"],["Sponsor register",SPONSORS],["Salary discounts",SW+"/when-you-can-be-paid-less"]],
 fields:[...initial,...discountFields,...roles],
 check:(i,_t,o)=>{
  if(i.option==="entrant"){const n=number(i.entrantMonths);if(n!==null&&n>48)o.failed.push("New entrant combined permission exceeds four years");}
  ukSalary(i,o);
 }},
 {id:"talentEvidence",title:"Global Talent — endorsement evidence",kind:"No job offer required · discretionary endorsement review",source:GT+"/eligibility",
 intro:"Digital technology evidence-readiness checklist, not an endorsement prediction. Years of experience alone do not prove exceptional talent or promise.",
 links:[["Evidence and documents",GT+"/documents-you-need-to-apply-endorsement"]],
 fields:[choice("category","Endorsement category",[["talent","Exceptional talent"],["promise","Exceptional promise"]]),
  yes("recognition","Documented recognition as a leader or potential leader within the last five years"),
  ...talentCriteria.map(([key,label])=>choice(key,label,[["yes","Evidence available"],["no","No evidence"]])),
  field("mandatoryDocs","Distinct recognition evidence documents"),
  field("optionalDocs","Distinct documents for the selected optional criteria"),
  field("letters","Independent recommendation letters from established experts"),
  yes("lettersQualified","Each of three experts knows your work for at least 12 months and letters meet all content requirements"),
  yes("documentRules","At least two documents per selected optional criterion, no reuse, each document meets page limits, CV and business evidence where applicable")],
 check:(i,_t,o)=>{
  const selected=talentCriteria.filter(([k])=>i[k]==="yes").length;
  const known=talentCriteria.every(([k])=>i[k]==="yes"||i[k]==="no");
  o.details.push("Optional criteria with self-reported evidence: "+selected+"; at least 2 required");
  if(known&&selected<2)o.failed.push("At least two distinct optional criteria needed");
  minimum(i,"mandatoryDocs",2,"At least two recognition documents required",o);
  minimum(i,"optionalDocs",4,"At least four optional-criterion documents required",o);
  minimum(i,"letters",3,"Three qualifying recommendation letters required",o);
  const a=number(i.mandatoryDocs),b=number(i.optionalDocs);
  if(a!==null&&b!==null&&a+b>10)o.failed.push("Evidence bundle exceeds ten documents (excluding CV and letters)");
  if(b!==null&&b<selected*2)o.missing.push("Supply two distinct documents per claimed optional criterion, or narrow the claim");
  const n=number(i.letters);if(n!==null&&n>3)o.missing.push("Use the required three qualifying recommendation letters");
  o.details.push("The endorsing body alone decides whether evidence qualifies.");
 }},
 {id:"talentVisa",title:"Global Talent — visa",kind:"Work visa · no employer sponsor or job offer required",source:GOV+"global-talent",
 intro:"Digital technology applicant who already has a valid endorsement or eligible prestigious prize. Concurrent endorsement and visa applications require separate review.",
 links:[["Endorsement timing",GT+"/apply-for-endorsement"],["Immigration Rules",RULES+"global-talent"]],
 fields:[yes("scope","Ordinary adult application with existing endorsement or eligible prize, not concurrent or special application",true),
  choice("basis","Evidence basis",[["endorsement","Existing endorsement"],["prize","Eligible prestigious prize"]]),
  when(field("endorsementDate","Home Office endorsement letter date","date"),i=>i.basis==="endorsement"),
  when(yes("endorsement","Correct eligible endorsement has not been withdrawn"),i=>i.basis==="endorsement"),
  when(yes("prize","Applicant personally won a prize on the applicable prestigious prizes list; not withdrawn or suspended"),i=>i.basis==="prize"),
  yes("general","Identity, entry or switching, suitability, TB where applicable and other validity requirements verified")],
 check:(i,t,o)=>{
  if(i.basis!=="endorsement"||!i.endorsementDate||dateValue(i.endorsementDate)===null||i.endorsementDate>t)return;
  const d=new Date(i.endorsementDate+"T00:00:00Z");const day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+3);
  const last=new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();d.setUTCDate(Math.min(day,last));
  if(t>=d.toISOString().slice(0,10))o.missing.push("Endorsement near or beyond three-month application boundary; confirm validity with Home Office");
 }},
 {id:"skilledIlr",title:"Skilled Worker — settlement",kind:"Indefinite leave to remain · current rules",source:SWILR,
 intro:"Current ordinary five-year route. No new-entrant or PhD discounted going rate at settlement. Announced Earned Settlement changes are not assumed to be in force.",
 links:[["Salary requirements",SWILR+"/salary-requirements"],["Immigration Rules",RULES+"skilled-worker"],["Policy announcement — future framework",FUTURE]],
 fields:[...settle,yes("sponsor","Most recent Skilled Worker sponsor remains licensed and requires continued employment with qualifying pay"),
  choice("option","Applicable settlement salary row",[["standard","A — ordinary"],["isl","B — Immigration Salary List"],["other","Transitional, health/education or other row"]]),
  when(yes("isl","Applicable Immigration Salary List settlement row B confirmed"),i=>i.option==="isl"),
  ...roles],
 check:(i,_t,o)=>{continuous(i,o,60);if(i.option==="other"){o.missing.push("Special settlement salary row requires manual review");return;}if(i.option==="standard"||i.option==="isl")ukSalary(i,o,true);}},
 {id:"talentIlr",title:"Global Talent — settlement",kind:"Indefinite leave to remain · current rules",source:GTILR+"/eligibility",
 intro:"Ordinary Global Talent digital-technology settlement: three years for exceptional talent or eligible prize; five for exceptional promise. Announced future settlement framework is not applied.",
 links:[["Immigration Rules",RULES+"global-talent"],["Policy announcement — future framework",FUTURE]],
 fields:[...settle,choice("basis","Original qualifying Global Talent grant",[["talent","Exceptional talent"],["promise","Exceptional promise"],["prize","Eligible prestigious prize"]]),
  when(yes("endorsement","Original endorsement has not been withdrawn"),i=>i.basis==="talent"||i.basis==="promise"),
  yes("current","Current or most recent permission was on the Global Talent route"),
  yes("earnings","Evidence of UK earnings in endorsed field or prize-related field during last permission"),
  yes("english","B1 speaking/listening or documented exemption under current settlement rules")],
 check:(i,_t,o)=>{if(["talent","promise","prize"].includes(i.basis))continuous(i,o,i.basis==="promise"?60:36);}},
];
