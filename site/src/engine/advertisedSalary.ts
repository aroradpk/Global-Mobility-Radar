import { SALARY_RULES, dateValue } from "./jobScreening";

// Indicative comparison only. Do not infer contractual components or eligibility.
export function advertisedSalary(country: string[], text: string, recent: boolean, today: string) {
  if (!recent || dateValue(today) === null || !today.startsWith("2026-") || country.length !== 1 || !["DE", "NL"].includes(country[0])) return [];
  const number = "(\\d{1,9}(?:\\.\\d{1,2})?)";
  const pattern = new RegExp("^gross base (?:salary )?EUR " + number + "(?:\\s*[-–]\\s*" + number + ")? per (year|month)$", "i");
  const match = pattern.exec(text.trim());
  if (!match) return [];
  const low = Math.round(Number(match[1]) * 100), high = Math.round(Number(match[2] ?? match[1]) * 100);
  if (low <= 0 || high < low) return [];
  return SALARY_RULES.filter(r => r.id.startsWith(country[0].toLowerCase() + "-") && r.period === match[3].toLowerCase()).map(rule => {
    const floor = Math.round(rule.amount * 100);
    return { rule, status: high < floor ? "advertised_below" : low >= floor ? "advertised_at_or_above" : "advertised_range_crosses" } as const;
  });
}
