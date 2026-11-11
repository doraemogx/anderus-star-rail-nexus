#!/usr/bin/env node
/* Full Theme Studio and multi-page visual regression in real Chromium.
 * Fixtures only: never uses the owner's real account or credentials.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const fixtures={
 characters:{
  '1512':{level:80,e:1,s:5,cone:'A Próxima Página da História',pv:6284,atk:1659,def:1044,spd:138},
  '1505':{level:80,e:2,s:1,pv:4100,atk:2300}
 },
 profile:'1512',theme:'8001',
 v06RelicDetails:{'1512':[{setId:'127',level:15,main:{stat:'PV',value:705},subs:[{stat:'PV %',value:8.6}]}]}
};
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
await mkdir('artifacts',{recursive:true});
try{
 for(const width of [320,390,768,1440]){
  const ctx=await browser.newContext({viewport:{width,height:width<768?844:920},
   isMobile:width<768,hasTouch:width<768,serviceWorkers:'block'});
  await ctx.addInitScript(data=>{if(!localStorage.getItem('anderus_nexus_v03'))
   localStorage.setItem('anderus_nexus_v03',JSON.stringify(data));},fixtures);
  await ctx.route('https://nexia-ai-nexus.andrediascrm.workers.dev/**',route=>
   route.fulfill({status:503,body:'{"error":"Isolated UI test"}'}));
  const page=await ctx.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8787/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.NexusVisualExperience?.version==='2.0'&&
   window.NexusVisualPreview?.version==='5.0'&&typeof window.route==='function',null,{timeout:30000});
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03')));
  await page.evaluate(()=>window.route('themes'));
  await page.locator('.nx-vex-feature-grid button').first().waitFor();
  assert.ok(await page.locator('.nx-vex-feature-grid button').count()>=2,
    'Theme Studio must feature the original and Aha variants');
  assert.ok(await page.locator('.nx-vex-intro').count()===1,'Missing new Theme Studio banner');
  assert.ok(await page.locator('#v06-theme-grid button').count()>5,'Legacy character themes lost');
  const scene=await page.locator('.nx-scene').count();
  assert.equal(scene,1,'Themed hub scene is missing');
  await page.locator('.nx-vex-filter[data-filter="featured"]').click();
  assert.equal(await page.locator('.nx-vex-filter[aria-pressed="true"]').getAttribute('data-filter'),'featured');
  assert.ok(await page.locator('#v06-theme-grid button:visible').count()>=2,'Featured themes are invisible');
  await page.locator('.nx-vex-filter[data-filter="owned"]').click();
  assert.ok(await page.locator('#v06-theme-grid button:visible').count()>=1,
   'At least the active theme must remain visible');
  await page.locator('.nx-vex-filter[data-filter="all"]').click();
  assert.ok(await page.locator('#v06-theme-grid button:visible').count()>5);
  await page.locator('.nx-vex-feature[data-vex-theme="future-aha"]').click();
  await page.locator('#nx-theme-preview[open]').waitFor();
  await page.waitForFunction(()=>document.querySelectorAll('#nx-theme-preview .nx-vex-mock').length===2);
  assert.equal(await page.locator('#nx-theme-preview .nx-vex-mock').count(),2,
    'Preview must show the actual UI composition of both themes');
  assert.equal(await page.locator('#nx-theme-preview .nx-vex-mock[data-vex-style="aha"]').count(),1);
  assert.match(await page.locator('#nx-theme-preview').innerText(),/painéis e a navegação/i);
  assert.equal(await page.evaluate(()=>state.theme),'8001','Preview must not change active theme');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03'))),before,
    'Opening the visual preview cannot mutate the account');
  await page.locator('#nx-theme-preview .nx-preview-cancel').click();
  await page.locator('#nx-theme-preview').waitFor({state:'hidden'});
  if(width===390||width===1440)
   await page.screenshot({path:'artifacts/visual-studio-'+width+'.png',fullPage:false});
  await page.locator('.nx-vex-feature[data-vex-theme="future-aha"]').click();
  await page.locator('#nx-theme-preview[open] .nx-preview-apply').click();
  await page.waitForFunction(()=>state.theme==='future-aha'&&
   document.querySelector('.app')?.classList.contains('aha-theatre'),null,{timeout:20000});
  await page.locator('.nx-vex-feature[data-vex-theme="future-aha"].is-active').waitFor({timeout:12000});
  const routes=['home','library','endgame','farm','radar','tier','themes','nexia','settings'];
  for(const route of routes){
   const count=errors.length;
   await page.evaluate(v=>window.route(v),route);
   await page.waitForTimeout(80);
   const info=await page.evaluate(()=>({
    scroll:document.documentElement.scrollWidth,viewport:window.innerWidth,
    populated:!!document.querySelector('#stage')?.firstElementChild,
    name:document.title
   }));
   assert.ok(info.populated,'Missing route '+route+' @ '+width);
   assert.ok(info.scroll<=info.viewport+4,
    'Overflow '+route+' @ '+width+': '+JSON.stringify(info));
   assert.equal(errors.length,count,'Error on '+route+': '+errors.slice(count).join(' | '));
  }
  await page.evaluate(()=>window.route('themes'));
  await page.locator('.nx-vex-intro').waitFor();
  const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03')));
  assert.equal(record.characters['1512'].pv,6284,'UI must preserve Robin');
  assert.equal(record.characters['1505'].e,2,'UI must preserve another character');
  if(width===390||width===1440)
   await page.screenshot({path:'artifacts/visual-studio-aha-'+width+'.png',fullPage:false});
  console.log('PASS complete visual '+width+'px: theme library, filters, 2 live UI previews, confirm/cancel, 9 routes, saved account');
  await ctx.close();
 }
}finally{await browser.close()}
