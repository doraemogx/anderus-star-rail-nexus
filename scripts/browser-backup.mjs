#!/usr/bin/env node
/* End-to-end account transfer: actual JSON upload, import, reload and rollback. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
await mkdir('artifacts',{recursive:true});
let fail=false;
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:850}});
  const page=await context.newPage();
  const original={characters:{'1512':{level:80,e:1,s:5,cone:'A Próxima Página da História',coneLevel:72}},v06MaterialInventory:{'2':20000},v06SavedTeams:[],userTheme:'astral'};
  const imported={kind:'anderus-account-backup',formatVersion:2,exportedAt:'2026-11-09T20:00:00.000Z',
   account:{characters:{'1505':{level:72,e:3,s:1,cone:'teste'}},v06MaterialInventory:{'2':10000,'110251':7},
     v06TracePlans:{'1505':{'1505001':{current:1,target:6}}}}};
  await page.addInitScript(data=>{
   if(!localStorage.getItem('anderus_nexus_v03'))localStorage.setItem('anderus_nexus_v03',JSON.stringify(data));
  },original);
  await page.goto('http://127.0.0.1:8787/',{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForFunction(()=>typeof window.NexusBackup?.open==='function',null,{timeout:20000});
  await page.evaluate(()=>window.NexusBackup.open());
  await page.locator('#nexus-backup-dialog[open]').waitFor({timeout:15000});
  const fileInput=page.locator('#nexus-backup-file');
  await fileInput.setInputFiles({name:'invalido.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({characters:{'1512':{level:900}}}))});
  await page.locator('.nexus-backup-preview').getByText('Arquivo recusado',{exact:false}).waitFor({timeout:10000});
  assert.equal(await page.locator('#nexus-backup-dialog [data-backup-restore]').isEnabled(),false);
  await fileInput.setInputFiles({name:'backup-valido.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});
  await page.locator('#nexus-backup-dialog [data-backup-restore]').waitFor({state:'visible'});
  assert.equal(await page.locator('#nexus-backup-dialog [data-backup-restore]').isEnabled(),true);
  await page.screenshot({path:'artifacts/backup-import-'+width+'.png'});
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#nexus-backup-dialog [data-backup-restore]').click();
  await page.waitForFunction(()=>{
   const a=JSON.parse(localStorage.getItem('anderus_nexus_v03')||'{}');
   return a.characters?.['1505']?.e===3&&a.characters?.['1512']?.coneLevel===72;
  },null,{timeout:20000});
  let current=await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03')));
  assert.equal(current.v06MaterialInventory['2'],10000,'Merged quantity must not be summed');
  assert.equal(current.v06MaterialInventory['110251'],7);
  await page.waitForFunction(()=>typeof window.NexusBackup?.open==='function',null,{timeout:20000});
  await page.evaluate(()=>window.NexusBackup.open());
  await page.locator('#nexus-backup-dialog [data-backup-undo]').waitFor({state:'visible'});
  assert.equal(await page.locator('#nexus-backup-dialog [data-backup-undo]').isEnabled(),true);
  page.once('dialog',dialog=>dialog.accept());
  await page.locator('#nexus-backup-dialog [data-backup-undo]').click();
  await page.waitForFunction(()=>{
   const a=JSON.parse(localStorage.getItem('anderus_nexus_v03')||'{}');
   return !a.characters?.['1505']&&a.characters?.['1512']?.coneLevel===72;
  },null,{timeout:20000});
  current=await page.evaluate(()=>JSON.parse(localStorage.getItem('anderus_nexus_v03')));
  assert.equal(current.v06MaterialInventory['2'],20000,'Undo restores original inventory');
  assert.equal(current.userTheme,'astral','Restore should not destroy preferences');
  console.log('PASS backup import invalid-file rejection, merge, reload and undo at '+width+'px');
  await context.close();
 }
}catch(error){fail=true;console.error('BROWSER_BACKUP_FAIL',error.stack||error);}
finally{await browser.close();}
if(fail)process.exit(1);
