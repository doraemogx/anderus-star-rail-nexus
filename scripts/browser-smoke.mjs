#!/usr/bin/env node
/* Real Chromium E2E smoke: 390px phone + 1440px desktop. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const cases=[
 {width:390,height:844,isMobile:true,hasTouch:true},
 {width:1440,height:900,isMobile:false,hasTouch:false}
];
const fixture={
 characters:{'1512':{level:80,e:1,s:5,cone:'A Próxima Página da História',
   pv:6284,atk:1659,def:1044,spd:138,crit:31.3,cdmg:127.1,break:15.5,energy:124.4},
  '1505':{level:80,e:6,s:1},'1503':{level:80,e:2,s:1},'1309':{level:80,e:0,s:1}},
 profile:'1512',
 v06RelicDetails:{'1512':[
  {setId:'127',level:15,main:{stat:'PV',value:705},subs:[{stat:'PV %',value:8.6},{stat:'VEL',value:4},{stat:'Taxa de Acerto de Efeito',value:11.6},{stat:'ATQ %',value:3.4}]},
  {setId:'127',level:15,main:{stat:'ATQ',value:352},subs:[{stat:'PV %',value:7.7},{stat:'ATQ %',value:12.9},{stat:'Chance de CRIT',value:2.5},{stat:'RES a Efeito',value:7.3}]},
  {setId:'127',level:15,main:{stat:'Dano CRIT',value:4.8},subs:[{stat:'DEF',value:38},{stat:'PV %',value:14.6},{stat:'Efeito de Quebra',value:5.1},{stat:'Chance de CRIT',value:3.2}]},
  {setId:'127',level:15,main:{stat:'VEL',value:25},subs:[{stat:'DEF',value:33},{stat:'PV %',value:8.2},{stat:'ATQ %',value:12},{stat:'Dano CRIT',value:12.3}]},
  {setId:'308',level:15,main:{stat:'PV %',value:43.2},subs:[{stat:'ATQ',value:57},{stat:'Chance de CRIT',value:5.8},{stat:'RES a Efeito',value:7.3},{stat:'PV',value:42}]},
  {setId:'308',level:15,main:{stat:'Regeneração de Energia',value:19.4},subs:[{stat:'PV',value:33},{stat:'DEF %',value:10.2},{stat:'Efeito de Quebra',value:10.3},{stat:'PV %',value:10.8}]}
 ]}
};
const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage','--no-sandbox']});
await mkdir('artifacts',{recursive:true});
let failures=0;
try{
 for(const device of cases){
  const context=await browser.newContext({viewport:{width:device.width,height:device.height},isMobile:device.isMobile,hasTouch:device.hasTouch,deviceScaleFactor:1});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(data=>{
    if(!localStorage.getItem('anderus_nexus_v03'))
      localStorage.setItem('anderus_nexus_v03',JSON.stringify(data));
  },fixture);
  await page.goto('http://127.0.0.1:8787/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>typeof window.openProfile==='function'&&typeof window.v11ProfileTab==='function'&&!!document.getElementById('stage'),null,{timeout:20000}).catch(async error=>{
    const dom=await page.evaluate(()=>({ready:document.readyState,stage:!!document.querySelector('#stage'),app:!!document.querySelector('.app'),ids:[...document.querySelectorAll('[id]')].slice(0,80).map(e=>e.id),bodyTail:document.body?.innerHTML?.slice(-800)}));
    console.error('BROWSER_STAGE_DEBUG',JSON.stringify(dom));
    throw error;
  });
  // Search canonical catalogue and verify a playable character result.
  await page.locator('#nexus-search-button').waitFor({timeout:15000});
  await page.locator('#nexus-search-button').click();
  await page.locator('#nexus-search-dialog[open]').waitFor({timeout:15000});
  await page.locator('#nexus-search-input').fill('Robin');
  await page.locator('.nexus-search-hit[data-search-type="character"]').first().waitFor({timeout:15000});
  assert.ok(await page.locator('.nexus-search-hit[data-search-type="character"]').count()>0);
  await page.locator('#nexus-search-dialog [data-search-close]').click();
  // Exercise all top-level routes before opening the imported character.
  for(const view of ['home','library','endgame','farm','radar','themes','nexia','settings']){
    const before=errors.length;
    await page.evaluate(view=>window.route(view),view);
    const rendered=await page.evaluate(()=>Boolean(document.getElementById('stage')?.firstElementChild));
    assert.ok(rendered,'Blank stage after navigating to '+view);
    assert.equal(errors.length,before,'JavaScript exception while navigating to '+view+': '+errors.slice(before).join(' | '));
  }
  await page.evaluate(()=>window.openProfile('1512'));
  await page.locator('.v06-profile').waitFor({timeout:15000});
  await page.waitForFunction(()=>Boolean(document.querySelector('.v11-coach-note')),null,{timeout:30000});
  const coachText=await page.locator('.v11-coach').innerText();
  assert.match(coachText,/Portador da Reconstrução do Mundo/);
  assert.match(coachText,/Vonwacq Vivaz/);
  assert.match(coachText,/S5/);
  const ovButtons=await page.locator('.v06-profile-controls button').count();
  assert.equal(ovButtons,2,'Overview must have one Edit and one Import control');
  const tab=key=>page.locator('.v06-tabs button').filter({hasText:key}).first();
  await tab('Equipes').click();
  await page.locator('[data-nexus-team-lab]').click();
  await page.locator('#nexus-team-dialog[open]').waitFor({timeout:15000});
  const picks=['1512','1505','1503','1309'];
  for(let i=0;i<4;i++)await page.locator('#teamlab-slot-'+i).selectOption(picks[i]);
  await page.locator('#teamlab-name').fill('Equipe de teste');
  await page.locator('#nexus-team-dialog [data-team-save]').click();
  await page.waitForFunction(()=>{
    const data=JSON.parse(localStorage.getItem('anderus_nexus_v03')||'null');
    return data?.v06SavedTeams?.some(t=>t.name==='Equipe de teste'&&t.members.length===4);
  },null,{timeout:12000});
  await page.screenshot({path:'artifacts/team-lab-'+device.width+'.png'});
  const teamRect=await page.locator('#nexus-team-dialog').boundingBox();
  assert.ok(teamRect?.width<=device.width+2,'Team Lab wider than viewport');
  await page.locator('#nexus-team-dialog [data-team-close]').click();
  await tab('Kit Lab 2.0').click();
  await page.locator('[data-nexus-kit-for="1512"]').click();
  await page.locator('#nexus-kit-dialog[open]').waitFor({timeout:15000});
  await page.locator('#nexus-kit-content .kit-skill').first().waitFor({timeout:30000});
  assert.ok(await page.locator('#nexus-kit-content .kit-skill').count()>=4,'Complete abilities absent from Kit Lab');
  await page.locator('[data-kit-tab="ranks"]').click();
  assert.equal(await page.locator('.kit-rank').count(),6,'Kit Lab must display six Eidolons');
  await page.locator('[data-kit-summary]').click();
  assert.match(await page.locator('.kit-summary').innerText(),/Pom-Pom|Passageiro/);
  await page.screenshot({path:'artifacts/kit-lab-'+device.width+'.png'});
  const kitRect=await page.locator('#nexus-kit-dialog').boundingBox();
  assert.ok(kitRect?.width<=device.width+2,'Kit Lab wider than viewport');
  await page.locator('.kit-close').click();
  await tab('Cone de Luz').click();
  await page.waitForFunction(()=>document.querySelector('.v11-cone-effect')?.textContent?.includes('32%'),null,{timeout:15000});
  assert.match(await page.locator('.v11-cone-panel').innerText(),/24%/);
  const sizeCone=await page.locator('.v11-cone-panel').boundingBox();
  assert.ok(sizeCone?.width>150);
  await tab('Relíquias').click();
  await page.locator('.v11-relic-card').first().waitFor({timeout:15000});
  assert.equal(await page.locator('.v11-relic-card').count(),6);
  assert.match(await page.locator('.v11-relic-card').nth(2).innerText(),/4,8/,'Uncertain +15 OCR value must remain unchanged until confirmed');
  assert.match(await page.locator('.v11-relic-card').first().innerText(),/Portador da Reconstrução do Mundo/);
  assert.match(await page.locator('.v11-relic-card').nth(5).innerText(),/Vonwacq Vivaz/);
  const body=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert.ok(body.scrollWidth<=body.width+4,'Viewport has unexpected horizontal overflow: '+JSON.stringify(body));
  const rect=await page.locator('.v11-relic-open').first().boundingBox();
  assert.ok(rect?.height>=44,'Equipment touch target below 44px');
  await page.screenshot({path:'artifacts/account-'+device.width+'.png',fullPage:true});
  await page.locator('.v11-relic-open').first().click();
  await page.locator('.v11-edit-form').waitFor({timeout:15000});
  assert.equal(await page.locator('.v11-edit-form select[name="set"]').inputValue(),'127');
  await page.locator('.v11-edit-form input[name="value0"]').fill('9,1');
  await page.locator('.v11-edit-form button[type="submit"]').click();
  await page.waitForFunction(()=>{
    const state=JSON.parse(localStorage.getItem('anderus_nexus_v03')||'null');
    return state?.v06RelicDetails?.['1512']?.[0]?.subs?.[0]?.value===9.1;
  },null,{timeout:12000});
  await page.reload({waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>typeof window.openProfile==='function'&&typeof window.v11ProfileTab==='function'&&!!document.getElementById('stage'),null,{timeout:30000});
  await page.evaluate(()=>window.openProfile('1512'));
  await tab('Relíquias').click();
  await page.locator('.v11-relic-card').first().waitFor({timeout:15000});
  assert.match(await page.locator('.v11-relic-card').first().innerText(),/9,1%/,'Edited stat survives reload');
  await tab('Histórico').click();
  await page.locator('.v11-history-entry').first().waitFor({timeout:10000});
  assert.ok(await page.locator('.v11-history-entry').count()>0,'Build History must preserve old versions');
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('.v11-history-entry button[data-restore-build]').first().click();
  await page.waitForFunction(()=>{
    const data=JSON.parse(localStorage.getItem('anderus_nexus_v03')||'null');
    return data?.v06RelicDetails?.['1512']?.[0]?.subs?.[0]?.value===8.6;
  },null,{timeout:12000});
  if(errors.length)console.warn('BROWSER_WARN',device.width,errors.slice(0,8));
  console.log('PASS Chromium',device.width,'px: six saved relics, E1S5 cone, Pom-Pom, persistence, layout, edit flow');
  await context.close();
 }
}catch(error){failures++;console.error('BROWSER_SMOKE_FAIL',error.stack||String(error))}
finally{await browser.close();}
if(failures)process.exit(1);
