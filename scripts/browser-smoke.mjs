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
  // Real update inbox must disclose the source and show a read state.
  await page.locator('#nexus-notifications-button').waitFor({timeout:15000});
  await page.locator('#nexus-notifications-button').click();
  await page.locator('#nexus-notice-dialog[open]').waitFor({timeout:15000});
  await page.locator('#nexus-notice-list .nexus-notice-item').first().waitFor({timeout:15000});
  assert.match(await page.locator('#nexus-notice-list').innerText(),/NÃO CONFIRMADO/);
  await page.locator('#nexus-notice-dialog [data-notice-read]').click();
  assert.equal(await page.locator('#nexus-notice-list .nexus-notice-unread').count(),0);
  await page.screenshot({path:'artifacts/notifications-'+device.width+'.png'});
  await page.locator('#nexus-notice-dialog [data-notice-close]').click();
  // Top navigation: one search action, and no diagnostic overlay over bottom tabs.
  assert.equal(await page.locator('#nexus-search-button').count(),1);
  assert.equal(await page.locator('#nexus-diagnostics-button').count(),1);
  const controls=await page.evaluate(()=>{
    const search=document.querySelector('#nexus-search-button')?.getBoundingClientRect();
    const diag=document.querySelector('#nexus-diagnostics-button')?.getBoundingClientRect();
    const nav=document.querySelector('.bottom-nav')?.getBoundingClientRect();
    return {searchRight:search?.right,diagRight:diag?.right,diagBottom:diag?.bottom,navTop:nav?.top,width:innerWidth};
  });
  assert.ok(controls.searchRight<=device.width+2,'Search control clipped at '+device.width);
  assert.ok(controls.diagRight<=device.width+2,'Diagnostics clipped at '+device.width);
  assert.ok(!controls.navTop || controls.diagBottom<controls.navTop,'Diagnostics overlaps mobile navigation');
  // Verify the Warp calculator is functional, not merely a static panel.
  await page.waitForFunction(()=>typeof window.NexusWarpAdvisor?.open==='function',null,{timeout:15000});
  await page.evaluate(()=>window.NexusWarpAdvisor.open());
  await page.locator('#nexus-warp-dialog[open]').waitFor({timeout:10000});
  await page.evaluate(()=>{
    const set=(key,value)=>{
      const input=document.querySelector('[data-warp-key="'+key+'"]');
      input.value=String(value);
      input.dispatchEvent(new Event('change',{bubbles:true}));
    };
    set('passes',100);set('charPulls',90);set('coneCopies',0);
  });
  assert.match(await page.locator('#nexus-warp-result').innerText(),/100/,'Warp resources did not recalculate');
  const storedWarp=await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03')||'{}').v06WarpPlan);
  assert.equal(storedWarp?.passes,100,'Warp plan must survive in account backup state');
  await page.screenshot({path:'artifacts/warp-'+device.width+'.png'});
  await page.locator('#nexus-warp-dialog [data-warp-close]').click();
  // Full-screen dialogs must inherit theme changes from the application shell.
  await page.waitForFunction(()=>typeof window.NexusThemeBridge?.apply==='function',null,{timeout:15000});
  const themeState=await page.evaluate(()=>{
    const app=document.querySelector('.app');
    const previous=app.classList.contains('aha-theatre');
    app.classList.add('aha-theatre');
    window.NexusThemeBridge.apply();
    const active=document.documentElement.classList.contains('nexus-theme-aeon');
    if(!previous)app.classList.remove('aha-theatre');
    window.NexusThemeBridge.apply();
    return {active,restored:document.documentElement.classList.contains('nexus-theme-aeon')===previous};
  });
  assert.ok(themeState.active&&themeState.restored,'Aha theme not propagated to dialogs safely');
  // Real visual validation of the selectable Aha Grand Theatre, not merely its CSS class.
  await page.evaluate(async()=>{
    const app=document.querySelector('.app');
    app.dataset.qaHadAha=app.classList.contains('aha-theatre')?'1':'0';
    app.classList.add('aha-theatre');
    window.NexusThemeBridge.apply();
    await window.NexusPomPom.open('1512');
  });
  await page.locator('#nexus-pompom-dialog[open]').waitFor({timeout:15000});
  const ahaTheme=await page.locator('#nexus-pompom-dialog').evaluate(el=>({
    background:getComputedStyle(el).backgroundColor,
    active:document.documentElement.classList.contains('nexus-theme-aeon')
  }));
  assert.ok(ahaTheme.active,'Aha theme must reach the Pom-Pom dialog');
  assert.match(ahaTheme.background,/33, 21, 43|33,21,43/,'Aha modal must use theatrical background');
  await page.screenshot({path:'artifacts/aha-pompom-'+device.width+'.png'});
  await page.locator('#nexus-pompom-dialog [data-pompom-close]').click();
  await page.evaluate(()=>{
    const app=document.querySelector('.app');
    if(app.dataset.qaHadAha==='0')app.classList.remove('aha-theatre');
    delete app.dataset.qaHadAha;
    window.NexusThemeBridge.apply();
  });
  // Account transfer controls should be reachable and show an actual export action.
  await page.locator('#nexus-diagnostics-button').waitFor({timeout:15000});
  await page.locator('#nexus-diagnostics-button').click();
  await page.locator('#nexus-diag-backup').click();
  await page.locator('#nexus-backup-dialog[open]').waitFor({timeout:15000});
  assert.ok(await page.locator('#nexus-backup-dialog [data-backup-export]').isEnabled());
  await page.screenshot({path:'artifacts/nexus-backup-'+device.width+'.png'});
  await page.locator('#nexus-backup-dialog [data-backup-close]').click();
  await page.locator('#nexus-diag-close').click();
  // Search canonical catalogue and verify a playable character result.
  await page.locator('#nexus-search-button').waitFor({timeout:15000});
  await page.locator('#nexus-search-button').click();
  await page.locator('#nexus-search-dialog[open]').waitFor({timeout:15000});
  await page.locator('#nexus-search-input').fill('Robin');
  await page.locator('.nexus-search-hit[data-search-type="character"]').first().waitFor({timeout:15000});
  assert.ok(await page.locator('.nexus-search-hit[data-search-type="character"]').count()>0);
  await page.locator('#nexus-search-input').fill('March 7th');
  await page.locator('.nexus-search-hit[data-search-type="character"][data-search-id="1001"]').waitFor({timeout:15000});
  await page.locator('#nexus-search-input').fill('Broto Queimado');
  await page.locator('[data-search-category="material"]').click();
  await page.locator('.nexus-search-hit[data-search-type="material"]').first().waitFor({timeout:15000});
  assert.match(await page.locator('.nexus-search-hit[data-search-type="material"]').first().innerText(),/Broto/);
  await page.locator('#nexus-search-dialog [data-search-close]').click();
  // Simulated unsupported 400x400 screenshot: manual entry must remain functional.
  await page.waitForFunction(()=>typeof window.NexusScanInput?.handle==='function');
  await page.evaluate(()=>window.v06StartImport());
  await page.locator('#v06-file').waitFor({timeout:10000});
  await page.evaluate(async()=>{
    const canvas=document.createElement('canvas');
    canvas.width=400;canvas.height=400;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#091525';ctx.fillRect(0,0,400,400);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    const file=new File([blob],'layout-desconhecido.png',{type:'image/png'});
    if(!window.NexusScanInput.handle(file,'teste de regressão'))throw new Error('NexusScanInput recusou PNG válido');
  });
  await page.locator('.v06-import-form').waitFor({timeout:15000});
  await page.locator('.v06-relcard').first().waitFor({timeout:15000});
  assert.equal(await page.locator('.v06-piece-grid figure').count(),0,'Unknown screenshot must not show fabricated relic crops');
  assert.equal(await page.locator('#v06-level').inputValue(),'','Unknown character level must not default to 80');
  assert.equal(await page.locator('.v06-relcard').count(),6,'Manual six-slot editor missing for unknown screenshot');
  await page.evaluate(async()=>{
    const canvas=document.createElement('canvas');canvas.width=600;canvas.height=850;
    canvas.getContext('2d').fillRect(0,0,600,850);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
    const dt=new DataTransfer();dt.items.add(new File([blob],'pedaço-1.png',{type:'image/png'}));
    const input=document.querySelector('#v06-r0-photo');input.files=dt.files;
    input.dispatchEvent(new Event('change',{bubbles:true}));
  });
  await page.locator('.v06-relcard').first().locator('summary img').waitFor({timeout:10000});
  assert.match(await page.locator('.v06-relcard').first().locator('summary small').innerText(),/Print individual anexado/);
  await page.screenshot({path:'artifacts/scan-unsupported-'+device.width+'.png'});
  await page.evaluate(()=>window.closeModal());
  // Unsupported screenshots must still yield six editable relic forms.
  const relicEditor=await page.evaluate(async()=>{
    const el=document.createElement('div');el.id='v06-relic-editor';document.body.append(el);
    const inspector=await import('./relic-inspector.js?v=3');
    await inspector.initializeRelics([]);
    const forms=el.querySelectorAll('.v06-relcard').length;
    const inferredLevel=el.querySelector('#v06-r0-lv')?.value;
    const records=inspector.collectRelics();
    el.remove();
    return {forms,inferredLevel,records};
  });
  assert.equal(relicEditor.forms,6,'Unknown screenshot must still present six relic inputs');
  assert.equal(relicEditor.inferredLevel,'','Missing relic level must not be guessed as +15');
  assert.equal(relicEditor.records[0].level,null,'An unknown relic level is null');
  // Exercise all top-level routes before opening the imported character.
  for(const view of ['home','library','endgame','farm','radar','themes','nexia','settings']){
    const before=errors.length;
    await page.evaluate(view=>window.route(view),view);
    const rendered=await page.evaluate(()=>Boolean(document.getElementById('stage')?.firstElementChild));
    assert.ok(rendered,'Blank stage after navigating to '+view);
    if(view==='themes'){
      const original=await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03')||'{}').theme||'8001');
      await page.evaluate(()=>window.v06PreviewTheme('1512'));
      await page.locator('.v06-theme-preview .v06-theme-compare article').first().waitFor({timeout:10000});
      assert.equal(await page.locator('.v06-theme-preview .v06-theme-compare article').count(),2);
      assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03')||'{}').theme||'8001'),original,
        'Preview must not mutate account theme');
      await page.locator('[data-commit-theme="1512"]').click();
      await page.waitForFunction(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03')||'{}').theme==='1512');
      await page.evaluate(()=>window.v06RestorePreviousTheme());
      await page.waitForFunction(expected=>(JSON.parse(localStorage.getItem('anderus_nexus_v03')||'{}').theme||'8001')===expected,original);
      assert.ok(await page.locator('.v06-themes').count(),'Theme Studio must remain reachable after undo');
    }
    if(view==='endgame'){
      await page.locator('.v09-endgame').first().waitFor({timeout:15000});
      await page.locator('.v20-official-rotation').first().waitFor({timeout:15000});
      assert.match(await page.locator('.v20-official-rotation').innerText(),/ROTAÇÃO OFICIAL CONFIRMADA|REGRAS A VERIFICAR/);
      assert.ok(await page.locator('.v20-official-rotation a[href*="hoyoverse.com"]').count()>0,
        'Official Endgame modifier must link to source');
      await page.locator('.v09-boss-ask').first().click();
      await page.locator('#nexus-pompom-dialog[open]').waitFor({timeout:15000});
      await page.waitForFunction(()=>document.querySelector('#nexus-pompom-dialogue')?.textContent?.includes('Mecânica registrada:'),null,{timeout:15000});
      assert.ok(await page.locator('#nexus-pompom-dialogue .nexus-pompom-source[href^="https://"]').count()>0,
        'Boss context must show a source link');
      await page.screenshot({path:'artifacts/endgame-pompom-'+device.width+'.png'});
      await page.locator('#nexus-pompom-dialog [data-pompom-close]').click();
      await page.screenshot({path:'artifacts/endgame-'+device.width+'.png'});
    }
    assert.equal(errors.length,before,'JavaScript exception while navigating to '+view+': '+errors.slice(before).join(' | '));
  }
  // Contextual Pom-Pom: questions must use registered characters, not static cards.
  await page.evaluate(()=>window.route('nexia'));
  await page.waitForFunction(()=>typeof window.NexusPomPom?.open==='function',null,{timeout:15000});
  await page.locator('.v20-pompom-launch [data-nexus-pompom-open]').click();
  await page.locator('#nexus-pompom-dialog[open]').waitFor({timeout:15000});
  await page.locator('#nexus-pompom-character').selectOption('1512');
  await page.locator('#nexus-pompom-question').fill('Como melhorar minha build?');
  await page.locator('#nexus-pompom-form button[type="submit"]').click();
  await page.locator('.nexus-pompom-turn.reply').first().waitFor({timeout:15000});
  const pompomText=await page.locator('.nexus-pompom-turn.reply').last().innerText();
  assert.match(pompomText,/Robin|relíquias|peças/i);
  await page.screenshot({path:'artifacts/pompom-chat-'+device.width+'.png'});
  await page.locator('#nexus-pompom-dialog [data-pompom-close]').click();
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
  await tab('Ascensão').click();
  await page.locator('[data-nexus-traces-for="1512"]').click();
  await page.locator('#nexus-traces-dialog[open]').waitFor({timeout:15000});
  await page.locator('[data-traces-node="1512001"][data-traces-field="current"]').selectOption('0');
  await page.locator('.nexus-traces-materials .nexus-trace-material').first().waitFor({timeout:15000});
  const tracePlan=await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03')||'{}').v06TracePlans?.['1512']?.['1512001']);
  assert.equal(tracePlan?.current,0,'Trace progress must persist');
  await page.locator('#nexus-traces-dialog [data-material-budget]').click();
  await page.locator('#nexus-material-budget[open]').waitFor({timeout:15000});
  await page.locator('#nexus-budget-results .nexus-budget-breakdown').waitFor({timeout:30000});
  assert.match(await page.locator('#nexus-budget-results').innerText(),/Planejamentos incluídos/);
  await page.screenshot({path:'artifacts/material-budget-'+device.width+'.png'});
  await page.locator('#nexus-material-budget [data-budget-close]').click();
  await page.screenshot({path:'artifacts/trace-planner-'+device.width+'.png'});
  await page.locator('#nexus-traces-dialog [data-traces-close]').click();
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
  assert.match(await page.locator('.v11-cone-level-form').innerText(),/Ainda não informado/,'Unknown equipped cone level cannot default to character level');
  await page.locator('.v11-cone-level-form input[name="coneLevel"]').fill('72');
  await page.locator('.v11-cone-level-form button[type="submit"]').click();
  await page.waitForFunction(()=>{
    const saved=JSON.parse(localStorage.getItem('anderus_nexus_v03')||'{}');
    return saved.characters?.['1512']?.coneLevel===72;
  },null,{timeout:12000});
  assert.match(await page.locator('.v11-cone-level-form').innerText(),/Nível 72 \/ 80/);
  const sizeCone=await page.locator('.v11-cone-panel').boundingBox();
  assert.ok(sizeCone?.width>150);
  await tab('Relíquias').click();
  await page.locator('.v11-relic-card').first().waitFor({timeout:15000});
  assert.equal(await page.locator('.v11-relic-card').count(),6);
  await page.locator('[data-nexus-relic-optimizer="1512"]').click();
  await page.locator('#nexus-relic-optimizer[open]').waitFor({timeout:15000});
  await page.locator('.nexus-relic-opt-row').first().waitFor({timeout:15000});
  assert.equal(await page.locator('.nexus-relic-opt-row').count(),6);
  assert.match(await page.locator('.nexus-relic-opt-overview').innerText(),/Robin/);
  await page.screenshot({path:'artifacts/relic-optimizer-'+device.width+'.png'});
  await page.locator('#nexus-relic-optimizer [data-relic-opt-close]').click();
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
 // Responsive regression across all mandatory product breakpoints.
 const context=await browser.newContext({viewport:{width:360,height:800},deviceScaleFactor:1});
 const page=await context.newPage();
 await page.goto('http://127.0.0.1:8787/',{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>Boolean(document.querySelector('.app')&&document.getElementById('stage')),{timeout:20000});
 for(const width of [320,360,390,430,768,1024,1440,1920]){
  await page.setViewportSize({width,height:900});
  await page.waitForTimeout(180);
  const dims=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert.ok(dims.scrollWidth<=width+4,'Unexpected horizontal overflow at '+width+': '+JSON.stringify(dims));
  await page.screenshot({path:'artifacts/nexus-home-'+width+'.png'});
 }
 await context.close();
 console.log('PASS responsive smoke at 320, 360, 390, 430, 768, 1024, 1440 and 1920 pixels');
}catch(error){failures++;console.error('BROWSER_SMOKE_FAIL',error.stack||String(error))}
finally{await browser.close();}
if(failures)process.exit(1);
