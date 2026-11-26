import {describe,it,expect} from "vitest";
import {assessPermit,type Facts} from "./europePermits";
const day="2026-11-26";
const common:Facts={scope:"yes",nationality:"yes",general:"yes"};
const q:Facts={...common,age:"30",funds:"yes",character:"yes",academic:"degree",postgraduate:"no",stem:"no",languages:"yes",english:"yes",experience:"yes",mnc:"yes",industry:"yes",international:"no",income:"no",business:"no",listed:"no"};
const a:Facts={...common,first:"yes",income:"2500000",incomeProof:"yes"};
const b:Facts={...common,first:"yes",degree:"yes",verification:"yes",graduation:"2020-06-01",workMonths:"36",workEvidence:"yes",window:"yes"};
const c:Facts={...b,graduation:"2021-01-01",workMonths:"35",notLocalStudent:"yes",quota:"yes"};
const g:Facts={...common,education:"degree",vacancy:"yes",relevant:"yes",local:"ordinary",market:"yes",employer:"yes"};
const pr:Facts={scope:"yes",months:"84",entry:"yes",residence:"yes",declaration:"yes",evidence:"yes"};
const ok="meets_self_reported_screen",no="requirements_not_met",unknown="review_required";
type Case=[string,string,Facts,Facts,string,string?];
const cases:Case[]=[
["six exact","qmasGeneral",q,{},ok],
["five known criteria","qmasGeneral",q,{mnc:"no"},no],
["five plus unknown","qmasGeneral",q,{mnc:"unknown"},unknown],
["six plus explicit unknown","qmasGeneral",q,{income:"unknown"},ok],
["age 50","qmasGeneral",q,{age:"50"},ok],
["age 51","qmasGeneral",q,{age:"51"},no],
["age 17 despite sufficient criteria","qmasGeneral",q,{age:"17",postgraduate:"yes",stem:"yes"},no],
["age impossible","qmasGeneral",q,{age:"121"},unknown],
["unknown age","qmasGeneral",q,{age:""},unknown],
["stem without eligible degree","qmasGeneral",q,{stem:"yes"},unknown],
["STEM and postgraduate count independently","qmasGeneral",q,{postgraduate:"yes",stem:"yes",mnc:"no",industry:"no"},ok],
["funds missing","qmasGeneral",q,{funds:""},unknown],
["funds no","qmasGeneral",q,{funds:"no"},no],
["criminal record prerequisite","qmasGeneral",q,{character:"no"},no],
["exceptional academic review","qmasGeneral",q,{academic:"special"},unknown],
["academic absent","qmasGeneral",q,{academic:"none"},no],
["no eligible nationality","qmasGeneral",q,{nationality:"no"},no],
["achievement either award","qmasAchievement",q,{award:"yes",contribution:"no"},ok],
["achievement either contribution","qmasAchievement",q,{award:"no",contribution:"yes"},ok],
["achievement neither","qmasAchievement",q,{award:"no",contribution:"no"},no],
["achievement unresolved","qmasAchievement",q,{award:"unknown",contribution:"no"},unknown],
["A income exact","ttpsA",a,{},ok],
["A income penny below","ttpsA",a,{income:"2499999.99"},no],
["A invalid amount","ttpsA",a,{income:"2.5e6"},unknown],
["A evidence missing","ttpsA",a,{incomeProof:""},unknown],
["A previous initial grant","ttpsA",a,{first:"no"},no],
["B experience 36","ttpsB",b,{},ok],
["B experience 35","ttpsB",b,{workMonths:"35"},no],
["B impossible 61 months","ttpsB",b,{workMonths:"61"},unknown],
["B graduation too recent","ttpsB",b,{graduation:"2025-11-26"},unknown],
["B future graduation","ttpsB",b,{graduation:"2026-12-01"},unknown],
["B no eligible degree","ttpsB",b,{degree:"no"},no],
["B credential verification missing","ttpsB",b,{verification:""},unknown],
["B window missing","ttpsB",b,{window:""},unknown],
["C calendar year five","ttpsC",c,{},ok],
["C calendar year six","ttpsC",c,{graduation:"2020-12-31"},no],
["C experience 36","ttpsC",c,{workMonths:"36"},no],
["C zero experience","ttpsC",c,{workMonths:"0"},ok],
["C excluded local graduate","ttpsC",c,{notLocalStudent:"no"},no],
["C quota unknown","ttpsC",c,{quota:""},unknown],
["C quota exhausted","ttpsC",c,{quota:"no"},no],
["GEP ordinary","gep",g,{},ok],
["GEP no offer","gep",g,{vacancy:"no"},no],
["GEP market pay missing","gep",g,{market:""},unknown],
["GEP facilitated","gep",g,{local:"facilitated",facilitation:"yes"},ok],
["GEP no local requirement","gep",g,{local:"no"},no],
["GEP unverified facilitation","gep",g,{local:"facilitated",facilitation:"no"},unknown],
["GEP exceptional qualification","gep",g,{education:"exception"},unknown],
["PR 84 months","permanent",pr,{},ok],
["PR 83 months","permanent",pr,{months:"83"},no],
["PR ordinary residence unknown","permanent",pr,{residence:""},unknown],
["PR permanent home declaration no","permanent",pr,{declaration:"no"},no],
["PR other category","permanent",pr,{scope:"no",months:"1"},unknown],
["stale pack","qmasGeneral",q,{},unknown,"2026-12-27"],
["invalid date","ttpsB",b,{},unknown,"2026-11-31"],
["empty inputs","qmasGeneral",{}, {},unknown]
];
describe("Hong Kong current ordinary admission and residence screens",()=>{for(const [name,id,base,patch,expected,date] of cases)it(name,()=>expect(assessPermit("hongkong",id,{...base,...patch},date??day).status).toBe(expected));});
it("reports confirmed and possible criteria separately",()=>{const r=assessPermit("hongkong","qmasGeneral",{...q,mnc:"unknown"},day);expect(r.details[0]).toBe("Confirmed criteria: 5 / 12; possible with unresolved criteria: 6 / 12");});
it("does not count a STEM claim without eligible postgraduate qualification",()=>{const r=assessPermit("hongkong","qmasGeneral",{...q,stem:"yes"},day);expect(r.details[0]).toBe("Confirmed criteria: 6 / 12; possible with unresolved criteria: 6 / 12");});
