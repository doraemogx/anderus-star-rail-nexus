#!/usr/bin/env node
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const initial={characters:{
  '1001':{level:80,e:2,s:1,pv:7300,atk:1980,def:1000,spd:142,cone:'Teste de cone'},
  '1002':{level:80,e:0,s:1,pv:4000,atk:2100,def:800,spd:135}
 },profile:'1001',theme:'8001',v06RelicDetails:{'1001':[{
  setId:'101',level:15,main:{stat:'PV',value:705},subs:[{stat:'VEL',value:6}]
 }]}};
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
await mkdir('artifacts',{recursive:true});
try{
 for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:width<600?852:920},
   isMobile:width<600,hasTouch:width<600,serviceWorkers:'block'});
  await context.addInitScript(src=>{
    localStorage.setItem('anderus_nexus_v03',JSON.stringify(src));
  },initial);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('dialog',async d=>{if(d.type()==='prompt')await d.accept(d.message().includes('Local')?'Estação Espacial':'Evoluir personagem');else await d.accept();});
  await page.goto('http://127.0.0.1:8787/v2/',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.N2?.ready===true&&
    document.querySelector('.bottom-nav button')&&
    document.querySelector('#page-home .n2-priority-list'),null,{timeout:30000});
  const legacy=await page.evaluate(()=>localStorage.getItem('anderus_nexus_v03'));
  assert.equal(await page.locator('.n2-home-hero').count(),1);
  for(const route of ['home','account','character','scan','plan','endgame','speed','atlas','relics','warp','radar','pompom','themes','settings']){
   await page.evaluate(route=>N2.navigate(route),route);
   await page.waitForTimeout(110);
   const state=await page.evaluate(()=>({w:document.documentElement.scrollWidth,v:innerWidth,
    content:!!document.querySelector('.page.active')?.firstElementChild}));
   assert.ok(state.content,'Empty '+route+' at '+width);
   assert.ok(state.w<=state.v+5,'Horizontal overflow '+route+' @'+width+': '+JSON.stringify(state));
   assert.equal(errors.length,0,'Javascript errors '+route+' @'+width+': '+errors.join(' | '));
   if((width===390||width===1440)&&['home','account','character','plan','endgame','themes','speed'].includes(route))
    await page.screenshot({path:'artifacts/nexus2-'+route+'-'+width+'.png',fullPage:false});
  }
  await page.evaluate(()=>N2.navigate('character'));
  await page.locator('.n2-profile-cover').waitFor();
  await page.evaluate(()=>N2.openCharacterEditor());
  await page.locator('[data-char-field="pv"]').fill('7450');
  await page.getByRole('button',{name:'Salvar ficha'}).click();
  assert.equal(await page.evaluate(()=>N2.character('1001').pv),7450);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03')).characters['1001'].pv),7300,
   'Legacy records must never be overwritten');
  await page.evaluate(()=>N2.addGoal());
  assert.equal(await page.evaluate(()=>N2.data.goals.length),1);
  await page.evaluate(()=>N2.navigate('plan'));
  assert.ok((await page.locator('#page-plan').innerText()).includes('Evoluir personagem'));
  await page.evaluate(()=>N2.navigate('warp'));
  await page.locator('#n2-pity').fill('50');
  await page.locator('#n2-shots').fill('100');
  assert.equal(await page.evaluate(()=>N2.data.warp.pity),50);
  await page.evaluate(()=>N2.navigate('atlas'));
  await page.evaluate(()=>N2.addAchievement());
  assert.equal(await page.evaluate(()=>Object.keys(N2.data.achievements).length),1);
  await page.evaluate(()=>N2.navigate('themes'));
  await page.locator('#n2-theme-picker button').first().click();
  assert.ok((await page.locator('#n2-theme-prompt').innerText()).includes('14 telas'));
  const manifest={name:'Identidade de teste',character:'7 de Março',characterId:'1001',
   accent:'#e5b499',background:'#101524',surface:'#202b3e',text:'#f7f5f2',secondary:'#bbc5d6',font:'Cinzel'};
  await page.locator('#page-themes input[type=file]').setInputFiles({name:'theme.json',
    mimeType:'application/json',buffer:Buffer.from(JSON.stringify(manifest))});
  await page.waitForFunction(()=>N2.data.themes.length===1&&N2.data.activeTheme===0);
  assert.ok(await page.locator('.app.n2-user-theme').count()===1);
  assert.equal(await page.evaluate(()=>localStorage.getItem('anderus_nexus_v03')),legacy);
  await page.evaluate(()=>N2.navigate('settings'));
  assert.equal(errors.length,0,errors.join(' | '));
  console.log('PASS Nexus 2.0 '+width+'px: 14 routes, live catalog, local account, editing, goals, warp, atlas, theme import, legacy safe');
  await context.close();
 }
}finally{await browser.close();}
