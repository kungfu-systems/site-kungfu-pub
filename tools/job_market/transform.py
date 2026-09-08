"""Normalize and classify observations without manufacturing historical state."""
import hashlib
import json
import re
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import duckdb

from .http import write_json

AGENT = re.compile(r'(?<![a-z])agents?(?![a-z])|智能体', re.I)
LLM = re.compile(r'大模型|语言模型|生成式|人工智能|(?<![a-z])(?:llm|ai)(?![a-z])|langchain|langgraph|mcp|rag|harness|tool calling|function calling', re.I)
OUTSIDE = re.compile(r'香港|澳门|澳門|台湾|臺灣|新加坡|美国|加拿大|英国|日本|韩国|hong kong|macau|taiwan|singapore|united states|canada|london|tokyo|seoul', re.I)
MAINLAND = re.compile(r'北京|上海|深圳|广州|杭州|南京|成都|武汉|西安|长沙|苏州|天津|重庆|合肥|济南|青岛|厦门|福州|珠海|无锡|宁波|佛山|东莞|郑州|大连|沈阳|海南|三亚|浙江|江苏|广东|四川|湖北|湖南|山东|福建|安徽|河北|河南|陕西|山西|广西|贵州|云南|吉林|辽宁|黑龙江|新疆|甘肃|青海|宁夏|西藏|内蒙古|江西|beijing|shanghai|shenzhen|guangzhou|hangzhou|chengdu|wuhan', re.I)


def digest(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True).encode()).hexdigest()


def parse_date(value):
    if not value:
        return None
    match = re.match(r'^(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})(?:日|(?=[T\s]|$))', str(value).strip())
    if not match:
        return None
    try:
        return date(*map(int, match.groups())).isoformat()
    except ValueError:
        return None


def is_mainland(row):
    place, country = row.get('locations', ''), row.get('country', '')
    if MAINLAND.search(place):
        return True
    if OUTSIDE.search(place + ' ' + country):
        return False
    return country.strip().lower() in ('中国', '中国大陆', '中国内地', 'china', 'mainland china')


def classify(row, taxonomy):
    title = row.get('title', '')
    text = '\n'.join([title, row.get('description', ''), row.get('requirements', '')])
    matches = list(AGENT.finditer(text))
    # An LLM context must occur locally, or the explicit title must identify an Agent role.
    qualified = bool(matches) and (bool(LLM.search(title)) or any(
        LLM.search(text[max(0, m.start() - 250):m.end() + 250]) for m in matches))
    if not qualified:
        return {'agent_relevant': False, 'role': 'excluded', 'skills': [], 'skill_evidence': []}
    if re.search(r'产品|product|运营|operations|设计师', title, re.I):
        role = 'product-and-operations'
    elif re.search(r'研究|research|算法|科学家|博士后', title, re.I):
        role = 'research-and-algorithms'
    elif AGENT.search(title) or re.search(r'开发|研发|工程师|架构|engineer|developer|architect', title, re.I):
        role = 'agent-engineering'
    else:
        role = 'agent-use-or-adjacent'
    found = []
    for skill in taxonomy['skills']:
        pattern = re.compile(skill['pattern'], re.I)
        for section, content in [('title', title), ('requirements', row.get('requirements', '')),
                                 ('description', row.get('description', ''))]:
            match = pattern.search(content)
            if not match:
                continue
            left = max(content.rfind('\n', 0, match.start()), content.rfind('。', 0, match.start())) + 1
            ends = [pos for pos in (content.find('\n', match.end()), content.find('。', match.end())) if pos >= 0]
            sentence = content[left:min(ends) if ends else len(content)].strip()
            requirement_level = 'mentioned'
            if re.search(r'优先|加分|preferred|nice.to.have', sentence, re.I):
                requirement_level = 'preferred'
            elif section == 'requirements' and re.search(r'必须|要求|具备|掌握|熟悉|精通|required|must', sentence, re.I):
                requirement_level = 'required-or-expected'
            elif section == 'description':
                requirement_level = 'responsibility-or-mention'
            found.append({'skill_id': skill['id'], 'section': section, 'level': requirement_level,
                          'match': match.group(), 'local_evidence': sentence[:400]})
            break
    contexts = [text[max(0, m.start() - 60):m.end() + 60] for m in matches]
    builds = any(re.search(r'开发|研发|构建|架构|搭建|design|build|develop', c, re.I) for c in contexts)
    uses = any(re.search(r'使用|运用|辅助|提效|重度用户|use\b|using\b', c, re.I) for c in contexts)
    relationship = 'build-and-use' if builds and uses else 'build' if builds else 'use' if uses else 'mention-only'
    return {'agent_relevant': True, 'role': role, 'agent_relationship': relationship,
            'skills': sorted(s['skill_id'] for s in found),
            'skill_evidence': found}


def identity(row):
    requisition = re.search(r'(?<![A-Za-z])J\d{4,}(?!\d)', row['title'], re.I)
    if row['source_id'] == 'baidu' and requisition:
        # Do not collapse different cities or hiring types under the same requisition.
        return ['baidu', requisition.group().upper(), row['locations'], row['hiring_type']]
    return [row['source_id'], row['source_job_id']]


def normalize(root, taxonomy):
    root = Path(root)
    observations = {}
    source_checks = []
    for path in sorted((root / 'runs').glob('*/observations.jsonl')):
        for line in path.read_text().splitlines():
            row = json.loads(line)
            evidence = row['evidence']
            body_path = root / 'raw' / (evidence['body_sha256'] + '.bin')
            if not body_path.is_file() or hashlib.sha256(body_path.read_bytes()).hexdigest() != evidence['body_sha256']:
                raise ValueError('Missing or corrupted evidence: ' + row['source_url'])
            key = digest([row['source_id'], row['source_job_id'], evidence])
            observations[key] = row
    for path in sorted((root / 'runs').glob('*/sources.json')):
        for source in json.loads(path.read_text()).values():
            source_checks.append({'run_id': path.parent.name, **source})
    groups = defaultdict(list)
    for row in observations.values():
        groups[tuple(identity(row))].append(row)
    jobs = []
    for key, versions in sorted(groups.items()):
        versions.sort(key=lambda r: (r['evidence']['fetched_at'], r['source_job_id']))
        row = dict(versions[-1])
        # Nankai appends links to other vacancies and site navigation after this
        # standalone marker. They must never supply this job's Agent/skill tags.
        if row['source_id'].startswith('nankai-'):
            for field in ('description', 'requirements'):
                row[field] = row.get(field, '').split('\n招聘信息\n', 1)[0]
        dates = sorted({d for r in versions if (d := parse_date(r.get('published_at')))})
        updated = sorted({d for r in versions if (d := parse_date(r.get('updated_at')))})
        row['job_id'] = digest(key)[:24]
        row['publication_date_candidates'] = dates
        row['published_at'] = dates[0] if len(dates) == 1 else None
        row['updated_at'] = updated[-1] if updated else None
        row['first_seen_at'] = versions[0]['evidence']['fetched_at']
        row['last_seen_at'] = versions[-1]['evidence']['fetched_at']
        row['observation_count'] = len(versions)
        row['source_post_ids'] = sorted({r['source_job_id'] for r in versions})
        row['evidence_refs'] = list({digest(r['evidence']): r['evidence'] for r in versions}.values())
        row['publication_conflict'] = len(dates) > 1
        # Invalid/future dates stay out of date cohorts; observation time is never substituted.
        observed_day = datetime.fromisoformat(row['last_seen_at']).astimezone(ZoneInfo('Asia/Shanghai')).date().isoformat()
        row['future_publication_date'] = bool(row['published_at'] and row['published_at'] > observed_day)
        if row['future_publication_date']:
            row['published_at'] = None
        row['mainland'] = is_mainland(row)
        row['taxonomy_version'] = taxonomy['version']
        row['review_status'] = 'rule-classified-unreviewed'
        row.update(classify(row, taxonomy))
        jobs.append(row)
    candidates = []
    comparisons = defaultdict(list)
    for row in jobs:
        # Candidate-only cross-source matches; no fuzzy or transitive count collapse.
        key = (re.sub(r'\s+', '', row['company']), re.sub(r'\s+|[（(]J\d+[)）]', '', row['title']), row['locations'])
        comparisons[key].append(row)
    for rows in comparisons.values():
        if len({r['source_id'] for r in rows}) > 1:
            candidates.append({'job_ids': [r['job_id'] for r in rows], 'status': 'needs-review'})
    output = root / 'normalized'
    output.mkdir(parents=True, exist_ok=True)
    (output / 'jobs.jsonl').write_text(''.join(json.dumps(j, ensure_ascii=False) + '\n' for j in jobs))
    write_json(output / 'duplicate-candidates.json', candidates)
    db = duckdb.connect(str(root / 'market.duckdb'))
    db.execute('BEGIN')
    try:
        db.execute('CREATE OR REPLACE TABLE observations (observation_id VARCHAR PRIMARY KEY, source_id VARCHAR, payload JSON)')
        if observations:
            db.executemany('INSERT INTO observations VALUES (?, ?, ?)',
                           [(k, v['source_id'], json.dumps(v, ensure_ascii=False)) for k, v in observations.items()])
        db.execute('CREATE OR REPLACE TABLE jobs (job_id VARCHAR PRIMARY KEY, source_id VARCHAR, company VARCHAR, title VARCHAR, published_at DATE, updated_at DATE, mainland BOOLEAN, agent_relevant BOOLEAN, record_type VARCHAR, payload JSON)')
        if jobs:
            db.executemany('INSERT INTO jobs VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                           [(j['job_id'], j['source_id'], j['company'], j['title'], j['published_at'], j['updated_at'],
                             j['mainland'], j['agent_relevant'], j['record_type'], json.dumps(j, ensure_ascii=False)) for j in jobs])
        db.execute('CREATE OR REPLACE TABLE source_checks (run_id VARCHAR, source_id VARCHAR, status VARCHAR, payload JSON)')
        if source_checks:
            db.executemany('INSERT INTO source_checks VALUES (?, ?, ?, ?)',
                           [(s['run_id'], s['id'], s['status'], json.dumps(s, ensure_ascii=False)) for s in source_checks])
        db.execute('COMMIT')
    except Exception:
        db.execute('ROLLBACK')
        raise
    finally:
        db.close()
    summary = {'observations': len(observations), 'unique_records': len(jobs),
               'mainland_agent_jobs': sum(j['mainland'] and j['agent_relevant'] and j['record_type'] == 'job' for j in jobs),
               'publication_conflicts': sum(j['publication_conflict'] for j in jobs),
               'cross_source_duplicate_candidates': len(candidates)}
    write_json(output / 'summary.json', summary)
    return jobs, source_checks, summary
