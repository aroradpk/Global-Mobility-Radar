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
import ProfilePanel from "./components/ProfilePanel";
import {blankJobProfile,currentAge,type ConfirmedAge} from "./engine/unifiedProfile";

type Step = "upload" | "review" | "interview" | "results";
const SECTIONS = {jobs:"Jobs",profile:"Profile",canada:"Canada PR",australia:"Australia skilled visas",germany:"Germany visas",ireland:"Ireland permits",netherlands:"Netherlands permits",newzealand:"New Zealand visas",uk:"UK visas",hongkong:"Hong Kong visas",singapore:"Singapore passes",uae:"UAE visas",us:"US visas"} as const;
type View = keyof typeof SECTIONS;

export default function App() {
  const [view, setView] = useState<View>("jobs");
  const today = useAssessmentDate();
  const [resetKey, setResetKey] = useState(0);
  const [step, setStep] = useState<Step>("upload");
  const [hasResults, setHasResults] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [careerConfirmed,setCareerConfirmed]=useState(false);
  const [manualReview,setManualReview]=useState(false);
  const [age,setAge]=useState<ConfirmedAge|null>(null);
  const profileAge=currentAge(age,today);
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [savedAnswers,setSavedAnswers]=useState<Answers|null>(null);
  const effective = useMemo(() => profile ? answers ?? defaultAnswers(profile) : null, [profile, answers]);
  useEffect(() => { document.documentElement.lang = "en"; window.scrollTo({ top: 0 }); }, [step, view]);
  const restartProfile = () => { setHasResults(false); setProfile(null); setCareerConfirmed(false); setManualReview(false); setAnswers(null); setSavedAnswers(null); setStep("upload"); };
  const startManual=()=>{setProfile(blankJobProfile());setCareerConfirmed(false);setManualReview(true);setAnswers(null);setSavedAnswers(null);setStep("review");};
  const editCareer=()=>{setView("jobs");if(profile){setStep("review");}else startManual();};
  const reset = () => { setView("jobs"); setResetKey(k=>k+1); setAge(null); restartProfile(); };
  return <LangContext.Provider value="en">
    <header className="top"><div className="wrap top-in">
      <strong>Global Mobility Radar</strong>
      <span className="muted">Local preview</span>
      <nav aria-label="Application sections" className="section-nav">{(Object.keys(SECTIONS) as View[]).map(v=><button type="button" className="btn small" key={v} aria-pressed={view===v} onClick={()=>setView(v)}>{SECTIONS[v]}</button>)}</nav>
      <button type="button" className="btn ghost small" onClick={()=>{if(window.confirm("Clear all local profiles, job imports and immigration scenarios?"))reset();}}>Clear all local data</button>
    </div></header>
    <main className="wrap main">
      <div key={"jobs-"+resetKey} hidden={view!=="jobs"}>
      {step === "upload" && <Upload onManual={startManual} onRead={(_text, p) => { setProfile(p); setCareerConfirmed(false);setManualReview(false);setAnswers(null);setSavedAnswers(null); setStep("review"); }}/>}
      {step === "review" && profile && <Review profile={profile} manual={manualReview} onBack={hasResults?()=>setStep("results"):restartProfile} onNext={p=>{setProfile(p);setCareerConfirmed(true);setManualReview(false);setStep("interview");}}/>}
      {step === "interview" && profile && effective && <Interview profile={profile} answers={effective} onChange={setAnswers} onBack={() => setStep("review")} onNext={() => {setAnswers(effective); setSavedAnswers(effective); setHasResults(true); setStep("results");}}/>}
      {/* Keep the imported snapshot, filters and screening work while editing preferences. */}
      {hasResults && profile && effective && <div hidden={step!=="results"}><LocalResults profile={profile} answers={effective} onBack={() => setStep("interview")} onEditProfile={()=>setStep("review")}/></div>}
      </div>
      <div key={"profile-"+resetKey} hidden={view!=="profile"}><ProfilePanel profile={careerConfirmed?profile:null} answers={careerConfirmed?savedAnswers:null} age={age} today={today} onAge={setAge} onCareer={editCareer} onPreferences={()=>{setView("jobs");setStep("interview");}}/></div>
      <div key={"canada-"+resetKey} hidden={view!=="canada"}><CanadaPanel today={today} profileAge={profileAge}/></div>
      <div key={"australia-"+resetKey} hidden={view!=="australia"}><AustraliaPanel today={today} profileAge={profileAge}/></div>
      <div key={"germany-"+resetKey} hidden={view!=="germany"}><GermanyPanel today={today} profileAge={profileAge}/></div>
      <div key={"ireland-"+resetKey} hidden={view!=="ireland"}><EuropePermitPanel country="ireland" today={today} profileAge={profileAge}/></div>
      <div key={"netherlands-"+resetKey} hidden={view!=="netherlands"}><EuropePermitPanel country="netherlands" today={today} profileAge={profileAge}/></div>
      <div key={"newzealand-"+resetKey} hidden={view!=="newzealand"}><EuropePermitPanel country="newzealand" today={today} profileAge={profileAge}/></div>
      <div key={"uk-"+resetKey} hidden={view!=="uk"}><EuropePermitPanel country="uk" today={today} profileAge={profileAge}/></div>
      <div key={"hongkong-"+resetKey} hidden={view!=="hongkong"}><EuropePermitPanel country="hongkong" today={today} profileAge={profileAge}/></div>
      <div key={"singapore-"+resetKey} hidden={view!=="singapore"}><EuropePermitPanel country="singapore" today={today} profileAge={profileAge}/></div>
      <div key={"uae-"+resetKey} hidden={view!=="uae"}><EuropePermitPanel country="uae" today={today} profileAge={profileAge}/></div>
      <div key={"us-"+resetKey} hidden={view!=="us"}><EuropePermitPanel country="us" today={today} profileAge={profileAge}/></div>
    </main>
    <footer className="wrap foot">
      <p>Local preview: profile, imported job data and immigration scenarios are held in memory, cleared on reload or Clear all local data. No profile uploads, paid features or accounts. Opening a link visits an external site.</p>
      <p>Not immigration advice. Inherited reference data and matching signals require independent verification. Based on MIT-licensed <a href="https://github.com/talls2/visa-job-atlas" target="_blank" rel="noopener noreferrer">Visa Job Atlas</a>.</p>
    </footer>
  </LangContext.Provider>;
}
