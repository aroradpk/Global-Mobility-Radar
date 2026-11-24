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
