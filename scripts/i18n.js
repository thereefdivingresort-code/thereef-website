// 英文版（/en/…）：同一套版面，文字換成英文。
// 翻譯放在 src/_data/en/<頁>.json：{ t: { "資料檔路徑": [中文原文, 英文] }, style: { "元素路徑或 id": { fs: 字級倍數, w: 寬度, dy: 往下移 px, … } } }
// - toEn(頁面資料, 翻譯)：複製一份頁面資料，照路徑換成英文；站內連結（/courses/）自動改成 /en/courses/
// - 中文原文對不上（中文改過、英文沒跟著改）→ 不換，留中文，並記在 check() 的清單裡（npm test 會提醒）
"use strict";

const isInternal = (h) => typeof h === "string" && h.startsWith("/") && !h.startsWith("/assets/") && !h.startsWith("/en/");
const enHref = (h) => (isInternal(h) ? "/en" + h : h);

function getAt(obj, path) {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
function setAt(obj, path, v) {
  const ks = path.split(".");
  const last = ks.pop();
  const o = ks.reduce((o, k) => (o == null ? undefined : o[k]), obj);
  if (o != null) o[last] = v;
}

// 站內連結改成英文版：href、links[i][1]、spans[i].href、active
function rewriteLinks(x) {
  if (Array.isArray(x)) { x.forEach(rewriteLinks); return; }
  if (!x || typeof x !== "object") return;
  for (const k of Object.keys(x)) {
    const v = x[k];
    if ((k === "href" || k === "active") && typeof v === "string") x[k] = enHref(v);
    else if (k === "links" && Array.isArray(v)) v.forEach((l) => { if (Array.isArray(l)) l[1] = enHref(l[1]); });
    else rewriteLinks(v);
  }
}

const mismatches = [];
function toEn(data, tr) {
  const d = JSON.parse(JSON.stringify(data));
  if (!tr) return d;
  for (const [path, pair] of Object.entries(tr.t || {})) {
    const [zh, en] = pair;
    const cur = getAt(d, path);
    // 換行前補一個空白：手機版會把電腦版手動換的行接起來（join），英文字才不會黏在一起
    if (cur === zh) setAt(d, path, typeof en === "string" ? en.replace(/(\S)\n(?=\S)/g, "$1 \n") : en);
    else mismatches.push(path + "：現在是 " + JSON.stringify(cur) + "，翻譯檔記的是 " + JSON.stringify(zh));
  }
  // 版面微調：fs＝字級倍數（0.9＝小 10%）、其他欄位（w、x、y、lh）直接覆蓋
  const byId = {};
  (function walk(x) { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === "object") { if (typeof x.id === "string" && x.kind) byId[x.id] = x; Object.values(x).forEach(walk); } })(d);
  for (const [path, st] of Object.entries(tr.style || {})) {
    const it = path.includes(".") ? getAt(d, path) : byId[path]; // 鍵可以是路徑，或元素 id
    if (!it) { mismatches.push("style 找不到 " + path); continue; }
    for (const [k, v] of Object.entries(st)) {
      if (k === "fs") {
        it.fs = Math.round(it.fs * v * 10) / 10;
        if (it.q) it.q.fs = Math.round(it.q.fs * v * 10) / 10;
        if (it.a) it.a.fs = Math.round(it.a.fs * v * 10) / 10;
      } else if (k === "dy") it.y += v;
      else if (k === "dx") it.x += v;
      else it[k] = v;
    }
  }
  rewriteLinks(d);
  return d;
}

module.exports = { toEn, enHref, mismatches };
