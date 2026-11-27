import {dateValue} from "./jobScreening";
import type {EvidenceRecord} from "./profileEvidence";

export const canadaEducationSource="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/education-assessment.html";
export const canadaEducationReview={reviewedOn:"2026-11-27",from:"2026-11-26",through:"2026-12-25"};
// The user selects an IRCC education category after reading the actual credential/ECA.
// No inference from foreign degree names or academic years. Specialized
// entry-to-practice professional degrees remain manual.
const categories=[
 ["secondary","1","Secondary school"],
 ["one-year","2","One-year postsecondary credential"],
 ["two-year","3","Two-year postsecondary credential"],
 ["three-plus","4","Bachelor's / three-or-more-year postsecondary credential"],
 ["masters","6","Master's degree"],
 ["doctorate","7","Doctorate"],
] as const;
const issuers=[
 ["CES","Comparative Education Service (University of Toronto)"],
 ["ICAS","International Credential Assessment Service of Canada"],
 ["WES","World Education Services"],
 ["IQAS","International Qualifications Assessment Service"],
 ["ICES","International Credential Evaluation Service"],
] as const;
export const canadaEducationFields:Record<string,readonly (readonly [string,string])[]>={
 canadaEducationOwner:[["applicant","Principal applicant"],["spouse","Spouse / partner"]],
 canadaEducationBasis:[["canadian","Completed Canadian credential"],["eca","Foreign credential with immigration ECA"]],
 canadaEducationLevel:categories.map(([key,,label])=>[key,label] as const),
 canadaEducationIssuer:issuers,
 canadaEducationConfirmed:[["confirmed","Yes — checked the original evidence and applicable IRCC rules"]],
};
type Result={ok:true;level:string;label:string;credential:string;validUntil:string|null}|{ok:false;reason:string};
const valid=(s:string)=>typeof s==="string"&&dateValue(s)!==null;
const isCanada=(country:string)=>["ca","canada"].includes(country.trim().toLowerCase());
export function mapCanadaEducation(record:EvidenceRecord|undefined,today:string,owner:"applicant"|"spouse"="applicant"):Result{
 const fail=(reason:string):Result=>({ok:false,reason});
 if(!valid(today)||today<canadaEducationReview.from||today>canadaEducationReview.through)return fail("Education rules require review for this assessment date.");
 if(!record||record.kind!=="education")return fail("No saved education record selected.");
 const v=record.values;
 if(v.canadaEducationOwner!==owner)return fail("Confirm whose credential this is in the profile.");
 if(v.canadaEducationConfirmed!=="confirmed")return fail("Check the original credential or immigration ECA and applicable IRCC rules first.");
 const category=categories.find(row=>row[0]===v.canadaEducationLevel);
 if(!category)return fail("Select one supported Canadian-equivalent education category from the original evidence.");
 if(!v.country?.trim())return fail("Record the country where the credential was awarded.");
 if(!valid(v.awarded)||v.awarded>today)return fail("A valid completed credential award date is required.");
 const result={ok:true as const,level:category[1],label:category[2]};
 if(v.canadaEducationBasis==="canadian"){
  if(!isCanada(v.country)||v.canadaEducationIssuer||v.assessmentDate||v.expiry)return fail("Canadian credential and assessment details conflict; use manual review.");
  return {...result,credential:"canadian",validUntil:null};
 }
 if(v.canadaEducationBasis!=="eca"||isCanada(v.country))return fail("Confirm a foreign credential and an immigration-purpose ECA.");
 if(!issuers.some(row=>row[0]===v.canadaEducationIssuer))return fail("Select a supported designated general ECA organization; professional-body cases require manual review.");
 const issue=v.assessmentDate;
 if(!valid(issue)||issue<v.awarded||issue>today)return fail("A valid ECA issue date on or after the award date is required.");
 const anniversary=String(Number(issue.slice(0,4))+5)+issue.slice(4);
 const cutoff=valid(anniversary)?anniversary:anniversary.slice(0,8)+"28";
 if(today>=cutoff)return fail("ECA must be less than five years old.");
 if(v.expiry&&(!valid(v.expiry)||v.expiry<issue||today>v.expiry))return fail("ECA is expired or the supplied expiry date conflicts.");
 // Conservative boundary: report-specific expiry is inclusive; the five-year
 // anniversary is exclusive. Never imply validity for a later application.
 const lastDay=new Date(Date.parse(cutoff+"T00:00:00Z")-86400000).toISOString().slice(0,10);
 return {...result,credential:issue,validUntil:v.expiry&&v.expiry<lastDay?v.expiry:lastDay};
}
export function withCanadaEducation(input:Record<string,string>,selected:string,records:readonly EvidenceRecord[],today:string,owner:"applicant"|"spouse"="applicant"):Record<string,string>{
 if(!selected)return input;
 const mapped=mapCanadaEducation(records.find(r=>String(r.id)===selected),today,owner);
 const levelKey=owner==="applicant"?"education":"spouseEducation";
 const credentialKey=owner==="applicant"?"credential":"spouseCredential";
 return {...input,[levelKey]:mapped.ok?mapped.level:"",[credentialKey]:mapped.ok?mapped.credential:""};
}

// Pair confirmation is tied to the exact reviewed records, not just their IDs.
// Any edit invalidates the attestation until the user checks both originals again.
export function credentialPairKey(first:string,second:string,records:readonly EvidenceRecord[]):string{
 if(!first||!second)return "";
 const a=records.find(r=>String(r.id)===first),b=records.find(r=>String(r.id)===second);
 return a&&b?JSON.stringify([a,b]):"";
}
const normalize=(s:string)=>s.normalize("NFKC").trim().toLowerCase().replace(/[\s\p{P}]+/gu,"");
export function mapCanadaEducationPair(first:EvidenceRecord|undefined,second:EvidenceRecord|undefined,today:string,confirmed:boolean,owner:"applicant"|"spouse"="applicant"):Result{
 const fail=(reason:string):Result=>({ok:false,reason});
 if(!first||!second||first.id===second.id)return fail("Select two distinct saved credentials.");
 const a=mapCanadaEducation(first,today,owner),b=mapCanadaEducation(second,today,owner);
 if(!a.ok)return fail("First credential: "+a.reason);
 if(!b.ok)return fail("Second credential: "+b.reason);
 const key=(r:EvidenceRecord)=>[r.values.institution,r.values.qualification,r.values.awarded].map(v=>normalize(v??""));
 const x=key(first),y=key(second);
 if(x.some(v=>!v)||y.some(v=>!v))return fail("Enter institution, qualification and award date for both credentials.");
 if(x.every((v,i)=>v===y[i]))return fail("These records appear to describe the same credential.");
 if(!["2","3","4"].includes(a.level)||!["2","3","4"].includes(b.level)||![a.level,b.level].includes("4"))return fail("Use two postsecondary credentials, at least one assessed as three years or longer. For master's or doctorate use the supported single-credential category or manual review.");
 if(!confirmed)return fail("Confirm that these are distinct completed credentials and each foreign credential has a valid immigration ECA.");
 const dates=[a.credential,b.credential].filter(v=>v!=="canadian").sort();
 const expiry=[a.validUntil,b.validUntil].filter((v):v is string=>v!==null).sort();
 return {ok:true,level:"5",label:"Two or more postsecondary credentials (one three years or longer)",credential:dates[0]??"canadian",validUntil:expiry[0]??null};
}
export function resolveEducationSelection(first:string,second:string,attestation:string,records:readonly EvidenceRecord[],today:string,owner:"applicant"|"spouse"="applicant"):Result{
 const a=records.find(r=>String(r.id)===first);
 if(!second)return mapCanadaEducation(a,today,owner);
 const key=credentialPairKey(first,second,records);
 return mapCanadaEducationPair(a,records.find(r=>String(r.id)===second),today,!!key&&key===attestation,owner);
}
export function withCanadaEducationSelection(input:Record<string,string>,first:string,second:string,attestation:string,records:readonly EvidenceRecord[],today:string,owner:"applicant"|"spouse"="applicant"):Record<string,string>{
 if(!first&&!second)return input;
 const mapped=resolveEducationSelection(first,second,attestation,records,today,owner);
 return {...input,[owner==="applicant"?"education":"spouseEducation"]:mapped.ok?mapped.level:"",[owner==="applicant"?"credential":"spouseCredential"]:mapped.ok?mapped.credential:""};
}
