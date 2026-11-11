#!/usr/bin/env node
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
try{
 for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:850},serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8787/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.NexusVisualFinish?.version==='5.1',null,{timeout:30000});
  const result=await page.evaluate(()=>{
   const canonical=window.NexusVisualFinish.canonicalize;
   const values=[
    ['Aha (Nihilux/Rá)','Aha'],
    ['Nihilux / Rá','Aha'],
    ['Rá (Nihilux)','Aha'],
    ['Aha — Nihilux','Aha'],
    ['Aha','Aha'],
    ['Robin • Summeretto','Robin • Summeretto']
   ].map(([a,b])=>[a,canonical(a),b]);
   const nav=document.querySelector('#bottomNav');
   const buttons=[...nav.querySelectorAll('button')];
   const hasIcons=buttons.map(b=>!!b.querySelector('.nx-vicon'));
   const before=localStorage.getItem('anderus_nexus_v03');
   const label=document.createElement('div');label.textContent='Aha (Nihilux/Rá)';
   document.querySelector('.app').appendChild(label);
   window.NexusVisualFinish.refresh();
   return {values,hasIcons,before,labelId:label};
  });
  await page.waitForFunction(()=>![...document.querySelectorAll('.app div')].some(x=>x.childNodes.length===1&&x.textContent==='Aha (Nihilux/Rá)'),null,{timeout:6000});
  for(const [input,actual,expected] of result.values)
   assert.equal(actual,expected,'Canonical label '+input);
  assert.ok(result.hasIcons.length>=5&&result.hasIcons.every(Boolean),'Missing vector navigation icons @ '+width);
  assert.equal(errors.length,0,'JS errors @ '+width+': '+errors.join(' | '));
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth);
  assert.ok(overflow<=4,'Horizontal overflow @ '+width+': '+overflow);
  console.log('PASS visual-finish '+width+'px: official Aha, 5 SVG icons, no overflow or JS errors');
  await context.close();
 }
}finally{await browser.close()}
