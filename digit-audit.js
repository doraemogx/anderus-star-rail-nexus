import {glyphs} from './digit-data.js';

// Strict second reading for the left-side eight-attribute card in standardized
// 2000×1826 screenshots. No guess is accepted without a margin over alternatives.
const KEYS=['pv','atk','def','spd','crit','cdmg'];
const slotsInteger=[1247,1260,1273,1286,1300];
const slotsDecimal=[1225,1238,1251,1264,1284];

function readGlyph(ctx,width,height,row,slot){
  const sx=width/2000,sy=height/1826,center=(.1535+row*.0315)*1826;
  const x=Math.round(slot*sx),y=Math.round((center-22)*sy);
  const w=Math.max(1,Math.round((slot+13)*sx)-x);
  const h=Math.max(1,Math.round((center+9)*sy)-y);
  const data=ctx.getImageData(x,y,w,h).data;
  const binary=new Uint8Array(w*h);
  let minx=w,miny=h,maxx=-1,maxy=-1,count=0;
  for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++){
    const p=(yy*w+xx)*4,r=data[p],g=data[p+1],b=data[p+2];
    if(r>135&&g>112&&(b>140||r>b+45)){
      binary[yy*w+xx]=1;count++;
      minx=Math.min(minx,xx);maxx=Math.max(maxx,xx);
      miny=Math.min(miny,yy);maxy=Math.max(maxy,yy);
    }
  }
  if(count<10||maxy-miny<6)return null;
  const cw=maxx-minx+1,ch=maxy-miny+1;
  const pattern=[];
  // Box-area interpolation matches how the reference samples were normalized.
  for(let oy=0;oy<20;oy++)for(let ox=0;ox<12;ox++){
    const ax=ox*cw/12,bx=(ox+1)*cw/12,ay=oy*ch/20,by=(oy+1)*ch/20;
    let weighted=0,weight=0;
    for(let syi=Math.floor(ay);syi<Math.ceil(by);syi++)
      for(let sxi=Math.floor(ax);sxi<Math.ceil(bx);sxi++){
        const area=Math.max(0,Math.min(sxi+1,bx)-Math.max(sxi,ax))*
          Math.max(0,Math.min(syi+1,by)-Math.max(syi,ay));
        weighted+=binary[(miny+syi)*w+minx+sxi]*area;
        weight+=area;
      }
    pattern.push(weight>0&&weighted/weight>.25?1:0);
  }
  const options=new Map(),style=row>=4?1:0;
  for(const ref of glyphs){
    if(ref.style!==style)continue;
    let bad=0;
    for(let p=0;p<240;p++)if(pattern[p]!==ref.pixels[p])bad++;
    const error=bad/240+.2*Math.abs(cw/sx-ref.w)/14+.08*Math.abs(ch/sy-ref.h)/22;
    options.set(ref.digit,Math.min(error,options.get(ref.digit)??Infinity));
  }
  const best=[...options.entries()].sort((a,b)=>a[1]-b[1]);
  if(!best[0]||best[0][1]>.15||best[1][1]-best[0][1]<.05)return null;
  return best[0][0];
}

function getNumber(ctx,width,height,row){
  const slots=row<4?slotsInteger:slotsDecimal;
  const chars=slots.map(x=>readGlyph(ctx,width,height,row,x));
  if(row<4){
    const first=chars.findIndex(x=>x!==null);
    if(first<0||chars.slice(first).some(x=>x===null))return null;
    return Number(chars.slice(first).join(''));
  }
  const before=chars.slice(0,-1);
  const first=before.findIndex(x=>x!==null);
  if(first<0||chars[chars.length-1]===null||before.slice(first).some(x=>x===null))return null;
  return Number(before.slice(first).join('')+'.'+chars[chars.length-1]);
}

export function auditFixedTotals(bitmap,totals){
  const canvas=document.createElement('canvas');
  canvas.width=bitmap.width;canvas.height=bitmap.height;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  ctx.drawImage(bitmap,0,0);
  const corrections=[],confirmed=[],uncertain=[];
  for(let row=0;row<KEYS.length;row++){
    const key=KEYS[row],independent=getNumber(ctx,bitmap.width,bitmap.height,row);
    if(independent===null){uncertain.push(key);continue;}
    if(typeof totals[key]==='number'&&Math.abs(totals[key]-independent)>.09){
      corrections.push({key,ocr:totals[key],value:independent});
    }else confirmed.push(key);
    totals[key]=independent;
  }
  return {confirmed,corrections,uncertain};
}
