// Bundled reference knowledge only; no runtime API calls.
import countriesJson from "../../knowledge/countries.json";
import tracksJson from "../../knowledge/tracks.json";
import skillsJson from "../../knowledge/skills.json";
import type { Country, Market, Meta, Skill, Track } from "./types";

export const COUNTRIES = (countriesJson as { countries: Country[] }).countries;
export const COUNTRY = new Map(COUNTRIES.map((c) => [c.code, c]));
export const TRACKS = (tracksJson as unknown as { tracks: Track[] }).tracks;
export const TRACK = new Map(TRACKS.map((t) => [t.id, t]));
export const SKILLS = (skillsJson as { skills: Skill[] }).skills;
export const SKILL = new Map(SKILLS.map((s) => [s.id, s]));
export const KNOWLEDGE_AS_OF = (countriesJson as { asOf?: string }).asOf ?? "";

export function skillLabel(id: string): string {
  return SKILL.get(id)?.label ?? id.replace(/-/g, " ");
}

export interface Dataset {
  market: Market;
  meta: Meta;
}

