// 手機版／電腦版整頁截圖：node scripts/mobile-shot.js <輸出資料夾> <desk|mobile|mobile2> [home courses ...]
//   desk＝1440、1280 兩種寬（給改前改後逐像素比對）；mobile＝iPhone 13（1 倍）；mobile2＝iPhone 13（2 倍，給 Ambre 看）
//   每張圖旁邊會存一份 .json（每段的位置），給 scripts/mobile-compare.py 用。要先 npx eleventy 建置
const { chromium, devices } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "_site");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json", ".svg":"image/svg+xml" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!fs.existsSync(f)) { res.writeHead(404); res.end(); console.log("404", p); return; }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
});
const ROUTES = { home:"/", courses:"/courses/", stay:"/stay/", trips:"/trips/", about:"/about/", booking:"/booking/", terms:"/terms/", privacy:"/privacy/", refund:"/refund/" };
(async () => {
  await new Promise((r) => server.listen(8766, r));
  const [out, mode, ...keys] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const ctxs = mode === "desk" ? [1440, 1280].map(w => ({ tag: w, opts: { viewport: { width: w, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" } }))
    : [{ tag: "m", opts: { ...devices["iPhone 13"], deviceScaleFactor: mode==="mobile2"?2:1, reducedMotion: "reduce" } }];
  for (const c of ctxs) {
    const ctx = await browser.newContext(c.opts);
    for (const k of (keys.length ? keys : Object.keys(ROUTES))) {
      const page = await ctx.newPage();
      page.on("pageerror", e => console.log("JSERR", k, e.message));
      await page.goto("http://localhost:8766" + ROUTES[k], { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const H = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < H; y += 600) { await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y); await page.waitForTimeout(60); }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" })); await page.waitForTimeout(400);
      const info = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, h: document.documentElement.scrollHeight }));
      console.log(c.tag, k, JSON.stringify(info));
      const secs = await page.evaluate(() => [...document.querySelectorAll(".hc-sec, .hc-flow, .hc-after")].map(e => { const r = e.getBoundingClientRect(); return [e.dataset.name || e.className, Math.round(r.top + scrollY), Math.round(r.height)]; }));
      fs.writeFileSync(`${out}/${k}_${c.tag}.json`, JSON.stringify(secs));
      await page.screenshot({ path: `${out}/${k}_${c.tag}.png`, fullPage: true });
      await page.close();
    }
    await ctx.close();
  }
  await browser.close(); server.close();
})();
