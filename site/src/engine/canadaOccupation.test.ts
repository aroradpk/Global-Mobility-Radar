import {describe,it,expect} from "vitest";
import {lookupCanadaOccupation,lookupEmploymentOccupation} from "./canadaOccupation";
import type {EvidenceRecord} from "./profileEvidence";
const today="2026-11-27";
describe("Canadian occupation reference",()=>{
 const cases:[string,number,boolean][]=[["21231",1,true],["21232",1,true],["21234",1,true],["10020",0,true],["12202",2,true],["13100",3,true],["14201",4,false]];
 for(const [code,teer,fswTeerBand] of cases)it(code,()=>expect(lookupCanadaOccupation("NOC 2021",code,today)).toMatchObject({status:"listed",occupation:{code,teer},fswTeerBand}));
 for(const code of ["2173","2123","99999","21232.0","2e123","__proto__",""])it("unknown "+code,()=>expect(lookupCanadaOccupation("NOC 2021",code,today).status).toBe("unknown"));
 it("rejects other classification versions",()=>expect(lookupCanadaOccupation("NOC 2016","21232",today).status).toBe("unknown"));
 it("rejects stale reference",()=>expect(lookupCanadaOccupation("NOC 2021","21232","2026-12-26").status).toBe("unknown"));
 it("does not infer classification from titles",()=>{const record:EvidenceRecord={id:1,kind:"employment",confirmedOn:today,values:{role:"Software engineer"}};expect(lookupEmploymentOccupation(record,today).status).toBe("unknown");});
 it("uses only exact saved code and classification",()=>{const record:EvidenceRecord={id:1,kind:"employment",confirmedOn:today,values:{role:"Example",occupation:"21232",classification:"NOC 2021"}};expect(lookupEmploymentOccupation(record,today)).toMatchObject({status:"listed",occupation:{code:"21232"}});expect(lookupEmploymentOccupation(undefined,today).status).toBe("unknown");});
});
