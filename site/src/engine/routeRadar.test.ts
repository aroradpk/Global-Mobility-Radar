import {describe,it,expect} from "vitest";
import {radarRoutes,filterRadar,routeKey,radarFresh,countryNames} from "./routeRadar";
describe("unified route reference",()=>{
 it("covers all 11 countries",()=>expect(new Set(radarRoutes.map(r=>r.country)).size).toBe(Object.keys(countryNames).length));
 it("unique country-qualified keys",()=>expect(new Set(radarRoutes.map(routeKey)).size).toBe(radarRoutes.length));
 it("all sources https",()=>expect(radarRoutes.every(r=>r.source.startsWith("https://"))).toBe(true));
 it("filters country and search",()=>expect(filterRadar("blue","germany").map(r=>r.id)).toEqual(["blue"]));
 it("unknown search returns empty",()=>expect(filterRadar("zzzzzz","")).toEqual([]));
 it("date guard fails stale or invalid",()=>{expect(radarFresh(radarRoutes[0],"2027-01-01")).toBe(false);expect(radarFresh(radarRoutes[0],"2026-02-30")).toBe(false);});
 it("distinguishes provisional from permanent",()=>expect(radarRoutes.find(r=>r.id==="491")?.kind).toContain("Provisional"));
});
