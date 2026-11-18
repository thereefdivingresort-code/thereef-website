// 條款頁右側目錄檢查：node scripts/legal-toc-test.js <頁面路徑> [輸出資料夾]   例：node scripts/legal-toc-test.js /terms/ /tmp/out
// 1. 捲動時目錄卡片跟著（停在螢幕上方固定位置），捲到「還有其他問題？」前就停下、不會蓋到它
// 2. 點目錄每一條都跳到該條（標題在螢幕上方 20–80px）
// 3. 1440、1280 寬都檢查；另存幾張捲動中的截圖
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "_site");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(8766, r));
  const route = process.argv[2], out = process.argv[3];
  if (out) fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  let fails = 0, n = 0;
  const ok = (c, msg) => { n++; if (!c) { fails++; console.log("✗", msg); } else console.log("✓", msg); };
  for (const width of [1440, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    await page.goto("http://localhost:8766" + route, { waitUntil: "networkidle" });
    const z = width < 1440 ? width / 1440 : 1;
    const card = () => page.evaluate(() => { const r = document.querySelector(".hc-sticky-card").getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; });
    const closing = () => page.evaluate(() => { const s = document.querySelector(".hc-sec-closing"); return s ? s.getBoundingClientRect().top + 25 * (parseFloat(getComputedStyle(document.querySelector(".hc")).zoom) || 1) : 1e9; });
    const tops = [];
    for (const y of [0, 600, 1200, 1800, 2400, 3000]) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
      await page.waitForTimeout(120);
      const c = await card();
      tops.push(Math.round(c.top));
      if (out && width === 1440) await page.screenshot({ path: path.join(out, `toc_${y}.png`) });
      ok(c.bottom <= (await closing()) + 1, `${width} 寬 捲到 ${y}：目錄卡片沒有蓋到「還有其他問題？」`);
    }
    ok(tops[2] === tops[3] && tops[3] < 200, `${width} 寬：中段捲動時目錄停在螢幕上方同一位置（${tops.join("/")}）`);
    const links = await page.$$eval(".hc-sticky a[href^='#']", (as) => as.map((a) => a.getAttribute("href")));
    ok(links.length > 0, `${width} 寬：目錄有 ${links.length} 條連結`);
    for (const h of links) {
      await page.click(`.hc-sticky a[href='${h}']`);
      await page.waitForTimeout(900);
      const t = await page.evaluate((id) => document.getElementById(id).getBoundingClientRect().top, h.slice(1));
      ok(t > -2 && t < 10, `${width} 寬：點 ${h} → 跳到該條（錨點在螢幕上方 ${Math.round(t)}px，標題再往下 ${Math.round(40 * z)}px）`);
    }
    await page.close();
  }
  console.log(`${n - fails}/${n} 通過`);
  await browser.close(); server.close();
  process.exit(fails ? 1 : 0);
})();
