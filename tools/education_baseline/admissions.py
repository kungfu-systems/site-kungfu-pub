"""Extract province-specific candidates. OCR values remain unreviewed by default."""
import argparse,json,re,hashlib,csv
from pathlib import Path
import pdfplumber

def ocr_lines(page):
    for col in range(4):
        lines=[x for x in page['lines'] if col/4 <= x['x'] < (col+1)/4 and x['w']<.5]
        lines.sort(key=lambda x:x['y']+x['h']/2); groups=[]
        for x in lines:
            center=x['y']+x['h']/2
            if not groups or abs(center-groups[-1][0])>.0055:groups.append([center,[]])
            groups[-1][1].append(x)
        for y,g in groups:
            g.sort(key=lambda x:x['x'])
            yield col+1,y,' '.join(x['text'] for x in g),min(x['confidence'] for x in g)

def main():
    p=argparse.ArgumentParser();p.add_argument('--capture',required=True);p.add_argument('--out',required=True);a=p.parse_args();cap=Path(a.capture);out=Path(a.out);out.mkdir(parents=True,exist_ok=True)
    sources={s['id']:s for s in json.loads((cap/'sources.json').read_text())};records=[];streams=[]
    for year in [2024,2025,2026]:
        s=sources[f'BJ{year}'];events=[]
        if year==2024:
            with pdfplumber.open(cap/s['raw_path']) as pdf:
                for n,page in enumerate(pdf.pages,1):
                    if n>1:
                        for col in range(4):
                            for line in (page.crop((page.width*col/4,35,page.width*(col+1)/4,page.height-15)).extract_text() or '').splitlines():events.append((n,col+1,None,line,None))
                    else:continue # The first page contains introductory text and early military entries; intentionally excluded.
        else:
            for page in [json.loads(l) for l in (cap/f'BJ{year}-ocr.jsonl').read_text().splitlines()]:
                for col,y,line,conf in ocr_lines(page):events.append((page['page'],col,y,line,conf))
        school=None;school_code=None;group=None;current=None
        def flush():
            nonlocal current
            if not current:return
            raw=' '.join(current.pop('lines'));clean=re.sub(r'\s+','',raw);m=re.search(r'(\d+)人',clean)
            name=clean[:m.start()] if m else clean.split('（')[0].split('(')[0]
            terms=[t for t in ('人工智能','智能科学与技术','数据科学与大数据','计算机科学与技术','软件工程','机器人工程','信息与计算科学','大数据管理','智能感知','具身智能') if t in clean]
            if terms and len(clean)>3:
                count=int(m.group(1)) if m else None
                current.update(year=year,province='北京市',plan_count=count,actual_admitted=None,major_label=name,related_terms=terms,relation='明确人工智能专业' if name.startswith('人工智能') else '大类或其他关联专业',raw_text=raw,source_id=s['id'],source_url=s['url'],source_sha256=s['sha256'],review_status='unreviewed_ocr_candidate' if year!=2024 else 'unreviewed_text_candidate',national_total_eligible=False,aggregation_eligible=False)
                current['id']=hashlib.sha256(f"{year}|{current['page']}|{current['column']}|{current['school_code']}|{current['major_code']}|{raw}".encode()).hexdigest()[:16]
                records.append(current)
            current=None
        for page,col,y,line,conf in events:
            streams.append({'year':year,'page':page,'column':col,'y':y,'text':line,'confidence':conf})
            t=re.sub(r'\s+','',line)
            m=re.match(r'^(\d{4})([^\d]+?)(?:\d+人)?$',t)
            if m and re.search('大学|学院|学校',m[2]) and '地址' not in t and len(t)<100:
                flush();school_code=m[1];school=m[2].rstrip('〈<>〉');group=None;continue
            if re.match(r'^[{｛（(【［\[](?:[0-9O]{2})[}｝）)】］\]]',t) and ('科' in t or '物理' in t or '历史' in t):
                flush();group=t;continue
            m=re.match(r'^([0-9A-Z]{2})(?![0-9A-Za-z])(.+)',t)
            if m and school:
                flush();current=dict(page=page,column=col,school_code=school_code,school=school,group=group,major_code=m[1],ocr_min_confidence=conf,lines=[m[2]])
            elif current:
                current['lines'].append(line)
                if conf is not None:current['ocr_min_confidence']=min(current.get('ocr_min_confidence') or 1,conf)
        flush()
    (out/'admissions_candidates.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
    with (out/'admissions_candidates.csv').open('w',encoding='utf-8-sig',newline='') as f:
        cols=list(records[0]);w=csv.DictWriter(f,fieldnames=cols);w.writeheader();w.writerows(records)
    (cap/'admissions-reading-order.jsonl').write_text('\n'.join(json.dumps(r,ensure_ascii=False) for r in streams))
    from collections import Counter
    print(json.dumps({'candidates':len(records),'by_year':dict(Counter(r['year'] for r in records)),'unreviewed':True},ensure_ascii=False))
if __name__=='__main__':main()
