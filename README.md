# ANDERUS — STAR RAIL NEXUS

Hub independente de **Honkai: Star Rail**, com foco em dados reais, usabilidade mobile-first e builds persistentes.

**Produção (GitHub Pages):** https://doraemogx.github.io/anderus-star-rail-nexus/

**Próxima versão:** Nexus 2.0, em revisão na [pull request #1](https://github.com/doraemogx/anderus-star-rail-nexus/pull/1), **ainda não publicada em `main`**.

> O catálogo e as fichas são um projeto de fã, não afiliado à HoYoverse. O localStorage do navegador não se sincroniza automaticamente entre dispositivos.

## Nexus 2.0 — módulos na branch de revisão

| Área | Funcionalidade | Limitação declarada |
| --- | --- | --- |
| Minha Conta | Fichas, imagens, Eidolons, cone, seis relíquias, edição manual e histórico reversível de builds | Dados locais; confirmação por print é responsabilidade da pessoa |
| Importação | Reconhecimento de dois layouts ilustrados e editor com seis peças editáveis | OCR não reconhece todas as imagens; campos incertos não são preenchidos artificialmente |
| Kit Lab | Habilidades por nível, descrições, Eidolons, rastros e custos provenientes de catálogos PT-BR | Informações estruturadas de fonte comunitária; números não presentes não são inventados |
| Pom-Pom | Dicas determinísticas e chat local com perguntas sobre build, cone, kit, equipes, farm e inventário | Sem LLM remoto automático, simulação de DPS ou conclusões além dos dados disponíveis |
| Team Lab | Equipes de quatro personagens realmente cadastrados e salvamento no backup local | Papéis por Caminho não substituem simulação de combate |
| Farm | Ascensão, rastros, níveis e estoque de materiais compartilhado | Não estima drops de runs sem taxa verificada; custos incompletos são sinalizados |
| Orçamento Global | Soma necessidades de ascensão e rastros, descontando estoque uma única vez | Metas de ascensão precisam ser registradas; níveis desconhecidos ficam de fora |
| Warp Advisor | Pity, garantias, passes/jades, cenários de até E6 e S5, meta de pior caso | O modelo probabilístico conservador **não inclui soft pity** não publicado |
| Endgame | Modificadores e datas de 4.6, chefes e recomendações vinculadas ao elenco | Mecanismos oficiais separados de guias editoriais; rotação vencida deve ser conferida |
| Theme Studio | Versões original e Aha Grand Theatre; tema aplicado também aos diálogos | Pode exigir verificação visual em diferentes navegadores |
| Pesquisa | Personagens, cones, relíquias e materiais pelo catálogo PT-BR | Não é pesquisa na Internet nem substitui fonte oficial |
| Notificações | Revisões beta marcadas como não confirmadas e diffs de catálogo | Não são push; dependem dos snapshots disponíveis no repositório |
| PWA | Cache de arquivos de interface, aviso de nova versão e diagnóstico | Cache e `localStorage` são separados por dispositivo |
| Backup | JSON de exportação, mesclagem, substituição e salvamento de segurança | A transferência é manual; a nuvem não é sincronizada |

## Testes

Na branch, as GitHub Actions executam os testes de sintaxe, integridade de kits, materiais, rastros, Eidolons, backups, metas, importação sem perda de dados, probabilidades de Warp e datas do Endgame.

O teste `scripts/browser-smoke.mjs` usa Chromium real em 390 e 1440 pixels, inclui importação parcial, seis peças, edição e persistência, dados do Pom-Pom, busca, Team Lab, Farm, materiais, Warp, tema, notificações e backup; captura também a Home em 320, 360, 390, 430, 768, 1024, 1440 e 1920 pixels. Consulte as execuções e imagens na aba Actions do GitHub. Uma execução bem-sucedida não certifica todos os layouts ou dispositivos reais.

## Atualização de dados

Os scripts em `scripts/` sincronizam os catálogos estruturados `live-game`, custos de ascensão, rastros, imagens de Eidolons e assinaturas visuais de relíquias. Os scripts de sincronização novos fazem validações de contagem/cobertura e evitam substituir dados íntegros por uma resposta upstream incompleta.

As rotações de Endgame confirmadas na nota 4.6 foram registradas com datas, fonte e status de verificação. Bônus da Arbitragem das Anomalias não verificados nessa nota permanecem explicitamente identificados como não confirmados.

**Importante:** rotinas de atualização que têm `checkout ref: main` só passam a operar com os scripts novos depois da publicação deles em `main`. A branch de revisão não atualiza a produção automaticamente.

## IA opcional

O Pom-Pom local usa regras e dados estruturados — não é um LLM conversacional. A pasta `worker/` oferece um Worker opcional para IA conversacional com Cloudflare Workers AI. O Worker **não está automaticamente implantado**: é preciso publicar e conectar a URL nas configurações. Antes de enviar dados da conta a um serviço de terceiros, verifique a política de privacidade e os limites da API.

## Documentação de QA

Veja [Auditoria do vídeo de 09/11/2026](./docs/AUDITORIA-VIDEO-2026-11-09.md). A versão pública só deve ser promovida depois de validar os fluxos críticos, os prints de importação que motivaram o projeto e os dois tipos de navegação (celular/desktop).

*Última revisão do conteúdo: 09/11/2026.*
