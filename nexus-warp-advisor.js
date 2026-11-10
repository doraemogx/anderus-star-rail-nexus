/* Anderus Warp Advisor 2.0 — no account access, no invented soft-pity data. */
(function(){
'use strict';
if(window.NexusWarpAdvisor)return;
const math=window.NexusWarpMath;
if(!math){console.error('Warp Math not loaded');return;}
const INITIAL={charPity:0,charGuaranteed:false,conePity:0,coneGuaranteed:false,
 jades:0,passes:0,futureJades:0,futurePasses:0,charCopies:1,coneCopies:1,charPulls:0};
let state=null;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=new Intl.NumberFormat('pt-BR');
const percentage=v=>new Intl.NumberFormat('pt-BR',{style:'percent',minimumFractionDigits:1,maximumFractionDigits:1}).format(v);
function clean(raw){
 const value={...INITIAL,...raw};
 const num=(key,max)=>Math.max(0,Math.min(max,Math.trunc(Number(value[key])||0)));
 const out={
  charPity:num('charPity',89),conePity:num('conePity',79),
  charGuaranteed:!!value.charGuaranteed,coneGuaranteed:!!value.coneGuaranteed,
  jades:num('jades',1e8),passes:num('passes',1e6),
  futureJades:num('futureJades',1e8),futurePasses:num('futurePasses',1e6),
  charCopies:num('charCopies',7),coneCopies:num('coneCopies',5),
  charPulls:num('charPulls',5000)
 };
 const total=math.resources(out.passes,out.jades,out.futurePasses,out.futureJades);
 out.charPulls=Math.min(out.charPulls,total);
 return out;
}
function read(){
 const saved=window.NexusWarpBridge?.read?.()||{};
 return clean(saved);
}
function persist(){
 try{window.NexusWarpBridge?.save?.(state);}catch(error){console.warn('Warp Advisor: plan not saved',error);}
}
function analyze(data){
 const v=clean(data);
 const total=math.resources(v.passes,v.jades,v.futurePasses,v.futureJades);
 const characterPulls=Math.min(v.charPulls,total),conePulls=total-characterPulls;
 const needChar=math.maximum('character',v.charCopies,v.charPity,v.charGuaranteed);
 const needCone=math.maximum('cone',v.coneCopies,v.conePity,v.coneGuaranteed);
 const oddsChar=math.chance('character',v.charCopies,v.charPity,v.charGuaranteed,Math.min(characterPulls,needChar));
 const oddsCone=math.chance('cone',v.coneCopies,v.conePity,v.coneGuaranteed,Math.min(conePulls,needCone));
 return {total,characterPulls,conePulls,needChar,needCone,
  shortfall:Math.max(0,needChar+needCone-total),oddsChar,oddsCone,oddsBoth:oddsChar*oddsCone};
}
function fieldNum(key,label,max,note=''){
 return '<label>'+esc(label)+'<input type="number" min="0" max="'+max+'" step="1" inputmode="numeric" data-warp-key="'+key+'" value="'+esc(state[key])+'">'+
 (note?'<small>'+esc(note)+'</small>':'')+'</label>';
}
function selectCopies(key,label,max,prefix){
 return '<label>'+esc(label)+'<select data-warp-key="'+key+'">'+
  Array.from({length:max+1},(_,n)=>'<option value="'+n+'" '+(state[key]===n?'selected':'')+'>'+
   (n===0?'Não quero neste planejamento':prefix+(n-1)+' · '+n+' cópia(s)')+'</option>').join('')+'</select></label>';
}
function dialog(){
 let dlg=document.getElementById('nexus-warp-dialog');if(dlg)return dlg;
 dlg=document.createElement('dialog');dlg.id='nexus-warp-dialog';dlg.setAttribute('aria-label','Warp Advisor — planejamento de banners');
 dlg.innerHTML='<div class="nexus-warp-body"><header><div><span>ANDERUS / WARP INTELLIGENCE</span><h2>Warp Advisor 2.0</h2><p>Planeje suas metas com pity, garantia e recursos que você informar.</p></div>'+
 '<button type="button" data-warp-close aria-label="Fechar planejador">×</button></header>'+
 '<section class="nexus-warp-inputs" aria-label="Entradas do planejamento"></section>'+
 '<section id="nexus-warp-result" aria-live="polite"></section>'+
 '<footer><strong>Fontes e limites</strong><p>90 tiros para o 5★ de personagem; 80 para o cone; 0,6% e 0,8% de chance base; chance de destaque de 50% e 75% respectivamente, com garantia após uma perda. Esses contadores são separados. A curva de soft pity não é pública: as probabilidades mostradas usam apenas a taxa base até o hard pity e são estimativas conservadoras, não probabilidades oficiais ou promessas.</p>'+
 '<a href="https://support.hoyoverse.com/hc/en-us/articles/50913710696217-How-does-the-pity-system-work-for-different-banners-and-reruns" target="_blank" rel="noopener noreferrer">Regras da HoYoverse · Help Center</a></footer></div>';
 document.body.appendChild(dlg);
 dlg.querySelector('[data-warp-close]').onclick=()=>dlg.close();
 dlg.addEventListener('click',event=>{if(event.target===dlg)dlg.close();});
 dlg.addEventListener('change',event=>{
  const field=event.target.closest('[data-warp-key]');
  if(!field)return;
  const key=field.dataset.warpKey;
  state[key]=field.type==='checkbox'?field.checked:Number(field.value);
  state=clean(state);persist();render();
 });
 return dlg;
}
function render(){
 const dlg=dialog();if(!state)state=read();
 const root=dlg.querySelector('.nexus-warp-inputs');
 const a=analyze(state);
 const maxAlloc=Math.min(5000,a.total);
 root.innerHTML='<div class="nexus-warp-section"><h3>01 · Contadores independentes</h3><div class="nexus-warp-fields">'+
   fieldNum('charPity','Pity do banner de personagem',89,'Tiros desde o último 5★')+
   '<label class="nexus-warp-check"><input type="checkbox" data-warp-key="charGuaranteed" '+(state.charGuaranteed?'checked':'')+'> Próximo 5★ de personagem garantido</label>'+
   fieldNum('conePity','Pity do banner de cone',79,'Tiros desde o último cone 5★')+
   '<label class="nexus-warp-check"><input type="checkbox" data-warp-key="coneGuaranteed" '+(state.coneGuaranteed?'checked':'')+'> Próximo cone 5★ garantido</label></div></div>'+
  '<div class="nexus-warp-section"><h3>02 · Recursos atuais e previstos</h3><div class="nexus-warp-fields">'+
   fieldNum('jades','Jades atuais',100000000)+fieldNum('passes','Passes especiais atuais',1000000)+
   fieldNum('futureJades','Jades futuras confirmadas/estimadas',100000000)+
   fieldNum('futurePasses','Passes futuros previstos',1000000)+'</div></div>'+
  '<div class="nexus-warp-section"><h3>03 · Objetivos e distribuição</h3><div class="nexus-warp-fields">'+
   selectCopies('charCopies','Meta de Eidolons',7,'E')+
   selectCopies('coneCopies','Meta de sobreposições',5,'S')+
   fieldNum('charPulls','Tiros reservados para personagem',maxAlloc,'O restante fica reservado aos cones')+
   '<div class="nexus-warp-allocation"><strong>'+nf.format(a.total)+' tiros disponíveis</strong><span>'+nf.format(a.characterPulls)+' personagem · '+nf.format(a.conePulls)+' cone</span></div>'+
   '</div></div>';
 const enough=a.shortfall===0;
 dlg.querySelector('#nexus-warp-result').innerHTML='<div class="nexus-warp-headline"><div><small>RECURSOS TOTAIS</small><strong>'+nf.format(a.total)+'</strong><span>tiros</span></div>'+
  '<div><small>PIOR CENÁRIO PARA AS DUAS METAS</small><strong>'+nf.format(a.needChar+a.needCone)+'</strong><span>tiros</span></div>'+
  '<div><small>'+(enough?'GARANTIA TEÓRICA COBERTA':'DÉFICIT PARA GARANTIA')+'</small><strong>'+nf.format(a.shortfall)+'</strong><span>'+(enough?'sem déficit':'tiros')+'</span></div></div>'+
  '<div class="nexus-warp-outcomes"><article><h4>Personagem</h4><p>Até <b>'+nf.format(a.needChar)+'</b> tiros para '+state.charCopies+' cópia(s) no pior caso.</p>'+
    '<strong>'+percentage(a.oddsChar)+'</strong><span>Probabilidade conservadora com '+nf.format(a.characterPulls)+' tiros alocados</span></article>'+
   '<article><h4>Cone de Luz</h4><p>Até <b>'+nf.format(a.needCone)+'</b> tiros para '+state.coneCopies+' cópia(s) no pior caso.</p>'+
    '<strong>'+percentage(a.oddsCone)+'</strong><span>Probabilidade conservadora com '+nf.format(a.conePulls)+' tiros alocados</span></article></div>'+
  '<div class="nexus-warp-combined"><span>Probabilidade conjunta no modelo conservador</span><strong>'+percentage(a.oddsBoth)+'</strong>'+
    '<p>Para a distribuição de tiros informada, as duas metas são avaliadas em contadores separados. Soft pity real pode elevar as chances; não há garantia de conseguir ambas até atingir o pior cenário.</p></div>'+
  '<p class="nexus-warp-footnote">Meta E0 = 1 cópia, E2 = 3 cópias. Meta S1 = 1 cone, S5 = 5 cones. Os valores não descontam cópias que você já possui; defina a quantidade adicional desejada. Este planejamento é salvo no navegador e incluído no backup do Nexus.</p>';
}
function open(){
 state=read();
 const dlg=dialog();
 if(!dlg.open)dlg.showModal();
 const total=math.resources(state.passes,state.jades,state.futurePasses,state.futureJades);
 if(!state.charPulls&&total>0)state.charPulls=Math.min(total,math.maximum('character',state.charCopies,state.charPity,state.charGuaranteed));
 render();
}
window.NexusWarpAdvisor={open,analyze,clean};
})();