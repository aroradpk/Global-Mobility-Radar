export interface CanadaAssessment { fsw: {status:"unknown"|"meets_screen"|"does_not_meet_screen";score:number|null;factors:Record<string,number>;missing:string[];failed:string[]};crs:{score:number|null;factors:Record<string,number>;missing:string[]} }
export function assessCanada(input:Record<string,string>,today:string):CanadaAssessment;
