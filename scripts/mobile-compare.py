# 電腦版／手機版「同一段並排」比對圖：python3 scripts/mobile-compare.py <截圖資料夾> <頁面代號> [輸出.png]
#   先跑 node scripts/mobile-shot.js <截圖資料夾> both <頁面代號>（會產生 _1440.png/.json、_mobile.png/.json）
#   左＝電腦版那段（縮成 600 寬）、右＝手機版那段（390 寬，1 倍）
import sys, json, os
from PIL import Image, ImageDraw, ImageFont
d, k = sys.argv[1], sys.argv[2]
out = sys.argv[3] if len(sys.argv) > 3 else os.path.join(d, f"{k}_compare.png")
D, M = Image.open(f"{d}/{k}_1440.png").convert("RGB"), Image.open(f"{d}/{k}_mobile.png").convert("RGB")
dj, mj = json.load(open(f"{d}/{k}_1440.json")), json.load(open(f"{d}/{k}_mobile.json"))
ms = M.size[0] / 390  # 手機截圖的倍率（iPhone 13 是 3 倍）
DW, GAP = 600, 24
rows = []
def seg(dy, dh, my, mh, label):
    a = D.crop((0, int(dy), 1440, int(dy + dh))); a = a.resize((DW, max(1, int(dh * DW / 1440))))
    b = M.crop((0, int(my * ms), M.size[0], int((my + mh) * ms))); b = b.resize((390, max(1, int(mh))))
    rows.append((label, a, b))
mk = {s["key"]: s for s in mj["secs"]}
for s in dj["secs"]:
    m = mk.get(s["key"])
    if m: seg(s["y"], s["h"], m["y"], m["h"], s["name"])
if dj.get("flow") and mj.get("flow"): seg(dj["flow"]["y"], dj["flow"]["h"], mj["flow"]["y"], mj["flow"]["h"], "預訂表單")
H = sum(max(a.size[1], b.size[1]) + 40 for _, a, b in rows)
img = Image.new("RGB", (DW + GAP + 390 + 40, H + 20), "#e9e6df")
dr = ImageDraw.Draw(img)
try: font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", 16, index=3)  # 有中文字的字型（繁中）
except Exception: font = None
y = 10
for label, a, b in rows:
    dr.text((20, y + 4), f"{label}　（左：電腦版　右：手機版）", fill="#333", font=font)
    img.paste(a, (20, y + 26)); img.paste(b, (20 + DW + GAP, y + 26))
    y += max(a.size[1], b.size[1]) + 40
img.save(out)
# 放進 repo 的小檔：比對圖、手機整頁圖都轉 JPG（手機整頁 780 寬＝2 倍）；大的 PNG／JSON 不進 repo（.gitignore）
img.save(out.replace(".png", ".jpg"), quality=85)
M.resize((780, int(M.size[1] * 780 / M.size[0]))).save(f"{d}/{k}_mobile.jpg", quality=82)
print(out, img.size)
