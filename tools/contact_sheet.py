from PIL import Image,ImageOps,ImageDraw
from pathlib import Path
import json
root=Path(r'C:/Users/user/Desktop/Codex/prompt-gallery')
data=json.loads((root/'assets/prompts.json').read_text(encoding='utf-8'))
folder=root/'qa'
folder.mkdir(exist_ok=True)
for group in range(6):
    rows=data[group*25:(group+1)*25]
    sheet=Image.new('RGB',(1000,1000),'white')
    draw=ImageDraw.Draw(sheet)
    for index,p in enumerate(rows):
        x=(index%5)*200;y=(index//5)*200
        file=root/p['image']
        if file.exists():
            im=Image.open(file).convert('RGB')
            thumb=ImageOps.contain(im,(192,174))
            sheet.paste(thumb,(x+(200-thumb.width)//2,y+(174-thumb.height)//2))
        draw.text((x+8,y+180),p['id'],fill='#252342')
    sheet.save(folder/f'contact-{group+1}.jpg',quality=90)
print('contact sheets ready')
