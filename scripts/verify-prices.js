// 自動驗算：用 Sheet「03_驗算表」的每個情境跑網站的計價程式，有一題不一致就失敗（不會上線）。
const prices = require("../src/_data/prices.json");
const tests = require("../src/_data/price-tests.json");
const P = require("../src/assets/js/pricing.js");
const items = P.index(prices);
let bad = 0;
const got = {};
for (const t of tests.cases) {
  const it = items[t.id];
  if (!it) { console.log("✗", t.no, t.name, "：價目表找不到", t.id); bad++; continue; }
  const v = P.calc(it, t.a, t.b);
  got[t.no] = v;
  const ok = v === t.expect;
  if (!ok) bad++;
  console.log(ok ? "✓" : "✗", t.no, t.name, "網站算", v, "正確答案", t.expect);
}
for (const c of tests.combos) {
  const v = c.parts.reduce((s, p) => s + (got[p] || 0), 0);
  const ok = v === c.expect;
  if (!ok) bad++;
  console.log(ok ? "✓" : "✗", c.no, c.name, "網站算", v, "正確答案", c.expect);
}
console.log(bad ? `\n${bad} 題不一致，停止發布。` : `\n全部 ${tests.cases.length + tests.combos.length} 題一致。`);
process.exit(bad ? 1 : 0);
