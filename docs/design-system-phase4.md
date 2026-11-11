# Anderus Star Rail Nexus — Design System / Fase 4

## Escopo e decisão arquitetural

O Nexus acumulou HTML original embutido, `v06.css`, `nexus-v07.css`, `nexus-v09.css`, `nexus-account.css` e estilos locais de módulos. Uma reescrita total da aplicação comprometeria a sincronização aprovada e os componentes de importação. A Fase 4 introduz **uma camada visual reutilizável e não destrutiva** (`nexus-design-system.css`) e uma camada de ergonomia/acessibilidade (`nexus-design-system.js`) carregadas pelo `v06.js`. Todos os tokens herdam as cores atuais de `--v-color` para não invalidar o Theme Studio.

Não altera: chave `anderus_nexus_v03`, servidor, identificadores de personagens, importador ou regras de cálculo. **O tema Aha/Grand Theatre em profundidade fica para a Fase 5.**

## Tokens

| Grupo | Tokens | Objetivo |
| --- | --- | --- |
| Espaçamento | `--nx-space-1..8` | escala coerente de 4 a 32px |
| Raios | `--nx-radius-sm/md/lg/hero` | controles, cartões e painéis |
| Tipografia | `--nx-title`, `--nx-ui` | hierarquia editorial HSR e interface legível |
| Superfícies | `--nx-canvas`, `--nx-surface`, `--nx-surface-raised` | contraste em ambientes escuros |
| Estados | `--nx-focus`, `--nx-line`, `--nx-accent` | seleção, foco e divisão temática |
| Layout | `--nx-control-min`, `--nx-nav-height`, `--nx-content` | 44px de toque, safe-area e largura |
| Efeitos | `--nx-shadow`, `nx-shimmer` | profundidade controlada, respeitando movimento reduzido |

## Componentes e telas atendidas

- **Shell / Navigation Rail:** cabeçalho, ações de pelo menos 40–44px, menu de seções com `aria-expanded`, fechamento com Escape, foco aprisionado enquanto o menu está aberto e `aria-current` na rota.
- **Mobile Navigation:** cinco destinos principais com iconografia original do jogo, rótulos legíveis, indicador ativo e safe-area do aparelho.
- **Home / Character Hero:** arte oficial preservada e legibilidade reforçada por vinheta, tipografia fluida, CTAs acessíveis e composição mais aproveitável.
- **Character Card / Stat Row:** cartões de personagem, métricas e listas com mínimos de largura, números tabulares e maior legibilidade.
- **Light Cone / Relic Card:** painéis de cone, seis relíquias, informações de peças e controles de expansão com toque confortável.
- **Skill Panel / Eidolon Gallery:** detalhes e habilidades continuam vindo do catálogo original; melhora de foco, quebra de texto e alvos de toque.
- **Boss Dossier / Team Builder:** painéis de chefe e montagem de times adaptam-se a uma ou duas colunas e evitam largura forçada.
- **Theme Studio:** grade ajustada a 3/5/6 colunas por breakpoint; sem alterar a lógica do tema (Fase 5).
- **Import Wizard:** campos corrigíveis em celulares pequenos, modal controlado por `dvh`, foco visível e rolagem interna.
- **Error/Empty/Skeleton:** classes compartilhadas `nx-error`, `nx-empty`, `nx-skeleton` para novos módulos.

## Pontos de atenção e compatibilidade

1. **320/360/390/430:** margem de segurança, botões de 44px quando possível, evitar cabeçalhos apertados, navegação inferior fixa.
2. **768:** tablet em 3 colunas nas áreas apropriadas, mantendo navegação móvel.
3. **1024:** rail lateral, conteúdo de largura variável e ausência de navegação inferior.
4. **1440/1920:** painéis contextuais e grid de múltiplas colunas sem alargar demais o texto.
5. **Acessibilidade:** `Ir para o conteúdo` visível ao foco, navegação com nomes, foco evidente, Escape no menu, títulos de páginas dinâmicos; preferência de movimento reduzido.
6. **Dados:** não modifica `localStorage`; versões e backup continuam a cargo das Fases 1–3.

## Matriz de validação

| Validação | Automação |
| --- | --- |
| 8 larguras (320 até 1920) | `scripts/browser-design-system.mjs` |
| 9 rotas funcionais | browser-design-system |
| Overflow, área de conteúdo, controles mobile | browser-design-system |
| Menu teclado/Escape e semântica de navegação | browser-design-system |
| Ficha, persistência e prints automatizados | browser-design-system |
| Cache/PWA, importação e sincronização | testes anteriores do repositório |
| Tokens, media queries, loader, ausência de escrita de dados | `scripts/check-design-system.mjs` |
| Android físico e leitura OCR real ao vivo | validação funcional com o proprietário, sem alegar execução |

## Limites conhecidos

- O motor original de rotas ainda mora no HTML monolítico. Esta fase unifica **a apresentação e acessibilidade**, não faz migração dos dados.
- A fase visual profunda de Aha, customização do Theme Studio, inteligência Pom-Pom e Endgame avançado pertencem às fases 5–7.
- Capturas Playwright representam Chromium em viewport simulada; não equivalem a teste físico em Android.
- Alguns gráficos e imagens vêm de serviços de terceiros e dependem de conexão, mesmo com o shell PWA disponível offline.

## Reversão

Reverter o PR da Fase 4 (arquivo CSS, JS, loader, precache e testes). Como não foi alterado o schema da conta, nenhum reset do navegador, exclusão ou migração de personagens é necessário.
