import { describe, it } from "vitest";
import { cases } from "./jobScreening.cases";
describe("manual vacancy screening", () => { for (const [name, run] of cases) it(name, run); });
