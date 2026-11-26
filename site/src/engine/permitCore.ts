import { dateValue } from "./jobScreening";

export type Facts = Record<string,string>;
export type Status = "review_required" | "requirements_not_met" | "meets_self_reported_screen";
export type Option = readonly [string,string];
export type Field = {
  key:string; label:string; kind:"yes"|"choice"|"number"|"money"|"date"|"text";
  options?:readonly Option[]; when?:(input:Facts)=>boolean; manual?:boolean;
};
export type Checks = { missing:string[]; failed:string[]; details:string[] };
export type Route = {
  id:string; title:string; kind:string; intro:string; source:string; links?:readonly Option[];
  fields:Field[]; check:(input:Facts,today:string,out:Checks)=>void;
};
export const REVIEWED = "2026-11-26";
export const REVIEW_BY = "2026-12-26";
export const yes=(key:string,label:string,manual=false):Field=>({key,label,kind:"yes",manual});
export const choice=(key:string,label:string,options:readonly Option[]):Field=>({key,label,kind:"choice",options});
export const field=(key:string,label:string,kind:Field["kind"]="number"):Field=>({key,label,kind});
export const when=(f:Field,condition:(input:Facts)=>boolean):Field=>({...f,when:condition});
export const number=(s:string|undefined):number|null=>typeof s==="string"&&/^\d{1,3}$/.test(s)?Number(s):null;
export const cents=(s:string|undefined):number|null=>typeof s==="string"&&/^\d{1,9}(?:\.\d{1,2})?$/.test(s)&&Number(s)>0?Math.round(Number(s)*100):null;
export const euro=(v:number)=>"EUR "+v.toLocaleString("en-IE",{maximumFractionDigits:2});
export function minimum(input:Facts,key:string,min:number,label:string,out:Checks) {
  const n=number(input[key]);if(n!==null&&n<min)out.failed.push(label);
}
export function salary(input:Facts,amount:number,unit:string,out:Checks,strict=false) {
  out.details.push("Published salary criterion: "+euro(amount)+" per "+unit+(strict?" (official permit guidance says over this amount)":""));
  const value=cents(input.salary);
  if(value===null)return;
  const floor=Math.round(amount*100);
  if(value<floor)out.failed.push("Qualifying remuneration below the selected criterion");
  else if(strict&&value===floor)out.missing.push("At the published high-pay boundary; verify with DETE before relying on it");
}
export function recentYears(raw:string,today:string,years:number):boolean {
  if(dateValue(raw)===null||raw>today)return false;
  const boundary=String(Number(raw.slice(0,4))+years)+raw.slice(4);
  // Exact anniversary needs manual review rather than assuming a reduced criterion.
  return today < (dateValue(boundary)===null?boundary.slice(0,8)+"28":boundary);
}
export function evaluatePermit(route:Route|undefined,input:Facts,today:string) {
  const out:Checks={missing:[],failed:[],details:[]};
  if(!route||dateValue(today)===null||today<REVIEWED||today>REVIEW_BY)out.missing.push("Current rule review required");
  else{
    for(const f of route.fields){
      if(f.when&&!f.when(input))continue;
      const v=input[f.key];
      if(f.kind==="yes"){
        if(v==="no"){(f.manual?out.missing:out.failed).push(f.label);}
        else if(v!=="yes")out.missing.push(f.label);
      }else if(f.kind==="choice"){
        if(!f.options?.some(([k])=>k===v))out.missing.push(f.label);
      }else if(f.kind==="number"?number(v)===null:f.kind==="money"?cents(v)===null:f.kind==="date"?(!v||dateValue(v)===null||v>today):(typeof v!=="string"||!v.trim()||v.length>200))out.missing.push(f.label);
    }
    route.check(input,today,out);
  }
  // Out-of-scope or unsupported pay/permit cases cannot be definitively failed by ordinary thresholds.
  const scopeReview=route?.fields.some(f=>["scope","standard","pay"].includes(f.key)&&f.manual&&input[f.key]==="no")??false;
  if(scopeReview){out.failed=[];out.details=[];}
  const status:Status=scopeReview||!route||dateValue(today)===null||today<REVIEWED||today>REVIEW_BY?"review_required":out.failed.length?"requirements_not_met":out.missing.length?"review_required":"meets_self_reported_screen";
  return {status,missing:[...new Set(out.missing)],failed:[...new Set(out.failed)],details:out.details};
}
