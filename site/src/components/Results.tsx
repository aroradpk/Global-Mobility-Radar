import { useEffect, useMemo, useState } from "react";
import { countryName, languageName, useT, type StringKey } from "../i18n";
import { COUNTRIES, KNOWLEDGE_AS_OF, TRACK, skillLabel, type Dataset } from "../data";
import { deleteApplication, fetchMatches, getAlerts, listApplications, saveApplication, setAlerts, type Application, type MatchesResult } from "../api";
import { rankCountries, type CountryFit } from "../engine/countries";
import type { JobMatch } from "../engine/jobs";
import { buildPlan, type ItemKind, type Plan } from "../engine/plan";
import { download, planToMarkdown } from "../export";
import { flightNo, hub, money } from "../travel";
import type { Answers, Lang, Market, Profile, Route, Track } from "../types";
import { Barcode, Plane } from "./Icons";
import { useAccount } from "./Account";
import Indispensable from "./Indispensable";
import KitPanel from "./KitPanel";
import Tracker from "./Tracker";
import Paywall from "./Paywall";

type Tab = "overview" | "countries" | "jobs" | "plan" | "grow" | "tracker";
// Countries shown in full to free readers; the rest are listed but closed.
const FREE_COUNTRIES = 3;
const EMPTY_MARKET: Market = { generatedAt: "", cells: {} };

export default function Results(props: { cvText: string; profile: Profile; answers: Answers; data: Dataset | null; dataError: string; onBack: () => void }) {
  const { t, lang } = useT();
  const [tab, setTab] = useState<Tab>("overview");
  const account = useAccount();
  const pro = account.tier === "pro";
  const market = props.data?.market ?? EMPTY_MARKET;
  const track = TRACK.get(props.answers.family)!;

  const registers = useMemo(() => new Set((props.data?.meta.registers ?? []).map((r) => r.country).filter(Boolean)), [props.data]);
  const fits = useMemo(() => rankCountries(COUNTRIES, market, props.profile, props.answers, registers), [market, props.profile, props.answers, registers]);
  const order = fits.map((f) => f.country.code).join(",");
  const [result, setResult] = useState<MatchesResult | null>(null);
  const [matchError, setMatchError] = useState(false);
  useEffect(() => {
    if (!props.data) return;
    const ctl = new AbortController();
    setMatchError(false);
    fetchMatches(props.profile, props.answers, order ? order.split(",") : [], ctl.signal).then(setResult, () => {
      if (!ctl.signal.aborted) setMatchError(true);
    });
    return () => ctl.abort();
    // Signing in or upgrading changes what the API returns, so ask again.
  }, [props.data, props.profile, props.answers, order, account.userId, account.tier]);
  const matches = result?.matches ?? [];

  // Pro: the tracker and the alert setting live on the account.
  const [apps, setApps] = useState<Application[] | null>(null);
  const [alerts, setAlertsOn] = useState<boolean | null>(null);
  const [kitFor, setKitFor] = useState<JobMatch | null>(null);
  useEffect(() => {
    if (!pro) return setApps(null);
    listApplications().then(setApps, () => setApps([]));
    getAlerts().then((r) => setAlertsOn(r.enabled), () => setAlertsOn(false));
  }, [pro, account.userId]);
  const saveApp = async (a: Application) => {
    setApps((xs) => [{ ...a, updated_at: new Date().toISOString() }, ...(xs ?? []).filter((x) => x.job_id !== a.job_id)]);
    await saveApplication(a);
  };
  const deleteApp = async (jobId: string) => {
    setApps((xs) => (xs ?? []).filter((x) => x.job_id !== jobId));
    await deleteApplication(jobId);
  };
  const toggleAlerts = async (on: boolean) => {
    setAlertsOn(on);
    await setAlerts(on, props.profile, props.answers, order ? order.split(",") : []).catch(() => setAlertsOn(!on));
  };
  const jobActions: JobActions = {
    kit: account.enabled ? (m) => (account.userId ? setKitFor(m) : account.openSignIn()) : undefined,
    saved: new Set((apps ?? []).map((a) => a.job_id)),
    save: pro ? (m) => saveApp({ job_id: m.job.id, job_title: m.job.title, company: m.job.company, url: m.job.url, status: "saved", notes: "" }).catch(() => {}) : undefined,
    alerts: pro ? alerts : null,
    toggleAlerts,
  };
  const plan = useMemo(() => buildPlan(track, fits, market, props.profile, props.answers, skillLabel), [track, fits, market, props.profile, props.answers]);
  const origin = props.answers.livesIn ? hub(props.answers.livesIn) : "HOME";

  const tabs: [Tab, StringKey][] = [["overview", "tabOverview"], ["countries", "tabCountries"], ["jobs", "tabJobs"], ["plan", "tabPlan"], ["grow", "tabGrow"], ["tracker", "tabTracker"]];
  return (
    <section>
      {!props.data && !props.dataError && <p className="note">{t("loadingData")}</p>}
      {props.dataError && <p className="error">{t("dataError")}</p>}
      {matchError && <p className="error">{t("matchesError")}</p>}
      <nav className="tabs" role="tablist">
        {tabs.map(([id, k]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>{t(k)}</button>
        ))}
      </nav>
      {tab === "overview" && <Overview plan={plan} fits={fits} total={result?.total ?? 0} origin={origin} pro={pro} onTab={setTab} />}
      {tab === "countries" && <Countries fits={fits} origin={origin} track={track} pro={pro} />}
      {tab === "jobs" && (result ? <Jobs result={result} fits={fits} actions={jobActions} /> : !matchError && <p className="note">{t("loadingMatches")}</p>)}
      {tab === "plan" && <PlanView plan={plan} pro={pro} />}
      {tab === "tracker" && <Tracker apps={apps} onSave={saveApp} onDelete={deleteApp} />}
      {kitFor && (
        <KitPanel match={kitFor} family={props.answers.family} cvText={props.cvText} profile={props.profile} citizenships={props.answers.citizenships} onClose={() => setKitFor(null)} />
      )}
      {tab === "grow" && <Indispensable plan={plan} track={track} market={market} profile={props.profile} result={result} />}
      <div className="nav">
        <button className="btn ghost" onClick={props.onBack}>{t("back")}</button>
        <div className="row">
          <button className="btn" disabled={!pro} title={pro ? undefined : t("proOnly")} onClick={() => download(`visa-job-atlas-plan-${lang}.md`, planToMarkdown(plan, matches, lang))}>
            {t("download")}{!pro && " · Pro"}
          </button>
          <button className="btn" onClick={() => window.print()}>{t("print")}</button>
        </div>
      </div>
      <p className="muted small">{t("knowledgeAsOf")}: {KNOWLEDGE_AS_OF}</p>
    </section>
  );
}

function floorText(r: Route | undefined, lang: Lang, t: (k: StringKey) => string) {
  if (!r?.salaryMin) return null;
  const per = r.salaryMin.period.startsWith("month") ? t("perMonth") : r.salaryMin.period.startsWith("year") ? t("perYear") : `/${r.salaryMin.period}`;
  return <span className="fare">{money(r.salaryMin.amount, r.salaryMin.currency, lang)}<small>{per}</small></span>;
}

function Overview({ plan, fits, total, origin, pro, onTab }: { plan: Plan; fits: CountryFit[]; total: number; origin: string; pro: boolean; onTab: (t: Tab) => void }) {
  const { t, tx, lang } = useT();
  const best = fits[0];
  const thisWeek = plan.phases[0].items.slice(0, 5);
  const firstRoute = best && !best.freeMovement ? best.country.routes[0] : undefined;
  return (
    <div className="overview">
      <div className="board" role="region" aria-label={t("departures")}>
        <div className="board-title">
          <span>{t("departures")}</span>
          <Plane className="plane" size={22} />
        </div>
        <div className="deps">
          {fits.slice(0, 6).map((f, i) => {
            const route = f.freeMovement ? "EU free movement" : tx(f.country.routes[0]?.name ?? null);
            return (
              <button key={f.country.code} className="dep" onClick={() => onTab("countries")}>
                <span className="dcode">{hub(f.country.code)}</span>
                <span>
                  <span className="dname">{countryName(f.country.code, lang)}</span>
                  <span className="droute">{route}</span>
                </span>
                <span className="droles"><b>{f.freeMovement ? f.demand.jobs : f.demand.reachable}</b>{t("rolesLbl")}</span>
                <span className={"st " + (f.freeMovement ? "go" : i === 0 ? "now" : "visa")}>
                  {f.freeMovement ? t("stNoVisa") : i === 0 ? t("stBoarding") : t("stVisa")}
                </span>
              </button>
            );
          })}
        </div>
        <p className="board-foot">{t("boardNote")}</p>
      </div>

      {best && (
        <div className="ticket lead-pass">
          <div className="main-part">
            <div className="pass-head"><span>{t("overviewLead")}</span><span>{flightNo(best.country.code)}</span></div>
            <div className="trip">
              <span>{origin}<small>{t("fromLbl")}</small></span>
              <span className="dash"><Plane className="plane" size={22} /></span>
              <span>{hub(best.country.code)}<small>{tx(best.country.name)}</small></span>
            </div>
            <ul>{best.reasons.slice(0, 4).map((r, i) => <li key={i}>{tx(r.text)}</li>)}</ul>
            {firstRoute && <p><b>{tx(firstRoute.name)}</b>: {tx(firstRoute.summary)}</p>}
          </div>
          <div className="stub">
            <span className="label">{t("salaryFloor")}</span>
            {floorText(firstRoute, lang, t) ?? <span className="stamp good">{best.freeMovement ? t("stNoVisa") : "—"}</span>}
            <span className="label">{t("rolesLbl")}</span>
            <span className="fare" style={{ color: "var(--navy)" }}>{best.freeMovement ? best.demand.jobs : best.demand.reachable}</span>
            <Barcode seed={best.country.code + origin} />
          </div>
        </div>
      )}

      <div className="grid2">
        <div className="card">
          <h3>{t("thisWeek")}</h3>
          <ol>{thisWeek.map((it, i) => <li key={i}>{tx(it.text)}</li>)}</ol>
          <button className="btn small" onClick={() => onTab("jobs")}>{total} {t("matches")} →</button>
        </div>
        <div className="card">
          <h3>{t("firstRoles")}</h3>
          <p>{tx(plan.track.firstSponsoredRoles)}</p>
          {plan.gaps.length > 0 && (
            <>
              <h3>{t("gaps")}</h3>
              <div className="chips">
                {plan.gaps.slice(0, pro ? 6 : 1).map((g) => <span key={g.id} className="chip">{skillLabel(g.id)}</span>)}
                {!pro && plan.gaps.length > 1 && <button className="chip locked-chip" onClick={() => onTab("grow")}>+{plan.gaps.length - 1} Pro</button>}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Countries({ fits, origin, track, pro }: { fits: CountryFit[]; origin: string; track: Track; pro: boolean }) {
  const { t, tx, lang } = useT();
  const open = pro ? fits : fits.slice(0, FREE_COUNTRIES);
  const closed = pro ? [] : fits.slice(FREE_COUNTRIES);
  return (
    <div className="countries">
      {open.map((f, i) => {
        const r0 = f.country.routes[0];
        return (
          <details key={f.country.code} className="ticket country" open={i === 0}>
            <summary>
              <span className="main-part head">
                <span className="code">{hub(f.country.code)}</span>
                <span>
                  <span className="cname">{tx(f.country.name)}</span>
                  <span className="meta">{" · "}{origin} → {hub(f.country.code)}{" · "}{flightNo(f.country.code, i)}</span>
                  <br />
                  {f.freeMovement ? <span className="stamp good">{t("noVisa")}</span> : r0 && <span className="meta">{tx(r0.name)} {floorText(r0, lang, t)}</span>}
                </span>
                <span className="chev" aria-hidden="true">›</span>
              </span>
              <span className="stub">
                <span className="rank">{t("rankLbl")} #{i + 1}</span>
                <span className="score">{f.score}</span>
                <span className="label">{t("fitLbl")}</span>
              </span>
            </summary>
            <div className="main-part" style={{ paddingTop: 0 }}>
              <div className="country-body">
                <div>
                  {track.countryNotes?.[f.country.code] && (
                    <div className="field-note">
                      <h4>{tx(track.name)}: {t("fieldNote")}</h4>
                      <p>{tx(track.countryNotes[f.country.code])}</p>
                    </div>
                  )}
                  <h4>{t("whyThis")}</h4>
                  <ul className="reasons">
                    {f.reasons.map((r, j) => (
                      <li key={j} className={r.delta >= 0 ? "pos" : "neg"}><span className="num">{r.delta > 0 ? "+" : ""}{r.delta}</span> {tx(r.text)}</li>
                    ))}
                  </ul>
                  {f.country.catches.length > 0 && (<><h4>{t("catches")}</h4><ul>{f.country.catches.map((c, j) => <li key={j}>{tx(c)}</li>)}</ul></>)}
                  {f.country.recentChanges.length > 0 && (<><h4>{t("recent")}</h4><ul>{f.country.recentChanges.map((c, j) => <li key={j}>{tx(c)}</li>)}</ul></>)}
                </div>
                <div>
                  <h4>{t("routes")}</h4>
                  {f.country.routes.map((r) => (
                    <div key={r.id} className="route-item">
                      <div className="route-top"><b>{tx(r.name)}</b>{floorText(r, lang, t)}</div>
                      <p>{tx(r.summary)}</p>
                      <p className="muted small">
                        {r.degree === "required" ? t("degreeReq") : r.degree === "or-experience" ? t("degreeOrExp") : t("degreeNo")}.{" "}
                        {r.processing && tx(r.processing)}{" "}
                        {r.source && <a href={r.source} target="_blank" rel="noopener">{t("sources")}</a>}
                      </p>
                    </div>
                  ))}
                  <h4>{t("residence")}</h4>
                  <p>{tx(f.country.residencePath)}</p>
                  {f.country.language && (<><h4>{t("languagePlan")}: {tx(f.country.language.name)}</h4><p>{tx(f.country.language.note)}</p></>)}
                  <h4>{t("cvTips")}</h4>
                  <p>{tx(f.country.cvTips)}</p>
                  {f.country.jobBoards.length > 0 && (
                    <p><b>{t("jobBoards")}:</b> {f.country.jobBoards.map((b, j) => <span key={b.url}>{j > 0 && " · "}<a href={b.url} target="_blank" rel="noopener">{b.name}</a></span>)}</p>
                  )}
                  {f.country.sponsorRegister && <p><a href={f.country.sponsorRegister.url} target="_blank" rel="noopener">{t("sponsorReg")}: {tx(f.country.sponsorRegister.name)}</a></p>}
                </div>
              </div>
            </div>
          </details>
        );
      })}
      {closed.length > 0 && (
        <>
          <div className="closed-countries">
            {closed.slice(0, 4).map((f, i) => (
              <div key={f.country.code} className="ticket country closed">
                <span className="main-part head">
                  <span className="code">{hub(f.country.code)}</span>
                  <span className="cname">{tx(f.country.name)}</span>
                </span>
                <span className="stub">
                  <span className="rank">{t("rankLbl")} #{i + 1 + FREE_COUNTRIES}</span>
                  <span className="score">{f.score}</span>
                </span>
              </div>
            ))}
          </div>
          <Paywall title={<><b className="mono">{closed.length}</b> {t("moreCountries")}</>} body={t("countriesPaywall")} />
        </>
      )}
    </div>
  );
}

interface JobActions {
  kit?: (m: JobMatch) => void;
  saved: Set<string>;
  save?: (m: JobMatch) => void;
  /** null: not Pro, so no alert switch. */
  alerts: boolean | null;
  toggleAlerts: (on: boolean) => void;
}

function Jobs({ result, fits, actions }: { result: MatchesResult; fits: CountryFit[]; actions: JobActions }) {
  const { t, lang } = useT();
  const [country, setCountry] = useState("");
  const [showBlocked, setShowBlocked] = useState(false);
  const [limit, setLimit] = useState(40);
  const matches: JobMatch[] = result.matches;
  const shown = matches.filter((m) => (showBlocked || !m.languageBlock.length) && (!country || m.job.countries.includes(country)));
  const lockedView = result.lockedCount > 0;
  return (
    <div>
      <div className="filters row">
        <label>
          {t("filterCountry")}{" "}
          <select id="job-country" value={country} onChange={(e) => setCountry(e.target.value)}>
            <option value="">{t("allCountries")}</option>
            {fits.slice(0, 8).map((f) => <option key={f.country.code} value={f.country.code}>{hub(f.country.code)} · {countryName(f.country.code, lang)}</option>)}
          </select>
        </label>
        <label className="check"><input type="checkbox" checked={showBlocked} onChange={(e) => setShowBlocked(e.target.checked)} /> {t("showLangBlocked")}</label>
        {actions.alerts !== null && (
          <label className="check"><input type="checkbox" checked={actions.alerts} onChange={(e) => actions.toggleAlerts(e.target.checked)} /> {t("alertsToggle")}</label>
        )}
      </div>
      <p className="muted"><b className="mono">{lockedView ? result.total : shown.length}</b> {t("matches")}</p>
      <div className="joblist">
        {shown.slice(0, limit).map((m) => {
          const good = m.noVisaNeeded || ["explicit", "register", "employer-yes"].includes(m.job.visa);
          const stampCls = good ? "good" : m.openMarket || m.job.visa === "conditional" || m.job.visa === "relocation" ? "warn" : "plain";
          const where = m.job.countries.length ? m.job.countries.map(hub).join(" · ") : "REMOTE";
          return (
            <article key={m.job.id} className="ticket job">
              <div className="main-part">
                <a className="job-title" href={m.job.url} target="_blank" rel="noopener">{m.job.title}</a>
                <p className="muted">
                  {m.job.company}{" · "}{m.job.location || m.job.countries.map((c) => countryName(c, lang)).join(", ")}
                  {/* Arbeitnow's API terms ask for a link back. */}
                  {m.job.id.startsWith("feed:arbeitnow:") && <>{" · "}<a href="https://www.arbeitnow.com/" target="_blank" rel="noopener">via Arbeitnow</a></>}
                </p>
                <div className="chips">
                  <span className={"stamp " + stampCls}>
                    {m.noVisaNeeded ? t("noVisa") : m.openMarket ? t("visa_open") : t(("visa_" + m.job.visa) as StringKey)}
                  </span>
                  {m.languageBlock.map((l) => <span key={l} className="badge bad">{languageName(l, lang)}</span>)}
                  {m.matchedSkills.slice(0, 5).map((s) => <span key={s} className="chip have">{skillLabel(s)}</span>)}
                  {m.missingSkills.slice(0, 3).map((s) => <span key={s} className="chip miss">{skillLabel(s)}</span>)}
                </div>
                {(m.job.posted || m.job.salary) && (
                  <p className="muted small">
                    {m.job.posted && <>{t("posted")}: <span className="mono">{m.job.posted}</span></>}
                    {m.job.salary && <> · <span className="fare">{m.job.salary}</span></>}
                  </p>
                )}
                {(actions.kit || actions.save) && (
                  <div className="row job-actions">
                    {actions.kit && <button className="btn small primary" onClick={() => actions.kit!(m)}>{t("kitButton")}</button>}
                    {actions.save && (
                      <button className="btn small" disabled={actions.saved.has(m.job.id)} onClick={() => actions.save!(m)}>
                        {actions.saved.has(m.job.id) ? t("savedJob") : t("saveJob")}
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="stub">
                <span className="lbl">{t("toLbl")}</span>
                <span className="seat" title={where}>{where.length > 7 ? where.slice(0, 3) + "+" : where}</span>
                <span className="lbl">{t("fitLbl")} <b className="mono">{m.score}</b></span>
              </div>
            </article>
          );
        })}
      </div>
      {shown.length > limit && <button className="btn" onClick={() => setLimit(limit + 40)}>+40</button>}
      {lockedView && (
        <>
          <div className="joblist locked" aria-hidden="true">
            {result.locked.slice(0, 6).map((m, i) => (
              <article key={i} className="ticket job">
                <div className="main-part">
                  <span className="job-title">{t("lockedRow")} ██████████████</span>
                  <p className="muted">████████ · {m.countries.length ? m.countries.map((c) => countryName(c, lang)).join(", ") : "Remote"}</p>
                </div>
                <div className="stub">
                  <span className="lbl">{t("toLbl")}</span>
                  <span className="seat">{m.countries.length ? hub(m.countries[0]) : "REMOTE"}</span>
                  <span className="lbl">{t("fitLbl")} <b className="mono">{m.score}</b></span>
                </div>
              </article>
            ))}
          </div>
          <Paywall title={<><b className="mono">{result.lockedCount}</b> {t("lockedTitle")}</>} body={t("lockedBody")} />
        </>
      )}
    </div>
  );
}

const KIND: Record<ItemKind, string> = {
  profile: "ID", skill: "SK", cert: "CRT", project: "PRJ", language: "LNG", network: "NET", apply: "APP", visa: "VSA",
};

// Free readers get the first leg of the plan; the next one fades out under the paywall.
function PlanView({ plan, pro }: { plan: Plan; pro: boolean }) {
  const { t, tx } = useT();
  const phases = pro ? plan.phases : plan.phases.slice(0, 2);
  return (
    <div className="plan">
      {plan.switchTip && <div className="card" style={{ marginBottom: 16 }}><h3>{t("switchTip")}</h3><p>{tx(plan.switchTip)}</p></div>}
      <div className="itinerary">
        {phases.map((ph, i) => (
          <div key={ph.id} className={"legrow" + (!pro && i > 0 ? " faded" : "")} aria-hidden={!pro && i > 0 ? true : undefined}>
            <div className="rail"><span className="dot">{i + 1}</span><span className="line" /></div>
            <div className="card leg-card">
              <div className="leg-head">
                <h3>{tx(ph.title)}</h3>
                <span className="flight">{t("legLbl")} {i + 1} · {flightNo(plan.track.id.slice(0, 2).toUpperCase(), i)}</span>
              </div>
              <ul className="items">
                {(!pro && i > 0 ? ph.items.slice(0, 2) : ph.items).map((it, j) => (
                  <li key={j}>
                    <span className="kind" aria-hidden="true">{KIND[it.kind]}</span>
                    <div>
                      <b>{tx(it.text)}</b>
                      {it.detail && <p className="muted small">{tx(it.detail)}</p>}
                      {it.url && <a className="small" href={it.url} target="_blank" rel="noopener">{it.url.replace(/^https?:\/\//, "").slice(0, 50)}</a>}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
      {!pro && <Paywall title={t("planPaywallTitle")} body={t("planPaywall")} />}
      <div className="grid2">
        {pro && <div className="card">
          <h3>{t("certsToGet")}</h3>
          <ul>{plan.certs.map((c) => <li key={c.name}><a href={c.url} target="_blank" rel="noopener">{c.name}</a> ({c.provider}, <span className="fare">{c.cost}</span>): {tx(c.why)}</li>)}</ul>
          <h3>{t("weekly")}</h3>
          <ul>{plan.weekly.map((w, i) => <li key={i}>{tx(w)}</li>)}</ul>
        </div>}
        <div className="card">
          {pro && plan.gaps.length > 0 && (
            <>
              <h3>{t("gaps")}</h3>
              <ul>{plan.gaps.map((g) => <li key={g.id}>{skillLabel(g.id)} <span className="muted mono small">({g.count} {t("inPostings")})</span></li>)}</ul>
            </>
          )}
          <h3>{t("connectionNote")}</h3>
          <blockquote>{tx(plan.connectionNote)}</blockquote>
        </div>
      </div>
    </div>
  );
}
