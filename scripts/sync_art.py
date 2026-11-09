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
 'aha-4-7-promo.jpg':'https://cimg.kgl-systems.io/camion/files/87996/ogp_zdhP.jpg?x=1280',
 'aha-4-7.webp':'https://i.gachabase.net/mZQZSbIAQyJXbDElL_RE2AwSR7C4X0pOBxgQ3ybCNnA/q%3A50/f%3Awebp/plain/hsr/assets/f8b5630e85022ab8b2761e4e3f614b42.png',
 'aha-e1.webp':'https://i.gachabase.net/v1qrHPLrRMBPiRVnwpWwWpOla3M7Btlqh9jadm8bqSM/q%3A50/f%3Awebp/plain/hsr/assets/c814e3c60dadd2737e2e63258ed6746a.png',
 'aha-e2.webp':'https://i.gachabase.net/SzesvVqY1WGe7JKveA7_DfeaCkRlW1oyWOkXZEz1i7M/q%3A50/f%3Awebp/plain/hsr/assets/0dcd88c3b4d84c25dbd6f30572c8e033.png',
 'aha-e3.webp':'https://i.gachabase.net/LyZgEvPxkCy7R63IAo-xGFXW6R6-AS6fv5dxmsOcEGg/q%3A50/f%3Awebp/plain/hsr/assets/dc975a2c69a0f3528d2e91c5ae9ea84b.png',
 'aha-e4.webp':'https://i.gachabase.net/AtCJ_4IddWvaOm_yqBvwL4tnjQ6hDEMPgYLoXPT_fKs/q%3A50/f%3Awebp/plain/hsr/assets/f130720b5df8145af9e0e8ec3ca34811.png',
 'aha-e5.webp':'https://i.gachabase.net/diWuu9Fu7qnt0RezCduk1z2V8BfHM0cbS3kS-RTExsQ/q%3A50/f%3Awebp/plain/hsr/assets/8d62bc4ad30b5eadb79e715e7bdfa66f.png',
 'aha-e6.webp':'https://i.gachabase.net/pHpoDN26hI3jFPJcINvzY8q7vGYH7AwSQ8bwTGUkK3s/q%3A50/f%3Awebp/plain/hsr/assets/8980b47e7d24b73ac5f98dd3eba8d14b.png'
}
for name,url in ARTWORK.items():
 dest=ART/name
 if dest.exists() and dest.stat().st_size>3000:continue
 try:
  req=Request(url,headers={'User-Agent':'Mozilla/5.0 (Anderus fansite)','Referer':'https://hsr.hoyoverse.com/'})
  with urlopen(req,timeout=22) as response:
   raw=response.read()
  if len(raw)<3000 or not(raw[:3]==b'\xff\xd8\xff' or raw[:4]==b'\x89PNG' or (raw[:4]==b'RIFF' and raw[8:12]==b'WEBP')):
   raise ValueError('Art response not expected JPEG/PNG')
  dest.write_bytes(raw)
  print('Saved',name,len(raw))
 except Exception as exc:
  print('Image unavailable:',name,str(exc)[:100])
