// Calls to the Visa Job Atlas API. Job postings are no longer shipped with the
// site: the API matches them on the server and returns what the caller's plan
// allows (three for free accounts, all for Pro).
import { accessToken } from "./auth";
import type { JobMatch } from "./engine/jobs";
import type { Answers, Market, Meta, Profile } from "./types";

// VITE_API_URL is set at build time for production; in dev, Vite proxies /api.
const BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export type Tier = "anon" | "free" | "pro";

/** A match the plan doesn't open: shown blurred, with no title, company or link. */
export interface LockedMatch {
  score: number;
  countries: string[];
  remote: boolean;
  visa: string;
}

export interface MatchesResult {
  tier: Tier;
  total: number;
  matches: JobMatch[];
  locked: LockedMatch[];
  lockedCount: number;
}

export interface Me {
  tier: Tier;
  email?: string;
  plan?: { name: "monthly" | "quarterly" | "gift"; status: string; periodEnd: string; renews: boolean } | null;
  /** Present once, on the call that turned an ebook order bought with this email into Pro. */
  ebook?: { days: number; periodEnd: string };
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await accessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function get<T>(path: string, auth = false): Promise<T> {
  const res = await fetch(BASE + path, { cache: "no-cache", headers: auth ? await authHeaders() : {} });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export const fetchMeta = () => get<Meta>("/api/meta");
export const fetchMarket = () => get<Market>("/api/market");
export const fetchMe = () => get<Me>("/api/me", true);

export async function fetchMatches(profile: Profile, answers: Answers, countryOrder: string[], signal?: AbortSignal): Promise<MatchesResult> {
  const res = await fetch(BASE + "/api/matches", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ profile, answers, countryOrder }),
    signal,
  });
  if (!res.ok) throw new Error(`/api/matches: HTTP ${res.status}`);
  return res.json() as Promise<MatchesResult>;
}

export type PlanName = "monthly" | "quarterly";

/** Why a checkout couldn't start: signed out, already Pro, or payments not open yet. */
export class CheckoutError extends Error {
  constructor(public status: number) {
    super(`/api/checkout: HTTP ${status}`);
  }
}

/** The Mercado Pago page to send the buyer to. */
export async function startCheckout(plan: PlanName): Promise<string> {
  const res = await fetch(BASE + "/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    body: JSON.stringify({ plan }),
  });
  if (!res.ok) throw new CheckoutError(res.status);
  return ((await res.json()) as { url: string }).url;
}

export async function cancelSubscription(): Promise<void> {
  const res = await fetch(BASE + "/api/subscription/cancel", { method: "POST", headers: await authHeaders() });
  if (!res.ok) throw new Error(`/api/subscription/cancel: HTTP ${res.status}`);
}

/** A failed call, with the HTTP status and the API's error code (e.g. "posting_needed"). */
export class ApiError extends Error {
  constructor(public status: number, public code: string) {
    super(`HTTP ${status} ${code}`);
  }
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body === undefined ? {} : { "Content-Type": "application/json" }), ...(await authHeaders()) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new ApiError(res.status, data.error ?? "");
  return data;
}

// ------------------------------------------------------------- application kits

export interface Kit {
  cv_markdown: string;
  cover_letter: string;
  form_answers: { question: string; answer: string }[];
  keywords_to_mirror: string[];
  salary: { low: number; high: number; currency: string; period: "year" | "month"; basis: string };
  notes: string[];
  ats: { score: number; matched: string[]; missing: string[] };
  posting_source: "board" | "pasted";
}

export interface KitRequest {
  jobId: string;
  family: string;
  cvText: string;
  profile: Profile;
  citizenships: string[];
  lang: "en" | "pt";
  posting?: string;
}

export const generateKit = (req: KitRequest) => call<{ id: string; kit: Kit; used: number; limit: number }>("POST", "/api/kit", req);
export const listKits = () => call<{ id: string; job_id: string; job_title: string; company: string; created_at: string }[]>("GET", "/api/kits");
export const getKit = (id: string) => call<{ content: Kit; job_title: string; company: string }>("GET", `/api/kits/${encodeURIComponent(id)}`);

// ---------------------------------------------------------------------- tracker

export const STATUSES = ["saved", "applied", "interview", "offer", "rejected"] as const;
export type AppStatus = (typeof STATUSES)[number];
export interface Application {
  job_id: string;
  job_title: string;
  company: string;
  url: string;
  status: AppStatus;
  notes: string;
  updated_at?: string;
}

export const listApplications = () => call<Application[]>("GET", "/api/applications");
export const saveApplication = (a: Application) => call<{ ok: true }>("PUT", `/api/applications/${encodeURIComponent(a.job_id)}`, a);
export const deleteApplication = (jobId: string) => call<{ ok: true }>("DELETE", `/api/applications/${encodeURIComponent(jobId)}`);

// ----------------------------------------------------------------------- alerts

export const getAlerts = () => call<{ enabled: boolean; lastSent: string | null }>("GET", "/api/alerts");
export const setAlerts = (enabled: boolean, profile?: Profile, answers?: Answers, countryOrder?: string[]) =>
  call<{ ok: true }>("PUT", "/api/alerts", { enabled, profile, answers, countryOrder });

// ---------------------------------------------------------------------- account

/** Everything stored about the signed-in user, as JSON text. */
export async function exportAccount(): Promise<string> {
  return JSON.stringify(await call<unknown>("GET", "/api/account/export"), null, 2);
}

export const deleteAccount = () => call<{ ok: true }>("DELETE", "/api/account");

// ------------------------------------------------------------------- gift codes

/** Uses a gift code (e.g. the month that comes with an ebook). Throws ApiError with the reason. */
export const redeemCode = (code: string) => call<{ ok: true; days: number; periodEnd: string }>("POST", "/api/redeem", { code });

/** The ebook's month for a buyer signed in with another email: the Kiwify order number and the purchase email. */
export const redeemOrder = (order: string, email: string) =>
  call<{ ok: true; days: number; periodEnd: string }>("POST", "/api/redeem/order", { order, email });
