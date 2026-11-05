import { useState, type ReactNode } from "react";
import { CheckoutError, startCheckout, type PlanName } from "../api";
import { useT, type StringKey } from "../i18n";
import { useAccount } from "./Account";

/** The upgrade card shown where a free reader's view stops. Pro readers never see it. */
export default function Paywall({ title, body }: { title: ReactNode; body: string }) {
  const { t } = useT();
  const a = useAccount();
  const [busy, setBusy] = useState<PlanName | null>(null);
  const [error, setError] = useState<StringKey | null>(null);
  if (a.tier === "pro") return null;

  const buy = async (plan: PlanName) => {
    setBusy(plan);
    setError(null);
    try {
      location.href = await startCheckout(plan);
    } catch (e) {
      const status = e instanceof CheckoutError ? e.status : 0;
      setError(status === 409 ? "alreadyPro" : status === 503 ? "proSoon" : status === 401 ? "signInError" : "checkoutError");
      if (status === 409) a.refresh();
      setBusy(null);
    }
  };

  const signedIn = a.enabled && !!a.userId;
  return (
    <div className="card paywall">
      <h3>{title}</h3>
      <p>{body}</p>
      <div className="row prices">
        {(["monthly", "quarterly"] as PlanName[]).map((plan) => {
          const price = (
            <>
              <span className="fare">{t(plan === "monthly" ? "proMonthly" : "proQuarterly")}</span>
              <small>{t(plan === "monthly" ? "proMonthlyNote" : "proQuarterlyNote")}</small>
            </>
          );
          return signedIn ? (
            <button key={plan} className="price buy" disabled={!!busy} onClick={() => buy(plan)}>
              {price}
              <span className="cta">{busy === plan ? t("redirecting") : t(plan === "monthly" ? "subscribe" : "buyPass")}</span>
            </button>
          ) : (
            <span key={plan} className="price">{price}</span>
          );
        })}
      </div>
      {!a.enabled && <p className="muted small">{t("proSoon")}</p>}
      {a.enabled && !a.userId && <button className="btn primary" onClick={a.openSignIn}>{t("signInToUpgrade")}</button>}
      {signedIn && <p className="muted small">{t("payNote")}</p>}
      {a.enabled && <button className="linkish small" onClick={a.openRedeem}>{t("haveCode")}</button>}
      <p className="muted small">{t("agreeTerms")} <a href="#termos">{t("termsLink")}</a> · <a href="#privacidade">{t("privacyLink")}</a></p>
      {error && <p className="error" role="alert">{t(error)}</p>}
    </div>
  );
}
