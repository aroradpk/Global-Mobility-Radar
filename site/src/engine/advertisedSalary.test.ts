import { describe, it } from "vitest";
import { cases } from "./advertisedSalary.cases";
describe("advertised salary preview", () => { for (const [name, run] of cases) it(name, run); });
