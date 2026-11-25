import { useMemo, useState } from "react";
import { COUNTRIES, KNOWLEDGE_AS_OF, skillLabel } from "../data";
import { matchJobs } from "../engine/jobs";
import { MAX_FILE_BYTES, parseLocalJobs, isRecentObservation, type LocalJobs } from "../localJobs";
import type { Answers, Profile } from "../types";
import JobScreeningPanel from "./JobScreeningPanel";
import { advertisedSalary } from "../engine/advertisedSalary";

const SIGNAL: Record<string, string> = {
  explicit: "Imported explicit wording", conditional: "Imported conditional signal",
  register: "Imported register match", "employer-yes": "Imported employer policy",
  relocation: "Relocation only", unknown: "Unknown", blocked: "Excluded", "employer-no": "Excluded",
};

export default function LocalResults({ profile, answers, onBack }: { profile: Profile; answers: Answers; onBack: () => void }) {
  const [snapshot, setSnapshot] = useState<LocalJobs | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(40);
  const order = useMemo(() => answers.targets.length ? answers.targets : COUNTRIES.map(c => c.code), [answers.targets]);
  const countrySet = useMemo(() => new Set(order), [order]);
  const matches = useMemo(() => matchJobs(
    (snapshot?.jobs ?? []).filter(j => !["blocked", "employer-no"].includes(j.visa) && j.countries.some(c => countrySet.has(c))).map(j => ({...j, visa: "unknown" as const, registerIn: []})),
    profile, answers, order, new Set(), 30000, true,
  ), [snapshot, profile, answers, order, countrySet]);
  const originalSignals = useMemo(() => new Map(snapshot?.jobs.map(j => [j.id, j.visa]) ?? []), [snapshot]);
  const filtered = matches.filter(m => (m.job.title + " " + m.job.company + " " + m.job.location).toLowerCase().includes(query.toLowerCase()));
  async function read(file: File) {
    setError(""); setBusy(true);
    try {
      if (file.size > MAX_FILE_BYTES) throw new Error("Job file exceeds 10 MiB");
      setSnapshot(parseLocalJobs(await file.text())); setLimit(40);
    } catch (e) { setError(e instanceof Error ? e.message : "Could not read job file"); }
    finally { setBusy(false); }
  }
  const stale = snapshot && Date.now() - Date.parse(snapshot.generatedAt) > 48 * 3600000;
  return <section>
    <button className="btn ghost" onClick={onBack}>Edit preferences</button>
    <h1>Global mobility dashboard</h1>
    <p className="muted">Local development preview. No account, external API, automatic polling or live verification.</p>
    <div className="card stack">
      <h2>Local job snapshot</h2>
      <p>Import an authorised pipeline jobs.json file. Data stays in this tab. Imported records, including sponsor labels and salaries, are unverified leads, not confirmed open vacancies or visa eligibility.</p>
      <label>Choose job data (JSON, up to 10 MiB)
        <input type="file" accept=".json,application/json" disabled={busy} onChange={e => {
          const f = e.currentTarget.files?.[0]; e.currentTarget.value = ""; if (f) void read(f);
        }}/>
      </label>
      {busy && <p role="status">Reading snapshot…</p>}
      {error && <p role="alert" className="error">Import failed: {error}. {snapshot ? "Previous snapshot retained." : "No data imported."}</p>}
      {snapshot ? <>
        <p>Snapshot date: {snapshot.generatedAt} · {snapshot.jobs.length} records · {snapshot.duplicateCount} duplicate IDs skipped.</p>
        {stale && <p role="alert">Snapshot is older than 48 hours; treat every record as stale.</p>}
        <button className="btn" disabled={busy} onClick={() => {setSnapshot(null); setError("");}}>Clear job data</button>
      </> : <p>No job data loaded. Country references remain available below.</p>}
    </div>
    <div className="card stack">
      <h2>Job leads ({filtered.length})</h2>
      <p>Ranking is an inherited heuristic, not an approval or hiring probability. Imported sponsorship labels do not increase the ranking. Salary and visa requirements need independent checks. All labels are imported and unverified.</p>
      <label>Filter title, employer or location<input value={query} onChange={e => {setQuery(e.target.value); setLimit(40);}}/></label>
      {snapshot && !filtered.length && <p>No matching leads in this snapshot.</p>}
      {filtered.slice(0, limit).map(m => {
        const e = snapshot?.evidence.get(m.job.id);
        const originalSignal = originalSignals.get(m.job.id) ?? "unknown";
        const descriptionRecent = !!e && isRecentObservation(e.descriptionCheckedAt);
        const observationRecent = !!e && isRecentObservation(e.observedAt);
        const salaryChecks = advertisedSalary(m.job.countries, m.job.salary, observationRecent && descriptionRecent, new Date().toISOString().slice(0,10));
        return <article className="card" key={m.job.id}>
        <h3><a href={m.job.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">{m.job.title}</a></h3>
        <p>{m.job.company} · {m.job.location || m.job.countries.join(", ")} · Rank score: {m.score}</p>
        <p>{descriptionRecent && observationRecent ? SIGNAL[originalSignal] ?? "Unknown" : "Unknown / stale evidence"} — not verified · Salary: {m.job.salary || "Unknown"}</p>
        {salaryChecks.length ? <details><summary>Indicative advertised salary comparison (not eligibility)</summary><ul>{salaryChecks.map(({rule,status}) => <li key={rule.id}>{rule.label}: {status === "advertised_at_or_above" ? "advertised amount at or above floor" : status === "advertised_below" ? "advertised range below floor" : "advertised range crosses floor"} — <a href={rule.source} target="_blank" rel="noopener noreferrer">official criteria</a></li>)}</ul><p>Unverified advertisement only. Confirm contract, qualifying pay components and applicable criterion separately.</p></details> : <p>Automatic salary comparison: unknown or unsupported; manual review required.</p>}
        {e?.sourceId === "government:se:jobsearch" && <p>Source: <a href="https://data.arbetsformedlingen.se/dataservice/jobsearch/" target="_blank" rel="noopener noreferrer">Swedish Public Employment Service JobSearch (CC0)</a>. Government-portal lead, not direct employer verification.</p>}
        {e ? <details><summary>Imported source evidence</summary>
          <p>Source: {e.sourceId} · Listing observation: {e.observedAt} ({observationRecent ? "recent" : "stale or invalid"})</p>
          <p>Description observation: {e.descriptionCheckedAt || "Unknown"}</p>
          <p>Evidence is supplied by the imported file, not independently checked by the browser.</p>
          {e.positive && <p>Positive wording: {e.positive}</p>}
          {e.negative && <p>Restrictive wording: {e.negative}</p>}
          {e.relocation && <p>Relocation wording: {e.relocation}</p>}
        </details> : <p>No per-vacancy observation evidence supplied.</p>}
        <p>Matched skills: {m.matchedSkills.map(skillLabel).join(", ") || "None recorded"} · Missing: {m.missingSkills.map(skillLabel).join(", ") || "None recorded"}</p>
        {m.languageBlock.length > 0 && <p>Language requirement not met or unknown: {m.languageBlock.join(", ")}</p>}
      </article>; })}
      {filtered.length > limit && <button className="btn" onClick={() => setLimit(n => n + 40)}>Show more</button>}
    </div>
    <JobScreeningPanel />
    <div className="card stack">
      <h2>Immigration references</h2>
      <p>Inherited information dated {KNOWLEDGE_AS_OF || "unknown"}. Not validated current rules. Use the Canada, Australia, Germany, Ireland, Netherlands and New Zealand sections for versioned screening; remaining routes are dated references.</p>
      {COUNTRIES.filter(c => countrySet.has(c.code)).map(c => <details key={c.code}>
        <summary>{c.name.en}</summary>
        {c.routes.map(r => <p key={r.id}><strong>{r.name.en}</strong> — {r.summary.en} {r.source.startsWith("https://") && <a href={r.source} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Official source (verify)</a>}</p>)}
      </details>)}
    </div>
  </section>;
}
