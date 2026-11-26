import {describe,it,expect} from "vitest";
import {assessPermit,type Facts} from "./europePermits";
import {bulletinCutoffs,comparePriorityDate} from "./usPermits";
const day="2026-11-26";
const common:Facts={scope:"yes",general:"yes"};
const l:Facts={...common,relationship:"yes",business:"yes",months:"12",dates:"yes",petition:"yes",office:"existing",foreignRole:"yes",usRole:"yes",knowledge:"yes",placement:"yes"};
const h:Facts={...common,offer:"yes",specialty:"yes",qualification:"yes",lca:"yes",cap:"selected",capProof:"yes",feeReview:"yes"};
const e:Facts={...common,offer:"yes",ability:"yes",labor:"yes",basis:"bachelor",credential:"yes",experience:"60",experienceProof:"yes",jobLevel:"yes"};
const n:Facts={...e,merit:"yes",positioned:"yes",balance:"yes"};
const a:Facts={...common,acclaim:"yes",continue:"yes",evidence:"criteria",criteria:"3",petitioner:"yes",work:"yes",consult:"yes"};
const c:Facts={...common,relationship:"yes",business:"yes",months:"12",dates:"yes",offer:"yes"};
const b:Facts={category:"eb2",area:"india",chargeability:"yes",priority:"2013-10-31",priorityProof:"yes"};
const ok="meets_self_reported_screen",no="requirements_not_met",unknown="review_required";
type Case=[string,string,Facts,Facts,string,string?];
const cases:Case[]=[
["L1A twelve months","l1a",l,{},ok],
["L1A eleven months","l1a",l,{months:"11"},no],
["L1A invalid 37 months","l1a",l,{months:"37"},unknown],
["L1A no relationship","l1a",l,{relationship:"no"},no],
["L1A role missing","l1a",l,{usRole:""},unknown],
["L1A new office manual","l1a",l,{office:"new"},unknown],
["L1A dates missing","l1a",l,{dates:""},unknown],
["L1B specialized evidence","l1b",l,{},ok],
["L1B no knowledge","l1b",l,{knowledge:"no"},no],
["L1B worksite unknown","l1b",l,{placement:""},unknown],
["L1B no petition","l1b",l,{petition:"no"},no],
["H1 selected","h1b",h,{},ok],
["H1 exemption","h1b",h,{cap:"exempt"},ok],
["H1 selection pending","h1b",h,{cap:"pending"},unknown],
["H1 cap proof unknown","h1b",h,{capProof:""},unknown],
["H1 fee law not reviewed","h1b",h,{feeReview:"no"},unknown],
["H1 wage evidence no","h1b",h,{lca:"no"},no],
["H1 no specialty","h1b",h,{specialty:"no"},no],
["O1 individual review","o1",a,{},unknown],
["O1 two criteria","o1",a,{criteria:"2"},no],
["O1 invalid count","o1",a,{criteria:"9"},unknown],
["O1 major award","o1",a,{evidence:"award",criteria:""},unknown],
["O1 petitioner no","o1",a,{petitioner:"no"},no],
["EB1A three criteria manual","eb1a",a,{},unknown],
["EB1A two criteria","eb1a",a,{criteria:"2"},no],
["EB1A count eleven","eb1a",a,{criteria:"11"},unknown],
["EB1A award manual","eb1a",a,{evidence:"award",criteria:""},unknown],
["EB1C twelve months","eb1c",c,{},ok],
["EB1C eleven months","eb1c",c,{months:"11"},no],
["EB1C employer history","eb1c",c,{business:"no"},no],
["EB2 bachelor progressive sixty","eb2",e,{},ok],
["EB2 fifty-nine","eb2",e,{experience:"59"},no],
["EB2 advanced degree","eb2",e,{basis:"advanced",experience:""},ok],
["EB2 exceptional manual","eb2",e,{basis:"exceptional",exceptional:"yes"},unknown],
["EB2 no labor certification","eb2",e,{labor:"no"},no],
["NIW no automatic approval","niw",n,{},unknown],
["NIW underlying EB2 missing","niw",n,{experience:"59"},no],
["NIW national importance absent","niw",n,{merit:"no"},no],
["NIW self petition no employer fields","niw",n,{offer:"",labor:"",ability:""},unknown],
["EB3 skilled twenty-four","eb3",e,{basis:"skilled",experience:"24",skillJob:"yes",requirements:"yes"},ok],
["EB3 skilled twenty-three","eb3",e,{basis:"skilled",experience:"23",skillJob:"yes",requirements:"yes"},no],
["EB3 professional","eb3",e,{basis:"professional",degree:"yes",requirements:"yes"},ok],
["EB3 other manual","eb3",e,{basis:"other",requirements:"yes"},unknown],
["bulletin not approval","bulletin",b,{},unknown],
["bulletin future priority","bulletin",b,{priority:"2026-12-01"},unknown],
["bulletin stale month","bulletin",b,{},unknown,"2026-12-01"],
["stale pack","l1a",l,{},unknown,"2026-12-27"],
["invalid date","l1a",l,{},unknown,"2026-11-31"],
["empty input","h1b",{}, {},unknown]
];
describe("US ordinary route screens",()=>{for(const [name,id,base,patch,expected,date] of cases)it(name,()=>expect(assessPermit("us",id,{...base,...patch},date??day).status).toBe(expected));});
describe("dated priority-date snapshot",()=>{
 it("India EB2 distinct filing and final",()=>expect(bulletinCutoffs("eb2","india",day)).toEqual({final:"2013-11-01",filing:"2015-01-15"}));
 it("India EB1",()=>expect(bulletinCutoffs("eb1","india",day)).toEqual({final:"2023-02-01",filing:"2024-07-01"}));
 it("India EB3",()=>expect(bulletinCutoffs("eb3","india",day)).toEqual({final:"2014-01-22",filing:"2015-01-15"}));
 it("China distinct dates",()=>expect(bulletinCutoffs("eb3","china",day)).toEqual({final:"2022-01-22",filing:"2024-04-01"}));
 it("Philippines distinct dates",()=>expect(bulletinCutoffs("eb3","philippines",day)).toEqual({final:"2023-08-15",filing:"2024-01-01"}));
 it("strict cutoff equality",()=>expect(comparePriorityDate("2013-11-01","2013-11-01")).toBe("not_before_cutoff"));
 it("day before",()=>expect(comparePriorityDate("2013-10-31","2013-11-01")).toBe("before_cutoff"));
 it("current and unavailable",()=>{expect(comparePriorityDate(day,"C")).toBe("before_cutoff");expect(comparePriorityDate(day,"U")).toBe("unavailable");});
 it("invalid date",()=>expect(comparePriorityDate("2026-02-30","C")).toBe("unknown"));
 it("future month fails closed",()=>expect(bulletinCutoffs("eb2","india","2026-12-01")).toBeNull());
 it("unsupported category and prototype key",()=>{expect(bulletinCutoffs("other","india",day)).toBeNull();expect(bulletinCutoffs("eb1","constructor",day)).toBeNull();});
 it("no filing inference from unconfirmed chargeability",()=>expect(assessPermit("us","bulletin",{...b,chargeability:"no"},day).details.join(" ")).not.toContain("date comparison:"));
 it("no date comparison for future priority",()=>expect(assessPermit("us","bulletin",{...b,priority:"2026-12-01"},day).details.join(" ")).not.toContain("date comparison:"));
 it("no unknown country crash",()=>expect(assessPermit("constructor" as never,"x",{},day).status).toBe(unknown));
});
