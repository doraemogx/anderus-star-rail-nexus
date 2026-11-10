#!/usr/bin/env python3
"""Atomic, validated PT-BR game data sync with rollback and material diffs.

Upstream: community-maintained Mar-7th/StarRailRes. Does not confer official
status on beta information. No destructive write on partial upstream failures.
"""
import json
import os
import pathlib
import time
import urllib.request
from datetime import datetime, timezone

ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / "data"
SOURCE = "https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/index_min/pt/"
KEEP = {
    "characters": ["id", "name", "rarity", "rank", "element", "path", "tag", "skills", "ranks", "icon", "portrait", "preview"],
    "character_ranks": ["id", "name", "rank", "desc", "icon"],
    "character_skills": ["id", "name", "desc", "icon", "type", "type_text", "effect", "effect_text", "params", "max_level"],
    "light_cones": ["id", "name", "rarity", "path", "icon", "portrait", "preview"],
    "light_cone_ranks": ["id", "skill", "desc", "params"],
    "relic_sets": ["id", "name", "desc", "icon"],
    "relics": ["id", "name", "set_id", "type", "icon", "max_level", "rarity"],
}
KEYS = {
    "characters": "chars", "character_ranks": "ranks",
    "character_skills": "skills", "light_cones": "cones",
    "light_cone_ranks": "coneRanks", "relic_sets": "relicSets", "relics": "relics"
}
THRESHOLDS = {
    "chars": 90, "ranks": 500, "skills": 450, "cones": 150,
    "coneRanks": 150, "relicSets": 25, "relics": 100
}

def get(label):
    request = urllib.request.Request(
        SOURCE + label + ".json",
        headers={"User-Agent": "Anderus-Nexus-Catalog-Sync/2.0"}
    )
    for i in range(3):
        try:
            with urllib.request.urlopen(request, timeout=25) as response:
                raw = json.load(response)
            if not isinstance(raw, dict) or len(raw) < 40:
                raise ValueError("Dataset missing records: " + label)
            return {
                str(key): {field: value[field] for field in KEEP[label] if field in value}
                for key, value in raw.items() if isinstance(value, dict)
            }
        except Exception:
            if i == 2:
                raise
            time.sleep(3 * (i + 1))

def validate(payload, previous=None):
    for key, minimum in THRESHOLDS.items():
        records = payload.get(key)
        if not isinstance(records, dict) or len(records) < minimum:
            raise ValueError(f"Rejected dataset {key}: expected >= {minimum} records")
        if previous and len(records) < .90 * len(previous.get(key, {})):
            raise ValueError(f"Rejected unexpected drop in {key} record count")
    chars, skills, ranks = payload["chars"], payload["skills"], payload["ranks"]
    valid_characters = 0
    for ident, character in chars.items():
        if not character.get("name") or str(character.get("id", ident)) != ident:
            raise ValueError(f"Invalid character identity: {ident}")
        skill_ids = character.get("skills") or []
        rank_ids = character.get("ranks") or []
        if sum(bool(skills.get(sid, {}).get("desc")) for sid in skill_ids) >= 4 and sum(
            bool(ranks.get(rid, {}).get("desc")) for rid in rank_ids
        ) >= 6:
            valid_characters += 1
    if valid_characters < .90 * len(chars):
        raise ValueError(f"Kit/Eidolon coverage too low: {valid_characters}/{len(chars)}")
    missing_cone_effects = [cid for cid in payload["cones"] if not payload["coneRanks"].get(cid, {}).get("desc")]
    if missing_cone_effects:
        raise ValueError(f"Missing Light Cone effects: {len(missing_cone_effects)}")
    for sid, relic_set in payload["relicSets"].items():
        if not relic_set.get("name"):
            raise ValueError(f"Relic set missing name: {sid}")
    return True

def changed(old, new):
    if old is None:
        return True
    return any(old.get(key) != new.get(key) for key in THRESHOLDS)

def atomic_json(destination, value):
    temp = destination.with_name(destination.name + ".tmp")
    try:
        with temp.open("w", encoding="utf-8") as stream:
            json.dump(value, stream, ensure_ascii=False, separators=(",", ":"))
            stream.flush()
            os.fsync(stream.fileno())
        temp.replace(destination)
    finally:
        if temp.exists():
            temp.unlink()

def diff_summary(old, new):
    result = {}
    for key in THRESHOLDS:
        before, after = (old or {}).get(key, {}), new[key]
        modified = sum(ident not in before or before[ident] != value for ident, value in after.items())
        removed = sum(ident not in after for ident in before)
        if modified or removed:
            result[key] = {"new_or_changed": modified, "removed": removed,
                           "previous_total": len(before), "current_total": len(after)}
    return result

def main():
    now = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    DATA.mkdir(parents=True, exist_ok=True)
    current_file = DATA / "live-game.json"
    previous_file = DATA / "live-game.previous.json"
    changelog_file = DATA / "catalog-changelog.json"
    previous = json.loads(current_file.read_text(encoding="utf-8")) if current_file.exists() else None
    datasets = {KEYS[label]: get(label) for label in KEEP}
    payload = {
        "checkedAt": now,
        "source": "Mar-7th/StarRailRes · index_min/pt",
        "sourceKind": "community-structured",
        "scope": "Dados estruturados de jogo; não valida Endgame, meta ou vazamentos",
        **datasets
    }
    validate(payload, previous)
    if not changed(previous, payload):
        print(f"SYNC_OK {now}: no material changes; previous catalogue preserved")
        return
    summary = diff_summary(previous, payload)
    history = json.loads(changelog_file.read_text(encoding="utf-8")) if changelog_file.exists() else []
    if not isinstance(history, list):
        history = []
    history.insert(0, {"checkedAt": now, "source": payload["source"], "changes": summary})
    # Never erase the last known-good snapshot until the candidate is validated.
    if previous is not None:
        atomic_json(previous_file, previous)
    atomic_json(current_file, payload)
    atomic_json(changelog_file, history[:30])
    print(f"SYNC_UPDATED {now}: " + json.dumps(summary, ensure_ascii=False))

if __name__ == "__main__":
    main()
