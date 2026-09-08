"""Render the canonical Chinese report source; leave research claims unchanged."""
from pathlib import Path
import re,html
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,Table,TableStyle,PageBreak,KeepTogether
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
pdfmetrics.registerFont(UnicodeCIDFont('STSong-Light'))
pdfmetrics.registerFontFamily('STSong-Light',normal='STSong-Light',bold='STSong-Light',italic='STSong-Light',boldItalic='STSong-Light')
root=Path('.private/education-baseline/2026-09-08');dest=Path('output/pdf');dest.mkdir(parents=True,exist_ok=True)
source=(root/'report-source.md').read_text();source=re.sub(r'^---\n.*?\n---\n','',source,flags=re.S)
navy=colors.HexColor('#243A5A');muted=colors.HexColor('#61708B');wine=colors.HexColor('#9A3B48')
body=ParagraphStyle('body',fontName='STSong-Light',fontSize=10,leading=15,textColor=colors.HexColor('#25314A'),spaceAfter=7,wordWrap='CJK')
small=ParagraphStyle('small',parent=body,fontSize=8.5,leading=12.5,spaceAfter=0)
headcell=ParagraphStyle('headcell',parent=small,textColor=colors.white)
title=ParagraphStyle('title',parent=body,fontSize=24,leading=34,textColor=navy,spaceAfter=14,keepWithNext=True)
h2=ParagraphStyle('h2',parent=body,fontSize=18,leading=27,textColor=navy,spaceAfter=18,keepWithNext=True)
def markup(t):
 t=html.escape(t.replace('·',' / '))
 t=re.sub(r'\[([^]]+)\]\((https?://[^\s)]+)\)',lambda m:f'<link href="{m[2]}" color="#345C91"><u>{m[1]}</u></link>',t)
 t=re.sub(r'\*\*(.*?)\*\*',r'<b>\1</b>',t)
 return t.replace('`','')
flow=[];lines=source.splitlines();i=0;sections=0
while i<len(lines):
 line=lines[i].strip()
 if not line:i+=1;continue
 if line.startswith('# '):flow.append(Paragraph(markup(line[2:]),title));i+=1;continue
 if line.startswith('## '):
  if sections and not line.startswith('## 阅读'):flow.append(PageBreak())
  flow.append(Paragraph(markup(line[3:]),h2));sections+=1;i+=1;continue
 if line.startswith('|'):
  rows=[]
  while i<len(lines) and lines[i].strip().startswith('|'):
   cells=[c.strip() for c in lines[i].strip().strip('|').split('|')]
   if not all(re.fullmatch('[-: ]+',c) for c in cells):rows.append(cells)
   i+=1
  n=len(rows[0]);widths={2:[280,215],3:[155,95,245],4:[100,105,135,155],5:[180,45,45,45,180]}.get(n,[495/n]*n)
  # Equal-width numeric registry tables need a broader first column, while evidence tables need text space.
  if rows[0][0]=='截面日期':widths=[145,115,115,120]
  if rows[0][0]=='能力连接':widths=[90,135,125,145]
  if rows[0][0]=='学校及版本':widths=[110,240,145]
  data=[[Paragraph(markup(c),headcell if r==0 else small) for c in row] for r,row in enumerate(rows)]
  t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT')
  t.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,0),navy),('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),8),('RIGHTPADDING',(0,0),(-1,-1),8),('TOPPADDING',(0,0),(-1,-1),4),('BOTTOMPADDING',(0,0),(-1,-1),4),('ROWBACKGROUNDS',(0,1),(-1,-1),[colors.HexColor('#F2F5F9'),colors.white]),('LINEBELOW',(0,-1),(-1,-1),.6,colors.HexColor('#CBD3DF'))]))
  flow.extend([t,Spacer(1,13)]);continue
 if line.startswith('- '):flow.append(Paragraph('- '+markup(line[2:]),body));i+=1;continue
 parts=[line];i+=1
 while i<len(lines) and lines[i].strip() and not lines[i].lstrip().startswith(('#','|','- ')):parts.append(lines[i].strip());i+=1
 flow.append(Paragraph(markup(' '.join(parts)),body))
def page(c,d):
 c.saveState();w,h=A4;c.setStrokeColor(wine);c.setLineWidth(1);c.line(48,h-35,w-48,h-35)
 c.setFont('STSong-Light',8);c.setFillColor(muted);c.drawString(48,h-25,'功夫酒馆  /  公开教育与就业基线');c.drawRightString(w-48,25,f'2026-09-08  /  {d.page}');c.restoreState()
doc=SimpleDocTemplate(str(dest/'agent-education-baseline-20260908.pdf'),pagesize=A4,leftMargin=48,rightMargin=48,topMargin=53,bottomMargin=43,title='中国高校Agent相关教育与就业需求基线',author='功夫酒馆研究')
doc.build(flow,onFirstPage=page,onLaterPages=page)
print(dest/'agent-education-baseline-20260908.pdf')
