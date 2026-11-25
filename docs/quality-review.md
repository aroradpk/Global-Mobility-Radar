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
