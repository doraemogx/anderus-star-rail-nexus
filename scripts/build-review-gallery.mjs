#!/usr/bin/env node
/* A standalone visual QA gallery; included with the Chromium screenshots.
 * Opens from a downloaded GitHub Actions ZIP, even without a running server.
 */
import {readdirSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
const dir='artifacts';
mkdirSync(dir,{recursive:true});
const images=readdirSync(dir).filter(x=>/\.png$/i.test(x)).sort((a,b)=>a.localeCompare(b,'pt-BR'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={
 account:'Minha Conta',endgame:'Endgame','kit-lab':'Kit Lab','material-budget':'Orçamento de materiais',
 'nexus-backup':'Backup e restauração','nexus-home':'Início',notifications:'Notificações',
 'pompom-chat':'Pom-Pom 2.0','relic-optimizer':'Relic Optimizer','team-lab':'Team Lab',
 'trace-planner':'Rastros','warp':'Warp Advisor'
};
function group(name){
 return name.replace(/-\d+\.png$/,'');
}
const groups=[...new Set(images.map(group))].sort();
const content=`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Nexus 2.0 · Revisão visual</title>
<style>
:root{color-scheme:dark;font-family:system-ui;background:#111827;color:#f4ebdf}
body{max-width:1350px;margin:auto;padding:clamp(15px,4vw,45px)}
h1{font:500 clamp(30px,5vw,48px) Georgia,serif}h2{font:500 28px Georgia,serif;margin:35px 0 14px}
header{border-bottom:1px solid #5b687d;padding-bottom:20px}
p{color:#c4d0df;line-height:1.65}
section{border-top:1px solid #3c526c;margin:18px 0;padding-top:7px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr));gap:16px}
figure{min-width:0;margin:0;padding:12px;border:1px solid #536783;border-radius:12px;background:#1e3048}
figcaption{font-size:13px;font-weight:700;color:#eed1a2;margin-bottom:9px}
img{width:100%;height:auto;max-height:760px;object-fit:contain;object-position:top center;border:1px solid #4b617a;border-radius:7px}
a{color:#f6d6a2}footer{font-size:13px;margin-top:45px;border-top:1px solid #5b687d;padding-top:20px}
</style></head><body><header><p>ANDERUS · STAR RAIL NEXUS</p>
<h1>Nexus 2.0 · Auditoria visual</h1><p>Capturas reais do Chromium em diferentes tamanhos, produzidas automaticamente pela branch de revisão. Build:
<strong>${esc((process.env.GITHUB_SHA||'não identificado').slice(0,12))}</strong>.</p>
<p><strong>Importante:</strong> imagens demonstram aparência e fluxos exercitados. Não substituem teste em Android físico ou reconhecimento de seus screenshots originais.</p></header>
${groups.map(key=>`<section><h2>${esc(names[key]||key)}</h2><div class="grid">${images.filter(n=>group(n)===key).map(n=>
  `<figure><figcaption>${esc(n.replace('.png','').replace(key+'-',''))} px</figcaption>
<a href="${encodeURIComponent(n)}" target="_blank" rel="noopener"><img src="${encodeURIComponent(n)}" loading="lazy" alt="${esc(names[key]||key)} · ${esc(n)}"></a></figure>`
 ).join('')}</div></section>`).join('')}
<footer>Registro visual automatizado. Arte e marcas do universo Honkai: Star Rail pertencem à HoYoverse; este é um projeto de fã.</footer></body></html>`;
writeFileSync(join(dir,'review.html'),content);
console.log('Nexus review gallery:',groups.length,'sections,',images.length,'screenshots');
