import {useState} from "react";
import ProfileEvidencePanel from "./ProfileEvidencePanel";
import type {Profile,Answers} from "../types";
import {skillLabel,TRACK} from "../data";
import {confirmAge,currentAge,type ConfirmedAge} from "../engine/unifiedProfile";

export default function ProfilePanel({profile,answers,age,today,onAge,onCareer,onPreferences}:{profile:Profile|null;answers:Answers|null;age:ConfirmedAge|null;today:string;onAge:(age:ConfirmedAge|null)=>void;onCareer:()=>void;onPreferences:()=>void}){
 const [draft,setDraft]=useState(age?.value??"");
 const [error,setError]=useState("");
 const active=currentAge(age,today);
 return <section className="card stack" aria-labelledby="profile-title">
  <h1 id="profile-title">Your shared profile</h1>
  <p>Maintain your job-matching facts here and explicitly link confirmed facts into current-date country scenarios. No personal information is transmitted; reviewed evidence can be explicitly exported to a local file. No immigration decision is inferred from a CV.</p>
  <div className="card stack">
    <h2>Current age for immigration assessments</h2>
    <label>Current age in completed years<input type="number" min={18} max={120} step={1} value={draft} onChange={e=>{setDraft(e.target.value);setError("");}}/></label>
    <div className="row"><button type="button" className="btn primary" onClick={()=>{const next=confirmAge(draft,today);if(!next){setError("Enter a whole age from 18 to 120.");return;}onAge(next);setError("");}}>Confirm age for today</button><button type="button" className="btn ghost" onClick={()=>{onAge(null);setDraft("");setError("");}}>Remove confirmed age</button></div>
    {error&&<p role="alert" className="error">{error}</p>}
    <p role="status">{active?"Confirmed profile age: "+active+" (as of "+today+").":age?"Previously confirmed age has expired. Confirm again for today.":"No confirmed age. Country assessments remain independent."}</p>
    <p className="small muted">Age is date-specific; we do not store a date of birth or guess birthdays. A linked scenario follows confirmed updates, and becomes unknown on expiry/removal. Unlink to enter a hypothetical age.</p>
  </div>
  <div className="card stack">
   <h2>Career and qualifications</h2>
   {profile?<><p>Reviewed job-matching facts (self-reported, not independently verified).</p><dl><dt>Professional experience</dt><dd>{profile.years} years</dd><dt>Career level</dt><dd>{profile.level}</dd><dt>Education</dt><dd>{profile.degree==="none"?"No recorded qualification":profile.degree}</dd><dt>Skills</dt><dd>{profile.skills.map(skillLabel).join(", ")||"None recorded"}</dd><dt>Languages</dt><dd>{profile.languages.map(x=>x.code+" — "+x.level).join(", ")||"None recorded"}</dd><dt>Recorded job titles</dt><dd>{profile.titles.join(", ")||"None recorded"}</dd><dt>Certifications</dt><dd>{profile.certs.join(", ")||"None recorded"}</dd></dl></>:<p>No reviewed career profile yet. Start manually or import a CV in Jobs.</p>}
   <button type="button" className="btn" onClick={onCareer}>{profile?"Edit career profile":"Start manual career profile"}</button>
   <p className="small muted">General qualifications and total career years do not establish recognised degrees, occupation codes, qualifying work periods or approved language-test results.</p>
  </div>
  <div className="card stack">
   <h2>Relocation preferences</h2>
   {answers?<dl><dt>Citizenship(s)</dt><dd>{answers.citizenships.join(", ")||"Unknown"}</dd><dt>Current residence</dt><dd>{answers.livesIn||"Unknown"}</dd><dt>Target destinations</dt><dd>{answers.targets.join(", ")||"No explicit selection"}</dd><dt>Target career</dt><dd>{TRACK.get(answers.family)?.name.en??answers.family}</dd><dt>Budget preference</dt><dd>{answers.budget}</dd><dt>Moving with family</dt><dd>{answers.withFamily?"Yes":"No (planning preference)"}</dd></dl>:<p>Complete the relocation preferences after reviewing your career profile.</p>}
   <button type="button" className="btn" disabled={!profile} onClick={onPreferences}>Edit relocation preferences</button>
   <p className="small muted">Preferences are not work authorisation, immigration chargeability, spouse eligibility or proof of funds. Those remain separate evidence.</p>
  </div>
  <ProfileEvidencePanel today={today}/>
 </section>;
}
