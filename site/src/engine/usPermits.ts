import {yes,choice,field,when,number,minimum,type Field,type Route,type Facts,type Checks} from "./permitCore";
import {dateValue} from "./jobScreening";

const USCIS="https://www.uscis.gov/working-in-the-united-states/";
const TEMP=USCIS+"temporary-workers/";
const PERM=USCIS+"permanent-workers/";
const CFR="https://www.law.cornell.edu/cfr/text/8/214.2";
const IMM="https://www.ecfr.gov/current/title-8/chapter-I/subchapter-B/part-204/subpart-A/section-204.5";
const BULLETIN="https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin/2027/visa-bulletin-for-november-2026.html";
const BULLETINS="https://travel.state.gov/content/travel/en/legal/visa-law0/visa-bulletin.html";
const CHART="https://www.uscis.gov/visabulletininfo";
const PROCLAMATION="https://www.govinfo.gov/content/pkg/FR-2026-09-23/html/2026-19554.htm";
const H1=TEMP+"h-1b-specialty-occupations";
const common:Field[]=[
 yes("scope","Ordinary principal-applicant petition; no special exception, extension or unusual status history",true),
 yes("general","Petition, admissibility, consular or status procedure and applicable evidence reviewed with qualified immigration counsel"),
];
const transfer:Field[]=[...common,
 yes("relationship","US and foreign entities have documented qualifying parent, branch, subsidiary or affiliate relationship"),
 yes("business","Qualifying organization is doing business in the US and at least one other country for the intended stay"),
 field("months","Continuous qualifying full-time employment months abroad within applicable preceding three years"),
 yes("dates","Exact employment, travel, interruptions and applicable three-year reference period independently verified"),
 yes("petition","US qualifying entity is willing and able to petition for this transfer"),
 choice("office","US office status",[["existing","Established office"],["new","New office or uncertain status"]]),
 yes("foreignRole","Prior foreign employment was in qualifying managerial, executive or specialized knowledge capacity"),
];
function transferCheck(i:Facts,o:Checks){
 minimum(i,"months",12,"At least one continuous qualifying year of employment abroad required",o);
 const months=number(i.months);
 if(months!==null&&months>36)o.missing.push("Count only qualifying months within the applicable three-year period");
 if(i.office==="new")o.missing.push("New-office petition has separate requirements; individual review needed");
 o.details.push("Internal mobility requires an actual qualifying entity relationship and petition; multinational employment alone is not enough.");
}
const ebEmployer:Field[]=[...common,
 yes("offer","Permanent qualifying US job offer and employer willing to file I-140"),
 yes("ability","Employer evidence of ability to pay offered wage from priority date verified"),
 yes("labor","Required approved labor certification, or independently confirmed applicable statutory exception, verified"),
];
const eb2Fields:Field[]=[
 choice("basis","Underlying EB-2 classification basis",[["advanced","US advanced degree or foreign equivalent"],["bachelor","US bachelor's or foreign equivalent plus progressive experience"],["exceptional","Exceptional ability"]]),
 when(yes("credential","Recognised degree and equivalence evidence verified"),i=>i.basis==="advanced"||i.basis==="bachelor"),
 when(field("experience","Progressive post-baccalaureate specialty experience months"),i=>i.basis==="bachelor"),
 when(yes("experienceProof","Qualifying progressive experience supported by employer letters"),i=>i.basis==="bachelor"),
 when(yes("exceptional","Applicable exceptional-ability evidence and overall merits reviewed by qualified counsel"),i=>i.basis==="exceptional"),
];
function eb2Check(i:Facts,o:Checks){
 if(i.basis==="bachelor")minimum(i,"experience",60,"Bachelor's equivalence route requires at least five progressive post-degree years",o);
 if(i.basis==="exceptional")o.missing.push("Exceptional ability requires individual evidence and merits assessment");
}
// One dated, manually reviewed Department of State snapshot. Never roll forward automatically.
export const BULLETIN_MONTH="2026-11";
const finalDates={
 india:["2023-02-01","2013-11-01","2014-01-22"],
 china:["2023-08-01","2021-10-01","2022-01-22"],
 mexico:["C","2025-04-01","2024-06-15"],
 philippines:["C","2025-04-01","2023-08-15"],
 other:["C","2025-04-01","2024-06-15"],
} as const;
const filingDates={
 india:["2024-07-01","2015-01-15","2015-01-15"],
 china:["2024-07-01","2023-01-01","2024-04-01"],
 mexico:["C","2026-03-15","2024-08-01"],
 philippines:["C","2026-03-15","2024-01-01"],
 other:["C","2026-03-15","2024-08-01"],
} as const;
export function comparePriorityDate(priority:string,cutoff:string):"before_cutoff"|"not_before_cutoff"|"unavailable"|"unknown"{
 if(dateValue(priority)===null)return "unknown";
 if(cutoff==="C")return "before_cutoff";
 if(cutoff==="U")return "unavailable";
 if(dateValue(cutoff)===null)return "unknown";
 return priority<cutoff?"before_cutoff":"not_before_cutoff";
}
export function bulletinCutoffs(category:string,area:string,today:string){
 const idx=["eb1","eb2","eb3"].indexOf(category);
 if(dateValue(today)===null||today.slice(0,7)!==BULLETIN_MONTH||idx<0||!Object.prototype.hasOwnProperty.call(finalDates,area))return null;
 const key=area as keyof typeof finalDates;
 return {final:finalDates[key][idx],filing:filingDates[key][idx]};
}
function bulletinCheck(i:Facts,t:string,o:Checks){
 const cut=bulletinCutoffs(i.category,i.area,t);
 if(!cut){o.missing.push("Current monthly bulletin or supported chargeability/category not established");return;}
 o.details.push("November 2026 Final Action Date: "+cut.final);
 o.details.push("November 2026 Date for Filing: "+cut.filing);
 if(i.chargeability!=="yes"||i.priorityProof!=="yes"||dateValue(i.priority)===null||i.priority>t){o.missing.push("Confirm actual chargeability and documented priority date");return;}
 const describe=(c:string)=>comparePriorityDate(i.priority,c)==="before_cutoff"?"meets date test":comparePriorityDate(i.priority,c)==="unavailable"?"unavailable":"does not meet date test";
 o.details.push("Final action date comparison: "+describe(cut.final));
 o.details.push("Filing chart comparison: "+describe(cut.filing));
 o.details.push("A date equal to the cutoff does not qualify. Dates can retrogress; no waiting-time prediction.");
 o.missing.push("Confirm current visa availability and applicable USCIS filing chart or NVC instructions; this is not approval or permission to file.");
}
export const usRoutes:Route[]=[
 {id:"l1a",title:"L-1A — internal management transfer",kind:"Temporary intracompany work classification",source:TEMP+"l-1a-intracompany-transferee-executive-or-manager",
 links:[["Regulatory requirements",CFR]],
 intro:"Established-office transfer for qualifying managers/executives. Job title or seniority alone does not establish managerial capacity.",
 fields:[...transfer,yes("usRole","Proposed US duties satisfy executive or managerial capacity definition, including any function-manager evidence")],
 check:(i,_t,o)=>transferCheck(i,o)},
 {id:"l1b",title:"L-1B — specialized knowledge transfer",kind:"Temporary intracompany work classification",source:TEMP+"l-1b-intracompany-transferee-specialized-knowledge",
 links:[["Regulatory requirements",CFR]],
 intro:"Established-office transfer using qualifying organization-specific specialized knowledge. Generic programming experience alone is insufficient.",
 fields:[...transfer,yes("knowledge","Proposed duties require qualifying special knowledge of organization's products/services or advanced organizational processes; evidence reviewed"),yes("placement","Worksite and any third-party placement restrictions verified")],
 check:(i,_t,o)=>transferCheck(i,o)},
 {id:"h1b",title:"H-1B — specialty occupation",kind:"Temporary employer-petitioned work classification",source:H1,
 links:[["Regulatory requirements",CFR],["September 2026 proclamation",PROCLAMATION]],
 intro:"Employer petition for a qualifying specialty occupation. Cap selection is distinct from petition approval. Current entry restrictions, litigation and fees require case-specific confirmation; no selection probability is calculated.",
 fields:[...common,yes("offer","Genuine specialty-occupation position and employer willing to petition"),
 yes("specialty","Position requires directly related specialized bachelor's degree or equivalent under current rules"),
 yes("qualification","Applicant has qualifying degree, equivalence or license as applicable"),
 yes("lca","Certified applicable Labor Condition Application and required wage (actual or prevailing, as applicable) confirmed"),
 choice("cap","Cap basis",[["selected","Valid cap selection for petition"],["exempt","Documented cap exemption or previously counted basis"],["pending","No selection yet / registration pending"]]),
 when(yes("capProof","Current cap selection or exemption documentation and filing window verified"),i=>i.cap==="selected"||i.cap==="exempt"),
 yes("feeReview","Current USCIS instructions, court orders, entry restrictions, fees and case applicability independently checked",true)],
 check:(i,_t,o)=>{if(i.cap==="pending")o.missing.push("Cap selection or valid exemption remains outstanding");o.details.push("The September 2026 proclamation extends a disputed USD 100,000 payment policy; court orders affect enforcement. No fixed fee is assumed. Check current official instructions and counsel before filing.");}},
 {id:"o1",title:"O-1A — extraordinary ability",kind:"Temporary work classification · discretionary evidence review",source:TEMP+"o-1-visa-individuals-with-extraordinary-ability-or-achievement",
 links:[["Regulatory requirements",CFR]],
 intro:"Science, education, business or athletics extraordinary ability. US employer or agent petition required; not ordinary skilled-worker eligibility or unrestricted self-petition.",
 fields:[...common,yes("petitioner","Eligible US employer or agent will petition"),yes("work","Proposed US work continues in area of extraordinary ability"),yes("consult","Required advisory opinion, contract and itinerary evidence or applicable exception reviewed"),
 choice("evidence","Evidence route",[["award","Major internationally recognized award"],["criteria","At least three regulatory evidence criteria or applicable comparable evidence"],["none","Neither established"]]),
 when(field("criteria","Distinct regulatory criteria supported by evidence"),i=>i.evidence==="criteria")],
 check:(i,_t,o)=>{if(i.evidence==="none")o.failed.push("No supported extraordinary-ability evidence basis");if(i.evidence==="criteria"){minimum(i,"criteria",3,"At least three criteria required for ordinary criteria route",o);const n=number(i.criteria);if(n!==null&&n>8)o.missing.push("Ordinary O-1A criteria count cannot exceed eight");}o.missing.push("Individual extraordinary-ability merits and petition adjudication required");}},
 {id:"eb1a",title:"EB-1A — extraordinary ability",kind:"Immigrant petition · self-petition possible",source:PERM+"employment-based-immigration-first-preference-eb-1",
 links:[["Regulatory requirements",IMM],["Visa Bulletin",BULLETINS]],
 intro:"No job offer or labor certification required for qualifying extraordinary ability; sustained acclaim and final merits are individual assessments.",
 fields:[...common,yes("acclaim","Sustained national/international acclaim and recognized achievements documented"),
 yes("continue","Intends to continue work in field and prospectively benefit US"),
 choice("evidence","Evidence basis",[["award","Major internationally recognized award"],["criteria","Regulatory criteria or qualifying comparable evidence"],["none","Neither established"]]),
 when(field("criteria","Distinct regulatory criteria supported by evidence"),i=>i.evidence==="criteria")],
 check:(i,_t,o)=>{if(i.evidence==="none")o.failed.push("No supported extraordinary-ability evidence basis");if(i.evidence==="criteria"){minimum(i,"criteria",3,"At least three ordinary EB-1A evidence criteria required",o);const n=number(i.criteria);if(n!==null&&n>10)o.missing.push("Ordinary EB-1A criteria count cannot exceed ten");}o.missing.push("Individual final-merits assessment and visa availability required");}},
 {id:"eb1c",title:"EB-1C — multinational manager",kind:"Employer-sponsored immigrant petition",source:PERM+"employment-based-immigration-first-preference-eb-1",
 links:[["Regulatory requirements",IMM],["Visa Bulletin",BULLETINS]],
 intro:"Separate immigrant classification, not automatic conversion from L-1A. Ordinary multinational executive/manager case.",
 fields:[...common,yes("relationship","Qualifying US and foreign entity relationship verified"),yes("business","US petitioner has been doing business for at least one year"),
 field("months","Qualifying managerial or executive employment months abroad within applicable three-year period"),
 yes("dates","Correct statutory reference period and foreign managerial/executive employment independently checked"),
 yes("offer","Permanent US managerial or executive position and qualifying employer petition confirmed")],
 check:(i,_t,o)=>{minimum(i,"months",12,"At least one qualifying year abroad required",o);const n=number(i.months);if(n!==null&&n>36)o.missing.push("Count only months within applicable three-year period");o.details.push("No ordinary PERM requirement; approved petition still needs visa availability and final processing.");}},
 {id:"eb2",title:"EB-2 — employer-sponsored",kind:"Employer-sponsored immigrant petition",source:PERM+"employment-based-immigration-second-preference-eb-2",
 links:[["Regulatory requirements",IMM],["Visa Bulletin",BULLETINS]],
 intro:"Advanced-degree professional or exceptional-ability classification. Job and applicant must meet the applicable requirements.",
 fields:[...ebEmployer,...eb2Fields,yes("jobLevel","Job meets applicable EB-2 classification and labor certification requirements")],
 check:(i,_t,o)=>{eb2Check(i,o);o.details.push("I-140 classification is separate from visa number availability.");}},
 {id:"niw",title:"EB-2 — National Interest Waiver",kind:"Immigrant petition · self-petition possible · discretionary",source:PERM+"employment-based-immigration-second-preference-eb-2",
 links:[["Regulatory requirements",IMM],["USCIS policy update", "https://www.uscis.gov/sites/default/files/document/policy-manual-updates/20250115-Employment-BasedNationalInterestWaivers.pdf"],["Visa Bulletin",BULLETINS]],
 intro:"First establish underlying EB-2 classification, then individually demonstrate the national-interest waiver criteria. No automatic waiver for STEM or software experience.",
 fields:[...common,...eb2Fields,yes("merit","Proposed endeavor has substantial merit and national importance"),yes("positioned","Evidence shows applicant is well positioned to advance the endeavor"),yes("balance","Evidence supports benefit to US of waiving job offer and labor certification on balance")],
 check:(i,_t,o)=>{eb2Check(i,o);o.missing.push("Individual national-interest waiver adjudication and immigrant visa availability required");}},
 {id:"eb3",title:"EB-3 — skilled worker / professional",kind:"Employer-sponsored immigrant petition",source:PERM+"employment-based-immigration-third-preference-eb-3",
 links:[["Regulatory requirements",IMM],["Visa Bulletin",BULLETINS]],
 intro:"Ordinary permanent skilled worker or professional job; other-worker classification and special exceptions require separate review.",
 fields:[...ebEmployer,choice("basis","EB-3 category",[["skilled","Skilled worker"],["professional","Professional"],["other","Other worker or special category"]]),
 when(field("experience","Qualifying training or experience months"),i=>i.basis==="skilled"),
 when(yes("skillJob","Permanent job requires at least two years of qualifying training or experience"),i=>i.basis==="skilled"),
 when(yes("degree","US bachelor's or foreign equivalent degree; job requires degree and no unsupported substitution"),i=>i.basis==="professional"),
 yes("requirements","Meets all documented job-specific requirements")],
 check:(i,_t,o)=>{if(i.basis==="skilled")minimum(i,"experience",24,"At least two qualifying years required",o);if(i.basis==="other")o.missing.push("Other-worker classification outside this screen");}},
 {id:"bulletin",title:"Green-card priority date",kind:"Dated visa-number comparison · not petition eligibility",source:BULLETIN,
 links:[["Latest monthly bulletins",BULLETINS],["USCIS adjustment filing chart",CHART]],
 intro:"November 2026 snapshot only. Chargeability generally follows country of birth, not citizenship or current residence; cross-chargeability and exceptions need review. EB-3 other workers excluded.",
 fields:[choice("category","Employment preference category",[["eb1","EB-1"],["eb2","EB-2 (including NIW)"],["eb3","EB-3 skilled/professional"]]),
 choice("area","Verified chargeability area",[["india","India"],["china","China-mainland born"],["mexico","Mexico"],["philippines","Philippines"],["other","All other chargeability areas"]]),
 yes("chargeability","Actual chargeability including any exception independently verified",true),
 field("priority","Documented priority date","date"),yes("priorityProof","Actual priority date and retained-date eligibility verified",true)],
 check:bulletinCheck},
];
