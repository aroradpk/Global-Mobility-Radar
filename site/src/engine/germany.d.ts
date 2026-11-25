export const DE_THRESHOLDS: Readonly<{standard:number;reduced:number;monthlyFunds:number}>;
export interface GermanyAssessment {id:string;label:string;status:"review_required"|"requirements_not_met"|"meets_self_reported_screen";missing:string[];failed:string[];details:{path?:string;points?:number;minimumPoints?:number;pointBreakdown?:Record<string,number>;blockedAccountRequiredEUR?:number;minimumSalaryEUR?:number;annualGrossSalaryEUR?:number;requiredMonths?:number;qualifyingMonths?:number}}
export function assessGermany(input:Record<string,string>,today:string):GermanyAssessment[];
