// Only executed on an explicitly generated ephemeral evaluation sample.
import { readFileSync } from "node:fs";
import { describe, it, expect } from "vitest";
import { parseLocalJobs } from "../localJobs";
import { assessJobOpportunities } from "./opportunityIntelligence";
import { blankPolicyLedger } from "./policyReview";

describe("CC0 feasibility integration (aggregate only)",()=>{
 it.skipIf(process.env.GMR_LIVE_FEASIBILITY!=="1")("runs existing matching against an actual ephemeral source snapshot",()=>{
  const sample=parseLocalJobs(readFileSync(new URL("../../../pipeline/data/feasibility-evaluation.json",import.meta.url),"utf8"));
  const now=Date.now(),today=new Date(now).toISOString().slice(0,10);
  const base={years:8,level:"senior",degree:"bachelor",certs:[],languages:[{code:"en",level:"fluent"}],families:["software"],titles:[],textLength:0};
  const answers={citizenships:["IN"],livesIn:"IN",targets:["SE"],priorities:["visa"],direction:"stay",family:"software",niche:"",learnLanguage:"maybe",hoursPerWeek:5,budget:"medium",horizon:12,withFamily:false};
  const profiles=[{id:"js_fullstack",skills:["javascript","typescript","react","nodejs"]},{id:"java_backend",skills:["java","spring","sql","postgresql"]},{id:"python_backend",skills:["python","sql","docker","kubernetes"]}];
  expect(sample.jobs.every(j=>j.visa==="unknown"&&j.countries.length===1&&j.countries[0]==="SE")).toBe(true);
  const output=profiles.map(p=>{
   const leads=assessJobOpportunities(sample,{...base,skills:p.skills},answers,blankPolicyLedger(),today,now);
   const result={profile:p.id,matchedFamilyAndDestination:leads.length,skillOverlap:leads.filter(l=>l.match.matchedSkills.length>0).length,languageReview:leads.filter(l=>l.match.languageBlock.length>0).length,reviewPriority:leads.filter(l=>l.status==="review_priority").length};
   expect(result.reviewPriority).toBe(0);
   return result;
  });
  console.log("FEASIBILITY_MATCHING "+JSON.stringify(output));
 });
});
