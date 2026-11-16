# 首頁（電腦版 1440）資料產生器：讀 docs/home-canva-elements.json（Canva 首頁一次讀出的座標），
# 產生 src/_data/home.json（每段的文字、按鈕、魚類插圖座標）並把去字底圖切成每段一張 WebP。
# 用法：python3 scripts/build-home-data.py <去字底圖.png> <只有魚的透明圖.png> [段落代號,...]
#   只有魚的透明圖＝Canva 工作檔 DAHbGYksADs 匯出（PNG、透明背景、寬 1440），魚的角度、翻轉、裁切、顏色都跟 Canva 一樣
#   段落代號：open d12 d18 d30 faq map footer（不給＝全部）
# 注意：home.json 是產生出來的；要長期手改文字時，改這支程式的 OVERRIDES 再重跑，或直接改 home.json 並不再重跑。
import json, sys, os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "docs", "home-canva-elements.json")
OUT = os.path.join(ROOT, "src", "_data", "home.json")
IMG = os.path.join(ROOT, "src", "assets", "img", "home")

SECTIONS = [  # 代號, 中文, Canva y 範圍（底圖依這個切）
    ("open", "開場", 0, 1000),
    ("d12", "12 m", 1000, 2950),
    ("d18", "18 m", 2950, 3680),
    ("d30", "30 m", 3680, 5200),
    ("faq", "FAQ", 5200, 5950),
    ("map", "我們在哪裡", 5950, 7050),
    ("footer", "頁尾", 7050, 8000),
]

# 文字 → 連結／價格／網站資料（用 Canva 元素 id 對應）
OVERRIDES = {
    "LBQhnfR94X68vL9m": {"href": "/courses/"},                      # 開場 看全部方案 →
    "LBKVNx8MqxDmXDhs": {"href": "/trips/"},                        # 30m 看全部方案 →（住宿＋套裝）
    "LBJHtvt9c3B7mRTr": {"priceId": "dsd", "text": "NT$ {price} ／人"},
    "LB8MKSMzDVhtSfqZ": {"priceId": "ow", "text": "NT$ {price}／人"},
    "LBjptnkxrdP7Ypq3": {"priceId": "aow", "text": "NT$ {price} ／人"},
    "LB9C7Z9WwShYPGL5": {"href": "#top"},                            # 回到頂部
    "LBqjhw2RR6KfkFcs": {"site": "companyLines"},                    # 頁尾公司資訊（讀 site.json）
    "LBT88PzHtvnC23Wg": {"site": "legalLinks"},
    "LB5W7cmFGytM2mHB": {"site": "social"},
    "LBmV0xCTjDldmlbz": {"links": [["在 Google 地圖開啟 →", "site:googleMapUrl"], ["　　　", None], ["認識我們 →", "/about/"]]},
    "LBY03Lg67DNwrxbY": {"links": [["課程", "/courses/"], ["    ", None], ["住宿", "/stay/"], ["    ", None], ["行程", "/trips/"], ["    ", None],
                                    ["關於", "/about/"], ["    ", None], ["聯絡", "/about/#contact"], ["        中｜EN", None]]},
}
# 按鈕（Canva 群組 id → 連結）
BUTTONS = {
    "LBQ9h3flkS5BBFbV": "/booking/",
    "LB54Z0kPnnSm9bHz": "/booking/?item=dsd",
    "LBVxvJrpZ0jh21r6": "/booking/?item=ow",
    "LBt9px4tqXJNpTT0": "/booking/?item=aow",
    "LBDrMh74PMMFt6NH": "/booking/",
    "LBZ58VkJ4s4xdkkC": "/about/#contact",
}
HEADER_BTN = ("LBcX3tPyTYvqMPWK", "LBVc9PMRPxKskgrn", "/booking/")
FAQ_GROUP = "LB6lHLng6Q1YQ4lz"
# 魚類插圖：Canva 元素 id → 檔名、動畫（照 Canva 備註動畫表）
# anim: dx/dy＝進場起點位移（px），dur 秒，delay 秒，float＝漂浮秒數（0＝不漂）
FISH = {
    "LBB5YJdFCD8Hf6yc": ("A01", "A01_damselfish", "雀鯛", dict(dx=0, dy=30, dur=0.8, delay=0, float=4.5)),
    "LBjZtmklxStNTl4w": ("A02", "A02_butterflyfish", "蝶魚", dict(dx=60, dy=0, dur=0.9, delay=0.15, float=4.5)),
    "LBhXNPpRbVK7YgNw": ("B01", "B01_parrotfish", "鸚哥魚", dict(dx=80, dy=0, dur=1.0, delay=0, float=4.5)),
    "LBqCVhnbK72xh8fR": ("B02", "B02_wrasse", "隆頭魚", dict(dx=-80, dy=0, dur=1.0, delay=0.2, float=4.5)),
    "LB8FFq5qtjz9CKCX": ("B03", "B03_coral", "珊瑚礁", dict(dx=0, dy=0, dur=1.2, delay=0, float=0)),
    "LBlTR3klcMJ65X1V": ("C01", "C01_turtle", "海龜", dict(dx=-57, dy=57, dur=1.2, delay=0, float=5)),
    "LBfCXFC2gH4SwV2l": ("C02", "C02_stingray", "魟魚", dict(dx=-100, dy=0, dur=1.4, delay=0.3, float=5)),
    "LBGcpwYgFRBXTTv5": ("C04", "C04_moray", "裸胸鯙", dict(dx=30, dy=0, dur=1.0, delay=0, float=0)),
    "LBSv8p9jbwRWk9XC": ("C06", "C06_seafan", "海扇", dict(dx=0, dy=0, dur=1.2, delay=0.3, float=0)),
    "LBPTFlDKNzTGKMbd": ("C07", "C07_sweetlips", "黃帶胡椒鯛", dict(dx=-80, dy=0, dur=1.0, delay=0.15, float=4.5)),
    "LB23Y4QxjT1k0plC": ("C07b", "C07_sweetlips", "黃帶胡椒鯛", dict(dx=-80, dy=0, dur=1.0, delay=0.25, float=4.5)),
    "LBPcFkQTv9PGdVmt": ("C05", "C05_lionfish", "獅子魚", dict(dx=0, dy=20, dur=1.4, delay=0.45, float=5)),
}
LABEL_COLOR = "#edc40f"  # 黃色設計標籤：不做進網站
K = 1.2  # Canva 文字框第一行高度 ≈ 1.2 × 字級


def r(v, n=1):
    return round(v, n)


def text_item(e, ov):
    regs = e["textRegions"]
    f = regs[0]["formatting"]
    fs, lh = f["fontSize"], f["lineHeight"]
    it = {
        "kind": "text", "id": e["id"],
        "x": r(e["left"]), "y": r(e["top"] - (lh - K) * fs / 2), "w": r(e["width"] + 4),
        "fs": r(fs), "fw": 700 if f["fontWeight"] == "bold" else 400, "color": f["color"],
        "lh": lh, "align": {"start": "left", "center": "center", "end": "right"}[f["textAlign"]],
    }
    if f.get("letterSpacing"):
        it["ls"] = f["letterSpacing"]
    if f.get("decoration") == "underline":
        it["ul"] = True
    if e.get("opacity", 1) != 1:
        it["op"] = r(e["opacity"], 2)
    if e.get("_rx"):
        it["x"] = r(e["left"] - 2)
    runs = [{"t": g["characters"].rstrip("\n"), "c": g["formatting"]["color"]} for g in regs]
    if len(runs) > 1:
        it["runs"] = runs
    else:
        it["text"] = runs[0]["t"]
    it.update(ov)
    return it


def stroke(sh):
    st = sh["paths"][0].get("stroke") or {}
    w = st.get("weight", 0)
    return {"bw": w, "bc": st["color"]["color"]} if w else {}


def section_of(y):
    for key, _, a, b in SECTIONS:
        if a <= y < b:
            return key
    return SECTIONS[-1][0]


def main():
    base = sys.argv[1]
    fishimg = Image.open(sys.argv[2]).convert("RGBA")
    want = sys.argv[3].split(",") if len(sys.argv) > 3 else [s[0] for s in SECTIONS]
    fish_polys = []  # (code, 多邊形)，照 Canva 圖層順序（後面的在上面）
    d = json.load(open(SRC))
    page = d["design_content"]["pages"][0]
    items = []

    def walk(e):
        t = e["type"]
        if e["id"] == FAQ_GROUP:
            ch = {c["id"]: c for c in e["children"]}
            qs = [c for c in e["children"] if c["type"] == "text" and c["left"] < 200]
            title = qs[0]
            qrows = sorted([c for c in qs[1:] if c["height"] < 40], key=lambda c: c["top"])
            ans = [c for c in qs[1:] if c["height"] >= 40][0]
            sign = [c for c in e["children"] if c["type"] == "text" and c["left"] > 1200]
            f0 = qrows[1]["textRegions"][0]["formatting"]
            fa = ans["textRegions"][0]["formatting"]
            items.append(text_item(title, {}))
            items.append({
                "kind": "faq", "x": r(qrows[0]["left"]), "y": r(qrows[0]["top"]), "w": 1120,
                "rowH": 80, "lineH": 8, "lineOp": 0.25,
                "q": {"fs": r(f0["fontSize"]), "color": f0["color"], "lh": f0["lineHeight"]},
                "a": {"fs": r(fa["fontSize"]), "color": fa["color"], "lh": fa["lineHeight"], "w": r(ans["width"])},
                "sign": {"fs": r(sign[0]["textRegions"][0]["formatting"]["fontSize"]), "color": sign[0]["textRegions"][0]["formatting"]["color"]},
                "items": [{"q": c["textRegions"][0]["characters"],
                           "a": ans["textRegions"][0]["characters"] if i == 0 else "答案待補",
                           "open": i == 0} for i, c in enumerate(qrows)],
            })
            return
        if e["id"] in BUTTONS:
            sh = [c for c in e["children"] if c["type"] == "shape"][0]
            tx = [c for c in e["children"] if c["type"] == "text"][0]
            f = tx["textRegions"][0]["formatting"]
            items.append({"kind": "button", "x": r(sh["left"]), "y": r(sh["top"]), "w": r(sh["width"]), "h": r(sh["height"]),
                          "radius": sh["paths"][0]["cornerRounding"], "bg": sh["paths"][0]["fill"]["color"]["color"],
                          "label": tx["textRegions"][0]["characters"], "fs": r(f["fontSize"]), "fw": 700, "color": f["color"],
                          "href": BUTTONS[e["id"]], **stroke(sh)})
            return
        if e["id"] == HEADER_BTN[0]:
            sh = e
            tx = find(page["elements"], HEADER_BTN[1])
            f = tx["textRegions"][0]["formatting"]
            items.append({"kind": "button", "x": r(sh["left"]), "y": r(sh["top"]), "w": r(sh["width"]), "h": r(sh["height"]),
                          "radius": sh["paths"][0]["cornerRounding"], "bg": sh["paths"][0]["fill"]["color"]["color"],
                          "label": tx["textRegions"][0]["characters"], "fs": r(f["fontSize"]), "fw": 700, "color": f["color"],
                          "href": HEADER_BTN[2]})
            return
        if e["id"] == HEADER_BTN[1]:
            return
        if e["id"] in FISH:
            code, fn, name, anim = FISH[e["id"]]
            import math
            cx, cy = e["left"] + e["width"] / 2, e["top"] + e["height"] / 2
            a = math.radians(e.get("rotation", 0))
            pts = []
            for dx, dy in [(-1, -1), (1, -1), (1, 1), (-1, 1)]:
                x, y = dx * e["width"] / 2, dy * e["height"] / 2
                pts.append((cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)))
            fish_polys.append((code, pts))
            items.append({"kind": "fish", "code": code, "file": "home_fish_" + code, "name": name, "_pts": pts, "anim": anim})
            return
        if t == "text":
            f = e["textRegions"][0]["formatting"]
            if f["color"].lower() == LABEL_COLOR:
                return
            items.append(text_item(e, OVERRIDES.get(e["id"], {})))
            return
        for c in e.get("children", []) or []:
            walk(c)

    def find(es, i):
        for e in es:
            if e["id"] == i:
                return e
            x = find(e.get("children", []) or [], i)
            if x:
                return x

    for e in page["elements"]:
        walk(e)

    # 魚：從透明圖切出每一條（重疊處給上層那條）
    from PIL import ImageDraw
    W, H = fishimg.size
    taken = Image.new("L", (W, H), 0)
    for it in reversed([i for i in items if i["kind"] == "fish"]):
        m = Image.new("L", (W, H), 0)
        ImageDraw.Draw(m).polygon(it.pop("_pts"), fill=255)
        m = Image.composite(Image.new("L", (W, H), 0), m, taken)  # 已被上層拿走的不要
        taken = Image.composite(Image.new("L", (W, H), 255), taken, m)
        layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        layer.paste(fishimg, (0, 0), m)
        bb = layer.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
        x0, y0, x1, y1 = max(bb[0] - 2, 0), max(bb[1] - 2, 0), min(bb[2] + 2, W), min(bb[3] + 2, H)
        layer.crop((x0, y0, x1, y1)).save(os.path.join(IMG, it["file"] + ".webp"), "WEBP", quality=90, method=6)
        it.update({"x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0, "rot": 0})

    # 「回到頂部」「向下捲動」用整個群組範圍當可點區
    out = {"_說明": "首頁（電腦版 1440 寬）每段的文字、按鈕、魚類插圖座標，由 scripts/build-home-data.py 從 Canva 產生。座標單位＝px，以 1440 寬為準。",
           "width": 1440, "height": 8000, "sections": []}
    im = Image.open(base).convert("RGB")
    for key, name, a, b in SECTIONS:
        if key not in want:
            continue
        sec = {"key": key, "name": name, "top": a, "height": b - a, "img": f"home_s_{key}.webp", "items": []}
        for it in items:
            if section_of(it["y"] + (0 if it["kind"] != "fish" else it["h"] / 2)) == key:
                it2 = dict(it)
                it2["y"] = r(it["y"] - a)
                sec["items"].append(it2)
        out["sections"].append(sec)
        im.crop((0, a, 1440, b)).save(os.path.join(IMG, sec["img"]), "WEBP", quality=88, method=6)
    json.dump(out, open(OUT, "w"), ensure_ascii=False, indent=1)
    print("寫入", OUT, [s["key"] for s in out["sections"]])


if __name__ == "__main__":
    main()
