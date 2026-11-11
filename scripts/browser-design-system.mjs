#!/usr/bin/env node
/* Phase 4: actual Chromium responsive/accessibility regressions at 8 widths.
 * Purely synthetic account; never use real credentials or upload user screenshots.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const sizes=[320,360,390,430,768,1024,1440,1920];
const paths=['home','library','endgame','farm','radar','tier','themes','nexia','settings'];
const base='http://127.0.0.1:8787/';
const seed={characters:{'1512':{level:80,e:1,s:1,cone:'A Próxima Página da História',pv:6284}},profile:'1512',v06SavedTeams:[]};
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
await mkdir('artifacts',{recursive:true});
try{
 for(const width of sizes){
  const context=await browser.newContext({viewport:{width,height:width<768?844:900},
   isMobile:width<768,hasTouch:width<768,deviceScaleFactor:1,
   reducedMotion:width===360?'reduce':'no-preference',serviceWorkers:'block'});
  await context.addInitScript(value=>{
   if(!localStorage.getItem('anderus_nexus_v03'))
    localStorage.setItem('anderus_nexus_v03',JSON.stringify(value));
  },seed);
  await context.route('https://nexia-ai-nexus.andrediascrm.workers.dev/**',route=>
   route.fulfill({status:503,headers:{'Access-Control-Allow-Origin':'*'},
    body:'{"error":"Isolated browser QA"}'}));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.NexusDesignSystem?.version==='4.0'&&
   typeof window.route==='function'&&document.querySelector('.app.v06-app'),null,{timeout:25000});
  await page.locator('#nexus-design-system-css').waitFor({state:'attached'});
  await page.evaluate(async()=>{
   const css=document.querySelector('#nexus-design-system-css');
   if(!css.sheet)await new Promise((ok,fail)=>{
    css.addEventListener('load',ok,{once:true});
    css.addEventListener('error',()=>fail(Error('Design System CSS failed')),{once:true});
   });
  });
  assert.ok(await page.locator('.nx-skip').count()===1,'Skip link missing');
  const readWidths=async()=>{
   const metrics=await page.evaluate(()=>{
    const html=document.documentElement,stage=document.getElementById('stage');
    const nav=document.getElementById('bottomNav');
    return {viewport:innerWidth,scrollWidth:html.scrollWidth,stageWidth:stage?.getBoundingClientRect().width,
     navWidth:nav?.getBoundingClientRect().width,navVisible:nav&&getComputedStyle(nav).display!=='none'};
   });
   assert.ok(metrics.scrollWidth<=metrics.viewport+4,
    'Page overflows @ '+width+': '+JSON.stringify(metrics));
   assert.ok(metrics.stageWidth>200,
    'Stage collapsed @ '+width+': '+JSON.stringify(metrics));
   return metrics;
  };
  for(const view of paths){
   const before=errors.length;
   await page.evaluate(v=>window.route(v),view);
   await page.waitForTimeout(60);
   assert.ok(await page.locator('#stage').evaluate(el=>!!el.firstElementChild),
    'Blank '+view+' at '+width);
   assert.equal(errors.length,before,'Error on '+view+' at '+width+': '+errors.slice(before).join(' | '));
   await readWidths();
   const current=await page.locator('.bottom-nav button[aria-current="page"]').count();
   if(['home','library','endgame','radar','themes'].includes(view))
    assert.equal(current,1,'Current mobile nav not indicated on '+view+' at '+width);
  }
  await page.evaluate(()=>window.route('home'));
  const mobile=width<1024;
  const nav=await page.evaluate(()=>getComputedStyle(document.getElementById('bottomNav')).display);
  assert.equal(nav!=='none',mobile,'Mobile/desktop navigation mismatch @ '+width);
  if(mobile){
   const boxes=await page.locator('.mast-actions .i-btn').evaluateAll(els=>
    els.map(e=>{const r=e.getBoundingClientRect();return {w:r.width,h:r.height}}));
   assert.ok(boxes.every(b=>b.w>=39&&b.h>=39),'Header controls too small @ '+width+': '+JSON.stringify(boxes));
  }
  const toggle=page.locator('.mast-actions .i-btn[title="Abrir menu"]');
  await toggle.click();
  await page.locator('#floatMenu .floating-panel').waitFor();
  assert.equal(await toggle.getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Escape');
  await page.locator('#floatMenu .floating-panel').waitFor({state:'detached'});
  assert.equal(await toggle.getAttribute('aria-expanded'),'false');
  await page.keyboard.press('Tab');
  assert.ok(await page.locator('.nx-skip').count());
  await page.evaluate(()=>window.openProfile('1512'));
  await page.locator('.v06-profile').waitFor();
  await readWidths();
  assert.ok(await page.locator('.v06-profile .v06-tabs[aria-label]').count()>0,
   'Profile tabs missing accessibility label');
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03')).characters['1512'].pv),6284,
   'UI redesign must not modify saved account');
  if([320,390,768,1440,1920].includes(width))
   await page.screenshot({path:'artifacts/phase4-profile-'+width+'.png',fullPage:false});
  console.log('PASS phase4 '+width+'px: 9 routes, no page overflow, keyboard menu, accessibility, account intact');
  await context.close();
 }
}finally{await browser.close()}
