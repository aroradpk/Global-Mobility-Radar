import {describe,it,expect} from "vitest";
import {mapCanadaEducation,withCanadaEducation,mapCanadaEducationPair,credentialPairKey,withCanadaEducationSelection} from "./canadaEducation";
import type {EvidenceRecord} from "./profileEvidence";
const today="2026-11-27";
const base:EvidenceRecord={id:1,kind:"education",confirmedOn:today,values:{qualification:"Example degree",country:"India",awarded:"2018-06-01",assessmentDate:"2023-01-01",canadaEducationOwner:"applicant",canadaEducationBasis:"eca",canadaEducationIssuer:"WES",canadaEducationConfirmed:"confirmed",canadaEducationLevel:"three-plus"}};
const change=(patch:Record<string,string>):EvidenceRecord=>({...base,values:{...base.values,...patch}});
describe("Canadian credential mapping",()=>{
 it("maps confirmed foreign ECA and last valid date",()=>expect(mapCanadaEducation(base,today)).toMatchObject({ok:true,level:"4",credential:"2023-01-01",validUntil:"2027-12-31"}));
 for(const [level,code] of [["secondary","1"],["one-year","2"],["two-year","3"],["three-plus","4"],["masters","6"],["doctorate","7"]])it("explicit category "+level,()=>expect(mapCanadaEducation(change({canadaEducationLevel:level}),today)).toMatchObject({ok:true,level:code}));
 for(const issuer of ["CES","ICAS","WES","IQAS","ICES"])it("supported issuer "+issuer,()=>expect(mapCanadaEducation(change({canadaEducationIssuer:issuer}),today).ok).toBe(true));
 for(const [label,patch] of Object.entries<Record<string,string>>({
  absentOwner:{canadaEducationOwner:""},wrongOwner:{canadaEducationOwner:"spouse"},unconfirmed:{canadaEducationConfirmed:""},
  inferredDegree:{canadaEducationLevel:"Bachelor of Technology"},multiple:{canadaEducationLevel:"multiple"},professional:{canadaEducationLevel:"professional"},
  missingCountry:{country:""},missingAward:{awarded:""},futureAward:{awarded:"2026-11-28"},invalidAward:{awarded:"2018-02-30"},
  unknownBasis:{canadaEducationBasis:""},foreignConflict:{country:"Canada"},unknownIssuer:{canadaEducationIssuer:"unknown"},specialIssuer:{canadaEducationIssuer:"MCC"},
  missingIssue:{assessmentDate:""},beforeAward:{assessmentDate:"2017-01-01"},futureIssue:{assessmentDate:"2026-11-28"},invalidIssue:{assessmentDate:"2023-02-30"},
  exactlyFiveYears:{assessmentDate:"2021-11-27"},expired:{assessmentDate:"2021-11-26"},expiryConflict:{expiry:"2022-01-01"},earlierExpiry:{expiry:"2026-11-26"},invalidExpiry:{expiry:"2026-02-30"},
 }))it("rejects "+label,()=>expect(mapCanadaEducation(change(patch),today).ok).toBe(false));
 it("accepts valid ECA on day before fifth anniversary",()=>expect(mapCanadaEducation(change({assessmentDate:"2021-11-28"}),today)).toMatchObject({ok:true,validUntil:today}));
 it("respects earlier supplied expiry",()=>expect(mapCanadaEducation(change({expiry:"2026-12-01"}),today)).toMatchObject({ok:true,validUntil:"2026-12-01"}));
 it("uses Canadian credential without ECA",()=>expect(mapCanadaEducation(change({country:"CA",canadaEducationBasis:"canadian",canadaEducationIssuer:"",assessmentDate:""}),today)).toMatchObject({ok:true,credential:"canadian",validUntil:null}));
 it("rejects Canadian credential with conflicting ECA details",()=>expect(mapCanadaEducation(change({country:"CA",canadaEducationBasis:"canadian"}),today).ok).toBe(false));
 it("rejects stale rule pack",()=>expect(mapCanadaEducation(base,"2026-12-26").ok).toBe(false));
 it("links spouse only to explicitly spouse-owned evidence",()=>{expect(mapCanadaEducation(base,today,"spouse").ok).toBe(false);expect(mapCanadaEducation(change({canadaEducationOwner:"spouse"}),today,"spouse").ok).toBe(true);});
 it("linked removal clears both fields; unlink restores manual scenario",()=>{const manual={education:"7",credential:"canadian"};expect(withCanadaEducation(manual,"1",[base],today)).toMatchObject({education:"4",credential:"2023-01-01"});expect(withCanadaEducation(manual,"1",[],today)).toEqual({education:"",credential:""});expect(withCanadaEducation(manual,"",[],today)).toEqual(manual);});
 it("does not overwrite applicant values when spouse link is used",()=>expect(withCanadaEducation({education:"7",credential:"canadian"},"1",[change({canadaEducationOwner:"spouse"})],today,"spouse")).toMatchObject({education:"7",credential:"canadian",spouseEducation:"4",spouseCredential:"2023-01-01"}));
});

describe("Canadian multiple credentials",()=>{
 const first=change({institution:"Example University"});
 const second:EvidenceRecord={...change({qualification:"Example diploma",institution:"Example College",awarded:"2020-01-01",assessmentDate:"2022-01-01",canadaEducationLevel:"two-year"}),id:2};
 const records=[first,second];
 const map=(a=first,b=second,confirmed=true)=>mapCanadaEducationPair(a,b,today,confirmed);
 it("uses the earliest ECA and earliest validity end",()=>expect(map()).toMatchObject({ok:true,level:"5",credential:"2022-01-01",validUntil:"2026-12-31"}));
 it("is independent of selection order",()=>expect(map(second,first)).toEqual(map()));
 it("rejects same record",()=>expect(map(first,first).ok).toBe(false));
 it("rejects probable duplicate across different IDs",()=>expect(map(first,{...first,id:3,values:{...first.values,qualification:" EXAMPLE DEGREE "}}).ok).toBe(false));
 it("rejects missing institution",()=>expect(map({...first,values:{...first.values,institution:""}},second).ok).toBe(false));
 it("rejects two short credentials",()=>expect(map({...first,values:{...first.values,canadaEducationLevel:"two-year"}},second).ok).toBe(false));
 it("rejects secondary schooling as second credential",()=>expect(map(first,{...second,values:{...second.values,canadaEducationLevel:"secondary"}}).ok).toBe(false));
 it("does not downgrade a master's degree to multiple",()=>expect(map({...first,values:{...first.values,canadaEducationLevel:"masters"}},second).ok).toBe(false));
 it("rejects unconfirmed pair",()=>expect(map(first,second,false).ok).toBe(false));
 it("rejects expired second ECA",()=>expect(map(first,{...second,values:{...second.values,assessmentDate:"2021-11-27"}}).ok).toBe(false));
 it("rejects mixed owner",()=>expect(map(first,{...second,values:{...second.values,canadaEducationOwner:"spouse"}}).ok).toBe(false));
 const domestic={...first,values:{...first.values,country:"Canada",canadaEducationBasis:"canadian",canadaEducationIssuer:"",assessmentDate:""}};
 it("supports Canadian plus foreign",()=>expect(map(domestic,second)).toMatchObject({ok:true,level:"5",credential:"2022-01-01"}));
 it("supports two Canadian credentials",()=>expect(map(domestic,{...second,values:{...second.values,country:"CA",canadaEducationBasis:"canadian",canadaEducationIssuer:"",assessmentDate:""}})).toMatchObject({ok:true,credential:"canadian",validUntil:null}));
 it("requires re-confirmation after record edit",()=>{const key=credentialPairKey("1","2",records);expect(withCanadaEducationSelection({},"1","2",key,records,today).education).toBe("5");expect(withCanadaEducationSelection({},"1","2",key,[first,{...second,values:{...second.values,qualification:"Changed"}}],today).education).toBe("");});
 it("fails closed on deletion",()=>expect(withCanadaEducationSelection({education:"7",credential:"canadian"},"1","2",credentialPairKey("1","2",records),[first],today)).toEqual({education:"",credential:""}));
 it("unlink restores single or independent scenario",()=>{const manual={education:"7",credential:"canadian"};expect(withCanadaEducationSelection(manual,"1","","",records,today).education).toBe("4");expect(withCanadaEducationSelection(manual,"","","",records,today)).toEqual(manual);});
 it("supports spouse pair without overwriting applicant",()=>{const own=records.map(r=>({...r,values:{...r.values,canadaEducationOwner:"spouse"}}));expect(withCanadaEducationSelection({education:"7"},"1","2",credentialPairKey("1","2",own),own,today,"spouse")).toMatchObject({education:"7",spouseEducation:"5"});});
});
