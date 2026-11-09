// Structured six-piece relic review. Avoids fabricating set names from tiny icons.
let cataloguePromise;
const SLOT=['Cabeça','Mãos','Corpo','Pés','Esfera Plana','Corda de Ligação'];
const SLOT_TYPE=['HEAD','HAND','BODY','FOOT','NECK','OBJECT'];
const STATS=['','PV','PV %','ATQ','ATQ %','DEF','DEF %','VEL','Chance de CRIT','Dano CRIT',
'Efeito de Quebra','RES a Efeito','Taxa de Acerto de Efeito','Regeneração de Energia',
'Bônus de Dano Físico','Bônus de Dano de Gelo','Bônus de Dano de Fogo','Bônus de Dano de Raio',
'Bônus de Dano de Vento','Bônus de Dano Quântico','Bônus de Dano Imaginário','Bônus de Cura Realizada'];
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function data(){
 if(!cataloguePromise)cataloguePromise=fetch('data/live-game.json',{cache:'no-store'})
  .then(r=>{if(!r.ok)throw Error('Sem catálogo de relíquias');return r.json()});
 return cataloguePromise;
}
const options=(items,chosen='')=>items.map(item=>
 '<option value="'+safe(item.value)+'" '+(String(item.value)===String(chosen)?'selected':'')+'>'+safe(item.label)+'</option>').join('');
function setupRows(sets,images,previous=[]){
 const target=document.getElementById('v06-relic-editor');
 if(!target)return;
 // Six rows must exist even if no screenshot layout could be recognized.
 const cards=SLOT.map((slot,i)=>{
  const src=images?.[i]||'';
  const existing=previous[i]||{};
  const appropriate=sets.filter(s=>i<4?Number(s.id)<300:Number(s.id)>=300);
  const setOptions=appropriate.map(s=>({value:s.id,label:s.name}));
  const statOptions=STATS.map(v=>({value:v,label:v||'Escolha o atributo'}));
  const substats=Array.from({length:4},(_,k)=>'<div class="v06-relstat"><select id="v06-r'+i+'-k'+k+'">'+options(statOptions,existing.subs?.[k]?.stat)+'</select><input id="v06-r'+i+'-v'+k+'" type="number" inputmode="decimal" step="0.1" placeholder="Valor" value="'+safe(existing.subs?.[k]?.value??'')+'"></div>').join('');
  return '<details class="v06-relcard" '+(i===0?'open':'')+'><summary>'+(src?'<img alt="Recorte do equipamento" src="'+safe(src)+'">':'<span class="v06-relic-no-crop" aria-label="Sem recorte do print">✦</span>')+'<span>'+SLOT[i]+'</span><small>'+(src?'Conferir conjunto e atributos':'Sem recorte — preencha manualmente')+'</small></summary>'+
    '<div class="v07-relmatch" id="v06-relmatch-'+i+'"><small>O comparador visual aparecerá após reconhecer o print.</small></div>'+
    '<label>Conjunto equipado<select id="v06-r'+i+'-set">'+options([{value:'',label:'Não identificado — escolha o conjunto'},...setOptions],existing.setId)+'</select></label>'+
    '<div class="v06-relstat"><select id="v06-r'+i+'-main">'+options(statOptions,existing.main?.stat)+'</select><input id="v06-r'+i+'-mainval" type="number" step=".1" inputmode="decimal" placeholder="Principal" value="'+safe(existing.main?.value??'')+'"></div>'+
    '<p class="v06-relnote">Quatro subatributos · confira pelo print</p>'+substats+
    '<label>Nível da peça<input type="number" id="v06-r'+i+'-lv" min="0" max="15" placeholder="Não identificado" value="'+safe(existing.level??'')+'"></label>'+
    '<label class="v06-relic-photo-label">Anexar print desta peça (opcional)<input id="v06-r'+i+'-photo" type="file" accept="image/png,image/jpeg,image/webp" data-relic-photo="'+i+'"></label></details>';
 }).join('');
 target.innerHTML='<div class="v06-relic-review"><h3>Identificação das 6 relíquias</h3><p class="v06-rel-explain">Os recortes são exibidos quando o layout é reconhecido. Você também pode anexar um print individual por slot e preencher os campos não reconhecidos.</p>'+cards+'</div>';
 target.querySelectorAll('[data-relic-photo]').forEach(input=>input.addEventListener('change',async event=>{
  const file=event.target.files?.[0],index=Number(event.target.dataset.relicPhoto);
  if(!file)return;
  const status=target.querySelector('#v06-relmatch-'+index);
  const tell=message=>{if(status)status.textContent=message;};
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8*1024*1024||!file.size){
   tell('Use PNG, JPG ou WEBP até 8 MB.');event.target.value='';return;
  }
  try{
   const bitmap=await createImageBitmap(file);
   if(bitmap.width*bitmap.height>30000000)throw Error('Imagem muito grande');
   const scale=Math.min(1,920/bitmap.width,1200/bitmap.height);
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));
   canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
   bitmap.close?.();
   const screenshot=canvas.toDataURL('image/webp',.78);
   if(!Array.isArray(images))throw Error('Armazenamento indisponível');
   while(images.length<6)images.push('');
   images[index]=screenshot;
   const summary=event.target.closest('details')?.querySelector('summary');
   let photo=summary?.querySelector('img');
   if(!photo){
    summary?.querySelector('.v06-relic-no-crop')?.remove();
    photo=document.createElement('img');
    photo.alt='Prévia da relíquia anexada manualmente';
    summary?.prepend(photo);
   }
   if(photo)photo.src=screenshot;
   const label=summary?.querySelector('small');
   if(label)label.textContent='Print individual anexado · confira os atributos';
   tell('Print individual anexado. Identifique conjunto, nível e atributos antes de salvar.');
  }catch(error){tell('Não foi possível ler o print. Edição manual disponível: '+String(error.message||error));}
 }));
}
export async function initializeRelics(images,previous=[]){
 const target=document.getElementById('v06-relic-editor');
 if(!target)return;
 target.textContent='Carregando catálogo de relíquias…';
 try{
   const j=await data();
   setupRows(Object.values(j.relicSets||{}).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')),images||[],previous);
 }catch(e){setupRows([],images||[],previous);
   const warning=target.querySelector('.v06-rel-explain');
   if(warning)warning.textContent='Catálogo de conjuntos indisponível. Os seis campos permanecem editáveis; volte a conferir os conjuntos quando estiver online.';}
}
export function collectRelics(){
 if(!document.getElementById('v06-r0-set'))return null;
 return SLOT.map((slot,i)=>{
   const get=id=>document.getElementById('v06-r'+i+'-'+id)?.value||'';
   return {slot,type:SLOT_TYPE[i],setId:get('set'),
      level:get('lv')===''?null:Number(get('lv')),
      main:{stat:get('main'),value:get('mainval')===''?null:Number(get('mainval'))},
      subs:Array.from({length:4},(_,k)=>({
        stat:get('k'+k),value:get('v'+k)===''?null:Number(get('v'+k))
      }))};
 });
}
export async function renderRelicSummary(records,images){
 const j=await data();
 const sets=j.relicSets||{};
 const rows=(records||[]).map((piece,i)=>{
   const name=sets[piece.setId]?.name||'Conjunto não identificado';
   const main=piece.main?.stat?piece.main.stat+': '+(piece.main.value??'pendente'):'Atributo principal pendente';
   const sub=(piece.subs||[]).filter(s=>s.stat&&s.value!==null).map(s=>s.stat+' '+s.value).join(' · ');
   return '<article class="v06-relic-summary-item"><img alt="" src="'+safe(images?.[i]||'')+'"><div><b>'+safe(SLOT[i])+' · '+safe(name)+'</b><small>'+(piece.level==null?'Nível pendente':'+'+Number(piece.level))+' · '+safe(main)+'</small><p>'+safe(sub||'Secundários ainda não registrados')+'</p></div></article>';
 }).join('');

 const counts={};
 for(const piece of records||[])if(piece.setId)counts[piece.setId]=(counts[piece.setId]||0)+1;
 const bonuses=Object.entries(counts).flatMap(([id,count])=>{
   const set=sets[id],desc=set?.desc||[];
   const unlocked=id.startsWith('3')?count>=2:count>=4?4:count>=2?2:0;
   if(!unlocked)return [];
   const effects=unlocked===4?[desc[0],desc[1]]:[desc[0]];
   return ['<div class="v06-set-bonus"><b>'+safe(set?.name||'Conjunto '+id)+' · '+unlocked+' peças</b>'+
     effects.filter(Boolean).map(v=>'<p>'+safe(v)+'</p>').join('')+'</div>'];
 }).join('');
 const pieceRecommendations=(records||[]).map((r,i)=>{
    const problems=[];
    if(r.level==null)problems.push('nível da peça não informado');
    else if(r.level<15)problems.push('peça no nível +'+r.level+' (máximo usual +15)');
    if(!r.setId)problems.push('conjunto sem identificação');
    if(!r.main?.stat||r.main.value===null)problems.push('atributo principal não confirmado');
    if((r.subs||[]).filter(s=>s.stat&&s.value!==null).length<4)problems.push('secundários incompletos');
    const positive=['Chance de CRIT','Dano CRIT','VEL'].filter(stat=>(r.subs||[]).some(s=>s.stat===stat&&s.value!==null));
    return {slot:SLOT[i],problems,positive};
  });
  const advice=pieceRecommendations.map(r=>'<article class="v07-piece-advice"><b>'+safe(r.slot)+'</b>'+
    (r.problems.length?'<span>Revisar: '+safe(r.problems.join(' · '))+'</span>':
       '<span>Dados completos; pronto para comparação com a build recomendada.</span>')+
    (r.positive.length?'<small>Subatributos ofensivos/de VEL presentes: '+safe(r.positive.join(' · '))+'</small>':'')+
    '</article>').join('');
 const complete=(records||[]).length===6&&records.every(r=>!!r.setId&&!!r.main?.stat&&r.main.value!==null);
 return '<section class="v06-relic-summary"><h3>Equipamento detalhado</h3><p>'+(
 complete?'Seis conjuntos e atributos principais identificados e registrados.':'Análise de conjuntos pendente: confirme nomes e atributos de todas as peças.'
 )+'</p>'+rows+'<h4>O que conferir em cada peça</h4><div class="v07-relic-advice">'+advice+'</div>'+(bonuses?'<h4>Bônus de conjunto ativados</h4>'+bonuses:'')+
 (complete?'<p class="v06-rel-note">Pom-Pom: confira as combinações, os atributos principais e as rolagens secundárias em relação ao kit deste personagem. Evite trocar peças apenas por notas genéricas.</p>':'')+'</section>';
}
