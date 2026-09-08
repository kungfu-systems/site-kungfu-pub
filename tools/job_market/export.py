"""Versioned static candidates: cohort observations are never market inflow."""
import csv
import hashlib
import html
import json
from collections import Counter
from datetime import date, timedelta
from pathlib import Path

from .http import write_json
from .transform import digest

LIMITATIONS = [
    '这是目的抽样的招聘信息观察，不是中国就业市场全量统计，也不等同实际录用人数。',
    '尚无过去六个月逐周保存的在招快照；当前仍可读取的旧日期页面存在存活偏差，不能还原历史新增或在招岗位量。',
    '腾讯只有最后更新时间，不能进入发布日期样本；百度仅公开搜索首屏，关键词命中不完整且相互重叠。',
    '高校与研究机构公告是定向补充样本；公告页面日期不证明今天读取的正文在当时完全相同。招聘简章和研究方向不按单个岗位计数。',
    '技能标签由规则识别，尚未经逐条人工复核；标签占比表示描述中的提及比例，不等于必备技能要求。',
    '平台访问失败、未实现适配器、没有日期和缺测都保留为缺口；没有样本不表示没有市场需求。',
]


def weekly_cohorts(jobs, start, end):
    """Half-open [start,end), Monday local calendar weeks, 13 completed weeks."""
    start, end = date.fromisoformat(start), date.fromisoformat(end)
    first = start - timedelta(days=start.weekday())
    rows = []
    cursor = first
    while cursor < end:
        next_week = cursor + timedelta(days=7)
        selected = [j for j in jobs if j.get('published_at') and
                    max(start, cursor).isoformat() <= j['published_at'] < min(end, next_week).isoformat()]
        rows.append({'week_start': cursor.isoformat(), 'week_end_exclusive': next_week.isoformat(),
                     'complete_calendar_week': cursor >= start and next_week <= end,
                     'observed_date_sample_count': len(selected),
                     'company_careers_sample_count': sum(j['source_type'] == 'company-careers' for j in selected),
                     'announcement_sample_count': sum(j['source_type'] != 'company-careers' for j in selected),
                     'observed_sample_companies': len({j['company'] for j in selected}),
                     'skill_mentions': dict(Counter(s for j in selected for s in j.get('skills', []))),
                     'skill_share_denominator': len(selected),
                     'source_breakdown': dict(Counter(j['source_id'] for j in selected)),
                     'historical_new_jobs': None, 'historical_active_jobs': None,
                     'historical_coverage': 'unobserved', 'growth_rate': None})
        cursor = next_week
    rolling = []
    for row in rows:
        end_date = date.fromisoformat(row['week_end_exclusive'])
        window_start = end_date - timedelta(weeks=13)
        if window_start < start or end_date > end:
            continue
        selected = [j for j in jobs if j.get('published_at') and
                    window_start.isoformat() <= j['published_at'] < end_date.isoformat()]
        rolling.append({'window_start': window_start.isoformat(), 'window_end_exclusive': end_date.isoformat(),
                        'window_weeks': 13, 'observed_date_sample_count': len(selected),
                        'observed_sample_companies': len({j['company'] for j in selected}),
                        'skill_mentions': dict(Counter(s for j in selected for s in j.get('skills', []))),
                        'skill_share_denominator': len(selected),
                        'source_breakdown': dict(Counter(j['source_id'] for j in selected)),
                        'historical_new_jobs': None, 'historical_active_jobs': None,
                        'historical_coverage': 'unobserved', 'growth_rate': None})
    return rows, rolling


def public_job(row):
    fields = ('job_id', 'source_id', 'source_job_id', 'company', 'title', 'locations', 'hiring_type',
              'source_url', 'published_at', 'updated_at', 'date_basis', 'source_type', 'coverage_kind',
              'first_seen_at', 'last_seen_at', 'skills', 'role', 'agent_relationship', 'record_type', 'review_status',
              'publication_conflict', 'taxonomy_version')
    return {key: row.get(key) for key in fields}


def build_report(manifest, jobs, sources, skills, weeks):
    stats = manifest['counts']
    month_counts = Counter(j['published_at'][:7] for j in jobs if j.get('published_at') and
                           manifest['period']['start'] <= j['published_at'] < manifest['period']['end_exclusive'])
    lines = ['---', 'status: draft', f"period: '{manifest['period']['start']}/{manifest['period']['end_exclusive']}'", 'theme: agent-employment-observation',
             'doc_type: analysis', 'source_level: public-recruitment-pages', 'confidence: medium',
             'sensitivity: internal', 'evidence_grade: B', 'review_state: unreviewed',
             'last_reviewed: ' + manifest['generated_at'][:10],
             'ai_provenance:', '  model_family: GPT-6', '  product: Codex', '  generated_at: ' + manifest['generated_at'],
             '  visible_context: Public recruitment pages and locally captured HTTP evidence.',
             '  invisible_information_boundary: No employer internal hiring records or historical full-market snapshots.',
             '---', '', '# Agent 招聘样本：本地六个月数据准备', '',
             f"观察区间：{manifest['period']['start']} 至 {manifest['period']['end_exclusive']}（右端不含，北京时间）；采集时间：{manifest['generated_at']}。", '',
             '**已完成可追溯样本采集和本地管线；尚未取得完整六个月历史就业需求序列。**', '',
             f"原始去重观察 {stats['observations']} 条；规范化记录 {stats['unique_records']} 条；中国大陆 Agent 单职位候选 {stats['mainland_agent_jobs']} 条。", '',
             f"其中 {stats['dated_in_period']} 条有区间内唯一发布日期依据；{stats['undated_jobs']} 条缺少可用发布日期。", '',
             '## 月份覆盖', '', '| 月份 | 已观察到的发布日期样本数 | 历史市场覆盖 |', '|---|---:|---|']
    for month in manifest['period']['months']:
        lines.append(f'| {month} | {month_counts[month]} | 未观测完整历史 |')
    lines += ['', '月份数字是当前选中样本按页面日期的分布，不能解释为当月市场新增量。', '', '## 来源检查', '',
              '| 来源 | 采集状态 | 原始命中记录 |', '|---|---|---:|']
    for source in sources:
        lines.append(f"| {source['label'].replace('|', '/')} | {source['status']} | {source['records']} |")
    lines += ['', '## 口径与局限', ''] + ['- ' + s for s in LIMITATIONS]
    lines += ['', '## 数据结构', '', '- `market.duckdb`：observations、jobs、source_checks。',
              '- `runs/*/requests.jsonl`：HTTP 状态、URL、采集时间、正文 SHA-256；`raw/` 保存本地原始证据。',
              '- `normalized/jobs.jsonl`：本地职位、分类依据与日期冲突；原始描述不进入站点候选。',
              '- 当前目录的 JSON/CSV 是本地发布候选；`publishable=false`，没有上传网站。',
              '- `trends.json` 中历史新增、历史在招和增速保持 null；单独提供明确标记的样本日期分布及 13 周滚动样本数。', '',
              '## 后续数据工作', '',
              '- 继续保存每日观察，形成前瞻性基线。第一次抓到的存量不能全算当天新增。',
              '- 对接可合法获得的招聘平台历史导出或授权数据，扩展固定企业样本，补齐缺失历史。',
              '- 复核技能规则、重复候选及发布时间变更；新增历史来源应保持独立口径和来源覆盖信息。', '',
              '## 岗位样本链接', '']
    dated = sorted((j for j in jobs if j.get('published_at') and manifest['period']['start'] <= j['published_at'] < manifest['period']['end_exclusive']), key=lambda j: j['published_at'])
    for j in dated[:20]:
        lines.append(f"- {j['published_at']} · {j['company']} · [{j['title']}]({j['source_url']})")
    return '\n'.join(lines) + '\n'


def render_html(manifest, jobs, sources, skill_counts, weeks, rolling):
    # Self-contained: works via file:// and does not use a CDN or fetch().
    data = json.dumps({'jobs': jobs, 'skills': skill_counts, 'weekly': weeks, 'rolling': rolling}, ensure_ascii=False).replace('<', '\\u003c')
    stats = manifest['counts']
    bars = ''.join(f'<div class="bar-row"><span>{html.escape(w["week_start"])}</span><div class="bar" style="width:{max(1, w["observed_date_sample_count"])*100/max(1,max(x["observed_date_sample_count"] for x in weeks)):.1f}%"></div><b>{w["observed_date_sample_count"]}</b></div>' for w in weeks)
    source_rows = ''.join('<tr>' + ''.join(f'<td>{html.escape(str(s[k]))}</td>' for k in ('label','status','records')) + '</tr>' for s in sources)
    warnings = ''.join('<li>' + html.escape(s) + '</li>' for s in LIMITATIONS)
    return '''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>功夫酒馆 · Agent 招聘样本观察</title><style>
:root{color-scheme:light;font-family:system-ui,-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;color:#172c2b;background:#f5f5ef}*{box-sizing:border-box}body{margin:0}main{max-width:1200px;margin:auto;padding:36px 24px}h1{font-size:32px;margin:12px 0}h2{font-size:21px;margin-top:34px}.eyebrow{color:#527269;font-size:14px;letter-spacing:2px}.muted{color:#59706c}.notice{background:#fff1d9;border:1px solid #dbc28c;border-radius:12px;padding:18px;line-height:1.8}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:24px 0}.card{background:#fff;border:1px solid #dfe6df;border-radius:12px;padding:20px}.card strong{display:block;font-size:32px;color:#236553}.card span{font-size:13px;color:#59706c}.panel{background:#fff;border-radius:12px;border:1px solid #dfe6df;padding:20px;margin:18px 0;overflow:auto}.bar-row{display:grid;grid-template-columns:96px 1fr 32px;align-items:center;gap:12px;font-size:12px;height:24px}.bar{height:12px;background:#49856c;border-radius:3px}.filters{display:flex;gap:12px;flex-wrap:wrap}input,select{border:1px solid #bbcfc6;border-radius:8px;padding:10px;background:white;font:inherit}input{flex:1;min-width:220px}table{width:100%;border-collapse:collapse;font-size:13px}th,td{text-align:left;border-bottom:1px solid #e7ebe7;padding:11px;vertical-align:top}a{color:#216c58;text-decoration:none}a:hover{text-decoration:underline}.tag{background:#e8f1ea;border-radius:5px;padding:3px 5px;margin:2px;display:inline-block;font-size:11px}button{background:#236553;color:white;border:0;border-radius:7px;padding:9px 16px;margin:12px 5px 0 0;cursor:pointer}li{margin:8px 0;line-height:1.7}footer{margin-top:32px;color:#59706c;font-size:12px}@media(max-width:700px){main{padding:22px 12px}.cards{grid-template-columns:repeat(2,1fr)}h1{font-size:26px}}
</style><main><div class="eyebrow">功夫酒馆 / 本地研究预览</div><h1>Agent 招聘样本观察</h1>
<p class="muted">观察区间：START 至 END（右端不含） · 北京时间 · 六个月窗口</p>
<div class="notice"><strong>已取得真实岗位样本，历史需求趋势仍缺数据。</strong><br>下面的时间分布仅表示本次抓到的岗位页面日期。它不是过去每周新增或在招岗位量；腾讯更新时间不计入发布日期分布。</div>
<div class="cards"><div class="card"><strong>JOBS</strong><span>大陆 Agent 单职位候选</span></div><div class="card"><strong>DATED</strong><span>区间内有发布日期依据</span></div><div class="card"><strong>COMPANIES</strong><span>单职位样本雇主</span></div><div class="card"><strong>0 / COMPLETE_WEEKS</strong><span>具有完整历史观测的周</span></div></div>
<h2>按页面发布日期分组的样本</h2><p class="muted">包含边缘不完整周；零表示没有选中样本，不表示市场需求为零。可切换 13 周滚动窗口或选择技能；滚动窗口每周推进一次，相邻窗口有重叠。</p><div class="filters"><select id="window" aria-label="统计窗口"><option value="weekly">每周样本分布</option><option value="rolling">13 周滚动窗口（约三个月）</option></select><select id="chart-skill" aria-label="趋势技能"><option value="">全部 Agent 岗位</option></select></div><p id="chart-caption" class="muted"></p><div class="panel" id="chart">BARS</div>
<h2>岗位查询</h2><p class="muted">岗位描述由规则识别，未逐条人工复核；职位仍在招与否请以来源页面为准。</p><div class="filters"><input id="q" aria-label="搜索岗位" placeholder="搜索岗位、公司、城市或技能"><select id="skill" aria-label="岗位技能"><option value="">全部技能</option></select><select id="dated" aria-label="发布日期范围"><option value="">全部候选（含日期未知）</option><option value="period">仅六个月内有发布日期的岗位</option></select></div><p id="count" class="muted"></p><div class="panel"><table><thead><tr><th>岗位 / 企业</th><th>地区</th><th>发布日期</th><th>技能提及</th></tr></thead><tbody id="jobs"></tbody></table><button id="prev">上一页</button><button id="next">下一页</button></div>
<h2>来源覆盖</h2><div class="panel"><table><thead><tr><th>来源</th><th>状态</th><th>原始命中数（含重复）</th></tr></thead><tbody>SOURCES</tbody></table></div><h2>数据口径</h2><ul>WARNINGS</ul><footer>本地候选 · 未上线 · 没有模拟数据 · 发布状态：publishable=false</footer>
<script id="dataset" type="application/json">DATA</script><script>
const data=JSON.parse(document.querySelector('#dataset').textContent), labels=Object.fromEntries(data.skills.map(s=>[s.id,s.label])); let page=0;const size=25;
for(const id of ['skill','chart-skill'])for(const s of data.skills){const o=document.createElement('option');o.value=s.id;o.textContent=s.label;document.getElementById(id).append(o)}
function renderChart(){const mode=document.getElementById('window').value,skill=document.getElementById('chart-skill').value,rows=data[mode],counts=rows.map(r=>skill?(r.skill_mentions[skill]||0):r.observed_date_sample_count),max=Math.max(1,...counts),chart=document.getElementById('chart');chart.replaceChildren();document.getElementById('chart-caption').textContent=`${mode==='rolling'?'13 周滚动':'每周'} · ${skill?labels[skill]:'全部 Agent 岗位'} · ${rows.length} 个窗口 · 仅页面日期样本`;rows.forEach((r,i)=>{const line=document.createElement('div');line.className='bar-row';const label=document.createElement('span');label.textContent=r.week_start||r.window_start;line.title=`${r.week_start||r.window_start} 至 ${r.week_end_exclusive||r.window_end_exclusive}（右端不含）`;const bar=document.createElement('div');bar.className='bar';bar.style.width=`${counts[i]*100/max}%`;const count=document.createElement('b');count.textContent=counts[i];line.append(label,bar,count);chart.append(line)})}
for(const id of ['window','chart-skill'])document.getElementById(id).addEventListener('input',renderChart);renderChart();
function render(){const q=document.querySelector('#q').value.toLowerCase(),skill=document.querySelector('#skill').value,dated=document.querySelector('#dated').value;const rows=data.jobs.filter(j=>(!q||[j.title,j.company,j.locations,...j.skills.map(s=>labels[s]||s)].join(' ').toLowerCase().includes(q))&&(!skill||j.skills.includes(skill))&&(!dated||(j.published_at&&j.published_at>='START'&&j.published_at<'END')));page=Math.min(page,Math.max(0,Math.ceil(rows.length/size)-1));document.querySelector('#count').textContent=`${rows.length} 个候选 · 第 ${page+1} / ${Math.max(1,Math.ceil(rows.length/size))} 页`;const body=document.querySelector('#jobs');body.replaceChildren();for(const j of rows.slice(page*size,(page+1)*size)){const tr=document.createElement('tr');const a=document.createElement('a');a.href=j.source_url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=j.title;const td=document.createElement('td');td.append(a,document.createElement('br'),document.createTextNode(j.company));tr.append(td);for(const text of [j.locations,j.published_at||'未知（不以更新时间代替）']){const c=document.createElement('td');c.textContent=text;tr.append(c)}const tags=document.createElement('td');for(const s of j.skills){const tag=document.createElement('span');tag.className='tag';tag.textContent=labels[s]||s;tags.append(tag)}tr.append(tags);body.append(tr)}document.querySelector('#prev').disabled=page===0;document.querySelector('#next').disabled=(page+1)*size>=rows.length}
for(const id of ['q','skill','dated'])document.getElementById(id).addEventListener('input',()=>{page=0;render()});document.querySelector('#prev').onclick=()=>{page--;render()};document.querySelector('#next').onclick=()=>{page++;render()};render();
</script></main></html>'''.replace('START', manifest['period']['start']).replace('END', manifest['period']['end_exclusive']).replace('JOBS', str(stats['mainland_agent_jobs'])).replace('DATED', str(stats['dated_in_period'])).replace('COMPANIES', str(stats['companies'])).replace('COMPLETE_WEEKS', str(sum(w['complete_calendar_week'] for w in weeks))).replace('BARS', bars).replace('SOURCES', source_rows).replace('WARNINGS', warnings).replace('DATA', data)


def export(root, jobs, sources, summary, taxonomy, start, end):
    if date.fromisoformat(end) <= date.fromisoformat(start):
        raise ValueError('end must be after start')
    eligible = [j for j in jobs if j['mainland'] and j['agent_relevant'] and j['record_type'] == 'job']
    public = [public_job(j) for j in eligible]
    dated = [j for j in eligible if j['published_at'] and start <= j['published_at'] < end]
    warnings = [j for j in jobs if j['publication_conflict']]
    weekly, rolling = weekly_cohorts(dated, start, end)
    counters = Counter(s for j in eligible for s in j['skills'])
    skill_counts = [{'id': s['id'], 'label': s['label'], 'jobs_mentioning': counters[s['id']],
                     'denominator_jobs': len(eligible), 'share': round(counters[s['id']] / len(eligible), 4) if eligible else None}
                    for s in taxonomy['skills']]
    months = []
    cursor = date.fromisoformat(start).replace(day=1)
    while cursor < date.fromisoformat(end):
        months.append(cursor.strftime('%Y-%m'))
        cursor = date(cursor.year + (cursor.month == 12), cursor.month % 12 + 1, 1)
    latest_sources = {}
    for source in sources:
        if source['id'] not in latest_sources or source['finished_at'] > latest_sources[source['id']]['finished_at']:
            latest_sources[source['id']] = source
    sources = sorted(latest_sources.values(), key=lambda s: s['id'])
    generated = max((j['last_seen_at'] for j in jobs), default=end + 'T00:00:00+00:00')
    captured_configs = {p.parent.name: digest(json.loads(p.read_text())['config'])
                        for p in sorted((Path(root) / 'runs').glob('*/run.json'))}
    producer = {p.name: hashlib.sha256(p.read_bytes()).hexdigest()
                for p in sorted(Path(__file__).parent.glob('*.py'))}
    input_records = {str(p.relative_to(root)): hashlib.sha256(p.read_bytes()).hexdigest()
                     for p in sorted((Path(root) / 'runs').glob('*/observations.jsonl'))}
    manifest = {'schema_version': 1, 'dataset': 'cn-agent-employment-pilot', 'generated_at': generated,
                'timezone': 'Asia/Shanghai', 'period': {'start': start, 'end_exclusive': end, 'months': months},
                'taxonomy_version': taxonomy['version'], 'source_config_sha256_by_run': captured_configs,
                'producer_sha256': digest(producer), 'input_records_sha256': digest(input_records),
                'unit': 'unique-advertised-position-not-headcount',
                'counts': {**summary, 'dated_in_period': len(dated), 'companies': len({j['company'] for j in eligible}),
                           'undated_jobs': sum(j['published_at'] is None for j in eligible),
                           'dated_outside_period': sum(bool(j['published_at']) and not start <= j['published_at'] < end for j in eligible),
                           'announcements_and_directions': sum(j['mainland'] and j['agent_relevant'] and j['record_type'] != 'job' for j in jobs)},
                'quality': {'publishable': False, 'historical_coverage_complete': False,
                            'historical_complete_weeks': 0, 'publication_conflicts': len(warnings),
                            'human_review_complete': False, 'reasons': LIMITATIONS}, 'files': []}
    revision = digest({'jobs': public, 'sources': sources, 'manifest': manifest, 'taxonomy': taxonomy})[:16]
    target = Path(root) / 'candidates' / revision
    target.mkdir(parents=True, exist_ok=True)
    manifest['dataset_version'] = revision
    by_month = {}
    for j in public:
        key = j['published_at'][:7] if j['published_at'] else 'undated'
        by_month.setdefault(key, []).append(j)
    for month, rows in sorted(by_month.items()):
        write_json(target / f'jobs-{month}.json', {'schema_version': 1, 'jobs': rows})
    write_json(target / 'trends.json', {'schema_version': 1, 'basis': 'observed-publication-date-cohorts-not-market-demand',
                                      'period': manifest['period'], 'weekly': weekly, 'rolling_13_weeks': rolling,
                                      'limitations': LIMITATIONS})
    write_json(target / 'skills.json', {'schema_version': 1, 'version': taxonomy['version'],
                                      'basis': 'mentions-in-all-collected-mainland-agent-single-jobs-including-undated-and-older',
                                      'skills': skill_counts})
    write_json(target / 'sources.json', sources)
    write_json(target / 'announcements.json', {'records': [public_job(j) for j in jobs if j['mainland'] and j['agent_relevant'] and j['record_type'] != 'job']})
    with (target / 'jobs.csv').open('w', newline='') as output:
        columns = ['job_id', 'company', 'title', 'locations', 'published_at', 'updated_at', 'date_basis', 'source_url', 'skills']
        writer = csv.DictWriter(output, fieldnames=columns)
        writer.writeheader()
        for job in public:
            row = {k: '|'.join(job[k]) if isinstance(job[k], list) else job[k] for k in columns}
            # Prevent formula evaluation in spreadsheet viewers.
            writer.writerow({k: "'" + v if isinstance(v, str) and v.startswith(('=', '+', '-', '@')) else v for k, v in row.items()})
    (target / 'report.md').write_text(build_report(manifest, public, sources, skill_counts, weekly))
    (target / 'index.html').write_text(render_html(manifest, public, sources, skill_counts, weekly, rolling))
    for path in sorted(target.iterdir()):
        if path.name == 'manifest.json':
            continue
        manifest['files'].append({'path': path.name, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'bytes': path.stat().st_size})
    write_json(target / 'manifest.json', manifest)
    # Local candidate pointer only; never writes into Astro public/ or any remote storage.
    write_json(Path(root) / 'candidate-manifest.json', {'dataset_version': revision, 'manifest': f'candidates/{revision}/manifest.json', 'publishable': False})
    return target, manifest
