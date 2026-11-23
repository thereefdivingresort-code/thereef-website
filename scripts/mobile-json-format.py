# 把 src/_data/mobile.json 排成好讀的格式（每個區塊一行）：python3 scripts/mobile-json-format.py
import json
p = "src/_data/mobile.json"
d = json.load(open(p))
J = lambda o: json.dumps(o, ensure_ascii=False)
def sec(cfg, ind):
    out = []
    for k, v in cfg.items():
        if k == "blocks":
            out.append(f'{ind}"blocks": [\n' + ",\n".join(f"{ind}  {J(b)}" for b in v) + f"\n{ind}]")
        else:
            out.append(f"{ind}{J(k)}: {J(v)}")
    return "{\n" + ",\n".join(out) + "\n" + ind[:-2] + "}"
lines = ["{", f'  "_說明": {J(d["_說明"])},', f'  "header": {J(d["header"])},', f'  "footer": {sec(d["footer"], "    ")},', '  "pages": {']
pages = []
for pk, pv in d["pages"].items():
    secs = [f'      {J(sk)}: {sec(sv, "        ")}' for sk, sv in pv.items()]
    pages.append(f'    {J(pk)}: {{\n' + ",\n".join(secs) + "\n    }")
lines.append(",\n".join(pages))
lines += ["  }", "}"]
open(p, "w").write("\n".join(lines) + "\n")
json.load(open(p))
print("ok")
