/* Browser-only fake OCR, never bundled into the app. */
export async function catalogue(){
 return fetch('./data/live-game.json').then(r=>r.json());
}
export async function readHoYoLab(file,{progress=()=>{}}={}){
 progress('Identificando cartão no teste');
 const isPearl=file.name.includes('pearl');
 const id=isPearl?'1503':'1512';
 const relics=Array.from({length:6},(_,i)=>({
  setId:'',setName:'',level:15,
  main:{stat:['PV','ATQ','Dano CRIT','VEL','PV %','Regeneração de Energia'][i],
   value:[705,352,64.8,25,43.2,19.4][i],confidence:'checked'},
  subs:Array.from({length:4},()=>({stat:'',value:null})),
  suggestions:i===5?[{setId:'308',icon:'icon/relic/308.png',name:'Vonwacq Vivaz'}]:[]
 }));
 relics[5].subs[0]={stat:'PV',value:33,confidence:'checked'};
 relics[5].subs[1]={stat:'DEF %',value:10.2,confidence:'checked'};
 relics[5].subs[2]={stat:'Efeito de Quebra',value:10.3,confidence:'checked'};
 relics[5].subs[3]={stat:'PV %',value:10.8,confidence:'checked'};
 return {width:2000,height:isPearl?1826:2300,
  layout:isPearl?'hoyolab-wide':'hoyolab-tall',
  characterId:id,characterName:isPearl?'Pearl':'Robin - Summeretto',
  characterConfidence:'exact',level:80,eidolon:isPearl?2:1,superimposition:5,
  cone:isPearl?'Cores para o Amanhã':'A Próxima Página da História',
  totals:{pv:isPearl?3161:6284,atk:1659,def:1044,spd:138,crit:31.3,
   cdmg:127.1,break:15.5,energy:124.4},relics};
}
export async function makeRelicThumbnails(){return Array.from({length:6},()=>'');}
