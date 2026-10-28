"""초안 스키마를 예시 문서로 검증한다. 사용: python3 check_examples.py (이 폴더에서). valid는 통과, invalid는 거부되어야 하며 어긋나면 비0 종료."""
import json, pathlib, sys
from jsonschema import Draft202012Validator
from jsonschema import RefResolver

here = pathlib.Path(__file__).parent
schemas = {p.name: json.loads(p.read_text()) for p in here.glob("*.schema.json")}
store = {s["$id"]: s for s in schemas.values()}
bad = 0
for name, s in sorted(schemas.items()):
    Draft202012Validator.check_schema(s)
    base = name.removesuffix(".schema.json")
    v = Draft202012Validator(s, resolver=RefResolver.from_schema(s, store=store))
    for ex in sorted((here / "examples").glob(base + ".*.json")):
        kind = ex.name.split(".")[1]
        errs = list(v.iter_errors(json.loads(ex.read_text())))
        ok = (not errs) if kind.startswith("valid") else bool(errs)
        bad += not ok
        print(("OK  " if ok else "FAIL"), ex.name, "->", "통과" if not errs else "거부: " + errs[0].message[:70])
sys.exit(1 if bad else 0)
