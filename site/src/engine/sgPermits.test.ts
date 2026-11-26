import {describe,it,expect} from "vitest";
import {assessPermit,type Facts} from "./europePermits";
import {epFloor} from "./sgPermits";
const day="2026-11-26";
const ep:Facts={scope:"yes",age:"30",sector:"other",salary:"7223",salaryProof:"yes",offer:"yes",fcf:"yes",general:"yes",duration:"ordinary",exemption:"none",c1:"10",c1Proof:"yes",c2:"10",c2Proof:"yes",firm:"small",workforceProof:"yes",sol:"no",sep:"no"};
const large:Facts={...ep,firm:"large",share:"5to25",c4Band:"mid"};
const pep:Facts={scope:"yes",basis:"overseas",salary:"22500",lastPaid:"2026-07-01",salaryProof:"yes",first:"yes",allowed:"yes",conditions:"yes",general:"yes"};
const pr:Facts={scope:"yes",pass:"ep",documents:"yes",ns:"yes",general:"yes"};
const tech:Facts={...ep,duration:"tech",age:"36",salary:"10700",sol:"yes",solProof:"yes",share:"lt5",techRole:"yes"};
const ok="meets_self_reported_screen",no="requirements_not_met",unknown="review_required";
type Case=[string,string,Facts,Facts,string,string?];
const cases:Case[]=[
["EP exact age 30","ep",ep,{},ok],
["EP below penny even with 40 COMPASS","ep",ep,{salary:"7222.99"},no],
["finance age 30","ep",ep,{sector:"finance",salary:"7982"},ok],
["finance not inferred from role","ep",ep,{sector:"finance"},no],
["age 23 floor","ep",ep,{age:"23",salary:"5600"},ok],
["age 45 floor","ep",ep,{age:"45",salary:"10700"},ok],
["age 70 capped","ep",ep,{age:"70",salary:"10700"},ok],
["invalid age","ep",ep,{age:"121"},unknown],
["minor","ep",ep,{age:"17"},unknown],
["unknown sector","ep",ep,{sector:""},unknown],
["no offer","ep",ep,{offer:"no"},no],
["FCF missing","ep",ep,{fcf:""},unknown],
["COMPASS 30","ep",ep,{c1:"0"},no],
["COMPASS C1 missing evidence","ep",ep,{c1Proof:""},unknown],
["C2 no degree points allowed","ep",ep,{c1:"20",c2:"0",c2Proof:""},ok],
["C2 verification missing","ep",ep,{c2Proof:""},unknown],
["large firm 40","ep",large,{},ok],
["large firm share below 5","ep",large,{share:"lt5"},ok],
["large share 25% loses 10","ep",large,{share:"25toThird"},no],
["C4 70 percent floor","ep",large,{c4Band:"low",local70:"yes"},ok],
["C4 below 20th without floor","ep",large,{c4Band:"low",local70:"no"},no],
["C4 70 unknown","ep",large,{c4Band:"low",local70:""},unknown],
["SOL below third","ep",large,{share:"25toThird",c1:"0",sol:"yes",solProof:"yes"},ok],
["SOL one-third loses ten","ep",large,{share:"thirdPlus",c1:"0",sol:"yes",solProof:"yes"},no],
["SOL verification missing","ep",large,{sol:"yes",solProof:""},unknown],
["SOL small firm share unknown","ep",ep,{sol:"yes",solProof:"yes",share:""},unknown],
["SEP award adds ten","ep",ep,{c1:"0",sep:"yes",sepProof:"yes"},ok],
["SEP award missing","ep",ep,{sep:"yes",sepProof:""},unknown],
["salary exemption exact","ep",ep,{salary:"22500",c1:"",c2:"",firm:"",sol:"",sep:""},ok],
["salary exemption cent below","ep",ep,{salary:"22499.99",c1:""},unknown],
["ICT confirmed","ep",ep,{exemption:"ict",exemptionProof:"yes",c1:""},ok],
["short role confirmed","ep",ep,{exemption:"short",exemptionProof:"yes",c1:""},ok],
["unverified exemption","ep",ep,{exemption:"ict",exemptionProof:"no",c1:""},unknown],
["tech exact age 36","ep",tech,{},ok],
["tech below floor","ep",tech,{salary:"10699.99"},no],
["tech no SOL","ep",tech,{sol:"no"},no],
["tech age 45","ep",tech,{age:"45",salary:"14270"},ok],
["tech age 40 manual confirmed","ep",tech,{age:"40",salary:"13000",techRate:"12500",techRateProof:"yes"},ok],
["tech age 40 missing rate","ep",tech,{age:"40",salary:"13000"},unknown],
["tech manual impossible rate","ep",tech,{age:"40",salary:"13000",techRate:"10000",techRateProof:"yes"},unknown],
["tech C3 below ten","ep",tech,{firm:"large",share:"25toThird",c4Band:"high"},no],
["tech high salary exemption conflict","ep",tech,{salary:"22500"},unknown],
["unsupported scope","ep",ep,{scope:"no",salary:"1"},unknown],
["PEP exact","pep",pep,{},ok],
["PEP below","pep",pep,{salary:"22499.99"},no],
["PEP recent boundary","pep",pep,{lastPaid:"2026-05-26"},unknown],
["PEP expired salary","pep",pep,{lastPaid:"2026-05-25"},no],
["PEP future date","pep",pep,{lastPaid:"2026-12-01"},unknown],
["PEP eligible local EP","pep",pep,{basis:"ep",lastPaid:""},ok],
["PEP prior issue","pep",pep,{first:"no"},no],
["PEP restricted work","pep",pep,{allowed:"no"},no],
["PEP continuing conditions unknown","pep",pep,{conditions:""},unknown],
["PR EP discretionary","pr",pr,{},unknown],
["PR S Pass discretionary","pr",pr,{pass:"sp"},unknown],
["PR other category","pr",pr,{pass:"other"},unknown],
["PR missing documents","pr",pr,{documents:""},unknown],
["empty input","ep",{}, {},unknown],
["stale rules","ep",ep,{},unknown,"2026-12-27"],
["invalid date","ep",ep,{},unknown,"2026-11-31"],
];
describe("Singapore route screens",()=>{for(const [name,id,base,patch,expected,date] of cases)it(name,()=>expect(assessPermit("singapore",id,{...base,...patch},date??day).status).toBe(expected));});
describe("official EP salary schedule",()=>{
 it("keeps announced 2027 rates separate",()=>{expect(epFloor(30,"other")).toBe(7223);expect(epFloor(30,"other",true)).toBe(7750);expect(epFloor(30,"finance")).toBe(7982);expect(epFloor(30,"finance",true)).toBe(8541);});
 it("all 23 published bands increase monotonically",()=>{for(const sector of ["finance","other"]){for(let age=24;age<=45;age++){expect(epFloor(age,sector)!).toBeGreaterThan(epFloor(age-1,sector)!);expect(epFloor(age,sector,true)!).toBeGreaterThan(epFloor(age,sector)!);}}});
 it("small firm default points reflected in total",()=>expect(assessPermit("singapore","ep",ep,day).details).toContain("COMPASS total: 40 / 90; pass threshold 40"));
 it("no PR probability or automatic pass",()=>{const r=assessPermit("singapore","pr",pr,day);expect(r.status).toBe(unknown);expect(r.details.join(" ")).toContain("No approval probability calculated");});
});
