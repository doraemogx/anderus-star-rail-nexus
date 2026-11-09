#!/usr/bin/env python3
"""Synchronize sourced ascension costs; never publish incomplete material data."""
import json
import os
import pathlib
import urllib.request
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_min/pt/"
DEST = ROOT / "data" / "ascension-materials.json"

def fetch(name):
    request = urllib.request.Request(SOURCE + name + ".json", headers={"User-Agent": "Anderus-Nexus-Farm-Sync/2.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        obj = json.load(response)
    if not isinstance(obj, dict) or len(obj) < 80:
        raise ValueError("Unexpected upstream material catalogue size: " + name)
    return obj

def prepare(promos, items):
    characters, ids = {}, set()
    for ident, entry in promos.items():
        stages = entry.get("materials", [])[:6] if isinstance(entry, dict) else []
        if len(stages) != 6:
            continue
        materials = []
        for stage in stages:
            if not isinstance(stage, list):
                raise ValueError("Material stage is not a list: " + ident)
            rows = []
            for item in stage:
                item_id = str(item.get("id", ""))
                amount = item.get("num")
                if not item_id or not isinstance(amount, (float, int)) or amount < 0:
                    raise ValueError("Invalid material requirement: " + ident)
                ids.add(item_id)
                rows.append({"id": item_id, "num": amount})
            materials.append(rows)
        characters[str(ident)] = materials
    if len(characters) < 90:
        raise ValueError("Incomplete character ascension cost list")
    materials = {}
    for ident in ids:
        row = items.get(ident)
        if not isinstance(row, dict) or not row.get("name"):
            raise ValueError("Missing material definition: " + ident)
        materials[ident] = {
            "id": ident, "name": row["name"],
            "rarity": row.get("rarity", 0),
            "icon": row.get("icon", ""),
            "come_from": (row.get("come_from") or [])[:6]
        }
    return characters, materials

def main():
    promos, items = fetch("character_promotions"), fetch("items")
    characters, materials = prepare(promos, items)
    old = json.loads(DEST.read_text(encoding="utf-8")) if DEST.exists() else None
    if old and old.get("promotions") == characters and old.get("items") == materials:
        print("FARM_SYNC_OK: no material changes")
        return
    if old and len(characters) < .9 * len(old.get("promotions", {})):
        raise ValueError("Refusing to drop more than 10 percent of character promotions")
    payload = {
        "source": "Mar-7th/StarRailRes index_min/pt/character_promotions + items",
        "sourceKind": "community-structured",
        "promotions": characters, "items": materials,
        "checkedAt": datetime.now(timezone.utc).date().isoformat(),
        "scope": "Materiais de ascensão; XP de níveis e rastros não incluídos"
    }
    DEST.parent.mkdir(parents=True, exist_ok=True)
    temp = DEST.with_suffix(".json.tmp")
    try:
        with temp.open("w", encoding="utf-8") as stream:
            json.dump(payload, stream, ensure_ascii=False, separators=(",", ":"))
            stream.flush()
            os.fsync(stream.fileno())
        temp.replace(DEST)
    finally:
        temp.unlink(missing_ok=True)
    print("FARM_SYNC_UPDATED: characters", len(characters), "items", len(materials))

if __name__ == "__main__":
    main()
