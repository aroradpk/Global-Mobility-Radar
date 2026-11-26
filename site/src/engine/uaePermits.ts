import {yes,choice,field,when,cents,number,recentYears,type Field,type Route,type Facts,type Checks} from "./permitCore";
import {dateValue} from "./jobScreening";

const PORTAL="https://u.ae/en/information-and-services/";
const RES=PORTAL+"visa-and-emirates-id/residence-visas/";
const ICP="https://icp.gov.ae/en/services/";
const GDRFA="https://www.gdrfad.gov.ae/en/services/";
const GREEN=ICP+"uae-green-residency/";
const GOLDEN=ICP+"uae-golden-residency/";
const WORK=PORTAL+"jobs/employment-in-the-private-sector/job-offers-and-work-permits-and-contracts/work-permits";
const OFFER="https://receipts.mohre.gov.ae/OfferInquiry/Index?langid=1";
const DUBAI_GOLD=GDRFA+"8ea80daa-f43e-11eb-0320-0050569629e8";
const common:Field[]=[
 yes("scope","Ordinary adult principal applicant; no special nationality, renewal, dependent or exceptional category",true),
 yes("passport","Valid passport and applicable entry, immigration and security conditions checked"),
 choice("authority","Applicable issuing authority",[["icp","ICP — federal route outside Dubai"],["dubai","GDRFA — Dubai"]]),
 yes("authorityProof","Current issuing-authority requirements and supporting documents independently confirmed"),
];
const residence:Field[]=[
 ...common,
 yes("medical","Applicable residence medical fitness and identity/Emirates ID procedures confirmed"),
 yes("insurance","Applicable health insurance requirements for applicant and accompanying family confirmed"),
 yes("general","Remaining residence evidence, fees, status adjustment and renewal conditions reviewed"),
];
const skilled:Field[]=[
 yes("contract","Valid approved employment contract within the UAE"),
 yes("degree","At least recognised bachelor's degree or equivalent; attestation/recognition as required"),
 field("salary","Qualifying monthly salary in AED equivalent","money"),
 yes("pay","Issuing authority's applicable salary components and currency evidence verified, not assumed from total package",true),
 yes("permit","Applicable employment/work permit evidence verified; residence alone does not authorise employment"),
];
function checkSalary(i:Facts,o:Checks,threshold:number){
 o.details.push("Published monthly salary requirement: AED "+threshold);
 const pay=cents(i.salary);
 if(pay!==null&&pay<threshold*100)o.failed.push("Qualifying salary below published threshold");
}
function checkAge(i:Facts,o:Checks){const age=number(i.age);if(age!==null){if(age>120)o.missing.push("Enter a plausible age");else if(age<18)o.failed.push("Ordinary adult work-permit scope requires age 18 or older");}}
export const uaeRoutes:Route[]=[
 {id:"jobseeker",title:"Jobseeker visit visa",kind:"Temporary visit · no permission to work",source:RES+"jobseeker-visit-visa",
 links:[["Federal ICP 60-day service requirements","https://icp.gov.ae/en/services-details/?serviceid=68e3509b5ae59b00117383ea"],["Dubai service requirements",GDRFA+"2a679791-408a-11ed-4fe5-0050569629e8"],["Work permit rules",WORK]],
 intro:"Federal single-entry visit; no initial host or sponsor required. Federal guidance permits either an eligible skilled occupation or a recent graduate of an approved top-500 university; both require a bachelor's degree or equivalent. Check issuing-authority interpretation before applying. Do not start work on a visit visa.",
 fields:[...common,
 choice("duration","Requested visit duration",[["60","60 days"],["90","90 days"],["120","120 days"]]),
 choice("basis","Eligibility basis",[["skilled","MoHRE professional level 1, 2 or 3"],["graduate","Recent graduate of approved top-500 university"],["neither","Neither"]]),
 when(choice("level","Verified MoHRE occupational level",[["1","1"],["2","2"],["3","3"],["other","Other"]]),i=>i.basis==="skilled"),
 when(yes("occupation","Current official occupation classification and actual duties verified"),i=>i.basis==="skilled"),
 when(yes("university","University included in Ministry-approved top-500 classification"),i=>i.basis==="graduate"),
 when(field("graduation","Qualifying graduation date","date"),i=>i.basis==="graduate"),
 yes("degree","Recognised bachelor's degree or equivalent and required documents"),
 yes("passportValidity","Passport has at least six months remaining at application"),
 yes("visitInsurance","Valid health insurance in the UAE and applicable travel documents confirmed"),
 yes("guarantee","Prescribed financial guarantee and applicable visa fees verified and available"),
 yes("visitConditions","Understands no work without proper work permit and will leave or regularise status before expiry")],
 check:(i,t,o)=>{
  if(["60","90","120"].includes(i.duration))o.details.push("Requested visit duration: "+i.duration+" days; not a work permit");
  if(i.basis==="neither")o.failed.push("Neither federal eligibility basis established");
  if(i.basis==="skilled"&&i.level==="other")o.failed.push("Skilled route requires MoHRE levels 1–3");
  if(i.basis==="graduate"&&i.graduation&&dateValue(i.graduation)!==null&&i.graduation<=t&&!recentYears(i.graduation,t,2))o.missing.push("Graduation at or beyond two-year boundary: verify date eligibility with authority");
  // Dubai's published service page lists requirements differently from the federal either/or wording.
  if(i.authority==="dubai")o.missing.push("Confirm Dubai-specific interpretation of skilled-worker/recent-graduate criteria directly with GDRFA");
 }},
 {id:"employment",title:"Employer-sponsored employment",kind:"Renewable employment residence · normally two years",source:RES+"residence-visa-for-working-in-the-uae",
 links:[["Official work permit rules",WORK],["MoHRE offer inquiry",OFFER],["Private-sector recruitment",PORTAL+"moving-to-the-uae/expatriates-working-in-the-uae/employment-of-expatriates-in-privately-held-companies"]],
 intro:"Ordinary private-sector mainland employment. A genuine offer is not permission to work: employer obtains the appropriate permit and completes residence procedures. No universal skilled salary threshold is inferred. Free-zone, government and domestic-worker routes require separate review.",
 fields:[...residence,field("age","Age in completed years at work permit application"),
 yes("mainland","Ordinary private-sector mainland employment under MoHRE; not a free-zone or government route",true),
 yes("offer","Official signed job offer and matching employment contract verified with MoHRE"),
 yes("employer","Actual employer's legal identity, licence and ability to obtain work permit verified"),
 yes("qualifications","Required academic recognition, profession licence and occupation-specific requirements confirmed"),
 yes("permitProcess","Employer confirms appropriate work permit and residence process; no work before authorisation"),
 yes("fees","Employer bears applicable recruitment, entry, travel and residence processing costs; no recruitment fee charged to worker")],
 check:(i,_t,o)=>{checkAge(i,o);if(i.mainland==="no"){o.failed=[];o.details=[];o.missing.push("Different employment authority or category requires manual review");}else o.details.push("Standard employment residence is normally renewable for two-year periods, subject to approval and continued eligibility.");}},
 {id:"green",title:"Green Residence — skilled worker",kind:"Five-year renewable self-sponsored residence",source:GREEN,
 links:[["Dubai skilled-worker entry service",GDRFA+"c4d66f28-408c-11ed-4fe5-0050569629e8"],["Work permits",WORK]],
 intro:"Ordinary skilled employee route. Residence does not require an employer sponsor, but a valid UAE employment contract and applicable work authorisation are required.",
 fields:[...residence,...skilled,
 choice("level","Verified MoHRE professional classification",[["1","1"],["2","2"],["3","3"],["other","Other"]]),
 yes("classification","Actual occupation and official professional level confirmed")],
 check:(i,_t,o)=>{checkSalary(i,o,15000);if(i.level==="other")o.failed.push("Green skilled-worker route requires level 1, 2 or 3");}},
 {id:"golden",title:"Golden Residence — skilled professional",kind:"Ten-year renewable self-sponsored residence",source:GOLDEN,
 links:[["Dubai specialist service and document requirements",DUBAI_GOLD],["Work permits",WORK]],
 intro:"Ordinary senior skilled-professional route. Requires valid UAE employment and work permit, recognised degree, qualifying pay and level 1 or 2 occupation. Other Golden categories have different requirements.",
 fields:[...residence,...skilled,
 choice("level","Verified MoHRE professional classification",[["1","1"],["2","2"],["other","Other"]]),
 yes("classification","Actual occupation matches eligible senior skilled level"),
 yes("licence","Professional licence obtained if required, or documented not applicable"),
 when(field("bankMonths","Months of documented salary bank transfers for Dubai"),i=>i.authority==="dubai"),
 when(yes("bankProof","Dubai salary transfer statements and salary certificate meet current service requirements"),i=>i.authority==="dubai"),
 yes("continuing","Understands residence renewal and continued eligibility conditions, including employment/pay changes")],
 check:(i,_t,o)=>{checkSalary(i,o,30000);if(i.level==="other")o.failed.push("Golden skilled-professional route requires level 1 or 2");
 if(i.authority==="dubai"){const months=number(i.bankMonths);if(months!==null&&months<6)o.failed.push("Dubai service requires the previous six months of salary transfer statements");}
 }},
 {id:"goldenTalent",title:"Golden Residence — exceptional technology talent",kind:"Ten-year renewable residence · authority assessment",source:GOLDEN,
 intro:"ICP lists exceptional digital technology talent separately from the salaried professional route. Ordinary software experience or salary does not establish exceptional talent. This checklist does not infer a nomination or eligibility.",
 fields:[...residence,yes("achievement","Evidence of exceptional digital technology achievements prepared"),
 yes("nomination","Relevant authority's current nomination/recommendation and category-specific requirements checked")],
 check:(_i,_t,o)=>{o.missing.push("Exceptional talent classification and nomination require individual official assessment");o.details.push("No salaried-professional threshold or automatic eligibility is applied to this exceptional category.");}},
];
