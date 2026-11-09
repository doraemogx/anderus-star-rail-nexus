# Nexus 2.0 — matriz de aceite e pendências

**Critério de status:** `Implementado` indica funcionalidade codificada e coberta por testes declarados; `Parcial` exige validação adicional; `Pendente` não atende à especificação. Nenhum status abaixo equivale a aceite final.

| Requisito da especificação 2.0 | Estado | Evidência / observação |
| --- | --- | --- |
| Mesma versão de arquivos no desktop e mobile | Parcial | Service Worker recebe SHA do deploy, arquivos priorizam rede; verificação entre aparelhos físicos ainda pendente |
| Atualização segura do Service Worker | Parcial | Stamp por SHA, fallback offline e teste Chromium; teste de atualização real em Android pendente |
| Cadastro mesmo com OCR parcial | Implementado | Fluxo de salvamento aceita campos faltantes; teste de regressão |
| Preservar campos válidos da leitura | Parcial | Normalização não substitui valor observado; é preciso validar corpus de imagens de diferentes layouts |
| Seis relíquias registráveis e editáveis | Implementado | Editor sempre apresenta seis peças, com possibilidade de revisão; smoke do navegador |
| Importação de todos os layouts listados | Pendente | Detecção explícita de formato; reconhecimento estruturado para dois layouts principais, demais com alternativa manual |
| Precisão real de OCR e confiança calibrada | Pendente | Sem corpus de imagens variadas rotuladas e métricas de recall/precision |
| Cone, sobreposição e Eidolons com dados canônicos | Parcial | Catálogo estruturado, artes e seis Eidolons; revisão de fontes e imagens reais pendente |
| Kit completo, incluindo rastros e níveis | Parcial | Habilidades e materiais estruturados, multiplicadores por nível; exceções de fonte precisam verificação |
| Pom-Pom separa fatos e estimativas | Implementado no modo local | Respostas determinísticas e limites explícitos; modo Cloudflare AI depende de deploy externo |
| Pom-Pom responde de forma útil sobre a conta | Parcial | Análise de registros, relíquias, cones, farm, equipes e prioridades; sem DPS/rotação modelados |
| Tema Aha coerente em todas as telas | Parcial | Estilos específicos e ponte de temas em modais; revisão visual real precisa aprovação |
| Layout sem overflow e cortes | Parcial | Home exercitada em oito larguras; principais modais em 390/1440; verificar demais páginas e conteúdo extenso |
| Dados existentes preservados na migração | Parcial | Testes de save/merge/restauração com fixtures, histórico e desfazer; teste com backup real da conta pendente |
| Fontes beta e oficiais distinguíveis | Parcial | Revisões beta não confirmadas, dados de Endgame datados; outros artigos editoriais ainda requerem classificação |
| Telas principais com evidência visual | Parcial | Capturas automáticas e galeria gerada no CI; revisão manual com os dispositivos desejados pendente |
| Fluxos avaliados sem erros críticos de console | Parcial | Testes Chromium param em exceções; não há cobertura de todos os estados e serviços externos |
| Limitações documentadas | Implementado | README e documentação de arquitetura, vídeo e rastreabilidade |
| Build completa do Nexus publicada | Pendente | PR de revisão não mesclado; produção não deve mudar sem QA e aceite |

## Automação

| Camada | Testes existentes |
| --- | --- |
| Sintaxe e dados | `quality.yml`: cobertura de kits, materiais, Eidolons, rastros, aliases, OCR não destrutivo, Pom-Pom, backup, Warp, Endgame |
| Navegador | `browser-ux.yml`: fluxos da conta, relíquias, navegação, Kit Lab, Teams, Farm, busca, tema, PWA e persistência em Chromium |
| Responsividade | Home em 320 / 360 / 390 / 430 / 768 / 1024 / 1440 / 1920 px e principais modais em 390 / 1440 px |
| Evidência | ZIP `nexus-browser-ux` com capturas e `review.html` gerado em Actions |
| Segurança de dados | Backup JSON, teste de mesclagem, snapshot de segurança e restauração reversível |

## Critérios que bloqueiam a publicação

1. Fluxos de catálogo, cadastro, importação, backup e navegação com QA verde no **mesmo commit final**.
2. Corpus com screenshots de build/relíquias originais que motivaram a reclamação; resultados esperados documentados e comparados campo a campo.
3. Revisão visual do tema Original e do tema Aha com conteúdo real, incluindo mobile e desktop.
4. Teste de migração e restauração sobre uma cópia de uma conta existente, sem expor dados privados.
5. Verificação da versão publicada, cache e armazenamento em um navegador Android real.
6. Nenhuma informação editorial, beta, dano simulado ou taxa de drop apresentada como fato sem fonte.

## Revisão única do proprietário

A revisão final só deve ser solicitada quando os bloqueios acima estiverem resolvidos ou quando cada exceção receber concordância explícita. **Não publicar a partir da PR em rascunho.** O site atual da branch principal permanece como está.
