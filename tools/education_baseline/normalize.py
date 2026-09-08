"""Build a reproducible baseline without equating plans, admission or attainment."""
import argparse, csv, hashlib, json, re
from collections import Counter
from pathlib import Path
import xlrd
import duckdb

RELATED={
 '080717T':'AI直接相关','080907T':'AI直接相关','140012TK':'具身与控制','040117TK':'AI教育','120219TK':'业务应用',
 '080901':'软件与数据基础','080902':'软件与数据基础','080903':'软件与数据基础','080904K':'软件与数据基础','080905':'软件与数据基础','080910T':'软件与数据基础','080911TK':'软件与数据基础',
 '080801':'具身与控制','080803T':'具身与控制','080303T':'具身与控制','080213T':'具身与控制',
 '070101':'数学与统计基础','070102':'数学与统计基础','071201':'数学与统计基础','071202':'数学与统计基础','071203T':'数学与统计基础','040112T':'认知基础',
 '120102':'业务应用','120108T':'业务应用','020109T':'业务应用',
}
def dump(path,data):path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def write_table(out,name,rows):
    dump(out/f'{name}.json',rows)
    if not rows:return
    keys=list(dict.fromkeys(k for r in rows for k in r))
    with (out/f'{name}.csv').open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.DictWriter(f,fieldnames=keys); w.writeheader()
        for r in rows:w.writerow({k:json.dumps(v,ensure_ascii=False) if isinstance(v,(dict,list)) else v for k,v in r.items()})

def main():
    p=argparse.ArgumentParser();p.add_argument('--capture',required=True);p.add_argument('--jobs',required=True);p.add_argument('--out',required=True);a=p.parse_args()
    cap=Path(a.capture);out=Path(a.out);out.mkdir(parents=True,exist_ok=True);here=Path(__file__).parent
    sources=[]
    for folder in [cap,cap/'curricula',cap/'additional']:
        for s in json.loads((folder/'sources.json').read_text()):
            s['capture_folder']=str(folder.resolve()); sources.append(s)
    byid={s['id']:s for s in sources}
    dates=json.loads((here/'publication_dates.json').read_text())
    for s in sources:s['publication_date']=dates.get(s['id'])
    # Research corrections preserve the original source bytes and avoid false identities.
    byid['W02']['program']='计算机科学与技术';byid['W02']['level']='学术硕士'
    byid['W02']['limitations']='2024研究生全册中计算机科学与技术章节；原搜索摘要不能决定专业归属'
    byid['OUTCOME2024']['publisher']='苏州工业职业技术学院'
    byid['N01']['cohort']=None;byid['N01']['version_note']='PDF元信息2020，正文未明确适用年级'
    def text(s):
        return (Path(s['capture_folder'])/s['text_path']).read_text() if s.get('text_path') else ''
    schools=[]
    for y in [2024,2025,2026]:
        s=byid[f'MOE_S{y}'];sh=xlrd.open_workbook(Path(s['capture_folder'])/s['raw_path']).sheet_by_index(0);province=None
        for vals in [sh.row_values(i) for i in range(3,sh.nrows)]:
            if not vals[1]:
                if re.search(r'[（(]\d+所',str(vals[0])):province=re.split('[（(]',str(vals[0]))[0]
                continue
            code=str(int(vals[2])) if isinstance(vals[2],float) else str(vals[2]).strip()
            if not re.fullmatch(r'\d{10}',code):raise ValueError(f'invalid school code {vals}')
            schools.append(dict(year=y,school_id=code,school=vals[1],province=province,authority=vals[3],city=vals[4],level=vals[5],remarks=vals[6] or None,source_id=s['id'],source_url=s['url']))
    assert Counter(r['year'] for r in schools)=={2024:2868,2025:2919,2026:2952}
    assert len({(r['year'],r['school_id']) for r in schools})==len(schools)
    majors=[]
    for y in [2024,2025,2026]:
        s=byid[f'MOE_P{y}']
        for pg,page in enumerate(text(s).split('\f'),1):
            for line in page.splitlines():
                m=re.search(r'\b(\d{6,7}[TK]{0,2})\s+(\S+)',line)
                if m:
                    code,name=m.groups();name=re.split('[（(]',name)[0]
                    majors.append(dict(year=y,major_code=code,major=name,agent_relation=RELATED.get(code),relation_basis='研究者预先声明的关联专业清单；非Agent人才人数口径',source_id=s['id'],page=pg,source_url=s['url']))
    assert len({(r['year'],r['major_code']) for r in majors})==len(majors)
    changes=[]
    for y in [2024,2025]:
        s=byid[f'MOE_A{y}']
        for pg,page in enumerate(text(s).split('\f'),1):
            lines=page.splitlines()
            for index,line in enumerate(lines):
                m=re.match(r'^\s*(\d+)\s+(\S+)\s+(\S+)\s+(\d{6,7}[TKH]{0,3})\s+(.*)$',line)
                if not m:
                    short=re.match(r'^\s*(\d+)\s+(\S+)\s+(\d{6,7}[TKH]{0,3})\s+(.*)$',line)
                    if short and index>0 and index+1<len(lines):
                        previous=lines[index-1].strip().split()[0];following=lines[index+1].strip().split()[0]
                        if '大学' in previous and following in ('学院','院'):
                            serial,major,code,rest=short.groups();school=previous+following
                            m=re.match(r'^(\d+) (\S+) (\S+) (\S+) (.*)$',f'{serial} {school} {major} {code} {rest}')
                if m:
                    serial,school,major,code,rest=m.groups()
                    changes.append(dict(publication_year=y,approval_year=y-1,serial=int(serial),school=school,major=major,major_code=code,agent_relation=RELATED.get(code.rstrip('H')),row_remainder=rest.strip(),event_type='备案审批结果条目_需结合备注',admission_count=None,source_id=s['id'],page=pg,source_url=s['url']))
    assert Counter(r['publication_year'] for r in changes)=={2024:1719,2025:1996}
    assert len({(r['publication_year'],r['serial']) for r in changes})==len(changes)
    courses=json.loads((here/'reviewed_courses.json').read_text())
    for c in courses:
        s=byid[c['source_id']];c.update(school=s.get('school'),region=s.get('region'),level=s.get('level'),program=s.get('program'),cohort=s.get('cohort'),source_type=s['type'],source_url=s['url'],sha256=s.get('sha256'),limitation=s.get('limitations'))
        needle=re.sub(r'\s','',c['course']).lower(); pages=text(s).split('\f');hits=[i for i,t in enumerate(pages,1) if needle in re.sub(r'\s','',t).lower()]
        c['exact_title_pages']=hits;c['locator_status']='exact_title_in_snapshot' if hits else 'semantic_label_check_source'
        assert c['actual_attainment'] is None
    profiles=[]
    for school in sorted({s['school'] for s in sources if s.get('school')}):
        ss=[s for s in sources if s.get('school')==school];cc=[c for c in courses if c['school']==school]
        profiles.append(dict(school=school,province=ss[0]['region'],levels=sorted({s['level'] for s in ss}),programs=sorted({s['program'] for s in ss}),cohorts=sorted({s['cohort'] for s in ss if s.get('cohort')}),source_count=len(ss),captured_count=sum(s['status']=='captured' for s in ss),course_records=len(cc),source_ids=[s['id'] for s in ss],skill_families=sorted({c['skill_family'] for c in cc}),evidence_types=sorted({s['type'] for s in ss}),actual_attainment=None,limitations='；'.join(dict.fromkeys(s.get('limitations','') for s in ss)),source_url=ss[0]['url']))
    jobsfile=Path(a.jobs);jobs=[json.loads(l) for l in jobsfile.read_text().splitlines()]
    eligible=[j for j in jobs if j['mainland'] and j['agent_relevant'] and j['record_type']=='job']
    entry=[j for j in eligible if j['hiring_type'] in ('INTERN','GRADUATE')]
    fields=['job_id','company','title','locations','hiring_type','published_at','source_url','skills','role','review_status']
    jobrows=[{k:j.get(k) for k in fields} for j in eligible]
    taxonomy=json.loads((here.parent/'job_market'/'taxonomy.json').read_text())
    skills=[]
    for t in taxonomy['skills']:
        alln=sum(t['id'] in j['skills'] for j in eligible);n=sum(t['id'] in j['skills'] for j in entry)
        skills.append(dict(skill_id=t['id'],skill=t['label'],entry_mentions=n,entry_denominator=len(entry),entry_sample_share=n/len(entry),all_mentions=alln,all_denominator=len(eligible),basis='采集存续候选中的岗位描述/要求提及；包含未注明发布日期和较旧记录；非全国市场占比'))
    skills.sort(key=lambda x:-x['entry_mentions'])
    summary=dict(as_of='2026-09-08',admissions_years=[2024,2025,2026],school_registry_counts=dict(Counter(r['year'] for r in schools)),catalog_counts=dict(Counter(r['year'] for r in majors)),sources=len(sources),captured=sum(s['status']=='captured' for s in sources),profile_schools=len(profiles),profile_provinces=len({p['province'] for p in profiles}),course_records=len(courses),captured_curriculum_documents=sum(s['type']=='curriculum_plan' and s['status']=='captured' for s in sources),jobs=len(eligible),entry_jobs=len(entry),entry_employers=dict(Counter(j['company'] for j in entry)),entry_hiring_types=dict(Counter(j['hiring_type'] for j in entry)),entry_dated_six_months=sum(bool(j['published_at']) and '2026-03-08'<=j['published_at']<'2026-09-08' for j in entry),job_input_sha256=hashlib.sha256(jobsfile.read_bytes()).hexdigest(),national_major_admissions=None,national_student_attainment=None,historical_job_market_growth=None)
    public_sources=[{k:v for k,v in s.items() if k not in ('capture_folder',)} for s in sources]
    admissions=json.loads((here/'reviewed_admissions.json').read_text())
    for row in admissions:
        source=byid[row['source_id']];row['source_url']=source['url'];row['source_sha256']=source['sha256']
    tables={'school_registry':schools,'major_catalog':majors,'program_change_rows':changes,'school_profiles':profiles,'courses':courses,'admissions_reviewed':admissions,'job_sample':jobrows,'skill_demand':skills,'sources':public_sources}
    candidates_path=out/'admissions_candidates.json'
    if candidates_path.exists():
        candidates=json.loads(candidates_path.read_text())
        assert all(row['aggregation_eligible'] is False for row in candidates)
        tables['admissions_candidates']=candidates
    for name,rows in tables.items():write_table(out,name,rows)
    dump(out/'summary.json',summary)
    con=duckdb.connect(str(out/'baseline.duckdb'))
    for name in tables:con.execute(f'CREATE OR REPLACE TABLE {name} AS SELECT * FROM read_json_auto(?)',[str(out/f'{name}.json')])
    con.close()
    print(json.dumps(summary,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
