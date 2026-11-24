import { useEffect, useMemo, useState } from "react";
import { LangContext } from "./i18n";
import type { Answers, Profile } from "./types";
import Upload from "./components/Upload";
import Review from "./components/Review";
import Interview, { defaultAnswers } from "./components/Interview";
import LocalResults from "./components/LocalResults";

type Step = "upload" | "review" | "interview" | "results";

export default function App() {
  const [step, setStep] = useState<Step>("upload");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [answers, setAnswers] = useState<Answers | null>(null);
  const effective = useMemo(() => profile ? answers ?? defaultAnswers(profile) : null, [profile, answers]);
  useEffect(() => { document.documentElement.lang = "en"; window.scrollTo({ top: 0 }); }, [step]);
  const reset = () => { setProfile(null); setAnswers(null); setStep("upload"); };
  return <LangContext.Provider value="en">
    <header className="top"><div className="wrap top-in">
      <strong>Global Mobility Radar</strong>
      <span className="muted">Local preview · {step}</span>
      {profile && <button className="btn ghost small" onClick={reset}>Clear profile and start over</button>}
    </div></header>
    <main className="wrap main">
      {step === "upload" && <Upload onRead={(_text, p) => { setProfile(p); setAnswers(null); setStep("review"); }}/>}
      {step === "review" && profile && <Review profile={profile} onChange={setProfile} onBack={reset} onNext={() => setStep("interview")}/>}
      {step === "interview" && profile && effective && <Interview profile={profile} answers={effective} onChange={setAnswers} onBack={() => setStep("review")} onNext={() => {setAnswers(effective); setStep("results");}}/>}
      {step === "results" && profile && effective && <LocalResults profile={profile} answers={effective} onBack={() => setStep("interview")}/>}
    </main>
    <footer className="wrap foot">
      <p>Local preview: profile and imported job data are held in memory, cleared on reload or reset. No profile uploads, paid features or accounts. Opening a link visits an external site.</p>
      <p>Not immigration advice. Inherited reference data and matching signals require independent verification. Based on MIT-licensed <a href="https://github.com/talls2/visa-job-atlas" target="_blank" rel="noopener noreferrer">Visa Job Atlas</a>.</p>
    </footer>
  </LangContext.Provider>;
}
