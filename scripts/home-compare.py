# 並排比對圖：python3 scripts/home-compare.py <Canva原頁.png> <網站截圖.png> <段落代號> <輸出.png>
# 左＝Canva、右＝網站，同一段 y 範圍；縮成一半寬方便看
import sys, json, os
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
canva, web, key, out = sys.argv[1:5]
spec = {s[0]: s for s in [("open", "開場", 0, 1000), ("d12", "12 m", 1000, 2950), ("d18", "18 m", 2950, 3680), ("d30", "30 m", 3680, 5200),
                          ("faq", "FAQ", 5200, 5950), ("map", "我們在哪裡", 5950, 7050), ("footer", "頁尾", 7050, 8000)]}[key]
_, name, a, b = spec
A = Image.open(canva).convert("RGB").crop((0, a, 1440, b))
B = Image.open(web).convert("RGB").crop((0, a, 1440, b))
s = 0.5
W, H = int(1440 * s), int((b - a) * s)
head = 44
img = Image.new("RGB", (W * 2 + 12, H + head), "#ffffff")
img.paste(A.resize((W, H)), (0, head))
img.paste(B.resize((W, H)), (W + 12, head))
d = ImageDraw.Draw(img)
fp = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
f = ImageFont.truetype(fp, 22) if os.path.exists(fp) else ImageFont.load_default()
d.text((12, 8), f"Canva 設計稿｜{name}", fill="#12355b", font=f)
d.text((W + 24, 8), f"網站（寬 1440 截圖）｜{name}", fill="#a93e1b", font=f)
img.save(out, optimize=True)
print(out, img.size)
