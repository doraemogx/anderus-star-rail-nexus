#!/usr/bin/env python3
"""Sync real per-character Eidolon fragment art from the HSR Wiki's file API.

All files are addressed by their own character AND Eidolon level (1..6).
Never replace artwork with an icon, another character's art or guessed media URLs.
The 3-hour content workflow rechecks new game characters and available images.
This saves an audited URL catalog, not hundreds of duplicated binary files.
"""
import json
import pathlib
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'data/eidolon-art.json'
PT = ROOT / 'data/live-game.json'
EN_URL = 'https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_min/en/characters.json'
API = 'https://honkai-star-rail.fandom.com/api.php'
BASE = 'https://static.wikia.nocookie.net/houkai-star-rail/images/'
HEADERS = {'User-Agent': 'Anderus-Star-Rail-Nexus/1.0 (noncommercial fan site, image inventory sync)',
           'Accept': 'application/json,text/plain,*/*'}

# Article and filename variants that do not match the in-game English display name.
ALIASES = {
    '1001': ['March 7th (Preservation)', 'March 7th'],
    '1224': ['March 7th (The Hunt)', 'March 7th'],
    '1112': ['Topaz and Numby', 'Topaz & Numby'],
    '8001': ['Trailblazer', 'Trailblazer (Destruction)'],
    '8002': ['Trailblazer', 'Trailblazer (Destruction)'],
    '8003': ['Trailblazer', 'Trailblazer (Preservation)'],
    '8004': ['Trailblazer', 'Trailblazer (Preservation)'],
    '8005': ['Trailblazer', 'Trailblazer (Harmony)'],
    '8006': ['Trailblazer', 'Trailblazer (Harmony)'],
    '8007': ['Trailblazer', 'Trailblazer (Remembrance)'],
    '8008': ['Trailblazer', 'Trailblazer (Remembrance)'],
    '8009': ['Trailblazer', 'Trailblazer (Elation)'],
    '8010': ['Trailblazer', 'Trailblazer (Elation)'],
    '1309': ['Robin'],
    '1512': ['Robin • Summeretto', 'Robin (Summeretto)'],
    '1513': ['Aventurine • Waveflair', 'Aventurine (Waveflair)'],
    '1510': ['Himeko • Nova', 'Himeko (Nova)'],
    '1506': ['Silver Wolf LV.999', 'Silver Wolf Lv.999'],
    '1414': ['Dan Heng • Permansor Terrae', 'Dan Heng Permansor Terrae'],
    '1213': ['Dan Heng • Imbibitor Lunae', 'Dan Heng Imbibitor Lunae'],
}
def read_url(url, tries=3):
    request = urllib.request.Request(url, headers=HEADERS)
    for attempt in range(tries):
        try:
            with urllib.request.urlopen(request, timeout=23) as resp:
                return resp.read()
        except Exception:
            if attempt == tries-1: raise
            time.sleep(attempt+1)

def wiki_file(name, n):
    return 'File:Character ' + name + ' Eidolon ' + str(n) + '.png'

def imageinfo_batch(titles):
    """MediaWiki supports a batch of up to 50 file titles per API call."""
    args = urllib.parse.urlencode({'action':'query', 'format':'json', 'formatversion':2,
       'prop':'imageinfo','iiprop':'url','iilimit':1,
       'redirects':1, 'titles':'|'.join(titles)}, quote_via=urllib.parse.quote)
    result=json.loads(read_url(API+'?'+args))
    return result.get('query',{})

def fetch_image_map(titles):
    found={}
    for offset in range(0,len(titles),35):
        batch=titles[offset:offset+35]
        q=imageinfo_batch(batch)
        normalized={rec['to']:rec['from'] for rec in q.get('normalized',[])}
        redirected={rec['to']:rec['from'] for rec in q.get('redirects',[])}
        for page in q.get('pages',[]):
            page_title=page.get('title','')
            raw=page_title
            for _ in range(4):
                raw=normalized.get(raw,redirected.get(raw,raw))
            records=page.get('imageinfo') or []
            url=records[0].get('url','') if records else ''
            if url.startswith(BASE) and page_title.lower().endswith('.png'):
                for title in {raw,page_title}:
                    found[title]=url
        if offset and offset%175==0:time.sleep(.4)
    return found

def run():
    pt=json.loads(PT.read_text(encoding='utf-8'))
    en=json.loads(read_url(EN_URL))
    previous=json.loads(OUTPUT.read_text(encoding='utf-8')) if OUTPUT.exists() else {}
    old=previous.get('characters',{})
    candidates={}
    titles=set()
    for id,char in pt.get('chars',{}).items():
        fallback=en.get(id,{}).get('name','')
        names=ALIASES.get(id,[])
        if fallback and fallback!='{NICKNAME}' and fallback not in names:names=[fallback]+names
        names=[name for name in dict.fromkeys(names) if name]
        if id.startswith('800') or id=='8010':
            # The Wiki publishes six reusable fragments per Trailblazer appearance.
            # Gender is encoded by the game ID; never show Stelle for Caelus.
            gender='Male' if int(id)%2 else 'Female'
            names=['Trailblazer '+gender]
        candidates[id]=[[wiki_file(name,n) for name in names] for n in range(1,7)]
        for options in candidates[id]:titles.update(options)
    try:
        images=fetch_image_map(sorted(titles))
    except Exception as exc:
        if old:
            print('Temporary source error; preserving previously validated artwork:',exc)
            return
        raise
    artwork={}
    missing=[]
    for id,char in pt.get('chars',{}).items():
        arr=[]
        for n,options in enumerate(candidates[id],1):
            url=next((images[t] for t in options if t in images),'')
            if not url:
                earlier=old.get(id,[])
                url=earlier[n-1] if len(earlier)>=n else ''
            # Only accepted official HSR file-host paths; never guess missing URLs.
            if not url.startswith(BASE):url=''
            if not url:missing.append({'id':id,'name':char.get('name'), 'eidolon':n})
            arr.append(url)
        artwork[id]=arr
    last=previous.get('characters',{})
    existing_date=previous.get('updatedAt')
    payload={'source':'Honkai: Star Rail Wiki / MediaWiki imageinfo (original character Eidolon images)',
      'license':'HoYoverse assets — fan site, noncommercial',
      'updatedAt':existing_date if last==artwork else datetime.now(timezone.utc).isoformat(timespec='seconds'),
      'characters':artwork}
    OUTPUT.parent.mkdir(parents=True,exist_ok=True)
    OUTPUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    total=sum(bool(url) for arr in artwork.values() for url in arr)
    print('ART SYNC:',len(artwork),'characters;',total,'/',len(artwork)*6,'real image URLs')
    if missing:
        print('MISSING:',len(missing),'Eidolons without verified artwork')
        print('EXAMPLES:',json.dumps(missing[:20],ensure_ascii=False))
    for key in ['1505','1503','1003']:
        print('SAMPLE',key,json.dumps(artwork.get(key,[])[:2]))
if __name__=='__main__':
    run()
