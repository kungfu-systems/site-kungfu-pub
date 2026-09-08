import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';
const base=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);
await fs.mkdir(out,{recursive:true});
const read=async name=>JSON.parse(await fs.readFile(path.join(base,name+'.json'),'utf8'));
const wb=Workbook.create();const overview=wb.worksheets.add('概览');const renderNames=[];
const safe=(x,key='')=>{
 if(x==null)return key==='agent_relation'?'未纳入关联清单':'未取得';
 if(Array.isArray(x))return x.join('、');
 if(typeof x==='object')return JSON.stringify(x);
 if(typeof x==='string'&&/publication_date|accessed_at|published_at/.test(key))return new Date(x);
 if(typeof x==='string'&&x.startsWith('='))return "'"+x;
 return x;
};
function table(name,rows,columns,widths){
 const sh=wb.worksheets.add(name);sh.showGridLines=false;
 const vals=[columns.map(x=>x[0]),...rows.map(r=>columns.map(x=>safe(r[x[1]],x[1])))];
 const range=sh.getRangeByIndexes(0,0,vals.length,columns.length);
 for(let i=0;i<columns.length;i++)if(/(^|_)(code|id)$|sha256$|^group$/.test(columns[i][1]))sh.getRangeByIndexes(1,i,vals.length-1,1).setNumberFormat('@');
 range.values=vals;
 range.format.font={name:'Arial',size:10,color:'#25314A'};range.format.rowHeight=28;range.format.verticalAlignment='center';
 for(let i=0;i<columns.length;i++){
  const cells=sh.getRangeByIndexes(1,i,vals.length-1,1);const key=columns[i][1];
  sh.getRangeByIndexes(0,i,vals.length,1).format.columnWidthPx=widths?.[i]??160;
  if(/publication_date|published_at/.test(key))cells.setNumberFormat('yyyy-mm-dd');
  if(key==='accessed_at')cells.setNumberFormat('yyyy-mm-dd hh:mm:ss');
  if(/(^|_)(code|id)$|sha256$|^group$/.test(key))cells.setNumberFormat('@');
 }
 const t=sh.tables.add(range.address??`A1:${col(columns.length)}${vals.length}`,true,'T'+(renderNames.length+1));t.showFilterButton=true;
 sh.getRangeByIndexes(0,0,1,columns.length).format={fill:'#243A5A',font:{name:'Arial',size:10,bold:true,color:'#FFFFFF'},horizontalAlignment:'center',rowHeight:34,wrapText:true};
 sh.freezePanes.freezeRows(1);sh.freezePanes.freezeColumns(1);renderNames.push(name);return sh;
}
function col(n){let s='';for(;n;n=Math.floor((n-1)/26))s=String.fromCharCode(65+(n-1)%26)+s;return s;}
const skills=await read('skill_demand');
const skill=table('技能对照',skills,[['技能','skill'],['实习校招提及数','entry_mentions'],['样本分母','entry_denominator'],['样本内比例','entry_sample_share'],['全部候选提及数','all_mentions'],['全部候选分母','all_denominator'],['口径','basis']],[180,140,100,130,160,140,620]);
skill.getRange(`D2:D${skills.length+1}`).setNumberFormat('0.0%');
table('高校档案',await read('school_profiles'),[['学校','school'],['省级地区','province'],['教育层次','levels'],['专业或项目','programs'],['适用年级','cohorts'],['课程证据条数','course_records'],['来源项数','source_count'],['已采集来源','captured_count'],['证据类型','evidence_types'],['限制说明','limitations'],['首个来源URL','source_url']],[210,100,200,270,130,120,100,120,280,600,800]);
table('课程证据',await read('courses'),[['学校','school'],['层次','level'],['专业','program'],['年级','cohort'],['课程或实践','course'],['性质','requirement'],['学分','credits'],['学时','hours'],['实践学时','practice_hours'],['技能关联','skill_family'],['来源ID','source_id'],['标题定位页','exact_title_pages'],['证据类型','source_type'],['实际达成率','actual_attainment'],['URL','source_url'],['限制','limitation']],[210,140,240,85,280,210,80,80,100,210,90,100,170,110,800,560]);
table('招生核对',await read('admissions_reviewed'),[['学校','school'],['年度','year'],['招生条目','major'],['计划人数','plan_count'],['生源省份','province'],['批次','batch'],['专业组','group'],['专业代码','major_code'],['PDF页','page'],['实际录取','actual_admitted'],['说明','notes'],['URL','source_url']],[230,90,260,100,100,130,85,100,85,100,440,800]);
table('全国高校',await read('school_registry'),[['年度','year'],['学校标识码','school_id'],['学校','school'],['省级地区','province'],['办学层次','level'],['所在地','city'],['主管部门','authority'],['备注','remarks'],['来源URL','source_url']],[90,145,250,130,100,160,260,180,800]);
table('专业目录',await read('major_catalog'),[['年度','year'],['国家专业代码','major_code'],['专业名称','major'],['研究关联标签','agent_relation'],['PDF页','page'],['来源URL','source_url']],[90,145,260,180,90,850]);
table('备案审批',await read('program_change_rows'),[['发布年','publication_year'],['审批年度','approval_year'],['序号','serial'],['学校','school'],['专业','major'],['代码','major_code'],['关联标签','agent_relation'],['学位年限等原文','row_remainder'],['PDF页','page'],['来源URL','source_url']],[90,100,85,260,250,130,180,280,80,850]);
table('招生待核',await read('admissions_candidates'),[['年度','year'],['候选学校（未核）','school'],['候选招生条目（未核）','major_label'],['候选人数（未核）','plan_count'],['PDF页','page'],['栏目','column'],['复核状态','review_status'],['允许汇总','aggregation_eligible'],['来源URL','source_url']],[85,260,350,150,90,85,240,100,850]);
table('岗位样本',await read('job_sample'),[['企业','company'],['职位','title'],['招聘类型','hiring_type'],['地区','locations'],['发布日期','published_at'],['技能标签','skills'],['职位ID','job_id'],['来源URL','source_url']],[180,400,130,170,140,650,260,850]);
const sources=await read('sources');
table('来源档案',sources,[['来源ID','id'],['标题','title'],['发布机构','publisher'],['发布日期','publication_date'],['采集日期UTC','accessed_at'],['采集状态','status'],['文件字节数','bytes'],['SHA-256','sha256'],['URL','url'],['限制','limitations']],[100,330,220,140,290,160,120,580,1000,550]);
overview.showGridLines=false;overview.tabColor='#243A5A';overview.getRange('A1:H38').format.font={name:'Arial',size:11,color:'#25314A'};
overview.getRange('A1:A38').format.columnWidthPx=24;overview.getRange('B1:B38').format.columnWidthPx=370;overview.getRange('C1:C38').format.columnWidthPx=150;overview.getRange('D1:D38').format.columnWidthPx=160;overview.getRange('E1:E38').format.columnWidthPx=460;
overview.getRange('B2').values=[['高校 Agent 教育与就业基线']];overview.getRange('B2').format.font={name:'Arial',size:16,bold:true};overview.getRange('B3').values=[['功夫酒馆 · 截至 2026-09-08 · 公开证据首轮档案']];overview.getRange('B3').format.font.color='#637089';
const metrics=[['指标','数值','单位','范围'],['高校年度记录',8739,'条','全国普通高校三年截面'],['本科专业年度记录',2544,'条','所有专业门类；相关清单另行标记'],['备案审批记录',3715,'条','2024、2025发布结果，非招生人数'],['来源登记',63,'项','62项已存本地快照，1项HTTP 404'],['高校档案',32,'校','13个省级地区，非概率抽样'],['课程与实践证据',110,'条','重点选取；不代表完整课程全集'],['招生已核对',9,'条','三校三年在京普通批计划'],['招生待核候选',1949,'条','全部禁止自动汇总'],['就业候选',286,'条','存续公开招聘便利样本'],['其中实习／校招',65,'条','64条百度、1条彩讯'],['全国专业实际招生',null,'人','尚无完整同口径数据'],['全国学生技能达成率',null,'比例','无统一测评和总体样本']];
overview.getRange('B5:E17').values=metrics.map(r=>r.map(x=>safe(x)));
overview.getRange('B5:E5').format={fill:'#243A5A',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},rowHeight:30};overview.getRange('B6:E17').format.rowHeight=30;
overview.getRange('B20').values=[['全国普通高校底表（按年度计数）']];overview.getRange('B20').format.font.bold=true;
overview.getRange('B22:E25').values=[['截面年度','全部','本科','专科'],[2024,null,null,null],[2025,null,null,null],[2026,null,null,null]];
for(let row=23;row<=25;row++)overview.getRange(`C${row}:E${row}`).formulas=[[`=COUNTIFS('全国高校'!$A$2:$A$8740,B${row})`,`=COUNTIFS('全国高校'!$A$2:$A$8740,B${row},'全国高校'!$E$2:$E$8740,"本科")`,`=COUNTIFS('全国高校'!$A$2:$A$8740,B${row},'全国高校'!$E$2:$E$8740,"专科")`]];
overview.getRange('B22:E22').format={fill:'#243A5A',font:{name:'Arial',size:11,bold:true,color:'#FFFFFF'},rowHeight:30};overview.getRange('B23:E25').format.rowHeight=30;
overview.getRange('B28').values=[['阅读口径']];overview.getRange('B28').format.font.bold=true;
overview.getRange('B30').values=[['计划、录取、毕业和实际技能是不同指标。']];overview.getRange('B32').values=[['课程安排不能证明学生已经掌握；未取得的值不记作零。']];overview.getRange('B34').values=[['岗位比例只描述当前样本；不代表全国市场。']];
wb.recalculate();
const check=await wb.inspect({kind:'table',range:'概览!B22:E25',include:'values,formulas',tableMaxRows:4,tableMaxCols:4,maxChars:1800});console.log(check.ndjson);
const errors=await wb.inspect({kind:'match',searchTerm:'#REF!|#DIV/0!|#VALUE!|#NAME\\?|#NUM!|#SPILL!|#CALC!',options:{useRegex:true,maxResults:30},maxChars:1000});console.log(errors.ndjson);
const xlsx=await SpreadsheetFile.exportXlsx(wb);await xlsx.save(path.join(out,'agent-education-baseline-20260908.xlsx'));
for(const name of ['概览',...renderNames]){
 const preview=await wb.render({sheetName:name,range:name==='概览'?'B2:E25':'A1:F8',scale:1,format:'png'});
 await fs.writeFile(path.join(out,`preview-${name}.png`),new Uint8Array(await preview.arrayBuffer()));
}
console.log(JSON.stringify({output:path.join(out,'agent-education-baseline-20260908.xlsx'),sheets:renderNames.length+1}));
