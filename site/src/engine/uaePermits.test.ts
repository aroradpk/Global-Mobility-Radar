import {describe,it,expect} from "vitest";
import {assessPermit,type Facts} from "./europePermits";
const day="2026-11-26";
const common:Facts={scope:"yes",passport:"yes",authority:"icp",authorityProof:"yes"};
const res:Facts={...common,medical:"yes",insurance:"yes",general:"yes"};
const job:Facts={...common,duration:"90",basis:"skilled",level:"2",occupation:"yes",degree:"yes",passportValidity:"yes",visitInsurance:"yes",guarantee:"yes",visitConditions:"yes"};
const employment:Facts={...res,age:"30",mainland:"yes",offer:"yes",employer:"yes",qualifications:"yes",permitProcess:"yes",fees:"yes"};
const green:Facts={...res,contract:"yes",degree:"yes",salary:"15000",pay:"yes",permit:"yes",level:"3",classification:"yes"};
const gold:Facts={...green,salary:"30000",level:"2",licence:"yes",continuing:"yes"};
const talent:Facts={...res,achievement:"yes",nomination:"yes"};
const ok="meets_self_reported_screen",no="requirements_not_met",unknown="review_required";
type Case=[string,string,Facts,Facts,string,string?];
const cases:Case[]=[
["job skilled level 2","jobseeker",job,{},ok],
["job level 1","jobseeker",job,{level:"1",duration:"60"},ok],
["job level 3","jobseeker",job,{level:"3",duration:"120"},ok],
["job other level","jobseeker",job,{level:"other"},no],
["job invalid duration","jobseeker",job,{duration:"180"},unknown],
["job no basis","jobseeker",job,{basis:"neither"},no],
["job degree no","jobseeker",job,{degree:"no"},no],
["job guarantee missing","jobseeker",job,{guarantee:""},unknown],
["job short passport validity","jobseeker",job,{passportValidity:"no"},no],
["job passport validity unknown","jobseeker",job,{passportValidity:""},unknown],
["job no UAE health insurance","jobseeker",job,{visitInsurance:"no"},no],
["job insurance unknown","jobseeker",job,{visitInsurance:""},unknown],
["job no work condition","jobseeker",job,{visitConditions:"no"},no],
["job recent graduate","jobseeker",job,{basis:"graduate",university:"yes",graduation:"2025-01-01"},ok],
["job graduate exact anniversary","jobseeker",job,{basis:"graduate",university:"yes",graduation:"2024-11-26"},unknown],
["job graduate older","jobseeker",job,{basis:"graduate",university:"yes",graduation:"2023-11-26"},unknown],
["job future graduation","jobseeker",job,{basis:"graduate",university:"yes",graduation:"2026-12-01"},unknown],
["job top500 not confirmed","jobseeker",job,{basis:"graduate",university:"no",graduation:"2025-01-01"},no],
["job Dubai wording manual","jobseeker",job,{authority:"dubai"},unknown],
["job unknown authority","jobseeker",job,{authority:""},unknown],
["employment ordinary","employment",employment,{},ok],
["employment 18","employment",employment,{age:"18"},ok],
["employment 17","employment",employment,{age:"17"},no],
["employment implausible age","employment",employment,{age:"121"},unknown],
["employment no offer","employment",employment,{offer:"no"},no],
["employment employer unknown","employment",employment,{employer:""},unknown],
["employment recruitment fee","employment",employment,{fees:"no"},no],
["employment no authorisation","employment",employment,{permitProcess:"no"},no],
["employment free zone manual","employment",employment,{mainland:"no",offer:"no"},unknown],
["employment medical unknown","employment",employment,{medical:""},unknown],
["green exact","green",green,{},ok],
["green below cent","green",green,{salary:"14999.99"},no],
["green level 3","green",green,{level:"3"},ok],
["green wrong level","green",green,{level:"other"},no],
["green no contract","green",green,{contract:"no"},no],
["green no degree","green",green,{degree:"no"},no],
["green missing pay basis","green",green,{pay:""},unknown],
["green unsupported pay basis","green",green,{pay:"no",salary:"1"},unknown],
["green no permit","green",green,{permit:"no"},no],
["green invalid money","green",green,{salary:"1.5e4"},unknown],
["golden exact","golden",gold,{},ok],
["golden below cent","golden",gold,{salary:"29999.99"},no],
["golden level 3 not supported","golden",gold,{level:"other"},no],
["golden no licence","golden",gold,{licence:"no"},no],
["golden no employment","golden",gold,{contract:"no"},no],
["golden insurance unknown","golden",gold,{insurance:""},unknown],
["Dubai six bank months","golden",gold,{authority:"dubai",bankMonths:"6",bankProof:"yes"},ok],
["Dubai five bank months","golden",gold,{authority:"dubai",bankMonths:"5",bankProof:"yes"},no],
["Dubai missing statements","golden",gold,{authority:"dubai",bankMonths:"6"},unknown],
["golden talent remains discretionary","goldenTalent",talent,{},unknown],
["unsupported scope","golden",gold,{scope:"no",salary:"1"},unknown],
["stale rules","green",green,{},unknown,"2026-12-27"],
["invalid date","green",green,{},unknown,"2026-11-31"],
["empty input","jobseeker",{}, {},unknown]
];
describe("UAE ordinary route screens",()=>{for(const [name,id,base,patch,expected,date] of cases)it(name,()=>expect(assessPermit("uae",id,{...base,...patch},date??day).status).toBe(expected));});
it("does not treat a visit visa as permission to work",()=>expect(assessPermit("uae","jobseeker",job,day).details.join(" ")).toContain("not a work permit"));
it("does not apply Dubai-specific bank evidence to ICP automatically",()=>expect(assessPermit("uae","golden",{...gold,bankMonths:"0",bankProof:"no"},day).status).toBe(ok));
it("does not apply salary threshold to exceptional technology talent",()=>expect(assessPermit("uae","goldenTalent",{...talent,salary:"1"},day).details.join(" ")).toContain("No salaried-professional threshold"));
