#!/usr/bin/env python3
"""Sync PT-BR character/skill/Eidolon records only; never fabricate meta."""
import json, pathlib, time, urllib.request
from datetime import datetime, timezone
ROOT=pathlib.Path(__file__).resolve().parents[1]
SOURCE='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_min/pt/'
KEEP={
 'characters':['id','name','rarity','rank','element','path','tag','skills','ranks','icon','portrait','preview'],
 'character_ranks':['id','name','rank','desc','icon'],
 'character_skills':['id','name','desc','icon','type','type_text','effect','effect_text','params','max_level'],
 'light_cones':['id','name','rarity','path','icon'],
 'relic_sets':['id','name','desc','icon'],
 'relics':['id','name','set_id','type','icon','max_level','rarity']
}
def get(label):
 req=urllib.request.Request(SOURCE+label+'.json',headers={'User-Agent':'Anderus-Nexus-Catalog-Sync/0.5'})
 for i in range(3):
  try:
   with urllib.request.urlopen(req,timeout=25) as response:
    raw=json.load(response)
   if not isinstance(raw,dict) or len(raw)<40:raise ValueError('Dataset too small: '+label)
   return {k:{field:value[field] for field in KEEP[label] if field in value} for k,value in raw.items() if isinstance(value,dict)}
  except Exception:
   if i==2:raise
   time.sleep(3*(i+1))
def main():
 datasets={k:get(k) for k in KEEP}
 payload={'checkedAt':datetime.now(timezone.utc).replace(microsecond=0).isoformat(),
          'source':'Mar-7th/StarRailRes · index_min/pt',
          'scope':'Dados estruturados; Endgame e meta exigem revisão editorial',
          'chars':datasets['characters'],'ranks':datasets['character_ranks'],'skills':datasets['character_skills'],'cones':datasets['light_cones'],'relicSets':datasets['relic_sets'],'relics':datasets['relics']}
 output=ROOT/'data'/'live-game.json'
 output.parent.mkdir(parents=True,exist_ok=True)
 output.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
 print('Characters:',len(payload['chars']),'ranks:',len(payload['ranks']),'skills:',len(payload['skills']))
if __name__=='__main__':main()
