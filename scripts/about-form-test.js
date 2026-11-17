// 關於頁留言表單＋錨點檢查：node scripts/about-form-test.js <輸出資料夾>
//   1. /about/#contact 直接跳到「聯絡我們」（1440 寬與 1280 寬）；頁尾「聯絡我們」按鈕也跳到這裡
//   2. 沒填必填就按送出 → 不顯示訊息；全部填好、勾同意 → 顯示「線上留言開通中…」
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "_site");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0].split("#")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
const out = process.argv[2] || ".";
let fail = 0;
const ok = (c, m) => { console.log((c ? "OK  " : "NG  ") + m); if (!c) fail++; };
(async () => {
  await new Promise((r) => server.listen(8766, r));
  const browser = await chromium.launch();
  for (const w of [1440, 1280]) {
    const page = await browser.newPage({ viewport: { width: w, height: 900 } });
    await page.goto("http://localhost:8766/about/#contact", { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    const top = await page.evaluate(() => {
      const h = [...document.querySelectorAll(".hc-t")].find((e) => e.textContent.trim() === "聯絡我們");
      return h.getBoundingClientRect().top;
    });
    ok(top > 20 && top < 140, `寬 ${w}：打開 /about/#contact，「聯絡我們」標題在畫面上方 ${Math.round(top)}px（沒被擋住）`);
    await page.screenshot({ path: path.join(out, `anchor_${w}.png`) });
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://localhost:8766/about/", { waitUntil: "networkidle" });
  await page.click('.hc-sec-footer a.hc-btn[href="/about/#contact"]');
  await page.waitForTimeout(1200);
  const y = await page.evaluate(() => window.scrollY);
  ok(Math.abs(y - 1250) < 3, `頁尾「聯絡我們」按鈕 → 捲到 y=${Math.round(y)}（錨點 1250）`);
  const msg = page.locator(".hc-formmsg");
  await page.click(".hc-submit");
  await page.waitForTimeout(300);
  ok(await msg.isHidden(), "什麼都沒填就按送出 → 不送、提示必填");
  await page.fill("#contact-form-name", "王小明");
  await page.fill("#contact-form-phone", "0912-345-678");
  await page.fill("#contact-form-email", "test@example.com");
  await page.selectOption("#contact-form-plan", "OW");
  await page.fill("#contact-form-message", "想預約 12 月的 OW 考照，兩個人。");
  await page.click(".hc-submit");
  await page.waitForTimeout(300);
  ok(await msg.isHidden(), "沒勾同意隱私權政策 → 不送");
  await page.click('label[for="contact-form-agree"]', { position: { x: 30, y: 8 } });
  ok(await page.isChecked("#contact-form-agree"), "點同意那行字 → 勾選框打勾");
  await page.click(".hc-submit");
  await page.waitForTimeout(300);
  ok(await msg.isVisible(), "全部填好、勾同意 → 顯示：" + (await msg.textContent()).trim());
  ok((await page.inputValue("#contact-form-name")) === "王小明", "送出後填的字還在");
  const opts = await page.$$eval("#contact-form-plan option", (os) => os.map((o) => o.textContent));
  ok(opts.length === 9, "想問的方案選項：" + opts.join("、"));
  const hrefs = await page.$$eval(".hc-sec-links a", (as) => as.map((a) => a.getAttribute("href")));
  ok(hrefs.join() === "/stay/,/courses/,/trips/", "三欄連結：" + hrefs.join("、"));
  const pv = await page.$eval('label[for="contact-form-agree"] a', (a) => a.getAttribute("href"));
  ok(pv === "/privacy/", "隱私權政策連結：" + pv);
  const tel = await page.$eval(".hc-sec-contact a[href^='tel:']", (a) => a.getAttribute("href"));
  ok(tel === "tel:+886936871525", "電話可點撥號：" + tel);
  await page.evaluate(() => window.scrollTo(0, 2100));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(out, "form_sent.png"), clip: { x: 0, y: 0, width: 1440, height: 900 } });
  await browser.close();
  server.close();
  console.log(fail ? `有 ${fail} 項不對` : "全部通過");
  process.exit(fail ? 1 : 0);
})();
