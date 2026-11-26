import {describe,it,expect} from "vitest";
import {assessPermit,type Country,type Facts} from "./europePermits";
const day="2026-11-26";
const ie:Facts={scope:"yes",offer:"yes",employer:"yes",ratio:"yes",qualified:"yes",salary:"40904",pay:"yes",general:"yes",tier:"listed",listed:"yes",degree:"yes",contract:"24"};
const gp:Facts={...ie,salary:"36605",eligible:"yes",standard:"yes",labour:"passed"};
const nl:Facts={scope:"yes",offer:"yes",salary:"5942",pay:"yes",general:"yes",tier:"age",age:"30",market:"yes",employerName:"Example B.V.",employerKvk:"12345678",registerName:"Example B.V.",registerKvk:"12345678",publicationDate:"2026-11-03",checkedDate:day,sourceConfirmed:"yes"};
const blue:Facts={scope:"yes",offer:"yes",salary:"5942",pay:"yes",general:"yes",contract:"6",qualification:"it",experience:"36",experienceProof:"yes",tier:"standard",employer:"yes"};
const stamp:Facts={basis:"critical",months:"21",registered:"yes",general:"yes"};
const ltr:Facts={months:"60",history:"yes",resident:"yes",employed:"yes",character:"yes",general:"yes"};
const pr:Facts={scope:"yes",months:"60",main:"yes",current:"yes",income:"yes",brp:"yes",integration:"yes",general:"yes"};
const ok="meets_self_reported_screen",no="requirements_not_met",unknown="review_required";
type Case=[string,Country,string,Facts,Facts,string,string?];
const cases:Case[]=[
["critical exact", "ireland","critical",ie,{},ok],
["critical cent below","ireland","critical",ie,{salary:"40903.99"},no],
["two-year contract","ireland","critical",ie,{contract:"23"},no],
["no offer","ireland","critical",ie,{offer:"no"},no],
["unknown employer ratio","ireland","critical",ie,{ratio:""},unknown],
["recent graduate","ireland","critical",ie,{tier:"graduate",degreeDate:"2026-06-01",salary:"36848"},ok],
["graduate expired","ireland","critical",ie,{tier:"graduate",degreeDate:"2025-01-01",salary:"36848"},unknown],
["future graduation","ireland","critical",ie,{tier:"graduate",degreeDate:"2026-12-01",salary:"36848"},unknown],
["high salary boundary manual","ireland","critical",ie,{tier:"high",salary:"68911",eligible:"yes"},unknown],
["high salary above","ireland","critical",ie,{tier:"high",salary:"68911.01",eligible:"yes"},ok],
["high salary ineligible","ireland","critical",ie,{tier:"high",salary:"70000",eligible:"no"},no],
["special category","ireland","critical",ie,{tier:"special"},unknown],
["other hours manual","ireland","critical",ie,{pay:"no",salary:"40000"},unknown],
["general exact","ireland","general",gp,{},ok],
["general cent below","ireland","general",gp,{salary:"36604.99"},no],
["labour test missing","ireland","general",gp,{labour:"no"},no],
["documented labour exemption","ireland","general",gp,{labour:"exempt"},ok],
["reduced sector not inferred","ireland","general",gp,{standard:"no"},unknown],
["stamp4 critical 21","ireland","stamp4",stamp,{},ok],
["stamp4 critical 20","ireland","stamp4",stamp,{months:"20"},no],
["stamp4 general 57","ireland","stamp4",stamp,{basis:"general",months:"57"},ok],
["stamp4 general 56","ireland","stamp4",stamp,{basis:"general",months:"56"},no],
["stamp4 mixed","ireland","stamp4",stamp,{basis:"other"},unknown],
["long residence 60","ireland","longterm",ltr,{},ok],
["long residence 59","ireland","longterm",ltr,{months:"59"},no],
["long residence self-employed","ireland","longterm",ltr,{employed:"no"},no],
["HSM standard 30","netherlands","hsm",nl,{},ok],
["HSM under 30","netherlands","hsm",nl,{age:"29",salary:"4357"},ok],
["HSM age boundary","netherlands","hsm",nl,{salary:"4357"},no],
["HSM lower unknown","netherlands","hsm",nl,{tier:"reduced",salary:"3122"},unknown],
["HSM reduced confirmed","netherlands","hsm",nl,{tier:"reduced",salary:"3122",reduced:"yes"},ok],
["HSM employer identity mismatch","netherlands","hsm",nl,{employerKvk:"87654321"},no],
["HSM old publication","netherlands","hsm",nl,{publicationDate:"2026-10-01"},unknown],
["HSM market rate","netherlands","hsm",nl,{market:"no"},no],
["Blue card IT 36 months","netherlands","blue",blue,{},ok],
["Blue card IT 35 months","netherlands","blue",blue,{experience:"35"},no],
["Blue card ordinary experience 59","netherlands","blue",blue,{qualification:"other",experience:"59"},no],
["Blue card degree","netherlands","blue",blue,{qualification:"degree",degree:"yes",experience:""},ok],
["Blue card degree unknown","netherlands","blue",blue,{qualification:"degree"},unknown],
["Blue card 5 month contract","netherlands","blue",blue,{contract:"5"},no],
["Blue card salary cent below","netherlands","blue",blue,{salary:"5941.99"},no],
["Blue card reduced","netherlands","blue",blue,{tier:"reduced",salary:"4754",degreeDate:"2025-01-01",reduced:"yes"},ok],
["Blue card expired reduced date","netherlands","blue",blue,{tier:"reduced",salary:"4754",degreeDate:"2022-01-01",reduced:"yes"},unknown],
["Blue card prohibited fines","netherlands","blue",blue,{employer:"no"},no],
["Permanent 60 months","netherlands","permanent",pr,{},ok],
["Permanent 59 months","netherlands","permanent",pr,{months:"59"},no],
["Permanent temporary purpose","netherlands","permanent",pr,{current:"no"},no],
["Permanent integration unknown","netherlands","permanent",pr,{integration:""},unknown],
["Invalid amount","netherlands","blue",blue,{salary:"1e5"},unknown],
["Unknown facts","netherlands","blue",{}, {},unknown],
["Outdated pack","ireland","critical",ie,{},unknown,"2026-12-27"],
["Invalid date","netherlands","hsm",nl,{},unknown,"2026-11-31"],
["CSEP exact anniversary manual","ireland","critical",ie,{tier:"graduate",degreeDate:"2025-11-26",salary:"36848"},unknown],
["Blue Card exact anniversary manual","netherlands","blue",blue,{tier:"reduced",salary:"4754",degreeDate:"2023-11-26",reduced:"yes"},unknown],
["Impossible IT work duration","netherlands","blue",blue,{experience:"85"},unknown],
["HSM minor outside scope","netherlands","hsm",nl,{age:"17"},unknown]
];
describe("Ireland and Netherlands ordinary permit screens",()=>{for(const [name,country,id,base,patch,expected,date] of cases)it(name,()=>expect(assessPermit(country,id,{...base,...patch},date??day).status).toBe(expected));});

it("does not report ordinary salary failures for unsupported hours",()=>{const r=assessPermit("ireland","critical",{...ie,pay:"no",salary:"100"},day);expect(r.status).toBe(unknown);expect(r.failed).toEqual([]);expect(r.details).toEqual([]);});
