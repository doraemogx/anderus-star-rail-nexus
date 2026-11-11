/* Nexus 2.0 — practical modules, scans, tools and generated-theme workflow. */
(function(){
'use strict';
const a=window.N2,esc=a.esc;
const show=id=>a.navigate(id);
const tag=(s)=>'<span class="chip">'+esc(s)+'</span>';
a.modules={
 scan:()=>a.head('IMPORTAÇÃO SEGURA','Nexus Scan','Atualize sua conta sem perder os dados do Nexus anterior.')+
  '<div class="n2-scan-grid"><div class="card"><span class="sect-label">01 · DADOS DA CONTA</span><h3>Importar um backup</h3>'+
  '<p>Importa o JSON do Nexus anterior ou de uma versão 2.0. Você revisa e confirma antes de substituir os dados desta versão.</p>'+
  '<label class="btn gold n2-file-label">Selecionar JSON<input type="file" accept=".json,application/json" hidden onchange="N2.importFile(this)"></label>'+
  '<div class="n2-divider">ou</div><h3>Adicionar personagem</h3><p>Selecione pelo nome no catálogo do jogo. A ficha ficará vazia até você informar os atributos.</p>'+
  '<button class="btn ghost" onclick="N2.addManualCharacter()">+ Escolher personagem</button></div>'+
  '<div class="card"><span class="sect-label">02 · HOYOLAB</span><h3>Conferir captura de tela</h3>'+
  '<p>É possível abrir o print e preencher os números da ficha manualmente. A leitura automática por imagem ainda não está habilitada nesta versão.</p>'+
  '<label class="n2-file-drop">✧<strong>Adicionar print</strong><small>PNG, JPG ou WebP · arquivo tratado localmente</small>'+
  '<input type="file" accept="image/png,image/jpeg,image/webp" hidden onchange="N2.previewScan(this)"></label>'+
  '<div id="n2-scan-image"></div></div></div>'+
  '<div class="alert n2-info"><strong>Integridade da sua conta</strong><p>O Nexus 2.0 não sobrescreve os dados originais do aplicativo antigo. O OCR ainda precisa ser implementado e validado com os formatos reais da HoYoLAB; nunca vou preencher relíquias inventando atributos.</p></div>',
 speed:()=>{
  const candidates=a.owned().map(id=>({id,spd:Number(a.character(id).spd||0)}));
  if(!candidates.length)return a.head('LABORATÓRIO DE TURNO','Speed Lab','Simulação de AV básico da sua conta.')+
   a.empty('Nenhum personagem para simular','Importe sua coleção ou adicione personagens para começar.','Minha conta',"N2.navigate('account')");
  const selections=(a.speedGroup||candidates.slice(0,4).map(c=>c.id));
  a.speedGroup=Array.from({length:4},(_,i)=>selections[i]||'');
  return a.head('LABORATÓRIO DE TURNO','Speed Lab','Experimente velocidades e veja o impacto na ordem das ações.')+
   '<div class="card"><div class="split-top"><span class="sect-label">SIMULAÇÃO BÁSICA DE ACTION VALUE</span>'+tag('10.000 ÷ VEL')+'</div>'+
   '<p>Selecione até quatro personagens. A linha do tempo exibe eventos a cada turno sem buffs, avanços de ação ou atrasos.</p>'+
   '<div class="n2-speed-config">'+a.speedGroup.map((id,i)=>{
    const current=id?a.character(id):{};
    const speed=Number(a.data.speed[id]||current.spd||current.speed||100);
    return '<div class="n2-speed-person"><label>Personagem '+(i+1)+'</label><select class="select" onchange="N2.changeSpeedCharacter('+i+',this.value)">'+
      '<option value="">Vazio</option>'+candidates.map(item=>'<option value="'+esc(item.id)+'" '+(String(id)===item.id?'selected':'')+'>'+esc(a.named(item.id))+'</option>').join('')+'</select>'+
      '<div class="slideline"><input type="range" aria-label="VEL '+(i+1)+'" min="90" max="250" value="'+speed+'" '+(!id?'disabled':'')+
      ' oninput="N2.changeSpeed('+i+',this.value)"><output id="n2-speed-val-'+i+'">'+speed+' VEL</output></div></div>';
   }).join('')+'</div><div id="n2-speed-visual"></div></div>'+
   '<div class="alert"><strong>Limite do cálculo:</strong> o modelo determinístico não inclui modificadores temporários, avanços de ação, técnicas nem cones que alteram a velocidade. Evita resultados falsamente precisos.</div>';
 },
 atlas:()=>{
  const data=a.data.achievements||{},names=Object.entries(data),completed=names.filter(([id,v])=>v.done).length;
  return a.head('EXPLORAÇÃO DO UNIVERSO','Atlas de Conquistas','Sua lista pessoal de conquistas e segredos para explorar.')+
   '<div class="fourcol">'+a.statCard('REGISTRADAS',String(names.length),'Lista pessoal')+
   a.statCard('CONCLUÍDAS',String(completed),'Checklist')+
   a.statCard('PENDENTES',String(names.length-completed),'Por concluir')+
   a.statCard('PROGRESSO',names.length?Math.round(completed/names.length*100)+'%':'—','Concluídas')+'</div>'+
   '<div class="n2-collection-tools"><button class="btn gold" onclick="N2.addAchievement()">+ Adicionar conquista</button>'+
   '<div class="seg" id="n2-ach-filters"><button class="'+(a.achFilter==='all'?'on':'')+'" onclick="N2.setAchievementFilter(\'all\')">Todas</button>'+
   '<button class="'+(a.achFilter==='open'?'on':'')+'" onclick="N2.setAchievementFilter(\'open\')">Pendentes</button>'+
   '<button class="'+(a.achFilter==='done'?'on':'')+'" onclick="N2.setAchievementFilter(\'done\')">Concluídas</button></div></div>'+
   '<div id="n2-ach-list"></div><div class="alert n2-info"><strong>Próxima integração:</strong> mapa de locais, requisitos e recompensas verificados. Nesta etapa o Atlas já funciona como checklist persistente, sem simular uma base de conquistas oficial.</div>';
 },
 relics:()=>{
  const entries=a.owned().flatMap(id=>a.relicSlots(id).filter(Boolean).map((relic,i)=>({id,relic,i})));
  return a.head('INVENTÁRIO DE EQUIPAMENTO','Relic Vault','Revise peças que já foram registradas na sua conta.')+
   '<div class="fourcol">'+a.statCard('PEÇAS',String(entries.length),'Relíquias identificadas')+
   a.statCard('PERSONAGENS',String(new Set(entries.map(x=>x.id)).size),'Com equipamentos')+
   a.statCard('CONJUNTOS',String(new Set(entries.map(x=>x.relic.setId||x.relic.set_id).filter(Boolean)).size),'Diferentes')+
   a.statCard('NÃO IDENTIFICADAS','—','Scan pendente')+'</div>'+
   section('Peças equipadas','Dados originais preservados')+
   (entries.length?'<div class="n2-relic-grid">'+entries.map(({id,relic,i})=>{
    const set=a.game?.relicSets?.[relic.setId||relic.set_id],main=relic.main||{},
      subs=(relic.subs||[]).map(x=>esc(x.stat||x.name)+': '+esc(x.value??'')).join(' · ');
    return '<button class="relic n2-relic-card" onclick="N2.selectCharacter(\''+esc(id)+'\')">'+
     '<small>'+esc(a.named(id))+'</small><strong>'+esc(set?.name||'Conjunto '+(relic.setId||relic.set_id||'?'))+'</strong>'+
     '<small>'+esc(main.stat||'Atributo')+' '+esc(main.value??'')+' · +'+esc(relic.level??0)+'</small>'+
     '<span class="n2-relic-sub">'+(subs||'Subatributos não identificados')+'</span><span class="score">Ver ficha ↗</span></button>';
   }).join('')+'</div>':a.empty('Nenhuma relíquia registrada','Importe uma ficha do Nexus anterior que tenha detalhes das relíquias para visualizá-las aqui.','Nexus Scan',"N2.navigate('scan')"))+
   '<div class="alert"><strong>Importante:</strong> nenhum score de relíquia é exibido sem um critério matemático validado para o personagem.</div>';
 },
 warp:()=>{
  const w=a.data.warp;
  return a.head('PLANEJAMENTO DE BANNERS','Warp Advisor','Calcule limites de tiros sem confundir garantia com probabilidade.')+
  '<div class="twocol"><div class="card"><span class="sect-label">BANNER DE PERSONAGEM</span><h3>Seu próximo alvo</h3>'+
  '<label class="fieldlabel" for="n2-pity">Pity atual (0–89)</label><input class="select" id="n2-pity" type="number" min="0" max="89" value="'+Number(w.pity||0)+'" oninput="N2.updateWarp()">'+
  '<label class="fieldlabel" for="n2-shots">Tiros disponíveis</label><input class="select" id="n2-shots" type="number" min="0" value="'+Number(w.shots||0)+'" oninput="N2.updateWarp()">'+
  '<label class="fieldlabel" for="n2-guarantee">Garantia do destaque</label><select class="select" id="n2-guarantee" onchange="N2.updateWarp()">'+
  '<option value="no">Não garantido</option><option value="yes" '+(w.guaranteed?'selected':'')+'>Garantido</option></select>'+
  '<p class="n2-fineprint">Modelo conservador de banner de personagem com teto de 90 tiros. Não representa as probabilidades reais do resultado.</p></div>'+
  '<div class="card n2-warp-results"><span class="sect-label">CENÁRIOS</span><h3 id="n2-warp-title">Calculando...</h3>'+
  '<div id="n2-warp-info"></div><div class="progress"><i id="n2-warp-bar" style="width:0"></i></div>'+
  '<div class="n2-fineprint">Limite teórico, não previsão de quantos tiros você realmente precisará.</div></div></div>';
 },
 radar:()=>a.head('OBSERVATÓRIO','Radar do Nexus','Novidades oficiais e mudanças beta com indicação explícita da fonte.')+
  '<div class="card"><span class="sect-label">CATÁLOGO DE PERSONAGENS</span><h3>'+esc(a.statusText())+'</h3>'+
  '<p>Dados de nomes, habilidades, Eidolons, cones e relíquias vêm do catálogo estruturado sincronizado no repositório do Nexus.</p>'+
  '<div class="chiprow">'+tag(String(a.catalog().length)+' personagens catalogados')+tag('Fonte: StarRailRes')+'</div></div>'+
  '<div id="n2-radar-updates" class="n2-radar-list">'+a.empty('Verificando atualização editorial','Os dados beta serão exibidos com data e etiqueta de confirmação.')+'</div>'+
  '<div class="alert n2-info"><strong>Sobre a atualização automática</strong><p>Este módulo exibe os dados publicados no repositório. Não consulta vazamentos ou anúncios em tempo real por conta própria.</p></div>',
 pompom:()=>a.head('ASSISTENTE DO EXPRESSO','Pom-Pom','Uma orientação prática baseada no que já está salvo na sua conta.')+
  '<div class="n2-pompom-top"><div class="n2-pompom-img">'+
   '<img src="../assets/official/pompom-hoyoverse.jpg" loading="lazy" alt="Pom-Pom"></div>'+
  '<div><span class="sect-label">GUIA DE BORDO</span><h3>Em que posso ajudar agora?</h3><p>Escolha um tipo de orientação. As sugestões usam informações locais e indicam quando faltam dados.</p></div></div>'+
  '<div class="n2-pompom-options"><button onclick="N2.pomAdvice(\'build\')">✦ Prioridades da minha build</button>'+
  '<button onclick="N2.pomAdvice(\'farm\')">◈ Meu próximo objetivo</button>'+
  '<button onclick="N2.pomAdvice(\'turn\')">⧗ Equipe e velocidade</button>'+
  '<button onclick="N2.pomAdvice(\'warp\')">✧ Planejar meus tiros</button></div>'+
  '<div class="card" id="n2-pom-answer"><h3>Bem-vindo a bordo!</h3><p>As respostas daqui são regras explicáveis, e não simulações de um chatbot conectado a uma IA.</p></div>',
 themes:()=>{
  const catalog=a.catalog(),last=a.themeSelected||a.selectedId()||catalog[0]?.id||'';
  a.themeSelected=String(last);
  const generated=a.data.themes||[],active=a.data.activeTheme;
  return a.head('ATELIÊ DE IDENTIDADES','Theme Studio GPT','Um tema por personagem, criado sob demanda no ChatGPT. Sem modelos prontos de personagem.')+
   '<div class="n2-theme-hero"><span class="sect-label">ESTÚDIO DE CRIAÇÃO</span><h2>Um universo só seu.</h2>'+
   '<p>Escolha qualquer personagem, gere um briefing detalhado e use o ChatGPT para criar sua identidade completa. Os temas concluídos são importados e ativados aqui.</p></div>'+
   '<div class="card"><span class="sect-label">01 · PERSONAGEM</span><h3>Quem vai transformar seu Nexus?</h3>'+
   '<input type="search" class="select" id="n2-theme-search" placeholder="Buscar no catálogo do Honkai" oninput="N2.filterThemes(this.value)">'+
   '<div class="n2-theme-picker" id="n2-theme-picker"></div>'+
   '<div class="n2-theme-selection" id="n2-theme-selection"></div></div>'+
   '<div class="card"><span class="sect-label">02 · DIREÇÃO CRIATIVA</span><h3>Personalize a proposta</h3>'+
   '<label class="fieldlabel" for="n2-theme-direction">Linguagem visual</label><select id="n2-theme-direction" class="select" onchange="N2.themeBrief()">'+
   '<option>Canônica, cinematográfica e imersiva</option><option>Minimalista, elegante e inspirada na personagem</option>'+
   '<option>Épica, com efeitos e atmosfera marcantes</option></select>'+
   '<label class="fieldlabel" for="n2-theme-motion">Intensidade dos efeitos</label>'+
   '<select id="n2-theme-motion" class="select" onchange="N2.themeBrief()"><option>Sutil e acessível</option><option>Moderada</option><option>Cinematográfica, com redução de movimento respeitada</option></select></div>'+
   '<div class="card"><span class="sect-label">03 · CRIAR COM O GPT</span><h3>Briefing para implementação real</h3>'+
   '<p>Este prompt solicita um projeto completo de interface, componentes, animações, testes e identidade para as 14 telas.</p>'+
   '<div class="codebox n2-brief" id="n2-theme-prompt"></div>'+
   '<div class="n2-actions"><button class="btn gold" onclick="N2.copyTheme()">Copiar briefing</button>'+
   '<button class="btn ghost" onclick="N2.openChatGPT()">Abrir ChatGPT</button></div>'+
   '<p class="n2-fineprint">O site não gera CSS automaticamente no ChatGPT nem publica no GitHub sem uma execução autorizada nessa conversa.</p></div>'+
   section('Identidades já geradas','Somente temas realmente importados')+
   (generated.length?'<div class="outline-grid">'+generated.map((t,i)=>
    '<div class="card"><span class="sect-label">CRIADO PELO GPT</span><h3>'+esc(t.name||'Tema')+'</h3>'+
    '<p>'+esc(t.character||'Identidade personalizada')+'</p>'+
    '<button class="btn '+(i===active?'gold':'ghost')+'" onclick="N2.activateTheme('+i+')">'+(i===active?'Ativo':'Ativar tema')+'</button>'+
    '<button class="btn ghost" onclick="N2.removeTheme('+i+')">Excluir</button></div>').join('')+'</div>':
    a.empty('Nenhum tema gerado ainda','Isso é intencional. O tema da Aha antiga não foi migrado; cada identidade precisará ser criada pelo GPT.'))+
   '<div class="card"><span class="sect-label">IMPORTAR CRIAÇÃO</span><h3>Adicionar o tema finalizado</h3>'+
   '<p>Depois da implementação aprovada, importe o arquivo JSON de identidade com paleta e fontes seguras. Mudanças estruturais completas são publicadas em código testado, não por CSS arbitrário colado no navegador.</p>'+
   '<label class="btn ghost n2-file-label">Importar tema JSON<input type="file" accept=".json,application/json" hidden onchange="N2.importThemeFile(this)"></label></div>';
 },
 settings:()=>a.head('CONTROLES DO EXPRESSO','Configurações','Backup, privacidade e informações técnicas em linguagem clara.')+
   '<div class="card"><span class="sect-label">DADOS E SEGURANÇA</span><h3>Seus dados pertencem a você</h3>'+
   '<div class="setting"><div><strong>Dados do Nexus anterior</strong><small>Somente leitura; permanecem preservados.</small></div>'+tag(a.owned().length+' fichas')+'</div>'+
   '<div class="setting"><div><strong>Alterações no Nexus 2.0</strong><small>Gravadas apenas no armazenamento deste navegador.</small></div>'+tag('Local')+'</div>'+
   '<div class="setting"><div><strong>Cloud e login</strong><small>Ainda não conectados à nova arquitetura.</small></div>'+tag('Pendente')+'</div>'+
   '<div class="n2-actions"><button class="btn gold" onclick="N2.export()">Exportar backup completo</button>'+
   '<label class="btn ghost n2-file-label">Restaurar backup<input type="file" accept=".json" hidden onchange="N2.importFile(this)"></label></div></div>'+
   '<div class="card"><span class="sect-label">EXPERIÊNCIA</span><h3>Conforto visual</h3>'+
   '<div class="setting"><div><strong>Reduzir animações</strong><small>Desativa movimentos decorativos adicionais.</small></div>'+
   '<input type="checkbox" '+(a.data.settings.reduceMotion?'checked':'')+' onchange="N2.setReducedMotion(this.checked)" aria-label="Reduzir animações"></div></div>'+
   '<div class="card"><span class="sect-label">NEXUS 2.0</span><h3>Sobre a reconstrução</h3>'+
   '<p>Nova aplicação modular e responsiva, separada do Nexus anterior. Importação manual, ferramentas locais e conteúdo oficial do catálogo sincronizado.</p>'+
   '<p class="n2-fineprint">'+esc(a.statusText())+'</p>'+
   '<a class="n2-plain-link" href="../">Abrir a versão anterior do Nexus</a></div>'
};
a.addManualCharacter=()=>{
 const chars=a.catalog();
 if(!chars.length){a.note('Catálogo ainda não carregado.','error');return;}
 const text=prompt('Digite o nome ou ID do personagem:');if(!text?.trim())return;
 const q=text.trim().toLowerCase();const choices=chars.filter(c=>String(c.id)===q||c.name.toLowerCase().includes(q));
 if(!choices.length){a.note('Personagem não encontrado no catálogo.','error');return;}
 if(choices.length>1){a.note('Encontrados: '+choices.slice(0,4).map(x=>x.name).join(', ')+'. Seja mais específico.','error');return;}
 const c=choices[0];if(a.owned().includes(c.id)){a.setSelected(c.id);navigate('character');return;}
 a.data.characters[c.id]={level:1,e:0,s:1};
 if(a.save()){a.setSelected(c.id);a.note(c.name+' adicionado.');navigate('character');}
};
a.previewScan=input=>{
 const file=input.files?.[0];if(!file)return;
 const zone=document.getElementById('n2-scan-image');if(!zone)return;
 if(file.size>12*1024*1024||!/^image\/(png|jpeg|webp)$/.test(file.type)){a.note('Use uma imagem PNG, JPG ou WebP com até 12 MB.','error');return;}
 const url=URL.createObjectURL(file);zone.innerHTML='<div class="n2-scan-preview"><img alt="Captura selecionada para conferência" src="'+url+'">'+
 '<p>Confira a imagem visualmente e atualize a ficha do personagem. OCR automático ainda não habilitado.</p>'+
 '<button class="btn gold" onclick="N2.navigate(\'account\')">Escolher ficha da conta</button></div>';
 input.value='';
};
a.achFilter='all';
a.addAchievement=()=>{
 const name=prompt('Qual conquista ou segredo quer acompanhar?');if(!name?.trim())return;
 const note=prompt('Local ou dica (opcional):')||'';
 const key=String(Date.now())+'-'+Math.random().toString(36).slice(2,7);
 a.data.achievements[key]={name:name.trim().slice(0,140),note:note.slice(0,500),done:false};
 a.save();a.updatePage('atlas');a.drawAchievements();
};
a.toggleAchievement=id=>{const item=a.data.achievements[id];if(!item)return;item.done=!item.done;a.save();a.updatePage('atlas');a.drawAchievements();};
a.deleteAchievement=id=>{
 if(!confirm('Excluir esta conquista do checklist?'))return;
 delete a.data.achievements[id];a.save();a.updatePage('atlas');a.drawAchievements();
};
a.setAchievementFilter=key=>{a.achFilter=key;a.updatePage('atlas');a.drawAchievements();};
a.drawAchievements=()=>{
 const root=document.getElementById('n2-ach-list');if(!root)return;
 const entries=Object.entries(a.data.achievements).filter(([id,v])=>
 a.achFilter==='all'||a.achFilter==='done'&&v.done||a.achFilter==='open'&&!v.done);
 root.innerHTML=entries.length?'<div class="stack">'+entries.map(([id,v])=>
  '<div class="achievement '+(v.done?'checked':'')+'"><span class="a-medal">✦</span>'+
  '<div style="flex:1"><strong>'+esc(v.name)+'</strong><small>'+esc(v.note||'Conquista pessoal')+'</small></div>'+
  '<div class="n2-row"><button onclick="N2.toggleAchievement(\''+id+'\')">'+(v.done?'Reabrir':'Concluir')+'</button>'+
  '<button onclick="N2.deleteAchievement(\''+id+'\')">Excluir</button></div></div>').join('')+'</div>':
 a.empty(a.data.achievements&&Object.keys(a.data.achievements).length?'Nenhum registro neste filtro':'Seu Atlas ainda está vazio',
 'Adicione conquistas e segredos que deseja concluir.');
};
a.speedGroup=null;
a.changeSpeedCharacter=(slot,id)=>{a.speedGroup[slot]=id;a.updatePage('speed');a.renderSpeed();};
a.changeSpeed=(slot,spd)=>{
 const id=a.speedGroup[slot];if(!id)return;
 a.data.speed[id]=Math.max(90,Math.min(250,Number(spd)||100));
 a.save();
 const output=document.getElementById('n2-speed-val-'+slot);if(output)output.textContent=a.data.speed[id]+' VEL';
 a.renderSpeed();
};
a.renderSpeed=()=>{
 const root=document.getElementById('n2-speed-visual');if(!root)return;
 const party=(a.speedGroup||[]).filter(Boolean).map((id,i)=>({
  id,name:a.named(id),speed:Math.max(1,Number(a.data.speed[id]||a.character(id).spd||a.character(id).speed||100))
 }));
 if(!party.length){root.innerHTML=a.empty('Escolha personagens','Selecione os participantes para calcular a ordem de ações.');return;}
 const events=party.flatMap(p=>Array.from({length:Math.floor(450/(10000/p.speed))},(_,j)=>({
  name:p.name,id:p.id,round:j+1,av:(j+1)*10000/p.speed
 }))).sort((x,y)=>x.av-y.av).slice(0,26);
 root.innerHTML='<div class="n2-timeline" aria-label="Ordem estimada de ações">'+events.map((x,i)=>
  '<div class="n2-timeline-event" style="--pct:'+Math.min(100,x.av/450*100)+'%"><span>'+esc(x.name)+'</span>'+
  '<strong>'+x.av.toFixed(1)+' AV</strong><small>Turno '+x.round+'</small></div>').join('')+'</div>'+
  '<div class="n2-table-wrap"><table class="table"><thead><tr><th>Personagem</th><th>VEL</th><th>Primeira ação</th></tr></thead><tbody>'+
  party.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+x.speed+'</td><td>'+(10000/x.speed).toFixed(2)+' AV</td></tr>').join('')+'</tbody></table></div>';
};
a.updateWarp=()=>{
 const p=document.getElementById('n2-pity'),s=document.getElementById('n2-shots'),g=document.getElementById('n2-guarantee');
 if(!p||!s||!g)return;
 const pity=Math.max(0,Math.min(89,Number(p.value)||0));
 const shots=Math.max(0,Math.floor(Number(s.value)||0)),guaranteed=g.value==='yes';
 a.data.warp={pity,shots,guaranteed};a.save();
 const next=90-pity,max=next+(guaranteed?0:90);
 document.getElementById('n2-warp-title').textContent=
  shots>=max?'Limite máximo coberto':shots>=next?'Próximo 5★ coberto':'Ainda faltam tiros';
 document.getElementById('n2-warp-info').innerHTML='<div class="fourcol">'+
 a.statCard('PRÓXIMO 5★',String(next),'Teto máximo')+
 a.statCard('DESTAQUE GARANTIDO',String(max),'Pior caso')+
 a.statCard('TIROS ATUAIS',String(shots),'Disponíveis')+
 a.statCard('SALDO',String(shots-max),'Em relação ao teto')+'</div>';
 document.getElementById('n2-warp-bar').style.width=Math.min(100,shots/Math.max(max,1)*100)+'%';
};
a.pomAdvice=key=>{
 const root=document.getElementById('n2-pom-answer');if(!root)return;
 const chars=a.owned(),goals=a.data.goals.filter(x=>!x.done);
 const answer={
  build:chars.length?'Você tem '+chars.length+' personagem(ns) salvo(s). Abra Minha Conta, escolha um personagem e confira os atributos ausentes antes de otimizar.':
   'Ainda não encontrei um elenco salvo aqui. Importe um backup ou adicione um personagem primeiro.',
  farm:goals.length?'Seu próximo objetivo aberto é: '+goals[0].title+'. Você pode acompanhar etapas em Planos.':
   'Ainda não existem objetivos pendentes. Adicione uma meta em Planos para receber uma próxima ação.',
  turn:chars.some(id=>a.character(id).spd)?'O Speed Lab consegue simular Action Value dos personagens com velocidade salva. O cálculo atual não inclui buffs ou avanços.':
   'Você precisa registrar velocidades na ficha dos personagens para comparar a ordem de ações.',
  warp:'Abra o Warp Advisor, informe pity, tiros e se o destaque está garantido. O Nexus mostrará os limites máximos, sem prometer resultado.'
 };
 root.innerHTML='<span class="sect-label">ORIENTAÇÃO DE BORDO</span><h3>Meu conselho</h3><p>'+esc(answer[key]||'Escolha um assunto.')+'</p>';
};
a.themeSelected='';
a.filterThemes=query=>{
 const root=document.getElementById('n2-theme-picker');if(!root)return;
 const q=String(query||'').trim().toLowerCase();
 const catalog=a.catalog().filter(c=>!q||c.name.toLowerCase().includes(q)).slice(0,48);
 root.innerHTML=catalog.length?catalog.map(c=>
  '<button class="n2-theme-char '+(a.themeSelected===c.id?'on':'')+'" onclick="N2.chooseThemeCharacter(\''+esc(c.id)+'\')">'+
  a.img(c.id,'icon')+'<strong>'+esc(c.name)+'</strong></button>').join(''):a.empty('Nenhum personagem encontrado','Experimente outro nome.');
};
a.chooseThemeCharacter=id=>{a.themeSelected=id;a.filterThemes(document.getElementById('n2-theme-search')?.value||'');a.themeBrief();};
a.themePromptText=()=>{
 const id=a.themeSelected,c=a.gameChar(id),name=c?.name||a.named(id);
 const direction=document.getElementById('n2-theme-direction')?.value||'Canônica, cinematográfica e imersiva';
 const motion=document.getElementById('n2-theme-motion')?.value||'Sutil e acessível';
 return [
 'PROJETO: ANDERUS STAR RAIL NEXUS 2.0 — TEMA GPT EXCLUSIVO',
 'PERSONAGEM CANÔNICO: '+name+' (ID '+id+')',
 'CAMINHO: '+(c?.path||'a verificar')+' | ELEMENTO: '+(c?.element||'a verificar'),
 'DIREÇÃO ARTÍSTICA: '+direction,
 'MOVIMENTO: '+motion,
 '',
 'Recrie toda a interface desta aplicação para refletir a identidade exata de '+name+'.',
 'Antes de escrever código, pesquise os materiais visuais oficiais e documente as referências verificadas.',
 'Preserve nome, feições, figurino e iconografia da personagem. Não crie artes genéricas.',
 'Conceba tokens de cor, tipografia, ícones vetoriais, ornamentos, molduras, ilustrações,',
 'efeitos em movimento e composições MOBILE FIRST que sejam autênticas ao personagem.',
 'Altere visualmente TODAS as 14 telas: Início, Minha Conta, Ficha, Nexus Scan,',
 'Planos, Endgame, Speed Lab, Atlas, Relic Vault, Warp Advisor, Radar, Pom-Pom,',
 'Theme Studio e Configurações. Não entregue somente paleta, ícones ou plano de fundo.',
 'Utilize componentes isolados com tokens de tema, garantindo fácil alternância e desfazer.',
 'Priorize larguras 320, 360, 390, 430, 768, 1024, 1440 e 1920 px.',
 'Mantenha contraste AA, suporte a reduzir movimento, áreas de toque de 44px,',
 'truncamento correto, alt text e ausência de overflow.',
 'INTEGRIDADE: nunca altere dados do jogador, personagens, cones, relíquias, backups ou senhas.',
 'ENTREGA: implemente no repositório GitHub conectado doraemogx/anderus-star-rail-nexus,',
 'trabalhe em branch, valide em Chromium, publique somente após testes verdes.',
 'Gere também manifest de tema JSON com as chaves name, character, characterId,',
 'accent, background, surface, text, secondary, font (valores seguros).',
 'Não reutilize o Grand Theatre antigo, não ofereça tema Original ou Tema ChatGPT.',
 'O catálogo de temas deve mostrar apenas temas realmente gerados e importados.',
 'Não dê tarefas técnicas ao usuário: apresente o resultado pronto.'
 ].join('\n');
};
a.themeBrief=()=>{
 const c=a.gameChar(a.themeSelected);const label=document.getElementById('n2-theme-selection');
 if(label)label.innerHTML=c?'<span class="sect-label">PERSONAGEM ESCOLHIDO</span><h3>'+esc(c.name)+'</h3>'+
  '<p>'+esc(c.path)+' · '+esc(c.element)+'</p>':a.dim('Escolha um personagem.');
 const field=document.getElementById('n2-theme-prompt');if(field)field.textContent=a.themePromptText();
};
a.copyTheme=async()=>{
 try{await navigator.clipboard.writeText(a.themePromptText());a.note('Briefing completo copiado. Abra o ChatGPT para gerar o tema.');}
 catch(e){a.note('Não foi possível copiar automaticamente. Selecione o briefing na tela.','error');}
};
a.openChatGPT=()=>{window.open('https://chatgpt.com/','_blank','noopener,noreferrer');};
a.importThemeFile=async input=>{
 const file=input.files?.[0];if(!file)return;
 try{
  if(file.size>40000)throw Error('Arquivo de tema maior que o limite de 40 KB');
  const v=JSON.parse(await file.text());
  const isHex=x=>typeof x==='string'&&/^#[\da-f]{6}$/i.test(x);
  const keys=['accent','background','surface','text','secondary'];
  if(!v.name||!v.character||!keys.every(k=>isHex(v[k])))throw Error('Manifest de tema precisa conter nome, personagem e cinco cores em formato HEX');
  const theme={name:String(v.name).slice(0,80),character:String(v.character).slice(0,80),
   characterId:String(v.characterId||''),...Object.fromEntries(keys.map(k=>[k,v[k]])),
   font:/^(Cinzel|DM Sans|Georgia|system-ui)$/.test(v.font)?v.font:'Cinzel',
   created:Date.now()};
  a.data.themes.push(theme);a.data.activeTheme=a.data.themes.length-1;
  a.save();a.applyTheme();a.updatePage('themes');a.filterThemes('');a.themeBrief();
  a.note('Identidade de tema importada e ativada. Componentes especiais precisam ser publicados no repositório.');
 }catch(e){a.note('Tema não importado: '+e.message,'error')}
 input.value='';
};
a.activateTheme=i=>{a.data.activeTheme=i;a.save();a.applyTheme();a.updatePage('themes');a.filterThemes('');a.themeBrief();};
a.removeTheme=i=>{
 if(!confirm('Excluir esta identidade gerada do catálogo do Nexus 2.0?'))return;
 a.data.themes.splice(i,1);
 if(a.data.activeTheme===i)a.data.activeTheme=null;
 else if(Number(a.data.activeTheme)>i)a.data.activeTheme--;
 a.save();a.applyTheme();a.updatePage('themes');a.filterThemes('');a.themeBrief();
};
a.applyTheme=()=>{
 const idx=a.data.activeTheme,t=idx===null?null:a.data.themes[idx],app=document.getElementById('app');
 if(!app)return;
 app.classList.remove('theme-aha','theme-robin','theme-castorice');
 const vars=['--accent','--n2-user-bg','--n2-user-surface','--n2-user-text','--n2-user-secondary','--n2-theme-font'];
 if(t){const colors=[t.accent,t.background,t.surface,t.text,t.secondary,t.font];
  vars.forEach((v,i)=>app.style.setProperty(v,colors[i]));
  app.classList.add('n2-user-theme');
 }else{vars.forEach(v=>app.style.removeProperty(v));app.classList.remove('n2-user-theme');}
};
a.setReducedMotion=value=>{a.data.settings.reduceMotion=!!value;a.save();document.body.classList.toggle('n2-reduce-motion',!!value);};
a.loadRadar=async()=>{
 try{
  const [r1,r2]=await Promise.all([
    fetch('../data/beta-watch.json',{cache:'no-store'}),
    fetch('../data/beta-editorial.json',{cache:'no-store'})
  ]);if(!r1.ok||!r2.ok)return;
  const beta=await r1.json(),editorial=await r2.json();
  const box=document.getElementById('n2-radar-updates');if(!box)return;
  const updates=Object.entries(beta.changes||{}).flatMap(([kind,list])=>
   list.map(x=>({kind,name:x.name}))).slice(0,10);
  box.innerHTML='<div class="card"><span class="sect-label">BETA · NÃO CONFIRMADO</span>'+
   '<h3>Revisão '+esc(beta.version||'indisponível')+'</h3>'+
   '<p>Checagem: '+esc(beta.checkedAt?new Date(beta.checkedAt).toLocaleString('pt-BR'):'sem data')+
   ' · mudança de revisão não confirma alterações definitivas de kit.</p>'+
   '<div class="n2-update-list">'+updates.map(x=>'<div class="n2-radar-row"><strong>'+esc(x.name)+'</strong>'+
   '<small>'+esc(x.kind)+' · Revisão</small></div>').join('')+'</div></div>'+
   '<div class="card"><span class="sect-label">ARQUIVO EDITORIAL</span><h3>'+esc(editorial.entries?.length||0)+' dossiês cadastrados</h3>'+
   '<p>Atualização editorial: '+esc(editorial.updatedAt||'indisponível')+'. Verifique o status oficial/beta dentro de cada fonte.</p></div>';
 }catch(e){/* keep unavailable state explicitly; never fabricate news */}
};
a.renderAfter=page=>{
 if(page==='atlas')a.drawAchievements();
 if(page==='speed')a.renderSpeed();
 if(page==='warp')a.updateWarp();
 if(page==='themes'){a.filterThemes('');a.themeBrief();}
 if(page==='radar')a.loadRadar();
 if(page==='character')a.renderProfile();
};
window.Nexus2Boot=()=>{
 // Route generators are swapped BEFORE the first render, so demo data never becomes the real UI.
 Object.assign(pageHtml,a.pages,a.modules);
 // Complete functional navigation while retaining the approved HSR visual shell.
 renderProfile=()=>a.renderProfile();
 drawSpeed=()=>a.renderSpeed();
 drawAtlas=()=>a.drawAchievements();
 calcWarp=()=>a.updateWarp();
 refreshThemePrompt=()=>a.themeBrief();
 const oldNav=navigate;
 navigate=function(page){
  oldNav(page);
  a.renderAfter(page);
  history.replaceState(null,'','#'+encodeURIComponent(page));
 };
 // Keep hidden legacy prototype route selector in DOM for backwards-compatible navigation.
 document.title='Anderus Nexus 2.0 · Minha Jornada';
 const resize=()=>{const desktop=matchMedia('(min-width:920px)').matches;
  const device=document.getElementById('device');if(device)device.className='device '+(desktop?'desktop':'mobile');
 };
 resize();window.addEventListener('resize',resize);
 a.applyTheme();a.setReducedMotion(a.data.settings.reduceMotion);
 const deepLink=decodeURIComponent(location.hash.slice(1));
 if(deepLink&&document.getElementById('page-'+deepLink)){
  setTimeout(()=>navigate(deepLink),0);
 }
 setTimeout(()=>a.start(),0);
 if('serviceWorker' in navigator&&location.protocol==='https:'){
  navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
 }
};
})();