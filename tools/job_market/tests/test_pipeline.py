import hashlib
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from tools.job_market.export import export, public_job, weekly_cohorts
from tools.job_market.http import Client, FetchError, robots_allowed, write_json
from tools.job_market.sources import baidu_state, collect, tencent
from tools.job_market.transform import classify, identity, is_mainland, normalize, parse_date

TAXONOMY = json.loads(Path(__file__).parents[1].joinpath('taxonomy.json').read_text())


def job(**changes):
    row = dict(source_id='example', source_job_id='1', title='AI Agent 开发工程师',
               company='Example', locations='北京', country='中国', hiring_type='SOCIAL',
               description='构建大模型 Agent，使用 Python 和 LangGraph。', requirements='',
               published_at='2026-03-08', updated_at=None, record_type='job',
               source_type='company-careers', source_url='https://example.org/job/1',
               date_basis='publisher-reported-date', coverage_kind='test', historical_snapshot=False)
    row.update(changes)
    return row


class RulesTest(unittest.TestCase):
    def test_dates_and_invalid_values(self):
        for value in ('2026年3月8日', '2026/03/08', '2026-03-08T10:00:00Z'):
            self.assertEqual(parse_date(value), '2026-03-08')
        for value in ('2026-02-30', '2026-03-081', '今天', None):
            self.assertIsNone(parse_date(value))

    def test_agent_qualification_and_evidence(self):
        result = classify(job(requirements='熟悉 Python；LangGraph 经验优先。'), TAXONOMY)
        self.assertTrue(result['agent_relevant'])
        self.assertIn('langgraph', result['skills'])
        self.assertEqual(next(e for e in result['skill_evidence'] if e['skill_id'] == 'langgraph')['level'], 'preferred')
        self.assertIn(result['agent_relationship'], ('build', 'build-and-use'))
        for title, description in [('保险 Agent', '负责客户保险销售'),
                                   ('网络工程师', '安装监控 agent'),
                                   ('RAG 工程师', '使用大模型构建检索系统'),
                                   ('销售', '保险 Agent' + '常规销售工作' * 100 + '公司也研究人工智能')]:
            self.assertFalse(classify(job(title=title, description=description), TAXONOMY)['agent_relevant'])

    def test_mainland_filter(self):
        self.assertTrue(is_mainland(job(locations='北京/深圳')))
        for place in ('香港', '新加坡', '臺灣', 'London'):
            self.assertFalse(is_mainland(job(locations=place)))
        self.assertFalse(is_mainland(job(locations='未知', country='')))

    def test_baidu_requisition_dedupe_preserves_location_and_type(self):
        a = job(source_id='baidu', title='Agent 工程师 (J12345)')
        self.assertEqual(identity(a), identity({**a, 'source_job_id': 'second'}))
        self.assertNotEqual(identity(a), identity({**a, 'locations': '上海'}))
        self.assertNotEqual(identity(a), identity({**a, 'hiring_type': 'INTERN'}))

    def test_ssr_parser_never_executes_javascript(self):
        self.assertEqual(baidu_state('window.__INITIAL_DATA__={"a":undefined,"b":"undefined"};window.prefix="";'), {'a': None, 'b': 'undefined'})
        with self.assertRaises(ValueError):
            baidu_state('window.__INITIAL_DATA__={"a":process.exit()};window.prefix="";')

    def test_robots_query_wildcards_and_specific_groups(self):
        rules = 'User-agent: *\nDisallow: /*?*\nAllow: /public?ok$\n'
        self.assertFalse(robots_allowed(rules, 'https://example.org/jobs?q=Agent'))
        self.assertTrue(robots_allowed(rules, 'https://example.org/public?ok'))
        self.assertFalse(robots_allowed(rules, 'https://example.org/public?okay'))
        specific = 'User-agent: *\nDisallow: /\nUser-agent: KungfuPubResearch\nAllow: /jobs\nDisallow: /private\n'
        self.assertTrue(robots_allowed(specific, 'https://example.org/jobs'))
        self.assertFalse(robots_allowed(specific, 'https://example.org/private'))
        self.assertTrue(robots_allowed('User-agent: *\nDisallow: /x\nAllow: /x\n', 'https://example.org/x'))

    def test_week_edges_rolling_windows_and_missingness(self):
        rows = [job(published_at=d, skills=['python']) for d in
                ('2026-03-07', '2026-03-08', '2026-03-09', '2026-09-07', '2026-09-08')]
        weeks, rolling = weekly_cohorts(rows, '2026-03-08', '2026-09-08')
        self.assertEqual(len(weeks), 28)
        self.assertEqual(sum(w['complete_calendar_week'] for w in weeks), 26)
        self.assertEqual(sum(w['observed_date_sample_count'] for w in weeks), 3)
        self.assertEqual(len(rolling), 14)
        self.assertEqual(rolling[0]['window_start'], '2026-03-09')
        self.assertEqual(rolling[-1]['window_end_exclusive'], '2026-09-07')
        self.assertEqual(rolling[0]['skill_mentions']['python'], 1)
        for row in weeks + rolling:
            self.assertIsNone(row['historical_new_jobs'])
            self.assertIsNone(row['historical_active_jobs'])
            self.assertIsNone(row['growth_rate'])
        empty, _ = weekly_cohorts([], '2026-03-08', '2026-09-08')
        self.assertEqual(empty[0]['observed_date_sample_count'], 0)
        self.assertIsNone(empty[0]['historical_new_jobs'])


class PipelineTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.body = b'<html>public recruitment evidence</html>'
        self.sha = hashlib.sha256(self.body).hexdigest()
        (self.root / 'raw').mkdir()
        (self.root / 'raw' / (self.sha + '.bin')).write_bytes(self.body)

    def capture(self, rows, run='one'):
        directory = self.root / 'runs' / run
        directory.mkdir(parents=True, exist_ok=True)
        observations = []
        for row in rows:
            observations.append({**row, 'run_id': run, 'evidence': {
                'url': row['source_url'], 'body_sha256': self.sha,
                'fetched_at': row.get('test_fetched_at', '2026-09-07T18:00:00+00:00')}})
        (directory / 'observations.jsonl').write_text(''.join(json.dumps(r) + '\n' for r in observations))
        write_json(directory / 'run.json', {'config': {'sources': [{'id': 'test-custom-config'}]}})

    def test_duplicate_observations_dates_and_first_seen(self):
        a = job(source_id='baidu', title='AI Agent 工程师 (J12345)')
        self.capture([a, a, {**a, 'source_job_id': '2', 'published_at': '2026-03-09'},
                      job(source_id='tencent', published_at=None, updated_at='2026年8月13日')])
        jobs, _, summary = normalize(self.root, TAXONOMY)
        self.assertEqual(summary['observations'], 3)
        self.assertEqual(len(jobs), 2)
        self.assertTrue(next(j for j in jobs if j['source_id'] == 'baidu')['publication_conflict'])
        self.assertTrue(all(j['published_at'] is None for j in jobs))
        self.assertEqual(next(j for j in jobs if j['source_id'] == 'tencent')['updated_at'], '2026-08-13')
        self.assertTrue(all(j['first_seen_at'].startswith('2026-09-07') for j in jobs))

    def test_china_calendar_future_date_boundary(self):
        self.capture([job(published_at='2026-09-08'), job(source_job_id='2', published_at='2026-09-09')])
        jobs, _, _ = normalize(self.root, TAXONOMY)
        by_id = {j['source_job_id']: j for j in jobs}
        self.assertEqual(by_id['1']['published_at'], '2026-09-08')
        self.assertIsNone(by_id['2']['published_at'])
        self.assertTrue(by_id['2']['future_publication_date'])

    def test_corrupt_raw_evidence_stops_normalization(self):
        self.capture([job()])
        (self.root / 'raw' / (self.sha + '.bin')).write_bytes(b'corrupted')
        with self.assertRaisesRegex(ValueError, 'corrupted evidence'):
            normalize(self.root, TAXONOMY)

    def test_related_vacancies_cannot_qualify_current_job(self):
        self.capture([job(source_id='nankai-test', title='财务经理',
                          description='处理财务报表\n招聘信息\nAI Agent 开发工程师 LangGraph')])
        jobs, _, _ = normalize(self.root, TAXONOMY)
        self.assertFalse(jobs[0]['agent_relevant'])
        self.assertNotIn('LangGraph', jobs[0]['description'])

    def test_export_is_offline_reproducible_and_omits_full_text(self):
        self.capture([job(description='构建大模型 Agent。PRIVATE_FULL_DESCRIPTION contact@example.org')])
        with patch('urllib.request.urlopen', side_effect=AssertionError('network called')):
            jobs, sources, summary = normalize(self.root, TAXONOMY)
            target, manifest = export(self.root, jobs, sources, summary, TAXONOMY, '2026-03-08', '2026-09-08')
            before = {p.name: p.read_bytes() for p in target.iterdir()}
            again, repeated = export(self.root, jobs, sources, summary, TAXONOMY, '2026-03-08', '2026-09-08')
        self.assertEqual(target, again)
        self.assertEqual(manifest, repeated)
        self.assertEqual(before, {p.name: p.read_bytes() for p in target.iterdir()})
        self.assertFalse(manifest['quality']['publishable'])
        self.assertIn('one', manifest['source_config_sha256_by_run'])
        for content in before.values():
            self.assertNotIn(b'PRIVATE_FULL_DESCRIPTION', content)
            self.assertNotIn(b'contact@example.org', content)
        self.assertNotIn('description', public_job(jobs[0]))
        for item in manifest['files']:
            self.assertEqual(hashlib.sha256((target / item['path']).read_bytes()).hexdigest(), item['sha256'])

    def test_campaigns_do_not_inflate_jobs(self):
        self.capture([job(), job(source_job_id='2', record_type='campaign')])
        jobs, sources, summary = normalize(self.root, TAXONOMY)
        _, manifest = export(self.root, jobs, sources, summary, TAXONOMY, '2026-03-08', '2026-09-08')
        self.assertEqual(manifest['counts']['mainland_agent_jobs'], 1)
        self.assertEqual(manifest['counts']['announcements_and_directions'], 1)

    def test_partial_capture_resume_does_not_duplicate_success(self):
        client = Client(self.root, 'resume')
        config = {'sources': [{'id': 'ok', 'label': 'ok', 'adapter': 'test'},
                              {'id': 'blocked', 'label': 'blocked', 'adapter': 'test'}]}
        def adapter(client, source, emit):
            if source['id'] == 'blocked':
                raise FetchError('http-403')
            emit(job())
            return {'status': 'ok', 'records': 1}
        with patch.dict('tools.job_market.sources.ADAPTERS', {'test': adapter}):
            results = collect(client, config)
            before = (client.run / 'observations.jsonl').read_bytes()
            self.assertEqual(collect(client, config), results)
            self.assertEqual((client.run / 'observations.jsonl').read_bytes(), before)
        self.assertEqual(results['blocked']['status'], 'blocked')
        self.assertEqual(results['blocked']['records'], 0)

    def test_tencent_pagination_repetition_is_incomplete(self):
        class RepeatedClient:
            def get(inner, url):
                return json.dumps({'Code': 200, 'Data': {'Count': 2, 'Posts': [{
                    'PostId': '1', 'RecruitPostName': 'AI Agent 工程师', 'LastUpdateTime': '2026年8月13日'}]}}), {
                    'url': url, 'fetched_at': '2026-09-08T01:00:00+00:00', 'body_sha256': self.sha}
        rows = []
        outcome = tencent(RepeatedClient(), {'id': 'tencent', 'keywords': ['Agent']}, rows.append)
        self.assertEqual(outcome['status'], 'partial')
        self.assertFalse(outcome['queries'][0]['complete'])
        self.assertIsNone(rows[0]['published_at'])
        self.assertIn('repeated', outcome['errors'][0]['error'])


if __name__ == '__main__':
    unittest.main()
