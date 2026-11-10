#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../nexus-scan-v3-core.js',import.meta.url),'utf8');
const core=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
const layoutExamples=[
 ['Robin - Summeretto',2000,2300,'1512'],
 ['Aventurine - Veraneio',2000,1826,'1513'],
 ['Pearl',2000,1826,'1503'],
 ['Evanescia',2000,1826,'1505'],
 ['Desbravador(a)',2000,1826,'8009']
];
const entries=[
 {id:'1512',name:'Robin - Summeretto'},{id:'1309',name:'Robin'},
 {id:'1513',name:'Aventurine - Veraneio'},{id:'1304',name:'Aventurine'},
 {id:'1503',name:'Pearl'},{id:'1505',name:'Evanescia'}
];
for(const [title,width,height,id] of layoutExamples){
 const layout=core.detectLayout(width,height);
 assert.ok(layout, 'HoYoLab layout missing: '+title);
 const found=core.recognizeCharacter(title+' Nv. 80',entries);
 assert.equal(found?.id,id,'Wrong character from HoYoLab title '+title);
 assert.equal(core.totalBox(layout,'pv').length,4);
 for(let i=0;i<6;i++){
  assert.ok(core.relicImageBox(layout,i)[2]>0);
  for(let j=0;j<5;j++){
   const box=core.relicCrop(layout,i,j).value;
   assert.equal(box.length,4);
   assert.ok(box[0]>710&&box[0]+box[2]<=1990,'Invalid OCR crop');
   assert.ok(box[1]>650&&box[1]<2050,'Bad relic row for '+title);
  }
 }
}
assert.equal(core.detectLayout(709,1536),null,'Phone screenshot of the importer is not a HoYoLab build card');
assert.equal(core.detectLayout(100,200),null);
assert.equal(core.numeric('6.284'),6284);
assert.equal(core.numeric('1.659'),1659);
assert.equal(core.numeric('19,4%'),19.4);
assert.equal(core.numeric('33'),33);
assert.equal(core.inferStat('Taxa de Regeneração de Energia','19,4%'),'Regeneração de Energia');
assert.equal(core.inferStat('Bônus de Dano Físico','38,8%'),'Bônus de Dano Físico');
assert.equal(core.inferStat('PV','8,6%'),'PV %');
assert.equal(core.inferStat('PV','33'),'PV');
assert.equal(core.reasonable('PV',3,5,false),false);
assert.equal(core.reasonable('PV',33,5,false),true);
assert.equal(core.reasonable('Regeneração de Energia',2.4,5,true),false);
assert.equal(core.chooseReading({stat:'Regeneração de Energia',slot:5,level:15,main:true,texts:['2,4%','19,4%']}).value,19.4);
assert.equal(core.chooseReading({stat:'PV',slot:5,main:false,texts:['3','33','33']}).value,33);
assert.equal(core.chooseReading({stat:'Efeito de Quebra',slot:5,main:false,texts:['0,3%','10,3%','10,3%']}).value,10.3);
assert.equal(core.chooseReading({stat:'VEL',slot:3,main:true,level:null,texts:['25','23']}).value,null);
assert.equal(core.recognizeCharacter('Robin - Summeretto',entries).id,'1512');
assert.equal(core.recognizeCharacter('Robin',entries).id,'1309');
const empty=core.blankRelics();
assert.equal(empty.length,6);
assert.equal(core.analyzeCompleteness({relics:empty,totals:{},characterId:''}).full,false);
const ui=readFileSync(new URL('../nexus-scan-v3-ui.js',import.meta.url),'utf8');
const shell=readFileSync(new URL('../v06.js',import.meta.url),'utf8');
const pwa=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
assert.ok(ui.includes('mergeRelicImport('),'New scanner must preserve known relics');
assert.ok(ui.includes('immutableSnapshot('),'New scanner must back up old data first');
assert.ok(ui.includes('window.NexusCloudSync?.sync?.()'),'Scan must sync to the same account');
assert.ok(shell.includes("import('./nexus-scan-v3-ui.js?v=1')"),'All import actions must open new scanner');
for(const file of ['core.js','reader.js','ui.js','.css']){
 const ref='./nexus-scan-v3-'+file;
 assert.ok(pwa.includes(ref),'PWA must include '+ref);
}
console.log('PASS 5 HoYoLab image layouts/titles, 30 geometry cells, no invented relic values and safe account handoff');
