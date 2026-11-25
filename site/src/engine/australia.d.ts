export interface AustraliaRoute {id:string;kind:string;points:number|null;potentialPoints:number|null;status:"requirements_not_met"|"review_required"|"potential_eoi_candidate"|"meets_self_reported_screen";missing:string[];failed:string[]}
export interface AustraliaAssessment {basePoints:number|null;factors:Record<string,number>;routes:AustraliaRoute[];missing:string[];failed:string[]}
export function assessAustralia(input:Record<string,string>,today:string):AustraliaAssessment;
