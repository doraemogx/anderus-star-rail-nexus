# ANDERUS — Encerramento visual / fases 4–5 (11/11/2026)

## Resolução de nomenclatura
**Nome visível oficial: Aha.** Mantida a identidade `future-aha` usada pela implementação para não quebrar tema, links, favoritos e migração. Removidas as expressões "Nihilux / Rá" e variantes dos títulos, rótulos, legendas e catálogo do site. O catálogo beta apresenta `name: Aha`. Isto é normalização de exibição, não alteração no histórico ou nas mecânicas do personagem.

## Direção de arte — o que mudou
- **Original do Nexus:** composição astral com tipografia editorial, molduras assimétricas, superfícies escuras, detalhe metálico e artes do personagem selecionado. Não inventa arte oficial.
- **Aha / Grand Theatre:** cenário teatral já estabelecido, com identidade contínua na home, Arquivo, ficha, seis relíquias, cone, kits, Eidolons, Endgame, Farm, Radar, Pom-Pom, Theme Studio e modais. Complementos reforçam o tratamento de máscaras, recortes diagonais, tecidos de palco, dourado/rosa de Euforia e títulos de seção.
- **Diferenciação por rota:** contexto do capítulo para Arquivo, Perfil, Endgame, Farm, Radar, Meta, Theme Studio, Pom-Pom e Configurações. Hierarquia tipográfica e composição editorial.
- **Cards**: tipos diferentes para personagem, kit, equipamento, chefe, material, importação e avisos. Os conjuntos e valores salvos nunca são substituídos pela decoração.
- **Iconografia:** preserva ícones oficiais já usados em caminhos e combate; Grand Theatre usa uma biblioteca SVG própria; evita substituir arte de personagens por imagens inventadas.
- **Responsividade:** oito larguras entre 320 e 1920 px. Mobile de duas linhas no cabeçalho e navegação inferior, safe area; desktop com menu lateral, distribuição em colunas e artes sem esticar.
- **Acessibilidade:** foco visível, Escape, skip link, indicadores de rota, diálogos nativos, 44px de toque e respeito a `prefers-reduced-motion`.

## Theme Studio — antes de aplicar
A seleção de qualquer personagem na biblioteca abre `#nx-theme-preview`, com **comparação da arte atual e da proposta**, **Manter tema atual** e **Aplicar**. Enquanto a prévia está aberta, não escreve na conta. A preferência do tema anterior é guardada em chave local separada `anderus_nexus_last_theme_v1` apenas **depois** de aplicar, e o botão "Voltar ao tema anterior" restaura a escolha.
O armazenamento de **tema ativo** ainda segue o mecanismo legado `setTheme()/save()` da conta. Separar completamente a persistência do tema ativo exigiria migração e testes específicos da sincronização; isto não foi feito para não arriscar as builds.
A variante "Original do Nexus" versus "Aha · Grand Theatre" continua sob chave de preferência visual independente.

## Arte e origem
- Fotos de Aha e seis Eidolons estão em arquivos locais do repositório e entram no precache PWA.
- Não foi introduzida uma **suposta forma cósmica oficial** sem um asset canônico e licença verificáveis.
- Ícones temáticos vetoriais são ornamentos de interface, **não** substitutos de ilustrações oficiais.
- A beta editorial, a fonte e os números do kit não foram alterados.

## Regressão e evidência
1. `scripts/check-visual-completion.mjs`: nome oficial em código, textos, caminhos, arquivos, UI e PWA.
2. `scripts/check-design-system.mjs`: tokens, breakpoints, foco, estrutura e escrita apenas de chave de preferência visual.
3. `scripts/browser-design-system.mjs`: oito larguras, nove rotas, navegação, layout e integridade de armazenamento.
4. `scripts/browser-visual-completion.mjs`: Chromium 390/1440 px, preview/cancel/apply, E1–E6, todas as seções, posição de scroll, arte oficial, restauração e preservação das builds.
5. Suites prévias: importador, backup, sincronização, login e offline.

**Limites de validação:** Chromium com viewport de celular não é um aparelho Android real. Testes automáticos não equivalem a certificação WCAG 2.2 AA nem comprovam carregamento no endereço público; a publicação do Pages é assíncrona. A avaliação estética final cabe ao proprietário.

## Reversão
Reverter PR de encerramento visual (arquivos CSS/JS, catálogo, loaders, cache e testes). Não há migração de schema, exclusão de builds, alteração do Worker ou redefinição de contas.
