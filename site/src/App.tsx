import { useEffect, useMemo, useState } from "react";
import { LangContext } from "./i18n";
import type { Answers, Profile } from "./types";
import Upload from "./components/Upload";
import Review from "./components/Review";
import Interview, { defaultAnswers } from "./components/Interview";
import LocalResults from "./components/LocalResults";
import CanadaPanel from "./components/CanadaPanel";
import AustraliaPanel from "./components/AustraliaPanel";

type Step = "upload" | "review" | "interview" | "results";

export default function App() {
  const [view, setView] = useState<"jobs" | "canada" | "australia">("jobs");
  const [resetKey, setResetKey] = useState(0);
  const [step, setStep] = useState<Step>("upload");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [answers, setAnswers] = useState<Answers | null>(null);
  const effective = useMemo(() => profile ? answers ?? defaultAnswers(profile) : null, [profile, answers]);
  useEffect(() => { document.documentElement.lang = "en"; window.scrollTo({ top: 0 }); }, [step, view]);
  const restartProfile = () => { setProfile(null); setAnswers(null); setStep("upload"); };
  const reset = () => { setView("jobs"); setResetKey(k=>k+1); restartProfile(); };
  return <LangContext.Provider value="en">
    <header className="top"><div className="wrap top-in">
      <strong>Global Mobility Radar</strong>
      <span className="muted">Local preview</span>
      <nav aria-label="Application sections" className="section-nav">{(["jobs","canada","australia"] as const).map(v=><button type="button" className="btn small" key={v} aria-pressed={view===v} onClick={()=>setView(v)}>{v==="jobs"?"Jobs":v==="canada"?"Canada PR":"Australia skilled visas"}</button>)}</nav>
      <button type="button" className="btn ghost small" onClick={()=>{if(window.confirm("Clear all local profiles, job imports and immigration scenarios?"))reset();}}>Clear all local data</button>
    </div></header>
    <main className="wrap main">
      <div key={"jobs-"+resetKey} hidden={view!=="jobs"}>
      {step === "upload" && <Upload onRead={(_text, p) => { setProfile(p); setAnswers(null); setStep("review"); }}/>}
      {step === "review" && profile && <Review profile={profile} onChange={setProfile} onBack={restartProfile} onNext={() => setStep("interview")}/>}
      {step === "interview" && profile && effective && <Interview profile={profile} answers={effective} onChange={setAnswers} onBack={() => setStep("review")} onNext={() => {setAnswers(effective); setStep("results");}}/>}
      {step === "results" && profile && effective && <LocalResults profile={profile} answers={effective} onBack={() => setStep("interview")}/>}
      </div>
      <div key={"canada-"+resetKey} hidden={view!=="canada"}><CanadaPanel/></div>
      <div key={"australia-"+resetKey} hidden={view!=="australia"}><AustraliaPanel/></div>
    </main>
    <footer className="wrap foot">
      <p>Local preview: profile, imported job data and immigration scenarios are held in memory, cleared on reload or Clear all local data. No profile uploads, paid features or accounts. Opening a link visits an external site.</p>
      <p>Not immigration advice. Inherited reference data and matching signals require independent verification. Based on MIT-licensed <a href="https://github.com/talls2/visa-job-atlas" target="_blank" rel="noopener noreferrer">Visa Job Atlas</a>.</p>
    </footer>
  </LangContext.Provider>;
}
