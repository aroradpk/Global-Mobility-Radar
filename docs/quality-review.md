# Continuous quality review
2026-11-26, baseline e9a96e46ff307b274d2db166c5b43ed8d4307fac:
| Finding | Severity | Disposition |
|---|---|---|
| Switching to Canada unmounts LocalResults and discards imported jobs; calculator state also lost on leaving | High UX | Replaced toggle with three named sections; mounted wrappers hidden when inactive, explicit confirmed reset clears all via keys. Browser regression pending. |
| CRS previously emitted scenario score with first test explicitly absent | High correctness | Suppress CRS total, record missing approved test; added targeted regression (Vitest pending). |
| Canadian arithmetic mostly condensed JS with declaration instead of fully typed implementation | Medium maintainability | Retain existing module contract to avoid churn; planned typed refactor with parity tests, not accepted. |
| Canada official calculator parity, test suite, UI mobile/keyboard, network privacy | High verification | Pending; no full CI. |
| Existing job data lost when navigating back from results to preferences | Medium UX | Separate issue remains; improve when shared profile/job state is consolidated. |
| Rule freshness check occurs at calculation only | Medium correctness | Long-lived tabs must recalculate/revalidate before displaying saved assessment; pending. |
Review evidence: static inspection of App, Canada engine and fixtures, strict TS settings and package manifest; Australia pure arithmetic cases executed in JS runtime. No visual browser or complete build evidence. No changes to main. Safety PR #2 remains open, zero Actions runs. Follow-up: first resolve CI, execute all previous tests, validate official calculator parity, then mobile/accessibility E2E. Review each increment, retain blockers in roadmap. 

Post-commit review: Review.onBack originally called the new global reset; separated restartProfile so returning to CV upload cannot erase Canada/Australia scenarios. Added visible active/focus navigation state, mobile hit-target sizing, and explicit hidden wrapper rule. Static review only; browser regression pending. 

## Phase 4C review (2026-11-26)
- Re-executed 26 Canada and 28 Australia existing fixture projections from committed JS, including no-language-test case; 54/54 passed. This is not a Vitest run.
- High correctness: results retained after rules/credentials expire in long-lived tabs. Shared assessment date refresh + derived submitted results across all three country panels; browser regression pending.
- Medium correctness: advertisedSalary accepted impossible calendar dates; reused dateValue validation and added regression fixture (not yet run in Vitest). German salary thresholds now share one source; no duplicate hard-coded salary figures in screening engine.
- Medium UX: references described only Canada; updated route navigation/copy. Germany route-specific forms avoid requiring all three sets of inputs. State retained locally and explicit reset. Browser/a11y checks pending.
- Germany official sources reviewed; age birthday wording discrepancy explicitly noted, operational bands used. No official calculator parity, source monitoring or automated qualification mapping. Existing shared profile/job retention on preference editing and typed migration remain open. CI PR #2 open, 0 workflow runs. No acceptance awarded.

## First complete CI run — 2026-11-26
- Owner-side safety PR #2 merged; main e148ae0a21d896b29e81d7d54d3b85746f0bc825. Development PR #1 remains draft. No deployment performed.
- Exact tested code commit 43773476559ad3d7f301ae8e0f12dc105eb2c61f. Push workflow https://github.com/aroradpk/Global-Mobility-Radar/actions/runs/45706293808 completed with overall failure because dependency audit failed; other three jobs succeeded.
- Repository guard tests 4/4; tracked-tree guard success. Pipeline 46/46 (including previously pending source pipeline integration fixtures). Frontend Vitest 136/136 across 8 files (Canada 26, Australia 28, Germany 34, parser 7, advertised salary 7, manual screening 13, inherited engine 8, CV 13). npm ci, tsc --noEmit and Vite production build passed. 186 automated tests total across these three jobs; do not double-count direct JS projections. Browser/E2E, official calculator parity, live source smoke and full security acceptance remain pending.
- Audit failed: 5 vulnerabilities (2 moderate, 1 high, 2 critical). Reported @vitest/mocker GHSA-82fw-gwwq-j7x9 and GHSA-qxg6-89mg-rqv8; esbuild GHSA-67mh-4wv8-2f99; tinypool GHSA-5gmw-xhrv-c9v3 and GHSA-85c8-ppgw-ccpr. Do not run npm audit fix --force blindly: suggested old patch versions may not remove all advisories. Inspect full JSON report, separate runtime vs dev dependency exposure, choose compatible supported patched Vite/Vitest/tinypool/esbuild versions and regenerate lockfile on network-enabled runner. Verify npm ci/test/build/audit before acceptance; no audit bypass. Action runner Node20 deprecation warning also needs pinned-action maintenance. Keep loopback preview and no personal CVs until gates met.
- Build output index JS 706.52 kB (225.18 kB gzip), separate PDF worker 1375.84 kB; profile/country UI code splitting and mobile performance review backlog. Do not optimise prematurely without measurement.
- Next priority security remediation, then browser E2E/privacy/accessibility and bounded live-source smoke via CI, then Phase 4D country screens. No owner CI activation action remains. All 16 modules remain unaccepted pending their complete criteria. No paid hosting or live deployment.


## Dependency remediation candidate — 2026-11-26
- Candidate run https://github.com/aroradpk/Global-Mobility-Radar/actions/runs/45706920091, job dependency-upgrade-candidate at 2549029: npm 11.21.3 resolved fresh lock after two npm 10 resolver failures; npm audit reported zero vulnerabilities; npm ci, 136/136 Vitest cases and production build succeeded. Original audit job on temporary branch intentionally tests old lock and fails; judge the candidate job separately.
- Promoted only reviewed package.json and package-lock.json: Vite 7.3.8, Vitest 4.1.12, React plugin 5.1.4; esbuild 0.28.2, mocker 4.1.12, tinypool absent. Exact original runtime direct dependencies and required runtime package versions unchanged; optional peer @opentelemetry/api 1.9.1 removed (all references optional, no required dependency). 100 added/changed locked entries, 12 removed; resolved registry/integrity present on all non-root entries. No peer bypass or audit relaxation. No candidate workflow promoted.
- Full standard CI on the promoted commit is still required, including npm 10 lock consumption. No browser or live job source validation yet. No accepted modules.


## Browser quality candidate (2026-11-26)
- Standard CI at f1d7d59 passed 4/4 jobs (two runs: https://github.com/aroradpk/Global-Mobility-Radar/actions/runs/45707154105 and https://github.com/aroradpk/Global-Mobility-Radar/actions/runs/45707142171). Secure lock promotion verified. No accepted modules yet.
- Fix preference editing data loss by keeping the existing result component mounted and hidden until the job profile is restarted or globally cleared. This avoids moving async file-import callbacks into a longer-lived parent. Improve keyboard CV picker, named textarea, busy handling, narrow layout/fieldset sizing and focus. Browser regressions added for 1280/320/390 px, synthetic CV and snapshot, import errors, navigation, clear/reload and network/storage. Candidate browser tooling pinned Playwright 1.65.1, isolated from app; lock generation on disposable runner for review. Browser execution pending.
- Temporary candidate workflow runs one bounded public JobSearch smoke per candidate push; no persistence, no raw payload/logging, no scheduled polling. Existing adapter access/robots guard unchanged. Remove live job from workflow before promoting. No source smoke success claimed before results.
