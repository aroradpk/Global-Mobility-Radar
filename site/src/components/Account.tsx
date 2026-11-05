import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { authEnabled, LINK_ERROR, signInWithEmail, signInWithGoogle, signOut, useSession } from "../auth";
import { ApiError, cancelSubscription, deleteAccount, exportAccount, fetchMe, redeemCode, type Me, type Tier } from "../api";
import { load, save } from "../store";
import { download } from "../export";
import { useT, type StringKey } from "../i18n";

interface Account {
  enabled: boolean;
  userId: string | null;
  email: string;
  tier: Tier;
  plan: Me["plan"];
  openSignIn: () => void;
  openRedeem: () => void;
  refresh: () => Promise<Me>;
}

const AccountContext = createContext<Account>({
  enabled: false, userId: null, email: "", tier: "anon", plan: null, openSignIn: () => {}, openRedeem: () => {}, refresh: async () => ({ tier: "anon" }),
});
export const useAccount = () => useContext(AccountContext);

export function AccountProvider({ children }: { children: ReactNode }) {
  const session = useSession();
  const [me, setMe] = useState<Me>({ tier: "anon" });
  const [signingIn, setSigningIn] = useState(LINK_ERROR !== null);
  const [back, setBack] = useState(CHECKOUT_RETURN);
  // A code from a #resgatar link waits here through sign-in: the sign-in link
  // drops the hash and often opens in a new tab, hence localStorage.
  const [redeem, setRedeem] = useState<string | null>(() => REDEEM_LINK ?? load<string | null>("vja.redeem", null));
  useEffect(() => save("vja.redeem", redeem), [redeem]);
  const userId = session?.user.id ?? null;

  // The plan comes from the API, which reads it from the entitlements table.
  const refresh = async () => {
    const m = await fetchMe().catch((): Me => ({ tier: "free" }));
    setMe(m);
    return m;
  };

  useEffect(() => {
    if (!userId) return setMe({ tier: "anon" });
    let live = true;
    fetchMe().then((m) => live && setMe(m), () => live && setMe({ tier: "free" }));
    return () => {
      live = false;
    };
  }, [userId]);

  // Back from Mercado Pago: the webhook usually lands within seconds, so ask a
  // few times before saying the payment is still being confirmed.
  useEffect(() => {
    if (back !== "waiting" || !userId) return;
    let tries = 0;
    const timer = setInterval(async () => {
      const m = await fetchMe().catch(() => null);
      if (m) setMe(m);
      if (m?.tier === "pro") setBack("done");
      else if (++tries >= 10) setBack("slow");
      if (m?.tier === "pro" || tries >= 10) clearInterval(timer);
    }, 3000);
    return () => clearInterval(timer);
  }, [back, userId]);

  const value: Account = {
    enabled: authEnabled,
    userId,
    email: session?.user.email ?? "",
    tier: userId ? me.tier : "anon",
    plan: userId ? me.plan : null,
    openSignIn: () => setSigningIn(true),
    openRedeem: () => setRedeem(""),
    refresh,
  };
  return (
    <AccountContext.Provider value={value}>
      {children}
      {signingIn && <SignIn notice={LINK_ERROR} onClose={() => setSigningIn(false)} />}
      {back && <CheckoutNotice state={back} onClose={() => setBack(null)} />}
      {redeem !== null && authEnabled && !signingIn && (
        <Redeem initial={redeem} signedIn={!!userId} onSignIn={() => setSigningIn(true)} onDone={refresh} onClose={() => setRedeem(null)} />
      )}
    </AccountContext.Provider>
  );
}

type Back = "waiting" | "done" | "slow" | "failed";

/** Mercado Pago sends buyers back to ?checkout=<plan>, adding the payment's status. */
function readCheckoutReturn(): Back | null {
  const q = new URLSearchParams(location.search);
  if (!authEnabled || !q.has("checkout")) return null;
  history.replaceState(null, "", location.pathname + location.hash);
  const status = q.get("collection_status") ?? q.get("status");
  if (status === "rejected" || status === "null") return "failed";
  // Pix and boleto come back unpaid; the webhook turns Pro on when they clear.
  return status === "pending" || status === "in_process" ? "slow" : "waiting";
}
// Read once at load: it also cleans the address bar.
const CHECKOUT_RETURN = readCheckoutReturn();

/** #resgatar or #resgatar=ATLAS-XXXXX-XXXXX opens the gift-code dialog. */
function readRedeemLink(): string | null {
  const m = location.hash.match(/^#(?:resgatar|redeem)(?:=([A-Za-z0-9-]{0,40}))?$/);
  if (!m) return null;
  history.replaceState(null, "", location.pathname + location.search);
  return m[1] ?? "";
}
const REDEEM_LINK = readRedeemLink();

const REDEEM_ERRORS: Record<string, StringKey> = {
  invalid: "codeInvalid", expired: "codeExpired", used_up: "codeUsedUp", already_redeemed: "codeAlready", subscribed: "codeSubscribed",
};

function Redeem(props: { initial: string; signedIn: boolean; onSignIn: () => void; onDone: () => Promise<Me>; onClose: () => void }) {
  const { t, lang } = useT();
  const ref = useRef<HTMLDialogElement>(null);
  const [code, setCode] = useState(props.initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<StringKey | null>(null);
  const [until, setUntil] = useState("");

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await redeemCode(code);
      setUntil(new Date(res.periodEnd).toLocaleDateString(lang === "pt" ? "pt-BR" : "en"));
      await props.onDone();
    } catch (err) {
      setError(err instanceof ApiError ? REDEEM_ERRORS[err.code] ?? "accountError" : "accountError");
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog ref={ref} className="signin" onClose={props.onClose} aria-labelledby="redeem-title">
      <h3 id="redeem-title">{t("redeemTitle")}</h3>
      {until ? (
        <p>{t("redeemDone").replace("{date}", until)}</p>
      ) : !props.signedIn ? (
        <>
          <p className="muted">{t("redeemSignIn")}</p>
          <button className="btn primary" onClick={props.onSignIn}>{t("signIn")}</button>
        </>
      ) : (
        <form onSubmit={submit}>
          <label>
            {t("redeemLabel")}
            <input id="redeem-code" autoComplete="off" spellCheck={false} placeholder="ATLAS-XXXXX-XXXXX" value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
          <button className="btn primary" disabled={busy || code.trim().length < 10}>{t("redeemButton")}</button>
          {error && <p className="error" role="alert">{t(error)}</p>}
        </form>
      )}
      <button className="btn ghost small close" onClick={() => { ref.current?.close(); props.onClose(); }}>{t("close")}</button>
    </dialog>
  );
}

function CheckoutNotice({ state, onClose }: { state: Back; onClose: () => void }) {
  const { t } = useT();
  const text = { waiting: t("payWaiting"), done: t("payDone"), slow: t("paySlow"), failed: t("payFailed") }[state];
  return (
    <div className={"toast " + state} role="status">
      <p>{text}</p>
      {state !== "waiting" && <button className="btn ghost small" onClick={onClose}>{t("close")}</button>}
    </div>
  );
}

function SignIn({ notice, onClose }: { notice?: "expired" | "failed" | null; onClose: () => void }) {
  const { t } = useT();
  const ref = useRef<HTMLDialogElement>(null);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setState("sending");
    try {
      await signInWithEmail(email.trim());
      setState("sent");
    } catch {
      setState("error");
    }
  };

  return (
    <dialog ref={ref} className="signin" onClose={onClose} aria-labelledby="signin-title">
      <h3 id="signin-title">{t("signInTitle")}</h3>
      {state === "sent" ? (
        <p>{t("signInSent")}</p>
      ) : (
        <>
          {notice && state === "idle" && <p className="error" role="alert">{t(notice === "expired" ? "signInLinkExpired" : "signInError")}</p>}
          <p className="muted">{t("signInBody")}</p>
          <form onSubmit={send}>
            <label>
              {t("email")}
              <input id="signin-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <button className="btn primary" disabled={state === "sending"}>{t("sendLink")}</button>
          </form>
          <p className="or muted small">{t("or")}</p>
          <button className="btn" onClick={() => signInWithGoogle().catch(() => setState("error"))}>{t("withGoogle")}</button>
          {state === "error" && <p className="error" role="alert">{t("signInError")}</p>}
        </>
      )}
      <button className="btn ghost small close" onClick={() => { ref.current?.close(); onClose(); }}>{t("close")}</button>
    </dialog>
  );
}

/** Header control: "Sign in", or the account's email, plan and sign-out. */
export function AccountMenu() {
  const { t, lang } = useT();
  const a = useAccount();
  const [cancelState, setCancelState] = useState<"idle" | "busy" | "error">("idle");
  const [accountError, setAccountError] = useState(false);
  if (!a.enabled) return null;
  if (!a.userId) return <button className="btn small" onClick={a.openSignIn}>{t("signIn")}</button>;
  const until = a.plan?.periodEnd ? new Date(a.plan.periodEnd).toLocaleDateString(lang === "pt" ? "pt-BR" : "en") : "";
  return (
    <details className="account">
      <summary className="btn small">
        <span className={"tier " + a.tier}>{a.tier === "pro" ? "Pro" : t("freeTier")}</span>
      </summary>
      <div className="account-menu card">
        <p className="small"><b>{a.email}</b></p>
        <p className="muted small">
          {a.tier !== "pro" ? t("freePlanNote") : `${a.plan?.renews ? t("renewsOn") : t("proUntil")} ${until}`}
        </p>
        {a.plan?.renews && (
          <button
            className="btn ghost small"
            disabled={cancelState === "busy"}
            onClick={async () => {
              if (!confirm(t("cancelConfirm").replace("{date}", until))) return;
              setCancelState("busy");
              try {
                await cancelSubscription();
                await a.refresh();
                setCancelState("idle");
              } catch {
                setCancelState("error");
              }
            }}
          >
            {t("cancelPlan")}
          </button>
        )}
        {cancelState === "error" && <p className="error small" role="alert">{t("cancelError")}</p>}
        <button className="btn ghost small" onClick={() => signOut()}>{t("signOut")}</button>
        <button className="btn ghost small" onClick={a.openRedeem}>{t("haveCode")}</button>
        <hr />
        <button
          className="btn ghost small"
          onClick={() => exportAccount().then((json) => download("visa-job-atlas-data.json", json, "application/json"), () => setAccountError(true))}
        >
          {t("exportData")}
        </button>
        <button
          className="btn ghost small danger"
          onClick={async () => {
            if (!confirm(t("deleteConfirm"))) return;
            try {
              await deleteAccount();
              await signOut();
            } catch {
              setAccountError(true);
            }
          }}
        >
          {t("deleteAccount")}
        </button>
        {accountError && <p className="error small" role="alert">{t("accountError")}</p>}
        <p className="muted small legal-links"><a href="#privacidade">{t("privacyLink")}</a> · <a href="#termos">{t("termsLink")}</a></p>
      </div>
    </details>
  );
}
