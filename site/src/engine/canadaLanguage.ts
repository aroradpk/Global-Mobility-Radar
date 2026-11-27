import {dateValue} from "./jobScreening";
import type {EvidenceRecord} from "./profileEvidence";
export const canadaLanguageSource="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html";
export const canadaLanguageReview={from:"2026-11-26",through:"2026-12-25"};
const abilities=["speaking","listening","reading","writing"] as const;
type Kind="english"|"french";
type Rule={kind:Kind;min:number[];max:number[];step:number;thresholds:number[][]};
const celpip=[4,5,6,7,8,9,10];
const rules:Record<string,Rule>={
 "ielts general training":{kind:"english",min:[0,0,0,0],max:[9,9,9,9],step:.5,thresholds:[[4,5,5.5,6,6.5,7,7.5],[4.5,5,5.5,6,7.5,8,8.5],[3.5,4,5,6,6.5,7,8],[4,5,5.5,6,6.5,7,7.5]]},
 "celpip-general":{kind:"english",min:[1,1,1,1],max:[12,12,12,12],step:1,thresholds:[celpip,celpip,celpip,celpip]},
 "pte core":{kind:"english",min:[10,10,10,10],max:[90,90,90,90],step:1,thresholds:[[42,51,59,68,76,84,89],[28,39,50,60,71,82,89],[33,42,51,60,69,78,88],[41,51,60,69,79,88,90]]},
 "tef canada (previous score equivalency)":{kind:"french",min:[0,0,0,0],max:[450,360,300,450],step:1,thresholds:[[181,226,271,310,349,371,393],[145,181,217,249,280,298,316],[121,151,181,207,233,248,263],[181,226,271,310,349,371,393]]},
 "tcf canada":{kind:"french",min:[0,0,0,0],max:[20,699,699,20],step:1,thresholds:[[4,6,7,10,12,14,16],[331,369,398,458,503,523,549],[342,375,406,453,499,524,549],[4,6,7,10,12,14,16]]},
};
type Result={ok:true;kind:Kind;levels:number[];taken:string}|{ok:false;reason:string};
const valid=(s:string)=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&dateValue(s)!==null;
export function mapCanadaLanguage(record:EvidenceRecord|undefined,today:string):Result{
 const fail=(reason:string):Result=>({ok:false,reason});
 if(!valid(today)||today<canadaLanguageReview.from||today>canadaLanguageReview.through)return fail("Language rules require review for this assessment date.");
 if(!record||record.kind!=="language")return fail("No saved language record selected.");
 const v=record.values;
 const name=(v.test??"").trim().toLowerCase();
 const rule=Object.prototype.hasOwnProperty.call(rules,name)?rules[name]:undefined;
 if(!rule)return fail("Use an exact supported approved test name.");
 if(v.canadaFormat!=="confirmed")return fail("Confirm the approved test format and original score source in the profile.");
 if(v.language&&v.language.trim().toLowerCase()!==rule.kind)return fail("Test and language conflict.");
 if(!valid(v.taken)||v.taken>today)return fail("A valid past test date is required.");
 const anniversary=String(Number(v.taken.slice(0,4))+2)+v.taken.slice(4);
 const cutoff=valid(anniversary)?anniversary:anniversary.slice(0,8)+"28";
 if(today>=cutoff||(v.expiry&&(!valid(v.expiry)||v.expiry<v.taken||today>v.expiry)))return fail("Test is expired or expiry evidence conflicts.");
 const levels:number[]=[];
 for(let i=0;i<abilities.length;i++){
  const raw=v[abilities[i]];
  if(typeof raw!=="string"||!/^\d{1,3}(?:\.\d)?$/.test(raw))return fail("Enter all four numeric component scores.");
  const score=Number(raw);
  if(score<rule.min[i]||score>rule.max[i]||score%rule.step!==0)return fail("A component score is outside the supported test scale.");
  const idx=rule.thresholds[i].reduce((best,min,j)=>score>=min?j:best,-1);
  if(idx<0)return fail("A component is below the mapped benchmark range (4); use official manual review.");
  levels.push(idx+4);
 }
 return {ok:true,kind:rule.kind,levels,taken:v.taken};
}
export type LanguageSlot="first"|"second"|"spouseLanguage";
export const canadaLanguageOwners=[["applicant","Principal applicant"],["spouse","Spouse / partner"]] as const;
export function resolveCanadaLanguage(record:EvidenceRecord|undefined,today:string,slot:LanguageSlot,firstKind:string):Result{
 const mapped=mapCanadaLanguage(record,today);
 if(!mapped.ok)return mapped;
 const owner=slot==="spouseLanguage"?"spouse":"applicant";
 if(record?.values.canadaLanguageOwner!==owner)return {ok:false,reason:"Confirm the correct language test owner in the profile."};
 if(slot==="spouseLanguage")return mapped;
 if(firstKind!=="english"&&firstKind!=="french")return {ok:false,reason:"Select the applicant's first official language."};
 const expected=slot==="first"?firstKind:firstKind==="english"?"french":"english";
 if(mapped.kind!==expected)return {ok:false,reason:slot==="first"?"Test must match the first official language.":"Second official language must be different from the first."};
 return mapped;
}
// Selected evidence stays live; no fallback to independent drafts until unlink.
export function withCanadaLanguage(input:Record<string,string>,selected:string,records:readonly EvidenceRecord[],today:string,slot:LanguageSlot="first"):Record<string,string>{
 if(!selected)return input;
 const mapped=resolveCanadaLanguage(records.find(r=>String(r.id)===selected),today,slot,input.firstKind??"");
 return {...input,[slot]:mapped.ok?mapped.levels.join(","):"",[slot+"Date"]:mapped.ok?mapped.taken:""};
}
