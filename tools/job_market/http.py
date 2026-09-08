"""Bounded anonymous HTTP capture, immutable bodies, and robots enforcement."""
import hashlib
import json
import re
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

USER_AGENT = 'KungfuPubResearch/0.1 (+https://pub.kungfu-trader.com/)'


def now():
    return datetime.now(timezone.utc).isoformat(timespec='seconds')


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True) + '\n')
    temporary.replace(path)


def robots_allowed(text, url, agent=USER_AGENT):
    """Support Google's common * / $ rules; select the most specific UA group."""
    groups, agents, rules = [], [], []
    for line in text.splitlines() + ['User-agent: __end__']:
        line = line.split('#', 1)[0].strip()
        if ':' not in line:
            continue
        key, value = (p.strip() for p in line.split(':', 1))
        key = key.lower()
        if key == 'user-agent':
            if rules:
                groups.append((agents, rules))
                agents, rules = [], []
            agents.append(value.lower())
        elif key in ('allow', 'disallow') and agents and value:
            rules.append((key, value))
    matches = []
    for group_agents, group_rules in groups:
        lengths = [0 if a == '*' else len(a) for a in group_agents
                   if a == '*' or a in agent.lower()]
        if lengths:
            matches.append((max(lengths), group_rules))
    if not matches:
        return True
    specific = max(m[0] for m in matches)
    parsed = urllib.parse.urlsplit(url)
    path = urllib.parse.unquote(parsed.path + ('?' + parsed.query if parsed.query else ''))
    applicable = []
    for length, group_rules in matches:
        if length != specific:
            continue
        for kind, pattern in group_rules:
            expression = '^' + re.escape(pattern).replace(r'\*', '.*')
            if pattern.endswith('$'):
                expression = expression[:-2] + '$'
            if re.search(expression, path):
                applicable.append((len(pattern.replace('*', '').rstrip('$')), kind == 'allow'))
    return max(applicable)[1] if applicable else True


class FetchError(RuntimeError):
    pass


class Client:
    def __init__(self, root, run_id, delay=1.0):
        self.root = Path(root)
        self.run_id = run_id
        self.delay = delay
        self.run = self.root / 'runs' / run_id
        self.run.mkdir(parents=True, exist_ok=True)
        self.manifest = self.run / 'requests.jsonl'
        self.robots = {}
        self.last_request = {}
        self.cache = {}
        if self.manifest.exists():
            for line in self.manifest.read_text().splitlines():
                item = json.loads(line)
                if item['status'] == 200 and item.get('body_sha256'):
                    self.cache[(item['method'], item['url'])] = item

    def body(self, record):
        path = self.root / 'raw' / (record['body_sha256'] + '.bin')
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != record['body_sha256']:
            raise FetchError('raw-snapshot-hash-mismatch')
        return data

    def _request(self, url):
        parsed = urllib.parse.urlsplit(url)
        if parsed.scheme != 'https' or parsed.username or parsed.password:
            raise FetchError('only anonymous HTTPS is supported')
        wait = self.delay - (time.monotonic() - self.last_request.get(parsed.netloc, 0))
        if wait > 0:
            time.sleep(wait)
        self.last_request[parsed.netloc] = time.monotonic()
        status, error, data, content_type, final_url = 0, None, b'', '', url
        try:
            req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT, 'Accept': '*/*'})
            with urllib.request.urlopen(req, timeout=25) as response:
                status = response.status
                content_type = response.headers.get('Content-Type', '')
                final_url = response.url
                data = response.read(8_000_001)
                if len(data) > 8_000_000:
                    raise FetchError('response-exceeds-8MB-limit')
        except urllib.error.HTTPError as exc:
            status, error = exc.code, 'http-' + str(exc.code)
        except (urllib.error.URLError, TimeoutError, OSError) as exc:
            error = type(exc).__name__
        digest = hashlib.sha256(data).hexdigest() if data else None
        if digest:
            path = self.root / 'raw' / (digest + '.bin')
            path.parent.mkdir(parents=True, exist_ok=True)
            if not path.exists():
                with path.open('xb') as output:
                    output.write(data)
        record = dict(method='GET', url=url, final_url=final_url, fetched_at=now(),
                      status=status, error=error, body_sha256=digest, content_type=content_type)
        with self.manifest.open('a') as output:
            output.write(json.dumps(record, ensure_ascii=False) + '\n')
        if status == 200 and digest:
            self.cache[('GET', url)] = record
        return record

    def policy(self, url):
        u = urllib.parse.urlsplit(url)
        origin = u.scheme + '://' + u.netloc
        if origin not in self.robots:
            r = self.cache.get(('GET', origin + '/robots.txt')) or self._request(origin + '/robots.txt')
            body = self.body(r).decode('utf-8', 'replace') if r.get('body_sha256') else ''
            challenge = any(s in body.lower() for s in ('security verification', 'captcha', '访问验证', '安全验证'))
            html_404 = '<html' in body.lower()[:500] and bool(re.search(r'<title[^>]*>[^<]*404', body, re.I))
            if challenge:
                policy = {'state': 'challenge', 'allowed': False, 'text': '', 'evidence': r}
            elif r['status'] in (404, 410) or (r['status'] == 200 and html_404):
                policy = {'state': 'not-published', 'allowed': True, 'text': '', 'evidence': r}
            elif r['status'] == 200 and '<html' not in body.lower()[:500]:
                policy = {'state': 'checked', 'allowed': True, 'text': body, 'evidence': r}
            else:
                policy = {'state': 'unavailable', 'allowed': False, 'text': '', 'evidence': r}
            self.robots[origin] = policy
        return self.robots[origin]

    def get(self, url):
        policy = self.policy(url)
        if not policy['allowed']:
            raise FetchError('robots-unavailable: ' + policy['state'])
        if not robots_allowed(policy['text'], url):
            raise FetchError('robots-disallowed')
        record = self.cache.get(('GET', url)) or self._request(url)
        if record['status'] != 200:
            raise FetchError(record['error'] or 'empty-response')
        # Cross-host redirects must be admitted independently on future fetches.
        if urllib.parse.urlsplit(record['final_url']).netloc != urllib.parse.urlsplit(url).netloc:
            raise FetchError('cross-host-redirect-needs-source-review')
        body = self.body(record).decode('utf-8', 'replace')
        if re.search(r'<title[^>]*>[^<]*(?:Security Verification|验证码|安全验证)', body, re.I):
            raise FetchError('security-challenge-no-bypass')
        return body, record
