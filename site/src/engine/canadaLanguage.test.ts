import {describe,it,expect} from "vitest";
import {mapCanadaLanguage,withCanadaLanguage,resolveCanadaLanguage} from "./canadaLanguage";
import type {EvidenceRecord} from "./profileEvidence";
const today="2026-11-27";
const rec=(test:string,scores:string[],extra:Record<string,string>={}):EvidenceRecord=>({id:1,kind:"language",confirmedOn:today,values:{test,taken:"2026-01-01",canadaFormat:"confirmed",canadaLanguageOwner:"applicant",speaking:scores[0],listening:scores[1],reading:scores[2],writing:scores[3],...extra}});
const examples:[string,string[],number[]][]=[
 ["IELTS General Training",["7","8","7","7"],[9,9,9,9]],
 ["IELTS General Training",["4","4.5","3.5","4"],[4,4,4,4]],
 ["IELTS General Training",["7.5","8.5","8","7.5"],[10,10,10,10]],
 ["CELPIP-General",["4","6","9","12"],[4,6,9,10]],
 ["PTE Core",["68","60","60","69"],[7,7,7,7]],
 ["PTE Core",["88","88","87","89"],[9,9,9,9]],
 ["PTE Core",["89","89","88","90"],[10,10,10,10]],
 ["TEF Canada (previous score equivalency)",["310","249","207","310"],[7,7,7,7]],
 ["TEF Canada (previous score equivalency)",["393","316","263","393"],[10,10,10,10]],
 ["TCF Canada",["10","458","453","10"],[7,7,7,7]],
 ["TCF Canada",["16","549","549","16"],[10,10,10,10]],
];
describe("Canadian approved language conversions",()=>{
 for(const [test,scores,levels] of examples)it(test+" "+scores.join(","),()=>expect(mapCanadaLanguage(rec(test,scores),today)).toMatchObject({ok:true,levels}));
 const good=rec("IELTS General Training",["7","8","7","7"]);
 for(const [label,patch] of Object.entries<Record<string,string>>({unapproved:{test:"IELTS Academic"},retake:{test:"IELTS One Skill Retake"},unconfirmed:{canadaFormat:""},expired:{taken:"2024-11-27"},future:{taken:"2026-11-28"},invalidDate:{taken:"2026-02-30"},expiry:{expiry:"2026-11-26"},conflict:{language:"French"},missing:{reading:""},badStep:{writing:"7.2"},outOfRange:{speaking:"10"},belowRange:{reading:"3"},numericSyntax:{reading:"7e0"}}))it("rejects "+label,()=>expect(mapCanadaLanguage({...good,values:{...good.values,...patch}},today).ok).toBe(false));
 it("rejects TEF 699 score format",()=>expect(mapCanadaLanguage(rec("TEF Canada",["393","316","263","393"]),today).ok).toBe(false));
 it("requires rule refresh beyond validity",()=>expect(mapCanadaLanguage(good,"2026-12-26").ok).toBe(false));
 it("does not infer opposite first language",()=>expect(withCanadaLanguage({firstKind:"french",first:"8,8,8,8"},"1",[good],today).first).toBe(""));
 it("live link maps and unlink restores manual input",()=>{const manual={firstKind:"english",first:"8,8,8,8",firstDate:"2026-01-02"};expect(withCanadaLanguage(manual,"1",[good],today)).toMatchObject({first:"9,9,9,9",firstDate:"2026-01-01"});expect(withCanadaLanguage(manual,"",[],today)).toEqual(manual);expect(withCanadaLanguage(manual,"1",[],today)).toMatchObject({first:"",firstDate:""});});
});

describe("Owner-aware Canadian language links",()=>{
 const en=rec("IELTS General Training",["7","8","7","7"]);
 const fr={...rec("TCF Canada",["10","458","453","10"]),id:2};
 const spouse={...rec("CELPIP-General",["8","8","8","8"],{canadaLanguageOwner:"spouse"}),id:3};
 const records=[en,fr,spouse];
 const input={firstKind:"english",first:"8,8,8,8",second:"none",spouseLanguage:"none"};
 it("maps separate opposite official language",()=>expect(withCanadaLanguage(input,"2",records,today,"second")).toMatchObject({first:"8,8,8,8",second:"7,7,7,7",secondDate:"2026-01-01"}));
 it("works with French as first language",()=>expect(withCanadaLanguage({...input,firstKind:"french"},"1",records,today,"second").second).toBe("9,9,9,9"));
 it("blocks same language twice",()=>expect(withCanadaLanguage(input,"1",records,today,"second").second).toBe(""));
 it("blocks unknown first official language",()=>expect(withCanadaLanguage({...input,firstKind:""},"2",records,today,"second").second).toBe(""));
 it("blocks spouse record in applicant first slot",()=>expect(withCanadaLanguage(input,"3",records,today).first).toBe(""));
 it("blocks spouse record in applicant second slot",()=>expect(withCanadaLanguage({...input,firstKind:"french"},"3",records,today,"second").second).toBe(""));
 it("blocks applicant record in spouse slot",()=>expect(withCanadaLanguage(input,"1",records,today,"spouseLanguage").spouseLanguage).toBe(""));
 it("maps spouse independently of applicant language",()=>expect(withCanadaLanguage({...input,firstKind:""},"3",records,today,"spouseLanguage")).toMatchObject({spouseLanguage:"8,8,8,8",spouseLanguageDate:"2026-01-01"}));
 it("requires explicit ownership for old records",()=>expect(resolveCanadaLanguage({...en,values:{...en.values,canadaLanguageOwner:""}},today,"first","english").ok).toBe(false));
 it("clears invalidated second language with no fallback",()=>expect(withCanadaLanguage(input,"2",[en,spouse],today,"second")).toMatchObject({second:"",secondDate:""}));
 it("clears expired spouse record",()=>expect(withCanadaLanguage(input,"3",[{...spouse,values:{...spouse.values,taken:"2024-11-27"}}],today,"spouseLanguage")).toMatchObject({spouseLanguage:"",spouseLanguageDate:""}));
 it("unlink restores independent scenario",()=>expect(withCanadaLanguage(input,"",records,today,"second")).toEqual(input));
 it("live owner changes fail closed",()=>expect(withCanadaLanguage(input,"3",[{...spouse,values:{...spouse.values,canadaLanguageOwner:"applicant"}}],today,"spouseLanguage").spouseLanguage).toBe(""));
});
