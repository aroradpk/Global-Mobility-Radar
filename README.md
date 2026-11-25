> **Global Mobility Radar development fork — not production-ready.** See [master roadmap](docs/master-product-roadmap.md) and [handover](HANDOVER.md). The inherited API, account, payment and deployment features are not approved for use. Do not upload a personal CV, configure upstream credentials, run live collectors or deploy this fork until the relevant gates are accepted. The inherited deployment and redirect workflows are removed on the development branch. The following upstream README is retained for attribution and reference only; its live app and instructions describe the upstream project, not our verified runtime.

[Run the independent local preview with synthetic data](docs/local-preview.md). No account or private API is needed. Full build and browser checks remain pending.

# Visa Job Atlas

**Upload your CV, answer a few questions, and get the countries, open jobs and 12-month plan most likely to get you a visa-sponsored job.** 18 career fields across tech, engineering, business, health and creative work. English and Brazilian Portuguese.

**Live:** https://visa-job-atlas.pages.dev/

Your CV is read inside your browser and never uploaded. Only what is extracted from it (skills, level, years, languages, degree, certifications) and your answers go to the Visa Job Atlas API, which matches them against the day's postings. An account is optional; see the privacy policy on the site for what is kept and why.

## What it does

1. **Reads your CV (PDF or text)** with pdf.js and pulls out skills, years of experience, level, degree, certifications and languages. You review and correct it.
2. **Interviews you**, with questions an advisor would ask:
   - citizenships (an EU passport changes everything)
   - where you live and where you'd like to go
   - what matters most to you
   - whether you're staying in your field or switching, across 18 fields:
     - tech: software, data, DevOps, security, embedded, QA, product
     - creative: design, video
     - engineering: mechanical, electrical, civil
     - business: marketing, sales, finance, operations, people/HR
     - health: healthcare
   - willingness to learn a language
   - hours per week, budget and timeline
3. **Ranks 22 countries** with an explanation for every point: visa openness, live demand for your field, language fit, degree rules, free movement for EU citizens.
4. **Matches you to open postings** refreshed every morning. Each one shows its visa signal, your matched skills, skills to learn, and any language you'd need.
5. **Builds a phased plan**, sized to your hours, budget and timeline:
   - skills employers ask for that your CV doesn't show (from live postings)
   - certifications worth it at your level
   - portfolio projects
   - a language plan
   - visa-route steps
   - a weekly routine
6. **Shows what would make you indispensable**: the skills your top countries ask for most that your CV doesn't show, ranked, with the certifications and projects that prove them.

The free plan shows your best 3 jobs, your top 3 countries in full and the first leg of the plan. Pro (R$39.99/month or R$99.99 for 3 months) opens everything and adds a Markdown export. Anyone can print the plan to PDF.

## What is open and what isn't

This repo (the site, the matching engine, the country and career knowledge, and the data pipeline) is open source under the MIT licence. The API that serves postings, checks plans, takes payments through Mercado Pago and writes application kits is in a private repo. It imports the matching engine from here, so the logic is the same.

## How the data is built

```
government sponsor registers ─┐
employer job boards (230+)  ──┼─► pipeline (Python, stdlib) ─► jobs/<family>.json, market.json ─► API (matching, plans) ─► web app (React)
job feeds (19)              ──┘        daily on GitHub Actions          uploaded to Workers KV            Cloudflare Workers     Cloudflare Pages
```

- **Sponsor registers:**
  - UK Register of Licensed Sponsors
  - Ireland DETE employment permits by company
  - Netherlands IND recognised sponsors
  - Canada positive LMIAs
  - Denmark SIRI fast-track
  - US USCIS H-1B employer data
- **Employer boards:** public Greenhouse, Lever, Ashby, SmartRecruiters, Workday, Workable, Recruitee and Personio boards, plus Amazon and Google.
- **Feeds:** EURES (the EU's job-mobility portal, English-language ads by occupation), NHS Jobs (with each advert's Certificate of Sponsorship answer), Japan Dev, TokyoDev, HN "Who is hiring", Arbeitnow, Bundesagentur für Arbeit, GermanTechJobs, JobTech (Sweden), Jobindex (Denmark), Landing.jobs, Relocate.me, MyCareersFuture (Singapore), Mastodon job tags and more.
- **Each posting** gets:
  - a job family and seniority
  - its required skills (from [`knowledge/skills.json`](knowledge/skills.json))
  - any non-English language it requires
  - a visa label: `explicit` (offers sponsorship), `conditional`, `register` (employer is on that country's sponsor register), `relocation`, `unknown`, or `blocked` ("must have the right to work", clearance, citizens only…). Blocked postings are dropped.
- **Countries with no public register** (Germany, Japan, the Nordics…): any employer can file a work permit, so English-language roles there count partially toward demand instead of being treated as "no visa".

Every source, the ones evaluated and left out, and why: [`docs/SOURCES.md`](docs/SOURCES.md).

Country rules and career tracks are curated by hand in [`knowledge/`](knowledge/), with sources, and rechecked against official pages (rules as of October 2026).

## Run it locally

```bash
# 1. Data (Python 3.10+, no dependencies; first run downloads the registers)
cd pipeline
python -m jobtracker run        # registers + poll + export to site/public/data
python -m jobtracker test

# 2. App (Node 20+)
cd ../site
npm install
npm run dev                     # http://localhost:5173
npm test
```

Pipeline commands: `registers`, `poll`, `export`, `run`, `sponsor <name>` (look an employer up in the registers), `discover <name> --add` (find a company's public job board), `trend`.

## Repository layout

| Path | What |
|---|---|
| `pipeline/` | Job-data pipeline: ATS and feed fetchers, sponsor-register loaders, family/skill/language/visa tagging, SQLite history, JSON export |
| `knowledge/` | Curated, bilingual knowledge: `countries.json` (visa routes, thresholds, residence paths, CV conventions), `tracks.json` (9 career tracks, from software and security to design and video editing), `skills.json` |
| `site/` | The web app: Vite + React + TypeScript; CV parsing (`src/cv`), matching and planning (`src/engine`) |
| `docs/DATA.md` | Data contract between the pipeline and the app |
| `.github/workflows/` | CI (tests + build) and the daily refresh-and-deploy job |

## Adding an employer or a country

- **Employer:** `python -m jobtracker discover "Company Name" --add` finds its public job board and adds it to `pipeline/config/companies.json`.
- **Country:** add an entry to `knowledge/countries.json` following `docs/DATA.md`. Link every number to its official source.

## Disclaimer

This is not legal or immigration advice. Visa rules change often. Confirm every route on the official government page, and with the employer, before you act. Job postings belong to their publishers; the app links to the original posting.

## License

[MIT](LICENSE) © William Benett
