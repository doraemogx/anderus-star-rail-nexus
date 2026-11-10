#!/usr/bin/env node
/* Browser validation: full import and rollback in mobile and desktop Chromium.
 * A local fake OCR is injected for deterministic account tests; no real
 * screenshot, UID, account secret or password is placed in the repository.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir,readFile} from 'node:fs/promises';
const BASE_URL='http://127.0.0.1:8787/';
const mockReader=await readFile(new URL('./fixtures/nexus-scan-v3-reader-mock.js',import.meta.url),'utf8');
const initial={
 characters:{
  '1512':{level:80,e:0,s:1,cone:'Cone antigo',customNote:'Manter nota',pv:6150},
  '1503':{level:80,e:2,s:1,cone:'Cores para o Amanhã',pv:3161}
 },
 v06TracePlans:{'1512':{'1512001':{current:10,target:10}}},
 v06SavedTeams:[{id:'duo',members:['1512','1503']}],
 v06RelicDetails:{'1512':[
  {setId:'127',level:15,main:{stat:'PV',value:705},subs:[]},
  {setId:'127',level:15,main:{stat:'ATQ',value:352},subs:[]},
  {setId:'127',level:15,main:{stat:'Dano CRIT',value:64.8},subs:[]},
  {setId:'127',level:15,main:{stat:'VEL',value:25},subs:[]},
  {setId:'308',level:15,main:{stat:'PV %',value:43.2},subs:[]},
  {setId:'308',level:15,main:{stat:'Regeneração de Energia',value:19.4},
   subs:[{stat:'PV',value:33},{stat:'DEF %',value:10.2},
    {stat:'Efeito de Quebra',value:10.3},{stat:'PV %',value:10.8}]}
 ]}
};
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
await mkdir('artifacts',{recursive:true});
const sizes=[{width:390,height:844,mobile:true},{width:1440,height:900,mobile:false}];
try{
 for(const config of sizes){
  const context=await browser.newContext({viewport:{width:config.width,height:config.height},
   hasTouch:config.mobile,isMobile:config.mobile,serviceWorkers:'block'});
  await context.addInitScript(value=>{
   if(!localStorage.getItem('anderus_nexus_v03'))
    localStorage.setItem('anderus_nexus_v03',JSON.stringify(value));
  },initial);
  await context.route('**/nexus-scan-v3-reader.js',route=>
   route.fulfill({status:200,contentType:'text/javascript',body:mockReader}));
  await context.route('https://nexia-ai-nexus.andrediascrm.workers.dev/**',route=>
   route.fulfill({status:503,headers:{'Access-Control-Allow-Origin':BASE_URL.slice(0,-1),
    'Content-Type':'application/json'},body:'{"error":"Browser test is isolated"}'}));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto(BASE_URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>typeof window.v06StartImport==='function',null,{timeout:20000});
  await page.evaluate(()=>window.v06StartImport('1512'));
  await page.locator('#nexus-scan-v3[open]').waitFor({timeout:15000});
  assert.match(await page.locator('#nexus-scan-v3 h2').innerText(),/Importar da HoYoLab/);
  const b64=await page.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=150;canvas.height=200;
   canvas.getContext('2d').fillRect(0,0,150,200);
   return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.locator('#ns3-file').setInputFiles({
   name:'robin-2000x2300.png',mimeType:'image/png',buffer:Buffer.from(b64,'base64')
  });
  await page.locator('#ns3-character').waitFor({timeout:20000});
  assert.equal(await page.locator('#ns3-character').inputValue(),'1512');
  assert.equal(await page.locator('.ns3-piece').count(),6);
  assert.match(await page.locator('#ns3-progress-line').innerText(),/6\/6 conjuntos/);
  const untouched=await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03')));
  assert.equal(untouched.characters['1512'].pv,6150);
  await page.locator('#ns3-piece-5 summary').click();
  assert.equal(await page.locator('#ns3-piece-5 [data-field="relicvalue"][data-row="0"]').inputValue(),'19.4');
  assert.equal(await page.locator('#ns3-piece-5 [data-field="relicvalue"][data-row="1"]').inputValue(),'33');
  await page.screenshot({path:'artifacts/nexus-scan-v3-'+config.width+'.png'});
  await page.locator('#ns3-confirm').check();
  await page.locator('[data-action="save"]').click();
  await page.waitForFunction(()=>{
   const a=JSON.parse(localStorage.getItem('anderus_nexus_v03')||'{}');
   return a.characters?.['1512']?.pv===6284&&a.v06RelicDetails?.['1512']?.[5]?.subs?.[0]?.value===33;
  },null,{timeout:20000});
  const updated=await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03')));
  assert.equal(updated.characters['1512'].e,1);
  assert.equal(updated.characters['1512'].s,5);
  assert.equal(updated.characters['1512'].customNote,'Manter nota');
  assert.equal(updated.characters['1503'].e,2,'Another owned character must survive');
  assert.equal(updated.v06SavedTeams[0].id,'duo');
  assert.equal(updated.v06TracePlans['1512']['1512001'].current,10);
  assert.equal(updated.v06RelicDetails['1512'][5].setId,'308');
  assert.equal(updated.v06RelicDetails['1512'][5].subs[3].value,10.8);
  const archived=await page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{
    const req=indexedDB.open('anderus-nexus-scan-backups',1);
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
   });
   const value=await new Promise((resolve,reject)=>{
    const req=db.transaction('records','readonly').objectStore('records').get('last-safe-account');
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
   });
   db.close();return JSON.parse(value||'{}');
  });
  assert.equal(archived.characters['1512'].pv,6150,'Previous account must be recoverable');
  await page.waitForFunction(()=>typeof window.v06StartImport==='function',null,{timeout:15000});
  await page.evaluate(()=>window.v06StartImport('1512'));
  await page.locator('#nexus-scan-v3[open] .ns3-undo').waitFor({timeout:15000});
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('.ns3-undo').click();
  await page.waitForFunction(()=>{
   const a=JSON.parse(localStorage.getItem('anderus_nexus_v03')||'{}');
   return a.characters?.['1512']?.pv===6150&&a.characters?.['1503']?.e===2;
  },null,{timeout:16000});
  assert.deepEqual(errors,[],'Javascript errors: '+errors.join(' | '));
  console.log('PASS Scan 3 at '+config.width+'px: six relics, correct Robin, safe save, Pearl intact and full rollback');
  await context.close();
 }
}finally{await browser.close();}
