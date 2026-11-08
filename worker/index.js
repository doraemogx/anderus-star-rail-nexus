// NEXIA: Cloudflare Workers AI. Deploy manually to a free Cloudflare account.
// The frontend never receives a model API key.
const ALLOWED_ORIGIN="https://doraemogx.github.io";
const MODEL="@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const visits=new Map();
export default {
 async fetch(req, env) {
  const origin=req.headers.get("Origin")||"";
  const cors={"Access-Control-Allow-Origin":origin===ALLOWED_ORIGIN?ALLOWED_ORIGIN:"null","Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"content-type","Vary":"Origin"};
  if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors});
  if(req.method!=="POST"||origin!==ALLOWED_ORIGIN)return Response.json({error:"Origem não permitida"},{status:403,headers:cors});
  const ip=req.headers.get("CF-Connecting-IP")||"unknown",now=Date.now();
  const times=(visits.get(ip)||[]).filter(t=>now-t<3600000);
  if(times.length>=20)return Response.json({error:"Limite por hora alcançado"},{status:429,headers:cors});
  times.push(now);visits.set(ip,times);
  try{
   const body=await req.json(),question=String(body.question||"").trim().slice(0,900);
   if(!question)return Response.json({error:"Informe a pergunta"},{status:400,headers:cors});
   const account=Array.isArray(body.account)?body.account.slice(0,70).map(c=>({name:String(c.name||"").slice(0,65),level:+c.level||0,eidolon:+c.eidolon||0,superimposition:+c.superimposition||0,stats:c.stats||{}})):[];
   const hist=Array.isArray(body.history)?body.history.slice(-6).map(x=>({role:x.role==="bot"?"assistant":"user",content:String(x.msg||"").slice(0,550)})):[];
   const prompt="Você é Nexia, uma IA especialista em Honkai: Star Rail, no hub Anderus Nexus. Responda em português brasileiro natural, com profundidade técnica. Priorize cálculos, condições e rotações; diferencie texto oficial, beta, hipótese e estimativa. Não invente ciclos, percentual de dano, banner, multiplicador ou taxa de drop. Conheça a conta do usuário apenas pelos dados fornecidos, que podem estar incompletos. Evite respostas vagas e conselhos genéricos. Não se apresente como ChatGPT. Inventário: "+JSON.stringify(account).slice(0,5000);
   const result=await env.AI.run(MODEL,{messages:[{role:"system",content:prompt},...hist,{role:"user",content:question}],max_tokens:1100,temperature:.4});
   return Response.json({answer:String(result.response||"Não consegui gerar uma resposta.").slice(0,6000),model:MODEL},{headers:cors});
  }catch(e){return Response.json({error:"Modelo indisponível: "+String(e.message||e).slice(0,160)},{status:500,headers:cors})}
 }
}