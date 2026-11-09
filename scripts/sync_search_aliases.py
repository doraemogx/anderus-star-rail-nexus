#!/usr/bin/env python3
"""Atomic synchronization of English aliases for the canonical PT-BR catalogue."""
import json
import os
from datetime import datetime,timezone
from pathlib import Path
from urllib.request import Request,urlopen

ROOT=Path(__file__).resolve().parents[1]
DEST=ROOT/"data"/"search-aliases.json"
BASE="https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_min/en/"
SOURCES={"character":"characters","cone":"light_cones","set":"relic_sets","item":"relics","material":"items"}
MINIMUM={"character":90,"cone":150,"set":25,"item":650,"material":3000}

def fetch(filename):
    req=Request(BASE+filename+".json",headers={"User-Agent":"Anderus-Nexus-Search-Aliases/2.0"})
    with urlopen(req,timeout=35) as response:
        records=json.load(response)
    if not isinstance(records,dict):raise ValueError("Invalid upstream "+filename)
    return records

def main():
    old=json.loads(DEST.read_text(encoding="utf-8")) if DEST.exists() else None
    result={"source":"Mar-7th/StarRailRes index_min/en","sourceKind":"community-structured",
       "checkedAt":datetime.now(timezone.utc).date().isoformat()}
    for category,source in SOURCES.items():
        upstream=fetch(source)
        names={str(id):row["name"] for id,row in upstream.items()
          if isinstance(row,dict) and isinstance(row.get("name"),str) and row["name"].strip()}
        if len(names)<MINIMUM[category]:raise ValueError("Incomplete aliases: "+category)
        if old and len(names)<.9*len(old.get(category,{})):raise ValueError("Unexpected alias loss: "+category)
        result[category]=names
    if old and all(old.get(key)==result[key] for key in SOURCES):
        print("SEARCH_ALIAS_SYNC_OK: no material changes")
        return
    temp=DEST.with_suffix(".json.tmp")
    try:
        with temp.open("w",encoding="utf-8") as stream:
            json.dump(result,stream,ensure_ascii=False,separators=(",",":"))
            stream.flush();os.fsync(stream.fileno())
        temp.replace(DEST)
    finally:
        temp.unlink(missing_ok=True)
    print("SEARCH_ALIAS_UPDATED",", ".join(f"{k}={len(result[k])}" for k in SOURCES))

if __name__=="__main__":main()
