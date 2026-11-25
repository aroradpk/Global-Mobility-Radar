import { useEffect, useMemo, useState } from "react";
import { LangContext } from "./i18n";
import type { Answers, Profile } from "./types";
import Upload from "./components/Upload";
import Review from "./components/Review";
import Interview, { defaultAnswers } from "./components/Interview";
import LocalResults from "./components/LocalResults";
import CanadaPanel from "./components/CanadaPanel";
import AustraliaPanel from "./components/AustraliaPanel";
import GermanyPanel from "./components/GermanyPanel";
import EuropePermitPanel from "./components/EuropePermitPanel";
import { useAssessmentDate } from "./useAssessmentDate";

type Step = "upload" | "review" | "interview" | "results";
const SECTIONS = {jobs:"Jobs",canada:"Canada PR",australia:"Australia skilled visas",germany:"Germany visas",ireland:"Ireland permits",netherlands:"Netherlands permits",newzealand:"New Zealand visas"} as const;
type View = keyof typeof SECTIONS;

export default function App() {
  const [view, setView] = useState<View>("jobs");
  const today = useAssessmentDate();
  const [resetKey, setResetKey] = useState(0);
  const [step, setStep] = useState<Step>("upload");
  const [hasResults, setHasResults] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [answers, setAnswers] = useState<Answers | null>(null);
  const effective = useMemo(() => profile ? answers ?? defaultAnswers(profile) : null, [profile, answers]);
  useEffect(() => { document.documentElement.lang = "en"; window.scrollTo({ top: 0 }); }, [step, view]);
  const restartProfile = () => { setHasResults(false); setProfile(null); setAnswers(null); setStep("upload"); };
  const reset = () => { setView("jobs"); setResetKey(k=>k+1); restartProfile(); };
  return <LangContext.Provider value="en">
    <header className="top"><div className="wrap top-in">
      <strong>Global Mobility Radar</strong>
      <span className="muted">Local preview</span>
      <nav aria-label="Application sections" className="section-nav">{(Object.keys(SECTIONS) as View[]).map(v=><button type="button" className="btn small" key={v} aria-pressed={view===v} onClick={()=>setView(v)}>{SECTIONS[v]}</button>)}</nav>
      <button type="button" className="btn ghost small" onClick={()=>{if(window.confirm("Clear all local profiles, job imports and immigration scenarios?"))reset();}}>Clear all local data</button>
    </div></header>
    <main className="wrap main">
      <div key={"jobs-"+resetKey} hidden={view!=="jobs"}>
      {step === "upload" && <Upload onRead={(_text, p) => { setProfile(p); setAnswers(null); setStep("review"); }}/>}
      {step === "review" && profile && <Review profile={profile} onChange={setProfile} onBack={restartProfile} onNext={() => setStep("interview")}/>}
      {step === "interview" && profile && effective && <Interview profile={profile} answers={effective} onChange={setAnswers} onBack={() => setStep("review")} onNext={() => {setAnswers(effective); setHasResults(true); setStep("results");}}/>}
      {/* Keep the imported snapshot, filters and screening work while editing preferences. */}
      {hasResults && profile && effective && <div hidden={step!=="results"}><LocalResults profile={profile} answers={effective} onBack={() => setStep("interview")}/></div>}
      </div>
      <div key={"canada-"+resetKey} hidden={view!=="canada"}><CanadaPanel today={today}/></div>
      <div key={"australia-"+resetKey} hidden={view!=="australia"}><AustraliaPanel today={today}/></div>
      <div key={"germany-"+resetKey} hidden={view!=="germany"}><GermanyPanel today={today}/></div>
      <div key={"ireland-"+resetKey} hidden={view!=="ireland"}><EuropePermitPanel country="ireland" today={today}/></div>
      <div key={"netherlands-"+resetKey} hidden={view!=="netherlands"}><EuropePermitPanel country="netherlands" today={today}/></div>
      <div key={"newzealand-"+resetKey} hidden={view!=="newzealand"}><EuropePermitPanel country="newzealand" today={today}/></div>
    </main>
    <footer className="wrap foot">
      <p>Local preview: profile, imported job data and immigration scenarios are held in memory, cleared on reload or Clear all local data. No profile uploads, paid features or accounts. Opening a link visits an external site.</p>
      <p>Not immigration advice. Inherited reference data and matching signals require independent verification. Based on MIT-licensed <a href="https://github.com/talls2/visa-job-atlas" target="_blank" rel="noopener noreferrer">Visa Job Atlas</a>.</p>
    </footer>
  </LangContext.Provider>;
}
