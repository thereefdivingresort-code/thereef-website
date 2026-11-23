// 手機版／電腦版整頁截圖：node scripts/mobile-shot.js <輸出資料夾> <mobile|desktop|both> [頁面代號...]
//   頁面代號：home courses stay trips about booking terms privacy refund（不給＝九頁全部）
//   mobile ＝ Playwright「iPhone 13」（390 寬）整頁；desktop ＝ 1440、1280 寬整頁（用來比對改前改後是否逐像素相同）
//   都用「減少動態效果」模式（魚直接顯示），截出來才穩定可比
//   例：node scripts/mobile-shot.js docs/compare/mobile mobile home
const { chromium, devices } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "_site");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".svg": "image/svg+xml" };
const ROUTES = { home: "/", courses: "/courses/", stay: "/stay/", trips: "/trips/", about: "/about/", booking: "/booking/", terms: "/terms/", privacy: "/privacy/", refund: "/refund/" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
async function shoot(browser, opts, route, out) {
  const ctx = await browser.newContext({ ...opts, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto("http://localhost:8766" + route, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  const step = (opts.viewport && opts.viewport.height) || 700;
  for (let y = 0; y < H; y += step) { await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y); await page.waitForTimeout(60); }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.waitForTimeout(400);
  const info = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h: document.documentElement.scrollHeight,
    // 每一段的位置（給 scripts/mobile-compare.py 做電腦版／手機版同一段並排比對圖）
    secs: [...document.querySelectorAll(".hc-sec")].map((e) => { const r = e.getBoundingClientRect(); return { key: e.className.replace(/.*hc-sec-/, ""), name: e.dataset.name, y: r.top + scrollY, h: r.height }; }),
    flow: (() => { const f = document.querySelector(".hc-flow"); if (!f) return null; const r = f.getBoundingClientRect(); return { y: r.top + scrollY, h: r.height }; })() }));
  fs.writeFileSync(out.replace(/\.png$/, ".json"), JSON.stringify(info));
  await page.screenshot({ path: out, fullPage: true });
  await ctx.close();
  return info;
}
(async () => {
  const [outDir, mode = "both", ...keys] = process.argv.slice(2);
  fs.mkdirSync(outDir, { recursive: true });
  await new Promise((r) => server.listen(8766, r));
  const browser = await chromium.launch();
  for (const k of keys.length ? keys : Object.keys(ROUTES)) {
    if (mode !== "desktop") {
      const i = await shoot(browser, { ...devices["iPhone 13"] }, ROUTES[k], path.join(outDir, `${k}_mobile.png`));
      console.log(k, "mobile", `寬 ${i.cw}`, `內容寬 ${i.sw}`, i.sw > i.cw ? "⚠️ 有橫向捲動" : "OK", `高 ${i.h}`);
    }
    if (mode !== "mobile") {
      for (const w of [1440, 1280]) {
        const i = await shoot(browser, { viewport: { width: w, height: 900 }, deviceScaleFactor: 1 }, ROUTES[k], path.join(outDir, `${k}_${w}.png`));
        console.log(k, w, `高 ${i.h}`);
      }
    }
  }
  await browser.close();
  server.close();
})();
