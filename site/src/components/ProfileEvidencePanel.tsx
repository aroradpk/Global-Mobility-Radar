import {useState,useRef} from "react";
import {serializeProfile,type ProfileExportContext} from "../engine/profileExport";
import {canadaEducationFields,canadaEducationSource} from "../engine/canadaEducation";
import {canadaLanguageOwners} from "../engine/canadaLanguage";
import {evidenceFields,evidenceLabels,reviewEvidence,evidenceState,serializeEvidence,maxEvidenceRecords,type EvidenceKind,type EvidenceRecord} from "../engine/profileEvidence";

export default function ProfileEvidencePanel({today,exportContext,records,setRecords}:{today:string;exportContext:ProfileExportContext;records:EvidenceRecord[];setRecords:React.Dispatch<React.SetStateAction<EvidenceRecord[]>>}){
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
 const downloadJson=(content:string,filename:string)=>{
  const url=URL.createObjectURL(new Blob([content],{type:"application/json"}));
  const link=document.createElement("a");link.href=url;link.download=filename;document.body.appendChild(link);
  try{link.click();setStatus("Local export requested. Keep the downloaded file private.");}
  finally{link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);}
 };
 const exportRecords=()=>{
  if(!window.confirm("Export reviewed evidence records to a private local JSON file? This file may contain sensitive information and will remain after you close this tab."))return;
  downloadJson(serializeEvidence(records,today),"mobility-evidence.json");
 };
 const exportFullProfile=()=>{
  if(!window.confirm("Export saved career facts, relocation preferences, confirmed age and evidence to a private local JSON file? Unsaved drafts and raw CV are excluded. This file persists after closing the tab."))return;
  downloadJson(serializeProfile(exportContext,records,today),"mobility-profile.json");
 };
 return <div className="card stack">
  <h2>Immigration evidence records</h2>
  <p>Record optional details separately from job-matching facts. These are self-reported, not verified legal evidence. Blank optional fields remain unknown. Canada can explicitly link reviewed language, occupation and supported education records; other fields remain independent.</p>
  <form className="stack" onSubmit={e=>{e.preventDefault();save();}}>
   <label>Evidence category<select value={kind} disabled={editing!==null} onChange={e=>{if(!mayDiscard())return;setKind(e.target.value as EvidenceKind);clearDraft();setStatus("");}}>{(Object.keys(evidenceLabels) as EvidenceKind[]).map(k=><option key={k} value={k}>{evidenceLabels[k]}</option>)}</select></label>
   <p className="small muted">{editing===null?"Add a record":"Editing a saved record"}. Do not include passport numbers, account numbers or document images.</p>
   {kind==="language"&&<p className="small muted">For Canada, use IELTS General Training, CELPIP-General, PTE Core, TCF Canada, or TEF Canada (previous score equivalency). Enter component scores from one approved result, not overall scores or IELTS One Skill Retake. Select the actual test owner. For Canadian linking, use the result date in the test date field and type confirmed only after checking the original approved report.</p>}
   {kind==="education"&&<p className="small muted">For Canada, select the exact level from your completed Canadian credential or immigration-purpose ECA using the <a href={canadaEducationSource} target="_blank" rel="noopener noreferrer">IRCC equivalency table</a>. For foreign credentials, enter the ECA issue date as the assessment date and check the designated provider is appropriate for your occupation. Multiple-credential and professional-body cases remain manual. Do not enter report numbers.</p>}
   {evidenceFields[kind].map(field=>{
    const choices=field.key==="canadaLanguageOwner"?canadaLanguageOwners:Object.prototype.hasOwnProperty.call(canadaEducationFields,field.key)?canadaEducationFields[field.key]:undefined;
    const update=(value:string)=>{setDraft(prev=>({...prev,[field.key]:value}));setConfirmed(false);setError("");};
    return <label key={field.key}>{field.label}{choices?<select aria-label={field.label} value={draft[field.key]??""} onChange={e=>update(e.target.value)}><option value="">Unknown / not applicable</option>{choices.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>:<input type={"format" in field&&field.format==="date"?"date":"text"} required={"required" in field&&field.required} maxLength={250} value={draft[field.key]??""} onChange={e=>update(e.target.value)}/>}</label>;
   })}
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
  <button type="button" className="btn" disabled={!records.length&&!exportContext.profile&&!exportContext.preferences&&!exportContext.age} onClick={exportFullProfile}>Export complete saved profile (JSON)</button>
  <p className="small muted">Evidence export includes saved records only. Complete profile export adds saved career facts, planning preferences and age confirmation, but excludes raw CV, unsaved edits, jobs and immigration scenarios. Clear all local data or reload to clear this tab; downloaded files must be deleted separately.</p>
 </div>;
}
