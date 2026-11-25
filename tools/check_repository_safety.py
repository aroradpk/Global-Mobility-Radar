"""Narrow tracked-tree safety check; not a full secret/history scanner."""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SECRET_PATTERNS = {
    "private key": re.compile(rb"-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----"),
    "GitHub token": re.compile(rb"(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{60,})"),
    "AWS access key ID": re.compile(rb"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b"),
    "OpenAI-style token": re.compile(rb"\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}\b"),
}
ALLOWED_WORKFLOWS = {".github/workflows/ci.yml"}


def path_findings(path):
    name = Path(path).name.lower()
    reasons = []
    if path.startswith(".github/workflows/") and path not in ALLOWED_WORKFLOWS:
        reasons.append("unapproved workflow")
    if path.startswith(("pipeline/data/", "site/public/data/")):
        reasons.append("generated/private data tracked")
    if ((name == ".env" or name.startswith(".env.")) and name not in {".env.example", ".env.sample", ".env.template"}) or name.endswith((".pem", ".key", ".p12", ".pfx", ".local")):
        reasons.append("potential credential/config file")
    return reasons


def content_findings(data):
    if b"\x00" in data:
        return []
    return [label for label, pattern in SECRET_PATTERNS.items() if pattern.search(data)]


def main():
    names = subprocess.check_output(["git", "ls-files", "-z"], cwd=ROOT).decode("utf-8", "surrogateescape").split("\0")
    findings = []
    for name in filter(None, names):
        file = ROOT / name
        for reason in path_findings(name):
            findings.append((name, reason))
        if file.is_symlink():
            findings.append((name, "tracked symlink requires review"))
            continue
        if not file.is_file():
            findings.append((name, "tracked file missing"))
            continue
        for reason in content_findings(file.read_bytes()):
            findings.append((name, reason))
    for name, reason in findings:
        print(f"{name!r}: {reason}", file=sys.stderr)
    print(f"Tracked-tree safety check: {len(findings)} finding(s).")
    return 1 if findings else 0


if __name__ == "__main__":
    raise SystemExit(main())
