import json,subprocess
from pathlib import Path
from PIL import Image,ImageDraw
cap=Path('.private/education-baseline/2026-09-08'); dest=cap/'review';dest.mkdir(exist_ok=True)
sources={}
for folder in [cap,cap/'curricula',cap/'additional']:
 for s in json.loads((folder/'sources.json').read_text()):sources[s['id']]=(folder/s.get('raw_path',''),s)
# Full columns preserve surrounding context; panel text is added only outside the original image.
panels=[('BJ2024',20,3),('BJ2025',32,2),('BJ2026',32,3),('BJ2024',23,2),('BJ2025',35,3),('BJ2026',36,2),('BJ2024',27,3),('BJ2025',40,4),('BJ2026',42,3)]
for sid,page,col in panels:
 prefix=dest/f'{sid}-p{page}'; target=dest/f'{sid}-p{page}-c{col}.png'
 if not prefix.with_suffix('.png').exists():subprocess.run(['pdftoppm','-f',str(page),'-l',str(page),'-scale-to-x','2400','-scale-to-y','-1','-singlefile','-png',str(sources[sid][0]),str(prefix)],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 im=Image.open(prefix.with_suffix('.png'));w,h=im.size;im.crop((int((col-1)*w/4),0,int(col*w/4),h)).save(target)
for sid,page in [('N03',4),('E05',12),('E16',8),('E04',3),('W05',16),('OUTCOME2024',28)]:
 subprocess.run(['pdftoppm','-f',str(page),'-l',str(page),'-scale-to','1700','-singlefile','-png',str(sources[sid][0]),str(dest/f'{sid}-p{page}')],check=True,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
print(dest)
