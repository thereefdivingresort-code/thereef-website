// 手機版（螢幕寬 ≤ 768px）排法：把每一段 Canva 座標的元素「分組、排順序」，再插入「插圖窗」。
// 設定在 src/_data/mobile.json；電腦版完全不受影響：
//   - 分組外框 .hc-mg 在電腦版是 display: contents（不產生方框，元素照原本座標排）
//   - 插圖窗 .hc-mband、手機頁首的 logo／選單按鈕在電腦版 display: none
// 用法（canvas-page.njk）：{% set mb = s | mBlocks(canvasKey, home, mobile, imgDir, prefix) %}
//
// mobile.json：
//   header ＝ 手機頁首：logo、太陽從首頁開場底圖哪一塊切（x0, y0, x1, y1）
//   footer ＝ 全站頁尾（座標用首頁頁尾那段），每頁頁尾自動照該頁的 dx、dy 位移
//   pages.<頁>.<段>：
//     bg     ＝ 這段手機上的底圖：{ crop: [y0, y1] 只用底圖這個高度範圍, x: 水平焦點 0–100, color: 底色, shade: 疊一層漸層 }
//     pad    ＝ 這段上下留白（CSS padding）
//     blocks ＝ 由上往下的區塊：
//       { band: [x0, y0, x1, y1], img: true/false, fish: true/false, w: 最大寬(px), cls }  ← 插圖窗：底圖＋插圖的一塊，等比縮到手機寬
//       { items: [元素, ...], cls, gap, pad }  ← 文字組：元素＝文字 id 或 "#序號"（這段 items 的第幾個，從 0 起）；
//                                               也可以寫 { ref, fs(手機字級 px), cls }
//     hide   ＝ 手機上不顯示的元素
// 沒有寫到的元素會自動排在這段最後（不會不見）。

function r(n) { return Math.round(n * 1000) / 1000; }

function bandData(b, s, imgUrl, dx, dy) {
  const [x0r, y0r, x1r, y1r] = b.band;
  const x0 = x0r + dx, x1 = x1r + dx, y0 = y0r + dy, y1 = y1r + dy;
  const w = x1 - x0, h = y1 - y0;
  const out = { type: "band", cls: b.cls || "", ar: r(w / h), maxW: b.w || null, fish: [] };
  if (b.img !== false) {
    out.img = imgUrl;
    out.imgStyle = `left:${r(-x0 / w * 100)}%;top:${r(-y0 / h * 100)}%;width:${r(1440 / w * 100)}%;height:${r(s.height / h * 100)}%`;
  }
  if (b.fish !== false) {
    const pick = Array.isArray(b.fish) ? b.fish : null;
    s.items.forEach((it, i) => {
      if (it.kind !== "fish") return;
      const cx = it.x + it.w / 2, cy = it.y + it.h / 2;
      if (pick ? !pick.includes("#" + i) : !(cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1)) return;
      const f = {
        it,
        style: `left:${r((it.x - x0) / w * 100)}%;top:${r((it.y - y0) / h * 100)}%;width:${r(it.w / w * 100)}%;height:${r(it.h / h * 100)}%;` + (it.rot ? `transform:rotate(${it.rot}deg);` : ""),
        k: r(Math.min(1, 390 / w * 1.4)), // 進場位移跟著縮小
      };
      if (it.crop) f.cropStyle = `position:absolute;left:${r(it.crop.x / it.w * 100)}%;top:${r(it.crop.y / it.h * 100)}%;width:${r(it.crop.w / it.w * 100)}%;height:${r(it.crop.h / it.h * 100)}%;`;
      out.fish.push(f);
    });
  }
  return out;
}

module.exports = function mBlocks(s, pageKey, home, mobile, imgDir, prefix) {
  mobile = mobile || {};
  // 圖片網址：<img src> 由 Eleventy 自動加網址前綴；寫在 CSS 變數裡的要自己加（prefix＝"/" | url）
  const pre = (prefix || "/").replace(/\/$/, "");
  const imgUrl = `/assets/img/${imgDir}/${s.img}`;
  // 這段的所有元素（順序跟電腦版原本一樣：自己的元素，再來是共用頁首／頁尾）
  const entries = [];
  s.items.forEach((it, i) => { if (it.kind !== "fish") entries.push({ it, dx: 0, dy: 0, key: it.id || "#" + i }); });
  let footerShift = null;
  for (const sh of s.shared || []) {
    const hs = home.sections.find((h) => h.key === sh.from);
    if (!hs) continue;
    if (sh.from === "footer") footerShift = { dx: sh.dx || 0, dy: sh.dy || 0 };
    hs.items.forEach((it, i) => {
      if ((sh.maxY && it.y >= sh.maxY) || it.kind === "fish") return;
      entries.push({ it, dx: sh.dx || 0, dy: sh.dy || 0, key: it.id || "#" + i, from: sh.from });
    });
  }
  const isHomeOpen = pageKey === "home" && s.key === "open";
  const isHead = (e) => e.from === "open" || (isHomeOpen && e.it.y < 140);
  const isFooter = !!footerShift || (pageKey === "home" && s.key === "footer");
  const cfg = isFooter ? (mobile.footer || {}) : (((mobile.pages || {})[pageKey] || {})[s.key] || {});
  const shift = footerShift || { dx: 0, dy: 0 };

  const used = new Set();
  const blocks = [];
  const head = entries.filter(isHead);
  if (head.length) {
    head.forEach((e) => used.add(e));
    const h = mobile.header || {};
    blocks.push({
      type: "head",
      items: head.map((e) => ({ ...e, m: e.it.kind === "text" ? { cls: "hc-mmenu" } : { cls: "hc-mbook" } })),
      logo: h.logo ? bandData({ band: h.logo, fish: false }, { height: 1000, items: [] }, "/assets/img/home/home_s_open.webp", 0, 0) : null,
      sun: h.sun ? bandData({ band: h.sun, fish: false }, { height: 1000, items: [] }, "/assets/img/home/home_s_open.webp", 0, 0) : null,
    });
  }
  const find = (ref) => entries.find((e) => !used.has(e) && !isHead(e) && e.key === ref);
  for (const b of cfg.blocks || []) {
    if (b.band) { blocks.push(bandData(b, s, imgUrl, shift.dx, shift.dy)); continue; }
    const items = [];
    for (const ref of b.items || []) {
      const o = typeof ref === "string" ? { ref } : ref;
      const e = find(o.ref);
      if (!e) continue;
      used.add(e);
      const vars = (o.fs ? `--mfs:${o.fs}px;` : "") + (o.vars || "");
      items.push({ ...e, m: { cls: o.cls || "", vars } });
    }
    if (items.length) blocks.push({ type: "group", cls: b.cls || "", vars: (b.gap != null ? `--mgap:${b.gap}px;` : "") + (b.pad ? `--mpad:${b.pad};` : "") + (b.vars || ""), items });
  }
  const hide = new Set(cfg.hide || []);
  const rest = entries.filter((e) => !used.has(e) && !hide.has(e.key));
  if (rest.length) blocks.push({ type: "group", cls: "hc-mrest", vars: "", items: rest });
  const hidden = entries.filter((e) => !used.has(e) && hide.has(e.key));
  if (hidden.length) blocks.push({ type: "group", cls: "hc-mhide", vars: "", items: hidden });

  // 這段的手機底圖（CSS 變數，只有手機版 CSS 會用到）
  const bg = cfg.bg || {};
  let vars = `--mbgimg:url('${pre}${imgUrl}');`;
  if (bg.crop) {
    const [y0, y1] = [bg.crop[0] + shift.dy, bg.crop[1] + shift.dy];
    const ch = y1 - y0;
    const py = s.height > ch ? r(y0 / (s.height - ch) * 100) : 0;
    vars += `--mbgsize:auto ${r(s.height / ch * 100)}%;--mbgpos:${bg.x != null ? bg.x : 50}% ${py}%;`;
  } else if (bg.x != null || bg.y != null) {
    vars += `--mbgpos:${bg.x != null ? bg.x : 50}% ${bg.y != null ? bg.y : 50}%;`;
  }
  if (bg.size) vars += `--mbgsize:${bg.size};`;
  if (bg.color) vars += `--mbgc:${bg.color};`;
  if (bg.shade) vars += `--mshade:${bg.shade};`;
  if (bg.none) vars += `--mbgimg:none;`;
  if (cfg.pad) vars += `--mspad:${cfg.pad};`;
  return { blocks, vars };
};
