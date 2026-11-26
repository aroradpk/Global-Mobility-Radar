# Canada Phase 4A — rules and verification
Reviewed 2026-11-25. Current ministerial instructions page dated 2026-11-18; LMI effective 2026-11-03.
Sources:
- https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/who-can-apply/federal-skilled-workers.html
- https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/crs-criteria.html
- https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/changes.html
- https://www.canada.ca/en/immigration-refugees-citizenship/corporate/mandate/policies-operational-instructions-agreements/ministerial-instructions/express-entry-application-management-system/current.html
- https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/education-assessment.html
- https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/documents/language-test.html
- https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/express-entry/check-score/high-wage.html

All six FSW factor arithmetic and CRS age, education, individual language abilities, spouse, work length/LMI, transferability caps and additional factors. FSW mandatory checks are self-reported confirmations, not evidence verification. Work years, valid offers, adaptability, high-wage NOC tiers, credentials, Canadian study and nomination must be independently qualified before entering. No automatic NOC mapping, funds amounts, overlapping interval counting, test-band conversion or adjudication of admissibility. ECA validity checks a user-supplied date; multiple credential validation remains manual. Expired/missing evidence gives unknown; none explicitly indicates no language test. Feb 29 anniversary treated conservatively as Feb 28 in non-leap years. Rule review window ends Dec 25, 2026 (product freshness guard, not legal expiry). No historical or future scoring. Max CRS 1270; LMI uses higher of work or offer, not sum. French bonus follows ministerial instructions s32. No invitation probability. PNP eligibility, draw monitoring, funds lookup and NOC mapping pending. In-memory scenario panel accessible without CV. Source arithmetic uses a small JavaScript module with TS declaration and Vitest fixtures; no new dependencies.

Verification: 25 synthetic regressions executed in JavaScript tool runtime using same function object serialised to canada.js; all passed. Two initial fixture expectations corrected after reviewing arithmetic (88 transferability with one Canadian year, 470 spouse case). Vitest wrapper added, not executed; no full UI build/browser or official calculator parity test. No accepted module.
