#!/usr/bin/env node
/* Visual completion regression: official Aha name, editorial scenes, theme preview,
 * theme switching, artwork and account preservation in actual Chromium.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const fixtures={characters:{'1512':{level:80,e:1,s:5,cone:'A Próxima Página da História',
 pv:6284,atk:1659,def:1044,spd:138}},profile:'1512',theme:'8001',v06RelicDetails:{'1512':[
 {setId:'127',level:15,main:{stat:'PV',value:705},subs:[{stat:'PV %',value:8.6}]}]}};
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
await mkdir('artifacts',{recursive:true});
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:width<600?844:900},
   deviceScaleFactor:1,isMobile:width<600,hasTouch:width<600,serviceWorkers:'block'});
  await context.addInitScript(data=>{
    if(!localStorage.getItem('anderus_nexus_v03'))
     localStorage.setItem('anderus_nexus_v03',JSON.stringify(data));
  },fixtures);
  await context.route('https://nexia-ai-nexus.andrediascrm.workers.dev/**',r=>
   r.fulfill({status:503,headers:{'Access-Control-Allow-Origin':'*'},
   body:'{"error":"Visual test is isolated from the cloud"}'}));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8787/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.NexusVisualPreview?.version==='5.0'&&
    typeof window.route==='function'&&typeof window.setTheme==='function'&&
    !!document.querySelector('.app.v06-app'),null,{timeout:25000});
  assert.equal(await page.evaluate(()=>CATALOG.find(c=>c.id==='future-aha')?.name),'Aha',
   'Official display name should be Aha without deprecated aliases');
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03')));
  await page.evaluate(()=>window.route('themes'));
  await page.locator('.v06-themes').waitFor();
  await page.locator('.nx-scene').waitFor();
  assert.equal(await page.locator('.nx-scene').count(),1,'Missing editorial scene');
  const option=page.locator('#v06-theme-grid button[onclick*="future-aha"]');
  await option.click();
  await page.locator('#nx-theme-preview[open]').waitFor();
  assert.match(await page.locator('#nx-theme-preview').innerText(),/Compare antes de aplicar/);
  assert.ok((await page.locator('#nx-theme-preview').innerText()).includes('Aha'));
  assert.equal(await page.evaluate(()=>state.theme),'8001','Preview must not switch theme');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03'))),before,
    'Preview must not persist any changes');
  await page.locator('#nx-theme-preview .nx-preview-cancel').click();
  await page.locator('#nx-theme-preview').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>state.theme),'8001','Cancel must keep theme');
  await option.click();
  await page.locator('#nx-theme-preview[open] .nx-preview-apply').click();
  await page.waitForFunction(()=>state.theme==='future-aha'&&
    document.querySelector('.app')?.classList.contains('aha-theatre'),null,{timeout:18000});
  await page.locator('.aha-gallery').waitFor({timeout:18000});
  await page.locator('.nx-theme-undo').waitFor({timeout:10000});
  assert.match(await page.locator('.nx-theme-undo').innerText(),/Voltar ao tema anterior/);
  assert.equal(await page.locator('.aha-gallery .aha-eidolon-grid a').count(),6,
    'Aha must have six official Eidolon art links in Grand Theatre');
  assert.equal(await page.evaluate(()=>localStorage.getItem('anderus_nexus_last_theme_v1')),'8001');
  await page.evaluate(()=>window.route('home'));
  await page.locator('.aha-show').waitFor({timeout:15000});
  assert.match(await page.locator('.aha-leading').innerText(),/Aha, Aeon da Euforia/);
  assert.doesNotMatch(await page.locator('.aha-leading').innerText(),/Nihilux|Nerilux|\bRá\b/i);
  await page.waitForFunction(()=>{const x=document.querySelector('.aha-portrait img');return x?.complete&&x.naturalWidth>0;},null,{timeout:15000});
  const routes=['home','library','endgame','farm','radar','themes','nexia','settings'];
  for(const view of routes){
   const n=errors.length;
   await page.evaluate(v=>window.route(v),view);
   await page.waitForTimeout(60);
   const position=await page.evaluate(()=>Math.round(window.scrollY));
   assert.equal(position,0,'Route must start at top on mobile and desktop: '+view+' at '+width);
   assert.ok(await page.locator('#stage').evaluate(el=>!!el.firstElementChild),'Empty '+view);
   const sz=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));
   assert.ok(sz.scroll<=sz.viewport+4,'Overflow Aha @'+width+' in '+view+': '+JSON.stringify(sz));
   assert.equal(errors.length,n,'Page error on '+view+': '+errors.slice(n).join(' | '));
   await page.screenshot({path:'artifacts/visual-aha-'+view+'-'+width+'.png',fullPage:false});
  }
  await page.evaluate(()=>window.openProfile('1512'));
  await page.locator('.v06-profile').waitFor();
  await page.screenshot({path:'artifacts/visual-aha-profile-'+width+'.png',fullPage:false});
  const after=await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03')));
  assert.deepEqual(after.characters,before.characters,'Theme must not change saved characters');
  assert.deepEqual(after.v06RelicDetails,before.v06RelicDetails,'Theme must not change relics');
  await page.evaluate(()=>window.route('themes'));
  await page.waitForFunction(()=>typeof window.v09SetVisualMode==='function',null,{timeout:15000});
  await page.evaluate(()=>window.v09SetVisualMode('original'));
  await page.waitForFunction(()=>!document.querySelector('.app')?.classList.contains('aha-theatre'),null,{timeout:15000});
  await page.evaluate(()=>window.v09SetVisualMode('chat'));
  await page.waitForFunction(()=>document.querySelector('.app')?.classList.contains('aha-theatre'),null,{timeout:15000});
  await page.locator('.nx-theme-undo').click();
  await page.waitForFunction(()=>state.theme==='8001'&&
   !document.querySelector('.app')?.classList.contains('aha-theatre'),null,{timeout:15000});
  assert.equal(await page.evaluate(()=>state.theme),'8001','Undo should restore the previous character theme');
  console.log('PASS Visual Completion '+width+'px: Aha name, preview/cancel/apply, 6 Eidolons, 8 sections, images, themes and account safety');
  await context.close();
 }
}finally{await browser.close();}
