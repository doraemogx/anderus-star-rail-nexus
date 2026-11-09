// Nexia v2 — Honkai: Star Rail factual retrieval before LLM answers.
// All runtime resources remain on Cloudflare's free quota; no API key in frontend.
// Updating this GitHub file does not automatically redeploy your Cloudflare Worker.
const ALLOWED_ORIGIN = "https://doraemogx.github.io";
const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const DATA_ROOT = "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_min/pt/";
const LIMIT_PER_HOUR = 20;
const visits = new Map();
let cachedData = null, cacheUntil = 0, loadInFlight = null;

const normalize = s => String(s || "").toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

async function getGameData() {
  if (cachedData && Date.now() < cacheUntil) return cachedData;
  if (loadInFlight) return loadInFlight;
  loadInFlight = (async () => {
    const files = ["characters", "character_ranks", "character_skills"];
    const results = await Promise.all(files.map(async name => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(DATA_ROOT + name + ".json", { signal: controller.signal });
        if (!response.ok) throw Error("Fonte " + name + ": " + response.status);
        return await response.json();
      } finally { clearTimeout(timeout); }
    }));
    cachedData = { chars: results[0], ranks: results[1], skills: results[2] };
    cacheUntil = Date.now() + 6 * 60 * 60 * 1000;
    return cachedData;
  })();
  try { return await loadInFlight; }
  finally { loadInFlight = null; }
}

function skillText(skill) {
  const paramRow = (skill.params || [])[Math.min(9, Math.max(0, (skill.params || []).length - 1))] || [];
  const fmt = value => Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2)));
  const description = String(skill.desc || "").replace(/#(\d+)\[(?:i|f\d*)\](%?)/g, (match, number, percentage) => {
    const value = paramRow[Number(number) - 1];
    return typeof value === "number" ? fmt(percentage ? value * 100 : value) + percentage : match;
  });
  return { nome: skill.name, tipo: skill.type_text || skill.type || "", nivel_referencia: Math.min(10, (skill.params || []).length) || "n/d", descricao: description.slice(0, 1900) };
}

function selectCharacterIds(data, question, history) {
  const q = normalize(question);
  const recent = normalize((history || []).filter(m => m.role === "user").slice(-2).map(m => m.content).join(" "));
  const aliases = { "mortnax blade": "1507", "mortenax blade": "1507", "vanessa": "1505", "noite eterna": "1413", "loba prateada 999": "1506" };
  const hits = [];
  for (const c of Object.values(data.chars)) {
    if (!c.name || c.name.includes("{")) continue;
    const name = normalize(c.name);
    if (name.length >= 4 && (q.includes(name) || (!hits.length && recent.includes(name)))) hits.push(c.id);
  }
  for (const [name, id] of Object.entries(aliases)) {
    if (q.includes(name) && !hits.includes(id)) hits.push(id);
  }
  return [...new Set(hits)].slice(0, 3);
}

function gameEvidence(data, question, history) {
  const ids = selectCharacterIds(data, question, history);
  const requestedE = [...question.matchAll(/\b(?:e(?:idolon)?\s*)([1-6])\b/gi)].map(x => Number(x[1]));
  const panels = [];
  for (const id of ids) {
    const c = data.chars[id];
    if (!c) continue;
    const ranks = (c.ranks || []).map(key => data.ranks[key]).filter(Boolean);
    const selected = requestedE.length ? ranks.filter(r => requestedE.includes(r.rank)) : ranks;
    const eidolons = selected.map(r => ({ eidolon: r.rank, titulo: r.name, efeito: r.desc }));
    const allSkills = (c.skills || []).map(key => data.skills[key]).filter(Boolean);
    const filtered = allSkills.filter(s => ["Normal", "BPSkill", "Skill", "Ultra", "Talent", "Maze", "Elation"].includes(s.type) || /ATQ B[aá]sico|Perícia|Suprema|Talento|Euforia/.test(s.type_text || ""));
    const skills = (filtered.length ? filtered : allSkills).slice(0, 7).map(skillText);
    panels.push({ personagem: c.name, id, caminho: c.path, elemento: c.element, eidolons, habilidades: skills });
  }
  return JSON.stringify(panels).slice(0, 14000);
}


function pearlE2VerifiedAnswer(data, question, account) {
  const normalized = normalize(question);
  if (!normalized.includes("pearl") || !/\be\s*2\b|eidolon\s*2|segundo eidolon/i.test(normalized)) return null;
  const e2 = data.ranks["150302"];
  const supreme = data.skills["150303"];
  const skill = data.skills["150302"];
  if (!e2 || !supreme || !skill) return null;

  const pearl = account.find(x => normalize(x.nome) === "pearl");
  const evanescia = account.find(x => normalize(x.nome) === "evanescia");
  const extra = evanescia
    ? "Na sua conta, Evanescia é E" + evanescia.eidolon + " e Pearl é E" + (pearl?.eidolon ?? 2) + ". Se você escolher Evanescia como Arquétipo Estético, a Suprema a avança normalmente; o E2 estende esse avanço aos OUTROS aliados da Euforia, não concede um avanço duplicado à Evanescia. O bônus de Dano de Euforia, por sua vez, continua relevante."
    : "Se o Arquétipo Estético for Evanescia, o E2 não faz ela receber avanço duplicado: o avanço adicional se destina aos outros aliados elegíveis da Euforia.";

  return [
    "E2 DA PEARL — " + e2.name,
    "",
    "TEXTO DO JOGO (catálogo PT-BR): " + e2.desc,
    "",
    "NEXIA EXPLICA — EM LINGUAGEM DIRETA:",
    "1. O E2 torna o Dano de Euforia dos aliados 15% mais 'galhofa'. Isso não é bônus de Chance de CRIT.",
    "2. Ao usar a Suprema, Pearl concede o avanço de ação também aos outros aliados da Euforia, EXCLUINDO a própria Pearl e o personagem escolhido como Arquétipo Estético. O Arquétipo já recebe o avanço descrito na Suprema base.",
    "3. A Suprema concede rodada EXTRA ao Arquétipo somente com quatro ou mais personagens da Euforia na equipe. É nessa rodada extra que o E2 dobra os ganhos iniciais de 'Mandou Bem' e 'Piada'. Com dois ou três personagens da Euforia, não se deve prometer essa rodada extra.",
    "",
    "COM A EVANESCIA:",
    extra,
    "",
    "ROTAÇÃO ORIENTATIVA (NÃO É UMA SEQUÊNCIA ÚNICA GARANTIDA):",
    "• Prepare a Energia da Pearl e use a Suprema escolhendo Evanescia como Arquétipo Estético, de preferência antes de uma janela relevante de dano da Evanescia.",
    "• A ordem e o percentual de avanço dependem de quantos aliados da Euforia estão na equipe; na Suprema base, são 10%/15%/30% de avanço para 1/2/3 ou mais personagens da Euforia.",
    "• A Perícia comum da Pearl concede 'Mandou Bem' à PRÓPRIA Pearl e cura o time. O ATQ Básico comum causa Dano de Gelo baseado na DEF. Não afirme que qualquer um deles transfere automaticamente 'Mandou Bem' ou 'Piada' à Evanescia.",
    "• O ATQ Básico APRIMORADO da Pearl, acessível durante Aprendizagem Profunda, possui efeitos específicos de dano e cura. Considere seus requisitos e cargas.",
    "",
    "LIMITES: não existe troca manual de personagens durante o combate em Star Rail. Sem a equipe completa, ordem de turnos, Energia atual e inimigos, não é possível garantir uma rotação exata ou número de ciclos.",
    "",
    "Fonte: descrições em português de Eidolon 2, Suprema, Perícia e ATQ Básico de Pearl no catálogo StarRailRes."
  ].join("\n");
}

function verifiedFallback(question) {
  const q = normalize(question);
  if (q.includes("pearl") && /\be2\b|eidolon 2/.test(q)) return 'DADO VERIFICADO — Pearl E2: o Dano de Euforia dos aliados fica 15% mais "galhofa"; ao usar a Suprema, outros aliados da Euforia (exceto Pearl e Arquétipo Estético) também recebem o efeito de avanço de ação; recursos "Mandou Bem" e "Piada" da rodada extra têm ganho inicial aumentado em 100%. NÃO aumenta Chance de CRIT.';
  if (q.includes("mortenax") && /\be2\b|eidolon 2/.test(q)) return "DADO VERIFICADO — Mortenax Blade E2: quando um aliado causa Dano com sua Suprema, considera-se também um Ataque Extra; o Dano de Ataque Extra dos aliados aumenta em 75%, e o limite de Carga do Mortenax Blade é reduzido em 7.";
  return "A base detalhada de habilidades não respondeu nesta consulta. Não afirme multiplicadores ou efeitos como se estivessem confirmados.";
}

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : "null",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "content-type",
      "Vary": "Origin",
      "Cache-Control": "no-store"
    };
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (req.method !== "POST" || origin !== ALLOWED_ORIGIN) return Response.json({ error: "Origem não permitida" }, { status: 403, headers: cors });
    if (!env.AI) return Response.json({ error: "Binding Workers AI (AI) não configurado." }, { status: 500, headers: cors });

    const ip = req.headers.get("CF-Connecting-IP") || "unknown";
    const now = Date.now();
    const times = (visits.get(ip) || []).filter(t => now - t < 3600000);
    if (times.length >= LIMIT_PER_HOUR) return Response.json({ error: "Limite de 20 consultas por hora alcançado." }, { status: 429, headers: cors });
    times.push(now); visits.set(ip, times);

    try {
      const body = await req.json();
      const question = String(body.question || "").trim().slice(0, 900);
      if (!question) return Response.json({ error: "Informe a pergunta." }, { status: 400, headers: cors });
      const account = Array.isArray(body.account) ? body.account.slice(0, 70).map(c => ({
        nome: String(c.name || "").slice(0, 65), nivel: Number(c.level) || 0,
        eidolon: Number(c.eidolon) || 0, cone_sobreposicao: Number(c.superimposition) || 0,
        atributos: c.stats && typeof c.stats === "object" ? c.stats : {}
      })) : [];
      const history = Array.isArray(body.history) ? body.history.slice(-4).map(x => ({
        role: x.role === "bot" ? "assistant" : "user", content: String(x.msg || "").slice(0, 450)
      })) : [];
      // Consulta verificável de alto risco: neste caso a resposta é montada com texto
      // de habilidades, sem permitir que um modelo invente rotações sobre Eidolons.
      try {
        const verifiedData = await getGameData();
        const exact = pearlE2VerifiedAnswer(verifiedData, question, account);
        if (exact) return Response.json({ answer: exact, model: "resposta factual verificada", knowledge_source: "StarRailRes PT-BR", mode: "verified" }, { headers: cors });
      } catch (_) { /* Continua para o modo conversacional se a fonte estiver indisponível. */ }
      let evidence = "", source = "sem fonte atual";
      try {
        const data = await getGameData();
        evidence = gameEvidence(data, question, history);
        source = "StarRailRes PT-BR (biblioteca comunitária de dados do jogo)";
      } catch (e) {
        evidence = verifiedFallback(question);
        source = "fatos locais limitados; biblioteca online indisponível";
      }

      const rules = [
        "Você é Nexia, analista de Honkai: Star Rail. Responda em português brasileiro claro, direto, tecnicamente profundo e natural.",
        "PRIORIDADE MÁXIMA: o bloco DADOS DO JOGO é a fonte para efeitos numéricos. Não invente modificadores, Eidolons, crit, multiplicadores, ciclos ou buffs.",
        "Nunca presuma que determinado personagem ou cone está equipado além do inventário fornecido. Diferencie dado de jogo, situação da conta e dedução.",
        "MECÂNICA FIXA: Honkai: Star Rail é um RPG de combate em turnos. Não há troca manual de personagens ativos no meio do combate, como ocorre em Genshin. Quatro membros atuam conforme a ordem de ação.",
        "CORREÇÃO FUNDAMENTAL: o E2 de Pearl NÃO concede Chance de CRIT. Ele melhora Dano de Euforia, efeitos da Suprema e avanço de ação de aliados elegíveis.",
        "Para dicas de rotação, explique quem usa Perícia/Suprema, ordem de ação, custo de Pontos de Perícia, buffs e gatilhos, somente se houver base factual.",
        "Para beta, vazamentos, banners ou Endgame atuais, admita quando o catálogo não fornecer informação recente. Não chame rumores de oficiais.",
        "Se não houver efeito no bloco DADOS DO JOGO, diga explicitamente que não conseguiu confirmar. Não complete por intuição.",
        "Organize em: 'O que o efeito faz', 'Na sua conta', 'Como aproveitar' e 'Limitações', quando relevante. Cite a origem comunitária do catálogo, se usado.",
        "Responda em até 450 palavras. Nada de respostas vagas, inventadas ou instruções de troca de personagem durante o combate."
      ].join("\n");
      const system = rules + "\n\nINVENTÁRIO DECLARADO:\n" + JSON.stringify(account).slice(0, 6000) +
        "\n\nDADOS DO JOGO (" + source + "):\n" + evidence;
      const result = await env.AI.run(MODEL, {
        messages: [{ role: "system", content: system }, ...history, { role: "user", content: question }],
        max_tokens: 1050, temperature: 0.15
      });
      return Response.json({
        answer: String(result.response || "Não consegui gerar uma resposta.").slice(0, 6500),
        model: MODEL, knowledge_source: source
      }, { headers: cors });
    } catch (e) {
      return Response.json({ error: "Falha na consulta: " + String(e.message || e).slice(0, 160) }, { status: 500, headers: cors });
    }
  }
};
