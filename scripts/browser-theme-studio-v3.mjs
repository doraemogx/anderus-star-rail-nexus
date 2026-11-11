#!/usr/bin/env node
/* Full Chromium regression for Studio GPT on ORIGINAL Nexus, not /v2/. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const id='aha-bespoke-ci';
const manifest={
 schema:3,id,name:'Aha · Lab de testes',characterId:'future-aha',version:'1.0',
 description:'Identidade real gerada no repositório para teste de navegação',
 shape:'theatre',font:'Cinzel',hasStyles:true,createdAt:'2026-11-11',
 tokens:{accent:'#f0d1b0',second:'#e3a3c0',background:'#1a1128',
  surface:'#35233d',text:'#fff0e8',muted:'#c4b6ce'},
 screens:Object.fromEntries(['home','library','profile','endgame','farm','radar','tier','themes','nexia','settings']
  .map(x=>[x,{eyebrow:'ATO '+x,headline:'Nexus de Aha',accent:'Universo teatral'}]))
};
const fixtures={characters:{'1512':{level:80,e:1,s:5,cone:'A Próxima Página da História',
 pv:6284,atk:1659,def:1044,spd:138}},profile:'1512',theme:'8001',
 v06RelicDetails:{'1512':[{setId:'127',level:15,main:{stat:'PV',value:705},subs:[{stat:'PV %',value:8.6}]}]}};
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
await mkdir('artifacts',{recursive:true});
try{
 for(const width of [320,390,768,1440]){
  const ctx=await browser.newContext({viewport:{width,height:width<600?844:920},
   isMobile:width<600,hasTouch:width<600,serviceWorkers:'block'});
  await ctx.addInitScript(data=>{
   if(!localStorage.getItem('anderus_nexus_v03'))
    localStorage.setItem('anderus_nexus_v03',JSON.stringify(data));
  },fixtures);
  await ctx.route('**/themes/generated/index.json',route=>route.fulfill({
   status:200,contentType:'application/json',body:JSON.stringify({schema:1,themes:[{id}]}),
  }));
  await ctx.route('**/themes/generated/'+id+'/theme.json',route=>route.fulfill({
   status:200,contentType:'application/json',body:JSON.stringify(manifest),
  }));
  await ctx.route('**/themes/generated/'+id+'/theme.css',route=>route.fulfill({
   status:200,contentType:'text/css',body:'.app[data-nx3-theme="'+id+'"]{--nx3-test-proven:true;}',
  }));
  await ctx.route('https://nexia-ai-nexus.andrediascrm.workers.dev/**',route=>
   route.fulfill({status:503,headers:{'Access-Control-Allow-Origin':'*'},body:'{"error":"test offline"}'}));
  const page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8787/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>window.NexusThemeStudio3?.version==='3.0'&&
   typeof window.route==='function'&&
   document.querySelector('.app.v06-app'),null,{timeout:30000});
  await page.evaluate(()=>window.route('themes'));
  await page.locator('.nx3-studio').waitFor({timeout:20000});
  await page.locator('.nx3-heading').waitFor();
  assert.equal(await page.locator('.nx3-studio').count(),1);
  assert.ok(await page.locator('.v06-themes').isHidden(),'Old fake presets must be hidden');
  const before=await page.evaluate(()=>localStorage.getItem('anderus_nexus_v03'));
  await page.locator('button[data-action="filter"][data-id="featured"]').click();
  await page.locator('button[data-action="choose"][data-id="future-aha"]').click();
  assert.match(await page.locator('.nx3-identity-body h2').innerText(),/Aha/);
  const prompt=await page.evaluate(()=>NexusThemeStudio3.getPrompt());
  assert.match(prompt,/themes\/generated/);
  assert.match(prompt,/E1–E6/);
  assert.match(prompt,/mobile/i);
  assert.match(prompt,/Endgame/);
  assert.match(prompt,/Nexus ORIGINAL/);
  assert.equal(await page.evaluate(()=>localStorage.getItem('anderus_nexus_v03')),before);
  if(width===390||width===1440)
   await page.screenshot({path:'artifacts/studio3-create-'+width+'.png',fullPage:false});
  await page.locator('button[data-action="tab"][data-id="library"]').click();
  await page.locator('.nx3-library-card').waitFor();
  assert.equal(await page.locator('.nx3-library-card').count(),1,'Registry only lists actually published styles');
  assert.equal(await page.locator('.nx3-library-card').innerText().then(s=>s.includes('Aha · Lab de testes')),true);
  await page.locator('button[data-action="preview"][data-id="'+id+'"]').click();
  await page.locator('.nx3-mock').waitFor();
  await page.locator('button[data-action="device"][data-id="desktop"]').click();
  assert.equal(await page.locator('.nx3-mock.wide').count(),1);
  await page.locator('button[data-action="screen"][data-id="profile"]').click();
  assert.equal(await page.locator('.nx3-mock-eido span').count(),6);
  if(width===390||width===1440)
   await page.screenshot({path:'artifacts/studio3-preview-'+width+'.png',fullPage:false});
  await page.locator('button[data-action="immersive"][data-id="'+id+'"]').click();
  await page.locator('#nx3-trybar').waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('anderus_theme_studio_generated_v3')),null,
   'Live preview must not persist');
  assert.equal(await page.evaluate(()=>localStorage.getItem('anderus_nexus_v03')),before,
   'Live preview must not mutate account');
  await page.locator('.nx3-try-cancel').click();
  assert.equal(await page.locator('#nx3-trybar').count(),0);
  await page.evaluate(()=>window.route('themes'));
  await page.locator('button[data-action="tab"][data-id="library"]').click();
  await page.locator('button[data-action="apply"][data-id="'+id+'"]').click();
  await page.waitForFunction(id=>document.querySelector('.app')?.dataset.nx3Theme===id,id);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_theme_studio_generated_v3')).active),id);
  assert.equal(await page.evaluate(()=>localStorage.getItem('anderus_nexus_v03')),before);
  await page.evaluate(()=>window.route('profile'));
  await page.locator('.v06-profile').waitFor();
  const eido=await page.evaluate(()=>{
   try{tab='eidolons';refresh();return document.querySelectorAll('.v10-eido-grid button').length;}
   catch(e){return -1;}
  });
  assert.ok(eido>=6,'Original six Eidolon cards must be preserved: '+eido);
  const geometry=await page.evaluate(()=>({w:document.documentElement.scrollWidth,v:innerWidth}));
  assert.ok(geometry.w<=geometry.v+4,'Overflow at '+width+': '+JSON.stringify(geometry));
  assert.equal(errors.length,0,'JS errors at '+width+': '+errors.join('; '));
  console.log('PASS Theme Studio 3 '+width+'px: generator, canonical Aha, library, full previews, immersive cancel, applied skin, unchanged account/Eidolons');
  await ctx.close();
 }
}finally{await browser.close();}
