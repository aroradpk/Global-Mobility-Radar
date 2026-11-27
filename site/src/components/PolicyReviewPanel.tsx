import {useState,type Dispatch,type SetStateAction} from "react";
import {blankPolicyDraft,policySources,preparePolicySnapshot,addPolicyObservation,recordPolicyFailure,reviewPolicy,policyView,policyDiff,policyStateLabels,policyAlerts,serializePolicy,policyFields,restorePolicyAudit,policyAuditMaxBytes,type PolicyLedger,type PolicyDraft,type PolicyField,type Review} from "../engine/policyReview";
import {countryNames} from "../engine/routeRadar";
const choices:Partial<Record<PolicyField,readonly (readonly [string,string])[]>>={
 phase:[["unknown","Unknown"],["proposed","Proposed"],["enacted","Enacted, not yet in force"],["in_force","In force"],["withdrawn","Withdrawn"]],
 availability:[["unknown","Unknown"],["open","Open (check scope)"],["closed","Closed"],["paused","Paused"]]
};
export default function PolicyReviewPanel({today,ledger,setLedger}:{today:string;ledger:PolicyLedger;setLedger:Dispatch<SetStateAction<PolicyLedger>>}){
 const [draft,setDraft]=useState<PolicyDraft>(()=>blankPolicyDraft(policySources[0].key,today));
 const [failure,setFailure]=useState("");
 const [busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const [reviewConfirm,setReviewConfirm]=useState(false);
 const source=policySources.find(s=>s.key===draft.route)!;
 const current=policyView(ledger,draft.route,today);
 const history=ledger.observations.filter(o=>o.route===draft.route).slice().reverse();
 const reviews=ledger.reviews.filter(r=>r.route===draft.route).slice().reverse();
 const alerts=policyAlerts(ledger,today);
 const change=(key:keyof PolicyDraft,value:string|boolean)=>{setDraft(d=>({...d,[key]:value,...(key==="confirmed"?{}:{confirmed:false})}));setMessage("");};
 const apply=(r:ReturnType<typeof addPolicyObservation>,okMessage:string)=>{if(r.ok){setLedger(r.value);setReviewConfirm(false);setMessage(okMessage);}else setMessage(r.error);};
 const save=async()=>{
  setBusy(true);setMessage("");
  const epoch=ledger.epoch;
  const prepared=await preparePolicySnapshot(draft,today);
  if(!prepared.ok){setMessage(prepared.error);setBusy(false);return;}
  // A delayed digest must never restore observations after global reset.
  setLedger(prev=>{if(prev.epoch!==epoch)return prev;const r=addPolicyObservation(prev,prepared.value,today);return r.ok?r.value:prev;});
  const preview=addPolicyObservation(ledger,prepared.value,today);
  setMessage(preview.ok?"Snapshot staged for review.":preview.error);setReviewConfirm(false);setBusy(false);
  if(preview.ok)setDraft(d=>({...d,confirmed:false}));
 };
 const decision=(id:number,action:Review["action"])=>{
  if(!reviewConfirm){setMessage("Confirm the review decision first.");return;}
  apply(reviewPolicy(ledger,draft.route,id,action,today),"Review decision recorded.");
 };
 const restoreAudit=async(file:File|undefined)=>{
  if(!file)return;
  if(ledger.observations.length||ledger.reviews.length){setMessage("Restore requires an empty policy history. Export first and clear local data explicitly.");return;}
  if(file.size>policyAuditMaxBytes){setMessage("Policy audit exceeds the 2 MB limit.");return;}
  if(!window.confirm("Restore this policy audit in memory? Historical approvals require a fresh review before reference information becomes visible."))return;
  setBusy(true);setMessage("");const epoch=ledger.epoch;
  try{const r=await restorePolicyAudit(await file.text(),today,epoch);if(r.ok){setLedger(prev=>prev.epoch===epoch&&!prev.observations.length&&!prev.reviews.length?r.value:prev);setReviewConfirm(false);setMessage("Policy history restored; previous approvals require fresh review.");}else setMessage(r.error);}catch{setMessage("Could not read policy audit.");}finally{setBusy(false);}
 };
 const exportAudit=()=>{
  const url=URL.createObjectURL(new Blob([serializePolicy(ledger,today)],{type:"application/json"}));
  const a=document.createElement("a");a.href=url;a.download="mobility-policy-audit.json";document.body.appendChild(a);
  try{a.click();}finally{a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
 };
 return <section className="card stack" aria-labelledby="policy-title">
 <h2 id="policy-title">Policy review and source health</h2>
 <p>Manual, local review only. No automatic source access is approved. Record public official evidence, not applicant details. Approval updates reference information in the route radar; affected compiled calculators are held for maintainer reconciliation.</p>
 <h3>Review inbox ({alerts.length})</h3>
 {alerts.length===0?<p>No outstanding observed policy changes. Unchecked sources are not confirmed current.</p>:alerts.map(a=><p key={a.source.key}><button type="button" className="btn small" disabled={busy} onClick={()=>{if(draft.confirmed||draft.excerpt){if(!window.confirm("Discard unsaved policy draft?"))return;}setDraft(blankPolicyDraft(a.source.key,today));setReviewConfirm(false);setMessage("");}}>{countryNames[a.source.country]} — {a.source.route}</button> {policyStateLabels[a.state]}</p>)}
 <h3>Official reference registry</h3>
 <p>{policySources.length} route references · automatic access disabled · terms permission not approved.</p>
 <label>Policy route<select aria-label="Policy route" value={draft.route} disabled={busy} onChange={e=>{if(draft.confirmed||draft.excerpt){if(!window.confirm("Discard unsaved policy draft?"))return;}setDraft(blankPolicyDraft(e.target.value,today));setReviewConfirm(false);setFailure("");setMessage("");}}>{policySources.map(s=><option key={s.key} value={s.key}>{countryNames[s.country]} — {s.route}</option>)}</select></label>
 <p><a href={source.url} target="_blank" rel="noopener noreferrer">Open registered official source</a> · bundled reference reviewed {source.referenceReviewed}</p>
 <p role="status">Source status: {policyStateLabels[current.state]}. Last observation: {current.latest?.observedOn??"Unknown"}.</p>
 <details open><summary>Capture policy observation</summary>
 <form className="stack" onSubmit={e=>{e.preventDefault();void save();}}>
 <label>Observed on<input aria-label="Observed on" type="date" max={today} disabled={busy} value={draft.observedOn} onChange={e=>change("observedOn",e.target.value)}/></label>
 {policyFields.map(([key,label])=><label key={key}>{label}{choices[key]?<select aria-label={label} disabled={busy} value={draft[key]} onChange={e=>change(key,e.target.value)}>{choices[key]!.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>:key==="excerpt"||key==="requirements"||key==="documents"?<textarea aria-label={label} disabled={busy} maxLength={key==="excerpt"?500:300} rows={3} value={draft[key]} onChange={e=>change(key,e.target.value)}/>:<input aria-label={label} disabled={busy} type={key==="effectiveOn"?"date":"text"} maxLength={300} value={draft[key]} onChange={e=>change(key,e.target.value)}/>}</label>)}
 <label><input type="checkbox" disabled={busy} checked={draft.confirmed} onChange={e=>change("confirmed",e.target.checked)}/> I checked this official source and recorded its applicable scope accurately.</label>
 <button type="submit" className="btn primary" disabled={busy}>{busy?"Hashing snapshot…":"Stage policy snapshot"}</button>
 </form></details>
 <details><summary>Record a source failure</summary><div className="stack"><label>Failure reason<input aria-label="Failure reason" maxLength={300} value={failure} disabled={busy} onChange={e=>setFailure(e.target.value)}/></label><button type="button" className="btn" disabled={busy} onClick={()=>{apply(recordPolicyFailure(ledger,draft.route,draft.observedOn,failure,today),"Source failure recorded. Previous reference withheld.");setFailure("");}}>Record source check failure</button></div></details>
 <p role="status">{message}</p>
 <h3>Version history ({history.length})</h3>
 {history.length===0&&<p>No observations recorded for this route.</p>}
 {history.length>0&&<label><input type="checkbox" disabled={busy} checked={reviewConfirm} onChange={e=>setReviewConfirm(e.target.checked)}/> I reviewed the source and understand this decision changes reference information, not eligibility rules.</label>}
 {history.map(o=><article className="card stack" key={o.id}><h4>Observation {o.id} — {o.observedOn}</h4>{o.kind==="failure"?<p>Source failure: {o.reason}</p>:<><p>{o.facts.phase} · effective {o.facts.effectiveOn||"unknown"}</p><p style={{overflowWrap:"anywhere"}} className="small muted">SHA-256: {o.sha256}</p><details><summary>Field changes and evidence</summary>{policyDiff(ledger,o).length===0?<p>No content changes compared with previous snapshot.</p>:<dl>{policyDiff(ledger,o).map(d=><div key={d.key}><dt>{d.label}</dt><dd style={{overflowWrap:"anywhere"}}>Previous: {d.before||"Unknown"}; observed: {d.after||"Unknown"}</dd></div>)}</dl>}</details><div className="row">{current.latest?.id===o.id&&<><button type="button" className="btn" disabled={busy||!reviewConfirm} onClick={()=>decision(o.id,"approve")}>Approve observation {o.id}</button><button type="button" className="btn" disabled={busy||!reviewConfirm} onClick={()=>decision(o.id,"reject")}>Reject observation {o.id}</button></>}{reviews.some(r=>r.target===o.id&&r.action==="approve")&&current.latest?.id!==o.id&&<button type="button" className="btn" disabled={busy||!reviewConfirm} onClick={()=>decision(o.id,"rollback")}>Rollback to observation {o.id}</button>}</div></>}</article>)}
 <h3>Review audit ({reviews.length})</h3>
 {reviews.map(r=><p key={r.id}>{r.reviewedOn} · {r.action} · observation {r.target}</p>)}
 <button type="button" className="btn" disabled={!ledger.observations.length||busy} onClick={exportAudit}>Export policy audit (JSON)</button>
 <label>Restore policy audit (JSON)<input aria-label="Restore policy audit (JSON)" type="file" accept=".json,application/json" disabled={busy||ledger.observations.length>0||ledger.reviews.length>0} onChange={e=>{const file=e.target.files?.[0];e.target.value="";void restoreAudit(file);}}/></label>
 <p className="small muted">History is session-only unless you explicitly save a policy checkpoint in Policy operations. Export before reloading; restore requires an empty history and fresh approval. Rollback never asserts that a prior policy is currently in force. In-app review inbox is not scheduled monitoring or external notification.</p>
 </section>;
}
