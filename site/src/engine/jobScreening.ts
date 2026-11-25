// Dated salary-only checks; no legal eligibility or sponsorship determination.
export const RULES_VERSION = "2026-11-25";
export const DE_SOURCE = "https://www.make-it-in-germany.com/en/visa-recognition/visa-types/eu-blue-card";
export const NL_SOURCE = "https://ind.nl/en/required-amounts-income-requirements";
export const NL_REGISTER = "https://ind.nl/en/public-register-recognised-sponsors/public-register-work";
export const SCAM_SOURCE = "https://consumer.ftc.gov/articles/job-scams";
export const SALARY_RULES = [
  { id: "de-standard", label: "Germany Blue Card — standard", amount: 50700, period: "year", source: DE_SOURCE },
  { id: "de-reduced", label: "Germany Blue Card — reduced (if independently qualified)", amount: 45934.20, period: "year", source: DE_SOURCE },
  { id: "nl-under30", label: "Netherlands HSM — first application, under 30", amount: 4357, period: "month", source: NL_SOURCE },
  { id: "nl-30plus", label: "Netherlands HSM — first application, 30+", amount: 5942, period: "month", source: NL_SOURCE },
  { id: "nl-reduced", label: "Netherlands HSM — reduced (if independently qualified)", amount: 3122, period: "month", source: NL_SOURCE },
  { id: "nl-blue", label: "Netherlands Blue Card — standard", amount: 5942, period: "month", source: NL_SOURCE },
  { id: "nl-blue-reduced", label: "Netherlands Blue Card — reduced (if independently qualified)", amount: 4754, period: "month", source: NL_SOURCE },
] as const;

function dateValue(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const time = Date.parse(value + "T00:00:00Z");
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value ? time : null;
}

export function screenSalary(input: { route: string; applicationDate: string; amount: string; basisConfirmed: boolean; criterionConfirmed: boolean }) {
  const rule = SALARY_RULES.find(r => r.id === input.route);
  const date = dateValue(input.applicationDate);
  if (!rule || date === null || !input.applicationDate.startsWith("2026-") || !input.basisConfirmed || !input.criterionConfirmed || !/^\d{1,9}(?:\.\d{1,2})?$/.test(input.amount)) {
    return { status: "unknown" as const, rule, reason: "Confirm route, applicable 2026 date and guaranteed qualifying gross EUR pay in the required period." };
  }
  const cents = Math.round(Number(input.amount) * 100);
  if (cents <= 0) return { status: "unknown" as const, rule, reason: "A positive contractual salary is required." };
  return { status: cents >= Math.round(rule.amount * 100) ? "meets_floor" as const : "below_floor" as const, rule, reason: "Salary floor only; all other visa and employer conditions remain unchecked." };
}

// Only exact full legal name + official registration ID in the same jurisdiction.
// User-entered register evidence is never an independently verified sponsor result.
export function compareDutchSponsor(input: { employerName: string; employerKvk: string; registerName: string; registerKvk: string; publicationDate: string; checkedDate: string; sourceConfirmed: boolean }, today: string) {
  const pub = dateValue(input.publicationDate), checked = dateValue(input.checkedDate), current = dateValue(today);
  const name = (s: string) => s.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
  if (!input.sourceConfirmed || pub === null || checked === null || current === null || pub > checked || checked > current || current - pub > 35 * 86400000 || current - checked > 7 * 86400000 || !name(input.employerName) || !name(input.registerName) || !/^\d{8}$/.test(input.employerKvk) || !/^\d{8}$/.test(input.registerKvk)) return "unknown" as const;
  return name(input.employerName) === name(input.registerName) && input.employerKvk === input.registerKvk ? "manual_exact_match" as const : "mismatch" as const;
}

// Caution flags, not allegations. No flag is not proof of legitimacy.
export function scamFlags(text: string): string[] {
  const value = text.slice(0, 20000);
  const rules: [string, RegExp][] = [
    ["Upfront recruitment or training payment", /\b(?:pay|deposit|send)\b[^.!?\n]{0,80}\b(?:recruitment|placement|processing|registration|training|equipment)\s+fee\b|\b(?:recruitment|placement|processing|registration|training|equipment)\s+fee\s+(?:is\s+)?(?:required|mandatory|upfront)\b/i],
    ["Crypto or gift-card payment request", /\b(?:pay|deposit|send|transfer)\b[^.!?\n]{0,60}\b(?:bitcoin|crypto(?:currency)?|gift cards?)\b/i],
    ["Check deposit and repayment request", /\bdeposit\b[^.!?\n]{0,80}\b(?:check|cheque)\b[^.!?\n]{0,100}\b(?:send|return|transfer)\b/i],
    ["Recruitment conducted only by messaging app", /\b(?:interview|recruitment|hiring)\b[^.!?\n]{0,80}\b(?:telegram|whatsapp)\s+only\b/i],
  ];
  return rules.filter(([, pattern]) => pattern.test(value)).map(([label]) => label);
}
