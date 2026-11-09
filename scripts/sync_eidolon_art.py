#!/usr/bin/env python3
"""Probe public Eidolon artwork sources without storing or changing user data."""
import hashlib, urllib.request, urllib.error, json
from urllib.parse import quote, urlencode
HEAD={'User-Agent':'Mozilla/5.0 (compatible; Anderus-Nexus-Eidolon/1.0; public fan project)', 'Accept':'image/webp,image/png,image/*,*/*;q=0.5'}
examples=['Character Evanescia Eidolon 1.png','Character Pearl Eidolon 2.png','Character Himeko Eidolon 1.png']
def get(url, limit=2048):
 try:
  req=urllib.request.Request(url,headers=HEAD)
  with urllib.request.urlopen(req,timeout=15) as r:
   b=r.read(limit)
   return f'{r.status} {r.headers.get("Content-Type")} {r.geturl()[:170]} bytes={len(b)} signature={b[:10].hex()} body={b[:1500].decode("utf-8","replace") if "json" in r.headers.get("Content-Type","") else ""}'
 except Exception as e:return type(e).__name__+' '+str(e)[:240]
for title in examples:
 encoded=quote(title.replace(' ','_'))
 digest=hashlib.md5(title.replace(' ','_').encode('utf-8')).hexdigest()
 urls=[
 'https://static.wikia.nocookie.net/honkai-star-rail/images/'+digest[0]+'/'+digest[:2]+'/'+encoded+'/revision/latest',
 'https://honkai-star-rail.fandom.com/wiki/Special:Redirect/file/'+encoded,
 'https://honkai-star-rail.fandom.com/api.php?'+urlencode({'action':'query','format':'json','prop':'imageinfo','iiprop':'url','titles':'File:'+title})
 ]
 print('===',title,'MD5',digest,flush=True)
 for url in urls:print(get(url),flush=True)

print('=== Verify original image responses ===',flush=True)
for title in examples:
 req='https://honkai-star-rail.fandom.com/api.php?'+urlencode({'action':'query','format':'json','prop':'imageinfo','iiprop':'url','titles':'File:'+title})
 try:
  res=json.loads(urllib.request.urlopen(urllib.request.Request(req,headers=HEAD),timeout=12).read())
  image=next(iter(res['query']['pages'].values()))['imageinfo'][0]['url']
  print(title, get(image),flush=True)
 except Exception as e:print('PROBE ERROR',title,type(e).__name__,str(e)[:150],flush=True)
