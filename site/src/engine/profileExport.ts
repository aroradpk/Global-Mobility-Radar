import type {Answers,Profile} from "../types";
import {currentAge,type ConfirmedAge} from "./unifiedProfile";
import {evidenceFields,evidenceState,type EvidenceRecord} from "./profileEvidence";

export type ProfileExportContext = {profile:Profile|null;preferences:Answers|null;age:ConfirmedAge|null};
// Deliberate allowlist: never include raw CV, parser metadata, unsaved drafts,
// imported vacancies or independent immigration scenarios.
export function serializeProfile(context:ProfileExportContext,records:readonly EvidenceRecord[],today:string):string{
 const {profile,preferences,age}=context;
 const career=profile?{
  skills:profile.skills,years:profile.years,level:profile.level,degree:profile.degree,
  certs:profile.certs,languages:profile.languages.map(({code,level})=>({code,level})),
  families:profile.families,titles:profile.titles,
 }:null;
 const planning=preferences?{
  citizenships:preferences.citizenships,livesIn:preferences.livesIn||null,targets:preferences.targets,
  priorities:preferences.priorities,direction:preferences.direction,family:preferences.family,
  niche:preferences.niche||null,learnLanguage:preferences.learnLanguage,hoursPerWeek:preferences.hoursPerWeek,
  budget:preferences.budget,horizon:preferences.horizon,withFamily:preferences.withFamily,
 }:null;
 return JSON.stringify({
  schemaVersion:1,kind:"mobility-profile",exportedOn:today,
  verification:"Self-reported career and immigration evidence; relocation preferences are planning assumptions, not legal evidence.",
  career,preferences:planning,
  age:age?{lastConfirmedValue:age.value,confirmedOn:age.confirmedOn,currentValue:currentAge(age,today)||null}:null,
  evidence:records.map(record=>({id:record.id,kind:record.kind,confirmedOn:record.confirmedOn,status:evidenceState(record,today),
   values:Object.fromEntries(evidenceFields[record.kind].filter(f=>Object.prototype.hasOwnProperty.call(record.values,f.key)).map(f=>[f.key,record.values[f.key]]))})),
 },null,2);
}
