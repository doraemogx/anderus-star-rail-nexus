# Ativação da sincronização entre celular e computador

O Nexus é **um único site**, mas cada navegador guarda os dados da conta em seu próprio armazenamento. Antes desta implementação não existia servidor capaz de compartilhar esses dados.

## Solução preparada

- O Worker Cloudflare já existente (`nexia-ai-nexus`) passa a oferecer o endpoint `/api/sync/v1/` com um Durable Object de armazenamento SQLite.
- Os dados dos personagens são criptografados no navegador, antes de chegar ao Cloudflare, usando AES-GCM. O servidor não conhece a chave de leitura.
- Cada aparelho é vinculado por um link privado gerado no Nexus. Não é necessário informar UID de Honkai, e-mail ou senha da HoYoverse.
- A primeira vinculação **mescla personagens diferentes** e preserva campos exclusivos; um mesmo personagem com dados divergentes exige regra explícita e gera cópia de segurança.
- Alterações seguintes são propagadas quando os aparelhos estiverem abertos e com internet. Modificações durante período offline aguardam nova conexão.
- Fotos originais de prints permanecem locais; as fichas estruturadas de personagens, relíquias e objetivos são sincronizadas.
- É possível desconectar um aparelho sem apagar dados e desfazer a última atualização recebida.

## Por que ainda não está ativo automaticamente

O GitHub Pages publica apenas o site. Ele **não publica o Cloudflare Worker**. Uma mudança em `worker/index.js` no GitHub, sozinha, não altera a API externa. Verifique `/api/sync/v1/status` com o cabeçalho `Origin: https://doraemogx.github.io`. Somente `200` com `available:true` e `encrypted:true` confirma a ativação.

## Ativação sem lidar com código

O proprietário pode fazer uma conexão única no painel do Cloudflare:

1. Abrir **Workers & Pages → nexia-ai-nexus → Settings → Builds**.
2. Conectar o repositório `doraemogx/anderus-star-rail-nexus` ao Worker existente, branch `main`, pasta raiz `worker`.
3. Selecionar implantação via `npx wrangler deploy`, preservando o binding de IA `AI`. A configuração `worker/wrangler.jsonc` declara a nova classe `NexusSyncRoom`; ela é provisionada no primeiro deploy compatível.
4. Confirmar no histórico do Cloudflare que o deploy foi finalizado. Não divulgar tokens, senhas nem códigos de emparelhamento.

Como alternativa, o GitHub Action `deploy-cloudflare.yml` publica o mesmo Worker **se** já existirem `CLOUDFLARE_API_TOKEN` e `CLOUDFLARE_ACCOUNT_ID` nos Secrets do repositório. Sem esses secrets, avisa e não faz deploy.

**A interface de sincronização só deve ser promovida ao site principal depois de verificar a API publicada e executar o teste real de dois navegadores.**

## Testes

- `node scripts/check-cloud-sync.mjs`: criptografia, mesclagem, conflitos.
- `node scripts/check-cloud-sync-worker.mjs`: autenticação e revisão do servidor.
- `node scripts/browser-sync.mjs`: dois navegadores independentes com armazenamento isolado, conexão por link e união dos personagens.
- `node scripts/check-cloud-sync-deployment.mjs`: detecta Worker antigo, indisponível ou implantado corretamente.

Nenhum dado existente da conta é apagado por criar a infraestrutura no repositório.
