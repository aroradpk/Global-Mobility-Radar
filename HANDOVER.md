# Development handover

Updated: 2026-11-25
Repository: aroradpk/Global-Mobility-Radar
Review baseline: 7df403c5545c5704227ed75561f5ec4a08f5db9c
Active branch: development/roadmap-and-hardening

## Current state
- Fork access and initial static audit verified; upstream MIT licence read.
- Upstream frontend, knowledge and Python pipeline are candidates for reuse, not accepted modules.
- Upstream private API missing. Production workflows reference upstream infrastructure. No inherited runtime or dependency-scan evidence available; no fork workflow runs observed at audit.
- A separate Canadian FSW prototype was reported in an earlier conversation, but is not integrated or verified against this branch. Treat as a candidate, not an accepted feature.
- Foundation implementation on development branch: remove inherited deploy/redirect workflows, add read-only pinned CI, lockfile audit and narrow tracked-tree secret/path guard with regression tests. No deployment, polling or credentials configured. CI execution and audit results must be verified; no acceptance claimed.
- Prior conversational estimate: 8% discovery/planning progress. New release metric: 0/16 modules accepted, 0/100 weighted acceptance points. These are distinct measures.

## Foundation verification (2026-11-25)
- Code commit: 41d99a668b1d1bcd0d1c57679280366ab06fafba; draft PR #1: https://github.com/aroradpk/Global-Mobility-Radar/pull/1.
- Git tree inspection verified only .github/workflows/ci.yml remains on this branch. Main retains original workflows until a verified merge; do not enable upstream deployment/redirect workflows.
- Local Python 3.13.5: reconstructed the two new guard files and verified their Git blob SHA-1s exactly match the committed blobs (8b0d5729476256bee017f48186f9f013c9164d59, 0c127fd48b74c3357dabe4df008e668e7199a46f). python -m unittest discover -s tools/tests -v: 4/4 passed. Guard in a synthetic git tree: 0 findings for clean files, exit 1 on inherited deployment fixture. This is not a scan of the full fork.
- Static npm lockfile review: 169 package entries excluding root, 10 direct dependency declarations match the locked root and resolved versions, no resolved URLs outside the npm registry, no resolved packages lacking integrity metadata; two entries declare install scripts (esbuild and fsevents). CI disables lifecycle scripts. This is not a vulnerability scan or an install/build result.
- GitHub Actions API: no runs returned for implementation commit or repository after PR creation. Actions settings endpoint unavailable to connector; reason for no runs unconfirmed. Full inherited Python tests, npm ci/test/build, npm audit and full repository guard execution are pending. Do not merge until results verified and findings resolved. Enable only safe CI if Actions is disabled; keep original deploy/redirect disabled. No source polling or deployment occurred.
- Verified release completion stays 0/100, 0/16 accepted; M15 and M16 in progress.

## Independent local preview (implementation; unverified)
- Main remains unchanged; CI API still reports zero runs. Proceed on isolated branch without merging.
- App entrypoint now uses in-memory profile onboarding and local results, explicit file import, existing matching engine, and dated country references. No API, authentication, paid-tier, remote CV or third-party font path in active entrypoint. Original backend-bound modules retained disconnected for later cleanup. Local preview English only; no live polling, legal eligibility, verified sponsor evidence or application tracker yet.
- Added bounded schema validation, HTTPS URL validation, duplicate ID handling, empty/error/stale states and five Vitest cases (execution pending). Removed dev upstream proxy, limited CV size/pages and disabled PDF evaluation. Full npm build/browser/network tests remain blocked pending CI/dependencies.

- Local verification: exact committed localJobs.ts blob SHA ba9303e00813a415872297ef8643a331b45b9d30 reconstructed; global tsc strict/noUnused checks passed with equivalent minimal Job/Family/Visa type declarations. Node assert harness passed all five import scenarios corresponding to Vitest tests (decode/dedupe, empty, malformed, unsafe URL/label, size). This is not a full Vitest run or application build. No npm dependencies installed. GitHub Actions API still returned zero runs. Static active import review found no upstream API/auth imports; browser network verification remains mandatory.
- Additional safety changes: disable Vite publicDir to avoid bundling generated job data, restrict dev server filesystem allow list to site/knowledge, add preview instructions and correct active onboarding copy.

## Phase 3 source trust slice (implemented, integration unverified)
- Default-deny reviews for inherited companies; initial eligible connector types Greenhouse/Lever/Ashby only, no approved source yet. All feed, register refresh and automatic discovery network paths disabled in CLI/poll. Candidate employer research links in docs/source-trust.md.
- SQLite additive source identity/fingerprint and description observation columns; polling does not infer closure from absence; no cached register/fuzzy evidence boosts; export excludes unapproved/legacy/stale rows, deduplicates canonical URLs and carries per-row evidence. Freshness CLI only counts successful approved source labels. No live network collection.
- 10 new pure Python source-policy cases passed in reconstructed local files before commit; integration tests and exact blob comparison still pending, full CI remains blocked. Do not merge.
- Phase 3 is partial: UI evidence, integration tests, actual source approvals, live smoke tests, exact entity/current register validation, salary and scam checks remain outstanding.

## Next goal
Verify safe CI and full preview build; on isolated branch add mocked poll/export integration regression tests and surface per-vacancy evidence in the local dashboard. Then review a small set of official boards for permission and live connector smoke tests. Main unchanged, all 16 modules retained.

## Blockers and owner actions
Direct clone is unavailable in this execution environment (DNS resolution failure); GitHub Actions reported no runs; settings could not be read. Full dependency installation must be verified remotely. Narrow tree check does not scan git history, binaries or all possible secret formats. If a service credential or deployment authorization is needed, stop at that boundary; do not use upstream credentials or publish applicant data.

## Continuation procedure
Read AGENTS.md, roadmap and fork audit. Check latest branch/commit and CI. Implement the next dependency-ready gate; update status and evidence in this file and roadmap. Preserve all required modules until the acceptance score reaches 100, with final end-to-end release verification. Do not assume background execution or scheduled services exist.
