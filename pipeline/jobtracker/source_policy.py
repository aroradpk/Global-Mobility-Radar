"""Default-deny source review and conservative evidence policy (stdlib only)."""
import datetime as dt
import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit

REGISTRY_PATH = Path(__file__).resolve().parent.parent / "config" / "source_reviews.json"
SUPPORTED = {"greenhouse", "lever", "ashby"}
MAX_REVIEW_DAYS = 90
MAX_OBSERVATION_HOURS = 48


def source_id(company):
    return f"company:{company['ats']}:{company['slug']}"


def fingerprint(company):
    return hashlib.sha256(json.dumps(company, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()).hexdigest()


def safe_url(value):
    try:
        if not isinstance(value, str) or len(value) > 2048 or any(c.isspace() or ord(c) < 32 for c in value):
            return False
        u = urlsplit(value)
        return u.scheme == "https" and bool(u.hostname) and not u.username and not u.password and u.port in (None, 443)
    except ValueError:
        return False


def canonical_url(value):
    if not safe_url(value):
        return None
    u = urlsplit(value)
    return urlunsplit(("https", u.hostname.lower(), u.path or "/", u.query, ""))


def read_reviews(path=REGISTRY_PATH):
    with Path(path).open(encoding="utf-8") as f:
        data = json.load(f)
    if data.get("version") != 1 or not isinstance(data.get("reviews"), dict):
        raise ValueError("Invalid source review registry")
    return data["reviews"]


def approved_companies(cfg, reviews, today=None):
    today = today or dt.datetime.now(dt.timezone.utc).date()
    result = []
    for c in cfg.get("companies", []):
        if c.get("enabled", True) is not True or c.get("ats") not in SUPPORTED:
            continue
        r = reviews.get(source_id(c), {})
        if not isinstance(r, dict) or r.get("status") != "approved" or r.get("config_sha256") != fingerprint(c):
            continue
        if r.get("access_method") != "documented_public_api" or r.get("usage") != "personal_research" or r.get("robots_allowed") is not True or r.get("terms_allowed") is not True:
            continue
        if not all(safe_url(r.get(k)) for k in ("ownership_url", "api_docs_url", "terms_url")):
            continue
        if not all(isinstance(r.get(k), str) and r[k].strip() for k in ("reviewer", "attribution", "permission_note")):
            continue
        try:
            age = (today - dt.date.fromisoformat(r["reviewed_on"])).days
        except (KeyError, TypeError, ValueError):
            continue
        if 0 <= age <= MAX_REVIEW_DAYS:
            result.append(c)
    # Ambiguous source IDs or labels would corrupt snapshot attribution: deny both.
    return [c for c in result if sum(source_id(x) == source_id(c) for x in result) == 1 and sum(x["name"] == c["name"] for x in result) == 1]


def recently_observed(value, now=None):
    now = now or dt.datetime.now(dt.timezone.utc)
    try:
        observed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
        if observed.tzinfo is None:
            observed = observed.replace(tzinfo=dt.timezone.utc)
        return dt.timedelta(0) <= now - observed <= dt.timedelta(hours=MAX_OBSERVATION_HOURS)
    except (AttributeError, TypeError, ValueError):
        return False


def vacancy_signal(positive, relocation, negative, description_checked):
    if not description_checked:
        return "unknown"
    if negative:
        return "conditional" if positive else "blocked"
    if positive:
        return "explicit"
    return "relocation" if relocation else "unknown"


def register_kind(source):
    if source in {"ie_dete_permits", "ca_lmia_positive", "us_uscis_h1b"}:
        return "historical"
    if source in {"uk_sponsor_register", "nl_ind_recognised_sponsor", "dk_siri_fast_track"}:
        return "register_unverified"
    return "unknown"
