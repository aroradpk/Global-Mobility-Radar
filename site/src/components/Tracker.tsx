import { useState } from "react";
import { STATUSES, type Application, type AppStatus } from "../api";
import { useT, type StringKey } from "../i18n";
import { useAccount } from "./Account";
import Paywall from "./Paywall";

/** Pro: the jobs saved from the Jobs tab, with status and notes. */
export default function Tracker(props: { apps: Application[] | null; onSave: (a: Application) => Promise<void>; onDelete: (jobId: string) => Promise<void> }) {
  const { t, lang } = useT();
  const pro = useAccount().tier === "pro";
  const [failed, setFailed] = useState(false);
  if (!pro) return <Paywall title={t("trackerTitle")} body={t("trackerPaywall")} />;
  if (!props.apps) return <p className="note">{t("loadingTracker")}</p>;
  if (!props.apps.length) return <p className="note">{t("trackerEmpty")}</p>;

  const guard = (p: Promise<void>) => p.then(() => setFailed(false), () => setFailed(true));
  const counts = STATUSES.map((s) => [s, props.apps!.filter((a) => a.status === s).length] as const);
  return (
    <div className="tracker">
      <div className="chips">{counts.map(([s, n]) => <span key={s} className="chip">{t(`st_${s}` as StringKey)} <b className="mono">{n}</b></span>)}</div>
      {failed && <p className="error" role="alert">{t("trackerError")}</p>}
      <ul className="tracker-list">
        {props.apps.map((a) => (
          <li key={a.job_id} className="card">
            <div className="tracker-top">
              <div>
                {a.url ? <a className="job-title" href={a.url} target="_blank" rel="noopener">{a.job_title}</a> : <b>{a.job_title}</b>}
                <p className="muted small">
                  {a.company}
                  {a.updated_at && <> · {new Date(a.updated_at).toLocaleDateString(lang === "pt" ? "pt-BR" : "en")}</>}
                </p>
              </div>
              <select aria-label={t("statusLbl")} value={a.status} onChange={(e) => guard(props.onSave({ ...a, status: e.target.value as AppStatus }))}>
                {STATUSES.map((s) => <option key={s} value={s}>{t(`st_${s}` as StringKey)}</option>)}
              </select>
            </div>
            <textarea
              aria-label={t("notesLbl")}
              placeholder={t("notesLbl")}
              rows={2}
              defaultValue={a.notes}
              onBlur={(e) => e.target.value !== a.notes && guard(props.onSave({ ...a, notes: e.target.value }))}
            />
            <button className="btn ghost small" onClick={() => guard(props.onDelete(a.job_id))}>{t("remove")}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
