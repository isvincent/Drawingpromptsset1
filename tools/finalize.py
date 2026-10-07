from pathlib import Path
import json,hashlib
from PIL import Image
root=Path(__file__).resolve().parents[1]
records=json.loads((root/'assets/prompts.json').read_text(encoding='utf-8'))
source=root/'source/繪圖提示詞_七大類150則.md'
source_text=source.read_text(encoding='utf-8-sig')
assert len(records)==150 and len({p['id'] for p in records})==150
assert len({p['item'] for p in records})==50
assert all(p['prompt'] in source_text for p in records), 'prompt text differs from source'
missing=[]
hashes={}
images=[]
for p in records:
    path=root/p['image']
    if not path.exists():
        p['imageStatus']='pending'
        missing.append(p['id'])
        continue
    with Image.open(path) as im:
        images.append({'id':p['id'],'width':im.width,'height':im.height,'format':im.format,'mode':im.mode,'bytes':path.stat().st_size})
        im.verify()
    digest=hashlib.sha256(path.read_bytes()).hexdigest()
    assert digest not in hashes, f"duplicate image: {p['id']} {hashes.get(digest)}"
    hashes[digest]=p['id']
    p['imageStatus']='complete'
(root/'assets/prompts.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
(root/'assets/prompts.js').write_text('window.PROMPTS = '+json.dumps(records,ensure_ascii=False)+';\n',encoding='utf-8')
report={'total':len(records),'sourceTextPreserved':True,'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'complete':len(records)-len(missing),'missing':missing,'uniqueImageHashes':len(hashes),'totalImageBytes':sum(i['bytes'] for i in images),'images':images}
(root/'image-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in report.items() if k!='images'},ensure_ascii=False))
