import {describe,it,expect} from "vitest";
import {mapCanadaEducation,withCanadaEducation} from "./canadaEducation";
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
