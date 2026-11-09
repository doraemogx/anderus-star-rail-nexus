/* Anderus Warp Math — official hard pity/base rates, conservative model.
 * Probability model deliberately omits unpublished soft pity increases.
 * This is a lower-bound illustration, NOT a precise official drop forecast.
 */
(function(){
'use strict';
if(window.NexusWarpMath)return;
const rules={
 character:{hard:90,base:0.006,featured:0.50,label:'Salto de Personagem'},
 cone:{hard:80,base:0.008,featured:0.75,label:'Salto de Cone de Luz'}
};
function valid(kind,goal,pity,pulls){
 const r=rules[kind];if(!r)throw Error('Banner inválido.');
 if(!Number.isInteger(goal)||goal<0||goal>7)throw Error('Meta de cópias inválida.');
 if(!Number.isInteger(pity)||pity<0||pity>=r.hard)throw Error('Pity fora dos limites.');
 if(!Number.isInteger(pulls)||pulls<0||pulls>5000)throw Error('Quantidade de tiros inválida.');
 return r;
}
function maximum(kind,goal,pity=0,guaranteed=false){
 const r=valid(kind,goal,pity,0);
 if(goal===0)return 0;
 return r.hard-pity+(guaranteed?0:r.hard)+(goal-1)*2*r.hard;
}
function chance(kind,goal,pity=0,guaranteed=false,pulls=0){
 const r=valid(kind,goal,pity,pulls);
 if(goal===0)return 1;
 if(pulls<goal)return 0;
 if(pulls>=maximum(kind,goal,pity,guaranteed))return 1;
 const H=r.hard,stride=H*2,size=(goal+1)*stride;
 const key=(copies,hasGuarantee,p)=>copies*stride+hasGuarantee*H+p;
 let curr=new Float64Array(size),next=new Float64Array(size);
 curr[key(0,guaranteed?1:0,pity)]=1;
 for(let turn=0;turn<pulls;turn++){
  next.fill(0);
  for(let copies=0;copies<=goal;copies++){
   for(let g=0;g<2;g++){
    for(let p=0;p<H;p++){
     const value=curr[key(copies,g,p)];
     if(value===0)continue;
     if(copies>=goal){next[key(goal,0,0)]+=value;continue;}
     const rate=p===H-1?1:r.base;
     if(rate<1)next[key(copies,g,p+1)]+=value*(1-rate);
     const win=g?1:r.featured;
     next[key(copies+1,0,0)]+=value*rate*win;
     if(!g)next[key(copies,1,0)]+=value*rate*(1-win);
    }
   }
  }
  const t=curr;curr=next;next=t;
 }
 let result=0;
 for(let i=goal*stride;i<size;i++)result+=curr[i];
 return Math.max(0,Math.min(1,result));
}
function resources(pass,jades,futurePass=0,futureJades=0){
 const values=[pass,jades,futurePass,futureJades].map(Number);
 if(values.some(v=>!Number.isFinite(v)||v<0))throw Error('Recursos não podem ser negativos.');
 return Math.trunc(values[0])+Math.trunc(values[2])+Math.floor((values[1]+values[3])/160);
}
window.NexusWarpMath={rules,valid,maximum,chance,resources};
})();