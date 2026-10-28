"""contract-ready 스키마를 예시로 검증한다. 사용: python3 check_contract_ready.py (이 폴더에서). 어긋나면 비0 종료.
검사: 스키마 자체(check_schema), $id가 '<이름>.schema.json', title이 이름, MANIFEST 항목과 파일 일치, valid 통과, invalid 거부(형식마다 1개 이상)."""
import json, pathlib, sys
from jsonschema import Draft202012Validator, RefResolver

here = pathlib.Path(__file__).parent
manifest = json.loads((here / "MANIFEST.json").read_text())
schemas = {p.name.removesuffix(".schema.json"): json.loads(p.read_text()) for p in (here / "schemas").glob("*.schema.json")}
store = {s["$id"]: s for s in schemas.values()}
bad, passed, rejected = 0, 0, 0
def fail(msg):
    global bad; bad += 1; print("FAIL", msg)
names = [m["name"] for m in manifest["items"]]
if sorted(names) != sorted(schemas): fail(f"MANIFEST와 schemas 불일치: {sorted(names)} vs {sorted(schemas)}")
for m in manifest["items"]:
    for k in ("name", "source_draft", "producer", "consumers", "unknown_keys", "note"):
        if k not in m: fail(f"{m.get('name')}: MANIFEST 키 {k} 없음")
    if m["unknown_keys"] not in ("reject", "ignore"): fail(f"{m['name']}: unknown_keys")
for name, s in sorted(schemas.items()):
    Draft202012Validator.check_schema(s)
    if s["$id"] != f"{name}.schema.json" or s["title"] != name or s["$schema"] != "https://json-schema.org/draft/2020-12/schema": fail(f"{name}: $id/title/$schema")
    v = Draft202012Validator(s, resolver=RefResolver.from_schema(s, store=store))
    for kind in ("valid", "invalid"):
        files = sorted((here / "examples" / kind).glob(name + ".*json"))
        files = [f for f in files if f.name == name + ".json" or f.name.startswith(name + ".")]
        if kind == "invalid" and not files: fail(f"{name}: invalid 예시 없음")
        if kind == "valid" and not files: fail(f"{name}: valid 예시 없음")
        for f in files:
            errs = list(v.iter_errors(json.loads(f.read_text())))
            ok = (not errs) if kind == "valid" else bool(errs)
            if ok: passed += kind == "valid"; rejected += kind == "invalid"
            else: bad += 1
            print(("OK  " if ok else "FAIL"), f"{kind}/{f.name}", "->", "통과" if not errs else "거부: " + errs[0].message[:70])
print(f"스키마 {len(schemas)}개, 통과(valid) {passed}건, 거부(invalid) {rejected}건, 실패 {bad}건")
sys.exit(1 if bad else 0)
