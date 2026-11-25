import { advertisedSalary } from "./advertisedSalary";
const check = (text: string, countries = ["DE"], recent = true, date = "2026-11-25") => advertisedSalary(countries, text, recent, date);
function eq(actual: unknown, expected: unknown) { if (actual !== expected) throw new Error(`${actual} != ${expected}`); }
export const cases: [string, () => void][] = [
  ["exact standard floor", () => eq(check("gross base EUR 50700 per year")[0].status, "advertised_at_or_above")],
  ["one cent below", () => eq(check("gross base EUR 50699.99 per year")[0].status, "advertised_below")],
  ["range crosses threshold", () => eq(check("gross base salary EUR 50000–60000 per year")[0].status, "advertised_range_crosses")],
  ["Dutch monthly comparison", () => eq(check("gross base EUR 4357 per month", ["NL"])[0].status, "advertised_at_or_above")],
  ["ambiguous or unqualified pay remains unknown", () => { for (const text of ["EUR 60000 per year", "gross base USD 60000 per year", "gross base EUR 60000 per month", "gross base EUR 60000-50000 per year", "gross base EUR 60000 per year plus bonus", "gross base EUR 0 per year"]) eq(check(text).length, 0); }],
  ["stale, multi-country, unsupported or future rules", () => { eq(check("gross base EUR 60000 per year", ["DE"], false).length, 0); eq(check("gross base EUR 60000 per year", ["DE", "NL"]).length, 0); eq(check("gross base EUR 60000 per year", ["SE"]).length, 0); eq(check("gross base EUR 60000 per year", ["DE"], true, "2027-01-01").length, 0); }],
];
