# 照 Canva 排版頁面（電腦版 1440）的資料產生器：讀 docs/<頁>-canva-elements.json（Canva 一次讀出的座標），
# 產生 src/_data/<頁>.json（每段的文字、按鈕座標）並把去字底圖切成每段一張 WebP（src/assets/img/<頁>/）。
# 用法：python3 scripts/build-canvas-data.py <頁面> <去字底圖.png>     例：python3 scripts/build-canvas-data.py courses base.png
#   頁面設定（段落、按鈕連結、價格對應、共用頁首頁尾）在 scripts/canvas_pages.py
#   首頁（有魚類動畫）用 scripts/build-home-data.py
# 注意：<頁>.json 是產生出來的；要改文字，改 canvas_pages.py 的 overrides 再重跑。
import json, sys, os
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from canvas_pages import PAGES

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LABEL_COLOR = "#edc40f"  # 黃色「● …」設計標籤：整段是這個顏色的文字不做進網站
K = 1.2  # Canva 文字框第一行高度 ≈ 1.2 × 字級


def r(v, n=1):
    return round(v, n)


def text_item(e, ov):
    regs = e["textRegions"]
    f = regs[0]["formatting"]
    fs, lh = f["fontSize"], f["lineHeight"]
    it = {"kind": "text", "id": e["id"],
          "x": r(e["left"]), "y": r(e["top"] - (lh - K) * fs / 2), "w": r(e["width"] + 4),
          "fs": r(fs), "fw": 700 if f["fontWeight"] == "bold" else 400, "color": f["color"],
          "lh": lh, "align": {"start": "left", "center": "center", "end": "right"}[f["textAlign"]]}
    if f.get("letterSpacing"):
        it["ls"] = f["letterSpacing"]
    if f.get("decoration") == "underline":
        it["ul"] = True
    if e.get("opacity", 1) != 1:
        it["op"] = r(e["opacity"], 2)
    spans = [{"t": g["characters"], "c": g["formatting"]["color"]} for g in regs]
    if len(spans) > 1:
        spans[-1]["t"] = spans[-1]["t"].rstrip("\n")
        it["spans"] = spans
    else:
        it["text"] = spans[0]["t"].rstrip("\n")
    if "spans" in ov or "text" in ov:
        it.pop("spans", None); it.pop("text", None)
    it.update(ov)
    return it


def button(sh, tx, href):
    f = tx["textRegions"][0]["formatting"]
    p = sh["paths"][0]
    b = {"kind": "button", "x": r(sh["left"]), "y": r(sh["top"]), "w": r(sh["width"]), "h": r(sh["height"]),
         "radius": p["cornerRounding"], "bg": p["fill"]["color"]["color"],
         "label": tx["textRegions"][0]["characters"], "fs": r(f["fontSize"]), "fw": 700, "color": f["color"], "href": href}
    st = p.get("stroke") or {}
    if st.get("weight"):
        b.update({"bw": st["weight"], "bc": st["color"]["color"]})
    return b


def main():
    key, base = sys.argv[1], sys.argv[2]
    cfg = PAGES[key]
    d = json.load(open(os.path.join(ROOT, "docs", cfg["canva"])))
    page = d["design_content"]["pages"][0]
    H = page["dimensions"]["height"]
    allel = {}

    def index(es):
        for e in es:
            allel[e["id"]] = e
            index(e.get("children") or [])
    index(page["elements"])
    pair_shape = {s: (t, h) for s, t, h in cfg.get("pairs", [])}
    pair_text = {t for _, t, _ in cfg.get("pairs", [])}
    skip = set(cfg.get("skip", []))
    items = []

    def walk(e):
        if e["id"] in skip or e["id"] in pair_text:
            return
        if e["id"] in cfg.get("buttons", {}):
            sh = [c for c in e["children"] if c["type"] == "shape"][0]
            tx = [c for c in e["children"] if c["type"] == "text"][0]
            items.append(button(sh, tx, cfg["buttons"][e["id"]]))
            return
        if e["id"] in pair_shape:
            t, h = pair_shape[e["id"]]
            items.append(button(e, allel[t], h))
            return
        if e["type"] == "text":
            if not e.get("textRegions"):
                return
            if all(g["formatting"]["color"].lower() == LABEL_COLOR for g in e["textRegions"]):
                return
            items.append(text_item(e, cfg.get("overrides", {}).get(e["id"], {})))
            return
        for c in e.get("children") or []:
            walk(c)

    for e in page["elements"]:
        walk(e)

    def section_of(y):
        for k, _, a, b in cfg["sections"]:
            if a <= y < b:
                return k
        return cfg["sections"][-1][0]

    imgdir = os.path.join(ROOT, "src", "assets", "img", key)
    os.makedirs(imgdir, exist_ok=True)
    out = {"_說明": f"{cfg['title']}頁（電腦版 1440 寬）每段的文字、按鈕座標，由 scripts/build-canvas-data.py 從 Canva 產生（設定在 scripts/canvas_pages.py）。座標單位＝px，以 1440 寬為準。頁首、頁尾用首頁（home.json）的元素。",
           "width": 1440, "height": H, "imgDir": key, "active": cfg.get("active"), "sections": []}
    im = Image.open(base).convert("RGB")
    assert im.size == (1440, H), im.size
    for k, name, a, b in cfg["sections"]:
        sec = {"key": k, "name": name, "top": a, "height": b - a, "img": f"{key}_s_{k}.webp", "items": []}
        if k in cfg.get("shared", {}):
            sec["shared"] = cfg["shared"][k]
        for it in items:
            if section_of(it["y"]) == k:
                it2 = dict(it)
                it2["y"] = r(it["y"] - a)
                sec["items"].append(it2)
        out["sections"].append(sec)
        im.crop((0, a, 1440, b)).save(os.path.join(imgdir, sec["img"]), "WEBP", quality=88, method=6)
    json.dump(out, open(os.path.join(ROOT, "src", "_data", key + ".json"), "w"), ensure_ascii=False, indent=1)
    print("寫入", key, [(s["key"], len(s["items"])) for s in out["sections"]])


if __name__ == "__main__":
    main()
