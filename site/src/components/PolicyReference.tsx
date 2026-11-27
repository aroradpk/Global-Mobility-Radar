import {policyRouteReference,policyStateLabels,type PolicyLedger} from "../engine/policyReview";
import type {RadarRoute} from "../engine/routeRadar";
export default function PolicyReference({ledger,route,today}:{ledger:PolicyLedger;route:RadarRoute;today:string}){
 const view=policyRouteReference(ledger,route,today);
 const s=view.snapshot;
 if(!s)return <p className="small muted">Policy review: {policyStateLabels[view.state]}. Fees, funds, processing and availability unknown.</p>;
 const f=s.facts;
 return <div className="stack"><p><strong>Manually reviewed policy reference</strong> · observed {s.observedOn} · effective {f.effectiveOn}</p>
 <p>Availability: {f.availability}; intake: {f.window||"Unknown"}</p>
 <p>Fee: {f.feeAmount?f.feeCurrency+" "+f.feeAmount+" — "+f.feeBasis:"Unknown"}</p>
 <p>Funds: {f.fundsAmount?f.fundsCurrency+" "+f.fundsAmount+" — "+f.fundsBasis:"Unknown"}</p>
 <p>Processing: {f.processing||"Unknown"}</p>
 <p>Settlement: {f.settlement||"Unknown"}</p>
 <details><summary>Documents, quotas and supporting evidence</summary><p>Documents: {f.documents||"Unknown"}</p><p>Quota / draw: {f.quota||"Unknown"}</p><p>Requirements: {f.requirements||"Unknown"}</p><p style={{overflowWrap:"anywhere"}}>{f.excerpt}</p><a href={s.source} target="_blank" rel="noopener noreferrer">Reviewed official source</a></details>
 <p className="small muted">Self-reviewed reference only; not live verification. Calculator rule version has not changed.</p></div>;
}
