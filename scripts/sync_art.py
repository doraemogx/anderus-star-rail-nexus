#!/usr/bin/env python3
"""Cache credited HoYoverse artwork locally to avoid blocked third-party image hotlinks."""
from pathlib import Path
from urllib.request import Request,urlopen
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'assets'/'official'
ART.mkdir(parents=True,exist_ok=True)
ARTWORK={
 'pompom-hoyoverse.jpg':'https://webstatic.hoyoverse.com/upload/op-public/2023/02/10/b6265906953e1c7d56fd495e714aee05_2995041360877409546.jpg',
 'aha-4-7.png':'https://i.gachabase.net/mZQZSbIAQyJXbDElL_RE2AwSR7C4X0pOBxgQ3ybCNnA/q%3A50/f%3Awebp/plain/hsr/assets/f8b5630e85022ab8b2761e4e3f614b42.png',
 'aha-4-7-promo.jpg':'https://cimg.kgl-systems.io/camion/files/87996/ogp_zdhP.jpg?x=1280'
}
for name,url in ARTWORK.items():
 dest=ART/name
 if dest.exists() and dest.stat().st_size>3000:continue
 try:
  req=Request(url,headers={'User-Agent':'Mozilla/5.0 (Anderus fansite)','Referer':'https://hsr.hoyoverse.com/'})
  with urlopen(req,timeout=22) as response:
   raw=response.read()
  if len(raw)<3000 or not(raw[:3]==b'\xff\xd8\xff' or raw[:4]==b'\x89PNG'):
   raise ValueError('Art response not expected JPEG/PNG')
  dest.write_bytes(raw)
  print('Saved',name,len(raw))
 except Exception as exc:
  print('Image unavailable:',name,str(exc)[:100])
