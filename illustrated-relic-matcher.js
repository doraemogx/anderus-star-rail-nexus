/**
 * Anderus Nexus — image-based relic SET recognition for illustrated 2000×2300
 * screenshots. The 192 locally indexed icon reference images are the source
 * of truth. A selected set is either independently confident or corroborated
 * by multiple equipped pieces; uncertain pieces remain editable.
 */
const TYPES=['HEAD','HAND','BODY','FOOT','NECK','OBJECT'];
const CENTERS=[[1073,1384],[1474,1384],[1877,1384],[1073,1738],[1474,1738],[1877,1738]];
const WIDTH=2000,HEIGHT=2300;
let referencePromise=null,setsPromise=null;
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function templates(){
  if(!referencePromise)referencePromise=fetch('./data/relic-icon-signatures.json',{cache:'no-store'})
    .then(r=>{if(!r.ok)throw Error('Referências visuais de relíquias indisponíveis');return r.json()})
    .then(data=>(data.icons||[]).map(ref=>({...ref,pixels:Uint8Array.from(atob(ref.rgba),x=>x.charCodeAt(0))})))
    .catch(e=>{referencePromise=null;throw e;});
  return referencePromise;
}
function catalogue(){
  if(!setsPromise)setsPromise=fetch('./data/live-game.json',{cache:'no-store'})
    .then(r=>r.ok?r.json():Promise.reject(Error('Catálogo indisponível')))
    .then(d=>d.relicSets||{})
    .catch(()=>{setsPromise=null;return {};});
  return setsPromise;
}
function sampleRGBA(bitmap,cx,cy,size,dx,dy){
  const c=document.createElement('canvas');c.width=c.height=20;
  const ctx=c.getContext('2d',{willReadFrequently:true});
  const sx=bitmap.width/WIDTH,sy=bitmap.height/HEIGHT;
  ctx.drawImage(bitmap,(cx-size/2+dx)*sx,(cy-size/2+dy)*sy,size*sx,size*sy,0,0,20,20);
  return ctx.getImageData(0,0,20,20).data;
}
function compareColor(sample,reference){
  const source=reference.pixels;let sum=0,weight=0;
  for(let i=0;i<400;i++){
    const p=i*4,alpha=source[p+3]/255;
    if(alpha<.55)continue;
    sum+=alpha*(.35*Math.abs(source[p]-sample[p])+
      .4*Math.abs(source[p+1]-sample[p+1])+
      .25*Math.abs(source[p+2]-sample[p+2]));
    weight+=alpha;
  }
  return weight>45?sum/(weight*255):1;
}
function rankCandidates(bitmap,refs,index){
  const [cx,cy]=CENTERS[index],samples=[];
  for(const size of [66,78,90])for(const dx of [-6,0,6])for(const dy of [-6,0,6]){
    samples.push(sampleRGBA(bitmap,cx,cy,size,dx,dy));
  }
  return refs.filter(r=>r.type===TYPES[index]).map(ref=>{
    let score=1;
    for(const sample of samples)score=Math.min(score,compareColor(sample,ref));
    return {setId:String(ref.setId),icon:ref.icon,score};
  }).sort((a,b)=>a.score-b.score).slice(0,5);
}
/** Pure: per-piece confidence plus same-set cross-piece corroboration. */
export function decideRelicSets(candidateLists){
  const groups=[[0,1,2,3],[4,5]];
  const choices=Array(6).fill(null);
  for(let i=0;i<6;i++){
    const [first,second]=candidateLists[i]||[];
    if(first&&first.score<=.235&&(!second||second.score-first.score>=.024))
      choices[i]={setId:first.setId,confidence:'high',score:first.score};
  }
  for(const group of groups){
    const counts={};
    for(const i of group){
      const [first]=candidateLists[i]||[];
      if(first?.score<=.235)counts[first.setId]=(counts[first.setId]||0)+1;
    }
    const candidates=Object.entries(counts).sort((a,b)=>b[1]-a[1]);
    const min=group.length===4?3:2;
    if(!candidates[0]||candidates[0][1]<min||candidates[1]?.[1]===candidates[0][1])continue;
    const setId=candidates[0][0];
    for(const i of group){
      const scored=(candidateLists[i]||[]).find(c=>c.setId===setId);
      const first=candidateLists[i]?.[0];
      if(!scored||scored.score>.265||scored.score-first.score>.027)continue;
      if(choices[i]&&choices[i].setId!==setId)continue;
      choices[i]={setId,confidence:scored===first?'cross-checked':'probable',score:scored.score};
    }
  }
  return choices;
}
export async function recognizeIllustratedRelicSets(bitmap,progress=()=>{}){
  if(!bitmap||bitmap.width/bitmap.height<.82||bitmap.width/bitmap.height>.95)
    throw Error('Formato de imagem incompatível com o comparador de conjuntos ilustrados');
  progress('Comparando os seis ícones com o catálogo real de relíquias…');
  const refs=await templates(),names=await catalogue();
  if(refs.length<100)throw Error('Catálogo visual incompleto');
  const candidates=[];
  for(let i=0;i<6;i++){
    candidates.push(rankCandidates(bitmap,refs,i));
    if(i===2)progress('Conferindo peças e ornamentos planares…');
  }
  const selected=decideRelicSets(candidates);
  return {candidates,selected,names,recognized:selected.filter(Boolean).length};
}
export function fillRelicSetFields(report,root=document){
  const count={selected:0,review:0};
  if(!report?.candidates)return count;
  const names=report.names||{};
  for(let i=0;i<6;i++){
    const field=root.getElementById('v06-r'+i+'-set');
    const suggestions=root.getElementById('v06-relmatch-'+i);
    const chosen=report.selected?.[i]||null;
    if(field&&chosen&&(field.value===''||field.dataset.iconSuggestion==='1')&&
      [...field.options].some(o=>o.value===chosen.setId)){
      field.value=chosen.setId;field.style.borderColor='#6ec4ae';
      field.title=chosen.confidence==='high'
        ?'Conjunto reconhecido pelo ícone original. Confira antes de salvar.'
        :'Conjunto confirmado comparando vários ícones da mesma família. Confira antes de salvar.';
      field.dataset.iconSuggestion='1';count.selected++;
    }else count.review++;
    if(suggestions){
      suggestions.textContent='';
      const title=root.createElement('small');
      title.textContent=chosen?'Conjunto reconhecido visualmente. Confira pelo ícone:'
        :'Sem confirmação automática. Escolha pela comparação dos ícones:';
      suggestions.appendChild(title);
      for(const candidate of (report.candidates[i]||[]).slice(0,3)){
        if(!field||![...field.options].some(o=>o.value===candidate.setId))continue;
        const btn=root.createElement('button');btn.type='button';btn.className='v07-rel-option';
        const img=root.createElement('img');
        img.src='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/'+candidate.icon;
        img.loading='lazy';img.alt='';
        const span=root.createElement('span');
        span.textContent=names[candidate.setId]?.name||'Conjunto '+candidate.setId;
        btn.append(img,span);
        btn.title='Selecionar '+span.textContent;
        btn.addEventListener('click',()=>{
          field.value=candidate.setId;field.style.borderColor='#6ec4ae';
          field.title='Conjunto selecionado manualmente após comparar os ícones.';
        });
        suggestions.appendChild(btn);
      }
    }
  }
  return count;
}
