#!/usr/bin/env node
/** Pearl Atlas: original Nexus, true registered manifest, all ten routes.
 * Screenshots at 390/1440 and geometry at 320/360/390/430/768/1024/1440/1920.
 * Never sends account records to an external service. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const id='pearl-ocean-atlas';
const routes=['home','library','profile','endgame','farm','radar','tier','themes','nexia','settings'];
const widths=[320,360,390,430,768,1024,1440,1920];
const fixture={characters:{'1503':{level:80,e:2,s:1,cone:'Colors for Tomorrow',pv:4500,def:2800,spd:145},
 '1512':{level:80,e:1,s:1,pv:6200}},profile:'1503',theme:'8001',
 v06RelicDetails:{'1503':[
  {setId:'127',level:15,main:{stat:'PV',value:705},subs:[{stat:'DEF %',value:12.3}]},
  {setId:'127',level:15,main:{stat:'ATQ',value:352},subs:[{stat:'VEL',value:5}]},
  {setId:'127',level:15,main:{stat:'DEF %',value:54},subs:[{stat:'PV %',value:8.6}]},
  {setId:'127',level:15,main:{stat:'DEF %',value:54},subs:[{stat:'VEL',value:8}]},
  {setId:'127',level:15,main:{stat:'DEF %',value:54},subs:[{stat:'RES',value:4}]},
  {setId:'127',level:15,main:{stat:'REGEN',value:19.4},subs:[{stat:'DEF %',value:7.8}]}
 ]}};
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
await mkdir('artifacts',{recursive:true});
const issues=[];
try{
 for(const width of widths){
  const ctx=await browser.newContext({viewport:{width,height:width<=430?844:920},
   isMobile:width<=430,hasTouch:width<=430,serviceWorkers:'block'});
  await ctx.addInitScript(data=>{
   if(!localStorage.getItem('anderus_nexus_v03'))
    localStorage.setItem('anderus_nexus_v03',JSON.stringify(data));
  },fixture);
  const page=await ctx.newPage(),pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(error.message));
  await page.goto('http://127.0.0.1:8787/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.NexusThemeStudio3?.version==='3.0'
    &&document.querySelector('.app.v06-app')&&typeof window.route==='function',null,{timeout:30000});
  await page.evaluate(()=>window.route('themes'));
  await page.locator('.nx3-studio').waitFor({timeout:15000});
  await page.locator('button[data-action="tab"][data-id="library"]').click();
  await page.locator('button[data-action="apply"][data-id="'+id+'"]').waitFor({timeout:20000});
  const before=await page.evaluate(()=>localStorage.getItem('anderus_nexus_v03'));
  const registered=await page.evaluate(()=>NexusThemeStudio3.generated().map(x=>x.id));
  assert.ok(registered.includes(id),'Actual published Pearl identity must load');
  await page.locator('button[data-action="preview"][data-id="'+id+'"]').click();
  await page.locator('button[data-action="immersive"][data-id="'+id+'"]').click();
  await page.locator('.nx3-try-cancel').click();
  const restoredCaption=await page.evaluate(()=>document.querySelector('.v06-home .v06-hero-id')?.textContent||'');
  assert.ok(!restoredCaption.includes('IDENTIDADE VISUAL'),'Cancelled preview did not restore original caption');
  assert.equal(await page.evaluate(()=>localStorage.getItem('anderus_nexus_v03')),before,'Preview mutated account');
  await page.evaluate(()=>window.route('themes'));
  await page.locator('button[data-action="tab"][data-id="library"]').click();
  await page.locator('button[data-action="apply"][data-id="'+id+'"]').click();
  await page.waitForFunction(id=>document.querySelector('.app')?.dataset.nx3Theme===id,id);
  await page.waitForFunction(()=>[...document.styleSheets].some(s=>s.href?.includes('pearl-ocean-atlas/theme.css')),{timeout:15000}).catch(()=>{});
  const loaded=await page.evaluate(()=>!![...document.styleSheets].find(s=>s.href?.includes('pearl-ocean-atlas/theme.css')));
  assert.ok(loaded,'Pearl CSS did not load');
  for(const r of routes){
   await page.evaluate(name=>window.route(name),r);
   await page.waitForTimeout(100);
   const geom=await page.evaluate(()=>({
    page:document.documentElement.scrollWidth,
    app:document.querySelector('.app')?.scrollWidth,
    viewport:innerWidth,
    path:document.querySelector('.app')?.dataset.nxRoute,
    applied:document.querySelector('.app')?.dataset.nx3Theme,
    // The root app intentionally keeps its historic default character,
    // but the generated Pearl theme must override the legacy Home art.
    homeArt:document.querySelector('.v06-home .v06-hero-art')
      ? getComputedStyle(document.querySelector('.v06-home .v06-hero-art')).backgroundImage : '',
    pearlArt:getComputedStyle(document.querySelector('.app')).getPropertyValue('--nx3-art'),
    homeCaption:document.querySelector('.v06-home .v06-hero-id')?.textContent||''
   }));
   if(r==='home'){
    if(!geom.homeArt||geom.homeArt==='none'||!geom.homeArt.includes('1503'))
      issues.push(width+'px: Home still displays legacy art: '+geom.homeArt.slice(0,150));
    if(!geom.homeCaption.includes('PEARL'))issues.push(width+'px: Home caption does not identify Pearl');
   }
   if(geom.page>geom.viewport+4)issues.push(width+'px/'+r+': horizontal overflow '+JSON.stringify(geom));
   if(geom.applied!==id)issues.push(width+'px/'+r+': theme lost');
   if(width===390||width===1440){
    await page.screenshot({path:'artifacts/pearl-'+width+'-'+r+'.png',fullPage:false,animations:'disabled'});
   }
  }
  await page.evaluate(()=>window.route('profile'));
  const pearlEidolons=await page.evaluate(async()=>{
   // The profile defaults to Overview; real E1–E6 cards live in Eidolons.
   tab='eidolons';refresh();
   const response=await fetch('./data/eidolon-art.json',{cache:'no-store'});
   const json=await response.json();
   return {
    references:json.characters?.['1503']||[],
    cards:document.querySelectorAll('.v10-eido-grid button').length,
    illustrations:document.querySelectorAll('.v10-eido-grid img').length
   };
  });
  if(pearlEidolons.references.length!==6||pearlEidolons.cards<6||pearlEidolons.illustrations<6)
   issues.push(width+'px: Pearl Eidolons missing '+JSON.stringify({
    references:pearlEidolons.references.length,
    cards:pearlEidolons.cards,images:pearlEidolons.illustrations
   }));
  const records=await page.evaluate(()=>localStorage.getItem('anderus_nexus_v03'));
  assert.equal(records,before,'Applying Pearl theme changed saved character data at '+width);
  assert.equal(pageErrors.length,0,'JS errors at '+width+': '+pageErrors.join('; '));
  console.log('PASS Pearl Atlas '+width+'px: registry/preview/cancel/apply/10 routes/account');
  await ctx.close();
 }
 assert.deepEqual(issues,[],'Responsive audit problems: '+issues.join('\n'));
}finally{await browser.close();}
