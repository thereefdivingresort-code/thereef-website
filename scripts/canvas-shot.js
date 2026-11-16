// 照 Canva 排版頁面的截圖（寬 1440）：node scripts/canvas-shot.js <頁面路徑> <輸出.png> [motion] [捲動位置,...]
//   例：node scripts/canvas-shot.js / home.png　　node scripts/canvas-shot.js /courses/ courses.png
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
  const route = process.argv[2];
  const out = process.argv[3];
  const motion = process.argv[4] === "motion";
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: motion ? "no-preference" : "reduce" });
  await page.goto("http://localhost:8765" + route, { waitUntil: "networkidle" });
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.evaluate(() => document.fonts.ready);
  if (!motion) {
    for (let y = 0; y < H; y += 800) { await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y); await page.waitForTimeout(80); }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(500);
    await page.screenshot({ path: out, fullPage: true });
  } else {
    // 連續捲動：捲到指定位置後，每隔一段時間截一張（看魚有沒有進場、漂浮）
    const stops = (process.argv[5] || "1500").split(",").map(Number);
    const times = [100, 400, 800, 1600, 3000];
    let i = 0;
    for (const y of stops) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), y);
      let t0 = 0; i++;
      for (const t of times) {
        await page.waitForTimeout(t - t0); t0 = t;
        await page.screenshot({ path: out.replace(/\.png$/, `_${i}_${t}ms.png`) });
      }
    }
  }
  await browser.close();
  server.close();
})();
