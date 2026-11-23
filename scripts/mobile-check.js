// 手機版檢查（iPhone 13，390 寬）：node scripts/mobile-check.js [頁面代號...]
//   1) 不能有橫向捲動　2) 看得到的字至少 14px　3) 按鈕至少 44px 高　4) 頁首選單點得開、連結看得到
//   有問題會列出來並以 exit code 1 結束
const { chromium, devices } = require("playwright");
const http = require("http"), fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..", "_site");
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".webp": "image/webp", ".png": "image/png", ".svg": "image/svg+xml" };
const ROUTES = { home: "/", courses: "/courses/", stay: "/stay/", trips: "/trips/", about: "/about/", booking: "/booking/", terms: "/terms/", privacy: "/privacy/", refund: "/refund/" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]); if (p.endsWith("/")) p += "index.html";
  const f = path.join(root, p); if (!fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type": types[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise((r) => server.listen(8767, r));
  const browser = await chromium.launch();
  let bad = 0;
  for (const k of process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(ROUTES)) {
    const ctx = await browser.newContext({ ...devices["iPhone 13"] });
    const page = await ctx.newPage();
    await page.goto("http://localhost:8767" + ROUTES[k], { waitUntil: "networkidle" });
    const r = await page.evaluate(() => {
      const out = [];
      const de = document.documentElement;
      if (de.scrollWidth > de.clientWidth) out.push(`橫向捲動：內容寬 ${de.scrollWidth} > ${de.clientWidth}`);
      const vis = (el) => { const s = getComputedStyle(el); const b = el.getBoundingClientRect(); return s.display !== "none" && s.visibility !== "hidden" && b.width > 0 && b.height > 0 && !el.closest("[hidden],.hc-mmenu,.back-to-top"); };
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const small = new Map();
      while (walker.nextNode()) {
        const t = walker.currentNode; if (!t.textContent.trim()) continue;
        const el = t.parentElement; if (!el || !vis(el) || el.closest("script,style,option,select")) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs < 13.95) small.set(el, `${fs.toFixed(1)}px「${t.textContent.trim().slice(0, 16)}」`);
        const b = el.getBoundingClientRect(); if (b.right > de.clientWidth + 1) out.push(`超出右邊：「${t.textContent.trim().slice(0, 16)}」右緣 ${Math.round(b.right)}`);
      }
      small.forEach((v) => out.push("字太小 " + v));
      document.querySelectorAll(".hc-btn, .hc-mnav-btn, button, input[type=submit]").forEach((b) => { if (!vis(b)) return; const h = b.getBoundingClientRect().height; if (h < 43.5) out.push(`按鈕太小 ${Math.round(h)}px「${(b.textContent || b.getAttribute("aria-label") || "").trim().slice(0, 12)}」`); });
      return out;
    });
    const nav = await page.$(".hc-mnav-btn");
    if (nav) {
      await nav.click(); await page.waitForTimeout(150);
      const n = await page.evaluate(() => [...document.querySelectorAll(".hc-mhead.is-open .hc-mmenu a")].filter((a) => a.getBoundingClientRect().height >= 40).length);
      if (n < 4) r.push(`選單點開後可點的連結只有 ${n} 個`);
    } else r.push("沒有手機選單按鈕");
    console.log(k, r.length ? "⚠️\n  " + [...new Set(r)].slice(0, 25).join("\n  ") : "OK");
    bad += r.length;
    await ctx.close();
  }
  await browser.close(); server.close();
  process.exit(bad ? 1 : 0);
})();
