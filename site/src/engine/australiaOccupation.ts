import {dateValue} from "./jobScreening";
import type {EvidenceRecord} from "./profileEvidence";
export const australiaOccupationSources={
 instrument:"https://www.legislation.gov.au/F2019L00278/latest",
 list:"https://immi.homeaffairs.gov.au/visas/working-in-australia/skill-occupation-list",
 acs:"https://www.acs.org.au/msa/infohub/assessment-process.html",
 skills:"https://immi.homeaffairs.gov.au/visas/working-in-australia/skills-assessment",
};
export const australiaOccupationReview={from:"2026-11-26",reviewedOn:"2026-11-27",through:"2026-12-26"};
// LIN 19/051 compilation F2026C00265, ss 7–9, 11. ANZSCO 2013 only.
// Bounded ACS subset; absent codes require independent review, not rejection.
const rows=[
 ["261111","ICT business analyst","MLTSSL"],["261112","Systems analyst","MLTSSL"],
 ["261211","Multimedia specialist","MLTSSL"],["261311","Analyst programmer","MLTSSL"],
 ["261312","Developer programmer","MLTSSL"],["261313","Software engineer","MLTSSL"],
 ["261399","Software and applications programmers (nec)","MLTSSL"],
 ["262112","ICT security specialist","MLTSSL"],["263111","Computer network and systems engineer","MLTSSL"],
 ["261212","Web developer","STSOL"],["261314","Software tester","STSOL"],
 ["262111","Database administrator","STSOL"],["262113","Systems administrator","STSOL"],
 ["263112","Network administrator","STSOL"],["263113","Network analyst","STSOL"],
] as const;
type Lookup={ok:true;code:string;title:string;list:"MLTSSL"|"STSOL";authority:"ACS";independent:boolean;state190:boolean;state491:boolean;family491:boolean}|{ok:false;reason:string};
type SkillResult={ok:true;occupation:Extract<Lookup,{ok:true}>;issue:string;lastValid:string}|{ok:false;reason:string};
const valid=(s:string)=>typeof s==="string"&&dateValue(s)!==null;
export const australiaSkillChoices:Record<string,readonly (readonly [string,string])[]>={
 australiaSkillOwner:[["applicant","Principal applicant"],["spouse","Spouse / partner"]],
 australiaSkillClassification:[["ANZSCO 2013","ANZSCO 2013"]],
 australiaSkillAuthority:[["ACS","Australian Computer Society (ACS)"]],
 australiaSkillOutcome:[["suitable","Suitable — positive migration assessment"],["unsuitable","Unsuitable"],["unknown","Unknown / pending"]],
 australiaSkillConfirmed:[["confirmed","Checked original current outcome for nominated occupation; permanent migration, not 485, not revoked"]],
};
export function lookupAustraliaOccupation(code:string,classification:string,today:string):Lookup{
 if(!valid(today)||today<australiaOccupationReview.from||today>australiaOccupationReview.through)return {ok:false,reason:"Occupation rules require current review."};
 if(classification!=="ANZSCO 2013")return {ok:false,reason:"Use ANZSCO 2013 for these visa subclasses."};
 if(typeof code!=="string"||!/^\d{6}$/.test(code.trim()))return {ok:false,reason:"Enter the exact six-digit occupation code."};
 const row=rows.find(r=>r[0]===code.trim());
 if(!row)return {ok:false,reason:"Not in the local reference subset; consult the official list."};
 return {ok:true,code:row[0],title:row[1],list:row[2],authority:"ACS",independent:row[2]==="MLTSSL",state190:true,state491:true,family491:row[2]==="MLTSSL"};
}
export function mapAustraliaSkill(record:EvidenceRecord|undefined,today:string):SkillResult{
 const fail=(reason:string):SkillResult=>({ok:false,reason});
 if(!record||record.kind!=="skillsAssessment")return fail("Select a saved skills assessment.");
 const v=record.values;
 if(v.australiaSkillOwner!=="applicant")return fail("Only principal-applicant assessments can be linked here.");
 const occupation=lookupAustraliaOccupation(v.occupation??"",v.australiaSkillClassification??"",today);
 if(!occupation.ok)return fail(occupation.reason);
 if(v.australiaSkillAuthority!==occupation.authority||v.australiaSkillOutcome!=="suitable"||v.australiaSkillConfirmed!=="confirmed")return fail("Confirm a suitable, current ACS outcome for permanent migration in the nominated occupation.");
 const issue=v.assessmentDate;
 if(!valid(issue)||issue>today)return fail("A valid issue date is required.");
 // ACS publishes a two-year validity period, shorter than the general three-year ceiling.
 const anniversary=String(Number(issue.slice(0,4))+2)+issue.slice(4);
 const cutoff=valid(anniversary)?anniversary:anniversary.slice(0,8)+"28";
 if(today>=cutoff)return fail("ACS two-year validity period has ended.");
 if(v.expiry&&(!valid(v.expiry)||v.expiry<issue||today>v.expiry))return fail("Outcome expiry is past or conflicts with the issue date.");
 const last=new Date(Date.parse(cutoff+"T00:00:00Z")-86400000).toISOString().slice(0,10);
 return {ok:true,occupation,issue,lastValid:v.expiry&&v.expiry<last?v.expiry:last};
}
export function withAustraliaSkill(input:Record<string,string>,selected:string,records:readonly EvidenceRecord[],today:string,regionalPath:string):Record<string,string>{
 if(!selected)return input;
 const result=mapAustraliaSkill(records.find(r=>String(r.id)===selected),today);
 if(!result.ok)return {...input,skills:"",skillsDate:"",skillsValid:"",occupation189:"",occupation190:"",occupation491:""};
 const o=result.occupation;
 return {...input,skills:"yes",skillsDate:result.issue,skillsValid:"yes",occupation189:o.independent?"yes":"no",occupation190:"yes",occupation491:regionalPath==="state"?"yes":regionalPath==="family"?(o.family491?"yes":"no"):""};
}
