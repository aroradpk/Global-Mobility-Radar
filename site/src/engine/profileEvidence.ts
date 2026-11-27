import {dateValue} from "./jobScreening";

type Field = {key:string;label:string;required?:boolean;format?:"date"|"amount"|"currency"|"count"};
export const evidenceFields = {
 employment: [{key:"employer",label:"Employer",required:true},{key:"role",label:"Role",required:true},{key:"country",label:"Country"},{key:"start",label:"Start date",format:"date"},{key:"end",label:"End date (blank if unknown or ongoing)",format:"date"},{key:"hours",label:"Weekly hours",format:"amount"},{key:"occupation",label:"Occupation code (self-reported)"},{key:"classification",label:"Occupation classification / jurisdiction"}],
 education: [{key:"qualification",label:"Qualification",required:true},{key:"institution",label:"Institution"},{key:"country",label:"Country"},{key:"awarded",label:"Award date",format:"date"},{key:"recognition",label:"Recognition / assessment type"},{key:"assessmentDate",label:"Assessment date",format:"date"},{key:"expiry",label:"Assessment expiry (if known)",format:"date"},{key:"canadaEducationOwner",label:"Canadian credential owner"},{key:"canadaEducationBasis",label:"Canadian credential evidence basis"},{key:"canadaEducationLevel",label:"Confirmed Canadian-equivalent education level"},{key:"canadaEducationIssuer",label:"Canadian ECA issuing organization (foreign only)"},{key:"canadaEducationConfirmed",label:"Canadian credential evidence checked"},{key:"germanyCredentialOwner",label:"German recognition credential owner"},{key:"germanyRecognitionBasis",label:"German recognition evidence basis"},{key:"germanyRecognitionConfirmed",label:"German recognition evidence checked"}],
 language: [{key:"test",label:"Language test name",required:true},{key:"language",label:"Language"},{key:"taken",label:"Test date",format:"date"},{key:"expiry",label:"Result expiry (if known)",format:"date"},{key:"reading",label:"Reading score / grade"},{key:"writing",label:"Writing score / grade"},{key:"listening",label:"Listening score / grade"},{key:"speaking",label:"Speaking score / grade"},{key:"canadaFormat",label:"Canadian approved test format checked (optional: confirmed)"},{key:"canadaLanguageOwner",label:"Canadian language test owner"},{key:"australiaEnglishOwner",label:"Australian English test owner"},{key:"australiaEnglishConfirmed",label:"Australian English evidence checked"}],
 family: [{key:"relationship",label:"Relationship (e.g. partner, child)",required:true},{key:"count",label:"Number of dependants",format:"count"},{key:"accompanying",label:"Accompanying / not accompanying / unknown"},{key:"qualification",label:"Partner qualification (if applicable)"},{key:"language",label:"Partner language evidence (if applicable)"}],
 funds: [{key:"amount",label:"Available amount",required:true,format:"amount"},{key:"currency",label:"Currency (3-letter code)",required:true,format:"currency"},{key:"asOf",label:"Balance date",format:"date"},{key:"basis",label:"Funds evidence type"}],
 salary: [{key:"amount",label:"Salary amount",required:true,format:"amount"},{key:"currency",label:"Currency (3-letter code)",required:true,format:"currency"},{key:"period",label:"Pay period (annual, monthly, etc.)",required:true},{key:"basis",label:"Gross / net / unknown"},{key:"asOf",label:"Salary observation date",format:"date"}],
 skillsAssessment: [{key:"occupation",label:"Assessed occupation code",required:true},{key:"australiaSkillClassification",label:"Australian skills classification"},{key:"australiaSkillOwner",label:"Australian assessment owner"},{key:"australiaSkillAuthority",label:"Australian assessing authority"},{key:"australiaSkillOutcome",label:"Australian assessment outcome"},{key:"assessmentDate",label:"Skills assessment issue date",format:"date"},{key:"expiry",label:"Assessment expiry (if known)",format:"date"},{key:"australiaSkillConfirmed",label:"Australian assessment checked"}],
 authorization: [{key:"country",label:"Jurisdiction",required:true},{key:"status",label:"Permit / work authorization type",required:true},{key:"start",label:"Start date",format:"date"},{key:"expiry",label:"Expiry date (if known)",format:"date"},{key:"conditions",label:"Work restrictions / conditions"}],
} as const satisfies Record<string,readonly Field[]>;
export type EvidenceKind = keyof typeof evidenceFields;
export const evidenceLabels:Record<EvidenceKind,string>={employment:"Employment history",education:"Education and recognition",language:"Language test",family:"Family circumstances",funds:"Available funds",salary:"Salary",skillsAssessment:"Australian skills assessment",authorization:"Work authorization"};
export type EvidenceRecord = {id:number;kind:EvidenceKind;values:Record<string,string>;confirmedOn:string};
export const maxEvidenceRecords=100;
const validDate=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&dateValue(value)!==null;
export function reviewEvidence(kind:EvidenceKind,values:Record<string,string>,today:string,id:number):{record:EvidenceRecord;error?:never}|{error:string;record?:never}{
 if(!Object.prototype.hasOwnProperty.call(evidenceFields,kind)||!validDate(today)||!Number.isSafeInteger(id)||id<1)return {error:"Invalid evidence record."};
 const clean:Record<string,string>={};
 for(const field of evidenceFields[kind] as readonly Field[]){
  const raw=values[field.key]??"";
  if(typeof raw!=="string"||raw.length>250)return {error:field.label+": enter at most 250 characters."};
  const value=raw.trim();
  if(!value){if(field.required)return {error:field.label+" is required."};continue;}
  if(field.format==="date"&&!validDate(value))return {error:field.label+": enter a valid date."};
  if(field.format==="amount"&&(!/^\d{1,12}(?:\.\d{1,2})?$/.test(value)||!Number.isFinite(Number(value))))return {error:field.label+": enter a non-negative decimal amount."};
  if(field.format==="count"&&!/^\d{1,2}$/.test(value))return {error:field.label+": enter a whole number from 0 to 99."};
  if(field.format==="currency"&&!/^[A-Za-z]{3}$/.test(value))return {error:field.label+": enter a three-letter currency code."};
  clean[field.key]=field.format==="currency"?value.toUpperCase():value;
 }
 for(const key of ["taken","awarded","assessmentDate","asOf"]){if(clean[key]&&clean[key]>today)return {error:"An observed event cannot be in the future."};}
 for(const [a,b] of [["start","end"],["start","expiry"],["taken","expiry"],["assessmentDate","expiry"]]){
  if(clean[a]&&clean[b]&&clean[a]>clean[b])return {error:"End or expiry date must not precede the start or observation date."};
 }
 if(kind==="employment"&&((clean.hours&&Number(clean.hours)>168)||(clean.start&&clean.start>today)||(clean.end&&clean.end>today)))return {error:"Employment history cannot contain future dates or more than 168 weekly hours."};
 if(kind==="employment"&&Boolean(clean.occupation)!==Boolean(clean.classification))return {error:"Provide both occupation code and classification, or leave both unknown."};
 return {record:{id,kind,values:clean,confirmedOn:today}};
}
export function evidenceState(record:EvidenceRecord,today:string):"expired"|"expiry unknown"|"self-reported"{
 if(record.values.expiry&&validDate(today)&&record.values.expiry<today)return "expired";
 return ["education","language","skillsAssessment","authorization"].includes(record.kind)&&!record.values.expiry?"expiry unknown":"self-reported";
}
// Export only reviewed facts, never an uncommitted editor draft or a CV.
export function serializeEvidence(records:readonly EvidenceRecord[],today:string):string{
 return JSON.stringify({schemaVersion:1,exportedOn:today,verification:"self-reported; not legal eligibility",records:records.map(r=>({...r,status:evidenceState(r,today)}))},null,2);
}
