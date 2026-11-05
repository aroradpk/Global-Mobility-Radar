import { useEffect, useRef, useState } from "react";
import { ApiError, generateKit, type Kit } from "../api";
import { skillLabel } from "../data";
import type { JobMatch } from "../engine/jobs";
import { download } from "../export";
import { useT, type StringKey } from "../i18n";
import type { Profile } from "../types";
import { useAccount } from "./Account";
import Markdown from "./Markdown";

type View = "cv" | "letter" | "form" | "check" | "notes";

const ERRORS: Record<string, StringKey> = {
  pro_only: "kitSampleUsed",
  monthly_limit: "kitLimit",
  kit_failed: "kitFailed",
  posting_needed: "kitPasteNeeded",
};

/** Writes (or shows) the application kit for one job, in a dialog. */
export default function KitPanel(props: { match: JobMatch; family: string; cvText: string; profile: Profile; citizenships: string[]; onClose: () => void }) {
  const { t, lang } = useT();
  const a = useAccount();
  const ref = useRef<HTMLDialogElement>(null);
  const [posting, setPosting] = useState("");
  const [paste, setPaste] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<StringKey | null>(null);
  const [kit, setKit] = useState<Kit | null>(null);
  const [view, setView] = useState<View>("cv");
  const [copied, setCopied] = useState("");
  const job = props.match.job;

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const write = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await generateKit({
        jobId: job.id, family: props.family, cvText: props.cvText, profile: props.profile,
        citizenships: props.citizenships, lang, posting: paste ? posting : undefined,
      });
      setKit(res.kit);
    } catch (e) {
      const code = e instanceof ApiError ? e.code : "";
      if (code === "posting_needed") setPaste(true);
      const status = e instanceof ApiError ? e.status : 0;
      setError(ERRORS[code] ?? (status === 503 ? "kitsSoon" : status === 401 ? "signInError" : "kitFailed"));
    } finally {
      setBusy(false);
    }
  };

  const copy = (key: string, text: string) =>
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 1500);
    }, () => {});
  const file = (suffix: string) => `${job.company}-${job.title}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) + suffix;
  const CopyBtn = ({ k, text }: { k: string; text: string }) => (
    <button className="btn small" onClick={() => copy(k, text)}>{copied === k ? t("copied") : t("copy")}</button>
  );

  const views: [View, StringKey][] = [["cv", "kitCv"], ["letter", "kitLetter"], ["form", "kitForm"], ["check", "kitCheck"], ["notes", "kitNotes"]];
  return (
    <dialog ref={ref} className="kit-dialog" onClose={props.onClose} aria-labelledby="kit-title">
      <div className="kit-head">
        <div>
          <p className="muted small">{t("kitTitle")}</p>
          <h3 id="kit-title">{job.title}</h3>
          <p className="muted">{job.company}</p>
        </div>
        <button className="btn ghost small" onClick={() => { ref.current?.close(); props.onClose(); }}>{t("close")}</button>
      </div>

      {!kit && (
        <div className="kit-intro">
          {!props.cvText ? (
            <p className="error">{t("kitNeedsCv")}</p>
          ) : (
            <>
              <p>{t("kitIntro")}</p>
              <p className="muted small">🔒 {t("kitPrivacy")}</p>
              {a.tier !== "pro" && <p className="muted small">{t("kitFreeSample")}</p>}
              {paste ? (
                <label>
                  {t("kitPasteLabel")}
                  <textarea id="kit-posting" rows={8} value={posting} onChange={(e) => setPosting(e.target.value)} />
                </label>
              ) : (
                <button className="linkish small" onClick={() => setPaste(true)}>{t("kitPasteOwn")}</button>
              )}
              <div className="row">
                <button className="btn primary" disabled={busy || (paste && posting.trim().length < 200)} onClick={write}>
                  {busy ? t("kitWriting") : t("kitWrite")}
                </button>
                <a className="btn ghost" href={job.url} target="_blank" rel="noopener">{t("open")}</a>
              </div>
              {busy && <p className="muted small">{t("kitWait")}</p>}
            </>
          )}
          {error && <p className="error" role="alert">{t(error)}</p>}
        </div>
      )}

      {kit && (
        <>
          <nav className="tabs" role="tablist">
            {views.map(([id, k]) => (
              <button key={id} role="tab" aria-selected={view === id} onClick={() => setView(id)}>{t(k)}</button>
            ))}
          </nav>
          {view === "cv" && (
            <div className="kit-body">
              <div className="row">
                <CopyBtn k="cv" text={kit.cv_markdown} />
                <button className="btn small" onClick={() => download(file("-cv.md"), kit.cv_markdown)}>{t("downloadMd")}</button>
              </div>
              <div className="card prose kit-cv"><Markdown text={kit.cv_markdown} /></div>
            </div>
          )}
          {view === "letter" && (
            <div className="kit-body">
              <div className="row"><CopyBtn k="letter" text={kit.cover_letter} /></div>
              <div className="card kit-text">{kit.cover_letter}</div>
            </div>
          )}
          {view === "form" && (
            <ul className="kit-body kit-form">
              {kit.form_answers.map((f, i) => (
                <li key={i} className="card">
                  <b>{f.question}</b>
                  <p>{f.answer}</p>
                  <CopyBtn k={`f${i}`} text={f.answer} />
                </li>
              ))}
            </ul>
          )}
          {view === "check" && (
            <div className="kit-body grid2">
              <div className="card">
                <h3>{t("kitAts")}: <span className="mono">{kit.ats.score}%</span></h3>
                <div className="meter" aria-hidden="true"><span style={{ width: `${kit.ats.score}%` }} /></div>
                <div className="chips">
                  {kit.ats.matched.map((s) => <span key={s} className="chip have">{skillLabel(s)}</span>)}
                  {kit.ats.missing.map((s) => <span key={s} className="chip miss">{skillLabel(s)}</span>)}
                </div>
                <h4>{t("kitKeywords")}</h4>
                <p>{kit.keywords_to_mirror.join(" · ")}</p>
              </div>
              <div className="card">
                <h3>{t("kitSalary")}</h3>
                <p className="fare">
                  {kit.salary.low.toLocaleString(lang === "pt" ? "pt-BR" : "en")}–{kit.salary.high.toLocaleString(lang === "pt" ? "pt-BR" : "en")} {kit.salary.currency}
                  {kit.salary.period === "month" ? t("perMonth") : t("perYear")}
                </p>
                <p className="muted small">{kit.salary.basis}</p>
              </div>
            </div>
          )}
          {view === "notes" && (
            <ul className="kit-body card">{kit.notes.map((n, i) => <li key={i}>{n}</li>)}</ul>
          )}
        </>
      )}
    </dialog>
  );
}
