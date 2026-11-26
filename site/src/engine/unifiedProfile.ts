import type { Profile } from "../types";
import { dateValue } from "./jobScreening";

export type ConfirmedAge = {value:string; confirmedOn:string};
export const blankJobProfile=():Profile=>({skills:[],years:0,level:"entry",degree:"none",certs:[],languages:[],families:[],titles:[],textLength:0});
// The legacy job profile has required numeric/categorical fields. Manual onboarding
// must explicitly collect these before committing; placeholder values never qualify.
export function validCareerYears(value:string):boolean{
 return /^(?:[0-9]|[1-4][0-9]|50)(?:\.[0-9])?$/.test(value)&&Number(value)<=50;
}
export function confirmAge(value:string,today:string):ConfirmedAge|null{
 if(typeof value!=="string"||!/^\d{1,3}$/.test(value)||Number(value)<18||Number(value)>120||dateValue(today)===null)return null;
 return {value:String(Number(value)),confirmedOn:today};
}
export function currentAge(age:ConfirmedAge|null,today:string):string{
 return age?.confirmedOn===today?(confirmAge(age.value,today)?.value??""):"";
}
// Linked values are derived, never copied. When expired/deleted, the linked
// field becomes unknown, not the old manual value. Unlink restores manual draft.
export function withProfileAge<T extends Record<string,string>>(input:T,key:"age"|"opAge",linked:boolean,age:string):T{
 return linked?{...input,[key]:age}:input;
}
