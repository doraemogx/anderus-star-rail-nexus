/* Nexus Scan 2.0 — provenance and original-image review, no fictional confidence. */
(function(){
'use strict';
if(window.NexusScanProvenance)return;
const fields=['id','level','e','s','cone','pv','atk','def','spd','crit','cdmg','break','energy'];
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const handEdited=new Set();
let sourceUrl=null,sourceSize=null,seenFile=null;
function isTracked(id){
 if(!id||!id.startsWith('v06-'))return false;
 return fields.includes(id.slice(4))||/^v06-r[0-5]-(?:set|main|mainval|lv|k[0-3]|v[0-3])$/.test(id);
}
function tracked(){
 const form=document.querySelector('.v06-import-form');
 return form?[...form.querySelectorAll('input[id],select[id]')].filter(el=>isTracked(el.id)):[];
}
function metaFor(el,confirmed=false){
 const raw=String(el?.value??'').trim(),manual=handEdited.has(el.id);
 const present=raw!==''&&!(el.id==='v06-id'&&raw==='__custom__');
 let method='not-detected',validation='unrecognized';
 if(present){
  method=manual?'manual':'auto-extraction-or-prefill';
  validation=confirmed?'confirmed-after-user-review':manual?'manual-pending-review':'needs-confirmation';
 }
 return {value:present?raw:null,method,source:present?(manual?'user-input':'uploaded-image-or-initial-selection'):'not-available',
  confidence:'not-calibrated',validation};
}
function collect(confirmed=false){
 const result={source:'local screenshot/manual review',image:sourceSize,
  checkedAt:new Date().toISOString(),engine:'Nexus Scan 2.0',
  confidenceModel:'not-calibrated — no percentages',fields:{}};
 for(const el of tracked())result.fields[el.id]=metaFor(el,confirmed);
 return result;
}
function status(){
 const area=document.getElementById('nexus-scan-provenance');
 if(!area)return;
 const details=collect(false),list=Object.entries(details.fields);
 let recognized=0,manual=0,unknown=0;
 for(const [,record] of list){
  if(record.value===null)unknown++;
  else if(record.method==='manual')manual++;
  else recognized++;
 }
 const summary=area.querySelector('[data-scan-provenance-summary]');
 if(summary)summary.textContent=recognized+' campo(s) preenchidos automaticamente/inicialmente · '+manual+' corrigido(s) manualmente · '+unknown+' pendente(s).';
 const rows=area.querySelector('[data-scan-provenance-fields]');
 if(rows)rows.innerHTML=list.map(([id,p])=>'<li><code>'+safe(id)+'</code><span>'+
  (p.validation==='unrecognized'?'Não reconhecido':p.validation==='manual-pending-review'?'Informado manualmente':'Precisa de confirmação')+'</span></li>').join('');
}
function setFile(file){
 handEdited.clear();
 if(sourceUrl){URL.revokeObjectURL(sourceUrl);sourceUrl=null;}
 seenFile=file&&file instanceof Blob?file:null;
 if(seenFile){
  sourceUrl=URL.createObjectURL(seenFile);
  sourceSize={size:seenFile.size,mime:seenFile.type};
 }else sourceSize=null;
}
function zoom(){
 if(!sourceUrl)return;
 let dlg=document.getElementById('nexus-scan-original');
 if(!dlg){
  dlg=document.createElement('dialog');dlg.id='nexus-scan-original';
  dlg.setAttribute('aria-label','Imagem original do print para conferência');
  dlg.innerHTML='<section class="nexus-scan-original-inner"><header><h2>Conferência do print original</h2>'+
    '<button type="button" data-scan-original-close aria-label="Fechar imagem">×</button></header>'+
    '<p>Amplie a imagem para conferir atributos antes de confirmar o salvamento. Nenhum dado é transmitido para outro serviço.</p>'+
    '<div class="nexus-scan-original-scroll"><img alt="Print original enviado pelo usuário"></div></section>';
  document.body.append(dlg);
  dlg.querySelector('[data-scan-original-close]').onclick=()=>dlg.close();
  dlg.addEventListener('click',event=>{if(event.target===dlg)dlg.close()});
 }
 dlg.querySelector('img').src=sourceUrl;
 if(!dlg.open)dlg.showModal();
}
function mount(){
 if(mount.done)return;mount.done=true;
 document.addEventListener('input',event=>{
  const target=event.target;
  if(!target?.closest?.('.v06-import-form')||!isTracked(target.id))return;
  handEdited.add(target.id);status();
 });
 document.addEventListener('change',event=>{
  const target=event.target;
  if(!target?.closest?.('.v06-import-form')||!isTracked(target.id))return;
  handEdited.add(target.id);status();
 });
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-scan-original]'))zoom();
  if(event.target.closest('[data-scan-provenance-refresh]'))status();
 });
}
window.NexusScanProvenance={collect,status,setFile,zoom,mount};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();