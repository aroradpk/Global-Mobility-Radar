import { useState } from "react";
import { compareDutchSponsor, NL_REGISTER, RULES_VERSION, SALARY_RULES, SCAM_SOURCE, scamFlags, screenSalary } from "../engine/jobScreening";

export default function JobScreeningPanel() {
  const [salary, setSalary] = useState({route:"",applicationDate:"",amount:"",basisConfirmed:false,criterionConfirmed:false});
  const [sponsor, setSponsor] = useState({employerName:"",employerKvk:"",registerName:"",registerKvk:"",publicationDate:"",checkedDate:"",sourceConfirmed:false});
  const [message, setMessage] = useState("");
  const rule = SALARY_RULES.find(r => r.id === salary.route);
  const result = screenSalary(salary);
  const identity = compareDutchSponsor(sponsor, new Date().toISOString().slice(0,10));
  const flags = scamFlags(message);
  return <div className="card stack">
    <h2>Manual vacancy screening</h2>
    <p>Review a lead from its original employer posting before applying. Inputs stay in this tab; no external lookups or proof of eligibility.</p>
    <details><summary>Salary floor — 2026 Germany and Netherlands</summary>
      <label>Applicable route<select value={salary.route} onChange={e => setSalary({...salary,route:e.target.value,amount:"",basisConfirmed:false,criterionConfirmed:false})}>
        <option value="">Choose a route</option>{SALARY_RULES.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
      </select></label>
      <label>Applicable application date<input type="date" value={salary.applicationDate} onChange={e => setSalary({...salary,applicationDate:e.target.value})}/></label>
      {rule && <p>Published floor: €{rule.amount.toLocaleString("en-IE",{minimumFractionDigits:2})} per {rule.period} · <a href={rule.source} target="_blank" rel="noopener noreferrer">Official requirements</a></p>}
      <label>Guaranteed qualifying gross EUR pay {rule ? "per " + rule.period : ""}<input inputMode="decimal" maxLength={12} value={salary.amount} onChange={e => setSalary({...salary,amount:e.target.value,basisConfirmed:false})}/></label>
      <label><input type="checkbox" checked={salary.basisConfirmed} onChange={e => setSalary({...salary,basisConfirmed:e.target.checked})}/> I checked the contract, currency, period and qualifying components (not estimated total compensation; Dutch pay excludes holiday allowance).</label>
      <label><input type="checkbox" checked={salary.criterionConfirmed} onChange={e => setSalary({...salary,criterionConfirmed:e.target.checked})}/> I independently confirmed this is the applicable age/occupation/qualification criterion.</label>
      <p role="status"><strong>{result.status === "meets_floor" ? "Meets selected salary floor only" : result.status === "below_floor" ? "Below selected salary floor" : "Unknown / review required"}</strong> — {result.reason}</p>
      <p>Rule review: {RULES_VERSION}; valid only for 2026. No salary conversion or reduced-route eligibility inferred. Recheck official rules before applying.</p>
    </details>
    <details><summary>Dutch recognised sponsor identity check</summary>
      <p>Compare the actual hiring legal entity with its current entry in the <a href={NL_REGISTER} target="_blank" rel="noopener noreferrer">IND work register</a>. A brand name alone is insufficient.</p>
      <label>Hiring legal name<input maxLength={200} value={sponsor.employerName} onChange={e => setSponsor({...sponsor,employerName:e.target.value,sourceConfirmed:false})}/></label>
      <label>Hiring entity KvK number<input inputMode="numeric" maxLength={8} value={sponsor.employerKvk} onChange={e => setSponsor({...sponsor,employerKvk:e.target.value,sourceConfirmed:false})}/></label>
      <label>Register legal name<input maxLength={200} value={sponsor.registerName} onChange={e => setSponsor({...sponsor,registerName:e.target.value,sourceConfirmed:false})}/></label>
      <label>Register KvK number<input inputMode="numeric" maxLength={8} value={sponsor.registerKvk} onChange={e => setSponsor({...sponsor,registerKvk:e.target.value,sourceConfirmed:false})}/></label>
      <label>Register publication date<input type="date" value={sponsor.publicationDate} onChange={e => setSponsor({...sponsor,publicationDate:e.target.value,sourceConfirmed:false})}/></label>
      <label>Date you checked the register<input type="date" value={sponsor.checkedDate} onChange={e => setSponsor({...sponsor,checkedDate:e.target.value,sourceConfirmed:false})}/></label>
      <label><input type="checkbox" checked={sponsor.sourceConfirmed} onChange={e => setSponsor({...sponsor,sourceConfirmed:e.target.checked})}/> I checked the official current register and the employer's actual legal entity.</label>
      <p role="status">{identity === "manual_exact_match" ? "Manual exact identity match — not independently verified or proof of vacancy sponsorship." : identity === "mismatch" ? "Legal name or registration number differs; do not assume sponsor membership." : "Unknown — complete current official evidence is required."}</p>
    </details>
    <details><summary>Recruitment scam warning signs</summary>
      <p>Paste non-sensitive wording from a vacancy or recruiter message (no personal details). Pattern matching may miss scams or flag innocent wording.</p>
      <textarea rows={4} maxLength={20000} value={message} onChange={e => setMessage(e.target.value)}/>
      {message.trim() && <div role="status">{flags.length ? <ul>{flags.map(f => <li key={f}>{f}</li>)}</ul> : <p>No supported wording flags found. This is not proof of legitimacy.</p>}</div>}
      <p>Verify on the employer's own careers page. Never send money to obtain a job. <a href={SCAM_SOURCE} target="_blank" rel="noopener noreferrer">FTC job scam guidance</a></p>
    </details>
  </div>;
}
