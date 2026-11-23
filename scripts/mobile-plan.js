// 手機版排法（≤ 768px）：把一段（section）裡照 Canva 座標放的元素，排成「由上往下」的順序。
// 電腦版完全不受影響：這裡產生的外框在電腦版都是 display: contents（不產生方框），元素仍照原本座標絕對定位。
// 每頁每段的少量設定在 src/_data/mobile.js；沒設定的段落用預設：底圖鋪滿、文字照 y 由上往下排、同一高度的並排成一列。
//
// 產生的節點：
//   item ＝ 文字／按鈕／FAQ／表單欄位（手機上照順序往下排）
//   fish ＝ 插圖（手機上按比例放在所屬外框裡，縮小但保留動畫）
//   pic  ＝ 把底圖的一塊（例如照片、地圖、山海插畫）原樣切出來、等比放滿手機寬；落在這塊裡的字、插圖跟著等比縮放
//   box  ＝ 卡片（白底圓角那種）；卡片底色原本畫在底圖上，手機上改用 CSS 畫，裡面的字照順序往下排
//   row  ＝ 同一高度左右並排的元素（例如價格＋預訂鈕、表格的左右兩欄），手機上一列放不下就自動換行
//   hdr  ＝ 頁首（logo、選單、預訂鈕）
const r2 = (n) => Math.round(n * 100) / 100;

function textOf(it) {
  if (it.text) return String(it.text);
  if (it.label) return String(it.label);
  if (it.links) return it.links.map((l) => l[0]).join("");
  if (it.spans) return it.spans.map((s) => s.t).join("");
  if (it.runs) return it.runs.map((s) => s.t).join("\n");
  if (it.site) return "一二三四五六七八九十一二三四五六七八九十\n一二三四五六七八九十\n一二三";
  return "";
}
function estH(n) {
  if (n.t === "pic" || n.t === "box") return n.r[3];
  if (n.t === "row") return Math.max(...n.kids.map(estH));
  const it = n.it;
  if (it.kind === "anchor") return 0;
  if (it.h) return it.h;
  if (it.kind === "faq") return (it.items || []).length * (it.rowH || 60) + 60;
  const fs = it.fs || 16, lh = it.lh || 1.4, w = it.w || 500;
  let lines = 0;
  for (const ln of textOf(it).split("\n")) lines += Math.max(1, Math.ceil((ln.length * fs * 0.98) / w));
  return lines * fs * lh;
}
const inside = (r, x, y) => x >= r[0] && x < r[0] + r[2] && y >= r[1] && y < r[1] + r[3];
const anchorPt = (n) => (n.t === "fish" ? [n.it.x + n.it.w / 2, n.it.y + n.it.h / 2] : [n.it.x + n.dx + 2, n.it.y + n.dy + 2]);
const yOf = (n) => (n.t === "pic" || n.t === "box" ? (n.o != null ? n.o : n.r[1]) : n.o != null ? n.o : n.t === "row" ? n.y : (n.it.y + (n.dy || 0)));

// 容器（段落／pic／box）裡的元素：插圖分開，其他照 y 排、同高並排成 row、算上下間距
function layout(kids, ctx, cfg) {
  // 插圖設了 at（跟著某段文字）：在那段文字後面放一個高度 0 的定位點，插圖相對它放
  const fa = [];
  for (const k of kids.filter((k) => k.t === "fish" && k.fm && k.fm.at)) {
    const tgt = kids.find((n) => n.t === "item" && textOf(n.it).startsWith(k.fm.at));
    if (tgt) { k.anch = true; fa.push({ t: "fa", o: yOf(tgt) + 0.01 + fa.length * 0.001, kids: [k] }); }
  }
  const fish = kids.filter((k) => k.t === "fish" && !k.anch);
  let flow = kids.filter((k) => k.t !== "fish").concat(fa).sort((a, b) => yOf(a) - yOf(b) || ((a.it && a.it.x) || 0) - ((b.it && b.it.x) || 0));
  // 同一高度（相差 tol 內）、左右不重疊的元素 → 一列
  const tol = cfg.rowTol != null ? cfg.rowTol : 14;
  const out = [];
  for (const n of flow) {
    const prev = out[out.length - 1];
    const canRow = (k) => k.t === "item" && !k.solo && ["text", "button", "check"].includes(k.it.kind);
    if (prev && canRow(n) && (prev.t === "row" || canRow(prev)) && Math.abs(yOf(n) - (prev.t === "row" ? prev.y : yOf(prev))) <= tol) {
      if (prev.t === "row") prev.kids.push(n);
      else out[out.length - 1] = { t: "row", y: yOf(prev), kids: [prev, n] };
    } else out.push(n);
  }
  for (const n of out) if (n.t === "row") n.kids.sort((a, b) => a.it.x - b.it.x);
  // 上下間距：照電腦版的空隙縮小，限制在 6～56px
  let prevBottom = null;
  for (const n of out) {
    if (n.t === "fa") { n.mt = 0; continue; }
    const y = yOf(n);
    const gap = prevBottom == null ? 0 : y - prevBottom;
    const mt = prevBottom == null ? 0 : Math.max(cfg.minGap || 8, Math.min(cfg.maxGap || 56, gap * (cfg.gapK || 0.5)));
    n.mt = n.mtFix != null ? n.mtFix : Math.round(mt);
    prevBottom = Math.max(prevBottom || 0, y + estH(n));
  }
  return { fish, flow: out };
}

function styleVars(n, rw, rx, ry, rh, pinned, fishScale) {
  const it = n.it, v = [];
  if (n.t === "fish") {
    const fm = n.fm || {};
    const s = (fm.s || fishScale || 1);
    const x = fm.x != null ? fm.x : r2(((it.x - rx) / rw) * 100);
    const y = fm.at ? `${fm.y || 0}cqw` : (fm.y != null ? fm.y : r2(((it.y - ry) / rh) * 100)) + "%";
    v.push(`--fl:${x}%`, `--ft:${y}`, `--fw:${r2((it.w / rw) * 100 * s)}`, `--fh:${r2((it.h / rw) * 100 * s)}`);
    if (it.crop) v.push(`--cx:${r2((it.crop.x / rw) * 100 * s)}`, `--cy:${r2((it.crop.y / rw) * 100 * s)}`, `--cw:${r2((it.crop.w / rw) * 100 * s)}`, `--ch:${r2((it.crop.h / rw) * 100 * s)}`);
    if (fm.hide) v.push("--fd:none");
    return v.join(";") + ";";
  }
  if (it.fs) v.push(`--fs:${it.fs}px`);
  if (it.w) v.push(`--w:${it.w}px`);
  if (it.h) v.push(`--h:${it.h}px`);
  if (pinned) {
    v.push(`--pl:${r2(((it.x + n.dx - rx) / rw) * 100)}%`, `--pt:${r2(((it.y + n.dy - ry) / rh) * 100)}%`, `--pw:${r2((it.w / rw) * 100)}%`);
    if (it.fs) v.push(`--pf:${r2((it.fs / rw) * 100)}`);
  } else v.push(`--mt:${n.mt || 0}px`);
  if (n.mfs) v.push(`--mfs:${n.mfs}px`);
  if (n.ta) v.push(`--ta:${n.ta}`);
  return v.join(";") + ";";
}

function build(container, nodes, cfg, imgUrl, secH) {
  // container: { r:[x,y,w,h] } ；nodes：元素清單
  const { fish, flow } = layout(nodes, null, cfg);
  const [rx, ry, rw, rh] = container.r;
  for (const f of fish) f.mv = styleVars(f, rw, rx, ry, rh, false, cfg.fishScale);
  const walk = (n) => {
    if (n.t === "fa") n.kids.forEach((k) => (k.mv = styleVars(k, rw, rx, ry, rh, false, cfg.fishScale)));
    if (n.t === "row") { n.mv = `--mt:${n.mt}px;`; n.kids.forEach((k) => { k.mt = 0; k.mv = styleVars(k, rw, rx, ry, rh, false); }); }
    else if (n.t === "item") n.mv = styleVars(n, rw, rx, ry, rh, false);
  };
  flow.forEach(walk);
  return { fish, flow };
}

module.exports = function mplan(s, pageCfg, home, imgDir, idx, anchors) {
  const cfg = Object.assign({}, (pageCfg && pageCfg._all) || {}, (pageCfg && pageCfg[s.key]) || {});
  const H = s.height, imgUrl = `/assets/img/${imgDir}/${s.img}`;
  // 1. 這段所有元素（自己的＋從首頁共用的頁首／頁尾）
  const all = [];
  (s.items || []).forEach((it, i) => all.push({ t: it.kind === "fish" ? "fish" : "item", it, dx: 0, dy: 0, i }));
  for (const sh of s.shared || []) for (const hs of home.sections) if (hs.key === sh.from)
    for (const it of hs.items) if ((!sh.maxY || it.y < sh.maxY) && it.kind !== "fish") all.push({ t: "item", it, dx: sh.dx || 0, dy: sh.dy || 0, shared: true });
  for (const a of anchors || []) if (a.y >= s.top && a.y < s.top + H) all.push({ t: "item", it: { kind: "anchor", id: a.id, x: 0, y: a.y - s.top }, dx: 0, dy: 0 });
  const label = (n) => textOf(n.it).slice(0, 12);
  // 每個元素的手機設定：用文字開頭或插圖檔名比對
  const per = cfg.items || {};
  for (const n of all) {
    const key = n.t === "fish" ? n.it.file : label(n);
    for (const k of Object.keys(per)) if (key && (key === k || key.startsWith(k))) {
      const c = per[k];
      if (n.t === "fish") n.fm = c;
      else { if (c.o != null) n.o = c.o; if (c.mt != null) n.mtFix = c.mt; if (c.fs) n.mfs = c.fs; if (c.hide) n.hide = true; if (c.solo) n.solo = true; if (c.ta) n.ta = c.ta; if (c.cls) n.cls = c.cls; if (c.into) n.into = c.into; }
    }
  }
  const nodes = all.filter((n) => !n.hide);
  const hidden = all.filter((n) => n.hide);
  // 2. 頁首（第一段 y < 140）
  let hdr = null;
  if (idx === 0 && !cfg.noHeader) {
    const hk = nodes.filter((n) => n.t === "item" && n.it.y + n.dy < 140);
    hk.forEach((n) => { n.taken = true; n.mv = styleVars(n, 1440, 0, 0, 140, false); });
    const crop = cfg.logoCrop || [30, 8, 330, 124];
    hdr = { t: "hdr", kids: hk, st: `--img:url(${imgUrl});--bsz:${r2((1440 / crop[2]) * 100)}% auto;--bpos:${r2((crop[0] / (1440 - crop[2])) * 100)}% ${r2((crop[1] / (H - crop[3])) * 100)}%;--ar:${crop[2]}/${crop[3]};` };
  }
  // 頁尾（全站一樣）：上面的水墨山海切一塊放滿手機寬，下面深藍底放文字
  if (s.key === "footer" && !cfg.pics) {
    const minY = Math.min(...nodes.filter((n) => n.t === "item").map((n) => n.it.y + n.dy));
    cfg.pics = [{ r: [140, 0, 1160, Math.round(minY - 24)] }];
    cfg.bg = Object.assign({ img: false, color: "#0a2f52" }, cfg.bg || {});
    cfg.pad = cfg.pad || [0, 40];
  }
  // 3. pic、box：把落在範圍裡的元素收進去
  const blocks = [];
  for (const p of cfg.pics || []) blocks.push({ t: "pic", r: p.r, o: p.o, cfg: p, kids: [] });
  for (const b of cfg.boxes || []) blocks.push({ t: "box", r: b.r, o: b.o, cfg: b, kids: [] });
  // 小的範圍優先（卡片裡的照片 → 先收進照片）
  const bySize = blocks.slice().sort((a, b) => a.r[2] * a.r[3] - b.r[2] * b.r[3]);
  for (const n of nodes) {
    if (n.taken) continue;
    const [x, y] = anchorPt(n);
    const tgt = n.into != null ? blocks[n.into] : bySize.find((b) => inside(b.r, x, y));
    if (tgt) { tgt.kids.push(n); n.taken = true; }
  }
  // pic 疊在 box 裡：照片範圍在卡片範圍內 → 照片變成卡片的子節點
  for (const p of blocks.filter((b) => b.t === "pic")) {
    const host = blocks.filter((b) => b.t === "box" && b !== p).find((b) => inside(b.r, p.r[0] + 1, p.r[1] + 1));
    if (host) { host.kids.push(p); p.nested = true; }
  }
  const secR = [0, 0, 1440, H];
  for (const b of blocks) {
    const [x, y, w, h] = b.r;
    if (b.t === "pic") {
      const pinned = b.kids;
      pinned.forEach((n) => { n.mv = n.t === "fish" ? styleVars(n, w, x, y, h, true, 1) : styleVars(n, w, x, y, h, true); });
      b.fish = pinned.filter((n) => n.t === "fish");
      b.items = pinned.filter((n) => n.t !== "fish");
      const c = b.cfg;
      b.st = `--img:url(${imgUrl});--bsz:${r2((1440 / w) * 100)}% auto;--bpos:${w >= 1440 ? 0 : r2((x / (1440 - w)) * 100)}% ${h >= H ? 0 : r2((y / (H - h)) * 100)}%;--ar:${w}/${Math.round(h)};` + (c.w ? `--pw:${c.w};` : "") + (c.fade ? `--fade:${c.fade};` : "") + (c.radius ? `--rad:${c.radius}px;` : "");
      b.cls = (c.fade ? " is-fade" : "") + (c.cls ? " " + c.cls : "");
    } else {
      const c = b.cfg;
      const r = build(b, b.kids, Object.assign({}, cfg, c.gap || {}), imgUrl, H);
      b.fish = r.fish; b.flow = r.flow;
      b.st = `--bg:${c.bg || "#fff"};` + (c.radius != null ? `--rad:${c.radius}px;` : "") + (c.pad ? `--pad:${c.pad};` : "") + (c.border ? `--bd:${c.border};` : "") + (c.shadow ? `--sh:${c.shadow};` : "");
      b.cls = (c.lines ? " has-lines" : "") + (c.cls ? " " + c.cls : "");
    }
  }
  // 4. 段落本身
  const top = nodes.filter((n) => !n.taken).concat(blocks.filter((b) => !b.nested));
  const sec = build({ r: secR }, top, cfg, imgUrl, H);
  const bg = cfg.bg || {};
  const st = (bg.img === false ? "--sbg:none;" : `--sbg:url(${imgUrl});`) + `--sbp:${bg.pos || "50% 50%"};--sbs:${bg.size || "cover"};--sbc:${bg.color || "transparent"};` +
    (cfg.pad ? `--spt:${cfg.pad[0]}px;--spb:${cfg.pad[1]}px;` : "") + (cfg.minH ? `--smh:${cfg.minH}px;` : "");
  return { hdr, fish: sec.fish, flow: sec.flow, hidden, st, cls: cfg.cls || "" };
};
