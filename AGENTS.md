# Global Mobility Radar — development instructions

This fork is a development foundation, not a trusted production baseline.
The source of truth for the target release is docs/master-product-roadmap.md.
Read HANDOVER.md and docs/fork-acceptance-audit.md before making changes.
Keep the upstream MIT license and copyright notice intact.

## Required workflow
- Fetch the current main and active development branch heads; never assume an old SHA is current.
- Select the next dependency-ready acceptance gate from the roadmap. Keep changes small and avoid rebuilding sound inherited components.
- Work on a separate branch; do not merge unverified changes to main.
- Run targeted regression tests and the full relevant CI suite. Record actual commands, outcomes, CI links and any blocked checks. Never claim tests passed without evidence.
- Update HANDOVER.md and the roadmap status/evidence in the same change. State remaining risks, acceptance progress and the next goal.
- A module is accepted only after every listed criterion is verified, including integration where applicable. Inherited, drafted, mocked or untested features are not accepted. Do not remove or downgrade requirements without explicit owner approval.
- Do not commit CVs, applicant information, credentials, production data, or personal configuration. Use synthetic fixtures. Do not transmit profile data to the upstream service or any AI provider without explicit opt-in and clear data boundaries.
- Never bypass robots, access controls, or source terms; disable unapproved sources. Do not equate relocation, historical sponsorship, or register membership with confirmed job-level sponsorship.
- Immigration outcomes must be deterministic, versioned, source-backed and conservative with missing/stale/conflicting facts. AI may extract or explain, not determine legal eligibility. No automatic submission or payment.
- Keep deployment and monitoring off until explicitly configured for owner-controlled infrastructure and source permissions are verified. Avoid costly services and unnecessary architectural complexity.

## Continuous code and user-experience review (owner requirement)
- Before each increment, review the actual current diff, relevant existing implementation and tests; repair confirmed regressions before introducing dependent features. Document findings, severity, reproduction, fix and verification status in docs/quality-review.md. Do not accumulate avoidable defects or mark untested improvements complete.
- Prefer reusable typed domain functions, readable names, small modules and minimal dependencies. Check arithmetic boundaries, contradictory/missing/stale inputs, security, error paths, and compatibility with existing data. No unrelated rewrites.
- Treat UX as an acceptance gate: mobile/desktop layouts, clear navigation, accessible labels/keyboard/focus, meaningful empty/loading/error states, plain-language results, transparent evidence and preservation of unsaved in-memory work across navigation. Provide explicit safe clear/reset; never persist sensitive data silently. Browser evidence required, not just mockups.
- Run regression and integration checks on affected old and new flows; inspect CI/build/audit results and prioritize unresolved correctness or security defects. Keep separate code-written estimate and verified acceptance. No claim of perfection; maintain an evidence-backed quality backlog.

## Product priority (owner-approved 2026-11-28)
Deliver personalised international opportunity intelligence: live trustworthy discovery, role-specific sponsorship evidence, integrated profile/visa/PR/salary requirements, actionable recommendations and alerts. Prioritize one end-to-end real source-to-decision flow before expanding standalone calculators/admin functionality. Never claim source coverage from fixtures. Preserve all release gates and safety boundaries.
