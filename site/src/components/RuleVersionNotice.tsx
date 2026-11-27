import {ruleVersions,ruleReviewHold} from "../engine/policyOperations";
import type {PolicyLedger} from "../engine/policyReview";
export default function RuleVersionNotice({route,ledger,today,hold}:{route:string;ledger:PolicyLedger;today:string;hold?:string}){
 const version=ruleVersions.find(v=>v.route===route);
 const reason=hold||ruleReviewHold(ledger,route,today);
 return <div className="card stack"><p className="small muted">Compiled rule version: {version?.version??"Unknown"} · review by {version?.reviewBy??"Unknown"}.</p>{reason&&<p role="status"><strong>Calculator review required.</strong> {reason} No score or screening result is available for this scenario.</p>}</div>;
}
