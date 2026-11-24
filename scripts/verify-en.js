// 英文版檢查（npm test 會跑）：
// 1. 翻譯檔 src/_data/en/<頁>.json 記的中文原文，跟現在資料檔裡的中文一致（中文改了、英文沒跟著改 → 失敗）
// 2. en/prices.json 有每個品項的英文名
// 3. 建好的英文頁（_site/en/）裡沒有漏翻的中文（公司名稱、戶名、語言切換「中」除外）
"use strict";
const fs = require("fs");
const path = require("path");
const { toEn, mismatches } = require("./i18n.js");
const D = (f) => JSON.parse(fs.readFileSync(path.join(__dirname, "../src/_data", f), "utf8"));
let bad = 0;
for (const f of fs.readdirSync(path.join(__dirname, "../src/_data/en"))) {
  const key = f.replace(/\.json$/, "");
  if (key === "prices") continue;
  toEn(D(key + ".json"), D("en/" + f));
}
mismatches.forEach((m) => { console.log("✗ 英文版翻譯對不上：" + m); bad++; });
const ids = D("prices.json").groups.flatMap((g) => g.items.map((i) => i.id));
const en = D("en/prices.json").items;
ids.filter((id) => !en[id]).forEach((id) => { console.log("✗ en/prices.json 少了品項 " + id); bad++; });
const site = path.join(__dirname, "../_site/en");
if (fs.existsSync(site)) {
  const ok = ["潛伴有限公司", "侯又愷", "中"];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : e.name.endsWith(".html") ? [path.join(d, e.name)] : []));
  for (const file of walk(site)) {
    const body = fs.readFileSync(file, "utf8").replace(/<script[\s\S]*?<\/script>/g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<[^>]+>/g, " ");
    const left = (body.match(/[一-鿿][一-鿿　-〿＀-￯0-9 ]*/g) || []).map((s) => s.replace(/[｜\s]/g, "")).filter((s) => s && !ok.includes(s));
    if (left.length) { console.log("✗ " + path.relative(site, file) + " 還有中文：" + [...new Set(left)].slice(0, 12).join("／")); bad++; }
  }
} else console.log("（沒有 _site/en，略過頁面檢查；先跑 npx eleventy）");
if (bad) { console.log("英文版檢查：" + bad + " 項沒過"); process.exit(1); }
console.log("英文版檢查：全部通過");
