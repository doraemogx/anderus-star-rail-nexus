#!/usr/bin/env python3
"""Local validation of catalogue and rollback safety without HTTP requests."""
import importlib.util
import json
import pathlib
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("sync_game", ROOT/"scripts"/"sync_game.py")
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)
sample = json.loads((ROOT/"data"/"live-game.json").read_text(encoding="utf-8"))
assert mod.validate(sample)
assert not mod.changed(sample, sample)
candidate = json.loads(json.dumps(sample))
candidate["skills"] = {}
try:
    mod.validate(candidate, sample)
except ValueError:
    pass
else:
    raise AssertionError("Incomplete upstream dataset should be rejected")
candidate = json.loads(json.dumps(sample))
key = next(iter(candidate["chars"]))
candidate["chars"][key]["name"] = ""
try:
    mod.validate(candidate, sample)
except ValueError:
    pass
else:
    raise AssertionError("Invalid character name should be rejected")
with tempfile.TemporaryDirectory() as directory:
    file = pathlib.Path(directory)/"snapshot.json"
    mod.atomic_json(file, sample)
    assert json.loads(file.read_text(encoding="utf-8"))["chars"] == sample["chars"]
    assert not file.with_name(file.name+".tmp").exists()
print("PASS catalogue verification, rejection of incomplete source, and atomic snapshot")
