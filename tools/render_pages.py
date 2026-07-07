"""Re-render full pages (dpi150) from the 6 source PDFs for OCR reading.
Usage: python3 render_pages.py <out_dir>
Outputs <out_dir>/pages/{A-F}/{code}_pNN.png and <out_dir>/pagemap.json
(pagemap: domain -> pageStr -> pos -> slideId, built from ../data/slides.json)

Needed because the scratchpad working dir is wiped between sessions.
Adjust SRC if the FP PDFs move.
"""
import fitz, os, json, sys, glob

SRC = os.environ.get("FP_PDF_DIR", os.path.expanduser("~/Desktop/FP/"))
MAP = [("_FP_PremiumA_2025.pdf", "A"), ("_FP_PremiumB_2025.pdf", "B"),
       ("2_PremiumC_2025.pdf", "C"), ("2_PremiumD_2025.pdf", "D"),
       ("_FP_PremiumE_2025.pdf", "E"), ("2_PremiumF_2025.pdf", "F")]

def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "/tmp/fp_pages"
    for fname, code in MAP:
        d = os.path.join(out, "pages", code)
        os.makedirs(d, exist_ok=True)
        doc = fitz.open(SRC + fname)
        n = doc.page_count
        for pno in range(n):
            doc[pno].get_pixmap(dpi=150).save(f"{d}/{code}_p{pno+1:02d}.png")
        doc.close()
        print(f"{code}: {n} pages -> {d}")
    # pagemap from slides.json
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    sj = json.load(open(os.path.join(base, "data", "slides.json"), encoding="utf-8"))
    look = {}
    for s in sj["slides"]:
        look.setdefault(s["domain"], {}).setdefault(str(s["page"]), {})[s["pos"]] = s["id"]
    json.dump(look, open(os.path.join(out, "pagemap.json"), "w"), ensure_ascii=False)
    print("pagemap.json written to", out)

if __name__ == "__main__":
    main()
