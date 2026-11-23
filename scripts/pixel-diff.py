# 電腦版改前改後逐像素比對：python3 scripts/pixel-diff.py <改前資料夾> <改後資料夾>
#   比對資料夾裡所有 *_1440.png、*_1280.png（用 scripts/mobile-shot.js ... desktop 截的）
#   右側「回到頂部」那一條（x ≥ 寬-120）不算
import sys, glob, os
from PIL import Image, ImageChops
a, b = sys.argv[1], sys.argv[2]
bad = 0
for fa in sorted(glob.glob(os.path.join(a, "*_1440.png")) + glob.glob(os.path.join(a, "*_1280.png"))):
    fb = os.path.join(b, os.path.basename(fa))
    if not os.path.exists(fb): print("缺", fb); bad += 1; continue
    ia, ib = Image.open(fa).convert("RGB"), Image.open(fb).convert("RGB")
    if ia.size != ib.size: print(os.path.basename(fa), "尺寸不同", ia.size, ib.size); bad += 1; continue
    w, h = ia.size
    d = ImageChops.difference(ia.crop((0, 0, w - 120, h)), ib.crop((0, 0, w - 120, h))).getbbox()
    print(os.path.basename(fa), "相同" if not d else f"不同 {d}")
    bad += bool(d)
sys.exit(1 if bad else 0)
