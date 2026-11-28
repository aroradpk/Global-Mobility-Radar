# Commercial software and asset licence audit — 2026-11-28

Baseline main 0273ceb9755db0b4bf586ba3b4778af732dfcee0; candidate 516792572860501812aa0960c3e094a03720e01b. GitHub metadata identifies fork of talls2/visa-job-atlas, both LICENSE texts identical: MIT, copyright (c) 2026 William Benett. Retain notice in all copies/substantial portions including deployed bundle distribution. No root copyleft or SaaS source-disclosure term. This is a technical inventory, not legal advice.

| Component | Evidence | Disposition |
|---|---|---|
| Root software | LICENSE, upstream LICENSE | No material restriction identified under MIT; preserve notice |
| Frontend lock | site/package-lock.json: 169 non-root entries: 156 MIT, 4 Apache-2.0, 6 ISC, 1 BSD-3-Clause, 1 0BSD, 1 CC-BY-4.0 | Attribution/compliance action required; inspect actual bundled licences/notices; caniuse-lite 1.0.30001828 CC-BY-4.0 |
| Browser lock | tools/browser/package-lock.json: two Apache-2.0 entries | Attribution and notice compliance; development toolchain |
| UI assets | site/index.html inline SVG plane favicon, components/Icons.tsx, CSS; no standalone raster/icon asset in reviewed tree | Verify origin of inherited inline assets and font/emoji usage; do not imply trademark clearance |
| Knowledge | knowledge/countries.json, skills.json, tracks.json, docs/DATA.md | Curated inherited material; individual sourced facts vs copied text must be reviewed; refresh dates and source-specific terms |
| Historical register | pipeline/registers/us_h1b_2023.csv.gz; inherited references USCIS data | Verify exact origin, checksum, provenance, rights and any transformation; historical not current; quarantine from commercial delivery until reviewed |
| Source configs | pipeline/config/companies.json; 232 employer candidates (215 configured enabled), 20 feeds, source_reviews.json empty | Config != permission. Actual source_policy requires personal_research only; commercial approval path not built |
| Upstream services | inactive api.ts/auth.ts/Paywall/KitPanel; README and docs/DATA describe upstream private API | Commercial usage potentially blocked; do not activate upstream services, payment, auth or AI; independent replacements only |
| Brand | Global Mobility Radar vs Visa Job Atlas | Trademark/name clearance outstanding; do not use upstream branding as endorsement |
| New code | MIT root, founder employment | Professional interpretation of employment IP/outside business; no employer assets/credentials |

No material root software licence blocker found. Lock metadata is not a complete transitive/bundle compliance certification. Before release generate notices from installed lock-resolved dependencies, inspect distribution, verify inherited datasets and assets, legal/name/IP checks. No code deletion or licence alteration.
