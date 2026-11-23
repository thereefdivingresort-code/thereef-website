// 預訂頁第 1→4 步流程檢查（Playwright）：每一步沒填好不能往下、上一步資料不會不見、合計一路一樣、第 4 步「LINE 預訂」是橘色粗體。
// 手機版也要過：MOBILE=1 node scripts/booking-flow-test.js …（用 iPhone 13 跑同樣的檢查）
// 每一步截一張全頁圖：node scripts/booking-flow-test.js <截圖資料夾>
const { chromium } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "_site");
const out = process.argv[2] || ".";
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p);
  if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp" }[path.extname(f)] || "application/octet-stream" });
  fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(8768, r));
  const browser = await chromium.launch();
  const page = await browser.newPage(process.env.MOBILE ? { ...require("playwright").devices["iPhone 13"] } : { viewport: { width: 1440, height: 900 } });
  const R = [];
  const ok = (name, cond, got) => { R.push({ name, ok: !!cond, got }); };
  const step = () => page.evaluate(() => document.getElementById("bk").dataset.step);
  const msg = (n) => page.textContent('.bk-pick-msg[data-msg="' + n + '"]');
  const vis = (n) => page.isVisible('.bk-stepview[data-step="' + n + '"]');
  await page.goto("http://localhost:8768/booking/", { waitUntil: "load" });

  await page.click('.bk-stepview[data-step="1"] [data-go="2"]');
  ok("沒選項目按下一步 → 留在第 1 步＋提醒", (await step()) === "1" && (await msg(1)).includes("至少選一個"), await msg(1));
  await page.fill('[data-row="dsd"] .ctr input', "2");
  await page.selectOption("#sel-course", "ow");
  await page.click('.bk-stepview[data-step="1"] [data-go="2"]');
  ok("沒選出發日期 → 留在第 1 步＋提醒", (await step()) === "1" && (await msg(1)).includes("出發日期"), await msg(1));
  await page.fill("#bk-date", "2026-12-05");
  const total1 = await page.textContent("#cart-total");
  await page.click("#sum-next");
  ok("選好按右側「下一步：填資料」→ 第 2 步", (await step()) === "2" && (await vis(2)) && !(await vis(1)), await step());
  ok("網址變成 #step-2", page.url().endsWith("#step-2"), page.url());
  ok("第 2 步合計跟第 1 步一樣", (await page.textContent('.bk-stepview[data-step="2"] .js-total')) === total1, total1);
  ok("標題小字變第 2 步", (await page.textContent("#bk-eyebrow")).includes("第 2 步：填資料"), await page.textContent("#bk-eyebrow"));
  await page.screenshot({ path: path.join(out, "step2.png"), fullPage: true });

  await page.click('.bk-stepview[data-step="2"] [data-go="3"]');
  ok("第 2 步沒填 → 留在第 2 步＋提醒", (await step()) === "2" && (await msg(2)).includes("沒填好"), await msg(2));
  for (const [n, v] of [["name", "王小明"], ["phone", "0912-345-678"], ["email", "test@example.com"], ["birthday", "1990-01-01"], ["emergencyName", "王媽媽／母親"], ["emergencyPhone", "0922-333-444"]]) await page.fill('[name="' + n + '"]', v);
  await page.click("#add-person");
  await page.click('.bk-stepview[data-step="2"] [data-go="3"]');
  ok("新增參加者但沒填 → 留在第 2 步", (await step()) === "2", await step());
  await page.fill('[name="p2_name"]', "王小華"); await page.fill('[name="p2_birthday"]', "1992-02-02");
  await page.click('.bk-stepview[data-step="2"] [data-go="3"]');
  ok("填好 → 第 3 步", (await step()) === "3", await step());
  await page.screenshot({ path: path.join(out, "step3.png"), fullPage: true });

  await page.click('.bk-stepview[data-step="3"] [data-go="4"]');
  ok("沒勾條款 → 留在第 3 步＋提醒", (await step()) === "3" && (await msg(3)).includes("四個都要勾"), await msg(3));
  const cbs = page.locator('.bk-stepview[data-step="3"] input[type=checkbox]');
  for (let i = 0; i < 3; i++) await cbs.nth(i).check();
  await page.click('.bk-stepview[data-step="3"] [data-go="4"]');
  ok("只勾 3 個 → 還是留在第 3 步", (await step()) === "3", await step());
  await cbs.nth(3).check();
  await page.click('.bk-stepview[data-step="3"] [data-go="4"]');
  ok("四個都勾 → 第 4 步", (await step()) === "4", await step());
  ok("第 4 步右側沒有下一步按鈕", !(await page.isVisible("#sum-next")), "");
  const hl = await page.$$eval("#form-msg .bk-hl", (els) => els.map((e) => [e.textContent, getComputedStyle(e).color, getComputedStyle(e).fontWeight]));
  ok("「LINE 官方帳號」「預訂」橘色 #ec6b0c 粗體", hl.length === 2 && hl.every(([, c, w]) => c === "rgb(236, 107, 12)" && Number(w) >= 700), JSON.stringify(hl));
  await page.screenshot({ path: path.join(out, "step4.png"), fullPage: true });

  await page.click('.bk-stepview[data-step="4"] [data-go="3"]');
  ok("第 4 步按上一步 → 第 3 步、勾選還在", (await step()) === "3" && (await cbs.nth(3).isChecked()), await step());
  await page.goBack(); await page.waitForTimeout(100);
  ok("瀏覽器上一頁 → 回到前一步", ["2", "4"].includes(await step()), await step());
  const p2 = await browser.newPage(process.env.MOBILE ? { ...require("playwright").devices["iPhone 13"] } : { viewport: { width: 1440, height: 900 } });
  await p2.goto("http://localhost:8768/booking/#step-3", { waitUntil: "load" });
  const s2 = await p2.evaluate(() => document.getElementById("bk").dataset.step);
  ok("新開網頁直接打開 #step-3（還沒選東西）→ 從第 1 步開始", s2 === "1", s2);

  const bad = R.filter((r) => !r.ok);
  R.forEach((r) => console.log(r.ok ? "✓" : "✗", r.name, r.ok ? "" : r.got));
  console.log(bad.length ? bad.length + " 項不通過" : "全部 " + R.length + " 項通過");
  fs.writeFileSync(path.join(__dirname, "..", "docs", "booking-verify", "flow-results.json"), JSON.stringify(R, null, 1));
  await browser.close(); server.close();
  process.exit(bad.length ? 1 : 0);
})();
