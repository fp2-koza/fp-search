"""Show OCR progress: how many slides per domain have text, and the next
un-OCR'd slide id per domain. Usage: python3 status.py
"""
import json, os, glob, re

base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sj = json.load(open(os.path.join(base, "data", "slides.json"), encoding="utf-8"))
done = {}
for p in glob.glob(os.path.join(base, "data", "ocr", "*.json")):
    done.update(json.load(open(p, encoding="utf-8")))

per = {}
for s in sj["slides"]:
    dom = s["domain"]
    per.setdefault(dom, {"total": 0, "done": 0, "next": None})
    per[dom]["total"] += 1
    if s["id"] in done and done[s["id"]].strip():
        per[dom]["done"] += 1
    elif per[dom]["next"] is None:
        per[dom]["next"] = s["id"]

tot = totd = 0
for dom in sorted(per):
    v = per[dom]
    tot += v["total"]; totd += v["done"]
    print(f"{dom}: {v['done']:3d}/{v['total']:3d}  next={v['next']}")
print(f"TOTAL: {totd}/{tot}  ({100*totd//tot}%)")
