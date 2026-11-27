import {dateValue} from "./jobScreening";
import {radarRoutes,routeKey,countryNames,type RadarRoute} from "./routeRadar";
import {safeJobUrl} from "../localJobs";
import type {Job} from "../types";
import type {DueCheck} from "./policyOperations";

export const stages=["shortlisted","preparing","applied","interview","offer","visa","pr","completed","rejected","withdrawn"] as const;
export type Stage=typeof stages[number];
export const stageLabels:Record<Stage,string>={shortlisted:"Shortlisted",preparing:"Preparing",applied:"Applied",interview:"Interview",offer:"Offer",visa:"Visa process",pr:"PR process",completed:"Completed",rejected:"Rejected",withdrawn:"Withdrawn"};
export type Target={kind:"route"|"job"|"manual";key:string;title:string;location:string;url:string};
export type Task={id:number;label:string;done:boolean};
export type Entry={id:number;target:Target;stage:Stage;createdOn:string;updatedOn:string;deadline:string;notes:string;tasks:Task[];nextTaskId:number;history:{stage:Stage;on:string}[]};
export type Tracker={epoch:number;nextId:number;entries:Entry[]};
export const blankTracker=(epoch=0):Tracker=>({epoch,nextId:1,entries:[]});
type Result<T>={ok:true;value:T}|{ok:false;error:string};
const fail=<T>(error:string):Result<T>=>({ok:false,error});
const ok=<T>(value:T):Result<T>=>({ok:true,value});
const date=(s:unknown):s is string=>typeof s==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&dateValue(s)!==null;
const text=(s:unknown,max:number):s is string=>typeof s==="string"&&s.length<=max&&s===s.trim();
const integer=(s:unknown):s is number=>typeof s==="number"&&Number.isSafeInteger(s)&&s>0&&s<=1_000_000;
const stage=(s:unknown):s is Stage=>typeof s==="string"&&(stages as readonly string[]).includes(s);
const object=(s:unknown):s is Record<string,unknown>=>!!s&&typeof s==="object"&&!Array.isArray(s);
export const routeTarget=(r:RadarRoute):Target=>({kind:"route",key:routeKey(r),title:r.title,location:countryNames[r.country],url:r.source});
export const jobTarget=(j:Job):Target=>({kind:"job",key:j.id.trim(),title:j.title.trim(),location:(j.company+" · "+(j.location||j.countries.join(", "))).slice(0,500).trim(),url:j.url});
const cleanUrl=(url:string)=>{try{const u=new URL(url);u.hash="";return u.href;}catch{return url;}};
function validTarget(t:unknown):t is Target{
 if(!object(t)||!["route","job","manual"].includes(String(t.kind))||!text(t.key,500)||!text(t.title,500)||!t.title||!text(t.location,500)||!text(t.url,2048)||t.url&&!safeJobUrl(t.url))return false;
 if(t.kind==="route"){const r=radarRoutes.find(r=>routeKey(r)===t.key);return !!r&&JSON.stringify(routeTarget(r))===JSON.stringify({kind:t.kind,key:t.key,title:t.title,location:t.location,url:t.url});}
 return t.kind==="job"?!!t.key&&!!t.url:t.key==="";
}
export const sameTarget=(a:Target,b:Target)=>a.kind===b.kind&&(a.kind==="route"?a.key===b.key:a.kind==="job"?a.key===b.key||cleanUrl(a.url)===cleanUrl(b.url):a.title===b.title&&a.location===b.location&&cleanUrl(a.url)===cleanUrl(b.url));
export function addTarget(t:Tracker,target:Target,today:string):Result<Tracker>{
 if(!date(today)||!validTarget(target))return fail("Enter a valid title and optional secure HTTPS source.");
 if(t.entries.some(e=>sameTarget(e.target,target)))return fail("Already shortlisted.");
 if(t.entries.length>=200||!integer(t.nextId))return fail("Tracker limit reached.");
 const entry:Entry={id:t.nextId,target,stage:"shortlisted",createdOn:today,updatedOn:today,deadline:"",notes:"",tasks:[],nextTaskId:1,history:[{stage:"shortlisted",on:today}]};
 return ok({...t,nextId:t.nextId+1,entries:[...t.entries,entry]});
}
export function updateEntry(t:Tracker,id:number,draft:{stage:Stage;deadline:string;notes:string},today:string):Result<Tracker>{
 const e=t.entries.find(e=>e.id===id);
 if(!e||!date(today)||today<e.updatedOn||!stage(draft.stage)||!text(draft.notes.trim(),2000)||typeof draft.deadline!=="string"||draft.deadline&&!date(draft.deadline))return fail("Invalid entry, deadline or notes.");
 if(e.stage!==draft.stage&&e.history.length>=100)return fail("Status history limit reached.");
 const next:Entry={...e,stage:draft.stage,deadline:draft.deadline,notes:draft.notes.trim(),updatedOn:today,history:e.stage===draft.stage?e.history:[...e.history,{stage:draft.stage,on:today}]};
 return ok({...t,entries:t.entries.map(x=>x.id===id?next:x)});
}
export function changeTask(t:Tracker,id:number,action:{kind:"add";label:string}|{kind:"toggle"|"remove";taskId:number},today:string):Result<Tracker>{
 const e=t.entries.find(e=>e.id===id);
 if(!e||!date(today)||today<e.updatedOn)return fail("Entry not available.");
 let tasks=e.tasks,nextTaskId=e.nextTaskId;
 if(action.kind==="add"){
  const label=action.label.trim();
  if(!label||label.length>160||tasks.length>=40||!integer(nextTaskId))return fail("Enter a checklist label up to 160 characters; maximum 40 items.");
  if(tasks.some(x=>x.label.toLowerCase()===label.toLowerCase()))return fail("Checklist item already exists.");
  tasks=[...tasks,{id:nextTaskId++,label,done:false}];
 }else{
  if(!tasks.some(x=>x.id===action.taskId))return fail("Checklist item unavailable.");
  tasks=action.kind==="remove"?tasks.filter(x=>x.id!==action.taskId):tasks.map(x=>x.id===action.taskId?{...x,done:!x.done}:x);
 }
 return ok({...t,entries:t.entries.map(x=>x.id===id?{...x,tasks,nextTaskId,updatedOn:today}:x)});
}
export function removeEntry(t:Tracker,id:number):Tracker{return {...t,entries:t.entries.filter(x=>x.id!==id)};}
export const trackerMaxBytes=2_000_000;
export function serializeTracker(t:Tracker,today:string):string{return JSON.stringify({schemaVersion:1,kind:"mobility-application-tracker",exportedOn:today,nextId:t.nextId,entries:t.entries},null,2);}
export function restoreTracker(raw:string,today:string,epoch=0):Result<Tracker>{
 try{
  if(!date(today)||new TextEncoder().encode(raw).length>trackerMaxBytes)return fail("Invalid or oversized tracker backup.");
  const d:unknown=JSON.parse(raw);
  if(!object(d)||d.schemaVersion!==1||d.kind!=="mobility-application-tracker"||!date(d.exportedOn)||d.exportedOn>today||!integer(d.nextId)||!Array.isArray(d.entries)||d.entries.length>200)return fail("Invalid tracker schema.");
  const entries:Entry[]=[];
  for(const v of d.entries){
   if(!object(v)||!integer(v.id)||v.id>=d.nextId||entries.some(e=>e.id===v.id)||!validTarget(v.target)||entries.some(e=>sameTarget(e.target,v.target as Target))||!stage(v.stage)||!date(v.createdOn)||!date(v.updatedOn)||v.createdOn>v.updatedOn||v.updatedOn>d.exportedOn||!(v.deadline===""||date(v.deadline))||!text(v.notes,2000)||!integer(v.nextTaskId)||!Array.isArray(v.tasks)||v.tasks.length>40||!Array.isArray(v.history)||!v.history.length||v.history.length>100)return fail("Invalid tracker entry.");
   const tasks:Task[]=[];const history:Entry["history"]=[];
   for(const task of v.tasks){if(!object(task)||!integer(task.id)||task.id>=v.nextTaskId||!text(task.label,160)||!task.label||typeof task.done!=="boolean"||tasks.some(x=>x.id===task.id||x.label.toLowerCase()===String(task.label).toLowerCase()))return fail("Invalid checklist.");tasks.push({id:task.id,label:task.label,done:task.done});}
   for(const h of v.history){if(!object(h)||!stage(h.stage)||!date(h.on)||h.on<v.createdOn||h.on>v.updatedOn||(history.length>0&&(history[history.length-1].on>h.on||history[history.length-1].stage===h.stage)))return fail("Invalid status history.");history.push({stage:h.stage,on:h.on});}
   if(history[0].stage!=="shortlisted"||history[0].on!==v.createdOn||history[history.length-1].stage!==v.stage)return fail("Inconsistent status history.");
   const {kind,key,title,location,url}=v.target;
   entries.push({id:v.id,target:{kind,key,title,location,url},stage:v.stage,createdOn:v.createdOn,updatedOn:v.updatedOn,deadline:v.deadline,notes:v.notes,tasks,nextTaskId:v.nextTaskId,history});
  }
  return ok({epoch,nextId:d.nextId,entries});
 }catch{return fail("Could not validate tracker backup.");}
}
export function trackerDueChecks(t:Tracker,today:string):DueCheck[]{
 if(!date(today))return [];
 return t.entries.flatMap(e=>{
  if(!e.deadline||!date(e.deadline)||["completed","rejected","withdrawn"].includes(e.stage))return [];
  const days=(dateValue(e.deadline)!-dateValue(today)!)/86400000;
  if(days>7)return [];
  const state=days<0?"Application deadline overdue":days===0?"Application deadline today":"Application deadline within 7 days";
  return [{key:["tracker",e.id,e.deadline,state].join("|"),route:"tracker:"+e.id,title:e.target.title,source:e.target.url,state,dueOn:e.deadline}];
 });
}
