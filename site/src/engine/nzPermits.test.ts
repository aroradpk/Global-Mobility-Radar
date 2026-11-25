import {describe,it,expect} from "vitest";
import {assessPermit,type Facts} from "./europePermits";
const day="2026-11-26";
const common:Facts={scope:"yes",offer:"yes",accredited:"yes",hours:"30",age:"55",contract:"fixed",contractMonths:"12",english:"yes",health:"yes",character:"yes",general:"yes"};
const straight:Facts={...common,tier:"yes",roleEvidence:"yes",wageKind:"median",payRate:"35",payConfirmed:"yes"};
const work:Facts={...common,tier:"yes",roleEvidence:"yes",nzMonths:"24",visaHistory:"yes",nzEvidence:"yes",historicalPay:"yes"};
const ae:Facts={scope:"yes",offer:"yes",accredited:"yes",hours:"30",jobCheck:"yes",agreement:"yes",market:"yes",skill:"experience",experience:"24",experienceProof:"yes",jobSkills:"yes",level:"2",noPayment:"yes",health:"yes",character:"yes",general:"yes"};
const smc:Facts={...common,skilled:"yes",wageBasis:"current",payRate:"35",payConfirmed:"yes",skillCategory:"qualification",qualification:"foreignBachelor",qualificationProof:"yes",level:"higher",nzMonths:"18",nzEvidence:"yes"};
const exp:Facts={...smc,payRate:"38.50",occupation:"ordinary",relevantMonths:"36",nzMonths:"24",nonOverlap:"yes"};
const trades:Facts={...smc,occupation:"yes",qualification:"yes",relevantMonths:"30",nzMonths:"18",nonOverlap:"yes"};
const pr:Facts={scope:"yes",residentMonths:"24",current:"yes",conditions:"yes",daysFirst:"184",daysSecond:"184",travelEvidence:"yes",character:"yes",general:"yes"};
const ok="meets_self_reported_screen",no="requirements_not_met",unknown="review_required";
type Case=[string,string,Facts,Facts,string,string?];
const cases:Case[]=[
["Tier 1 median boundary","straight",straight,{},ok],
["Tier 1 below cent","straight",straight,{payRate:"34.99"},no],
["Tier 1 specific wage","straight",straight,{wageKind:"specified",requiredPay:"63.50",payRate:"63.50"},ok],
["specific threshold missing","straight",straight,{wageKind:"specified"},unknown],
["Tier 1 age 56","straight",straight,{age:"56"},no],
["Tier 1 unknown age","straight",straight,{age:""},unknown],
["Tier 1 no offer","straight",straight,{offer:"no"},no],
["Tier 1 29 hours","straight",straight,{hours:"29"},no],
["Tier 1 11 months","straight",straight,{contractMonths:"11"},no],
["Tier 1 contractor manual","straight",straight,{contract:"other"},unknown],
["Tier 1 unsupported scope","straight",straight,{scope:"no",payRate:"10"},unknown],
["Tier 2 24 months","workResidence",work,{},ok],
["Tier 2 23 months","workResidence",work,{nzMonths:"23"},no],
["Tier 2 impossible window","workResidence",work,{nzMonths:"31"},unknown],
["Tier 2 historical pay unknown","workResidence",work,{historicalPay:""},unknown],
["Tier 2 qualifying visa missing","workResidence",work,{visaHistory:"no"},no],
["AEWV 24 months no English level 2","aewv",ae,{},ok],
["AEWV 23 months","aewv",ae,{experience:"23"},no],
["AEWV qualification","aewv",ae,{skill:"qualification",qualificationProof:"yes"},ok],
["AEWV missing job check","aewv",ae,{jobCheck:""},unknown],
["AEWV English level 3","aewv",ae,{level:"3"},unknown],
["AEWV English verified level 3","aewv",ae,{level:"3",english:"yes"},ok],
["AEWV fee payment","aewv",ae,{noPayment:"no"},no],
["AEWV special exemption","aewv",ae,{skill:"exception"},unknown],
["SMC foreign bachelor four plus two","smcPoints",smc,{},ok],
["SMC foreign bachelor 17 months","smcPoints",smc,{nzMonths:"17"},no],
["SMC NZ bachelor one year","smcPoints",smc,{qualification:"nzBachelor",nzMonths:"12"},ok],
["SMC overseas doctorate direct six","smcPoints",smc,{qualification:"foreignPhd",nzMonths:"",nzEvidence:""},ok],
["SMC NZ masters six","smcPoints",smc,{qualification:"nzMasters6",nzMonths:""},ok],
["SMC overseas masters five","smcPoints",smc,{qualification:"foreignMasters",nzMonths:"12"},ok],
["SMC missing qualification evidence","smcPoints",smc,{qualificationProof:""},unknown],
["SMC registration three plus three","smcPoints",smc,{skillCategory:"registration",registrationPoints:"3",registrationProof:"yes",afterRegistration:"yes",nzMonths:"24"},ok],
["SMC registration work before registration","smcPoints",smc,{skillCategory:"registration",registrationPoints:"3",registrationProof:"yes",afterRegistration:"no",nzMonths:"24"},no],
["SMC income 105","smcPoints",smc,{skillCategory:"income",payRate:"105",nzMonths:""},ok],
["SMC income 70 plus 18","smcPoints",smc,{skillCategory:"income",payRate:"70",nzMonths:"18"},ok],
["SMC income 52.50 plus 24","smcPoints",smc,{skillCategory:"income",payRate:"52.50",nzMonths:"24"},ok],
["SMC income 52.49","smcPoints",smc,{skillCategory:"income",payRate:"52.49",nzMonths:"24"},no],
["SMC level 4 wage below","smcPoints",smc,{level:"lower",payRate:"52.49"},no],
["SMC historical wage review","smcPoints",smc,{wageBasis:"historical"},unknown],
["SMC no NZ experience","smcPoints",smc,{nzMonths:"0",nzEvidence:""},no],
["experience route boundaries","smcExperience",exp,{},ok],
["experience 35 months","smcExperience",exp,{relevantMonths:"35"},no],
["experience NZ 23 months","smcExperience",exp,{nzMonths:"23"},no],
["experience wage cent below","smcExperience",exp,{payRate:"38.49"},no],
["experience red list","smcExperience",exp,{occupation:"red"},no],
["experience amber list","smcExperience",exp,{occupation:"amber"},unknown],
["experience impossible duration","smcExperience",exp,{nzMonths:"49"},unknown],
["trades route boundaries","smcTrades",trades,{},ok],
["trades NZ 17 months","smcTrades",trades,{nzMonths:"17"},no],
["trades qualification missing","smcTrades",trades,{qualification:"no"},no],
["PR physical presence exact","permanent",pr,{},ok],
["PR 183 days","permanent",pr,{daysFirst:"183",daysSecond:"365"},no],
["PR 23 months","permanent",pr,{residentMonths:"23"},no],
["PR impossible days","permanent",pr,{daysSecond:"367"},unknown],
["PR other commitment manual","permanent",pr,{scope:"no",daysFirst:"1"},unknown],
["invalid date","straight",straight,{},unknown,"2026-11-31"],
["stale rule pack","straight",straight,{},unknown,"2026-12-27"],
["no inputs","smcPoints",{}, {},unknown]
];
describe("NZ current ordinary route screens",()=>{for(const [name,id,base,patch,expected,date] of cases)it(name,()=>expect(assessPermit("newzealand",id,{...base,...patch},date??day).status).toBe(expected));});
it("does not add qualification and income skill points",()=>{const result=assessPermit("newzealand","smcPoints",{...smc,payRate:"105",nzMonths:"0"},day);expect(result.status).toBe(no);expect(result.details.join(" ")).toContain("Skill points: 4");});
