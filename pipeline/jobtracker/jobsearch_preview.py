"""On-demand, bounded Swedish public JobSearch import. No employer verification."""
import argparse
import datetime as dt
import json
import re
import os
import urllib.error
import urllib.parse
import urllib.request
import urllib.robotparser
from pathlib import Path

HOST = 'https://jobsearch.api.jobtechdev.se'
SOURCE = 'government:se:jobsearch'
LICENSE = 'https://data.arbetsformedlingen.se/dataservice/jobsearch/'
AGENT = 'GlobalMobilityRadar/1.0'
MAX_BYTES = 5 * 1024 * 1024
QUERIES = ('software engineer', 'javascript', 'systemutvecklare')
FIELDS = ['id', 'title', 'company', 'location', 'countries', 'url', 'posted', 'firstSeen',
          'family', 'seniority', 'remote', 'visa', 'registerIn', 'skills', 'langs', 'salary']


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def get(url, limit):
    request = urllib.request.Request(url, headers={'User-Agent': AGENT, 'Accept': 'application/json, text/plain'})
    opener = urllib.request.build_opener(NoRedirect())
    with opener.open(request, timeout=15) as response:
        raw = response.read(limit + 1)
        if len(raw) > limit:
            raise ValueError('Response exceeds size limit')
        return raw


def fetch_search(query, getter=get):
    if query not in QUERIES:
        raise ValueError('Choose a supported public search term')
    url = HOST + '/search?' + urllib.parse.urlencode({'q': query, 'limit': 20})
    try:
        robots = getter(HOST + '/robots.txt', 65536).decode('utf-8', 'strict')
    except urllib.error.HTTPError as exc:
        if exc.code not in (404, 410):
            raise
        robots = 'User-agent: *\nDisallow:'  # absent policy; documented public API
    if '<html' in robots.lower() or not re.search(r'^\s*user-agent\s*:', robots, re.I | re.M):
        raise ValueError('Unrecognised robots policy; search refused')
    policy = urllib.robotparser.RobotFileParser()
    policy.parse(robots.splitlines())
    if not policy.can_fetch(AGENT, url):
        raise ValueError('Robots policy disallows search')
    return json.loads(getter(url, MAX_BYTES))


def clean(value, limit=140):
    return ' '.join(value.split())[:limit] if isinstance(value, str) else ''


def snapshot(payload, now):
    if not isinstance(payload, dict) or not isinstance(payload.get('hits'), list) or len(payload['hits']) > 20:
        raise ValueError('Unexpected or oversized JobSearch result')
    stamp = now.astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    rows, evidence, seen = [], {}, set()
    for hit in payload['hits']:
        if not isinstance(hit, dict):
            continue
        ident = str(hit.get('id', ''))
        if not re.fullmatch(r'[0-9]{1,20}', ident) or ident in seen or hit.get('removed') is True:
            continue
        title = clean(hit.get('headline'))
        employer = hit.get('employer')
        company = clean(employer.get('name'), 100) if isinstance(employer, dict) else ''
        addr = hit.get('workplace_address')
        if not isinstance(addr, dict) or clean(addr.get('country')).lower() not in ('sverige', 'sweden'):
            continue
        if not title or not company or not re.search(r'\b(?:software|developer|utvecklare|systemutvecklare|programmerare|javascript|full[ -]?stack)\b', title, re.I):
            continue
        url = 'https://arbetsformedlingen.se/platsbanken/annonser/' + ident
        if hit.get('webpage_url') != url:
            continue
        deadline = hit.get('application_deadline')
        try:
            expires = dt.datetime.fromisoformat(deadline.replace('Z', '+00:00'))
            if expires.tzinfo is None:  # source-local dates in Sweden
                from zoneinfo import ZoneInfo
                expires = expires.replace(tzinfo=ZoneInfo('Europe/Stockholm'))
            if expires <= now:
                continue
        except (AttributeError, TypeError, ValueError):
            continue
        seen.add(ident)
        uid = SOURCE + ':' + ident
        location = clean(addr.get('city') or addr.get('municipality'))
        posted = clean(hit.get('publication_date'), 10)
        if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', posted):
            posted = ''
        rows.append([uid, title, company, (location + ', Sweden').strip(', '), ['SE'], url, posted,
                     stamp[:10], 'software', 'unspecified', 0, 'unknown', [], [], [], ''])
        evidence[uid] = {'sourceId': SOURCE, 'sourceUrl': url, 'observedAt': stamp,
                         'descriptionCheckedAt': '', 'positive': '', 'negative': '', 'relocation': '',
                         'status': 'unverified_lead'}
    return {'generatedAt': stamp, 'fields': FIELDS, 'rows': rows, 'evidence': evidence}


def refresh(getter=get, now=None):
    """Three fixed public queries; failed query invalidates the refresh."""
    now = now or dt.datetime.now(dt.timezone.utc)
    result = {"generatedAt": now.astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
              "fields": FIELDS, "rows": [], "evidence": {}}
    seen = set()
    for query in QUERIES:
        current = snapshot(fetch_search(query, getter), now)
        for row in current["rows"]:
            uid = row[0]
            if uid in seen:
                continue
            seen.add(uid)
            result["rows"].append(row)
            result["evidence"][uid] = current["evidence"][uid]
    return result


def atomic_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    import tempfile
    fd, tmp = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as stream:
            json.dump(data, stream, ensure_ascii=False)
        os.replace(tmp, path)
    finally:
        Path(tmp).unlink(missing_ok=True)


def run_refresh(output, health, getter=get, now=None):
    now = now or dt.datetime.now(dt.timezone.utc)
    checked = now.astimezone(dt.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
    try:
        result = refresh(getter, now)
        atomic_json(output, result)
    except (OSError, ValueError, TypeError, UnicodeError):
        atomic_json(health, {"sourceId": SOURCE, "checkedAt": checked, "status": "failed",
                             "coverage": "unknown", "previousSnapshotRetained": output.exists()})
        return False
    atomic_json(health, {"sourceId": SOURCE, "checkedAt": checked, "status": "success",
                         "coverage": "bounded_search_not_exhaustive", "leads": len(result["rows"])})
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--query', choices=QUERIES, default=QUERIES[0])
    parser.add_argument('--live', action='store_true', help='Explicitly perform one public API search')
    parser.add_argument('--refresh', action='store_true', help='Run all three fixed public searches; requires --live')
    args = parser.parse_args()
    if not args.live:
        print('No requests made. Review the source documentation before using --live.')
        return
    if args.refresh:
        folder = Path(__file__).resolve().parent.parent / 'data'
        if not run_refresh(folder / 'jobsearch-preview.json', folder / 'jobsearch-health.json'):
            parser.exit(1, 'Source refresh failed; coverage unknown. Prior snapshot retained if available.\n')
        print('Bounded source refresh complete. Import the private jobsearch-preview.json file; leads are unverified.')
        return
    result = snapshot(fetch_search(args.query), dt.datetime.now(dt.timezone.utc))
    out = Path(__file__).resolve().parent.parent / 'data' / 'jobsearch-preview.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    tmp = out.with_suffix('.tmp')
    tmp.write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
    tmp.replace(out)
    print(f'{len(result["rows"])} unverified government-portal leads saved to {out}')


if __name__ == '__main__':
    main()
