# FP2級 検索サイト — OCR進捗 & 再開手順

> ✅ **2026-07-07 OCR完了：全724/724枚（A153・B105・C127・D146・E96・F97）。全スライドにtext投入済み。残タスクはデプロイのみ。**

## 目的
6分野の講義PDF（画像スライド）を全文検索できる静的サイト。各スライド画像の文字起こし（OCR）を `data/slides.json` の `text` に投入すると検索が効く。OCRは高精度方針＝Claudeが画像を読む。

## 現状データ
- スライド画像: `slides/{A-F}/{ID}.jpg`（724枚、抽出済み・不変）
- 検索データ: `data/slides.json`（`merge_ocr.py` が生成）
- OCRテキスト（作業中の正本）: `data/ocr/{A-F}.json` … `{ "A-001": "本文…", ... }`

## 進捗確認
```
python3 tools/status.py
```
各分野の done/total と「次に読むべきスライドID」を表示。

## 再開手順（新セッションでも可）
1. ページ画像を再生成（scratchpadは消えるため毎セッション必要）:
   ```
   python3 tools/render_pages.py /tmp/fp_pages
   ```
   → `/tmp/fp_pages/pages/{A-F}/{code}_pNN.png` と `/tmp/fp_pages/pagemap.json` ができる。
2. `tools/status.py` で次に読む分野・IDを確認。
3. 該当ページPNGを読み、4象限（pos 1=左上,2=右上,3=左下,4=右下）を pagemap のIDに対応付けて文字起こし。
4. `data/ocr/{分野}.json` に追記（既存を load→update→dump）。
5. 反映: `python3 data/merge_ocr.py`。
6. プレビュー確認する場合は `data/slides.json` を配信ディレクトリにコピー。

## メモ
- pos→IDは `pagemap.json` を必ず参照（空白象限は抽出時に除外済みなので、pageによって存在するposが違う）。
- 章扉（大きい数字のみの青いスライド）は見出しだけでOK。
- 完了後: `data/slides.json` を配信し、Netlify等へデプロイ。
