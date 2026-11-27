import {dateValue} from "./jobScreening";
import type {EvidenceRecord} from "./profileEvidence";
export const australianEnglishSources=["competent","proficient","superior"].map(level=>"https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/english-language/"+level+"-english");
export const australianEnglishChoices:Record<string,readonly (readonly [string,string])[]>={australiaEnglishOwner:[["applicant","Principal applicant"],["spouse","Spouse / partner"]],australiaEnglishConfirmed:[["confirmed","Checked approved in-person test, all four original component results, applicable visa and format (no retake)"]]};
type Level="below"|"competent"|"proficient"|"superior";
type Result={ok:true;level:Level;taken:string}|{ok:false;reason:string};
type Thresholds=readonly (readonly number[])[];
const uniform=(a:number,b:number,c:number):Thresholds=>[[a,a,a,a],[b,b,b,b],[c,c,c,c]];
// Order: listening, reading, writing, speaking. Tables reviewed 2026-11-27.
const pteNew:Thresholds=[[47,48,51,54],[58,59,69,76],[69,70,85,88]];
const celpip:Thresholds=[[7,7,7,7],[9,8,10,8],[10,10,12,10]];
const valid=(s:string)=>typeof s==="string"&&dateValue(s)!==null;
export function mapAustraliaEnglish(record:EvidenceRecord|undefined,today:string):Result{
 const fail=(reason:string):Result=>({ok:false,reason});
 if(!valid(today)||today<"2026-11-26"||today>"2026-12-26")return fail("English rules require current review.");
 if(!record||record.kind!=="language")return fail("Select a saved language test.");
 const v=record.values;
 if(v.australiaEnglishOwner!=="applicant"||v.australiaEnglishConfirmed!=="confirmed")return fail("Confirm principal-applicant ownership and Australian approved test evidence.");
 if(v.language&&v.language.trim().toLowerCase()!=="english")return fail("Conflicting language.");
 if(!valid(v.taken)||v.taken>today)return fail("A valid test date is required.");
 const anniversary=String(Number(v.taken.slice(0,4))+3)+v.taken.slice(4);
 const cutoff=valid(anniversary)?anniversary:anniversary.slice(0,8)+"28";
 if(today>=cutoff||(v.expiry&&(!valid(v.expiry)||v.expiry<v.taken||today>v.expiry)))return fail("Test is expired or expiry conflicts.");
 const test=(v.test??"").trim().toLowerCase(),modern=v.taken>="2025-08-07";
 let thresholds:Thresholds,min:number,max:number,step:number;
 if(["ielts academic","ielts general training"].includes(test)){thresholds=uniform(6,7,8);min=0;max=9;step=.5;}
 else if(test==="pte academic"){thresholds=modern?pteNew:uniform(50,65,79);min=10;max=90;step=1;}
 else if(["celpip-general","celpip general"].includes(test)&&modern){thresholds=celpip;min=1;max=12;step=1;}
 else return fail("Unsupported test or date version; use official manual review.");
 const scores=["listening","reading","writing","speaking"].map(k=>v[k]);
 if(scores.some(s=>typeof s!=="string"||!/^\d{1,3}(?:\.\d)?$/.test(s)||Number(s)<min||Number(s)>max||Number(s)%step!==0))return fail("Enter all four valid original component scores.");
 const levels:Level[]=["below","competent","proficient","superior"];
 let level:Level="below";
 thresholds.forEach((row,i)=>{if(row.every((n,j)=>Number(scores[j])>=n))level=levels[i+1];});
 return {ok:true,level,taken:v.taken};
}
export function withAustraliaEnglish(input:Record<string,string>,selected:string,records:readonly EvidenceRecord[],today:string):Record<string,string>{
 if(!selected)return input;
 const result=mapAustraliaEnglish(records.find(r=>String(r.id)===selected),today);
 return {...input,english:result.ok?result.level:"",englishEvidence:result.ok?"test":"",englishDate:result.ok?result.taken:""};
}
