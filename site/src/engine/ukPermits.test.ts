import {describe,it,expect} from "vitest";
import {assessPermit,type Facts} from "./europePermits";
const day="2026-11-26";
const pay:Facts={soc:"2134",occupation:"yes",hours:"37.5",salary:"54700",pay:"yes"};
const sw:Facts={...pay,scope:"yes",sponsor:"yes",cos:"yes",english:"yes",funds:"yes",general:"yes",option:"standard"};
const ilr:Facts={...pay,scope:"yes",months:"60",absence:"180",residence:"yes",life:"yes",general:"yes",sponsor:"yes",option:"standard"};
const talent:Facts={scope:"yes",basis:"endorsement",endorsementDate:"2026-10-01",endorsement:"yes",general:"yes"};
const ti:Facts={scope:"yes",months:"36",absence:"180",residence:"yes",life:"yes",general:"yes",basis:"talent",endorsement:"yes",current:"yes",earnings:"yes",english:"yes"};
const evidence:Facts={category:"talent",recognition:"yes",innovation:"yes",outside:"yes",impact:"no",research:"no",mandatoryDocs:"2",optionalDocs:"4",letters:"3",lettersQualified:"yes",documentRules:"yes"};
const ok="meets_self_reported_screen",no="requirements_not_met",unknown="review_required";
type Case=[string,string,Facts,Facts,string,string?];
const cases:Case[]=[
["software exact","skilled",sw,{},ok],
["software one penny below","skilled",sw,{salary:"54699.99"},no],
["general floor not enough","skilled",sw,{salary:"41700"},no],
["testing code general floor","skilled",sw,{soc:"2136",salary:"41700"},ok],
["testing below general","skilled",sw,{soc:"2136",salary:"41200"},no],
["part-time general floor still applies","skilled",sw,{hours:"20",salary:"41700"},ok],
["part time below general","skilled",sw,{hours:"20",salary:"41699.99"},no],
["40 hours exact rounded penny","skilled",sw,{hours:"40",salary:"58346.67"},ok],
["40 hours below","skilled",sw,{hours:"40",salary:"58346.66"},no],
["over 48 manual","skilled",sw,{hours:"49"},unknown],
["invalid hours","skilled",sw,{hours:"0"},unknown],
["invalid salary","skilled",sw,{salary:"1e5"},unknown],
["missing sponsor","skilled",sw,{sponsor:""},unknown],
["no CoS","skilled",sw,{cos:"no"},no],
["no B2","skilled",sw,{english:"no"},no],
["funds unknown","skilled",sw,{funds:""},unknown],
["nonstandard scope","skilled",sw,{scope:"no",salary:"1"},unknown],
["pay not confirmed","skilled",sw,{pay:"no",salary:"1"},unknown],
["PhD uses published rounded rate","skilled",sw,{option:"phd",salary:"49200",phd:"yes"},ok],
["PhD below","skilled",sw,{option:"phd",salary:"49199.99",phd:"yes"},no],
["PhD proof missing","skilled",sw,{option:"phd",salary:"49200"},unknown],
["STEM doctorate","skilled",sw,{option:"stem",salary:"43700",phd:"yes",stem:"yes"},ok],
["STEM subject missing","skilled",sw,{option:"stem",salary:"43700",phd:"yes"},unknown],
["new entrant published rate","skilled",sw,{option:"entrant",salary:"38300",entrant:"yes",entrantMonths:"48",entrantPeriod:"yes"},ok],
["new entrant 49 months","skilled",sw,{option:"entrant",salary:"38300",entrant:"yes",entrantMonths:"49",entrantPeriod:"yes"},no],
["new entrant below floor","skilled",sw,{option:"entrant",soc:"2136",salary:"33399",entrant:"yes",entrantMonths:"48",entrantPeriod:"yes"},no],
["ISL full rate required","skilled",sw,{option:"isl",salary:"33400",isl:"yes"},no],
["manual occupation rate","skilled",sw,{soc:"other",manualRate:"45000",manualRateConfirmed:"yes",salary:"45000"},ok],
["manual rate not verified","skilled",sw,{soc:"other",manualRate:"45000",manualRateConfirmed:"no",salary:"1"},unknown],
["unknown occupation","skilled",sw,{soc:"constructor"},unknown],
["stale pack","skilled",sw,{},unknown,"2026-12-27"],
["invalid date","skilled",sw,{},unknown,"2026-11-31"],
["talent documents ready","talentEvidence",evidence,{},ok],
["talent one criterion","talentEvidence",evidence,{outside:"no"},no],
["talent recognition missing","talentEvidence",evidence,{recognition:""},unknown],
["talent 11 documents","talentEvidence",evidence,{optionalDocs:"9"},no],
["talent 3 optional docs","talentEvidence",evidence,{optionalDocs:"3"},no],
["talent two letters","talentEvidence",evidence,{letters:"2"},no],
["talent extra claimed criterion without evidence","talentEvidence",evidence,{impact:"yes"},unknown],
["visa endorsement valid","talentVisa",talent,{},ok],
["visa endorsement exact boundary","talentVisa",talent,{endorsementDate:"2026-08-26"},unknown],
["visa endorsement expired","talentVisa",talent,{endorsementDate:"2026-08-25"},unknown],
["visa endorsement future","talentVisa",talent,{endorsementDate:"2026-12-01"},unknown],
["visa endorsement withdrawn","talentVisa",talent,{endorsement:"no"},no],
["visa prize","talentVisa",talent,{basis:"prize",prize:"yes",endorsementDate:""},ok],
["visa prize not confirmed","talentVisa",talent,{basis:"prize"},unknown],
["SW settlement 60 months","skilledIlr",ilr,{},ok],
["SW settlement 59 months","skilledIlr",ilr,{months:"59"},no],
["SW settlement absences 181","skilledIlr",ilr,{absence:"181"},no],
["SW settlement absurd absence","skilledIlr",ilr,{absence:"367"},unknown],
["SW settlement discount not supported","skilledIlr",ilr,{option:"phd"},unknown],
["SW settlement special row","skilledIlr",ilr,{option:"other"},unknown],
["SW settlement full going rate","skilledIlr",ilr,{salary:"49200"},no],
["GT talent 36","talentIlr",ti,{},ok],
["GT talent 35","talentIlr",ti,{months:"35"},no],
["GT promise 59","talentIlr",ti,{basis:"promise",months:"59"},no],
["GT promise 60","talentIlr",ti,{basis:"promise",months:"60"},ok],
["GT prize 36","talentIlr",ti,{basis:"prize",endorsement:""},ok],
["GT no UK earnings","talentIlr",ti,{earnings:"no"},no],
["GT English unknown","talentIlr",ti,{english:""},unknown],
["GT current permission unknown","talentIlr",ti,{current:""},unknown],
["missing inputs","skilled",{}, {},unknown],
["IT code cannot claim ISL despite sufficient pay","skilled",sw,{option:"isl",isl:"yes"},no],
["manual ISL code at full rate","skilled",sw,{option:"isl",isl:"yes",soc:"other",manualRate:"33400",manualRateConfirmed:"yes",salary:"33400"},ok],
["manual rate below published column minimum","skilled",sw,{soc:"other",manualRate:"10000",manualRateConfirmed:"yes"},unknown],
["entrant grant duration zero","skilled",sw,{option:"entrant",salary:"38300",entrant:"yes",entrantMonths:"0",entrantPeriod:"yes"},unknown]
];
describe("UK ordinary routes",()=>{for(const [name,id,base,patch,expected,date] of cases)it(name,()=>expect(assessPermit("uk",id,{...base,...patch},date??day).status).toBe(expected));});
it("uses full salary floor even when occupation going rate is lower",()=>{const x=assessPermit("uk","skilled",{...sw,soc:"2136",salary:"41700"},day);expect(x.details).toContain("Required qualifying annual pay: GBP 41700.00");});
