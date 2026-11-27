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
import RouteRadar from "./components/RouteRadar";
import ApplicationTracker from "./components/ApplicationTracker";
import {blankTracker,addTarget,sameTarget,trackerDueChecks,type Target} from "./engine/applicationTracker";
import {clearTrackerVault} from "./engine/trackerVault";
import PolicyReviewPanel from "./components/PolicyReviewPanel";
import {blankPolicyLedger,policyAlerts} from "./engine/policyReview";
import PolicyOperationsPanel from "./components/PolicyOperationsPanel";
import {duePolicyChecks,reconcileNotices,clearPolicyCheckpoint,type LocalNotice} from "./engine/policyOperations";
import type {EvidenceRecord} from "./engine/profileEvidence";
import {blankJobProfile,currentAge,type ConfirmedAge} from "./engine/unifiedProfile";

type Step = "upload" | "review" | "interview" | "results";
const SECTIONS = {jobs:"Jobs",profile:"Profile",radar:"Visa and PR radar",tracker:"Application tracker",policy:"Policy review",operations:"Policy operations",canada:"Canada PR",australia:"Australia skilled visas",germany:"Germany visas",ireland:"Ireland permits",netherlands:"Netherlands permits",newzealand:"New Zealand visas",uk:"UK visas",hongkong:"Hong Kong visas",singapore:"Singapore passes",uae:"UAE visas",us:"US visas"} as const;
type View = keyof typeof SECTIONS;

export default function App() {
  const [view, setView] = useState<View>("jobs");
  const today = useAssessmentDate();
  const [resetKey, setResetKey] = useState(0);
  const [policy,setPolicy]=useState(()=>blankPolicyLedger());
  const [tracker,setTracker]=useState(()=>blankTracker());
  const shortlist=(target:Target)=>setTracker(old=>{const r=addTarget(old,target,today);return r.ok?r.value:old;});
  const shortlisted=(target:Target)=>tracker.entries.some(e=>sameTarget(e.target,target));
  const policyInbox=policyAlerts(policy,today).length;
  const [notices,setNotices]=useState<LocalNotice[]>([]);
  const unread=notices.filter(n=>!n.resolvedOn&&!n.readOn).length;
  useEffect(()=>{setNotices(old=>reconcileNotices(old,[...duePolicyChecks(policy,today),...trackerDueChecks(tracker,today)],today));},[policy,tracker,today]);
  const [step, setStep] = useState<Step>("upload");
  const [hasResults, setHasResults] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [careerConfirmed,setCareerConfirmed]=useState(false);
  const [manualReview,setManualReview]=useState(false);
  const [evidence,setEvidence]=useState<EvidenceRecord[]>([]);
  const [age,setAge]=useState<ConfirmedAge|null>(null);
  const profileAge=currentAge(age,today);
  const [answers, setAnswers] = useState<Answers | null>(null);
  const [savedAnswers,setSavedAnswers]=useState<Answers|null>(null);
  const effective = useMemo(() => profile ? answers ?? defaultAnswers(profile) : null, [profile, answers]);
  useEffect(() => { document.documentElement.lang = "en"; window.scrollTo({ top: 0 }); }, [step, view]);
  const restartProfile = () => { setHasResults(false); setProfile(null); setCareerConfirmed(false); setManualReview(false); setAnswers(null); setSavedAnswers(null); setStep("upload"); };
  const startManual=()=>{setProfile(blankJobProfile());setCareerConfirmed(false);setManualReview(true);setAnswers(null);setSavedAnswers(null);setStep("review");};
  const editCareer=()=>{setView("jobs");if(profile){setStep("review");}else startManual();};
  const reset = () => { try{if(!clearPolicyCheckpoint(window.localStorage))window.alert("Saved policy checkpoint could not be deleted. Clear browser site data manually.");}catch{window.alert("Browser storage unavailable. Clear site data manually if needed.");} try{if(!clearTrackerVault(window.localStorage))window.alert("Saved encrypted tracker could not be deleted. Clear browser site data manually.");}catch{window.alert("Tracker storage unavailable.");} setTracker(t=>blankTracker(t.epoch+1)); setNotices([]); setView("jobs"); setResetKey(k=>k+1); setAge(null); setEvidence([]); setPolicy(p=>blankPolicyLedger(p.epoch+1)); restartProfile(); };
  return <LangContext.Provider value="en">
    <header className="top"><div className="wrap top-in">
      <strong>Global Mobility Radar</strong>
      <span className="muted">Local preview</span>
      <nav aria-label="Application sections" className="section-nav">{(Object.keys(SECTIONS) as View[]).map(v=><button type="button" className="btn small" key={v} aria-label={SECTIONS[v]} aria-pressed={view===v} onClick={()=>setView(v)}>{SECTIONS[v]}{v==="policy"&&policyInbox>0?" ("+policyInbox+")":v==="operations"&&unread>0?" ("+unread+")":""}</button>)}</nav>
      <button type="button" className="btn ghost small" onClick={()=>{if(window.confirm("Clear all local profiles, job imports, immigration scenarios, application tracker and policy review history?"))reset();}}>Clear all local data</button>
    </div></header>
    <main className="wrap main">
      <div key={"jobs-"+resetKey} hidden={view!=="jobs"}>
      {step === "upload" && <Upload onManual={startManual} onRead={(_text, p) => { setProfile(p); setCareerConfirmed(false);setManualReview(false);setAnswers(null);setSavedAnswers(null); setStep("review"); }}/>}
      {step === "review" && profile && <Review profile={profile} manual={manualReview} onBack={hasResults?()=>setStep("results"):restartProfile} onNext={p=>{setProfile(p);setCareerConfirmed(true);setManualReview(false);setStep("interview");}}/>}
      {step === "interview" && profile && effective && <Interview profile={profile} answers={effective} onChange={setAnswers} onBack={() => setStep("review")} onNext={() => {setAnswers(effective); setSavedAnswers(effective); setHasResults(true); setStep("results");}}/>}
      {/* Keep the imported snapshot, filters and screening work while editing preferences. */}
      {hasResults && profile && effective && <div hidden={step!=="results"}><LocalResults profile={profile} answers={effective} onBack={() => setStep("interview")} onEditProfile={()=>setStep("review")} onShortlist={shortlist} isShortlisted={shortlisted}/></div>}
      </div>
      <div key={"profile-"+resetKey} hidden={view!=="profile"}><ProfilePanel evidence={evidence} onEvidence={setEvidence} profile={careerConfirmed?profile:null} answers={careerConfirmed?savedAnswers:null} age={age} today={today} onAge={setAge} onCareer={editCareer} onPreferences={()=>{setView("jobs");setStep("interview");}}/></div>
      <div key={"radar-"+resetKey} hidden={view!=="radar"}><RouteRadar today={today} onOpen={setView} ledger={policy} onShortlist={shortlist} isShortlisted={shortlisted}/></div>
      <div key={"tracker-"+resetKey} hidden={view!=="tracker"}><ApplicationTracker today={today} tracker={tracker} setTracker={setTracker} onRadar={()=>setView("radar")} onJobs={()=>setView("jobs")}/></div>
      <div key={"policy-"+resetKey} hidden={view!=="policy"}><PolicyReviewPanel today={today} ledger={policy} setLedger={setPolicy}/></div>
      <div key={"operations-"+resetKey} hidden={view!=="operations"}><PolicyOperationsPanel today={today} ledger={policy} setLedger={setPolicy} history={notices} setHistory={setNotices} onReview={()=>setView("policy")} applicationChecks={trackerDueChecks(tracker,today)} onTracker={()=>setView("tracker")}/></div>
      <div key={"canada-"+resetKey} hidden={view!=="canada"}><CanadaPanel today={today} profileAge={profileAge} evidence={evidence} policy={policy}/></div>
      <div key={"australia-"+resetKey} hidden={view!=="australia"}><AustraliaPanel today={today} profileAge={profileAge} evidence={evidence} policy={policy}/></div>
      <div key={"germany-"+resetKey} hidden={view!=="germany"}><GermanyPanel today={today} profileAge={profileAge} evidence={evidence} policy={policy}/></div>
      <div key={"ireland-"+resetKey} hidden={view!=="ireland"}><EuropePermitPanel country="ireland" today={today} profileAge={profileAge} policy={policy}/></div>
      <div key={"netherlands-"+resetKey} hidden={view!=="netherlands"}><EuropePermitPanel country="netherlands" today={today} profileAge={profileAge} policy={policy}/></div>
      <div key={"newzealand-"+resetKey} hidden={view!=="newzealand"}><EuropePermitPanel country="newzealand" today={today} profileAge={profileAge} policy={policy}/></div>
      <div key={"uk-"+resetKey} hidden={view!=="uk"}><EuropePermitPanel country="uk" today={today} profileAge={profileAge} policy={policy}/></div>
      <div key={"hongkong-"+resetKey} hidden={view!=="hongkong"}><EuropePermitPanel country="hongkong" today={today} profileAge={profileAge} policy={policy}/></div>
      <div key={"singapore-"+resetKey} hidden={view!=="singapore"}><EuropePermitPanel country="singapore" today={today} profileAge={profileAge} policy={policy}/></div>
      <div key={"uae-"+resetKey} hidden={view!=="uae"}><EuropePermitPanel country="uae" today={today} profileAge={profileAge} policy={policy}/></div>
      <div key={"us-"+resetKey} hidden={view!=="us"}><EuropePermitPanel country="us" today={today} profileAge={profileAge} policy={policy}/></div>
    </main>
    <footer className="wrap foot">
      <p>Local preview: profile, imported job data and immigration scenarios are held in memory, cleared on reload or Clear all local data. Policy history is also in memory unless you explicitly save a policy-only checkpoint; Clear all local data deletes that checkpoint. Application tracking is session-only unless explicitly encrypted and saved; global clear deletes that checkpoint too. No profile uploads, paid features or accounts. Opening a link visits an external site.</p>
      <p>Not immigration advice. Inherited reference data and matching signals require independent verification. Based on MIT-licensed <a href="https://github.com/talls2/visa-job-atlas" target="_blank" rel="noopener noreferrer">Visa Job Atlas</a>.</p>
    </footer>
  </LangContext.Provider>;
}
