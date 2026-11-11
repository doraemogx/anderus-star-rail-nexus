/* Anderus Nexus 2.0 — independent account-safe state layer.
   Reads the original account but NEVER overwrites the legacy storage key. */
(function(){
'use strict';
const KEY='anderus_nexus_v2',OLD='anderus_nexus_v03';
const safeParse=s=>{try{return JSON.parse(s)}catch{return null}};
const initial=()=>({schema:2,modified:Date.now(),characters:{},goals:[],achievements:{},teams:{},
 themes:[],activeTheme:null,warp:{pity:0,shots:0,guaranteed:false},speed:{},selected:'',
 notes:{},relicLibrary:[],history:[],settings:{reduceMotion:false}});
const storage=()=>{try{return localStorage}catch{return null}};
const old=safeParse(storage()?.getItem(OLD))||{};
const raw=safeParse(storage()?.getItem(KEY));
const data=raw?.schema===2?Object.assign(initial(),raw):initial();
const N2={key:KEY,legacyKey:OLD,legacy:old,data,game:null,root:'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/',ready:false};
N2.esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
N2.stat=(value,digits=0)=>{
 if(value===undefined||value===null||value==='')return '—';
 const n=Number(value);return Number.isFinite(n)?n.toLocaleString('pt-BR',{maximumFractionDigits:digits}):String(value);
};
N2.text=s=>N2.esc(s??'');
N2.named=(id)=>N2.game?.chars?.[id]?.name||({1512:'Noite Eterna',1505:'?'}[id])||'Personagem '+id;
N2.gameChar=(id)=>N2.game?.chars?.[id]||null;
N2.icon=(path)=>{
 if(!path)return '';
 if(/^https:\/\//i.test(path))return path;
 return N2.root+path.replace(/^\//,'');
};
N2.image=(id,kind='portrait')=>{
 if(String(id)==='future-aha')return '../assets/official/aha-4-7.webp';
 const c=N2.gameChar(id);
 return N2.icon(c?.[kind]||c?.preview||c?.icon);
};
N2.img=(id,kind='portrait',cls='')=>{
 const source=N2.image(id,kind);
 return source?'<img class="'+N2.esc(cls)+'" alt="" src="'+N2.esc(source)+'" loading="lazy" onerror="this.style.display=\'none\'">':'<span class="n2-silhouette" aria-hidden="true">✦</span>';
};
N2.note=(message,type='success')=>{
 let el=document.getElementById('n2-toast');
 if(!el){el=document.createElement('div');el.id='n2-toast';el.setAttribute('role','status');document.body.appendChild(el);}
 el.textContent=message;el.dataset.type=type;el.classList.add('show');clearTimeout(N2.toastTimer);
 N2.toastTimer=setTimeout(()=>el.classList.remove('show'),3500);
};
N2.save=()=>{
 N2.data.modified=Date.now();
 try{storage()?.setItem(KEY,JSON.stringify(N2.data));N2.updateStatus();return true}
 catch(e){N2.note('Não foi possível gravar. Exporte um backup antes de continuar.','error');return false}
};
N2.updateStatus=()=>{
 const el=document.getElementById('nexus2-sync-status');
 if(el){el.textContent='DADOS LOCAIS';el.title='Dados mantidos neste navegador. A sincronização entre dispositivos não está ativada no Nexus 2.0.';}
};
N2.snapshot=()=>({schema:2,exportedAt:new Date().toISOString(),app:'Anderus Nexus 2.0',v2:N2.data,legacy:N2.legacy});
N2.getOriginal=()=>N2.data.importedLegacy||N2.legacy;
N2.characters=()=>{
 const base=N2.getOriginal()?.characters||{};
 const copied=Array.isArray(base)?Object.fromEntries(base.filter(Boolean).map(c=>[String(c.id),c])):{...base};
 return {...copied,...N2.data.characters};
};
N2.owned=()=>Object.keys(N2.characters()).filter(id=>N2.characters()[id]&&typeof N2.characters()[id]==='object');
N2.character=id=>Object.assign({},N2.getOriginal()?.characters?.[id]||{},N2.data.characters?.[id]||{});
N2.selectedId=()=>N2.data.selected||N2.getOriginal()?.profile||N2.owned()[0]||'';
N2.setSelected=id=>{N2.data.selected=String(id);N2.save();};
N2.selectCharacter=id=>{N2.setSelected(id);N2.navigate('character');};
N2.catalog=()=>{
 const all=Object.values(N2.game?.chars||{});
 return all.filter(c=>c&&c.id&&c.name&&!/trial|npc/i.test(c.name));
};
N2.avatar=(id,kind='preview')=>{
 const c=N2.gameChar(id);
 return N2.img(id,kind,'n2-avatar-img');
};
N2.dim=(s)=>'<span class="n2-muted">'+N2.esc(s)+'</span>';
N2.head=(eyebrow,title,description)=>{
 return '<div class="page-title"><div><span class="sect-label">'+N2.esc(eyebrow)+'</span><h1>'+N2.esc(title)+'</h1><p>'+N2.esc(description)+'</p></div></div>';
};
N2.empty=(title,message,button='',action='')=>'<div class="n2-empty"><div class="n2-empty-mark">✧</div><h3>'+N2.esc(title)+'</h3><p>'+N2.esc(message)+'</p>'+
 (button?'<button class="btn gold" onclick="'+action+'">'+N2.esc(button)+'</button>':'')+'</div>';
N2.statCard=(label,value,extra='')=>'<div class="metric"><small>'+N2.esc(label)+'</small><strong>'+N2.esc(value)+'</strong><em>'+N2.esc(extra)+'</em></div>';
N2.origin=()=>N2.owned().length?'<span class="chip good">'+N2.owned().length+' personagens carregados deste navegador</span>':'<span class="chip">Nenhuma conta local localizada</span>';
N2.updatePage=id=>{
 const el=document.getElementById('page-'+id);
 if(el&&typeof pageHtml[id]==='function'){el.innerHTML=pageHtml[id]();}
};
N2.navigate=id=>{if(id==='character'&&!N2.selectedId())id='account';window.navigate(id);};
N2.download=(name,content,type='application/json')=>{
 const blob=new Blob([content],{type});const url=URL.createObjectURL(blob),a=document.createElement('a');
 a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
};
N2.export=()=>{N2.download('anderus-nexus2-backup-'+new Date().toISOString().slice(0,10)+'.json',JSON.stringify(N2.snapshot(),null,2));N2.note('Backup exportado.');};
N2.importFile=async(input)=>{
 const file=input.files?.[0];if(!file)return;
 if(file.size>25*1024*1024){N2.note('Arquivo muito grande para este importador.','error');return;}
 try{
  const json=safeParse(await file.text());
  if(!json||typeof json!=='object')throw Error('Arquivo não é um JSON válido');
  if(json.schema===2&&json.v2?.schema===2){
   if(!confirm('Importar este backup do Nexus 2.0? Seus objetivos e dados atuais desta versão serão substituídos. O Nexus antigo não será alterado.'))return;
   N2.data=structuredClone(json.v2);N2.legacy=json.legacy||N2.legacy;
  }else if(json.characters&&typeof json.characters==='object'){
   if(!confirm('Usar este backup do Nexus antigo no Nexus 2.0? O arquivo original continuará preservado.'))return;
   N2.data.importedLegacy=json;
  }else throw Error('Formato de backup não reconhecido');
  if(N2.save()){N2.note('Backup importado com sucesso.');renderAll();navigate('account');}
 }catch(e){N2.note('Importação não concluída: '+e.message,'error');}
 input.value='';
};
N2.statusText=()=>N2.game?.checkedAt?'Catálogo atualizado em '+new Date(N2.game.checkedAt).toLocaleDateString('pt-BR'):'Catálogo oficial ainda não carregado';
N2.start=async()=>{
 try{
  const response=await fetch('../data/live-game.json',{cache:'no-cache'});
  if(!response.ok)throw Error(String(response.status));
  const result=await response.json();
  if(!result.chars||!result.skills)throw Error('Arquivo incompleto');
  N2.game=result;N2.ready=true;
  const page=typeof currentPage==='string'?currentPage:'home';
  renderAll();navigate(page);N2.updateStatus();
 }catch(e){N2.note('Não foi possível atualizar o catálogo. Suas informações locais continuam disponíveis.','error')}
};
N2.search=()=>{
 const chars=N2.catalog();
 const query=prompt('Buscar personagem ou ferramenta no Nexus:');
 if(query===null)return;
 const q=query.trim().toLocaleLowerCase('pt-BR');
 if(!q)return;
 const c=chars.find(c=>c.name.toLocaleLowerCase('pt-BR').includes(q));
 if(c){N2.setSelected(c.id);navigate('character');return;}
 const r=routes.find(r=>r[1].toLocaleLowerCase('pt-BR').includes(q));
 if(r){navigate(r[0]);return;}
 N2.note('Nenhum resultado encontrado.','error');
};
window.N2=N2;
window.Nexus2Search=()=>N2.search();
window.addEventListener('storage',ev=>{
 if(ev.key===KEY&&ev.newValue){const state=safeParse(ev.newValue);if(state?.schema===2){N2.data=state;renderAll();navigate(currentPage);}}
 if(ev.key===OLD&&ev.newValue){N2.legacy=safeParse(ev.newValue)||{};renderAll();navigate(currentPage);}
});
})();