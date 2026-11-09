# Aeon ★ Aha — Grand Theatre / Identidade visual

## Base de pesquisa (9 nov 2026)
- HoYoverse (v4.6): Nihilux revelou ser Aha, Aeon da Euforia. https://www.hoyoverse.com/pt-pt/news/166390
- Comunicado oficial 4.7 (30/10/2026): Aha dirige os Jogos da Lua Fantasma; estreia 11/11. https://www.gamespress.com/pt/Honkai-Star-Rail-Version-47-Now-Lay-Laughter-to-All-St-wwwhoyoversecom
- Artes de personagem e E1–E6 pré-existentes no repo em assets/official, obtidas de arquivos do jogo listados pela Gachabase (origens em scripts/sync_art.py). https://hsr.gachabase.net/characters/1511/aeon-aha/beta
- Arte e direitos de Honkai: Star Rail © HoYoverse. O espelho Gachabase é de terceiros; não é comunicado oficial. Informações de beta continuam rotuladas como provisórias.

## Linguagem visual
Palco de Astrópolis: ribalta em champanhe, cortinas de veludo vinho, grafismos de cartas e máscaras abstratas, tipografia de cartaz teatral, molduras recortadas e transparências quânticas. Fundo/ornamentos criados em CSS para esta interface; não se apresentam como material de arte oficial.
O hero separa retrato de texto e preserva proporções (object-fit contain); galeria de E1–E6 reutiliza arquivos locais, sem inventar ilustrações.

## Integração
- Carregamento lazy exclusivo para state.theme==='future-aha' via nexus-v07.js.
- Arquivos isolados themes/aha.css e themes/aha.js, com fallback no erro de download.
- Sem modificação de localStorage, state.characters, arquivo da conta ou dependência de API paga.
- Navegação usa as rotas existentes para importação, Minha Conta, Farm, Endgame, Theme Studio, instalador da PWA; Pom-Pom e kits permanecem nas telas existentes.
- Mudança de tema para Caelus ou outro personagem remove os elementos visuais da Aha.
- PWA atualizada para cache anderus-shell-v08; o pacote opcional de Aha não é pré-cacheado.
- Pontos de adaptação mobile (390px) e desktop (1440px); foco visível e prefers-reduced-motion.

Projeto independente de fã, não afiliado à HoYoverse.