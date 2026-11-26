import { useState } from "react";
import { assessPermit, PERMIT_ROUTES, REVIEWED, REVIEW_BY, type Country, type Facts } from "../engine/europePermits";

const LABELS={review_required:"Review required",requirements_not_met:"Requirements not met / outstanding",meets_self_reported_screen:"Meets self-reported screen only"} as const;

export default function EuropePermitPanel({country,today}:{country:Country;today:string}){
  const routes=PERMIT_ROUTES[country];
  const [active,setActive]=useState(routes[0].id);
  const [scenarios,setScenarios]=useState<Record<string,Facts>>({});
  const [submitted,setSubmitted]=useState(false);
  const route=routes.find(r=>r.id===active)!;
  const input=scenarios[active]??{};
  const update=(key:string,value:string)=>{setScenarios(old=>({...old,[active]:{...old[active],[key]:value}}));setSubmitted(false);};
  const result=submitted?assessPermit(country,active,input,today):null;
  const name={ireland:"Ireland",netherlands:"Netherlands",newzealand:"New Zealand",uk:"United Kingdom",hongkong:"Hong Kong",singapore:"Singapore",uae:"United Arab Emirates"}[country];
  return <section className="card stack" aria-labelledby={country+"-title"}>
    <h2 id={country+"-title"}>{name} — employment and residence pathways</h2>
    <p>Current-date self-reported screening for ordinary skilled workers. No profile is uploaded. Review date: {REVIEWED}; review again after {REVIEW_BY}. Unknown facts are not assumed true. This is not an official decision.</p>
    <nav className="section-nav" aria-label={name+" pathways"}>{routes.map(r=><button type="button" className="btn small" key={r.id} aria-pressed={active===r.id} onClick={()=>{setActive(r.id);setSubmitted(false);}}>{r.title}</button>)}</nav>
    <h3>{route.title}</h3><p><strong>{route.kind}</strong></p><p>{route.intro}</p>
    <p><a href={route.source} target="_blank" rel="noopener noreferrer">Official requirements</a>{route.links?.map(([label,url])=><span key={url}> · <a href={url} target="_blank" rel="noopener noreferrer">{label}</a></span>)}</p>
    {route.fields.filter(f=>!f.when||f.when(input)).map(f=><label key={f.key}>{f.label}
      {f.kind==="yes"||f.kind==="choice"?<select aria-label={f.label} value={input[f.key]??""} onChange={e=>update(f.key,e.target.value)}><option value="">Unknown / select</option>{(f.kind==="yes"?[["yes","Yes — confirmed"],["no","No"]]:f.options??[]).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>:
      <input aria-label={f.label} type={f.kind==="date"?"date":f.kind==="text"?"text":"number"} min={f.kind==="number"||f.kind==="money"?0:undefined} step={f.kind==="money"?"0.01":f.kind==="number"?"1":undefined} maxLength={200} value={input[f.key]??""} onChange={e=>update(f.key,e.target.value)}/>}
    </label>)}
    <div className="row"><button type="button" className="btn primary" onClick={()=>setSubmitted(true)}>Assess selected pathway</button><button type="button" className="btn ghost" onClick={()=>{setScenarios(old=>({...old,[active]:{}}));setSubmitted(false);}}>Clear selected pathway</button></div>
    {result&&<div className="card stack" role="status"><h3>{LABELS[result.status]}</h3>{result.details.map(x=><p key={x}>{x}</p>)}{result.failed.length>0&&<><strong>Outstanding requirements in this screen</strong><ul>{result.failed.map(x=><li key={x}>{x}</li>)}</ul></>}{result.missing.length>0&&<><strong>Evidence or manual review needed</strong><ul>{result.missing.map(x=><li key={x}>{x}</li>)}</ul></>}<p>Check all facts against official current guidance before relying on this result. No approval or invitation prediction.</p></div>}
  </section>;
}
