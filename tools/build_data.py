from pathlib import Path
import re,json,shutil
root=Path(__file__).resolve().parents[1]
source=root/'source/繪圖提示詞_七大類150則.md'
if not source.exists(): source=root.parent/'繪圖提示詞_七大類150則.md'
text=source.read_text(encoding='utf-8-sig')
records=[]
category=None
item=None
for line in text.splitlines():
    if re.match(r'^## [一二三四五六七]、',line): category=line[3:].strip()
    if re.match(r'^### \d{2}｜',line): item=line[4:].strip()
pattern=r'\*\*([ABC])｜([^\n]+?)\*\*\s*\n\s*\n(.*?)(?=\n\s*\*\*[ABC]｜|\n### |\n## |\Z)'
for match in re.finditer(pattern,text,re.S):
    prefix=text[:match.start()]
    category=re.findall(r'^## ([一二三四五六七]、[^\n]+)',prefix,re.M)[-1]
    item=re.findall(r'^### (\d{2}｜[^\n]+)',prefix,re.M)[-1]
    num,title=item.split('｜',1)
    label=match[2].strip()
    prompt=match[3].strip()
    id=f'{num}-{match[1]}'
    records.append(dict(id=id,category=category,item=int(num),title=title,variant=match[1],label=label,prompt=prompt,fields=list(dict.fromkeys(re.findall('【([^】]+)】',prompt))),image=f'assets/images/{id}.webp',imageStatus='pending'))
assert len(records)==150,len(records)
(root/'assets').mkdir(parents=True,exist_ok=True)
(root/'assets/images').mkdir(exist_ok=True)
(root/'source').mkdir(exist_ok=True)
(root/'assets/prompts.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'assets/prompts.js').write_text('window.PROMPTS = '+json.dumps(records,ensure_ascii=False)+';\n',encoding='utf-8')
if source.resolve()!=(root/'source'/source.name).resolve(): shutil.copy2(source,root/'source'/source.name)
print(json.dumps({'prompts':len(records),'items':len({r['item'] for r in records}),'categories':{c:sum(r['category']==c for r in records) for c in dict.fromkeys(r['category'] for r in records)}},ensure_ascii=False))
