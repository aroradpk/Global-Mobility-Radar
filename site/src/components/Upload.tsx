import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n";
import { parseCv } from "../cv/parse";
import { SKILLS } from "../data";
import type { Profile } from "../types";
import { Barcode, FlightArc, Plane } from "./Icons";

export default function Upload({ onRead }: { onRead: (text: string, profile: Profile) => void }) {
  const { t } = useT();
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const reading = useRef(false);
  useEffect(()=>{mounted.current=true;return ()=>{mounted.current=false;};},[]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paste, setPaste] = useState("");
  const [over, setOver] = useState(false);

  const finish = (text: string) => {
    if (!mounted.current) return;
    if (text.length > 500000) { setError("CV text exceeds 500,000 characters"); return; }
    if (text.replace(/\s+/g, " ").trim().length < 200) {
      setError(t("cvTooShort"));
      return;
    }
    onRead(text, parseCv(text, SKILLS));
  };

  const readFile = async (file: File) => {
    setError("");
    if (file.size > 10 * 1024 * 1024) { setError("CV file exceeds 10 MiB"); return; }
    if (reading.current) return;
    reading.current=true;
    setBusy(true);
    try {
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const { pdfToText } = await import("../cv/pdf");
        finish(await pdfToText(file));
      } else {
        finish(await file.text());
      }
    } catch (e) {
      if(mounted.current) setError(String(e));
    } finally {
      reading.current=false;
      if(mounted.current) setBusy(false);
    }
  };

  return (
    <section className="hero">
      <FlightArc from="YOU" to="???" />
      <span className="eyebrow">{t("heroEyebrow")}</span>
      <h1>{t("heroTitle")} <span className="grad">{t("heroTitleGrad")}</span></h1>
      <p className="lede">{t("tagline")}</p>

      <div
        className={"ticket pass" + (over ? " over" : "")}
        role="button"
        tabIndex={0}
        aria-label={t("dropCv")}
        aria-disabled={busy}
        aria-busy={busy}
        onClick={() => { if (!busy) input.current?.click(); }}
        onKeyDown={(e) => {
          if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            if (!busy) input.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const f = e.dataTransfer.files[0];
          if (f && !busy) void readFile(f);
        }}
      >
        <div className="main-part">
          <div className="pass-head">
            <span>{t("passTitle")}</span>
            <span>GMR PREVIEW</span>
          </div>
          <div className="codes">
            <span>YOU</span>
            <span className="line"><Plane className="plane" size={22} /></span>
            <span>???</span>
          </div>
          <div className="fields">
            <div className="field"><b>{t("passenger")}</b><span>{t("yourCv")}</span></div>
            <div className="field"><b>{t("toLbl")}</b><span>{t("anywhere")}</span></div>
            <div className="field"><b>{t("classLbl")}</b><span>{t("classTech")}</span></div>
          </div>
          <div className="row">
            <span className="pass-cta">{busy ? t("reading") : t("choosePdf")}</span>
            <span className="small" style={{ opacity: 0.85 }}>{t("orDrop")}</span>
          </div>
        </div>
        <div className="stub">
          <span className="label">{t("gateLbl")}</span>
          <span className="gate">PDF</span>
          <Barcode seed="VJA-CHECKIN" />
          <span className="label">{t("checkIn")}</span>
        </div>
        <input
          ref={input}
          type="file"
          accept="application/pdf,.pdf,.txt,.md"
          hidden
          disabled={busy}
          onClick={e => e.stopPropagation()}
          onChange={e => {
            const file = e.currentTarget.files?.[0];
            e.currentTarget.value = "";
            if (file && !busy) void readFile(file);
          }}
        />
      </div>

      <p className="privacy">🔒 {t("privacy")}</p>
      <details className="paste">
        <summary>{t("orPaste")}</summary>
        <label htmlFor="cv-paste">CV text</label>
        <textarea maxLength={500000} id="cv-paste" value={paste} onChange={(e) => setPaste(e.target.value)} rows={10} />
        <button className="btn primary" disabled={busy || !paste.trim()} onClick={() => {if(!reading.current)finish(paste);}}>
          {t("readCv")}
        </button>
      </details>
      {error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
