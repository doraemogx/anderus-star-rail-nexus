# Theme Studio 3 — identidades criadas pelo GPT

O Theme Studio 3 roda na aplicação **original** da raiz, não em `/v2/`. A interface antiga continua no código como fallback, mas é ocultada quando o estúdio está ativo. Fichas, relíquias, kits, imagens de Eidolons, OCR, Endgame e sync não são substituídos.

## Experiência

1. **Criar**: selecione um personagem do catálogo, veja sua arte e até seis fragmentos reais de Eidolon, escolha direção visual e intensidade dos efeitos e inclua uma orientação pessoal.
2. **Criar este tema no ChatGPT**: copia o briefing detalhado e abre o ChatGPT. O site estático não possui uma sessão GPT embutida e não publica arquivos automaticamente. Na conversa, o GPT conectado ao GitHub pode inspecionar o repositório, criar, testar e publicar o tema.
3. **Meu acervo**: lista apenas criações presentes em `themes/generated/index.json` com manifestos válidos — ou manifestos JSON importados localmente. Nenhum personagem é tratado como um tema completo antes de uma implementação.
4. **Laboratório**: visão comparativa de composição mobile/desktop por tela, experimento temporário sobre o próprio Nexus sem persistir, aplicar ou cancelar. O tema aplicado pode ser desativado; a aparência original do Nexus permanece como base operacional, não como uma variante artificial no catálogo.

## Publicação de uma nova identidade

O GPT deve criar `themes/generated/<slug>/theme.json` e `theme.css`, ambos testados e revisados, e registrar somente o slug real em `themes/generated/index.json`.

Exemplo **de contrato**, não um tema pronto (não salvar no registro sem gerar os arquivos):

```json
{
  "schema": 3,
  "id": "nome-personagem-identidade",
  "name": "Identidade exclusiva",
  "characterId": "1512",
  "version": "1.0",
  "description": "Descrição da direção artística",
  "shape": "sigil",
  "font": "Cinzel",
  "hasStyles": true,
  "tokens": {
    "accent": "#efd2a9",
    "second": "#b4c0df",
    "background": "#101729",
    "surface": "#19263c",
    "text": "#fff4e4",
    "muted": "#bbc9d7"
  },
  "screens": {
    "home": {"eyebrow": "Capítulo", "headline": "Meu universo", "accent": "Texto editorial"},
    "profile": {"eyebrow": "Ficha", "headline": "Personagem", "accent": "Texto editorial"}
  }
}
```

Outras telas suportadas em `screens`: `library, endgame, farm, radar, tier, themes, nexia, settings`; nomes ausentes recebem descrições neutras. `shape` permitido: `arc, petal, blade, sigil, crystal, theatre`. `font` permitido: `Cinzel, Marcellus, Georgia, DM Sans, system-ui`.

O CSS deve usar escopo **exclusivo**:

```css
.app[data-nx3-theme="nome-personagem-identidade"] .v06-profile { /* composição específica */ }
```

Nenhum HTML, JavaScript ou CSS arbitrário fornecido via JSON pelo usuário será executado. O estúdio só carrega CSS publicado **no mesmo repositório** de um manifesto registrado e validado, para facilitar revisão e rollback.

## Proteções de dados

- A conta permanece em `anderus_nexus_v03`; o estúdio **não escreve nessa chave**.
- Seleção e versões de identidade ficam em `anderus_theme_studio_generated_v3`.
- A prévia imersiva não grava alterações. Somente **Aplicar** persiste a escolha.
- O catálogo é exibido separadamente da biblioteca de temas já gerados.
- A mudança de identidade não remove nem reescreve seis Eidolons, imagens oficiais, cones, relíquias ou histórico.

## QA

`node --check nexus-theme-studio-v3.js`
`node scripts/check-theme-studio-v3.mjs`
`node scripts/browser-theme-studio-v3.mjs`

O teste Playwright cobre 320, 390, 768 e 1440 px, galeria, prompt, arte, preview com cancelar, aplicação em app, dados preservados e seis Eidolons originais.
