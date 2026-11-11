#!/usr/bin/env node
/* Actual Chromium offline smoke for Github Pages PWA on localhost. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
const page=await context.newPage();
try{
 const app='http://127.0.0.1:8787/';
 await page.goto(app,{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>typeof window.route==='function'&&!!document.querySelector('.app'),null,{timeout:20000});
 // Production registers only on HTTPS. On localhost we register explicitly for QA,
 // without changing application behavior or the live account.
 await page.evaluate(async()=>{
  if('serviceWorker' in navigator)await navigator.serviceWorker.register('./sw.js',{scope:'./'});
 });
 const controlled=await page.evaluate(async()=>{
  if(!('serviceWorker'in navigator))return false;
  const r=await navigator.serviceWorker.ready;
  if(!navigator.serviceWorker.controller)await new Promise(resolve=>{
   const on=()=>resolve(true);
   navigator.serviceWorker.addEventListener('controllerchange',on,{once:true});
   setTimeout(()=>resolve(false),15000);
  });
  return !!navigator.serviceWorker.controller&&!!r.active;
 });
 assert.ok(controlled,'Service Worker did not control the app while online');
 const precache=await page.evaluate(async()=>{
  const keys=await caches.keys();
  const cache=await caches.open(keys.find(x=>x.startsWith('anderus-shell-')));
  return Promise.all(['./','./v06.js','./nexus-v07.js','./nexus-design-system.css','./nexus-design-system.js','./data/live-game.json'].map(async path=>
    Boolean(await cache.match(path))));
 });
 assert.ok(precache.every(Boolean),'Core offline assets missing: '+JSON.stringify(precache));
 await page.evaluate(()=>localStorage.setItem('nexus-offline-qa','preserve-local-value'));
 await context.setOffline(true);
 await page.reload({waitUntil:'domcontentloaded',timeout:25000});
 await page.waitForFunction(()=>typeof window.route==='function'&&!!document.querySelector('.app'),null,{timeout:15000});
 assert.equal(await page.evaluate(()=>localStorage.getItem('nexus-offline-qa')),'preserve-local-value',
  'Offline code update must not erase localStorage');
 await page.waitForFunction(()=>window.NexusDesignSystem?.version==='4.0',null,{timeout:15000});
 assert.equal(await page.evaluate(()=>window.NexusDesignSystem?.version),'4.0',
  'Design System must remain active when PWA reloads offline');
 await page.evaluate(()=>window.route('library'));
 assert.ok(await page.locator('#stage').first().evaluate(el=>Boolean(el.firstElementChild)),'Offline navigation failed');
 const catalog=await page.evaluate(async()=>{
  const r=await fetch('./data/live-game.json');
  if(!r.ok)return false;
  const data=await r.json();
  return Object.keys(data.chars||{}).length>=90;
 });
 assert.ok(catalog,'Offline character catalogue unavailable');
 console.log('PASS actual Service Worker, required precache, offline reload, account persistence and catalogue');
}catch(error){
 console.error('OFFLINE_PWA_FAIL',error.stack||error);
 process.exitCode=1;
}finally{await browser.close();}
