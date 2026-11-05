import { useMemo } from "react";
import { useT } from "../i18n";
import { skillLabel } from "../data";
import type { MatchesResult } from "../api";
import { skillGaps } from "../engine/jobs";
import type { Plan } from "../engine/plan";
import type { Market, Profile, Track } from "../types";
import { useAccount } from "./Account";
import Paywall from "./Paywall";

/**
 * "Become indispensable": the skills your top countries' employers ask for most
 * that your CV doesn't show, ranked, with the certs and projects that prove them.
 * Free readers see the first gap in full; the rest is behind the paywall.
 */
export default function Indispensable(props: { plan: Plan; track: Track; market: Market; profile: Profile; result: MatchesResult | null }) {
  const { t, tx } = useT();
  const pro = useAccount().tier === "pro";
  // The same countries the plan ranks gaps over, so both pages agree on #1.
  const codes = useMemo(() => props.plan.top.map((f) => f.country.code), [props.plan]);
  const gaps = useMemo(() => skillGaps(props.market, codes, props.track.id, props.profile.skills, 10), [props.market, codes, props.track.id, props.profile.skills]);
  const roles = codes.reduce((n, c) => n + (props.market.cells[`${c}|${props.track.id}`]?.jobs ?? 0), 0);
  const core = new Set(props.track.coreSkills);
  const inMatches = (id: string) => props.result?.matches.filter((m) => m.missingSkills.includes(id)).length ?? 0;
  const shown = pro ? gaps : gaps.slice(0, 1);

  if (!gaps.length) return <p className="note">{t("noGaps")}</p>;
  return (
    <div className="indispensable">
      <p>{t("indispensableIntro")}</p>
      <ol className="gaps">
        {shown.map((g, i) => (
          <li key={g.id} className="card gap">
            <span className="rank mono">#{i + 1}</span>
            <div>
              <h3>{skillLabel(g.id)}{core.has(g.id) && <span className="chip">{t("coreSkill")}</span>}</h3>
              <p className="muted small">
                <b className="mono">{g.count}</b> {t("inPostings")}
                {roles > 0 && <> · <b className="mono">{Math.round((g.count / roles) * 100)}%</b> {t("ofRolesTop")}</>}
                {pro && inMatches(g.id) > 0 && <> · {t("inYourMatches")}: <b className="mono">{inMatches(g.id)}</b></>}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {!pro && gaps.length > 1 && (
        <>
          <ol className="gaps locked" aria-hidden="true">
            {gaps.slice(1, 5).map((g, i) => (
              <li key={g.id} className="card gap">
                <span className="rank mono">#{i + 2}</span>
                <div><h3>██████████</h3><p className="muted small"><b className="mono">{g.count}</b> {t("inPostings")}</p></div>
              </li>
            ))}
          </ol>
          <Paywall title={<><b className="mono">{gaps.length - 1}</b> {t("moreGaps")}</>} body={t("indispensablePaywall")} />
        </>
      )}
      {pro && (
        <div className="grid2">
          <div className="card">
            <h3>{t("certsToGet")}</h3>
            <ul>{props.plan.certs.map((c) => <li key={c.name}><a href={c.url} target="_blank" rel="noopener">{c.name}</a> ({c.provider}, <span className="fare">{c.cost}</span>): {tx(c.why)}</li>)}</ul>
          </div>
          <div className="card">
            <h3>{t("proveIt")}</h3>
            <ul>{props.track.projects.map((p, i) => <li key={i}><b>{tx(p.title)}</b>: {tx(p.description)}</li>)}</ul>
          </div>
        </div>
      )}
    </div>
  );
}
