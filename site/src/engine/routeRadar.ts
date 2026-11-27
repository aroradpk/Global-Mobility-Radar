import {PERMIT_ROUTES,REVIEWED,REVIEW_BY,type Country} from "./europePermits";
import {dateValue} from "./jobScreening";
export const countryNames={canada:"Canada",australia:"Australia",germany:"Germany",ireland:"Ireland",netherlands:"Netherlands",newzealand:"New Zealand",uk:"United Kingdom",hongkong:"Hong Kong",singapore:"Singapore",uae:"United Arab Emirates",us:"United States"} as const;
export type RadarCountry=keyof typeof countryNames;
export type RadarRoute={id:string;country:RadarCountry;title:string;kind:string;summary:string;source:string;reviewed:string;reviewBy:string};
const ca="https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/";
const au="https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/";
const de="https://www.make-it-in-germany.com/en/";
const initial:Omit<RadarRoute,"reviewed"|"reviewBy">[]=[
 {id:"fsw",country:"canada",title:"Federal Skilled Worker / Express Entry",kind:"Permanent residence pathway",summary:"A job offer is not generally required for FSW; qualifying work, language, education, funds and selection apply. Invitation is separate.",source:ca+"who-can-apply/federal-skilled-workers.html"},
 {id:"189",country:"australia",title:"Skilled Independent 189",kind:"Permanent visa",summary:"Points-tested invitation; eligible occupation and suitable assessment. No employer offer required for this stream.",source:au+"skilled-independent-189/points-table"},
 {id:"190",country:"australia",title:"Skilled Nominated 190",kind:"Permanent visa",summary:"Points-tested invitation and state or territory nomination.",source:au+"skilled-nominated-190/points-table"},
 {id:"491",country:"australia",title:"Skilled Work Regional 491",kind:"Provisional regional visa",summary:"State nomination or eligible family sponsorship; separate permanent residence pathway.",source:au+"skilled-work-regional-provisional-491/points-table"},
 {id:"opportunity",country:"germany",title:"Opportunity Card",kind:"Temporary job-search permission",summary:"No job offer required initially. Recognised qualification or points route and sufficient funds.",source:de+"visa-recognition/opportunity-card/job-search"},
 {id:"blue",country:"germany",title:"EU Blue Card",kind:"Employment-based residence",summary:"Qualifying offer, salary and qualification or eligible IT experience.",source:de+"visa-recognition/visa-types/eu-blue-card"},
 {id:"settlement",country:"germany",title:"Settlement permit",kind:"Permanent residence after qualifying stay",summary:"Qualifying German residence and employment; not direct PR for an overseas applicant.",source:de+"arriving-living/long-term/settlement-permit"},
];
export const radarRoutes:RadarRoute[]=[...initial.map(r=>({...r,reviewed:r.country==="canada"?"2026-11-25":"2026-11-26",reviewBy:r.country==="canada"?"2026-12-25":"2026-12-26"})),...(Object.keys(PERMIT_ROUTES) as Country[]).flatMap(country=>PERMIT_ROUTES[country].map(r=>({id:r.id,country,title:r.title,kind:r.kind,summary:r.intro,source:r.source,reviewed:REVIEWED,reviewBy:REVIEW_BY})))];
export const routeKey=(r:RadarRoute)=>r.country+":"+r.id;
export function filterRadar(query:string,country:string):RadarRoute[]{
 const q=query.trim().toLowerCase();
 return radarRoutes.filter(r=>(!country||country===r.country)&&(!q||[r.title,r.kind,r.summary,countryNames[r.country]].join(" ").toLowerCase().includes(q)));
}
export function radarFresh(r:RadarRoute,today:string):boolean{return dateValue(today)!==null&&today>=r.reviewed&&today<=r.reviewBy;}
