"""Package normalized baseline files without raw source snapshots or private notes."""
import argparse
import hashlib
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

p = argparse.ArgumentParser()
p.add_argument('--baseline', required=True)
p.add_argument('--out', required=True)
a = p.parse_args()
base = Path(a.baseline)
out = Path(a.out)
summary = json.loads((base / 'summary.json').read_text())
files = sorted(f for f in base.iterdir() if f.suffix in ('.json', '.csv', '.duckdb'))
manifest = {
    'as_of': summary['as_of'],
    'scope': 'Normalized local public-evidence research baseline; not a national admissions or attainment estimate.',
    'files': [dict(path=f.name, bytes=f.stat().st_size,
                   sha256=hashlib.sha256(f.read_bytes()).hexdigest()) for f in files],
}
readme = '''---
status: draft
period: '2024-2026'
theme: agent-education-baseline
doc_type: dataset-guide
source_level: public-primary-sources
confidence: medium
sensitivity: internal
evidence_grade: B
review_state: unreviewed
last_reviewed: '2026-09-08'
---

# 功夫酒馆：高校教育与招聘公开证据基线

截至 2026-09-08，覆盖 2024—2026 年底表。此包用于本地查询与后续复核。

## 文件与统计单位

- school_registry：学校×年度，普通高校；school_id 是字符串。
- major_catalog：国家本科专业代码×年度；agent_relation 是研究标签。
- program_change_rows：备案审批结果条目，包含调整等情形，不是招生人数。
- school_profiles：32 所高校的发现档案，层次与资料深度不同。
- courses：110 条人工选取的课程／章节／实践证据，不是全部课程。
- admissions_reviewed：9 条已核对在京计划，单位人；不是实际录取。
- admissions_candidates：1,949 条自动候选，存在 OCR 和串校错误，禁止统计汇总。
- job_sample：286 条职位候选，招聘描述样本，不是全国市场总体。
- skill_demand：技能提及次数及样本内比例；实习／校招分母 65，含百度 64 条。
- sources：63 项来源登记，含 62 项已保存快照及 1 项失败；保留 URL、时间、哈希。
- summary：范围、记录数量、招聘输入哈希及明确空缺。

JSON 与 CSV 为同一批规范化表；baseline.duckdb 提供相应可查询表。
CSV 是 UTF-8 BOM，空格留空不代表零；嵌套数组在 CSV 中使用 JSON 编码。
导入 CSV 时应将学校与专业代码列设为文本，避免前导零丢失；优先使用 JSON 或 DuckDB。
JSON 的 null 表示未取得或不适用。布尔字段 aggregation_eligible=false 禁止自动汇总。
课程表 exact_title_pages 是标题在 PDF 文本中出现的页序，可能多页或为空，不能替代人工语义核验。
培养方案版本、入学年级、发布日期和采集日期分别解释；课程安排不证明技能达成。

本轮未估算全国实际招生人数、全国学生技能达成率或历史招聘增长率。
工作簿与研究报告另行交付。完整原文件与 OCR 留在本地 .private/education-baseline/2026-09-08，
此包不重复包含原文件。sources 的 raw_path/text_path 按对应 capture 子目录解析。
可用本仓 tools/education_baseline 的采集、规范化、校验脚本复现；人工核对表是独立输入。
MANIFEST.json 列出包内数据文件哈希，可用于传递后的完整性核验。
'''
out.parent.mkdir(parents=True, exist_ok=True)
with ZipFile(out, 'w', ZIP_DEFLATED) as z:
    for f in files:
        z.write(f, f.name)
    z.writestr('MANIFEST.json', json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    z.writestr('README.md', readme)
with ZipFile(out) as z:
    assert z.testzip() is None
    for f in manifest['files']:
        assert hashlib.sha256(z.read(f['path'])).hexdigest() == f['sha256']
print(json.dumps(dict(path=str(out.resolve()), files=len(files), bytes=out.stat().st_size)))
