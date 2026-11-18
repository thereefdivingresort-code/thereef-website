# 預訂頁驗算（第 c、d、e、f、g 項）的「題目＋正確答案」產生器。
# 正確答案只用 Google Sheet 01_價目表的數字＋02_計算規則（R2–R6、R11）在這裡另外算，不用網站的 pricing.js、也不讀 prices.json。
# 輸入：docs/booking-verify/sheet01.json（01_價目表：代號、計價方式、標準單價、級距或[單人價, 雙人價]）
#       docs/booking-verify/sheet03.json（03_驗算表：編號、代號、人數/雙人組數、次數/單人數、正確答案）
# 輸出：docs/booking-verify/scenarios.json → 給 scripts/booking-test.js 在網頁上真的點出來比對
# 用法：python3 scripts/booking-verify-expect.py
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = os.path.join(ROOT, "docs", "booking-verify")
S1 = {r[0]: {"m": r[1], "price": r[2], "t": r[3]} for r in json.load(open(os.path.join(D, "sheet01.json")))}
S3 = json.load(open(os.path.join(D, "sheet03.json")))

def unit(id, persons=1):  # R3：4 人以上用第 4 格
    s = S1[id]
    return s["t"][min(max(persons, 1), 4) - 1] if s["m"] == "tier" else s["price"]
def cost(id, a, b):  # R2 固定單價；R3–R5 級距×人數×支(趟)數；R6 套裝＝雙人組數×2×一般價＋單人數×單人價
    s = S1[id]
    if s["m"] == "pair": return a * 2 * s["price"] + b * s["t"][0]
    if s["m"] == "tier": return unit(id, a) * a * b if a else 0
    return s["price"] * b

ACT = ["tidal", "snorkel", "glassboat", "fishing", "bluecave", "sup1", "sup2"]
COURSE = ["ow", "aow", "ow-aow", "reactive", "ean", "efr", "rescue", "dm"]
ROOM = {"room-double": ("r", "d"), "room-quad": ("r", "d"), "bed-backpacker": ("r", "d")}
CAR = ["scooter", "ebike", "car5", "car8"]

def ui(id, a=None, b=None, q=None, d=None):
    """在網頁上要做的動作（sel＝下拉、ctr＝數量、tick＝可複選下拉勾選、up＝勾升等）＋要讀哪一格小計。
    固定單價的『份數』：b；住宿／車／裝備的 b＝q（間、台、套）× d（晚、天）。"""
    if id == "dsd": return [["ctr", "dsd", "p", b]], ["dsd"]
    if id in ("fun-shore", "fun-boat"): return [["sel", "fun", id], ["ctr", "fun", "t", b], ["ctr", "fun", "p", a]], ["fun"]
    if id in COURSE: return [["sel", "course", id], ["ctr", "course", "p", b]], ["course"]
    if id.startswith("pkg-"): return [["sel", "pkg", id], ["ctr", "pkg", "pair", a], ["ctr", "pkg", "single", b]], ["pkg"]
    if id in ACT: return [["tick", id], ["ctr", id, "p", b]], [id]
    if id in ROOM or id in CAR or id == "gear-light":
        k1 = "r" if id in ROOM else "q"
        return [["tick", id], ["ctr", id, k1, q], ["ctr", id, "d", d]], [id]
    if id.startswith("ferry-"): return [["tick", "ferry"], ["sel", "ferry", id], ["ctr", "ferry", "p", b]], ["ferry"]
    if id.startswith("gear-"):
        row = id.rsplit("-", 1)[0]
        return [["tick", row], ["sel", row, id], ["ctr", row, "q", q], ["ctr", row, "d", d]], [row]
    raise KeyError(id)

def up_ui(pkg, pair, single):  # R11：升等＝升等價 × 套裝總人數
    acts, _ = ui(pkg, a=pair, b=single)
    return acts + [["up", True]], ["@up"]

out = {"_說明": "由 scripts/booking-verify-expect.py 從 Sheet 01／03 產生；expect 是 python 另外算的（不是網站算的）。", "c": [], "d": [], "e": None, "f": [], "g": None}

# ---------- c：03_驗算表每一題 ----------
split = {  # 03 的「次數或數量」拆成網頁上的兩個數字（間／台／套 × 晚／天），照題目文字
    "15": (1, 2), "16": (1, 3), "18-2": (1, 2), "18-3": (2, 2), "19": (1, 1), "20": (2, 1), "21": (1, 2), "22": (3, 1)}
combos = {}
for no, id, a, b, e in S3:
    if not id: combos[no] = e; continue
    mine = cost(id, a or 0, b)
    assert mine == e, (no, mine, e)  # Sheet 自己的答案跟 01＋02 算出來一致
    if id.startswith("up-"):
        acts, read = up_ui("pkg-" + id[3:], 1, 1)  # 第 24 題：Fun Dive 套裝 3 人（1 組雙人＋1 單人）全部升等
        assert b == 3
    elif no in split:
        acts, read = ui(id, q=split[no][0], d=split[no][1])
    else:
        acts, read = ui(id, a=a, b=b)
    total = cost("pkg-" + id[3:], 1, 1) + e if id.startswith("up-") else e  # 升等那題：合計＝套裝＋升等
    out["c"].append({"no": no, "id": id, "acts": acts, "read": read[0], "expect": e, "total": total})
for no, parts in (("17", ["17-1", "17-2"]), ("18", ["18-1", "18-2", "18-3"])):
    acts = [x for c in out["c"] if c["no"] in parts for x in c["acts"]]
    out["c"].append({"no": no, "id": "組合", "acts": acts, "read": "@total", "expect": combos[no], "total": combos[no]})

# ---------- d：每個品項 1 份、2 份；Fun Dive 1–5 人；套裝 1–4 人；加床 ----------
def add(name, acts, read, expect, total=None):
    out["d"].append({"name": name, "acts": acts, "read": read, "expect": expect, "total": expect if total is None else total})
for id in S1:
    m = S1[id]["m"]
    if m == "tier":
        for p in (1, 2, 3, 4, 5):
            acts, rd = ui(id, a=p, b=1)
            add(f"{id} {p} 人 1 {'趟' if id == 'fun-boat' else '支'}", acts, rd[0], cost(id, p, 1))
        acts, rd = ui(id, a=2, b=2)
        add(f"{id} 2 人 2 {'趟' if id == 'fun-boat' else '支'}", acts, rd[0], cost(id, 2, 2))
    elif m == "pair":
        for ppl, (pair, single) in ((1, (0, 1)), (2, (1, 0)), (3, (1, 1)), (4, (2, 0))):
            acts, rd = ui(id, a=pair, b=single)
            add(f"{id} {ppl} 人（雙人 {pair} 組＋單人 {single} 位）", acts, rd[0], cost(id, pair, single))
    elif id.startswith("up-"):
        pkg = "pkg-" + id[3:]
        for pair, single in ((0, 1), (1, 0)):
            ppl = pair * 2 + single
            acts, rd = up_ui(pkg, pair, single)
            add(f"{id} {ppl} 人（套裝 {ppl} 人＋升等）", acts, rd[0], cost(id, 0, ppl), cost(pkg, pair, single) + cost(id, 0, ppl))
    elif id == "room-quad-extra":
        for x, nights in ((1, 1), (2, 1), (2, 2)):
            acts = [["tick", "room-quad"], ["ctr", "room-quad", "r", 1], ["ctr", "room-quad", "d", nights], ["ctr", "room-quad", "x", x, "extra"]]
            add(f"{id} 加 {x} 位 × {nights} 晚（四人房 1 間）", acts, "@extra", cost(id, 0, x * nights), cost("room-quad", 0, nights) + cost(id, 0, x * nights))
        acts = [["tick", "room-quad"], ["ctr", "room-quad", "r", 1], ["ctr", "room-quad", "x", 3, "extra"]]
        add("room-quad-extra 1 間最多加 2 位（填 3 會變 2）", acts, "@extra", cost(id, 0, 2), cost("room-quad", 0, 1) + cost(id, 0, 2))
    else:
        for qty in (1, 2):
            if id in ROOM or id in CAR or id.startswith("gear-"):
                acts, rd = ui(id, q=qty, d=1)
            else:
                acts, rd = ui(id, b=qty)
            add(f"{id} {qty} 份", acts, rd[0], cost(id, 0, qty))

# ---------- e：Canva UI v4 頁上示範的那組（讀 Canva 時記下每一列）----------
canva_rows = [  # (說明, Canva 上寫的小計, 動作, 讀哪格, python 用 Sheet 算)
    ("體驗潛水 2 人", 5000, [["ctr", "dsd", "p", 2]], "dsd", cost("dsd", 0, 2)),
    ("Fun Dive 岸潛 2 支 2 人", 5800, [["sel", "fun", "fun-shore"], ["ctr", "fun", "t", 2], ["ctr", "fun", "p", 2]], "fun", cost("fun-shore", 2, 2)),
    ("OW 初級考照 1 人", 15000, [["sel", "course", "ow"], ["ctr", "course", "p", 1]], "course", cost("ow", 0, 1)),
    ("夏日 Fun Dive 套裝 雙人 1 組＋單人 1 位", 27100, [["sel", "pkg", "pkg-fun"], ["ctr", "pkg", "pair", 1], ["ctr", "pkg", "single", 1]], "pkg", cost("pkg-fun", 1, 1)),
    ("升等雙人套房 每人 +800 × 3 人", 2400, [["up", True]], "@up", cost("up-fun", 0, 3)),
    ("浮潛行程 2 人", 800, [["tick", "snorkel"], ["ctr", "snorkel", "p", 2]], "snorkel", cost("snorkel", 0, 2)),
    ("夜釣 2 人", 1600, [["tick", "fishing"], ["ctr", "fishing", "p", 2]], "fishing", cost("fishing", 0, 2)),
    ("豪華四人房 1 間 2 晚", 7200, [["tick", "room-quad"], ["ctr", "room-quad", "r", 1], ["ctr", "room-quad", "d", 2]], "room-quad", cost("room-quad", 0, 2)),
    ("船票（來回）2 人", 2640, [["tick", "ferry"], ["sel", "ferry", "ferry-rt"], ["ctr", "ferry", "p", 2]], "ferry", cost("ferry-rt", 0, 2)),
    ("摩托車 1 台 2 天", 1000, [["tick", "scooter"], ["ctr", "scooter", "q", 1], ["ctr", "scooter", "d", 2]], "scooter", cost("scooter", 0, 2)),
    ("潛水電腦錶（全天）1 支 2 天", 1000, [["tick", "gear-computer"], ["sel", "gear-computer", "gear-computer-full"], ["ctr", "gear-computer", "q", 1], ["ctr", "gear-computer", "d", 2]], "gear-computer", cost("gear-computer-full", 0, 2)),
]
canva_summary = {"dive": 10800, "course": 15000, "pkg": 29500, "act": 2400, "stay": 7200, "trans": 3640, "gear": 1000}
out["e"] = {"rows": [{"name": a, "canva": b, "acts": c, "read": d, "expect": e} for a, b, c, d, e in canva_rows],
            "canvaTotal": 69540, "canvaSummary": canva_summary, "expectTotal": sum(r[4] for r in canva_rows)}

# ---------- f：每個品項的 /booking/?item=代號 ----------
def prefill_expect(id):
    if id in ("fun-shore", "fun-boat"): return cost(id, 1, 1)
    if id.startswith("pkg-"): return cost(id, 1, 0)       # 帶入雙人 1 組
    if id.startswith("up-"): return cost(id, 0, 2)        # 套裝雙人 1 組＋勾升等 → 2 人
    return cost(id, 0, 1)
out["f"] = [{"id": id, "expect": prefill_expect(id)} for id in S1]

# ---------- g：清空、刪除一列、改數量為 0 ----------
steps = []
def st(name, acts, total): steps.append({"name": name, "acts": acts, "total": total})
t = 0
st("選體驗潛水 2 人", [["ctr", "dsd", "p", 2]], t := t + cost("dsd", 0, 2))
st("加 OW 1 人", [["sel", "course", "ow"], ["ctr", "course", "p", 1]], t := t + cost("ow", 0, 1))
st("勾活動：夜釣 3 人", [["tick", "fishing"], ["ctr", "fishing", "p", 3]], t := t + cost("fishing", 0, 3))
st("勾住宿：雙人房 1 間 2 晚", [["tick", "room-double"], ["ctr", "room-double", "r", 1], ["ctr", "room-double", "d", 2]], t := t + cost("room-double", 0, 2))
st("勾裝備：輕裝 2 套 1 天", [["tick", "gear-light"], ["ctr", "gear-light", "q", 2], ["ctr", "gear-light", "d", 1]], t := t + cost("gear-light", 0, 2))
st("體驗潛水改 0 人", [["ctr", "dsd", "p", 0]], t := t - cost("dsd", 0, 2))
st("取消勾選夜釣（刪除一列）", [["untick", "fishing"]], t := t - cost("fishing", 0, 3))
st("再勾回夜釣（預設 1 人）", [["tick", "fishing"]], t := t + cost("fishing", 0, 1))
st("課程改回『請選擇課程』", [["sel", "course", ""]], t := t - cost("ow", 0, 1))
st("套裝選了但雙人 0 組、單人 0 位", [["sel", "pkg", "pkg-fun"], ["ctr", "pkg", "pair", 0], ["ctr", "pkg", "single", 0]], t)
st("套裝勾升等但 0 人", [["up", True]], t)
st("住宿晚數填 0（最少 1 晚，會變回 1）", [["ctr", "room-double", "d", 0]], t := t - cost("room-double", 0, 2) + cost("room-double", 0, 1))
st("全部清空：取消所有勾選、套裝改回請選擇", [["untick", "fishing"], ["untick", "room-double"], ["untick", "gear-light"], ["sel", "pkg", ""]], 0)
out["g"] = steps

json.dump(out, open(os.path.join(D, "scenarios.json"), "w"), ensure_ascii=False, indent=1)
print("c", len(out["c"]), "d", len(out["d"]), "e", len(out["e"]["rows"]), "f", len(out["f"]), "g", len(out["g"]), "e total", out["e"]["expectTotal"])
