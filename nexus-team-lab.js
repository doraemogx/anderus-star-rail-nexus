/* ANDERUS | Team Lab 2.0. Four owned characters; deterministic, explainable. */
(function(){
'use strict';
if(window.NexusTeamLab)return;
const ART='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const roles={Rogue:'Dano / alvo único',Warrior:'Dano / versatilidade',Mage:'Dano em área',Shaman:'Amplificação',Warlock:'Debuffs / efeitos',Knight:'Proteção',Priest:'Cura',Memory:'Mecânicas de Memoespírito',Elation:'Mecânicas de Euforia'};
const paths={Rogue:'Caça',Warrior:'Destruição',Mage:'Erudição',Shaman:'Harmonia',Warlock:'Inexistência',Knight:'Preservação',Priest:'Abundância',Memory:'Reminiscência',Elation:'Euforia'};
let choices=['','','',''],currentId=null;
const bridge=()=>window.NexusTeamLabBridge;
const roster=()=>bridge()?.roster()||[];
function audit(){
 const chars=roster(),selected=choices.map(id=>chars.find(c=>c.id===id)).filter(Boolean);
 const ids=selected.map(c=>c.id),duplicates=ids.length!==new Set(ids).size;
 const sustain=selected.filter(c=>['Priest','Knight'].includes(c.path));
 const buffs=selected.filter(c=>['Shaman','Warlock'].includes(c.path));
 const dps=selected.filter(c=>['Rogue','Warrior','Mage','Elation','Memory'].includes(c.path));
 const coverage=[...new Set(selected.map(c=>c.element).filter(Boolean))];
 const problems=[];
 if(duplicates)problems.push('Há personagens repetidos. Cada equipe precisa de quatro integrantes distintos.');
 if(selected.length!==4)problems.push('Selecione quatro personagens cadastrados.');
 if(!sustain.length)problems.push('Sem Abundância ou Preservação: a sobrevivência precisa ser verificada para o conteúdo escolhido.');
 if(!dps.length)problems.push('Não identifiquei um papel ofensivo pelos Caminhos; o kit pode exigir outra interpretação.');
 return {selected,duplicates,complete:selected.length===4&&!duplicates,sustain,buffs,dps,coverage,problems};
}
function dialog(){
 let el=document.getElementById('nexus-team-dialog');if(el)return el;
 el=document.createElement('dialog');el.id='nexus-team-dialog';el.setAttribute('aria-label','Team Lab — composição de equipes');
 el.innerHTML='<div class="teamlab-inner"><header><div><span class="teamlab-eyebrow">ANDERUS · TEAM LAB</span><h2>Seu esquadrão</h2><p>Uma composição, quatro personagens que você realmente possui.</p></div><button type="button" data-team-close aria-label="Fechar">×</button></header>'+
  '<div class="teamlab-editor"><label>Nome da equipe<input type="text" id="teamlab-name" maxlength="70" placeholder="Ex.: Euforia para Memória do Caos"></label>'+
  '<label>Objetivo<select id="teamlab-purpose"><option value="geral">Geral</option><option value="moc">Memória do Caos</option><option value="pf">Pura Ficção</option><option value="as">Sombra Apocalíptica</option><option value="aa">Arbitragem das Anomalias</option></select></label></div>'+
  '<section class="teamlab-members" aria-label="Quatro integrantes"></section><section class="teamlab-review" aria-live="polite"></section>'+
  '<div class="teamlab-actions"><button type="button" data-team-save>Salvar composição</button><button type="button" data-team-clear>Limpar</button></div>'+
  '<section class="teamlab-library"><h3>Equipes salvas</h3><div class="teamlab-saved"></div></section>'+
  '<p class="teamlab-disclaimer">As funções são aproximações de Caminho; sinergias, sobrevivência e pontuação exigem condições reais do kit, builds e regras da rotação. Nenhuma composição é considerada ótima automaticamente.</p></div>';
 document.body.appendChild(el);
 el.querySelector('[data-team-close]').onclick=()=>el.close();
 el.addEventListener('click',e=>{if(e.target===el)el.close()});
 el.addEventListener('change',event=>{
  const slot=event.target.closest('[data-team-slot]');
  if(slot){choices[Number(slot.dataset.teamSlot)]=slot.value;render();}
 });
 el.querySelector('[data-team-clear]').onclick=()=>{choices=['','','',''];currentId=null;el.querySelector('#teamlab-name').value='';render()};
 el.querySelector('[data-team-save]').onclick=save;
 el.addEventListener('click',event=>{
  const open=event.target.closest('[data-team-open]');
  if(open){loadSaved(open.dataset.teamOpen);return;}
  const del=event.target.closest('[data-team-delete]');
  if(del){
   if(!window.confirm('Excluir esta composição salva?'))return;
   bridge()?.delete(del.dataset.teamDelete);
   if(currentId===del.dataset.teamDelete)currentId=null;
   render();
  }
 });
 return el;
}
function render(){
 const el=dialog(),chars=roster(),list=el.querySelector('.teamlab-members');
 if(!chars.length){list.innerHTML='<p class="teamlab-notice">Não há personagens cadastrados neste navegador. Adicione personagens na Minha Conta antes de montar equipes.</p>';el.querySelector('[data-team-save]').disabled=true;}
 else{
  list.innerHTML=choices.map((id,index)=>{
   const available=chars.map(c=>'<option value="'+esc(c.id)+'" '+(c.id===id?'selected':'')+'>'+esc(c.name)+' · E'+c.e+'S'+c.s+'</option>').join('');
   const selected=chars.find(c=>c.id===id);
   return '<article class="teamlab-member"><span>POSIÇÃO 0'+(index+1)+'</span>'+
    '<div class="teamlab-selected-character">'+
    (selected?.icon?'<img src="'+esc(ART+selected.icon)+'" alt="" loading="lazy" onerror="this.hidden=true">':'<span aria-hidden="true">✦</span>')+
    '<strong>'+esc(selected?.name||'Aguardando integrante')+'</strong></div>'+
    '<label for="teamlab-slot-'+index+'">Integrante</label>'+
    '<select id="teamlab-slot-'+index+'" data-team-slot="'+index+'"><option value="">Selecione</option>'+available+'</select>'+
    '<p>'+(selected?esc(paths[selected.path]||selected.path||'Caminho não informado')+' · '+esc(roles[selected.path]||'Papel a verificar'):'Aguardando seleção')+'</p></article>';
  }).join('');
 }
 const result=audit(),review=el.querySelector('.teamlab-review');
 review.innerHTML='<h3>Leitura da composição</h3>'+
  '<div class="teamlab-counts"><span>'+result.selected.length+'/4 integrantes</span><span>'+result.sustain.length+' sustentação</span><span>'+result.buffs.length+' suporte/debuff</span><span>'+result.coverage.length+' elementos</span></div>'+
  (result.problems.length?'<ul>'+result.problems.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'<p>Quatro integrantes distintos selecionados. Revise o funcionamento de cada kit e as regras do confronto antes de entrar na batalha.</p>');
 el.querySelector('[data-team-save]').disabled=!result.complete;
 const saved=bridge()?.list()||[];
 el.querySelector('.teamlab-saved').innerHTML=saved.length?saved.map(team=>{
  const names=(team.members||[]).map(id=>chars.find(x=>x.id===id)?.name||'Personagem ausente').join(' · ');
  return '<article><div><strong>'+esc(team.name)+'</strong><p>'+esc(names)+'</p></div><div><button type="button" data-team-open="'+esc(team.id)+'">Editar</button><button type="button" data-team-delete="'+esc(team.id)+'">Excluir</button></div></article>';
 }).join(''):'<p class="teamlab-notice">Nenhuma equipe salva neste navegador.</p>';
}
function save(){
 const el=dialog(),result=audit();
 if(!result.complete){render();return;}
 const name=el.querySelector('#teamlab-name').value.trim()||'Equipe '+new Date().toLocaleDateString('pt-BR');
 const purpose=el.querySelector('#teamlab-purpose').value;
 try{
  const entry=bridge()?.save({id:currentId,name,purpose,members:choices});
  if(!entry)throw Error('Persistência indisponível. Abra sua conta e tente novamente.');
  currentId=entry.id;
  render();
  const msg=el.querySelector('.teamlab-review');
  msg.insertAdjacentHTML('afterbegin','<p role="status" class="teamlab-success">Equipe salva no backup local do Nexus.</p>');
 }catch(error){el.querySelector('.teamlab-review').textContent=String(error.message||error);}
}
function loadSaved(id){
 const entry=(bridge()?.list()||[]).find(x=>x.id===id);if(!entry)return;
 currentId=id;choices=[...entry.members];
 const el=dialog();el.querySelector('#teamlab-name').value=entry.name||'';
 el.querySelector('#teamlab-purpose').value=entry.purpose||'geral';render();
}
function open(){
 const el=dialog();el.showModal();render();
}
let mounted=false;
function mount(){
 if(mounted)return;mounted=true;
 document.addEventListener('click',event=>{
  if(event.target.closest('[data-nexus-team-lab]'))open();
 });
}
window.NexusTeamLab={open,mount,audit};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();