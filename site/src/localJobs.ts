import { FAMILIES, type Family, type Job, type Visa } from "./types";

// The pipeline exports a column-oriented file. Import is explicit, never a network request.
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_ROWS = 30000;
const FIELDS = ["id", "title", "company", "location", "countries", "url", "posted", "firstSeen", "family", "seniority", "remote", "visa", "registerIn", "skills", "langs", "salary"] as const;
const VISAS: Visa[] = ["explicit", "conditional", "register", "employer-yes", "relocation", "unknown", "blocked", "employer-no"];
export interface LocalJobs { generatedAt: string; jobs: Job[]; duplicateCount: number }

function text(value: unknown, max = 500): string {
  if (typeof value !== "string" || value.length > max) throw new Error("Invalid text field");
  return value;
}
function list(value: unknown, codes = false): string[] {
  if (!Array.isArray(value) || value.length > 250) throw new Error("Invalid list field");
  const result = value.map(v => text(v, 100));
  if (codes && result.some(v => !/^[A-Z]{2}$/.test(v))) throw new Error("Invalid country code");
  return [...new Set(result)];
}
export function safeJobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname && !url.username && !url.password;
  } catch { return false; }
}
export function parseLocalJobs(raw: string): LocalJobs {
  if (new TextEncoder().encode(raw).length > MAX_FILE_BYTES) throw new Error("Job file exceeds 10 MiB");
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid job file");
  const d = data as Record<string, unknown>;
  const generatedAt = text(d.generatedAt, 40);
  if (!Number.isFinite(Date.parse(generatedAt)) || Date.parse(generatedAt) > Date.now() + 300000) throw new Error("Invalid snapshot date");
  const fields = d.fields;
  if (!Array.isArray(fields) || fields.length !== FIELDS.length || new Set(fields).size !== fields.length || FIELDS.some(f => !fields.includes(f))) throw new Error("Unexpected job schema");
  if (!Array.isArray(d.rows) || d.rows.length > MAX_ROWS) throw new Error("Invalid or oversized job rows");
  const jobs: Job[] = [];
  const ids = new Set<string>();
  let duplicateCount = 0;
  for (const row of d.rows) {
    if (!Array.isArray(row) || row.length !== fields.length) throw new Error("Invalid job row");
    const get = (f: typeof FIELDS[number]): unknown => row[fields.indexOf(f)];
    const id = text(get("id")), title = text(get("title")), company = text(get("company")), url = text(get("url"), 2048);
    const family = text(get("family")) as Family, visa = text(get("visa")) as Visa;
    const remote = get("remote");
    if (!id.trim() || !title.trim() || !company.trim() || !FAMILIES.includes(family) || !VISAS.includes(visa) || (remote !== 0 && remote !== 1) || !safeJobUrl(url)) throw new Error("Invalid job identity, classification or URL");
    const job: Job = { id, title, company, url, family, visa, remote, location: text(get("location")), countries: list(get("countries"), true), posted: text(get("posted"), 30), firstSeen: text(get("firstSeen"), 30), seniority: text(get("seniority"), 100), registerIn: list(get("registerIn"), true), skills: list(get("skills")), langs: list(get("langs")), salary: text(get("salary")) };
    if (ids.has(id)) { duplicateCount++; continue; }
    ids.add(id); jobs.push(job);
  }
  return { generatedAt, jobs, duplicateCount };
}
