#!/usr/bin/env python3
"""Poll public beta revision index. Never claim full kits have been verified automatically."""
from datetime import datetime,timezone
from pathlib import Path
from urllib.request import urlopen,Request
from html.parser import HTMLParser
import json,re,time
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'data/beta-watch.json'
SOURCE='https://hsr.gachabase.net/changelog/beta?lang=en'
class Extract(HTMLParser):
 def __init__(self):super().__init__();self.rows=[]
 def handle_data(self,data):
  x=' '.join(data.split())
  if x:self.rows.append(x)
def main():
 req=Request(SOURCE,headers={'User-Agent':'Mozilla/5.0 (Anderus Beta Monitor)'})
 with urlopen(req,timeout=30) as res:html=res.read().decode('utf-8','replace')
 parser=Extract();parser.feed(html)
 rows=parser.rows
 combined='\n'.join(rows)
 matches=list(re.finditer(r'(v4\.\d+\.\d+)\s+Rev\.\s*(\d+)',combined))
 if not matches:raise RuntimeError('No beta revision: source layout changed, preserve last snapshot')
 current=matches[0];version,revision=current.group(1),current.group(2)
 part=combined[current.end():matches[1].start() if len(matches)>1 else current.end()+4000]
 lines=[x.strip() for x in part.splitlines() if x.strip()]
 categories=('Characters','Light Cones','Cavern Relics','Planar Ornaments')
 change={}
 section=''
 for i,line in enumerate(lines):
  if line in categories:section=line;change.setdefault(section,[])
  if section and line in ('NEW','UPDATED','REMOVED') and i+1<len(lines):
   name=lines[i+1]
   if name not in ('See Changes','Show all') and len(name)<100:
    change[section].append({'type':line,'name':name})
 new={'version':version,'revision':revision,'source':SOURCE,
      'checkedAt':datetime.now(timezone.utc).isoformat(),
      'status':'MONITOR — changes indicate a new revision, not confirmed final kit',
      'changes':change}
 old={}
 if OUT.exists():
  try:old=json.loads(OUT.read_text(encoding='utf-8'))
  except Exception:pass
 history=old.get('history',[])
 if old.get('revision') and old.get('revision')!=revision:
  history.insert(0,{'from':old['version'],'to':version,
      'fromRevision':old['revision'],'toRevision':revision,'at':new['checkedAt'],
      'previous':old.get('changes',{}),'current':change})
 new['history']=history[:12]
 # Avoid commits every three hours unless revision or change metadata varies.
 if old.get('revision')==revision and old.get('changes')==change:
  print('No beta change',revision);return
 OUT.parent.mkdir(parents=True,exist_ok=True)
 OUT.write_text(json.dumps(new,ensure_ascii=False,indent=2),encoding='utf-8')
 print('Detected',version,revision,'sections',list(change))
if __name__=='__main__':main()
