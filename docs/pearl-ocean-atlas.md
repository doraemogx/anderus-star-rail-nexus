# Pearl · Atlas do Oceano — Theme Studio 3
**Alvo:** Nexus ORIGINAL (raiz), jamais `/v2/`. **Personagem:** Pearl, ID 1503. **Versão:** 1.0.0.

## Pesquisa / procedência
- HoYoLAB, anúncio oficial de warp 4.6: Pearl é **5★, Gelo, Euforia**. Fonte: https://www.hoyolab.com/article/47142215
- Design observado: figurino branco com azul, pintura e pergaminho, ornamentos de pérola, pinceladas fluidas. As mídias de personagem vêm de `imgSrc(1503)` já integrado ao catálogo. Nenhuma arte nova é rotulada como oficial.
- Seis referências E1–E6 **já existentes** no `data/eidolon-art.json`, provenientes dos fragmentos do jogo na Wiki. Mantidas **sem alterar URLs, conjuntos ou ordem**. Não confundir seu caráter comunitário com hospedagem oficial.
- A identificação de uma suposta forma alternativa ou um vídeo específico não foi suficientemente corroborada para representar como canônico; nenhum elemento desse tipo foi introduzido.

## Direção criativa
**Conceito:** o Nexus vira um atlas oceânico aberto, uma galeria de estudo de obras em movimento. Simbolismo de concha, arco de pérola, maré, linha de nanquim e pergaminho. A fonte **Marcellus** traz a leitura editorial; microtexto com alto contraste permanece na família do sistema.

**Paleta HEX:** gelo fluorescente `#91E4EC`, madrepérola `#F4DFC0`, oceano noturno `#071B2C`, superfície de pigmento `#123442`, papel branco `#F3FAF8`, névoa `#B3D1D8`. Sem púrpura genérico.

**Forma:** `petal` com bordas de pergaminho assimétricas (canto esquerdo curto, direito arredondado); linhas de maré, arcos concêntricos, filete de tinta e iluminação translúcida. Ornamentos inteiramente CSS; ícones de elemento e assets de jogo não são substituídos por desenhos fictícios.

## Composição por rota
| Rota | Composição |
| --- | --- |
| Home | Splash oficial ao lado direito, abertura editorial e cartões de maré |
| Minha Conta | Galeria catalogada, molduras de retrato preservando `object-fit:contain` |
| Ficha / Kit / Eidolons | Hero em pergaminho, gráficos de atributos, kit em painéis, E1–E6 preservados |
| Seis relíquias / Cone | Cartões com marcação de maré, equipamento sem distorção, campos legíveis |
| Importação HoYoLAB/OCR | Moldura de captura pontilhada, formulários intactos |
| Farm | Livro de registro de recursos com barras de progresso em gelo |
| Endgame | Cartas cartográficas de chefes, ilustrações existentes, mecânicas e equipes |
| Radar | Horizonte panorâmico e faixa editorial de informações |
| Meta | Caderno analítico, módulos hierarquizados |
| Pom-Pom | Notas do Expresso apresentadas como caderno com controle de leitura |
| Theme Studio | Galeria de identidade + laboratório com prévia reversível |
| Configurações | Console de preferências com foco e contraste de formulários |

## Proteção e reversibilidade
- A camada Pearl contém apenas **manifesto + CSS estático**; não executa CSS/JS vindo de manifesto de usuário.
- O estúdio valida schema 3, IDs, cores e nome de fonte/forma contra listas fechadas. CSS tem escopo `.app[data-nx3-theme="pearl-ocean-atlas"]`.
- Ativação/prévia/cancelamento gravam apenas a chave `anderus_theme_studio_generated_v3` no momento adequado. **Não escrevem** `anderus_nexus_v03`, nem alteram personagens, builds, relíquias ou histórico.
- Animação da maré e brilho somente decorativos; `prefers-reduced-motion:reduce` desliga todos. Botões e abas mobile preservam alvo de toque.
- Reverter a PR remove manifesto, CSS, registro, testes e precache sem migração de dados.

## QA técnico
- `node scripts/check-theme-studio-v3.mjs`: contratos de tema, integridade E1–E6, segurança, escopo e precache.
- `node scripts/browser-theme-studio-v3.mjs`: regressão antiga de estúdio.
- `node scripts/browser-pearl-theme.mjs`: Chromium 320/360/390/430/768/1024/1440/1920; navegação real pelas **10 rotas**, cancelamento/aplicação, 20 capturas de 390 e 1440 px, overflow e dados de conta intactos.
- Auditoria calculada de contraste da paleta principal: texto/superfície **12,43:1**, texto secundário/superfície **8,17:1**, destaque/fundo **12,07:1**. A aprovação WCAG integral exige auditoria manual de todos os elementos e estados.
- Os screenshots são disponibilizados pelo artifact do GitHub Actions na PR; teste com viewport móvel não substitui ensaio em Android físico. Revisão visual humana e aprovação técnica precedem qualquer merge/publicação no Pages.
