// 預訂頁驗算（Playwright 真的在網頁上點）：讀 docs/booking-verify/scenarios.json（正確答案由 scripts/booking-verify-expect.py 用 Sheet 另外算），
// 手機版也要過：MOBILE=1 node scripts/booking-test.js …（用 iPhone 13 跑同樣的檢查）
// 在 /booking/ 選項目、填數量、勾選，讀畫面上的小計與合計比對。結果寫到 docs/booking-verify/results.json。
// 用法：npx @11ty/eleventy && python3 scripts/booking-verify-expect.py && node scripts/booking-test.js
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "_site");
const D = path.join(__dirname, "..", "docs", "booking-verify");
const S = JSON.parse(fs.readFileSync(path.join(D, "scenarios.json"), "utf8"));
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".json": "application/json" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
const URL = "http://localhost:8766/booking/";
const num = (t) => Number(String(t).replace(/[^0-9-]/g, "")) || 0;

async function act(page, a) {
  const [k, x, y, z, w] = a;
  if (k === "sel") await page.selectOption("#sel-" + x, y);
  else if (k === "ctr") {
    const sel = '.bk-row[data-row="' + x + '"]' + (w === "extra" ? "[data-extra]" : ":not([data-extra])") + ' .ctr[data-k="' + y + '"] input';
    await page.fill(sel, String(z));
    await page.locator(sel).blur();
  } else if (k === "tick" || k === "untick") {
    const cb = page.locator('.bk-ms-list input[value="' + x + '"]');
    const det = page.locator('.bk-ms:has(input[value="' + x + '"])');
    if (!(await det.evaluate((d) => d.open))) await det.locator("summary").click();
    if (k === "tick") await cb.check(); else await cb.uncheck();
    await page.click(".bk-h1"); // 點外面收起下拉
  } else if (k === "up") { if (y !== false) await page.check(".bk-upline input"); else await page.uncheck(".bk-upline input"); }
  else throw new Error("unknown action " + k);
}
async function read(page, r) {
  if (r === "@total") return num(await page.textContent("#cart-total"));
  if (r === "@extra") return num(await page.textContent(".bk-row[data-extra] .bk-sub"));
  if (r === "@up") return num(await page.textContent(".bk-upline .bk-sub"));
  return num(await page.textContent('.bk-row[data-row="' + r + '"]:not([data-extra]) .bk-sub'));
}
async function totals(page) {
  return { cart: num(await page.textContent("#cart-total")), side: num(await page.textContent("#sum-total")),
    blocks: await page.$$eval("#sum-lines li", (ls) => ls.reduce((s, l) => s + (Number(l.querySelector("b").textContent.replace(/[^0-9]/g, "")) || 0), 0)),
    order: await page.evaluate(() => window.__reefOrder.total) };
}

(async () => {
  await new Promise((r) => server.listen(8766, r));
  const browser = await chromium.launch();
  const page = await browser.newPage(process.env.MOBILE ? { ...require("playwright").devices["iPhone 13"] } : { viewport: { width: 1440, height: 900 } });
  const out = { at: new Date().toISOString(), c: [], d: [], e: null, f: [], g: [] };
  let bad = 0;
  async function scenario(sc) {
    await page.goto(URL, { waitUntil: "load" });
    for (const a of sc.acts) await act(page, a);
    const got = await read(page, sc.read);
    const t = await totals(page);
    const ok = got === sc.expect && t.cart === sc.total && t.side === sc.total && t.blocks === sc.total && t.order === sc.total;
    if (!ok) bad++;
    return { got, total: t.cart, side: t.side, ok };
  }
  for (const sc of S.c) out.c.push({ no: sc.no, id: sc.id, expect: sc.expect, ...(await scenario(sc)) });
  for (const sc of S.d) out.d.push({ name: sc.name, expect: sc.expect, expectTotal: sc.total, ...(await scenario(sc)) });

  // e：Canva 示範組合
  await page.goto(URL, { waitUntil: "load" });
  await page.fill("#bk-date", "2026-12-05");
  const rows = [];
  for (const r of S.e.rows) { for (const a of r.acts) await act(page, a); }
  for (const r of S.e.rows) { const got = await read(page, r.read); rows.push({ name: r.name, canva: r.canva, expect: r.expect, got, ok: got === r.expect }); if (got !== r.expect) bad++; }
  const t = await totals(page);
  const blocks = await page.$$eval("#sum-lines li", (ls) => Object.fromEntries(ls.map((l) => [l.dataset.sum, Number(l.querySelector("b").textContent.replace(/[^0-9]/g, "")) || 0])));
  const eOk = t.cart === S.e.expectTotal && t.side === S.e.expectTotal && JSON.stringify(blocks) === JSON.stringify(S.e.canvaSummary);
  if (!eOk) bad++;
  out.e = { rows, total: t.cart, side: t.side, expectTotal: S.e.expectTotal, canvaTotal: S.e.canvaTotal, blocks, canvaSummary: S.e.canvaSummary, date: await page.textContent("#sum-date"), ok: eOk };
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(D, "e_canva_combo.png"), fullPage: true });

  // f：?item=代號
  for (const f of S.f) {
    await page.goto(URL + "?item=" + f.id, { waitUntil: "load" });
    await page.waitForTimeout(50);
    const r = await page.evaluate((id) => {
      const L = window.__reefOrder.lines.find((l) => l.id === id);
      return { sub: L ? L.sub : 0, lines: window.__reefOrder.lines.map((l) => l.id), y: window.scrollY };
    }, f.id);
    const ok = r.sub === f.expect;
    if (!ok) bad++;
    out.f.push({ id: f.id, expect: f.expect, got: r.sub, lines: r.lines, scrolled: r.y > 0, ok });
  }

  // g：清空、刪除一列、改數量為 0（同一頁連續操作）
  await page.goto(URL, { waitUntil: "load" });
  for (const st of S.g) {
    for (const a of st.acts) await act(page, a);
    const t = await totals(page);
    const ok = t.cart === st.total && t.side === st.total && t.blocks === st.total && t.order === st.total;
    if (!ok) bad++;
    out.g.push({ name: st.name, expect: st.total, got: t.cart, side: t.side, ok });
  }
  const dash = await page.$$eval("#sum-lines li b", (bs) => bs.every((b) => b.textContent === "—"));
  out.g.push({ name: "清空後右側摘要七區都顯示「—」", expect: "—", got: dash ? "—" : "有數字", ok: dash });
  if (!dash) bad++;

  out.bad = bad;
  fs.writeFileSync(path.join(D, "results.json"), JSON.stringify(out, null, 1));
  const cnt = (a) => a.filter((x) => x.ok).length + "/" + a.length;
  console.log("c", cnt(out.c), "d", cnt(out.d), "e", out.e.ok, cnt(out.e.rows), "f", cnt(out.f), "g", cnt(out.g), bad ? "→ " + bad + " 題不一致" : "→ 全部一致");
  await browser.close(); server.close();
  process.exit(bad ? 1 : 0);
})();
