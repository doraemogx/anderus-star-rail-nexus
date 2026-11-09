# Pom-Pom — implantação do assistente Cloudflare

O Pom-Pom já envia o inventário atual da conta em cada pergunta. **Alterar personagens, níveis ou Eidolons no Nexus não exige deploy do Cloudflare.** O Worker também lê periodicamente dados de habilidades e Eidolons de uma fonte comunitária; ainda não possui sincronização completa de todos os modos/banners.

## Conexão única do Cloudflare ao GitHub

1. Acesse **Workers & Pages** e abra o Worker existente `nexia-ai-nexus`.
2. Em **Settings → Builds** (ou **Build**), clique **Connect**.
3. Conecte a conta GitHub e autorize o repositório `doraemogx/anderus-star-rail-nexus`.
4. Configure:
   - Repository: `doraemogx/anderus-star-rail-nexus`
   - Production branch: `main`
   - Root directory: `worker`
   - Build command: (vazio, não há build)
   - Deploy command: `npx wrangler deploy` (ou `npm run deploy`)
   - Binding AI: `AI` (já descrito no `wrangler.jsonc`)
5. Salve e confirme o primeiro build/deploy na página **Builds/Deployments**.

Depois disso, alterações feitas em `worker/index.js` no GitHub são publicadas automaticamente sem copiar/colar código ou criar tokens manualmente. O GitHub Pages continua publicando o site estático em paralelo.

## Cuidados

- Conecte **o Worker já existente**, não crie outro.
- O valor `name` em `wrangler.jsonc` precisa continuar `nexia-ai-nexus`.
- A conexão usa as permissões do próprio Cloudflare. Não compartilhe senhas ou tokens.
- O Cloudflare Free tem cotas e não assegura disponibilidade ilimitada da IA.
- Não há sincronização automática de dados de conta entre navegadores: isso exige outra solução de armazenamento e autenticação.
- Se o build falhar, verifique **Builds → Logs** antes de alterar o código da aplicação.

Documentação Cloudflare: https://developers.cloudflare.com/workers/ci-cd/builds/
