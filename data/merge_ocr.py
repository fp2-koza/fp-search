"""Merge per-domain OCR text (data/ocr/{A-F}.json => {id: text}) into slides.json."""
import json, os, glob
base = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(base, "slides.json"), encoding="utf-8") as f:
    data = json.load(f)
text_map = {}
for p in glob.glob(os.path.join(base, "ocr", "*.json")):
    with open(p, encoding="utf-8") as f:
        text_map.update(json.load(f))
n = 0
for s in data["slides"]:
    if s["id"] in text_map:
        s["text"] = text_map[s["id"]]
        n += 1
with open(os.path.join(base, "slides.json"), "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)
print(f"merged {n}/{len(data['slides'])} slides with OCR text")
"""After running, copy slides.json to the scratchpad serve dir to preview."""
