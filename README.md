# ANDERUS — STAR RAIL NEXUS

## Versão 0.4 — Expresso Astral

Site mobile-first hospedado no GitHub Pages:
https://doraemogx.github.io/anderus-star-rail-nexus/

A página inicial foi reorganizada a partir do conceito aprovado: Caelus, seis caminhos ilustrados, próximo objetivo, futuros banners e acesso à Nexia.

**Confirmação de banner:** Aeon ★ Aha, conhecida como Nihilux, estreia em 11 de novembro de 2026 na versão 4.7. Reruns da primeira fase: Loba Prateada Nv. 999, Sparxie, Yao Guang. Fonte: anúncio oficial HoYoverse 30/10/2026 e calendário da versão 4.7. Os dados não são atualizados automaticamente nesta versão.

## Nexia: modo local ou IA real opcional

O modo local responde com dados e regras. **Não é um modelo de IA conversacional.**

A pasta [`worker/`](./worker) contém o backend opcional Cloudflare Workers AI, usando o modelo `@cf/meta/llama-3.3-70b-instruct-fp8-fast`. Ele **ainda não está implantado**. Após instalar na conta Cloudflare gratuita do proprietário:

1. Criar um Cloudflare Worker (plano Free), por exemplo `nexia-ai-nexus`.
2. Carregar o código de `worker/index.js`.
3. Configurar o binding de Workers AI com o nome `AI` (já documentado em `worker/wrangler.jsonc`).
4. Publicar e obter seu endereço `https://...workers.dev`.
5. No Nexus, abrir **Menu > Configurações > Conectar uma IA de verdade**, colar a URL HTTPS e salvar.
6. Abrir Nexia e testar uma pergunta sobre os personagens registrados.

**Custos:** o Cloudflare Workers AI tem uma franquia gratuita sujeita a limites. Não configure modalidade paga se desejar custo zero. A assinatura ChatGPT é separada da API OpenAI. O código não contém chaves secretas.

**Segurança:** o exemplo valida origem e usa limitação básica temporária por IP; isso não equivale a autenticação robusta. Configure controles adicionais de taxa no Cloudflare antes de disponibilizar amplamente. Quando a IA estiver conectada, ela receberá a pergunta e um resumo de personagens, Eidolons e atributos registrados; não adicione dados sensíveis.

## Estado do protótipo

- Implementado: interface, catálogo, fichas, Eidolons, troca de temas, navegação, registros locais, modo local Nexia.
- Parcial: planejamento de materiais, equipes de Endgame, Radar, conteúdo de kit sob disponibilidade das fontes.
- Não implementado: atualização automática a cada 3 horas, importação integral de prints, estimativa robusta de ciclos, serviço de IA já ativado.

Projeto independente de fã, não afiliado à HoYoverse. As imagens e propriedades intelectuais pertencem aos respectivos titulares.
