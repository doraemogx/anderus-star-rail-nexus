#!/usr/bin/env node
/* End-to-end Nexus Scan 3 on mobile and desktop.
 * Uses synthetic OCR responses: never stores real screenshots, UID or credentials.
 * Exercises the new modal, saved character merge, 6 equipment panels and reload.
 */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdir} from 'node:fs/promises';
const root='http://127.0.0.1:8787/';
const existing={
 characters:{
  '1512':{level:80,e:0,s:1,cone:'Cone antigo',customNote:'Não apagar',pv:6150},
  '1503':{level:80,e:2,s:1,cone:'Cores para o Amanhã',pv:3161}
 },
 v06TracePlans:{'1512':{'1512001':{current:10,target:10}}},
 v06SavedTeams:[{id:'duo',members:['1512','1503']}],
 v06RelicDetails:{'1512':[
  {setId:'127',level:15,main:{stat:'PV',value:705},subs:[]},
  {setId:'127',level:15,main:{stat:'ATQ',value:352},subs:[]},
  {setId:'127',level:15,main:{stat:'Dano CRIT',value:64.8},subs:[]},
  {setId:'127',level:15,main:{stat:'VEL',value:25},subs:[]},
  {setId:'308',level:15,main:{stat:'PV %',value:43.2},subs:[]},
  {setId:'308',level:15,main:{stat:'Regeneração de Energia',value:19.4},
   subs:[{stat:'PV',value:33},{stat:'DEF %',value:10.2},
    {stat:'Efeito de Quebra',value:10.3},{stat:'PV %',value:10.8}]}
 ]}
};
const mockReader=String.raw