# Offline policy operations runbook

Use a private owner-controlled directory, outside public web assets. Only public policy audit files, never profile/CV data. No network or remote delivery is implemented by this CLI. No task is installed by default.

From `pipeline/` using Python 3.12:

```sh
python -m jobtracker.policy_archive ingest /path/to/mobility-policy-audit.json
python -m jobtracker.policy_archive tick
python -m jobtracker.policy_archive status
python -m jobtracker.policy_archive ack NOTICE_KEY
python -m jobtracker.policy_archive export /path/to/new-policy-audit.json
python -m unittest discover -s tests -v
```

Optional `--db /private/path/policy.sqlite3` goes before the command. Default is ignored `pipeline/data/policy-archive.sqlite3`. Export creates a new file, refuses overwrite. Archive entries are immutable via CLI; exact bytes and digest retained. Ingest revalidates bounded schema, route identity, URL shape, snapshot digest, date/event references. Browser restore additionally checks exact compiled URL and full review rules. SHA-256 is integrity, not authenticity. Archive cannot activate eligibility.

An owner-approved system scheduler can run the explicit tick command daily. Repeated UTC day + archive digest is idempotent, changed archive same day is processed, errors return nonzero. Status reports recent runs and local notices, no applicant payloads. Old approvals require fresh manual review. No automated HTTP or messages; schedules and live source permission remain off. SQLite file backup/restore requires exclusive stopped access and an owner-controlled location; test backup before deployment.

Additional offline operations increment: Python stdlib SQLite archive (default ignored pipeline/data path), explicit ingest/export, bounded JSON and content digest validation, archive integrity, historical-only imported evidence, transactional idempotent daily tick keyed by UTC day + archive digest, persistent local notice read/resolution and run history, no network or external delivery. Ten synthetic Python regression tests. CLI is a scheduler-ready command, not an installed or enabled schedule. Imported registry is archive provenance only, not permission or authority; browser restore still validates exact current compiled registry and replay. No profile or applicant data intended. Source acquisition and authenticated server storage/monitoring still pending. CI pending.
