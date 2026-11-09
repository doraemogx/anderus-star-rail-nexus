#!/usr/bin/env python3
"""Sync PT-BR trace descriptions and costs with integrity checks.

Preserves the last published dataset if the upstream download is incomplete.
This community source is not an official HoYoverse verification.
"""
import json
import os
from pathlib import Path
from urllib.request import Request, urlopen
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "data" / "character-traces.json"
SOURCE = "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_min/pt/"
def read(name):
    req = Request(SOURCE + name + ".json", headers={"User-Agent":"Anderus-Nexus-Traces-Sync/2.0"})
    with urlopen(req, timeout=35) as response:
        data=json.load(response)
    if not isinstance(data,dict) or len(data)<100:
        raise ValueError("Incomplete upstream catalogue "+name)
    return data

def transform(raw, items):
    trees={}
    ids=set()
    for node_id,node in raw.items():
        if not isinstance(node,dict):continue
        character_id=str(node_id)[:4]
        levels=[]
        for level in node.get("levels",[]):
            materials=[]
            for item in level.get("materials",[]):
                item_id=str(item.get("id",""))
                number=item.get("num")
                if not item_id or not isinstance(number,(int,float)) or number<0:
                    raise ValueError("Bad trace cost "+str(node_id))
                ids.add(item_id)
                materials.append({"id":item_id,"num":number})
            levels.append({"promotion":level.get("promotion",0),
                "level":level.get("level",0),
                "properties":level.get("properties",[]),
                "materials":materials})
        trees.setdefault(character_id,[]).append({
            "id":str(node_id),"name":node.get("name",""),
            "desc":node.get("desc",""),"maxLevel":node.get("max_level",1),
            "params":node.get("params",[]),"anchor":node.get("anchor",""),
            "prePoints":node.get("pre_points",[]),
            "levelUpSkills":node.get("level_up_skills",[]),
            "levels":levels,"icon":node.get("icon","")})
    if len(trees)<90 or sum(map(len,trees.values()))<1500:
        raise ValueError("Too few trace records")
    index={}
    for item_id in ids:
        row=items.get(item_id)
        if not isinstance(row,dict) or not row.get("name"):
            raise ValueError("Missing item name: "+item_id)
        index[item_id]={"name":row["name"],"rarity":row.get("rarity",0),
            "icon":row.get("icon",""),"come_from":(row.get("come_from") or [])[:5]}
    return trees,index

def main():
    raw=read("character_skill_trees")
    items=read("items")
    trees,index=transform(raw,items)
    old=json.loads(DEST.read_text(encoding="utf-8")) if DEST.exists() else None
    if old and (len(trees)<.9*len(old["trees"]) or
                 sum(map(len,trees.values())) < .9 * sum(map(len,old["trees"].values()))):
        raise ValueError("Decline unexpected loss of trace records")
    if old and old.get("trees")==trees and old.get("items")==index:
        print("TRACE_SYNC_OK unchanged")
        return
    payload={"source":"Mar-7th/StarRailRes index_min/pt/character_skill_trees + items",
      "sourceKind":"community-structured",
      "checkedAt":datetime.now(timezone.utc).date().isoformat(),
      "trees":trees,"items":index}
    tmp=DEST.with_suffix(".json.tmp")
    try:
        with tmp.open("w",encoding="utf-8") as output:
            json.dump(payload,output,ensure_ascii=False,separators=(",",":"))
            output.flush()
            os.fsync(output.fileno())
        tmp.replace(DEST)
    finally:
        tmp.unlink(missing_ok=True)
    print("TRACE_SYNC_UPDATED",len(trees),"characters",sum(map(len,trees.values())),"nodes")
if __name__=="__main__": main()
