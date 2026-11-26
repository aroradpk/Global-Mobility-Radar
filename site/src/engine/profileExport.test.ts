import {describe,it,expect} from "vitest";
import {serializeProfile} from "./profileExport";
import {blankJobProfile,confirmAge} from "./unifiedProfile";
import {reviewEvidence} from "./profileEvidence";
import type {Answers} from "../types";
const today="2026-11-26";
const prefs:Answers={citizenships:["IN"],livesIn:"",targets:["CA"],priorities:["visa"],direction:"stay",family:"software",niche:"",learnLanguage:"maybe",hoursPerWeek:8,budget:"low",horizon:12,withFamily:false};
const empty={profile:null,preferences:null,age:null};
describe("private full profile export",()=>{
 it("leaves unavailable sections null, not invented defaults",()=>{const p=JSON.parse(serializeProfile(empty,[],today));expect(p).toMatchObject({schemaVersion:1,kind:"mobility-profile",career:null,preferences:null,age:null,evidence:[]});});
 it("includes reviewed career but excludes parser metadata and unexpected properties",()=>{const profile={...blankJobProfile(),years:8,textLength:500,rawCV:"synthetic private text"};const p=JSON.parse(serializeProfile({...empty,profile},[],today));expect(p.career.years).toBe(8);expect(p.career).not.toHaveProperty("textLength");expect(p.career).not.toHaveProperty("rawCV");});
 it("includes saved planning preferences without inventing residence",()=>{const p=JSON.parse(serializeProfile({...empty,preferences:prefs},[],today));expect(p.preferences).toMatchObject({citizenships:["IN"],livesIn:null,targets:["CA"],withFamily:false});});
 it("uses current age only on confirmation date",()=>{const age=confirmAge("32",today);expect(JSON.parse(serializeProfile({...empty,age},[],today)).age.currentValue).toBe("32");expect(JSON.parse(serializeProfile({...empty,age},[],"2026-11-27")).age.currentValue).toBeNull();});
 it("retains expiry state of reviewed evidence and strips unexpected fields",()=>{const r=reviewEvidence("language",{test:"IELTS",expiry:"2026-11-25"},today,1).record!;const p=JSON.parse(serializeProfile(empty,[{...r,values:{...r.values,privateToken:"synthetic"}}],today));expect(p.evidence[0]).toMatchObject({status:"expired",values:{test:"IELTS",expiry:"2026-11-25"}});expect(p.evidence[0].values).not.toHaveProperty("privateToken");});
 it("does not mutate supplied records or preferences",()=>{const before=JSON.stringify(prefs);serializeProfile({...empty,preferences:prefs},[],today);expect(JSON.stringify(prefs)).toBe(before);});
});
