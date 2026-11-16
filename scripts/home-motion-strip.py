# 把連續捲動截圖排成一張：python3 scripts/home-motion-strip.py <截圖前綴> <站數> <輸出.png> <標題>
import sys, glob, os
from PIL import Image, ImageDraw, ImageFont
pre, n, out, title = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4]
times = [100, 400, 800, 1600, 3000]
s = 0.3
W, H = int(1440 * s), int(900 * s)
img = Image.new("RGB", (W * len(times) + 8 * (len(times) - 1), (H + 30) * n + 40), "white")
d = ImageDraw.Draw(img)
fp = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
f = ImageFont.truetype(fp, 20); f2 = ImageFont.truetype(fp, 15)
d.text((8, 6), title, fill="#12355b", font=f)
for i in range(1, n + 1):
    for j, t in enumerate(times):
        im = Image.open(f"{pre}_{i}_{t}ms.png").convert("RGB").resize((W, H))
        x, y = j * (W + 8), 40 + (i - 1) * (H + 30)
        d.text((x + 4, y), f"捲到後 {t/1000:.1f} 秒", fill="#a93e1b", font=f2)
        img.paste(im, (x, y + 24))
img.save(out, optimize=True); print(out, img.size)
