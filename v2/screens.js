/* Nexus 2.0 — real account screens and human-centered navigation. */
(function(){
'use strict';
const a=window.N2,esc=a.esc;
const owned=()=>a.owned().map(id=>({id,char:a.gameChar(id),saved:a.character(id)}));
function metric(label,value,sub){return a.statCard(label,value,sub);}
function actionRoute(route,label,cls='ghost'){return '<button class="btn '+cls+'" onclick="N2.navigate(\''+route+'\')">'+label+'</button>';}
function family(id){const c=a.gameChar(id);return c?.path||'Honkai: Star Rail';}
function portrait(id){return a.img(id,'preview');}
function characterCard(item){
 const id=esc(item.id),c=item.char||{},saved=item.saved||{};
 return '<button type="button" class="n2-character-card" onclick="N2.selectCharacter(\''+id+'\')">'+
 '<span class="n2-character-art">'+portrait(item.id)+'</span>'+
 '<span class="n2-character-meta"><small>'+esc(c.element||'PERSONAGEM')+' · '+esc(family(item.id))+'</small><strong>'+esc(c.name||a.named(item.id))+'</strong>'+
 '<em>NV '+esc(saved.level||'—')+' · E'+esc(saved.e??0)+' · '+(saved.cone?'Cone informado':'Cone não informado')+'</em></span>'+
 '<span aria-hidden="true" class="n2-chevron">↗</span></button>';
}
function nextActions(){
 const entries=owned(),goals=a.data.goals.filter(x=>!x.done);
 const todo=[];
 if(!entries.length)todo.push({heading:'Conecte sua coleção',text:'Importe um backup do Nexus anterior ou cadastre um personagem para personalizar suas análises.',screen:'account'});
 if(goals.length)todo.push({heading:'Continue o objetivo '+goals[0].title,text:'Acompanhe seu planejamento e marque etapas concluídas.',screen:'plan'});
 if(entries.length&&entries.some(x=>!x.saved.spd))todo.push({heading:'Complete as builds pendentes',text:'A velocidade de alguns personagens ainda não está salva. Complete os campos para usar o Speed Lab.',screen:'character'});
 if(entries.length)todo.push({heading:'Confira suas equipes de Endgame',text:'Organize os personagens para não repetir unidades entre as metades.',screen:'endgame'});
 return todo.slice(0,3);
}
a.pages={
 home:()=>{
  const chars=owned(),todo=nextActions(),goals=a.data.goals;
  return '<div class="hero n2-home-hero"><div class="hero-bg-img n2-hero-art" style="background-image:url(\''+esc(a.image(a.selectedId(),'preview'))+'\')"></div><div class="hero-copy">'+
   '<span class="hero-kicker">ARQUIVO DO DESBRAVADOR / NEXUS 2.0</span>'+
   '<h1>Seu universo.<br>Sua próxima jogada.</h1>'+
   '<p>Organize seu elenco, avance seus objetivos e descubra a próxima decisão que faz sentido para a sua conta.</p>'+
   '<div class="n2-actions">'+actionRoute('plan','Meu plano de hoje','gold')+actionRoute('account','Minha coleção')+'</div>'+
   '<div class="n2-data-line">'+a.origin()+'</div></div></div>'+
   section('O que fazer agora','Ações baseadas somente em informações salvas')+
   (todo.length?'<div class="n2-priority-list">'+todo.map((x,i)=>
    '<button class="n2-priority" onclick="N2.navigate(\''+x.screen+'\')">'+
    '<span class="n2-priority-num">0'+(i+1)+'</span><span><strong>'+esc(x.heading)+'</strong><small>'+esc(x.text)+'</small></span><span class="n2-chevron">↗</span></button>').join('')+'</div>':
    a.empty('Tudo organizado por enquanto','Crie um novo objetivo para que o Nexus acompanhe seu próximo passo.','Criar objetivo',"N2.navigate('plan')"))+
   section('Seu progresso','Lido deste navegador')+
   '<div class="fourcol">'+metric('PERSONAGENS',String(chars.length),'Conta local')+
   metric('OBJETIVOS',String(goals.length),'Planejamento')+
   metric('CONCLUÍDOS',String(goals.filter(x=>x.done).length),'Metas marcadas')+
   metric('TEMAS GERADOS',String(a.data.themes.length),'Theme Studio')+'</div>'+
   section('O Expresso recomenda','Ferramentas ligadas à sua jornada')+
   '<div class="n2-action-grid">'+
   [['scan','scan','Nexus Scan','Adicionar ou revisar dados'],['speed','watch','Speed Lab','Simular turnos da equipe'],
    ['relics','box','Relic Vault','Examinar relíquias salvas'],['atlas','star','Atlas','Acompanhar conquistas']].map(([route,icon,label,sub])=>
    '<button class="tile" onclick="N2.navigate(\''+route+'\')">'+ico(icon)+'<strong>'+label+'</strong><small>'+sub+'</small></button>').join('')+'</div>'+
   '<div class="n2-source-line"> '+esc(a.statusText())+' · A disponibilidade de dados de Endgame e notícias depende de fontes verificadas.</div>';
 },
 account:()=>{
  const entries=owned();
  return a.head('ARQUIVO DO DESBRAVADOR','Minha conta','Todos os personagens da sua conta, sem estatísticas inventadas.')+
   '<div class="n2-collection-top"><div class="fourcol">'+metric('PERSONAGENS',String(entries.length),'Dados locais')+
   metric('NV 80',String(entries.filter(x=>Number(x.saved.level)===80).length),'No nível máximo tradicional')+
   metric('COM CONE',String(entries.filter(x=>x.saved.cone).length),'Equipamento registrado')+
   metric('COM VEL',String(entries.filter(x=>Number(x.saved.spd)>0).length),'Dados para simulação')+'</div>'+
   '<div class="n2-collection-tools">'+
   '<label class="fieldlabel" for="n2-account-filter">Buscar na conta</label>'+
   '<input id="n2-account-filter" class="select" placeholder="Nome, ID ou caminho" type="search" oninput="N2.filterAccount(this.value)">'+
   '<button class="btn gold" onclick="N2.navigate(\'scan\')">+ Importar / cadastrar</button></div></div>'+
   '<div class="n2-collection-grid" id="n2-account-list">'+
   (entries.length?entries.map(characterCard).join(''):a.empty('Sua coleção está vazia neste navegador','Não encontrei uma conta salva neste dispositivo. É possível importar um backup antigo, cadastrar um personagem ou usar o Nexus antigo para sincronizar.', 'Abrir importação',"N2.navigate('scan')"))+'</div>'+
   '<div class="alert n2-info"><strong>Sobre a sincronização</strong><p>Esta reconstrução lê os dados locais do Nexus anterior sem substituí-los. O acesso à conta em outros dispositivos depende de uma integração cloud validada e ainda não está ativado aqui.</p>'+
   '<a href="../" class="n2-plain-link">Abrir Nexus anterior, caso precise acessar a sincronização antiga</a></div>';
 },
 character:()=>{
  const id=a.selectedId(),c=a.gameChar(id),s=a.character(id);
  if(!id)return a.head('PERSONAGENS','Escolha sua ficha','Selecione um personagem da sua conta.')+
   a.empty('Nenhum personagem selecionado','Abra a sua coleção para escolher alguém.','Ir para minha conta',"N2.navigate('account')");
  const name=c?.name||a.named(id);
  return '<div class="n2-back"><button onclick="N2.navigate(\'account\')">← Minha conta</button></div>'+
   '<div class="profile-cover n2-profile-cover">'+
   '<div class="profile-text"><span class="sect-label">'+esc(c?.element||'PERSONAGEM')+' · '+esc(c?.path||'')+'</span>'+
   '<h1>'+esc(name)+'</h1><p>Ficha construída a partir dos registros salvos da sua conta. Os números indisponíveis permanecem em branco.</p>'+
   '<div class="chiprow">'+chip('NV '+(s.level||'—'))+chip('E'+(s.e??0))+
   chip(s.cone?'Cone registrado':'Cone pendente')+'</div>'+
   '<button class="btn gold" style="margin-top:16px" onclick="N2.openCharacterEditor()">Editar informações</button></div>'+
   '<div class="char-portrait img">'+a.img(id,'portrait')+'</div></div>'+
   '<div class="tabs n2-scroll-tabs" id="profile-tabs">'+
   [['overview','Visão geral'],['relics','Relíquias'],['kit','Habilidades'],['eidolons','Eidolons'],['history','Histórico']].map(([key,label])=>
   '<button class="'+(currentProfileTab===key?'on':'')+'" onclick="profileTab(\''+key+'\',this)">'+label+'</button>').join('')+'</div>'+
   '<div id="profile-pane" class="n2-profile-pane"></div>';
 },
 plan:()=>{
  const goals=a.data.goals,remaining=goals.filter(x=>!x.done),completed=goals.length-remaining.length;
  return a.head('PLANEJAMENTO PESSOAL','Meu plano','Objetivos de evolução, farm e preparação. Tudo salvo neste navegador.')+
   '<div class="card n2-daily"><div class="split-top"><span class="sect-label">NEXUS DAILY</span>'+chip('ATUALIZA NA CONTA','good')+'</div>'+
   '<h3>'+ (remaining.length?'Você tem '+remaining.length+' objetivo'+(remaining.length===1?'':'s')+' em aberto':'Seu planejamento começa com uma meta')+'</h3>'+
   '<p>'+ (remaining.length?'Conclua suas etapas e o Nexus atualizará sua lista de prioridades.':'Escolha um personagem ou escreva uma meta para iniciar.')+'</p>'+
   '<div class="progress"><i style="width:'+Math.round(goals.length?completed/goals.length*100:0)+'%"></i></div>'+
   '<div class="goal-foot"><span>'+completed+' de '+goals.length+' concluídos</span><button onclick="N2.addGoal()">+ Nova meta</button></div></div>'+
   section('Minhas metas','Você pode concluir, reabrir ou excluir')+
   (goals.length?'<div class="stack">'+goals.map((g,i)=>
    '<div class="goal '+(g.done?'done':'')+'"><strong>'+(g.done?'✓ ':'')+esc(g.title)+'</strong>'+
    (g.note?'<p>'+esc(g.note)+'</p>':'')+
    '<div class="goal-foot"><span>'+ (g.done?'Concluído':'Em andamento')+'</span><div class="n2-row">'+
    '<button onclick="N2.toggleGoal('+i+')">'+(g.done?'Reabrir':'Concluir')+'</button>'+
    '<button onclick="N2.removeGoal('+i+')">Excluir</button></div></div></div>').join('')+'</div>':
    a.empty('Nenhum objetivo cadastrado','Suas metas serão organizadas aqui, com progresso e prioridades.','Criar primeira meta','N2.addGoal()'))+
   section('Laboratórios de planejamento')+
   '<div class="twocol"><div class="card"><span class="sect-label">TURNOS E EQUIPES</span><h3>Speed Lab</h3><p>Use as velocidades salvas dos seus personagens para comparar a ordem das ações.</p>'+actionRoute('speed','Abrir Speed Lab')+'</div>'+
   '<div class="card"><span class="sect-label">BANNERS E RECURSOS</span><h3>Warp Advisor</h3><p>Acompanhe pity, garantia e pior caso de consumo de passes.</p>'+actionRoute('warp','Abrir Warp Advisor')+'</div></div>';
 },
 endgame:()=>{
  const mode=a.endMode||'moc',names={moc:'Memória do Caos',pf:'Pura Ficção',as:'Sombra Apocalíptica',aa:'Arbitragem de Anomalias'};
  const saved=a.data.teams[mode]||{a:[],b:[],notes:''};
  const opts=owned().map(x=>'<option value="'+esc(x.id)+'">'+esc(x.char?.name||a.named(x.id))+'</option>').join('');
  return a.head('ARQUIVO DE DESAFIOS','Endgame','Monte duas equipes reais sem repetir o mesmo personagem entre as metades.')+
   '<div class="seg n2-mode-tabs">'+Object.entries(names).map(([id,label])=>
    '<button class="'+(mode===id?'on':'')+'" onclick="N2.setEndMode(\''+id+'\')">'+label+'</button>').join('')+'</div>'+
   '<div class="alert n2-info"><strong>Ciclo atual não confirmado neste módulo.</strong><p>Não vou inventar chefes, fraquezas, buffs nem previsões de tempo. As informações de ciclo precisam vir de uma fonte revisada e datada.</p></div>'+
   section('Planejar metades','Personagens selecionados são salvos neste dispositivo')+
   '<div class="twocol">'+['a','b'].map((side,i)=>
    '<div class="card n2-team-panel"><span class="sect-label">METADE '+(i?'B':'A')+'</span><h3>Equipe '+(i+1)+'</h3>'+
    '<div class="n2-team-slots">'+[0,1,2,3].map(slot=>{
     const id=saved[side]?.[slot]||'';
     return '<label class="n2-team-slot"><span>Slot '+(slot+1)+'</span><select class="select" onchange="N2.assignTeam(\''+side+'\','+slot+',this.value)">'+
      '<option value="">Selecionar...</option>'+owned().map(x=>
      '<option value="'+esc(x.id)+'" '+(String(id)===String(x.id)?'selected':'')+'>'+
       esc(x.char?.name||a.named(x.id))+'</option>').join('')+'</select></label>'}).join('')+'</div></div>').join('')+'</div>'+
   '<div class="card"><label class="fieldlabel" for="n2-end-notes">Estratégia e anotações</label>'+
   '<textarea id="n2-end-notes" class="n2-textarea" rows="4" placeholder="Mecânicas observadas, ordem de turnos, restrições..." oninput="N2.saveEndNotes(this.value)">'+esc(saved.notes||'')+'</textarea>'+
   '<p class="n2-fineprint">As análises futuras utilizarão esta composição e sua build real. Esta versão oferece o planejador de equipes.</p></div>';
 },
 tools:()=>a.head('FERRAMENTAS','Laboratório do Nexus','Todas as ferramentas disponíveis, agrupadas por finalidade.')+
  '<div class="n2-tool-groups">'+[
   ['MINHA CONTA',['character','scan','relics']],['OTIMIZAÇÃO',['speed','warp','endgame']],['EXPLORAÇÃO',['atlas','radar','pompom']],['PERSONALIZAÇÃO',['themes','settings']]
  ].map(([title,ids])=>'<div>'+section(title)+
   '<div class="outline-grid">'+ids.map(id=>{
    const r=routes.find(r=>r[0]===id);
    return '<button class="tile" onclick="N2.navigate(\''+id+'\')">'+ico(r?.[2]||'star')+
     '<strong>'+esc(r?.[1]||id)+'</strong><small>Abrir ferramenta ↗</small></button>';
   }).join('')+'</div></div>').join('')+'</div>'
};
a.filterAccount=q=>{
 const query=String(q).trim().toLowerCase(),root=document.getElementById('n2-account-list');
 if(!root)return;const visible=owned().filter(x=>
  !query||String(x.id).includes(query)||String(x.char?.name||a.named(x.id)).toLowerCase().includes(query)||
  String(x.char?.path||'').toLowerCase().includes(query));
 root.innerHTML=visible.length?visible.map(characterCard).join(''):a.empty('Nenhum personagem corresponde','Experimente outra busca.');
};
a.addGoal=()=>{
 const title=prompt('Qual objetivo você quer acompanhar?');if(!title?.trim())return;
 const note=prompt('Detalhes ou etapas adicionais (opcional):')||'';
 a.data.goals.unshift({title:title.trim().slice(0,140),note:note.trim().slice(0,500),done:false,created:Date.now()});
 if(a.save())a.updatePage('plan');
};
a.toggleGoal=i=>{const g=a.data.goals[i];if(!g)return;g.done=!g.done;a.save();a.updatePage('plan');};
a.removeGoal=i=>{
 if(!a.data.goals[i]||!confirm('Excluir este objetivo do Nexus 2.0?'))return;
 a.data.goals.splice(i,1);a.save();a.updatePage('plan');
};
a.endMode='moc';
a.setEndMode=id=>{a.endMode=id;a.updatePage('endgame');};
a.assignTeam=(side,index,id)=>{
 const mode=a.endMode,record=a.data.teams[mode]||={a:[],b:[],notes:''};
 if(id){
  const used=[...(side==='a'?record.b:record.a),...record[side].filter((x,i)=>i!==index)];
  if(used.includes(id)){a.note('Este personagem já está em outro slot.','error');a.updatePage('endgame');return;}
 }
 record[side][index]=id;a.save();a.updatePage('endgame');
};
a.saveEndNotes=value=>{
 const record=a.data.teams[a.endMode]||={a:[],b:[],notes:''};
 record.notes=String(value).slice(0,3000);a.save();
};
a.openCharacterEditor=()=>{
 const id=a.selectedId();if(!id)return;
 const s=a.character(id);
 const input=document.createElement('div');
 input.innerHTML='<div class="n2-form-grid">'+
 [['level','Nível','1','80'],['e','Eidolons','0','6'],['s','Sobreposição do cone','1','5'],
 ['pv','PV','0','999999'],['atk','ATQ','0','99999'],['def','DEF','0','99999'],['spd','VEL','0','999'],
 ['critRate','Taxa CRIT (%)','0','100'],['critDmg','Dano CRIT (%)','0','999']].map(([key,label,min,max])=>
 '<label>'+label+'<input class="select" type="number" step="any" data-char-field="'+key+'" min="'+min+'" max="'+max+'" value="'+esc(s[key]??'')+'"></label>').join('')+
 '<label class="n2-full">Cone de luz (nome ou ID)<input class="select" data-char-field="cone" value="'+esc(s.cone||'')+'"></label></div>'+
 '<p class="n2-fineprint">Salva apenas na versão 2.0. A ficha original continua preservada.</p>';
 const dialog=document.querySelector('#modal-backdrop');
 document.getElementById('modal-title').textContent='Editar '+a.named(id);
 document.getElementById('modal-body').replaceChildren(input);
 const buttons=dialog.querySelector('.actions');buttons.innerHTML='<button class="btn ghost" onclick="closeModal()">Cancelar</button>'+
 '<button class="btn gold" onclick="N2.saveCharacterEditor()">Salvar ficha</button>';
 dialog.classList.add('open');
};
a.saveCharacterEditor=()=>{
 const id=a.selectedId(),fields={};
 document.querySelectorAll('[data-char-field]').forEach(input=>{
  const key=input.dataset.charField,value=input.value.trim();
  if(!value)return;
  fields[key]=key==='cone'?value:Number(value);
 });
 a.data.characters[id]={...a.character(id),...fields};
 a.data.history.unshift({id,created:Date.now(),summary:'Ficha editada',values:fields});
 a.data.history=a.data.history.slice(0,80);
 if(a.save()){closeModal();a.updatePage('character');renderProfile();a.note('Ficha atualizada.');}
};
function stat(value,suffix=''){return value===undefined||value===null?'—':a.stat(value,2)+suffix;}
a.profileContent=()=>{
 const id=a.selectedId(),saved=a.character(id),game=a.gameChar(id);
 if(currentProfileTab==='overview'){
  return '<div class="profile-stat-grid">'+
   metric('PV',stat(saved.pv??saved.hp),'Pontos de vida')+
   metric('ATQ',stat(saved.atk),'Ataque')+
   metric('DEF',stat(saved.def),'Defesa')+
   metric('VEL',stat(saved.spd??saved.speed),'Velocidade')+
   metric('Taxa CRIT',stat(saved.critRate??saved.cr,'%'),'')+
   metric('Dano CRIT',stat(saved.critDmg??saved.cd,'%'),'')+'</div>'+
   section('Equipamento atual','Informações da sua conta')+
   '<div class="twocol"><div class="card"><span class="sect-label">CONE DE LUZ</span><h3>'+esc(saved.cone||'Não informado')+'</h3><p>Sobreposição: '+esc(saved.s??'—')+'</p></div>'+
   '<div class="card"><span class="sect-label">RELIQUIAS</span><h3>'+a.relicSlots(id).filter(Boolean).length+' peças com dados</h3>'+
   '<p>Veja o conjunto e os subatributos na aba Relíquias.</p></div></div>';
 }
 if(currentProfileTab==='relics'){
  const list=a.relicSlots(id);
  return section('Relíquias do personagem','Seis posições de equipamento')+
   '<div class="gear-grid">'+['Cabeça','Mãos','Corpo','Pés','Esfera','Corda'].map((name,i)=>{
    const r=list[i],set=a.game?.relicSets?.[r?.setId||r?.set_id],
     main=r?.main,sub=(r?.subs||[]).slice(0,5).map(z=>esc(z.stat||z.name)+': '+esc(z.value??'?')).join(' · ');
    return '<div class="gear"><span>✦</span><b>'+name+'</b><small>'+
     (r?esc(set?.name||r?.setId||'Conjunto não identificado')+' · +'+esc(r.level||0):'Não importada')+
     '</small><small>'+esc(main?(main.stat||'Atributo')+' '+(main.value??''):'')+'</small>'+
     (sub?'<small>'+sub+'</small>':'')+'</div>';
   }).join('')+'</div><div class="alert"><strong>Fonte:</strong> registros disponíveis no dispositivo. Campos ausentes não são inventados.</div>';
 }
 if(currentProfileTab==='kit'){
  const skills=(game?.skills||[]).map(k=>a.game?.skills?.[k]).filter(Boolean);
  if(!skills.length)return a.empty('Kit ainda não disponível no catálogo','Quando houver uma descrição verificada no arquivo do jogo, ela aparecerá aqui.');
  return section('Habilidades oficiais',a.statusText())+
   '<div class="n2-kit-list">'+skills.map((skill,i)=>
    '<details class="kit" '+(i===0?'open':'')+'><summary>'+esc(skill.type_text||'Habilidade')+' · '+esc(skill.name)+'</summary>'+
    '<p>'+esc(skill.desc||'Sem descrição no catálogo')+'</p>'+
    '<small>Multiplicadores entre níveis variam e devem ser consultados no nível correto.</small></details>').join('')+'</div>';
 }
 if(currentProfileTab==='eidolons'){
  const ranks=(game?.ranks||[]).map(k=>a.game?.ranks?.[k]).filter(Boolean);
  if(!ranks.length)return a.empty('Eidolons sem dados','Nenhuma descrição oficial encontrada no catálogo local.');
  return section('Eidolons E1–E6',a.statusText())+
   '<div class="threecol">'+ranks.map((r,i)=>
    '<div class="card"><span class="sect-label">E'+(i+1)+'</span><h3>'+esc(r.name)+'</h3><p>'+esc(r.desc||'Descrição indisponível')+'</p></div>').join('')+'</div>';
 }
 const history=a.data.history.filter(x=>x.id===id);
 return section('Histórico de alterações','Registro do Nexus 2.0')+
  (history.length?'<div class="stack">'+history.map(x=>
   '<div class="goal"><strong>'+esc(x.summary)+'</strong><p>'+new Date(x.created).toLocaleString('pt-BR')+'</p></div>').join('')+'</div>':
   a.empty('Sem alterações nesta versão','As edições da ficha feitas aqui criarão registros para acompanhamento.'));
};
a.relicSlots=id=>{
 const raw=a.getOriginal()?.v06RelicDetails?.[id]||a.getOriginal()?.relicDetails?.[id]||[];
 return Array.isArray(raw)?raw:[];
};
a.renderProfile=()=>{
 const pane=document.getElementById('profile-pane');
 if(pane)pane.innerHTML=a.profileContent();
};
})();