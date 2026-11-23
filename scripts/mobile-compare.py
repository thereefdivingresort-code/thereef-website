# 手機版比對圖：左＝電腦版那一段（縮到手機寬）、右＝手機版同一段，一段一列
# 用法：python3 scripts/mobile-compare.py <截圖資料夾> <頁面代號> <輸出.jpg>
#   截圖資料夾裡要有 <頁>_1440.png/.json（desk 模式）和 <頁>_m.png/.json（mobile 或 mobile2 模式）
import json, sys
from PIL import Image, ImageDraw, ImageFont
d, key, out = sys.argv[1:4]
D = Image.open(f"{d}/{key}_1440.png").convert("RGB"); M = Image.open(f"{d}/{key}_m.png").convert("RGB")
ds = json.load(open(f"{d}/{key}_1440.json")); ms = json.load(open(f"{d}/{key}_m.json"))
k = M.size[0] / 390  # 手機截圖倍數
W = 390 * k; gap = int(16 * k)
rows = []
for (n1, y1, h1), (n2, y2, h2) in zip(ds, ms):
    a = D.crop((0, y1, 1440, y1 + h1)); a = a.resize((int(W), int(h1 * W / 1440)))
    b = M.crop((0, int(y2 * k), M.size[0], int((y2 + h2) * k)))
    rows.append((a, b))
H = sum(max(a.size[1], b.size[1]) + gap for a, b in rows) + int(40 * k)
c = Image.new("RGB", (int(W * 2 + gap * 3), H), "#ffffff"); dr = ImageDraw.Draw(c)
try: font = ImageFont.truetype("/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc", int(18 * k))
except OSError: font = None
dr.text((gap, int(10 * k)), "電腦版（縮小）", fill="#12355b", font=font); dr.text((int(W + gap * 2), int(10 * k)), "手機版", fill="#12355b", font=font)
y = int(40 * k)
for a, b in rows:
    c.paste(a, (gap, y)); c.paste(b, (int(W + gap * 2), y)); y += max(a.size[1], b.size[1]) + gap
c.save(out, quality=80)
print(out, c.size)
