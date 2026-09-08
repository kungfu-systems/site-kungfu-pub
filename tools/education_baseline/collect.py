"""Capture explicitly reviewed public sources; preserve failures and immutable bytes."""
import argparse
import concurrent.futures
import hashlib
import json
from pathlib import Path
import subprocess
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser

class Text(HTMLParser):
    def __init__(self):
        super().__init__(); self.parts=[]; self.skip=0
    def handle_starttag(self,t,a):
        if t in ('script','style'): self.skip+=1
        if t in ('p','tr','td','br','div','h1','h2','li'): self.parts.append('\n')
    def handle_endtag(self,t):
        if t in ('script','style'): self.skip=max(0,self.skip-1)
    def handle_data(self,d):
        if not self.skip:self.parts.append(d)

def main():
    p=argparse.ArgumentParser(); p.add_argument('--sources',required=True); p.add_argument('--out',required=True); p.add_argument('--workers',type=int,default=4)
    a=p.parse_args(); out=Path(a.out); (out/'raw').mkdir(parents=True,exist_ok=True); (out/'text').mkdir(exist_ok=True)
    sources=json.loads(Path(a.sources).read_text()); hostlocks={urllib.parse.urlsplit(s['url']).netloc:threading.Lock() for s in sources}
    manifest=out/'sources.json'; existing={r['id']:r for r in json.loads(manifest.read_text())} if manifest.exists() else {}
    def fetch(s):
        if s['id'] in existing and existing[s['id']]['status']=='captured':return existing[s['id']]
        r={**s,'accessed_at':datetime.now(timezone.utc).isoformat(),'status':'unavailable'}
        try:
            u=urllib.parse.urlsplit(s['url']); url=urllib.parse.urlunsplit((u.scheme,u.netloc,urllib.parse.quote(u.path,safe='/%'),urllib.parse.quote(u.query,safe='=&%+?:/'),''))
            if u.scheme!='https':raise ValueError('Only HTTPS public sources are supported')
            with hostlocks[u.netloc]:
                time.sleep(0.8)
                with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'KungfuPublicResearch/0.1 (public education baseline)'}),timeout=35) as response:
                    body=response.read(250_000_001); r.update(http_status=response.status,content_type=response.headers.get('Content-Type'),final_url=response.url)
            if len(body)>250_000_000:raise ValueError('250 MB capture limit')
            h=hashlib.sha256(body).hexdigest(); kind='pdf' if body.startswith(b'%PDF') else 'xls' if body.startswith(bytes.fromhex('d0cf11e0')) else 'xlsx' if body.startswith(b'PK') else 'html'
            path=out/'raw'/f'{h}.{kind}'; path.write_bytes(body)
            r.update(sha256=h,bytes=len(body),raw_path=str(path.relative_to(out)),kind=kind,status='captured')
            if kind=='pdf':
                q=subprocess.run(['pdftotext','-layout',str(path),'-'],capture_output=True,timeout=90)
                r['text_exit_code']=q.returncode; text=q.stdout.decode('utf8','replace') if q.returncode==0 else ''
                r['pages']=text.count('\f')
            elif kind=='html':
                content=body.decode('utf8','replace')
                if content.count('\ufffd')>30:content=body.decode('gb18030','replace')
                parser=Text(); parser.feed(content); text='\n'.join(x.strip() for x in ''.join(parser.parts).splitlines() if x.strip())
                if ('请输入验证码下载附件' in text or ('captcha' in content.lower() and len(text)<300)):r['status']='access_challenge'
            else:text=''
            if text:
                target=out/'text'/f"{s['id']}.txt"; target.write_text(text); r['text_path']=str(target.relative_to(out)); r['text_chars']=len(text)
        except Exception as e:r['error']=f'{type(e).__name__}: {e}'
        print(json.dumps({k:r[k] for k in ('id','status','bytes','error') if k in r},ensure_ascii=False),flush=True)
        return r
    with concurrent.futures.ThreadPoolExecutor(max_workers=a.workers) as ex:records=list(ex.map(fetch,sources))
    manifest.write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({'sources':len(records),'captured':sum(x['status']=='captured' for x in records)},ensure_ascii=False))
if __name__=='__main__':main()
