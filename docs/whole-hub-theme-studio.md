# Entrega: experiência visual de todo o Nexus + Theme Studio

## Escopo

Esta rodada **não é apenas uma troca de nome ou pacote de ícones**. É a continuação visual do Design System para todas as áreas do hub com uma experiência de troca de temas mais completa. Nenhuma migração, exclusão de personagem, cone ou relíquia.

### Experiência global

- Home: composição editorial e hierarquia de cartões existentes, com tema herdado do personagem.
- Arquivo: molduras de ficha, hierarquia e imagem fiel do personagem.
- Perfil: banner cinematográfico, abas e layout de atributos/reliquias.
- Endgame: cenário e cartões de chefes com identidade de confronto.
- Farm: linguagem de suprimentos e marcadores de progresso.
- Radar: observatório com identidade visual própria.
- Meta: painel editorial de análises.
- Temas: ateliê e comparador de interfaces.
- Pom-Pom: caderno/guia do Expresso Astral.
- Configurações: painel de comandos.
- Todas: título visual, decoração discreta, responsividade mobile-first e contraste.

### Theme Studio

1. Entrada editorial do ateliê com copy e identidade temática.
2. Biblioteca em destaque: Original, Aha e personagens reais disponíveis no catálogo (como Castorice/Noite Eterna).
3. Identidade Aha — Grand Theatre preexistente preservada, com seu layout especial.
4. Filtros: Todos, Destaques, Minha conta.
5. Prévia de arte **e de interface** lado a lado; mini painéis mostram a linguagem real de cores/formas, com número de personagens consultado da conta, não dados fictícios.
6. Cancelar não modifica nada; aplicar segue o caminho confirmado de Theme Studio já testado.
7. A troca de tema não modifica níveis, Eidolons, cones, relíquias ou builds.
8. Troca reversível via controle de tema anterior existente.

### Limites transparentes

- As miniaturas demonstram linguagem visual; não são captura do navegador já transformado para um tema ainda não aplicado.
- A aparência de temas por personagem compartilha os componentes e paleta do catálogo; a identidade Grand Theatre recebe tratamento especial completo. Não se afirma que cada personagem tenha uma direção de arte manual exclusiva.
- Os testes Playwright cobrem os fluxos de interface em Chromium; a confirmação subjetiva de beleza e hierarquia visual é feita pelo usuário após publicação.
- Não foram reescritos módulos de cálculo, dados beta ou importação OCR nesta rodada.

### Auditoria automatizada

- 320, 390, 768 e 1440px: fluxo real Theme Studio, filtros, preview, cancelar, aplicar, nove rotas e conta preservada.
- Outras oito larguras e navegação: testes anteriores.
- QA estático de tokens, rotas, precache e ausência de escrita de estado nesta camada.
- Screenshots anexados à execução GitHub Actions de browser QA.

### Arquivos

`nexus-visual-experience.css`, `nexus-visual-experience.js`,
`scripts/browser-hub-theme-studio.mjs`,
`scripts/check-hub-theme-studio.mjs`, atualizações de loader, service worker e workflows.

## Checklist visual pós-publicação

O proprietário avalia apenas se a estética, composição e experiência em celular e desktop estão dentro da expectativa. A automação e a integração de código são responsabilidade técnica da implementação.
