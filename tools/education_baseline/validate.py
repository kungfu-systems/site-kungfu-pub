import argparse,hashlib,json
from collections import Counter
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--capture',required=True);a=p.parse_args();cap=Path(a.capture);base=cap/'baseline'
read=lambda n:json.loads((base/f'{n}.json').read_text())
sources=read('sources');byid={s['id']:s for s in sources};assert len(byid)==len(sources)
hashes=0
for folder in [cap,cap/'curricula',cap/'additional']:
 for s in json.loads((folder/'sources.json').read_text()):
  if s.get('raw_path'):
   assert hashlib.sha256((folder/s['raw_path']).read_bytes()).hexdigest()==s['sha256'],s['id'];hashes+=1
schools=read('school_registry');assert Counter(x['year'] for x in schools)=={2024:2868,2025:2919,2026:2952}
assert len({(x['year'],x['school_id']) for x in schools})==len(schools)
changes=read('program_change_rows')
for year,end in [(2024,1719),(2025,1996)]:assert {x['serial'] for x in changes if x['publication_year']==year}==set(range(1,end+1))
courses=read('courses');assert len({x['id'] for x in courses})==len(courses)
for row in courses:
 assert row['source_id'] in byid and row['actual_attainment'] is None
 assert row['credits'] is None or row['credits']>=0
 assert row['practice_hours'] is None or row['hours'] is None or row['practice_hours']<=row['hours']
panel=read('admissions_reviewed');assert len(panel)==9
assert len({(x['year'],x['school_code'],x['group'],x['major_code']) for x in panel})==len(panel)
for row in panel:assert row['province']=='北京市' and row['actual_admitted'] is None and row['national_total_eligible'] is False
for row in read('admissions_candidates'):assert row['aggregation_eligible'] is False and row['actual_admitted'] is None
jobs=read('job_sample');entry=[x for x in jobs if x['hiring_type'] in ('INTERN','GRADUATE')];assert len(entry)==65
for r in read('skill_demand'):
 assert r['entry_mentions']==sum(r['skill_id'] in j['skills'] for j in entry)
 assert r['entry_denominator']==len(entry)
s=read('summary');assert s['national_major_admissions'] is None and s['national_student_attainment'] is None
print(json.dumps(dict(ok=True,verified_source_hashes=hashes,school_year_records=len(schools),approval_rows=len(changes),course_records=len(courses),reviewed_admissions=len(panel),unreviewed_admission_candidates=len(read('admissions_candidates')),entry_jobs=len(entry)),ensure_ascii=False))
