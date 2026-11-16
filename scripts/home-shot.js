// 首頁截圖（寬 1440）：node scripts/home-shot.js <輸出.png> [motion]
// 不給 motion＝用「減少動態效果」模式截靜態全頁（魚直接顯示）；給 motion＝一般模式、連續捲動截多張看魚有沒有動
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "_site");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".json": "application/json" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!fs.existsSync(f)) { res.writeHead(404); res.end(); console.log("404", p); return; }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(8765, r));
  const out = process.argv[2];
  const motion = process.argv[3] === "motion";
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: motion ? "no-preference" : "reduce" });
  await page.goto("http://localhost:8765/", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  if (!motion) {
    for (let y = 0; y < 8000; y += 800) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(80); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: out, fullPage: true });
  } else {
    // 每個魚段：捲到該處，進場中（0.3 秒）與漂浮中（2.5 秒）各截一張
    const stops = (process.argv[4] || "1800,2900,3700,4500").split(",").map(Number);
    let i = 0;
    for (const y of stops) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await page.waitForTimeout(300);
      await page.screenshot({ path: out.replace(/\.png$/, `_${++i}a.png`) });
      await page.waitForTimeout(2200);
      await page.screenshot({ path: out.replace(/\.png$/, `_${i}b.png`) });
    }
  }
  await browser.close();
  server.close();
})();
