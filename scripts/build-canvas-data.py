# 照 Canva 排版頁面（電腦版 1440）的資料產生器：讀 docs/<頁>-canva-elements.json（Canva 一次讀出的座標），
# 產生 src/_data/<頁>.json（每段的文字、按鈕座標）並把去字底圖切成每段一張 WebP（src/assets/img/<頁>/）。
# 用法：python3 scripts/build-canvas-data.py <頁面> <去字底圖.png> [只留插圖的透明.png]     例：python3 scripts/build-canvas-data.py courses base.png
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
FONT_DIR = "/usr/share/fonts/opentype/noto/"  # 量字寬用（Noto Sans CJK TC＝網站的 Noto Sans TC）


def text_right(t):
    """文字實際最右邊（px）：每一行量字寬；自動換行的段落（左右對齊）會排到框的右緣。（同 build-home-data.py）"""
    from PIL import ImageFont
    font = ImageFont.truetype(FONT_DIR + ("NotoSansCJK-Bold.ttc" if t["fw"] >= 700 else "NotoSansCJK-Regular.ttc"), round(t["fs"] * 4), index=3)
    body = "".join(x["t"] for x in t["spans"]) if t.get("spans") else t["text"]
    right = 0
    for line in body.split("\n"):
        wpx = font.getlength(line) / 4 + t.get("ls", 0) * t["fs"] * len(line)
        right = max(right, min(wpx, t["w"]))
    return t["x"] + right


def r(v, n=1):
    return round(v, n)


def text_item(e, ov, scale=1):
    regs = e["textRegions"]
    f = regs[0]["formatting"]
    fs, lh = f["fontSize"] * scale, f["lineHeight"]
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


def button(sh, tx, href, scale=1):
    f = tx["textRegions"][0]["formatting"]
    p = sh["paths"][0]
    b = {"kind": "button", "x": r(sh["left"]), "y": r(sh["top"]), "w": r(sh["width"]), "h": r(sh["height"]),
         "radius": p["cornerRounding"], "bg": p["fill"]["color"]["color"],
         "label": tx["textRegions"][0]["characters"], "fs": r(f["fontSize"] * scale), "fw": 700, "color": f["color"], "href": href}
    st = p.get("stroke") or {}
    if st.get("weight"):
        b.update({"bw": st["weight"], "bc": st["color"]["color"]})
    return b


def cut_illustrations(cfg, allel, illus, src, key):
    """插圖：src＝Canva 工作檔只留插圖、透明背景匯出的整頁 PNG（寬 1440）。
    illusMatte：匯出圖裡如果有刪不掉的鎖定底紋（半透明、顏色幾乎一致），把它從插圖底下「扣掉」，只留插圖本身。
    illusClip：Canva 上疊在插圖上面的東西（例如照片）的範圍，插圖在這些範圍內挖空，網頁才不會蓋到它們。"""
    import math
    import numpy as np
    from PIL import ImageDraw
    img = np.array(Image.open(src).convert("RGBA")).astype(float)
    Hh, Ww = img.shape[:2]
    mt = cfg.get("illusMatte")
    if mt:
        at = mt["alpha"] / 255.0
        tc = np.array(mt["color"], float)
        ac = img[..., 3] / 255.0
        ah = np.clip(1 - (1 - ac) / (1 - at), 0, 1)
        safe = np.where(ah > 0.004, ah, 1)
        col = (img[..., :3] * ac[..., None] - tc * at * (1 - ah[..., None])) / safe[..., None]
        out_ = np.dstack([np.clip(col, 0, 255), ah * 255])
        y0m, y1m = mt.get("y", [0, Hh])  # 底紋只在這個高度範圍（範圍外的插圖不扣）
        img[y0m:y1m] = out_[y0m:y1m]
    full = Image.fromarray(img.round().astype("uint8"), "RGBA")
    out = []
    imgdir = os.path.join(ROOT, "src", "assets", "img", key)
    os.makedirs(imgdir, exist_ok=True)
    def corners(e):
        cx, cy = e["left"] + e["width"] / 2, e["top"] + e["height"] / 2
        a = math.radians(e.get("rotation", 0))
        pts = []
        for dx, dy in [(-1, -1), (1, -1), (1, 1), (-1, 1)]:
            x, y = dx * e["width"] / 2, dy * e["height"] / 2
            pts.append((cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)))
        return pts

    masks = {}
    # 有 box 的先切（例如美人魚手上的水母），沒有 box 的（整張插圖）可以用 minus 扣掉它們
    for eid, spec in sorted(illus.items(), key=lambda kv: "box" not in kv[1]):
        m = Image.new("L", (Ww, Hh), 0)
        d = ImageDraw.Draw(m)
        if "box" in spec:  # 從某張插圖裡分出一塊：框內最大的一塊（不透明部分連在一起的那塊），外擴 2px 留邊緣
            from scipy import ndimage
            x0, y0, x1, y1 = spec["box"]
            sub = img[y0:y1, x0:x1, 3] > 8
            lab, n = ndimage.label(sub)
            big = np.argmax(ndimage.sum(sub, lab, range(1, n + 1))) + 1
            blob = ndimage.binary_dilation(lab == big, iterations=2)
            arr = np.zeros((Hh, Ww), np.uint8)
            arr[y0:y1, x0:x1] = blob * 255
            m = Image.fromarray(arr, "L")
            d = ImageDraw.Draw(m)
        else:
            # with＝跟這張插圖疊在一起、要一起動的其他元素（例如 SUP 後面的太陽），範圍合併成一張
            for xid in [eid] + spec.get("with", []):
                d.polygon(corners(allel[xid]), fill=255)
        for x0, y0, x1, y1 in cfg.get("illusClip", {}).get(eid, []):
            d.rectangle((x0, y0, x1, y1), fill=0)
        for other in spec.get("minus", []):
            m = Image.fromarray(np.minimum(np.array(m), 255 - np.array(masks[other])), "L")
        masks[eid] = m
        layer = Image.new("RGBA", (Ww, Hh), (0, 0, 0, 0))
        layer.paste(full, (0, 0), m)
        bb = layer.getchannel("A").point(lambda v: 255 if v > 3 else 0).getbbox()
        x0, y0, x1, y1 = max(bb[0] - 2, 0), max(bb[1] - 2, 0), min(bb[2] + 2, Ww), min(bb[3] + 2, Hh)
        layer.crop((x0, y0, x1, y1)).save(os.path.join(imgdir, spec["file"] + ".webp"), "WEBP", quality=90, method=6)
        out.append({"kind": "fish", "code": spec["code"], "file": spec["file"], "name": spec["name"], "anim": spec["anim"],
                    "x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0, "rot": 0})
    order = [spec["code"] for spec in illus.values()]  # 輸出照設定的順序（後面的疊在上面）
    return sorted(out, key=lambda f: order.index(f["code"]))


def auto_links(it, links, underline=()):
    """autoLinks：文字裡提到〈隱私權政策〉這類名稱 → 那幾個字變成連結（顏色不變）。已經有 spans／site／links 的不動。
    underline（cfg 的 autoLinksUnderline）：列在裡面的名稱，連結一直有底線（span 加 ul，底線跟文字同色）。"""
    if not links or "text" not in it or any(k in it for k in ("site", "links", "href", "priceId")):
        return it
    import re
    pat = re.compile("|".join(re.escape(k) for k in links))
    if not pat.search(it["text"]):
        return it
    spans, pos = [], 0
    for m in pat.finditer(it["text"]):
        if m.start() > pos:
            spans.append({"t": it["text"][pos:m.start()], "c": it["color"]})
        sp = {"t": m.group(0), "c": it["color"], "href": links[m.group(0)]}
        if m.group(0) in underline:
            sp["ul"] = True
        spans.append(sp)
        pos = m.end()
    if pos < len(it["text"]):
        spans.append({"t": it["text"][pos:], "c": it["color"]})
    it = dict(it)
    it.pop("text")
    it["spans"] = spans
    return it


def sticky_groups(cfg, allel, items, sc, key):
    """sticky：右側目錄這種「跟著捲動」的卡片。卡片（白底圓角）、分隔線、裝飾圖、文字一起放進一個盒子，
    盒子在 y～until 之間跟著捲動（CSS position: sticky，距離螢幕上緣 top px）。座標都換成相對盒子左上角。"""
    out = []
    for st in cfg.get("sticky", []):
        box = allel[st["box"]]
        def img_el(im):  # box＝切圖時實際的範圍（去背圖可能比 Canva 元素大一點點）
            if "box" in im:
                bx, by, bw, bh = im["box"]
                return {"left": bx, "top": by, "width": bw, "height": bh}
            return allel[im["id"]]
        parts = [box] + [allel[i] for i in st.get("lines", [])] + [img_el(i) for i in st.get("imgs", [])] + [allel[i] for i in st["members"]]
        x0 = min(p["left"] for p in parts)
        y0 = min(p["top"] for p in parts)
        x1 = max(p["left"] + p["width"] for p in parts)
        y1 = max(p["top"] + p["height"] for p in parts)
        g = {"id": st["id"], "label": st["label"], "x": r(x0), "y": r(y0), "w": r(x1 - x0), "h": r(y1 - y0), "until": st["until"], "top": st["top"],
             "card": {"x": r(box["left"] - x0), "y": r(box["top"] - y0), "w": r(box["width"]), "h": r(box["height"]),
                      "radius": r(box["paths"][0]["cornerRounding"]), "bg": box["paths"][0]["fill"]["color"]["color"], "op": r(box.get("opacity", 1), 2)},
             "lines": [], "imgs": [], "items": []}
        for lid in st.get("lines", []):
            ln = allel[lid]
            g["lines"].append({"x": r(ln["left"] - x0), "y": r(ln["top"] - y0), "w": r(ln["width"]), "h": r(ln["height"]),
                               "bg": ln["paths"][0]["fill"]["color"]["color"], "op": r(ln.get("opacity", 1), 2)})
        for im in st.get("imgs", []):
            e = img_el(im)
            g["imgs"].append({"file": im["file"], "alt": im.get("alt", ""), "x": r(e["left"] - x0), "y": r(e["top"] - y0), "w": r(e["width"]), "h": r(e["height"])})
        for it in [i for i in items if i.get("id") in st["members"]]:
            items.remove(it)
            it2 = dict(it)
            it2["x"], it2["y"] = r(it["x"] - x0), r(it["y"] - y0)
            g["items"].append(it2)
        out.append(g)
    return out


def form_items(fm, allel, items, sc):
    """留言表單：每個欄位＝Canva 輸入框（形狀）的位置大小；字級、提示字、左邊留白照 Canva 提示字；標題文字改成 <label>。"""
    from PIL import ImageFont
    texts = {i.get("id"): i for i in items if i["kind"] == "text"}
    out = [{"kind": "form", "id": fm["id"], "x": 0, "y": r(allel[fm["fields"][0][0]]["top"]), "w": 0, "h": 0}]
    for box, ph, label, spec in fm["fields"]:
        b, p = allel[box], allel[ph]
        f = p["textRegions"][0]["formatting"]
        fs, lh = f["fontSize"] * sc, f["lineHeight"]
        fid = fm["id"] + "-" + spec["name"]
        it = {"kind": "field", "form": fm["id"], "fid": fid, "x": r(b["left"]), "y": r(b["top"]), "w": r(b["width"]), "h": r(b["height"]),
              "radius": b["paths"][0]["cornerRounding"], "padL": r(p["left"] - b["left"]), "padT": r(p["top"] - (lh - K) * fs / 2 - b["top"]),
              "fs": r(fs), "lh": lh, "phColor": f["color"], "ph": p["textRegions"][0]["characters"].rstrip("\n")}
        if spec["tag"] != "textarea":  # 單行欄位：瀏覽器會把字放在內容區正中間 → 上下留白算好，讓字落在 Canva 提示字的高度
            it["padB"] = r(it["h"] - it["padT"] - fs * lh)
        it.update(spec)
        if spec["tag"] == "select":  # 「▾」：照 Canva 位置（提示字後面），網頁另外畫，選了方案也留著
            pre, arrow = it["ph"].rsplit("▾", 1)[0], "▾"
            font = ImageFont.truetype(FONT_DIR + "NotoSansCJK-Regular.ttc", round(fs * 4), index=3)
            it["ph"] = pre.rstrip("　 ")
            it["arrowX"] = r(p["left"] - b["left"] + font.getlength(pre) / 4)
        texts[label]["labelFor"] = fid + ("-btn" if spec["tag"] == "select" else "")
        out.append(it)
    box, label, name = fm["check"]
    b = allel[box]
    fid = fm["id"] + "-" + name
    out.append({"kind": "check", "form": fm["id"], "fid": fid, "name": name, "required": True, "x": r(b["left"]), "y": r(b["top"]),
                "w": r(b["width"]), "h": r(b["height"]), "radius": b["paths"][0]["cornerRounding"], "bc": b["paths"][0]["stroke"]["color"]["color"]})
    texts[label]["labelFor"] = fid
    sh, tx = fm["submit"]
    bt = button(allel[sh], allel[tx], None, sc)
    bt.update({"kind": "submit", "form": fm["id"]})
    bt.pop("href")
    out.append(bt)
    fsm = r(18 * sc)
    out.append({"kind": "formmsg", "form": fm["id"], "x": fm["msg"]["x"], "y": r(bt["y"] + bt["h"] / 2 - fsm * 1.4 / 2), "w": fm["msg"]["w"],
                "fs": fsm, "color": "#12355b"})
    return out


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
    fm = cfg.get("form")
    if fm:  # 表單：提示字、送出鈕文字改由網頁欄位／按鈕本身顯示
        skip |= {ph for _, ph, _, _ in fm["fields"]} | {fm["submit"][1]}
    sc = cfg.get("textScale", 1)
    items = []

    def walk(e):
        if e["id"] in skip or e["id"] in pair_text:
            return
        if e["id"] in cfg.get("buttons", {}):
            sh = [c for c in e["children"] if c["type"] == "shape"][0]
            tx = [c for c in e["children"] if c["type"] == "text"][0]
            b = button(sh, tx, cfg["buttons"][e["id"]], sc)
            b["_gid"] = e["id"]
            items.append(b)
            return
        if e["id"] in pair_shape:
            t, h = pair_shape[e["id"]]
            b = button(e, allel[t], h, sc)
            b["_gid"] = e["id"]
            items.append(b)
            return
        if e["type"] == "text":
            if not e.get("textRegions"):
                return
            if e["id"] not in cfg.get("keep", []) and all(g["formatting"]["color"].lower() == LABEL_COLOR for g in e["textRegions"]):
                return  # keep＝顏色剛好跟設計標籤一樣、但其實是內容的文字（例如條款頁黃色「最後更新」）
            items.append(auto_links(text_item(e, cfg.get("overrides", {}).get(e["id"], {}), sc), cfg.get("autoLinks", {}), cfg.get("autoLinksUnderline", ())))
            return
        for c in e.get("children") or []:
            walk(c)

    for e in page["elements"]:
        walk(e)

    # 插圖（進場動畫，用版型的 fish 元素）：從「只留插圖」的透明 PNG 依 Canva 範圍切出（角度、翻轉、裁切都已在匯出圖裡）
    illus = cfg.get("illustrations", {})
    if illus:
        items.extend(cut_illustrations(cfg, allel, illus, sys.argv[3], key))

    # 設計稿上沒有、另外加的按鈕（例如關於頁的「加 LINE 好友」）
    for b in cfg.get("extraButtons", []):
        items.append(dict(b, kind="button"))

    # 留言表單（真的網頁欄位，照 Canva 輸入框座標放；輸入框外觀在底圖）
    if fm:
        items.extend(form_items(fm, allel, items, sc))

    # 跟著捲動的卡片（右側目錄）：成員文字從段落裡拿出來，另外放在頁面層
    stickies = sticky_groups(cfg, allel, items, sc, key)

    # 欄寬：參考段落的文字實際最右邊 → 其他段落縮到同寬（收在框內）
    texts = {i.get("id"): i for i in items if i["kind"] == "text"}
    col_right = {}
    for name, (refs, fits) in cfg.get("columns", {}).items():
        right = max(text_right(texts[t]) for t in refs)
        col_right[name] = right
        for o in fits:
            texts[o]["w"] = r(right - texts[o]["x"])
    # 按鈕右緣對齊那一欄的右緣；價格跟著按鈕移動（保持原本的間距）
    for it in items:
        gid = it.pop("_gid", None) if it["kind"] == "button" else None
        if gid in cfg.get("buttonAlign", {}):
            col, price = cfg["buttonAlign"][gid]
            nx = r(col_right[col] - it["w"])
            if price:
                texts[price]["x"] = r(texts[price]["x"] + nx - it["x"])
            it["x"] = nx

    def section_of(y):
        for k, _, a, b in cfg["sections"]:
            if a <= y < b:
                return k
        return cfg["sections"][-1][0]

    def item_y(it):  # 插圖用中心點決定屬於哪一段
        return it["y"] + (it["h"] / 2 if it["kind"] == "fish" else 0)

    imgdir = os.path.join(ROOT, "src", "assets", "img", key)
    os.makedirs(imgdir, exist_ok=True)
    out = {"_說明": f"{cfg['title']}頁（電腦版 1440 寬）每段的文字、按鈕座標，由 scripts/build-canvas-data.py 從 Canva 產生（設定在 scripts/canvas_pages.py）。座標單位＝px，以 1440 寬為準。頁首、頁尾用首頁（home.json）的元素。",
           "width": 1440, "height": H, "imgDir": key, "active": cfg.get("active"), "sections": []}
    if cfg.get("anchors"):
        out["anchors"] = [{"id": k, "y": v} for k, v in cfg["anchors"].items()]
    if fm:
        out["form"] = fm["id"]
    if stickies:
        out["stickies"] = stickies
    if cfg.get("css"):
        out["css"] = cfg["css"]
    im = Image.open(base).convert("RGB")
    assert im.size == (1440, H), im.size
    for k, name, a, b in cfg["sections"]:
        sec = {"key": k, "name": name, "top": a, "height": b - a, "img": f"{key}_s_{k}.webp", "items": []}
        if k in cfg.get("shared", {}):
            sec["shared"] = cfg["shared"][k]
        for it in items:
            if section_of(item_y(it)) == k:
                it2 = dict(it)
                it2["y"] = r(it["y"] - a)
                sec["items"].append(it2)
        out["sections"].append(sec)
        im.crop((0, a, 1440, b)).save(os.path.join(imgdir, sec["img"]), "WEBP", quality=88, method=6)
    json.dump(out, open(os.path.join(ROOT, "src", "_data", key + ".json"), "w"), ensure_ascii=False, indent=1)
    print("寫入", key, [(s["key"], len(s["items"])) for s in out["sections"]])


if __name__ == "__main__":
    main()
