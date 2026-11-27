import {useEffect,useRef,useState,type Dispatch,type SetStateAction} from "react";
import {addTarget,updateEntry,changeTask,removeEntry,stages,stageLabels,trackerDueChecks,type Tracker,type Entry,type Stage,type Target} from "../engine/applicationTracker";
import {encryptTracker,decryptTracker,storeTrackerVault,readTrackerVault,clearTrackerVault} from "../engine/trackerVault";
type Props={tracker:Tracker;setTracker:Dispatch<SetStateAction<Tracker>>;today:string;onRadar:()=>void;onJobs:()=>void};
function EntryEditor({entry,today,tracker,apply}:{entry:Entry;today:string;tracker:Tracker;apply:(r:{ok:true;value:Tracker}|{ok:false;error:string})=>void}){
 const [draft,setDraft]=useState({stage:entry.stage,deadline:entry.deadline,notes:entry.notes});
 const [task,setTask]=useState("");
 const dirty=draft.stage!==entry.stage||draft.deadline!==entry.deadline||draft.notes!==entry.notes;
 return <article className="card stack" aria-label={"Application "+entry.id}>
 <h3>{entry.target.title}</h3><p style={{overflowWrap:"anywhere"}}>{entry.target.location||"Location unknown"} · {entry.target.kind==="job"?"Unverified job lead":entry.target.kind==="route"?"Official route reference":"Manual opportunity"}</p>
 {entry.target.url&&<a href={entry.target.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Open source (verify before applying)</a>}
 <p>Saved status: {stageLabels[entry.stage]} · Added {entry.createdOn}</p>
 <label>Status<select aria-label="Application status" value={draft.stage} onChange={e=>setDraft(d=>({...d,stage:e.target.value as Stage}))}>{stages.map(s=><option key={s} value={s}>{stageLabels[s]}</option>)}</select></label>
 <label>Deadline (UTC date)<input aria-label="Application deadline" type="date" value={draft.deadline} onChange={e=>setDraft(d=>({...d,deadline:e.target.value}))}/></label>
 <label>Notes<textarea aria-label="Application notes" rows={3} maxLength={2000} value={draft.notes} onChange={e=>setDraft(d=>({...d,notes:e.target.value}))}/></label>
 <button type="button" className="btn primary" disabled={!dirty} onClick={()=>{apply(updateEntry(tracker,entry.id,draft,today));}}>Save application changes</button>
 {dirty&&<p className="small muted">Unsaved changes are not included in reminders or backups.</p>}
 <h4>Document / action checklist ({entry.tasks.filter(x=>x.done).length}/{entry.tasks.length})</h4><p className="small muted">Your own checklist, not an official list of required documents. Do not upload documents or enter passport numbers.</p>
 {entry.tasks.map(x=><div className="row" key={x.id}><label><input type="checkbox" checked={x.done} onChange={()=>apply(changeTask(tracker,entry.id,{kind:"toggle",taskId:x.id},today))}/>{x.label}</label><button type="button" className="btn small" aria-label={"Remove checklist item "+x.label} onClick={()=>apply(changeTask(tracker,entry.id,{kind:"remove",taskId:x.id},today))}>Remove</button></div>)}
 <label>Checklist item<input aria-label="Checklist item" maxLength={160} value={task} onChange={e=>setTask(e.target.value)}/></label><button type="button" className="btn" onClick={()=>{const r=changeTask(tracker,entry.id,{kind:"add",label:task},today);apply(r);if(r.ok)setTask("");}}>Add checklist item</button>
 <details><summary>Status history</summary>{entry.history.map((h,i)=><p key={i}>{h.on} · {stageLabels[h.stage]}</p>)}</details>
 <button type="button" className="btn ghost" onClick={()=>{if(window.confirm("Remove this application and its history?"))apply({ok:true,value:removeEntry(tracker,entry.id)});}}>Remove application</button>
 </article>;
}
export default function ApplicationTracker({tracker,setTracker,today,onRadar,onJobs}:Props){
 const [message,setMessage]=useState(""),[query,setQuery]=useState(""),[filter,setFilter]=useState(""),[manual,setManual]=useState({title:"",location:"",url:""});
 const [pass,setPass]=useState(""),[busy,setBusy]=useState(false);
 const alive=useRef(true);useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const apply=(r:{ok:true;value:Tracker}|{ok:false;error:string})=>{if(r.ok){setTracker(r.value);setMessage("Tracker updated.");}else setMessage(r.error);};
 const addManual=()=>{const t:Target={kind:"manual",key:"",title:manual.title.trim(),location:manual.location.trim(),url:manual.url.trim()};const r=addTarget(tracker,t,today);apply(r);if(r.ok)setManual({title:"",location:"",url:""});};
 const encrypt=async(mode:"save"|"export")=>{
  if(!window.confirm(mode==="save"?"Save encrypted tracker on this browser? Existing encrypted checkpoint will be replaced. Keep your passphrase; it cannot be recovered.":"Export encrypted tracker backup? Keep the file and passphrase private."))return;
  setBusy(true);const secret=pass;setPass("");const result=await encryptTracker(tracker,today,secret);if(!alive.current)return;
  if(!result.ok)setMessage(result.error);
  else if(mode==="save"){try{setMessage(storeTrackerVault(window.localStorage,result.value)?"Encrypted tracker checkpoint saved.":"Could not save browser checkpoint.");}catch{setMessage("Browser storage unavailable.");}}
  else{const url=URL.createObjectURL(new Blob([result.value],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="mobility-tracker.encrypted.json";document.body.appendChild(a);try{a.click();setMessage("Encrypted backup exported.");}finally{a.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}}
  setBusy(false);
 };
 const unlock=async(file?:File)=>{
  if(tracker.entries.length){setMessage("Restore requires an empty tracker. Export first and reload.");return;}
  if(file&&file.size>3000000){setMessage("Encrypted backup too large.");return;}
  if(!window.confirm("Restore encrypted tracker into this session?"))return;
  const epoch=tracker.epoch,secret=pass;setPass("");setBusy(true);
  try{const raw=file?await file.text():readTrackerVault(window.localStorage);if(!raw){if(alive.current)setMessage("No encrypted checkpoint found.");return;}const r=await decryptTracker(raw,today,secret,epoch);if(!alive.current)return;if(r.ok){setTracker(prev=>prev.epoch===epoch&&!prev.entries.length?r.value:prev);setMessage("Tracker restored.");}else setMessage(r.error);}catch{if(alive.current)setMessage("Could not read encrypted backup.");}finally{if(alive.current)setBusy(false);}
 };
 const rows=tracker.entries.filter(e=>(!filter||e.stage===filter)&&[e.target.title,e.target.location].join(" ").toLowerCase().includes(query.trim().toLowerCase()));
 const due=trackerDueChecks(tracker,today);
 return <section className="card stack" aria-labelledby="tracker-title"><h2 id="tracker-title">Application tracker</h2><p>Manage your own applications. Nothing is submitted automatically; job and visa availability require independent confirmation. Notes and status are private to this session unless you explicitly save an encrypted backup.</p>
 <p>{tracker.entries.length} saved · {due.length} deadlines due within seven days or overdue</p>
 <div className="row"><button type="button" className="btn" onClick={onRadar}>Browse visa routes</button><button type="button" className="btn" onClick={onJobs}>Browse job leads</button></div>
 <details><summary>Add manual opportunity</summary><div className="stack"><label>Opportunity title<input aria-label="Opportunity title" maxLength={500} value={manual.title} onChange={e=>setManual(d=>({...d,title:e.target.value}))}/></label><label>Employer / country<input aria-label="Employer / country" maxLength={500} value={manual.location} onChange={e=>setManual(d=>({...d,location:e.target.value}))}/></label><label>Source URL (optional HTTPS)<input aria-label="Opportunity source URL" maxLength={2048} value={manual.url} onChange={e=>setManual(d=>({...d,url:e.target.value}))}/></label><button type="button" className="btn" onClick={addManual}>Add opportunity</button></div></details>
 <label>Search applications<input aria-label="Search applications" value={query} onChange={e=>setQuery(e.target.value)}/></label><label>Filter status<select aria-label="Filter application status" value={filter} onChange={e=>setFilter(e.target.value)}><option value="">All statuses</option>{stages.map(s=><option key={s} value={s}>{stageLabels[s]}</option>)}</select></label>
 <p role="status">{message}</p>
 {!rows.length&&<p>No applications match this view.</p>}
 {tracker.entries.map(e=><div key={e.id} hidden={!rows.includes(e)}><EntryEditor entry={e} today={today} tracker={tracker} apply={apply}/></div>)}
 <h3>Encrypted tracker backup</h3><p>Uses AES-GCM with a passphrase-derived key. A lost passphrase cannot be recovered. Local encryption does not protect an unlocked app from other users or malicious software. Only saved application changes are included.</p>
 <label>Tracker backup passphrase<input aria-label="Tracker backup passphrase" type="password" autoComplete="new-password" maxLength={200} value={pass} disabled={busy} onChange={e=>setPass(e.target.value)}/></label>
 <div className="row"><button type="button" className="btn" disabled={busy||pass.length<12||!tracker.entries.length} onClick={()=>void encrypt("save")}>Save encrypted tracker</button><button type="button" className="btn" disabled={busy||pass.length<12||!tracker.entries.length} onClick={()=>void encrypt("export")}>Export encrypted tracker</button><button type="button" className="btn" disabled={busy||pass.length<12||!!tracker.entries.length} onClick={()=>void unlock()}>Restore encrypted tracker</button><button type="button" className="btn ghost" disabled={busy} onClick={()=>{if(window.confirm("Delete saved encrypted tracker? In-memory entries are retained.")){try{setMessage(clearTrackerVault(window.localStorage)?"Encrypted checkpoint deleted.":"Could not delete checkpoint.");}catch{setMessage("Storage unavailable.");}}}}>Delete encrypted checkpoint</button></div>
 <label>Import encrypted tracker file<input aria-label="Import encrypted tracker file" type="file" accept=".json,application/json" disabled={busy||pass.length<12||!!tracker.entries.length} onChange={e=>{const file=e.target.files?.[0];e.target.value="";if(file)void unlock(file);}}/></label>
 {busy&&<p role="status">Processing encrypted backup…</p>}
 </section>;
}
