import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES, parseLocalJobs, safeJobUrl } from "./localJobs";
const fields = ["id","title","company","location","countries","url","posted","firstSeen","family","seniority","remote","visa","registerIn","skills","langs","salary"];
const row = ["synthetic:1","Engineer","Example","Berlin",["DE"],"https://example.com/job","","","software","senior",0,"unknown",[],["javascript"],[],""];
const fixture = (rows: unknown[] = [row]) => JSON.stringify({generatedAt:"2026-01-01T00:00:00Z",fields,rows});
describe("local job import", () => {
  it("decodes column-oriented exports and de-duplicates IDs", () => {
    const result = parseLocalJobs(fixture([row,row]));
    expect(result.jobs[0].title).toBe("Engineer");
    expect(result.duplicateCount).toBe(1);
  });
  it("accepts an empty snapshot", () => expect(parseLocalJobs(fixture([])).jobs).toEqual([]));
  it("rejects malformed JSON and schema", () => {
    expect(() => parseLocalJobs("{")).toThrow();
    expect(() => parseLocalJobs(JSON.stringify({generatedAt:"2026-01-01",fields:[],rows:[]}))).toThrow();
  });
  it("rejects unsafe URLs and invalid job labels", () => {
    expect(safeJobUrl("javascript:alert(1)")).toBe(false);
    expect(safeJobUrl("https://user:pass@example.com")).toBe(false);
    const bad = [...row]; bad[11] = "confirmed";
    expect(() => parseLocalJobs(fixture([bad]))).toThrow();
  });
  it("rejects oversized files", () => expect(() => parseLocalJobs(" ".repeat(MAX_FILE_BYTES + 1))).toThrow());
});
