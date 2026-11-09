#!/usr/bin/env python3
"""One-time/color-signature index for official relic icons. Refresh only on new icon IDs."""
import base64, io, json, pathlib, time, urllib.request
from datetime import datetime, timezone
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
CATALOG=ROOT/'data/live-game.json'
OUTPUT=ROOT/'data/relic-icon-signatures.json'
def main():
  game=json.loads(CATALOG.read_text(encoding='utf-8'))
  distinct={}
  for relic in game.get('relics',{}).values():
    icon=relic.get('icon')
    if icon and relic.get('set_id') and relic.get('type'):
      distinct[(str(relic['set_id']),relic['type'])]=icon
  wanted=sorted((a,b,c) for (a,b),c in distinct.items())
  if OUTPUT.exists():
    try:
      old=json.loads(OUTPUT.read_text(encoding='utf-8'))
      if old.get('wanted')==wanted:
        print('No new relic icons; keeping existing signatures')
        return
    except Exception:pass
  previous={}
  if OUTPUT.exists():
    try:previous={x['icon']:x for x in old.get('icons',[])}
    except Exception:pass
  out=[]
  for idx,(setid,slot,icon) in enumerate(wanted):
    if icon in previous:
      out.append({**previous[icon],'setId':setid,'type':slot})
      continue
    uri='https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/'+icon
    try:
      req=urllib.request.Request(uri,headers={'User-Agent':'Anderus-Relic-Index/0.7'})
      with urllib.request.urlopen(req,timeout=16) as res: raw=res.read()
      im=Image.open(io.BytesIO(raw)).convert('RGBA').resize((20,20),Image.Resampling.LANCZOS)
      # Transparent pixels are excluded from comparison in browser.
      rgba=base64.b64encode(im.tobytes()).decode('ascii')
      out.append({'setId':setid,'type':slot,'icon':icon,'rgba':rgba})
    except Exception as exc:
      print('SKIP',icon,str(exc)[:80])
    if idx%30==0: print('Read',idx,'of',len(wanted))
  payload={'checkedAt':datetime.now(timezone.utc).isoformat(),'wanted':wanted,'icons':out,
           'source':'Mar-7th/StarRailRes icon/relic — original game assets',
           'method':'20×20 RGBA reference; conservative visual comparison; requires manual confirmation if uncertain'}
  OUTPUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
  print('Saved',len(out),'of',len(wanted),'signatures')
if __name__=='__main__':main()
