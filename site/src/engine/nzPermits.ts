import { yes,choice,field,when,number,cents,minimum,type Field,type Route,type Facts,type Checks } from "./permitCore";

const INZ="https://www.immigration.govt.nz/";
const VISAS=INZ+"visas/";
const GREEN=INZ+"live/resident-visas-to-live-in-new-zealand/skilled-residence-pathways-in-new-zealand/green-list-pathway-to-residence/";
const WAGE=INZ+"live/resident-visas-to-live-in-new-zealand/skilled-residence-pathways-in-new-zealand/skilled-migrant-category-pathway-to-residence/pay-rates-for-the-skilled-migrant-category-resident-visa/";
const WTR_WAGE=INZ+"live/resident-visas-to-live-in-new-zealand/skilled-residence-pathways-in-new-zealand/work-to-residence-wage-rates/";
const SMC=VISAS+"skilled-migrant-category-resident-visa/";
const CHANGE=INZ+"about-us/news-centre/final-details-about-changes-to-the-skilled-migrant-category-resident-visa-and-work-to-residence-visa/";
const COMMIT=INZ+"live/resident-visas-to-live-in-new-zealand/permanent-residence/showing-your-commitment-to-new-zealand-for-permanent-residence/";
const MEDIAN_CENTS=3500;
const nzJob:Field[]=[
  yes("offer","Genuine current New Zealand job offer or qualifying current employment"),
  yes("accredited","Actual employer's current INZ accreditation verified"),
  field("hours","Guaranteed paid work hours per week"),
];
const common:Field[]=[
  yes("scope","Ordinary adult principal applicant; no special waiver, contractor or transitional exception required",true),
  ...nzJob,field("age","Age at residence application in completed years"),
  choice("contract","Employment duration", [["permanent","Permanent"],["fixed","Fixed-term"],["other","Contract for services or other arrangement"]]),
  when(field("contractMonths","Remaining fixed-term contract months at application"),i=>i.contract==="fixed"),
  yes("english","Approved English evidence meets applicable scores and validity rules (including permitted exceptions)"),
  yes("health","Applicable health requirements reviewed and met"),
  yes("character","Applicable character requirements reviewed and met"),
  yes("general","Remaining identity, family, entry and residence evidence requirements reviewed and met"),
];
function residence(i:Facts,o:Checks){
  const age=number(i.age);
  if(age!==null){if(age<18||age>120)o.missing.push("Confirm adult age in supported scope");else if(age>55)o.failed.push("Age exceeds 55 at residence application");}
  minimum(i,"hours",30,"At least 30 guaranteed hours per week required",o);
  if(i.contract==="fixed")minimum(i,"contractMonths",12,"Fixed-term employment must have at least 12 months remaining",o);
  if(i.contract==="other"){o.missing.push("Contract for services / special arrangement requires manual review");}
}
function checkPay(i:Facts,o:Checks,amount:number,label:string){
  o.details.push(label+": NZD "+(amount/100).toFixed(2)+" per hour");
  const pay=cents(i.payRate);
  if(pay!==null&&pay<amount)o.failed.push("Confirmed hourly pay below selected criterion");
}
function bound(i:Facts,o:Checks,key:string,max:number,label:string){const n=number(i[key]);if(n!==null&&n>max)o.missing.push(label);}
const greenPay:Field[]=[
  choice("wageKind","Official occupation-specific wage criterion",[["median","No specified Green List rate; median applies"],["specified","Specific Green List wage rate"],["exception","Special salary/contract or transitional case"]]),
  when(field("requiredPay","Verified official occupation-specific hourly NZD threshold","money"),i=>i.wageKind==="specified"),
  field("payRate","Confirmed qualifying gross hourly pay in NZD","money"),
  yes("payConfirmed","Applicable occupation wage, contractual hours and qualifying pay calculated under INZ rules"),
];
const smcCommon:Field[]=[...common,
  yes("skilled","Actual duties and skill level match applicable ANZSCO occupation (not NOL alone)"),
  choice("wageBasis","Applicable SMC wage-rate basis",[["current","Current NZD 35 median threshold confirmed"],["historical","Different historical/grace-period threshold or exception"]]),
  field("payRate","Confirmed qualifying gross hourly pay in NZD","money"),
  yes("payConfirmed","Relevant wage-rate basis, hours and pay components verified using INZ guidance"),
];
function smc(i:Facts,o:Checks){
  residence(i,o);
  if(i.wageBasis==="historical")o.missing.push("Historical or grace-period wage basis requires official manual review");
}
const experienceEvidence=yes("nzEvidence","Qualifying NZ work periods, pay, relevant visas, non-overlap, hours and applicable look-back window verified; exclude India Iconic/Skilled Work Visa periods");
const pointsOptions=[
 ["nzPhd","NZ doctorate — 6"],["nzMasters6","NZ masters, at least 30 weeks full-time in NZ plus bachelor — 6"],
 ["nzMasters5","Other qualifying NZ masters — 5"],["nzLevel8","NZ level 8 with supporting bachelor — 5"],["nzBachelor","NZ bachelor — 5"],
 ["foreignPhd","Overseas doctorate — 6"],["foreignMasters","Overseas masters with supporting bachelor — 5"],
 ["foreignLevel8","Overseas level 8 with supporting bachelor — 4"],["foreignBachelor","Overseas bachelor — 4"]
] as const;
const qualificationPoints:Record<string,number>={nzPhd:6,nzMasters6:6,nzMasters5:5,nzLevel8:5,nzBachelor:5,foreignPhd:6,foreignMasters:5,foreignLevel8:4,foreignBachelor:4};
function skillPoints(i:Facts):number|null{
  if(i.skillCategory==="qualification")return qualificationPoints[i.qualification]??null;
  if(i.skillCategory==="registration")return ["3","4","5","6"].includes(i.registrationPoints)?Number(i.registrationPoints):null;
  if(i.skillCategory==="income"&&i.wageBasis==="current"){
    const pay=cents(i.payRate);
    if(pay===null)return null;
    return pay>=10500?6:pay>=7000?4:pay>=5250?3:0;
  }
  return null;
}
export const nzRoutes:Route[]=[
 {id:"straight",title:"Straight to Residence",kind:"Resident visa · job offer required",source:VISAS+"straight-to-residence-visa/",
  intro:"Green List Tier 1 role, accredited employer and occupation-specific conditions. Resident status allows indefinite stay, with separate travel conditions.",
  links:[["Green List pathway and role requirements",GREEN]],
  fields:[...common,yes("tier","Current Green List Tier 1 occupation matched to actual duties"),
    yes("roleEvidence","All applicable Green List qualification, IQA, registration, experience and membership conditions verified"),...greenPay],
  check:(i,_t,o)=>{residence(i,o);if(i.wageKind==="median")checkPay(i,o,MEDIAN_CENTS,"Current default threshold");
    if(i.wageKind==="specified"){const rate=cents(i.requiredPay);if(rate!==null)checkPay(i,o,rate,"Self-confirmed official role threshold");}
    if(i.wageKind==="exception")o.missing.push("Special Green List wage or contractor criteria need manual review");}},
 {id:"workResidence",title:"Work to Residence",kind:"Resident visa · qualifying New Zealand employment required",source:VISAS+"work-to-residence-visa/",
  intro:"Ordinary Green List Tier 2 path. Count qualifying work in the 30 months before application, not total career experience.",
  links:[["Green List requirements",GREEN],["Historical wage rates and grace periods",WTR_WAGE]],
  fields:[...common,yes("tier","Current offer or employment matches eligible Green List Tier 2 role"),
    yes("roleEvidence","Current occupation, qualification, IQA, registration and other role-specific criteria met"),
    field("nzMonths","Qualifying non-overlapping NZ work months in immediately preceding 30 months"),
    yes("visaHistory","Qualifying visas and right-to-work history verified for required periods"),
    experienceEvidence,yes("historicalPay","Correct historical wage threshold, any grace period, and current qualifying pay verified against official rules")],
  check:(i,_t,o)=>{residence(i,o);minimum(i,"nzMonths",24,"At least 24 qualifying months within preceding 30 required",o);bound(i,o,"nzMonths",30,"Qualifying months cannot exceed 30 in this window");}},
 {id:"aewv",title:"Accredited Employer Work Visa",kind:"Temporary work visa · not residence",source:VISAS+"accredited-employer-work-visa/",
  intro:"Ordinary first AEWV. No blanket median-wage floor; qualifying market rate and employment law apply. Job check and employer accreditation are separate.",
  fields:[yes("scope","Ordinary first AEWV, not an exception, renewal or special sector",true),...nzJob,
    yes("jobCheck","Approved job check covers this specific position"),
    yes("agreement","Signed job offer and compliant agreement; no unlawful deductions, trial period or prohibited clauses"),
    yes("market","Pay meets the applicable market rate and statutory minimum"),
    choice("skill","Verified minimum skill evidence route",[["experience","Relevant full-time-equivalent work experience"],["qualification","Recognised level 4+ qualification in same field, or bachelor or higher in any field"],["exception","Special minimum-skill evidence exemption"]]),
    when(field("experience","Relevant full-time-equivalent work months"),i=>i.skill==="experience"),
    when(yes("experienceProof","Independent employment and corroborating pay/tax evidence (not CV alone)"),i=>i.skill==="experience"),
    when(yes("qualificationProof","Qualifying credential and IQA where required verified"),i=>i.skill==="qualification"),
    yes("jobSkills","Employer and ANZSCO/NOL job-specific skills and registration requirements met"),
    choice("level","Applicable ANZSCO or NOL skill level",[["1","1"],["2","2"],["3","3"],["4","4"],["5","5"]]),
    when(yes("english","Applicable AEWV English evidence verified"),i=>["3","4","5"].includes(i.level)),
    yes("noPayment","No money offered or promised in exchange for a job offer"),
    yes("health","Applicable health requirements met"),yes("character","Applicable character requirements met"),yes("general","Genuine purpose, identity and remaining visa conditions reviewed")],
  check:(i,_t,o)=>{minimum(i,"hours",30,"At least 30 guaranteed hours per week required",o);if(i.skill==="experience")minimum(i,"experience",24,"At least 24 full-time-equivalent relevant months required",o);if(i.skill==="exception")o.missing.push("Special skills exemption requires manual review");}},
 {id:"smcPoints",title:"Skilled Migrant — points",kind:"Resident visa · six points and job offer",source:SMC,
  intro:"Rules effective 24 August 2026. One skill category only, plus qualifying New Zealand work points. No invitation guarantee.",
  links:[["SMC wage threshold",WAGE],["August 2026 changes",CHANGE]],
  fields:[...smcCommon,
    choice("skillCategory","Single skill category",[["qualification","Qualification"],["registration","NZ occupational registration"],["income","Income"]]),
    when(choice("qualification","Recognised highest qualification",pointsOptions),i=>i.skillCategory==="qualification"),
    when(yes("qualificationProof","NZQCF recognition or IQA/LQEA confirmed; supporting bachelor and NZ full-time study evidence where required"),i=>i.skillCategory==="qualification"),
    when(choice("registrationPoints","Points for eligible NZ registration verified from INZ list",[["3","3"],["4","4"],["5","5"],["6","6"]]),i=>i.skillCategory==="registration"),
    when(yes("registrationProof","Current eligible occupational registration and evidence verified"),i=>i.skillCategory==="registration"),
    when(choice("level","ANZSCO skill level",[["higher","1–3"],["lower","4–5"]]),i=>i.skillCategory==="qualification"||i.skillCategory==="registration"),
    when(field("nzMonths","Qualifying NZ skilled work months in applicable look-back window"),i=>skillPoints(i)!==6),
    when(experienceEvidence,i=>skillPoints(i)!==6&&number(i.nzMonths)!==0),
    when(yes("afterRegistration","All claimed NZ work experience gained after qualifying registration"),i=>i.skillCategory==="registration"&&skillPoints(i)!==6&&number(i.nzMonths)!==0)],
  check:(i,_t,o)=>{
    smc(i,o);
    if(i.wageBasis!=="current")return;
    const points=skillPoints(i);
    if(i.skillCategory==="qualification"||i.skillCategory==="registration"){
      if(i.level==="higher")checkPay(i,o,MEDIAN_CENTS,"SMC skill level 1–3 floor");
      if(i.level==="lower")checkPay(i,o,5250,"SMC skill level 4–5 floor");
    }
    if(points===null)return;
    if(points===0){o.failed.push("Income below minimum points threshold");return;}
    if(points===6){o.details.push("Skill category points: 6; NZ work points not needed");return;}
    const months=number(i.nzMonths);
    if(months===null)return;
    const extra=months>=24?3:months>=18?2:months>=12?1:0;
    o.details.push("Skill points: "+points+"; eligible NZ work points: "+extra+"; combined: "+Math.min(6,points+extra)+" / 6");
    if(points+extra<6)o.failed.push("Fewer than six skilled residence points");
  }},
 {id:"smcExperience",title:"Skilled Migrant — work experience",kind:"Resident visa · experience pathway",source:SMC,
  intro:"New August 2026 pathway: relevant experience plus additional qualifying skilled work in New Zealand. Amber List requires extra conditions; Red List excluded.",
  links:[["SMC wage threshold",WAGE]],
  fields:[...smcCommon,choice("occupation","Verified ANZSCO 1–3 occupation and Red/Amber list status",[["ordinary","Eligible, not Amber or Red"],["amber","Amber List"],["red","Red List or skill level 4–5"]]),
    field("relevantMonths","Relevant qualifying experience months (last 10 years, excluding self-employment)"),
    field("nzMonths","Additional qualifying NZ skilled work months (last 4 years)"),experienceEvidence,
    yes("nonOverlap","Separate qualifying periods, no double counting across the two requirements")],
  check:(i,_t,o)=>{smc(i,o);if(i.occupation==="red")o.failed.push("Occupation excluded from this experience pathway");if(i.occupation==="amber")o.missing.push("Amber List extra requirements require manual review");minimum(i,"relevantMonths",36,"At least 36 relevant months required",o);minimum(i,"nzMonths",24,"At least 24 additional NZ skilled months required",o);bound(i,o,"relevantMonths",120,"Relevant months exceed ten-year window");bound(i,o,"nzMonths",48,"NZ months exceed four-year window");if(i.wageBasis==="current"&&i.occupation==="ordinary")checkPay(i,o,3850,"Current ordinary experience pathway floor");}},
 {id:"smcTrades",title:"Skilled Migrant — trades and technicians",kind:"Resident visa · trade qualification and experience",source:SMC,
  intro:"New August 2026 pathway for eligible trades and technician occupations with recognised qualifications and post-qualification experience.",
  links:[["SMC wage threshold",WAGE],["August 2026 changes",CHANGE]],
  fields:[...smcCommon,yes("occupation","Current job matches eligible Trades and Technician occupation list"),
    yes("qualification","Relevant level 4+ NZQCF qualification: required NZ credits or overseas IQA verified"),
    field("relevantMonths","Relevant post-qualification experience months (last 10 years)"),
    field("nzMonths","Additional qualifying NZ post-qualification skilled months (last 3 years)"),experienceEvidence,
    yes("nonOverlap","Separate relevant and NZ qualifying periods; no self-employment or double counting")],
  check:(i,_t,o)=>{smc(i,o);minimum(i,"relevantMonths",30,"At least 30 relevant post-qualification months required",o);minimum(i,"nzMonths",18,"At least 18 additional NZ skilled months required",o);bound(i,o,"relevantMonths",120,"Relevant months exceed ten-year window");bound(i,o,"nzMonths",36,"NZ months exceed three-year window");if(i.wageBasis==="current")checkPay(i,o,MEDIAN_CENTS,"Current trades pathway floor");}},
 {id:"permanent",title:"Permanent Resident Visa",kind:"Permanent residence · unlimited travel conditions",source:VISAS+"permanent-resident-visa/",
  intro:"Separate stage after a resident visa. This screen uses the ordinary physical-presence commitment route; other ways to show commitment need manual review.",
  links:[["Commitment requirements",COMMIT]],
  fields:[yes("scope","Ordinary principal applicant using physical-presence commitment route",true),
    field("residentMonths","Continuous qualifying resident visa months from first arrival or onshore grant"),
    yes("current","Current resident visa or expired no more than 90 days ago"),
    yes("conditions","All resident visa conditions met"),
    field("daysFirst","Days in NZ as resident in older of previous two 12-month periods"),
    field("daysSecond","Days in NZ as resident in most recent 12-month period"),
    yes("travelEvidence","Travel records and applicable two-year windows verified"),
    yes("character","Character and identity requirements met"),yes("general","Other applicable permanent residence requirements met")],
  check:(i,_t,o)=>{minimum(i,"residentMonths",24,"At least 24 continuous resident months required",o);for(const key of ["daysFirst","daysSecond"]){minimum(i,key,184,"At least 184 days in each separate 12-month period required",o);bound(i,o,key,366,"Days cannot exceed 366 per 12-month period");}}},
];
