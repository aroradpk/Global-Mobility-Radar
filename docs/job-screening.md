# Phase 3B: manual vacancy screening (2026-11-25)

## Salary floors
Official sources checked 2026-11-25:
- https://www.make-it-in-germany.com/en/visa-recognition/visa-types/eu-blue-card — 2026 standard EUR 50,700 gross/year; reduced EUR 45,934.20 gross/year subject to separate qualification and approval where required.
- https://ind.nl/en/required-amounts-income-requirements — 2026 first HSM applications under 30 EUR 4,357/month; 30+ EUR 5,942/month; reduced EUR 3,122/month subject to eligibility; Blue Card standard EUR 5,942/month and reduced EUR 4,754/month. Qualifying gross pay excluding holiday allowance, subject to IND pay-component rules.
The manual calculator requires an explicitly selected criterion, confirmed gross contractual pay in the specified unit, and a date in 2026. It compares integer cents, returns meets_floor/below_floor/unknown only, and does not parse advertised strings, estimate currency conversions or determine visa eligibility. Reduced and age-specific criteria require manual confirmation. 2027 and later unknown until rules are updated. No full route coverage claim.

## Employer identity
https://ind.nl/en/public-register-recognised-sponsors/public-register-work publishes legal names and KvK numbers; monthly updates. Manual comparison requires exact full name (case/whitespace only normalization), matching 8-digit KvK numbers, user confirmation of official evidence, publication within 35 days and check within 7 days. These are conservative product freshness windows, not statutory deadlines. Result is manual_exact_match, mismatch or unknown; it is never confirmation of sponsorship or independent register retrieval. Other jurisdictions pending.

## Scam caution
https://consumer.ftc.gov/articles/job-scams — manual non-sensitive text checks for payment, crypto/gift-card, check repayment and messaging-only patterns. Heuristic caution only; absence of flags never verifies legitimacy. No private recruiter data saved, no network calls.

## Source research
Reviewed published public ATS docs: https://docs.greenhouse.io/job-board , https://github.com/lever/postings-api , https://developers.ashbyhq.com/docs/public-job-posting-api . Public GET documentation is not proof of permission to aggregate any specific employer's data. No source approval or smoke-test success claimed. Keep registry empty until ownership, terms, robots and request controls are validated.

## Test evidence
13/13 shared pure TS cases passed using global tsc --strict --noUnusedLocals --noUnusedParameters --target ES2020 --module commonjs and Node 22.16.0. Expected Git blob SHA-1: jobScreening.ts 2d8d0f18aa55d1829bcb24e616e7074422e0f536; jobScreening.cases.ts fe8abe495afe705be962a7057eb8ea2ed564cee6. Vitest wrapper added for future full CI. UI build/browser verification, old pipeline integration fixtures and live connector tests pending. No live polling.
