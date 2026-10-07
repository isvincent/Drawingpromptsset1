from pathlib import Path
import json,zipfile,hashlib
root=Path(__file__).resolve().parents[1]
data=json.loads((root/'assets/prompts.json').read_text(encoding='utf-8'))
assert len(data)==150
assert all(p['imageStatus']=='complete' and (root/p['image']).is_file() for p in data),'圖片尚未完成'
qa=json.loads((root/'qa-report.json').read_text(encoding='utf-8'))
assert all(c['passed'] for c in qa['checks']),'QA 尚未全部通過'
name='繪圖提示詞150則_互動網頁_GitHub'
output=root.parent/(name+'.zip')
version=2
while output.exists():
    output=root.parent/f'{name}_v{version}.zip'
    version+=1
files=sorted(p for p in root.rglob('*') if p.is_file() and not p.name.startswith('server-') and '.git' not in p.parts and '__pycache__' not in p.parts)
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for p in files:archive.write(p,p.relative_to(root).as_posix())
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    names=set(archive.namelist())
    assert {'index.html','README.md','.nojekyll','assets/app.js','assets/styles.css','assets/prompts.js','source/繪圖提示詞_七大類150則.md'}.issubset(names)
    assert all(p['image'] in names for p in data)
print(json.dumps({'archive':str(output),'bytes':output.stat().st_size,'MiB':round(output.stat().st_size/1024/1024,2),'files':len(files),'images':150,'qaChecks':len(qa['checks']),'sha256':hashlib.sha256(output.read_bytes()).hexdigest()},ensure_ascii=False))
