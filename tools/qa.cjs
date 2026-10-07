const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true, ...(process.env.BROWSER_EXE ? {executablePath:process.env.BROWSER_EXE} : {})});
 const context=await browser.newContext({viewport:{width:1440,height:1000},permissions:['clipboard-read','clipboard-write']});
 const page=await context.newPage();const results=[];const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const check=(name,ok)=>{results.push({name,passed:!!ok});if(!ok)throw new Error(name);};
 await page.goto(process.env.QA_URL || 'http://127.0.0.1:8765');
 await page.waitForSelector('.card');
 check('150 records and 50 items',await page.evaluate(()=>PROMPTS.length===150&&new Set(PROMPTS.map(x=>x.item)).size===50));
 check('12 cards on first page',await page.locator('.card').count()===12);
 check('13 pages',await page.locator('#pageInfo').textContent()==='第 1 / 13 頁');
 await page.locator('#next').click();check('next page starts 05-A',await page.locator('.number').first().textContent()==='05-A');
 await page.locator('#search').fill('圖書館');check('full text search',await page.locator('.card').count()>0&&await page.locator('#resultCount').textContent()!=='150 則提示詞');
 await page.locator('#search').fill('zzz不存在的字');check('empty state',await page.locator('#empty').isVisible());
 await page.locator('#reset').click();
 await page.locator('#categories button').nth(6).click();check('category count 15',await page.locator('#resultCount').textContent()==='15 則提示詞 / 全部 150 則');
 await page.locator('[data-variant="B"]').click();check('category and variant intersect 5',await page.locator('.card').count()===5);
 await page.locator('#categories button').first().click();await page.locator('[data-variant="all"]').click();
 await page.locator('.save').first().click();check('favorite count',await page.locator('#favoriteCount').textContent()==='1');
 await page.locator('#favoriteFilter').click();check('favorites filter',await page.locator('.card').count()===1);
 await page.reload();check('favorites persist after reload',await page.locator('#favoriteCount').textContent()==='1');
 await page.locator('.copy').first().click();check('clipboard exact original',await page.evaluate(async()=>await navigator.clipboard.readText())===await page.evaluate(()=>PROMPTS[0].prompt));
 await page.evaluate(()=>{window.__originalClipboard=navigator.clipboard; Object.defineProperty(navigator,'clipboard',{get:()=>undefined,configurable:true});}); await page.locator('.copy').first().click(); check('fallback clipboard exact original',await page.evaluate(async()=>await window.__originalClipboard.readText())===await page.evaluate(()=>PROMPTS[0].prompt)); await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{get:()=>window.__originalClipboard,configurable:true}));
 await page.locator('#search').fill('會員限定優惠');await page.locator('.image-button').first().click();
 check('detail dialog opens',await page.locator('#detail').evaluate(n=>n.open));
 const field=page.locator('#fieldEditor input').first();await field.fill('示範會員禮物');
 await page.locator('#commonText').check();await page.locator('#copyCustom').click();
 const custom=await page.evaluate(async()=>await navigator.clipboard.readText());check('custom fields and common instruction',custom.includes('示範會員禮物')&&custom.includes('所有文字使用繁體中文'));
 await page.keyboard.press('Escape');check('Escape closes dialog',!await page.locator('#detail').evaluate(n=>n.open));
 await page.locator('#search').fill('');await page.evaluate(()=>{window.__oscCount=0;const Original=window.AudioContext;window.AudioContext=class extends Original{createOscillator(){window.__oscCount++;return super.createOscillator();}};});await page.locator('#soundToggle').click();check('oscillator sound produced',await page.evaluate(()=>window.__oscCount>0));check('sound enables',await page.locator('#soundToggle').getAttribute('aria-pressed')==='true');
 await page.locator('#random').click();check('random opens valid detail',await page.locator('#detailMeta').textContent()!==''&&await page.locator('#detail').evaluate(n=>n.open));await page.keyboard.press('Escape');
 await page.locator('#helpOpen').click();check('guide opens',await page.locator('#help').evaluate(n=>n.open));await page.locator('#helpClose').click();
 await page.locator('#formulaCopy').click();check('formula copy', (await page.evaluate(async()=>await navigator.clipboard.readText())).startsWith('請製作【用途與產出形式】'));
 await page.locator('.card img').evaluateAll(imgs=>imgs.forEach(i=>i.loading='eager')); await page.waitForFunction(()=>[...document.querySelectorAll('.card img')].every(i=>i.complete)); await page.screenshot({path:path.join(root,'qa-desktop.png'),fullPage:true});
 for(const width of [390,768,1440]){
  await page.setViewportSize({width,height:900});
  for(const large of [false,true]){
   const current=await page.locator('#sizeToggle').getAttribute('aria-pressed')==='true';if(current!==large)await page.locator('#sizeToggle').click();
   check(`no horizontal overflow ${width} large=${large}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.locator('.image-button').first().click();check(`detail fits ${width} large=${large}`,await page.locator('#detail').evaluate(n=>n.scrollWidth<=n.clientWidth+1));await page.keyboard.press('Escape');
  }
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#sizeToggle').click();await page.screenshot({path:path.join(root,'qa-mobile.png'),fullPage:true});
 await page.locator('#categories button').nth(1).click();await page.evaluate(()=>document.documentElement.style.setProperty('--base','36px'));check('200 percent text no overflow mobile with filtered count',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.locator('.image-button').first().click();check('200 percent text detail no overflow',await page.locator('#detail').evaluate(n=>n.scrollWidth<=n.clientWidth+1));await page.keyboard.press('Escape');await page.screenshot({path:path.join(root,'qa/large-text.png'),fullPage:false});await page.evaluate(()=>document.documentElement.style.setProperty('--base','18px'));await page.locator('#categories button').first().click();
 await page.emulateMedia({reducedMotion:'reduce'});check('reduced motion supported',await page.locator('.card').first().evaluate(n=>getComputedStyle(n).animationName==='none'));
 const data=JSON.parse(fs.readFileSync(path.join(root,'assets/prompts.json'),'utf8'));
 const absent=data.filter(p=>!fs.existsSync(path.join(root,p.image))).map(p=>p.id);
 results.push({name:'all 150 local example images',passed:absent.length===0,missing:absent});
 const decoded=await page.evaluate(async()=>{for(let start=0;start<PROMPTS.length;start+=10){const ok=await Promise.all(PROMPTS.slice(start,start+10).map(p=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve(img.naturalWidth>0);img.onerror=()=>resolve(false);img.src=p.image;})));if(!ok.every(Boolean))return false;}return true;}); results.push({name:'all 150 images decode in browser',passed:decoded});
 check('no runtime JS errors',errors.length===0);
 fs.writeFileSync(path.join(root,'qa-report.json'),JSON.stringify({timestamp:new Date().toISOString(),checks:results,errors},null,2));
 console.log(JSON.stringify({passed:results.filter(r=>r.passed).length,total:results.length,missingImages:absent.length}));
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
