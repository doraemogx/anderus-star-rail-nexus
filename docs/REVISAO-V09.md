# ANDERUS Nexus 0.9 · revisão visual e funcional

Atualização: 9 de novembro de 2026. Projeto independente de fã; sem afiliação à HoYoverse.

## Pesquisa verificável

- Personagem: Aeon ★ Aha (Nihilux / Rá), Euforia / Quântico. Retrato jogável e seis artes de Eidolons já hospedados em assets/official/ e espelhados de arquivo do jogo listado em Gachabase (origens em scripts/sync_art.py). Direitos da propriedade intelectual: © HoYoverse. Não são imagens geradas por IA.
- HoYoverse, comunicado oficial 4.7: https://www.gamespress.com/pt/Honkai-Star-Rail-Version-47-Now-Lay-Laughter-to-All-St-wwwhoyoversecom
- Rotação, datas e buffs oficiais 4.6: https://hsr.hoyoverse.com/pt-pt/news/166468
- Arbitragem 4.6, Cavaleiros e Rei: https://hsrtierlist.net/anomaly-arbitration/4-6
- Sombra Apocalíptica, fraquezas e chefes: https://allthings.how/honkai-star-rail-4-6-apocalyptic-shadow-best-teams-for-dominance-of-oblivion/
- Pura Ficção e chefes: https://allthings.how/honkai-star-rail-4-6-pure-fiction-best-teams-for-imagined-words/
- Memória do Caos / terceiro nó: https://gamemarket.gg/news/honkai-star-rail/how-to-clear-hsr-memory-of-chaos-survival-of-the-fittest-stage-12
- Estatísticas de performance: https://www.prydwen.gg/star-rail/memory-of-chaos

Imagens de chefes provêm de referências verificadas do jogo, HoYoLAB ou matérias que reproduzem material de jogo. Links externos têm fallback visual. Para Argenti, a imagem é o retrato do personagem, não uma captura do chefe. Não substituímos uma imagem que falha pela imagem de outro inimigo.

## Identidade por tela

- **Home:** Aha, palco cinematográfico, refletores, cortinas, ornamentos, 6 atos e cards mais compactos.
- **Navegação:** ícones SVG autorais do tema para Início, Minha Conta, Build Lab, Farm, Endgame, Radar, Beta/Kits e Theme Studio.
- **Arquivo/Build:** cards de personagens, importação, fichas e indicador de peças confirmadas.
- **Relíquias:** segunda leitura OCR local para números, tentativa de preencher principal + quatro secundários de cada peça, validação de faixa e confirmação humana antes de salvar.
- **Farm:** indicadores de estoque e necessidade a partir dos dados já salvos, sem simular drops.
- **Endgame:** dossiês MoC, PF, AS e AA com mecânicas, períodos, chefes, fraquezas e composições dinâmicas do elenco cadastrado; sem reutilizar membros entre Cavaleiros.
- **Radar e Beta:** separação de fontes oficiais e dados pré-lançamento; conserva o dossiê de habilidades da 4.7.
- **Pom-Pom:** dicas contextuais e aba editorial permanecem.
- **Theme Studio:** alternância reversível Original do Nexus × Grand Theatre ChatGPT. Preferência visual na chave independente anderus-aeon-aha-visual-mode, sem sobrescrever o estado da conta.
- **Modal e configurações:** tipografia, superfícies, contraste, estados de foco e ornamentos continuam com a identidade escolhida.

## Integração

Nexus-v07 carrega nexus-v09.js/css para recursos gerais. As camadas themes/aha.js, themes/aha.css, themes/aha-detail.js e themes/aha-detail.css são carregadas sob demanda somente com o tema Aha na variante ChatGPT. Voltar a Caelus ou selecionar Original remove a camada exclusiva. Nenhum personagem cadastrado é editado pela troca de aparência.

Cache PWA atualizado para anderus-shell-v09. Não é necessária API paga.

## Testes e limitações

Comando de QA: node scripts/check-v09.mjs. Verifica sintaxe, CSS, artes locais, OCR sintético, todos os modos, isolamento e PWA. Testes de seleção de equipe com elenco sintético verificaram ausência de repetição nos Cavaleiros.

**Limite do OCR:** a imagem anexada ao pedido é do site, não do registro de batalha original 2000×1826. Sem o print da build que falhou, a melhoria do preenchimento OCR não pode ser considerada validada com o caso real; confira atributos antes de salvar.

**Limite visual:** os breakpoints CSS de 390px e 1440px foram considerados, mas não foram obtidas capturas reais do navegador nessas dimensões nesta execução.

Dossiês são relativos às rotações vigentes em 09/11/2026; reajustar chefes e regras após resets. Composições são sugestões editoriais, não simulações de dano nem garantia de ciclos.
