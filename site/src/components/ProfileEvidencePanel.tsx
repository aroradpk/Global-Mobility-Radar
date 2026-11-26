import {useState,useRef} from "react";
import {evidenceFields,evidenceLabels,reviewEvidence,evidenceState,serializeEvidence,maxEvidenceRecords,type EvidenceKind,type EvidenceRecord} from "../engine/profileEvidence";

export default function ProfileEvidencePanel({today}:{today:string}){
 const [records,setRecords]=useState<EvidenceRecord[]>([]);
 const [kind,setKind]=useState<EvidenceKind>("employment");
 const [draft,setDraft]=useState<Record<string,string>>({});
 const [editing,setEditing]=useState<number|null>(null);
 const [confirmed,setConfirmed]=useState(false);
 const [error,setError]=useState("");
 const [status,setStatus]=useState("");
 const nextId=useRef(1);
 const clearDraft=()=>{setDraft({});setEditing(null);setConfirmed(false);setError("");};
 const mayDiscard=()=>!Object.values(draft).some(value=>value.trim()!=="")||window.confirm("Discard the unsaved evidence draft?");
 const save=()=>{
  if(!confirmed){setError("Confirm that you reviewed these self-reported facts.");return;}
  if(editing===null&&records.length>=maxEvidenceRecords){setError("Record limit reached. Remove an existing record first.");return;}
  const result=reviewEvidence(kind,draft,today,editing??nextId.current);
  if(!result.record){setError(result.error);return;}
  const record=result.record;
  if(editing===null){nextId.current++;setRecords(prev=>[...prev,record]);}
  else setRecords(prev=>prev.map(r=>r.id===editing?record:r));
  clearDraft();setStatus("Evidence record saved in this tab.");
 };
 const exportRecords=()=>{
  if(!window.confirm("Export reviewed evidence records to a private local JSON file? This file may contain sensitive information and will remain after you close this tab."))return;
  const url=URL.createObjectURL(new Blob([serializeEvidence(records,today)],{type:"application/json"}));
  const link=document.createElement("a");link.href=url;link.download="mobility-evidence.json";document.body.appendChild(link);
  try{link.click();setStatus("Evidence export requested. Keep the downloaded file private.");}
  finally{link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
 };
 return <div className="card stack">
  <h2>Immigration evidence records</h2>
  <p>Record optional details separately from job-matching facts. These are self-reported, not verified legal evidence. Blank optional fields remain unknown. No country calculator automatically uses these records yet.</p>
  <form className="stack" onSubmit={e=>{e.preventDefault();save();}}>
   <label>Evidence category<select value={kind} disabled={editing!==null} onChange={e=>{if(!mayDiscard())return;setKind(e.target.value as EvidenceKind);clearDraft();setStatus("");}}>{(Object.keys(evidenceLabels) as EvidenceKind[]).map(k=><option key={k} value={k}>{evidenceLabels[k]}</option>)}</select></label>
   <p className="small muted">{editing===null?"Add a record":"Editing a saved record"}. Do not include passport numbers, account numbers or document images.</p>
   {evidenceFields[kind].map(field=><label key={field.key}>{field.label}<input type={"format" in field&&field.format==="date"?"date":"text"} required={"required" in field&&field.required} maxLength={250} value={draft[field.key]??""} onChange={e=>{const value=e.target.value;setDraft(prev=>({...prev,[field.key]:value}));setConfirmed(false);setError("");}}/></label>)}
   <label><input type="checkbox" checked={confirmed} onChange={e=>{setConfirmed(e.target.checked);setError("");}}/> I reviewed these facts; they are self-reported, not independently verified.</label>
   <div className="row"><button className="btn primary" type="submit">Save evidence record</button><button className="btn" type="button" onClick={()=>{clearDraft();setStatus("Draft discarded.");}}>Cancel evidence edit</button></div>
   {error&&<p className="error" role="alert">{error}</p>}
  </form>
  <p role="status">{status}</p>
  <h3>Saved evidence ({records.length}/{maxEvidenceRecords})</h3>
  {records.length===0&&<p>No evidence records saved.</p>}
  {records.map(record=><div className="card stack" key={record.id}>
   <strong>{evidenceLabels[record.kind]} — record {record.id}</strong>
   <p className="small muted">Reviewed {record.confirmedOn} · {evidenceState(record,today)}</p>
   <dl>{evidenceFields[record.kind].filter(f=>record.values[f.key]).map(f=><div key={f.key}><dt>{f.label}</dt><dd style={{overflowWrap:"anywhere"}}>{record.values[f.key]}</dd></div>)}</dl>
   <div className="row"><button type="button" className="btn" onClick={()=>{if(!mayDiscard())return;setKind(record.kind);setDraft({...record.values});setEditing(record.id);setConfirmed(false);setError("");setStatus("Editing record "+record.id+".");}}>Edit record {record.id}</button><button type="button" className="btn" onClick={()=>{if(!window.confirm("Remove this evidence record?"))return;setRecords(prev=>prev.filter(r=>r.id!==record.id));if(editing===record.id)clearDraft();setStatus("Evidence record removed.");}}>Remove record {record.id}</button></div>
  </div>)}
  <button type="button" className="btn" disabled={!records.length} onClick={exportRecords}>Export reviewed evidence (JSON)</button>
  <p className="small muted">Export includes saved evidence records only, not your CV, career profile, preferences or immigration scenarios. Clear all local data or reload to clear this tab; downloaded files must be deleted separately.</p>
 </div>;
}
