"""Adapters for anonymous, public recruitment surfaces; no login/session harvesting."""
import json
import re
from urllib.parse import urlencode

from bs4 import BeautifulSoup

from .http import FetchError, now, write_json


def baidu_state(html):
    match = re.search(r'window\.__INITIAL_DATA__\s*=\s*(.*?);\s*window\.prefix=', html, re.S)
    if not match:
        raise FetchError('baidu-SSR-schema-missing')
    # JS undefined is accepted only as an unquoted literal value, never evaluated.
    tokens = re.split(r'("(?:\\.|[^"\\])*")', match.group(1))
    for i in range(0, len(tokens), 2):
        tokens[i] = re.sub(r'\bundefined\b', 'null', tokens[i])
    return json.loads(''.join(tokens))


def evidence(record):
    return {k: record[k] for k in ('url', 'fetched_at', 'body_sha256')}


def baidu(client, config, emit):
    count = 0
    queries = []
    errors = []
    for hiring_type in config['hiring_types']:
        for keyword in config['keywords']:
            url = 'https://talent.baidu.com/jobs/social-list?' + urlencode(
                {'search': keyword, 'recruitType': hiring_type})
            try:
                body, record = client.get(url)
                data = baidu_state(body)['listData']
                if data.get('keyWord') != keyword or data.get('recruitType') != hiring_type:
                    raise FetchError('baidu-filter-not-applied')
                jobs = data['listDetailData']
                queries.append({'keyword': keyword, 'hiring_type': hiring_type,
                                'reported_count': data['total'], 'retrieved': len(jobs),
                                'complete': len(jobs) >= data['total']})
                for job in jobs:
                    emit({'source_id': config['id'], 'source_job_id': job['postId'],
                          'company': '百度', 'title': job['name'], 'locations': job.get('workPlace', ''),
                          'country': '中国', 'hiring_type': hiring_type,
                          'source_url': f"https://talent.baidu.com/jobs/detail/{hiring_type}/{job['postId']}",
                          'published_at': job.get('publishDate'), 'updated_at': job.get('updateDate'),
                          'date_basis': 'publisher-reported-date', 'historical_snapshot': False,
                          'description': job.get('workContent', ''), 'requirements': job.get('serviceCondition', ''),
                          'education': job.get('education'), 'experience': job.get('workYears'),
                          'record_type': 'job', 'source_type': 'company-careers',
                          'coverage_kind': 'keyword-first-page', 'evidence': evidence(record)})
                    count += 1
            except (FetchError, KeyError, ValueError) as exc:
                errors.append({'keyword': keyword, 'hiring_type': hiring_type, 'error': str(exc)})
                if 'http-403' in str(exc) or 'http-429' in str(exc) or 'robots' in str(exc):
                    return {'status': 'partial' if count else 'blocked', 'records': count,
                            'queries': queries, 'errors': errors}
    return {'status': 'partial' if errors or any(not q['complete'] for q in queries) else 'ok',
            'records': count, 'queries': queries, 'errors': errors,
            'limitation': 'SSR first page only; public API returned no-auth/illegal-visit during feasibility check; no bypass.'}


def tencent(client, config, emit):
    count, queries, errors = 0, [], []
    for keyword in config['keywords']:
        ids = set()
        expected = None
        previous_page = None
        try:
            for page in range(1, config.get('max_pages', 30) + 1):
                url = 'https://careers.tencent.com/tencentcareer/api/post/Query?' + urlencode(
                    {'keyword': keyword, 'pageIndex': page, 'pageSize': 20, 'language': 'zh-cn'})
                body, record = client.get(url)
                payload = json.loads(body)
                if payload.get('Code') != 200:
                    raise FetchError('tencent-non-success-payload')
                data = payload['Data']
                expected = int(data['Count'])
                jobs = data['Posts'] or []
                page_ids = [j['PostId'] for j in jobs]
                if jobs and page_ids == previous_page:
                    raise FetchError('tencent-pagination-repeated')
                previous_page = page_ids
                for job in jobs:
                    ids.add(job['PostId'])
                    emit({'source_id': config['id'], 'source_job_id': job['PostId'],
                          'company': '腾讯', 'title': job['RecruitPostName'],
                          'locations': job.get('LocationName', ''), 'country': job.get('CountryName', ''),
                          'hiring_type': 'SOCIAL',
                          'source_url': 'https://careers.tencent.com/zh-cn/jobdesc.html?' + urlencode({'postId': job['PostId']}),
                          'published_at': None, 'updated_at': job.get('LastUpdateTime'),
                          'date_basis': 'last-update-only', 'historical_snapshot': False,
                          'description': job.get('Responsibility', ''), 'requirements': '',
                          'experience': job.get('RequireWorkYearsName'), 'record_type': 'job',
                          'source_type': 'company-careers', 'coverage_kind': 'keyword-paginated-responsibilities',
                          'evidence': evidence(record)})
                    count += 1
                if len(ids) >= expected or not jobs:
                    break
            queries.append({'keyword': keyword, 'reported_count': expected,
                            'retrieved': len(ids), 'complete': len(ids) >= (expected or 0)})
        except (FetchError, KeyError, ValueError) as exc:
            errors.append({'keyword': keyword, 'error': str(exc)})
            queries.append({'keyword': keyword, 'reported_count': expected, 'retrieved': len(ids), 'complete': False})
            if '403' in str(exc) or '429' in str(exc) or 'robots' in str(exc):
                break
    return {'status': 'partial' if errors or any(not q['complete'] for q in queries) else 'ok',
            'records': count, 'queries': queries, 'errors': errors,
            'limitation': 'LastUpdateTime is NOT publication time; list responsibilities may omit qualifications.'}


def page_text(html):
    soup = BeautifulSoup(html, 'html.parser')
    for element in soup(['script', 'style', 'nav', 'footer', 'header', 'noscript']):
        element.decompose()
    return '\n'.join(s.strip() for s in soup.stripped_strings)


def historical_page(client, config, emit):
    body, record = client.get(config['url'])
    text = page_text(body)
    date = config['published_at']
    date_variants = (date, date.replace('-', '/'), date.replace('-', '.'),
                     f'{int(date[:4])}年{int(date[5:7])}月{int(date[8:])}日')
    if not any(d in text for d in date_variants):
        raise FetchError('declared-publication-date-not-found-on-page')
    if config['title_anchor'] not in text:
        raise FetchError('declared-job-title-not-found-on-page')
    content = text
    if config.get('text_start'):
        marker = config['text_start']
        if marker not in content:
            raise FetchError('job-section-start-not-found')
        content = content.split(marker, 1)[1]
    if config.get('text_end'):
        marker = config['text_end']
        if marker not in content:
            raise FetchError('job-section-end-not-found')
        content = content.split(marker, 1)[0]
    # Personal contact fields are not part of the structured research dataset.
    content = re.sub(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', '[联系信息省略]', content)
    content = re.sub(r'(?<!\d)1[3-9]\d{9}(?!\d)', '[联系信息省略]', content)
    emit({'source_id': config['id'], 'source_job_id': config['id'],
          'company': config['company'], 'title': config['title'], 'locations': config['locations'],
          'country': '中国', 'hiring_type': config.get('hiring_type', 'UNKNOWN'),
          'source_url': config['url'], 'published_at': date, 'updated_at': None,
          'date_basis': 'announcement-page-date', 'historical_snapshot': False,
          'description': content, 'requirements': '', 'record_type': config.get('record_type', 'job'),
          'source_type': config.get('source_type', 'university-employer-posting'),
          'coverage_kind': 'purposive-historical-seed', 'evidence': evidence(record)})
    return {'status': 'ok', 'records': 1, 'limitation': 'Page date verified in current page; no contemporaneous historical snapshot.'}


def probe(client, config, emit):
    body, record = client.get(config['url'])
    return {'status': 'not-collected', 'records': 0,
            'limitation': config['limitation'], 'evidence': evidence(record)}


ADAPTERS = {'baidu': baidu, 'tencent': tencent, 'historical-page': historical_page, 'probe': probe}


def collect(client, config, selected=None):
    observations = client.run / 'observations.jsonl'
    outcomes_path = client.run / 'sources.json'
    outcomes = json.loads(outcomes_path.read_text()) if outcomes_path.exists() else {}
    # A completed source is resumable. A new run ID re-observes it on a new date.
    for source in config['sources']:
        if selected and source['id'] not in selected:
            continue
        if source['id'] in outcomes:
            continue
        print('collect:', source['id'], flush=True)
        pending = []
        try:
            result = ADAPTERS[source['adapter']](client, source, pending.append)
        except (FetchError, KeyError, ValueError) as exc:
            result = {'status': 'blocked' if 'robots' in str(exc) or 'http-' in str(exc) else 'parse-error',
                      'records': 0, 'error': str(exc)}
        with observations.open('a') as output:
            for row in pending:
                row['run_id'] = client.run_id
                output.write(json.dumps(row, ensure_ascii=False) + '\n')
        outcomes[source['id']] = {'id': source['id'], 'label': source['label'],
                                  'finished_at': now(), **result}
        write_json(outcomes_path, outcomes)
        print('  ', result['status'], result['records'], flush=True)
    return outcomes
