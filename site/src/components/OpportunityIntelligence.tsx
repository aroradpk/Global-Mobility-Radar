import {useEffect,useMemo,useState} from "react";
import type {Answers,Profile} from "../types";
import type {LocalJobs} from "../localJobs";
import type {EvidenceRecord} from "../engine/profileEvidence";
import type {PolicyLedger} from "../engine/policyReview";
import {assessJobOpportunities,assessProfileRoutes,updateOpportunityNotices,type OpportunityNotice} from "../engine/opportunityIntelligence";
import {countryNames,type RadarCountry} from "../engine/routeRadar";
import {jobTarget,routeTarget,type Target} from "../engine/applicationTracker";
export default function OpportunityIntelligence({profile,answers,age,evidence,policy,today,snapshot,onOpen,onShortlist,isShortlisted}:{profile:Profile;answers:Answers;age:string;evidence:EvidenceRecord[];policy:PolicyLedger;today:string;snapshot:LocalJobs|null;onOpen:(country:RadarCountry)=>void;onShortlist:(t:Target)=>void;isShortlisted:(t:Target)=>boolean}){
 const [filter,setFilter]=useState("all");
 const direct=useMemo(()=>assessProfileRoutes(answers,age,evidence,policy,today),[answers,age,evidence,policy,today]);
 const [now,setNow]=useState(()=>Date.now());
 const [notices,setNotices]=useState<OpportunityNotice[]>([]);
 useEffect(()=>{const id=window.setInterval(()=>setNow(Date.now()),60000);return()=>window.clearInterval(id);},[]);
 const jobs=useMemo(()=>assessJobOpportunities(snapshot,profile,answers,policy,today,now),[snapshot,profile,answers,policy,today,now]);
 useEffect(()=>{setNotices(old=>snapshot?updateOpportunityNotices(old,jobs,today):[]);},[jobs,snapshot,today]);
 const visible=jobs.filter(j=>filter==="all"||j.status===filter);
 return <section className="card stack" aria-labelledby="intelligence-title">
 <h2 id="intelligence-title">Your opportunity intelligence</h2>
 <p>Prioritise evidence review, not predicted visa approval or hiring odds. Uses saved planning preferences and reviewed profile evidence. Missing or ambiguous evidence is not assumed. Imported vacancies are unverified leads.</p>
 <h3>Migration pathways without a new employer offer</h3>
 {direct.length===0&&<p>No supported no-offer pathways in the selected destinations. Browse the full route radar.</p>}
 {direct.map(({key,route,status,missing,failed})=><article key={key} className="card stack"><h4>{countryNames[route.country]} — {route.title}</h4><p><strong>{status}</strong> · {route.kind}</p><p>{route.summary}</p>{failed.length>0&&<p>Known gaps: {failed.join("; ")}</p>}<details><summary>Evidence gaps and next actions ({missing.length})</summary>{missing.map(m=><p key={m}>{m}</p>)}</details><a href={route.source} target="_blank" rel="noopener noreferrer">Official route requirements</a><button type="button" className="btn" onClick={()=>onOpen(route.country)}>Complete {countryNames[route.country]} assessment</button><button type="button" className="btn" disabled={isShortlisted(routeTarget(route))} onClick={()=>onShortlist(routeTarget(route))}>Save pathway to tracker</button></article>)}
 <h3>Personalised opportunity review alerts</h3>
 <p>{notices.filter(n=>n.active&&!n.read).length} unread review leads. Local alerts from imported evidence only; not scheduled delivery or verified qualified vacancies.</p>
 {notices.filter(n=>n.active).map(n=><p key={n.key}><a href={n.url} target="_blank" rel="noopener noreferrer">{n.title} — {n.company}</a> · {n.read?"Read":"Review needed"}{!n.read&&<button type="button" className="btn small" onClick={()=>setNotices(old=>old.map(x=>x.key===n.key?{...x,read:true}:x))}>Mark opportunity read</button>}</p>)}
 <h3>Employer opportunity review queue</h3>
 <p>{jobs.filter(j=>j.status==="review_priority").length} leads with fresh imported explicit sponsorship wording; {jobs.length} profile-matched leads. No independent vacancy verification or scheduled collection.</p>
 {!snapshot&&<p>No vacancy snapshot loaded. Import authorised job data below. Automated source coverage is not yet established.</p>}
 <label>Opportunity evidence filter<select aria-label="Opportunity evidence filter" value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">All matched leads</option><option value="review_priority">Explicit wording — review first</option><option value="evidence_needed">Evidence needed</option><option value="stale_or_unknown">Stale or unknown</option><option value="salary_review">Salary review</option><option value="language_review">Language review</option><option value="excluded">Excluded / restrictions</option></select></label>
 {snapshot&&!visible.length&&<p>No leads in this evidence category.</p>}
 {visible.slice(0,20).map(j=><article key={j.job.id} className="card stack"><h4>{j.job.title} · {j.job.company}</h4><p>{j.job.location} · {j.status.replace(/_/g," ")}</p><p>Career evidence: {j.match.matchedSkills.length} matching skills; {j.match.missingSkills.length} unconfirmed skills. Seniority gap: {j.match.seniorityGap}.</p><p>Sponsorship: {j.sponsor.state.replace(/_/g," ")} — {j.sponsor.reason} (imported, not independently verified)</p><p>Salary: {j.job.salary||"Unknown"}</p>{j.routes.map(r=><p key={r.route.id}><a href={r.route.source} target="_blank" rel="noopener noreferrer">{r.route.title}</a> — {r.hold||"Potential route to investigate, not assessed eligibility"}</p>)}{j.salaries.map(s=><p key={s.rule.id}>{s.rule.label}: {s.status.replace(/_/g," ")} — indicative advertisement only.</p>)}<p><strong>Next action:</strong> {j.action}</p><a href={j.job.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Review original vacancy</a><button type="button" className="btn" disabled={isShortlisted(jobTarget(j.job))} onClick={()=>onShortlist(jobTarget(j.job))}>Save lead to tracker</button></article>)}
 <h3>Internal mobility</h3><p>Review authorised employee vacancies with your current employer. No employer transfer, sponsorship, vacancy or eligibility is inferred. For US intracompany transfer, use the L-1 assessment.</p><button type="button" className="btn" onClick={()=>onOpen("us")}>Review US transfer pathways</button>
 </section>;
}
