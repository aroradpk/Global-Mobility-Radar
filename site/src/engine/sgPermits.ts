import {yes,choice,field,when,number,cents,type Field,type Facts,type Checks,type Route} from "./permitCore";
import {dateValue} from "./jobScreening";

const MOM="https://www.mom.gov.sg/passes-and-permits/";
const EP=MOM+"employment-pass/eligibility";
const PEP=MOM+"personalised-employment-pass/eligibility";
const TECH=MOM+"employment-pass/experienced-tech-professionals-with-skills-in-shortage";
const ICA="https://www.ica.gov.sg/information-and-e-services/citizenship-and-permanent-residence/permanent-residence/permanent-residence-application";
const SAT="https://www.mom.gov.sg/eservices/services/employment-s-pass-self-assessment-tool";
const C1=EP+"/compass-c1-salary-benchmarks";
// Official MOM age rows, <=23 through >=45, not interpolated.
const current={
 other:[5600,5832,6064,6295,6527,6759,6991,7223,7455,7686,7918,8150,8382,8614,8845,9077,9309,9541,9773,10005,10236,10468,10700],
 finance:[6200,6455,6709,6964,7218,7473,7727,7982,8236,8491,8745,9000,9255,9509,9764,10018,10273,10527,10782,11036,11291,11545,11800],
};
const future={
 other:[6000,6250,6500,6750,7000,7250,7500,7750,8000,8250,8500,8750,9000,9250,9500,9750,10000,10250,10500,10750,11000,11250,11500],
 finance:[6600,6877,7155,7432,7709,7986,8264,8541,8818,9095,9373,9650,9927,10205,10482,10759,11036,11314,11591,11868,12145,12423,12700],
};
export function epFloor(age:number,sector:string,announced=false):number|null{
 if(!Number.isInteger(age)||age<18||age>120||(sector!=="other"&&sector!=="finance"))return null;
 return (announced?future:current)[sector][Math.max(0,Math.min(22,age-23))];
}
const bands=[["0","0 points"],["10","10 points"],["20","20 points"]] as const;
const shareOptions=[["lt5","Below 5%"],["5to25","5% to below 25%"],["25toThird","25% to below one-third"],["thirdPlus","One-third or more"]] as const;
const exempt=(i:Facts)=>{const pay=cents(i.salary);return pay!==null&&pay>=2250000||i.exemption==="ict"&&i.exemptionProof==="yes"||i.exemption==="short"&&i.exemptionProof==="yes";};
const scored=(i:Facts)=>!exempt(i);
const isTech=(i:Facts)=>i.duration==="tech";
const needsScore=(i:Facts)=>scored(i)||isTech(i);
const needsShare=(i:Facts)=>needsScore(i)&&(i.firm==="large"||i.sol==="yes");
const epFields:Field[]=[
 yes("scope","Ordinary adult new Employment Pass application in 2026; no renewal or exceptional arrangement",true),
 field("age","Age in completed years at application"),
 choice("sector","Employer's official MOM sector",[["other","Non-financial services"],["finance","Financial services"]]),
 field("salary","Qualifying fixed monthly salary in SGD","money"),
 yes("salaryProof","Fixed monthly salary components, currency and employer sector confirmed; excludes variable bonuses"),
 yes("offer","Genuine qualifying Singapore professional job offer and employer or appointed agent will submit"),
 yes("fcf","Employer verified Fair Consideration Framework advertising or applicable documented exemption"),
 yes("general","All applicable employer, candidate, job, identity and work-pass conditions reviewed"),
 choice("duration","Requested EP type",[["ordinary","Ordinary EP"],["tech","Five-year shortage-tech EP"]]),
 choice("exemption","COMPASS exemption basis (high salary assessed automatically)",[["none","No other exemption"],["ict","Qualifying overseas intra-corporate transferee"],["short","Role lasting one month or less"]]),
 when(yes("exemptionProof","Exact MOM exemption definition, evidence and applicable conditions independently confirmed",true),i=>i.exemption==="ict"||i.exemption==="short"),
 when(choice("c1","C1 — employer-confirmed age/sector salary benchmark points",bands),needsScore),
 when(yes("c1Proof","Correct current MOM C1 benchmark or SAT outcome verified"),needsScore),
 when(choice("c2","C2 — qualification points",bands),needsScore),
 when(yes("c2Proof","Current eligible qualification list or degree equivalence and verification proof checked"),i=>needsScore(i)&&(i.c2==="10"||i.c2==="20")),
 when(choice("firm","Employer's MOM PMET count category",[["small","Fewer than 25"],["large","25 or more"]]),needsScore),
 when(yes("workforceProof","Current employer Workforce Insights/SAT profile confirmed, not inferred from company size or nationality"),needsScore),
 when(choice("share","Candidate nationality share in employer's official PMET profile",shareOptions),needsShare),
 when(choice("c4Band","C4 — employer local PMET share percentile within sector",[["low","Below 20th"],["mid","20th to below 50th"],["high","50th or above"]]),i=>needsScore(i)&&i.firm==="large"),
 when(choice("local70","Employer local PMET share at least 70%?",[["yes","Yes"],["no","No"]]),i=>needsScore(i)&&i.firm==="large"&&i.c4Band==="low"),
 when(choice("sol","C5 — verified shortage occupation bonus claimed?",[["yes","Yes"],["no","No"]]),needsScore),
 when(yes("solProof","Current SOL job title, duties and any required occupation-specific experience/qualification/accreditation verified"),i=>needsScore(i)&&i.sol==="yes"),
 when(choice("sep","C6 — current awarded Strategic Economic Priorities bonus?",[["yes","Yes — reflected in SAT"],["no","No"]]),needsScore),
 when(yes("sepProof","MOM award remains valid on application date"),i=>needsScore(i)&&i.sep==="yes"),
 when(yes("techRole","Exact qualifying five-year technology occupation and additional verification checks confirmed"),isTech),
 when(field("techRate","Exact official five-year tech EP salary threshold for your age in SGD","money"),i=>isTech(i)&&Number(i.age)>36&&Number(i.age)<45),
 when(yes("techRateProof","Applicable five-year tech EP age threshold independently checked with MOM"),i=>isTech(i)&&Number(i.age)>36&&Number(i.age)<45),
];
function assessEp(i:Facts,o:Checks){
 const age=number(i.age),pay=cents(i.salary);
 if(age!==null){
  const floor=epFloor(age,i.sector),next=epFloor(age,i.sector,true);
  if(age<18||age>120)o.missing.push("Confirm adult age in supported scope");
  if(floor!==null){
   o.details.push("Current EP monthly salary floor: SGD "+floor);
   o.details.push("Announced new-application floor from 1 January 2027 at same age: SGD "+next+" (not applied now)");
   if(pay!==null&&pay<floor*100)o.failed.push("Stage 1 salary threshold not met");
  }
 }
 if(exempt(i)&&!isTech(i)){o.details.push("COMPASS exemption indicated; Stage 1 and other conditions still apply");return;}
 if(i.duration==="tech"&&exempt(i)){
  o.missing.push("Five-year tech EP requires COMPASS pass and C3 points; verify with MOM if also exempt");
 }
 const point=(key:string)=>["0","10","20"].includes(i[key])?Number(i[key]):null;
 const c1=i.c1Proof==="yes"?point("c1"):null;
 const c2=i.c2==="0"?0:i.c2Proof==="yes"?point("c2"):null;
 const share=shareOptions.some(([k])=>k===i.share)?i.share:null;
 const c3=i.workforceProof!=="yes"?null:i.firm==="small"?10:i.firm==="large"&&share!==null?share==="lt5"?20:share==="5to25"?10:0:null;
 const c4=i.workforceProof!=="yes"?null:i.firm==="small"?10:i.firm==="large"?i.c4Band==="high"?20:i.c4Band==="mid"?10:i.c4Band==="low"&&["yes","no"].includes(i.local70)?i.local70==="yes"?10:0:null:null;
 const c5=i.sol==="no"?0:i.sol==="yes"&&i.solProof==="yes"&&share!==null&&i.workforceProof==="yes"?share==="thirdPlus"?10:20:null;
 const c6=i.sep==="no"?0:i.sep==="yes"&&i.sepProof==="yes"?10:null;
 const scores=[c1,c2,c3,c4,c5,c6];
 o.details.push(scores.map((v,j)=>"C"+(j+1)+": "+(v??"unknown")).join(" · "));
 if(scores.every(v=>v!==null)){
  const total=scores.reduce<number>((a,v)=>a+(v??0),0);
  o.details.push("COMPASS total: "+total+" points; pass threshold 40");
  if(total<40)o.failed.push("Stage 2 COMPASS score below 40");
 }else{
  const confirmed=scores.reduce<number>((a,v)=>a+(v??0),0);
  o.details.push("Confirmed COMPASS subtotal: "+confirmed+"; total unknown until all requested evidence is confirmed");
  o.missing.push("Complete current COMPASS evidence; unknown is not zero");
 }
 if(isTech(i)){
  if(i.sol==="no")o.failed.push("Five-year technology route requires qualifying SOL occupation");
  if(c3!==null&&c3<10)o.failed.push("Five-year tech EP requires at least 10 C3 points");
  if(age!==null&&age>=18&&age<=120){
   const rate=age<=36?1070000:age>=45?1427000:i.techRateProof==="yes"?cents(i.techRate):null;
   if(rate!==null){
    if(age>36&&age<45&&(rate<1070000||rate>1427000))o.missing.push("Manual tech threshold outside published age-band range");
    else{o.details.push("Five-year tech EP monthly salary threshold: SGD "+rate/100);if(pay!==null&&pay<rate)o.failed.push("Five-year tech EP salary below threshold");}
   }
  }
 }
}
const prFields:Field[]=[
 yes("scope","Ordinary adult main applicant using current Employment Pass or S Pass category",true),
 choice("pass","Current valid immigration/work status",[["ep","Employment Pass"],["sp","S Pass"],["other","Other pass or no current pass"]]),
 yes("documents","Current ICA checklist reviewed; identity, employment, qualifications, applicable family evidence and translations prepared"),
 yes("ns","Applicable National Service obligations for applicant and dependants reviewed with official guidance"),
 yes("general","Current ICA application declarations, fees and Re-Entry Permit conditions understood"),
];
function pepCheck(i:Facts,t:string,o:Checks){
 const pay=cents(i.salary);
 o.details.push("Initial monthly fixed salary minimum: SGD 22500");
 o.details.push("Ongoing conditions: SGD 270000 fixed salary per calendar year; no unemployment period exceeding six months.");
 if(pay!==null&&pay<2250000)o.failed.push("Initial fixed monthly salary below SGD 22500");
 if(i.basis==="overseas"&&i.lastPaid&&dateValue(i.lastPaid)!==null&&i.lastPaid<=t){
  const d=new Date(i.lastPaid+"T00:00:00Z"),day=d.getUTCDate();d.setUTCDate(1);d.setUTCMonth(d.getUTCMonth()+6);
  d.setUTCDate(Math.min(day,new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate()));
  const end=d.toISOString().slice(0,10);
  if(t>end)o.failed.push("Overseas salary last drawn more than six months ago");
  else if(t===end)o.missing.push("Exact six-month boundary: verify salary date with MOM");
 }
}
export const sgRoutes:Route[]=[
 {id:"ep",title:"Employment Pass and COMPASS",kind:"Employer-linked work pass · not permanent residence",source:EP,
 intro:"Stage 1 age/sector salary and Stage 2 COMPASS, unless exempt. Current ordinary new application; employer-only facts must come from current MOM records. Future salary table is shown for planning only.",
 links:[["C1 salary benchmarks",C1],["Employer self-assessment",SAT],["Five-year technology EP",TECH]],
 fields:epFields,check:(i,_t,o)=>assessEp(i,o)},
 {id:"pep",title:"Personalised Employment Pass",kind:"Personal work pass · no employer sponsorship · non-renewable",source:PEP,
 intro:"High-earning professionals can apply directly. One-time pass; no freelance, entrepreneurial or restricted work. Initial eligibility is separate from continuing conditions.",
 links:[["Pass conditions",MOM+"personalised-employment-pass/key-facts"]],
 fields:[yes("scope","Ordinary first adult PEP application",true),
 choice("basis","Current professional status",[["overseas","Overseas professional"],["ep","Current eligible Singapore Employment Pass holder"]]),
 field("salary","Qualifying fixed monthly salary in SGD equivalent","money"),
 when(field("lastPaid","Date overseas salary was last drawn","date"),i=>i.basis==="overseas"),
 yes("salaryProof","Salary evidence and qualifying fixed pay/FX calculation independently checked"),
 yes("first","Never previously issued a PEP"),
 yes("allowed","Not sponsorship-scheme EP holder, freelancer, sole proprietor, partner, director-shareholder or restricted occupation; no entrepreneurial activity intended"),
 yes("conditions","Understands continuing calendar-year income and unemployment limits"),
 yes("general","All remaining MOM identity, evidence and application requirements reviewed")],
 check:pepCheck},
 {id:"pr",title:"Permanent residence — readiness",kind:"Discretionary permanent residence application · no approval score",source:ICA,
 intro:"Employment Pass and S Pass holders may apply without a local sponsor. ICA assesses individual circumstances; there is no published guaranteed salary, points or residence-duration threshold. This checklist checks application readiness only.",
 fields:prFields,check:(i,_t,o)=>{
  if(i.pass==="other")o.missing.push("Other PR categories require official individual review; this screen is for current EP/S Pass holders");
  else if(i.pass==="ep"||i.pass==="sp")o.details.push("Current EP/S Pass category permits application without a local sponsor, subject to ICA verification.");
  o.details.push("ICA weighs family ties, economic contributions, qualifications, age, family profile and residence history. No approval probability calculated.");
  if(i.scope==="yes"&&(i.pass==="ep"||i.pass==="sp")&&i.documents==="yes"&&i.ns==="yes"&&i.general==="yes")o.details.push("Self-reported preparation checklist complete. This is not a PR eligibility or approval decision.");
  o.missing.push("Final eligibility and discretionary decision require ICA assessment");
 }},
];
