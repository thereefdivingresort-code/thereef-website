# 並排比對圖：python3 scripts/canvas-compare.py <頁面> <Canva原頁.png> <網站截圖.png> <段落代號> <輸出.png> [y起,y迄] [網站往下位移]
#   頁面＝home、courses…（段落範圍讀 src/_data/<頁面>.json 的 sections；給 y起,y迄 就用自訂範圍，段落代號找不到就直接當段落名稱）
#   網站往下位移：網站截圖的 y＝Canva 的 y＋位移（預訂頁上面多了共用頁首，位移 100）
# 左＝Canva、右＝網站，同一段 y 範圍；縮成一半寬方便看
import sys, json, os
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
page, canva, web, key, out = sys.argv[1:6]
data = json.load(open(os.path.join(ROOT, "src", "_data", page + ".json")))
sec = ([s for s in data["sections"] if s["key"] == key] or [{"name": key, "top": 0, "height": 0}])[0]
name, a, b = sec["name"], sec["top"], sec["top"] + sec["height"]
if len(sys.argv) > 6:
    a, b = map(int, sys.argv[6].split(","))
off = int(sys.argv[7]) if len(sys.argv) > 7 else 0
A = Image.open(canva).convert("RGB").crop((0, a, 1440, b))
B = Image.open(web).convert("RGB").crop((0, a + off, 1440, b + off))
s = 0.5
W, H = int(1440 * s), int((b - a) * s)
head = 44
img = Image.new("RGB", (W * 2 + 12, H + head), "#ffffff")
img.paste(A.resize((W, H), Image.LANCZOS), (0, head))
img.paste(B.resize((W, H), Image.LANCZOS), (W + 12, head))
d = ImageDraw.Draw(img)
fp = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
f = ImageFont.truetype(fp, 22) if os.path.exists(fp) else ImageFont.load_default()
d.text((12, 8), f"Canva 設計稿｜{name}", fill="#12355b", font=f)
d.text((W + 24, 8), f"網站（寬 1440 截圖）｜{name}", fill="#a93e1b", font=f)
img.save(out, optimize=True)
print(out, img.size)
