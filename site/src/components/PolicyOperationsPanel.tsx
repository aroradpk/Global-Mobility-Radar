import {useState,type Dispatch,type SetStateAction} from "react";
import {countryNames} from "../engine/routeRadar";
import {policySources,type PolicyLedger} from "../engine/policyReview";
import {ruleVersions,duePolicyChecks,reconcileNotices,acknowledgeNotice,savePolicyCheckpoint,loadPolicyCheckpoint,clearPolicyCheckpoint,type LocalNotice,type DueCheck} from "../engine/policyOperations";
export default function PolicyOperationsPanel({ledger,setLedger,today,history,setHistory,onReview,applicationChecks,onTracker}:{ledger:PolicyLedger;setLedger:Dispatch<SetStateAction<PolicyLedger>>;today:string;history:LocalNotice[];setHistory:Dispatch<SetStateAction<LocalNotice[]>>;onReview:()=>void;applicationChecks:DueCheck[];onTracker:()=>void}){
 const [message,setMessage]=useState(""),[busy,setBusy]=useState(false),[filter,setFilter]=useState("unread"),[country,setCountry]=useState("");
 const checks=[...duePolicyChecks(ledger,today),...applicationChecks];
 const list=history.filter(n=>filter==="all"||filter==="active"&&!n.resolvedOn||filter==="unread"&&!n.resolvedOn&&!n.readOn);
 const save=()=>{if(!window.confirm("Save only public policy observations and review history in this browser? The checkpoint survives reloads. Do not include personal information. Existing checkpoint will be replaced."))return;try{const r=savePolicyCheckpoint(window.localStorage,ledger,today);setMessage(r.ok?"Policy checkpoint saved locally.":r.error);}catch{setMessage("Browser storage is unavailable.");}};
 const load=async()=>{if(ledger.observations.length||ledger.reviews.length){setMessage("Restore requires an empty policy history. Export first and reload.");return;}if(!window.confirm("Restore the saved policy history? Prior approvals require fresh review."))return;setBusy(true);const epoch=ledger.epoch;try{const r=await loadPolicyCheckpoint(window.localStorage,today,epoch);if(r.ok){setLedger(prev=>prev.epoch===epoch&&!prev.observations.length&&!prev.reviews.length?r.value:prev);setMessage("Policy checkpoint restored; fresh approval required.");}else setMessage(r.error);}catch{setMessage("Browser storage unavailable.");}finally{setBusy(false);}};
 const remove=()=>{if(!window.confirm("Delete saved policy checkpoint? In-memory history is retained until reset."))return;try{setMessage(clearPolicyCheckpoint(window.localStorage)?"Saved policy checkpoint deleted.":"Could not delete checkpoint; clear browser site data.");}catch{setMessage("Could not delete checkpoint; clear browser site data.");}};
 return <section className="card stack" aria-labelledby="ops-title">
 <h2 id="ops-title">Policy operations and notifications</h2>
 <p>Local in-app monitoring while this app is open. No background network collection, external notification or schedule is enabled. A daily UTC check and observation changes refresh the inbox.</p>
 <h3>Policy-only local checkpoint</h3><p>Optional explicit save. No CV, profile, job data or personal scenario is stored. Reload starts an empty session; restore is manual and revalidates the audit.</p>
 <div className="row"><button type="button" className="btn" disabled={busy||!ledger.observations.length} onClick={save}>Save policy checkpoint</button><button type="button" className="btn" disabled={busy||!!ledger.observations.length} onClick={()=>void load()}>Restore saved policy checkpoint</button><button type="button" className="btn ghost" disabled={busy} onClick={remove}>Delete saved policy checkpoint</button></div>
 <p role="status">{message}</p>
 <h3>Source health and review checks</h3><p>{policySources.length} registered references · {checks.length} checks need attention · automated collection disabled.</p>
 <button type="button" className="btn" onClick={()=>{setHistory(old=>reconcileNotices(old,checks,today));setMessage("Local review check completed for "+today+". No network request made.");}}>Run local review check</button>
 <button type="button" className="btn" onClick={onReview}>Open policy review workspace</button>
 <button type="button" className="btn" onClick={onTracker}>Open application tracker</button>
 <h3>Notification history</h3>
 <label>Notification filter<select aria-label="Notification filter" value={filter} onChange={e=>setFilter(e.target.value)}><option value="unread">Unread</option><option value="active">All active</option><option value="all">All history</option></select></label>
 {list.length===0&&<p>No notifications in this view.</p>}
 {list.map((n,i)=><article key={n.key+"-"+i} className="card stack"><h4>{n.title}</h4><p>{n.state} · first seen {n.firstSeen}</p><p>{n.resolvedOn?"Resolved "+n.resolvedOn:n.readOn?"Read "+n.readOn:"Unread"}</p>{!n.readOn&&!n.resolvedOn&&<button type="button" className="btn small" onClick={()=>setHistory(old=>acknowledgeNotice(old,n.key,today))}>Mark {n.title} read</button>}</article>)}
 <h3>Compiled rule version inventory</h3>
 <label>Rule country filter<select aria-label="Rule country filter" value={country} onChange={e=>setCountry(e.target.value)}><option value="">All countries</option>{Object.entries(countryNames).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label>
 {ruleVersions.filter(r=>!country||r.country===country).map(r=><p key={r.route}><strong>{countryNames[r.country]} — {policySources.find(s=>s.key===r.route)?.route}</strong> · {r.version} · review by {r.reviewBy} · <a href={r.source} target="_blank" rel="noopener noreferrer">Official reference</a></p>)}
 <p className="small muted">Policy approval cannot activate arbitrary rule changes. A maintainer-reviewed code release is required. Notification history is session-only.</p>
 </section>;
}
