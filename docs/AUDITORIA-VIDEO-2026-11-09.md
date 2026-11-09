# Auditoria visual — gravação 09/11/2026 (85 s)

Fonte: vídeo `Gravando 2026-11-09 140940(1).mp4`, resolução 1912×948, capturado em navegador desktop. Revisão visual por quadros de 4 s. Não há gravação Android neste material.

## Problemas visíveis e prioridades

| Tempo aproximado | Tela | Evidência observável | Classificação | Ação / teste |
|---|---|---|---|---|
| 00–08 s | Home | Cards de navegação e blocos de Aha em módulos sucessivos; muito espaço vertical e predominância de caixas semelhantes | UX P2 | Redefinir hierarquia editorial, hero e densidade; captura 390/1440 |
| 12–24 s | Minha Conta | 2 personagens cadastrados; busca, alternância Minha Conta/Catálogo/Favoritos; miniaturas muito pequenas no desktop e grande área acima da lista | UX P2 | Melhorar legibilidade e composição, sem misturar catálogo com possuídos |
| 28–36 s | Endgame | Chefes em cartões estreitos; imagens de alguns encontros indisponíveis; planejamento de equipes com quadros vazios | Conteúdo/UX P1 | Validar assets, rotação, cobertura de elenco e estados vazios; não inferir teams prontos |
| 40 s | Farm Planner | Formulário/tabela com espaço horizontal subutilizado, controles pequenos e indicação de fusão 3:1 | UX P2 | Refinar densidade de formulário mobile e desktop, conversões com estoque real |
| 44–48 s | Radar e Meta | Cards editoriais e links para kits; Meta & Tier List oferece poucos personagens comparáveis | Conteúdo P1 | Fonte de atualização com estado verificável e comparação de elenco |
| 52–60 s | Personagem Evanescia | Artes de Eidolon presentes, cone de luz com descrição detalhada; parte da ficha apresenta rolagem longa | UX P2 | Manter bons recursos, integrar Kit Lab e navegação interna |
| 64 s | Relíquias da Evanescia | Seis cartões aparecem com campos não registrados, apesar do personagem estar cadastrado | Funcional P0 | Verificar importação e persistência de seis relíquias; comparar com print original; não adivinhar valores |
| 68 s | Equipes | Blocos de composições simples e botão de abrir planejador | Funcional/UX P1 | Testar restrições, recomendações com quatro personagens realmente possuídos |
| 72–76 s | Pom-Pom | Respostas em seções longas e visual de cards estáticos; não há demonstração de conversa contextual eficaz | UX/IA P1 | Dados factuais separados de explicação; testes com perguntas e conta real |
| 80 s | Configurações | Backup, restauração e sincronização periódica expostos como funções separadas | Dados P0 | Testar backup real e deixar claro que localStorage não sincroniza entre dispositivos |

## Limites da evidência

- A gravação demonstra aparência e navegação, não valida a lógica interna dos botões, OCR ou sincronização.
- A tela de relíquias não mostra o print original usado na importação: a causa exata da falha permanece hipótese.
- Não é possível inferir comportamento Android a partir desse vídeo desktop.
- Fontes, bosses, kits e imagens externos exigem verificações independentes.

## Correções já propostas nesta branch

- Normalização não reescreve silenciosamente atributo principal observado.
- Indicadores de integridade para valores incoerentes de +15.
- Atualização de recursos PWA com preferência pela rede.
- Diagnóstico de cache, versão, catálogo e armazenamento local.
- Kit Lab 2.0 com níveis e Eidolons em modal acessível a partir do dossiê.

## Gates antes de publicar

1. Cadastro manual e importação em imagens reais, inclusive seis relíquias completas.
2. Backup/restauração com registros existentes, sem perda.
3. Capturas e testes funcionais em 390, 768 e 1440 px.
4. Catálogo e Eidolons sem valores fictícios; status de fonte.
5. Navegação, Theme Studio, Farm, Endgame e Pom-Pom com QA integrado.
6. Verificação de deploy e cache em desktop e Android.
