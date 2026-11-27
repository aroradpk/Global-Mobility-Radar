import {useState} from "react";
import {routeTarget,type Target} from "../engine/applicationTracker";
import PolicyReference from "./PolicyReference";
import type {PolicyLedger} from "../engine/policyReview";
import {countryNames,filterRadar,radarRoutes,routeKey,radarFresh,type RadarCountry} from "../engine/routeRadar";
export default function RouteRadar({today,onOpen,ledger,onShortlist,isShortlisted}:{today:string;onOpen:(country:RadarCountry)=>void;ledger:PolicyLedger;onShortlist:(target:Target)=>void;isShortlisted:(target:Target)=>boolean}){
 const [query,setQuery]=useState(""),[country,setCountry]=useState(""),[selected,setSelected]=useState<string[]>([]);
 const rows=filterRadar(query,country);
 const comparison=radarRoutes.filter(r=>selected.includes(routeKey(r)));
 return <section className="card stack" aria-labelledby="radar-title">
 <h2 id="radar-title">Visa and PR route radar</h2>
 <p>Browse existing country assessments in one place. Reference only: application windows, current availability, fees and processing time require official verification. Do not treat a route listing as an eligibility result.</p>
 <label>Search visa routes<input aria-label="Search visa routes" value={query} maxLength={120} onChange={e=>setQuery(e.target.value)}/></label>
 <label>Country filter<select aria-label="Country filter" value={country} onChange={e=>setCountry(e.target.value)}><option value="">All countries</option>{Object.entries(countryNames).map(([key,name])=><option key={key} value={key}>{name}</option>)}</select></label>
 <p role="status">{rows.length} routes · {selected.length}/3 selected for comparison</p>
 {comparison.length>0&&<section className="card stack"><h3>Selected route comparison</h3><p>Compare legal route type and main constraints; no cross-country probability or cost ranking.</p>{comparison.map(r=><article className="card stack" key={routeKey(r)}><h4>{countryNames[r.country]} — {r.title}</h4><p>{r.kind}</p><p>{r.summary}</p><PolicyReference ledger={ledger} route={r} today={today}/><a href={r.source} target="_blank" rel="noopener noreferrer">Official requirements</a><button type="button" className="btn" onClick={()=>setSelected(old=>old.filter(k=>k!==routeKey(r)))}>Remove {r.title} from comparison</button></article>)}<button type="button" className="btn ghost" onClick={()=>setSelected([])}>Clear comparison</button></section>}
 {rows.length===0&&<p>No routes match your filters.</p>}
 {rows.map(r=><article className="card stack" key={routeKey(r)}><h3>{countryNames[r.country]} — {r.title}</h3><p><strong>{r.kind}</strong></p><p>{r.summary}</p><p className="small muted">{radarFresh(r,today)?"Reference reviewed "+r.reviewed:"Review required — reference date "+r.reviewed}.</p><PolicyReference ledger={ledger} route={r} today={today}/><a href={r.source} target="_blank" rel="noopener noreferrer">Official requirements</a><label><input type="checkbox" aria-label={"Compare "+countryNames[r.country]+" "+r.title} checked={selected.includes(routeKey(r))} disabled={selected.length>=3&&!selected.includes(routeKey(r))} onChange={e=>setSelected(old=>e.target.checked?[...old,routeKey(r)]:old.filter(k=>k!==routeKey(r)))}/> Compare route</label><button type="button" className="btn" disabled={isShortlisted(routeTarget(r))} onClick={()=>onShortlist(routeTarget(r))}>{isShortlisted(routeTarget(r))?"Shortlisted "+r.title:"Shortlist "+r.title}</button><button type="button" className="btn" onClick={()=>onOpen(r.country)}>Open {countryNames[r.country]} assessments</button></article>)}
 </section>;
}
