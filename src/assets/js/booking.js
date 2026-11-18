/* 預訂頁第 1 步：七區塊選購（外觀照 Canva「UI v4｜預訂第 1 步：選購（七區塊）」）。
   價格全部來自 _data/prices.json（頁面內嵌）；算錢一律呼叫 pricing.js 的 ReefPricing.calc，
   跟 npm test 的自動驗算用同一份算法。這裡只負責「畫面上選了什麼 → 要算哪些品項、幾份」。
   欄位固定，客人不能自己新增列（④–⑦ 用可複選下拉，勾一項多一列）。
   PAYMENT_LIVE = false：金流還沒串（送審版）。PAYUNi 過審後改成 true，接伺服器端付款程式。 */
(function () {
  const PAYMENT_LIVE = false;
  const P = window.ReefPricing;
  const data = JSON.parse(document.getElementById("price-data").textContent);
  const I = P.index(data);
  const n = (v) => Number(v).toLocaleString("en-US");
  const fmt = (v) => "NT$ " + n(v);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const SP = "　"; // 全形空白（Canva 用來隔開文字）

  // 計數器：k＝代號、unit＝單位、def＝預設、min/max、pre＝前面的字（例：雙人）
  const C = (k, unit, def, min, max, pre) => ({ k, unit, def, min: min || 0, max: max || 30, pre });
  const per = (id, u) => n(I[id].price) + "／" + (u || I[id].unit);

  // 每一列：
  //   label（固定文字）或 variants＝[[代號, 下拉選項文字, 畫面顯示文字]]
  //   price(v)＝第二欄的單價（只有一個計數器的列）；兩個計數器的列，單價寫在 label 裡（照 Canva）
  //   counters、lines(v, c)＝要算的品項與份數（a、b 照 pricing.js 的定義）
  const BLOCKS = [
    {
      key: "dive", title: "①" + SP + "潛水", sum: "潛水",
      intro: "體驗潛水不用證照；Fun Dive 需有證照，系統依人數自動套用 1 對 1～1 對 4 價。",
      note: () => "Fun Dive 下拉：岸潛（每人每支，要選支數）／船潛（一趟約 2 支，不用選支數）。已含輕重裝備。",
      rows: [
        { key: "dsd", label: "體驗潛水（不用證照）", price: () => per("dsd"),
          counters: [C("p", "人", 0)],
          lines: (v, c) => [{ id: "dsd", a: 0, b: c.p }] },
        { key: "fun",
          variants: [["fun-shore", "Fun Dive 岸潛（有證照）", "Fun Dive 岸潛（有證照）" + SP + "▾"], ["fun-boat", "Fun Dive 船潛（有證照）", "Fun Dive 船潛（有證照）" + SP + "▾"]],
          counters: [C("t", "支", 1, 1, 20), C("p", "人", 0)],
          unitOf: (v, k) => (k === "t" ? (v === "fun-boat" ? "趟" : "支") : null),
          lines: (v, c) => [{ id: v, a: c.p, b: c.t }] },
      ],
    },
    {
      key: "course", title: "②" + SP + "考證照與進階課程", sum: "考證照與進階課程",
      intro: "下拉：OW 初級／AOW 進階／OW＋AOW 一次考／複習／高氧 EAN／EFR／救援／潛水長 DM",
      rows: [
        { key: "course",
          variants: [["", "請選擇課程", "請選擇課程" + SP + "▾"]].concat(["ow", "aow", "ow-aow", "reactive", "ean", "efr", "rescue", "dm"].map((id) => [id, I[id].name, I[id].name + SP + "▾"])),
          price: (v) => (v ? per(v) : "—"),
          counters: [C("p", "人", 1, 1)],
          lines: (v, c) => (v ? [{ id: v, a: 0, b: c.p }] : []) },
      ],
    },
    {
      key: "pkg", title: "③" + SP + "3 天 2 夜套裝", sum: "3 天 2 夜套裝＋升等",
      intro: "船票、機車、住宿都包好。下拉：夏日浮潛／夏日體驗潛水／夏日 Fun Dive。",
      note: (v) => {
        const ids = v ? [v] : ["pkg-snorkel", "pkg-dsd", "pkg-fun"];
        const p = ids.map((id) => (v ? "" : I[id].name.replace("夏日", "").replace("套裝", "") + " ") + "雙人每人 " + n(I[id].price) + "、單人 " + n(I[id].single)).join("；");
        return p + "（已含單人加價）；3 人＝1 組雙人＋1 位單人。升等每人加價。";
      },
      rows: [
        { key: "pkg",
          variants: [["", "請選擇套裝", "請選擇套裝" + SP + "▾"], ["pkg-snorkel", "夏日浮潛套裝", "夏日浮潛套裝" + SP + "▾"], ["pkg-dsd", "夏日體驗潛水套裝", "夏日體驗潛水套裝" + SP + "▾"], ["pkg-fun", "夏日 Fun Dive 套裝", "夏日 Fun Dive 套裝" + SP + "▾"]],
          counters: [C("pair", "組", 0, 0, 15, "雙人"), C("single", "位", 0, 0, 15, "單人")],
          upgrade: true,
          lines: (v, c) => {
            if (!v) return [];
            const out = [{ id: v, a: c.pair, b: c.single }];
            const ppl = c.pair * 2 + c.single;
            if (c.up && ppl) out.push({ id: v.replace("pkg-", "up-"), a: 0, b: ppl, up: true });
            return out;
          } },
      ],
    },
    {
      key: "act", title: "④" + SP + "活動（可複選）", sum: "活動", multi: true,
      intro: "打開下拉勾選想參加的活動，每勾一項就多一列填人數；取消勾選就移除。",
      note: () => "可選（每人）：" + ["tidal", "snorkel", "glassboat", "fishing", "bluecave", "sup1", "sup2"].map((id) => shortName(id) + " " + n(I[id].price)).join("、"),
      rows: ["tidal", "snorkel", "glassboat", "fishing", "bluecave", "sup1", "sup2"].map((id) => ({
        key: id, label: I[id].name, short: shortName(id), price: () => per(id),
        counters: [C("p", "人", 1, 1)],
        lines: (v, c) => [{ id, a: 0, b: c.p }] })),
    },
    {
      key: "stay", title: "⑤" + SP + "住宿・每晚（可複選）", sum: "住宿", multi: true,
      intro: "勾選房型後填間數（床數）和晚數。",
      note: () => "可選（每晚）：豪華雙人房 " + n(I["room-double"].price) + "、豪華四人房 " + n(I["room-quad"].price) + "、背包客房 " + n(I["bed-backpacker"].price) + "／床。\n" +
        "豪華四人房可加床位，" + n(I["room-quad-extra"].price) + "／人，最多住 6 人。",
      rows: [
        { key: "room-double", short: "豪華雙人房", label: "豪華雙人房" + SP + n(I["room-double"].price) + "／晚",
          counters: [C("r", "間", 1, 1), C("d", "晚", 1, 1)],
          lines: (v, c) => [{ id: "room-double", a: 0, b: c.r * c.d }] },
        { key: "room-quad", short: "豪華四人房", label: "豪華四人房" + SP + n(I["room-quad"].price) + "／晚",
          counters: [C("r", "間", 1, 1), C("d", "晚", 1, 1)],
          // 加床（第 5、6 位）：另一列，晚數跟四人房同一個；每間最多加 2 位
          extra: { key: "room-quad-extra", label: "四人房加床（第 5、6 位）", price: () => n(I["room-quad-extra"].price) + "／人・晚", counter: C("x", "位", 0, 0, 2) },
          maxOf: (k, c) => (k === "x" ? c.r * 2 : null),
          lines: (v, c) => [{ id: "room-quad", a: 0, b: c.r * c.d }, { id: "room-quad-extra", a: 0, b: c.x * c.d, extra: true }] },
        { key: "bed-backpacker", short: "背包客房", label: "背包客房" + SP + n(I["bed-backpacker"].price) + "／床",
          counters: [C("r", "床", 1, 1), C("d", "晚", 1, 1)],
          lines: (v, c) => [{ id: "bed-backpacker", a: 0, b: c.r * c.d }] },
      ],
    },
    {
      key: "trans", title: "⑥" + SP + "交通・船票（可複選）", sum: "交通・船票", multi: true,
      intro: "船票選來回或單程；車輛填台數和天數。",
      note: () => "可選：船票（來回 " + n(I["ferry-rt"].price) + "／單程 " + n(I["ferry-ow"].price) + "）、摩托車、電動自行車、五人座汽車、八人座汽車",
      rows: [
        { key: "ferry", short: "船票",
          variants: [["ferry-rt", "船票（來回）", "船票（來回" + SP + "▾）"], ["ferry-ow", "船票（單程）", "船票（單程" + SP + "▾）"]],
          price: (v) => per(v), counters: [C("p", "人", 1, 1)],
          lines: (v, c) => [{ id: v, a: 0, b: c.p }] },
      ].concat(["scooter", "ebike", "car5", "car8"].map((id) => ({
        key: id, short: I[id].name, label: I[id].name + SP + n(I[id].price) + "／天",
        counters: [C("q", "台", 1, 1), C("d", "天", 1, 1)],
        lines: (v, c) => [{ id, a: 0, b: c.q * c.d }] }))),
    },
    {
      key: "gear", title: "⑦" + SP + "裝備租借（可複選）", sum: "裝備租借", multi: true,
      intro: "Fun Dive 已含輕重裝備，不用另租。",
      note: () => "可選：輕裝 " + n(I["gear-light"].price) + "／日、重裝 " + n(I["gear-heavy-half"].price) + " 半日／" + n(I["gear-heavy-full"].price) + " 全日\n" +
        "全套輕重裝 " + n(I["gear-full-half"].price) + " 半日／" + n(I["gear-full-full"].price) + " 全日、潛水電腦錶 " + n(I["gear-computer-half"].price) + " 半日／" + n(I["gear-computer-full"].price) + " 全日",
      rows: [
        { key: "gear-light", short: "輕裝", label: "輕裝" + SP + n(I["gear-light"].price) + "／天",
          counters: [C("q", "套", 1, 1), C("d", "天", 1, 1)],
          lines: (v, c) => [{ id: "gear-light", a: 0, b: c.q * c.d }] },
      ].concat([["heavy", "重裝"], ["full", "全套輕重裝"], ["computer", "潛水電腦錶"]].map(([k, name]) => ({
        key: "gear-" + k, short: name,
        variants: [["gear-" + k + "-full", name + "（全天）", name + "（全天" + SP + "▾）"], ["gear-" + k + "-half", name + "（半天）", name + "（半天" + SP + "▾）"]],
        counters: [C("q", k === "computer" ? "支" : "套", 1, 1), C("d", "天", 1, 1)],
        unitOf: (v, kk) => (kk === "d" ? (v.endsWith("half") ? "次" : "天") : null),
        lines: (v, c) => [{ id: v, a: 0, b: c.q * c.d }] }))),
    },
  ];
  function shortName(id) { return { sup1: "SUP 單人板", sup2: "SUP 雙人板" }[id] || I[id].name; }

  // ---------- 畫面 ----------
  const root = document.getElementById("bk-blocks");
  const ctrHtml = (c) =>
    '<span class="ctr" data-k="' + c.k + '" data-min="' + c.min + '" data-max="' + c.max + '">' +
    '<button type="button" class="c-btn" data-d="-1" aria-label="減少">−</button>' +
    (c.pre ? "<b>" + c.pre + "</b>" : "") +
    '<input type="number" inputmode="numeric" value="' + c.def + '" min="' + c.min + '" max="' + c.max + '" aria-label="' + (c.pre || "") + c.unit + '數">' +
    "<em>" + c.unit + "</em>" +
    '<button type="button" class="c-btn" data-d="1" aria-label="增加">＋</button></span>';

  function itemHtml(r) {
    if (!r.variants) return '<span class="bk-item">' + esc(r.label) + "</span>";
    return '<span class="bk-item"><span class="bk-shown">' + esc(r.variants[0][2]) + "</span>" +
      '<select id="sel-' + r.key + '" aria-label="' + esc(r.short || r.variants[0][1]) + '">' +
      r.variants.map(([v, t]) => '<option value="' + v + '">' + esc(t) + "</option>").join("") + "</select></span>";
  }
  function rowHtml(b, r) {
    let h = '<div class="bk-row" data-block="' + b.key + '" data-row="' + r.key + '"' + (b.multi ? " hidden" : "") + ">" + itemHtml(r);
    if (r.counters.length === 1) h += '<span class="bk-price"></span>';
    h += r.counters.map(ctrHtml).join("") + '<span class="bk-sub">0</span></div>';
    if (r.extra) {
      h += '<div class="bk-row bk-extra" data-block="' + b.key + '" data-row="' + r.key + '" data-extra hidden>' +
        '<span class="bk-item">' + esc(r.extra.label) + '</span><span class="bk-price">' + esc(r.extra.price()) + "</span>" +
        ctrHtml(r.extra.counter) + '<span class="bk-sub">0</span></div>';
    }
    if (r.upgrade) {
      h += '<div class="bk-upline" data-block="' + b.key + '"><label class="is-off"><input type="checkbox" class="bk-check" data-k="up" disabled><span>升等雙人套房（先選套裝）</span></label><span class="bk-sub">0</span></div>';
    }
    return h;
  }

  root.innerHTML = BLOCKS.map((b) => {
    let h = '<section class="bk-card' + (b.multi ? " bk-multi" : "") + (b.note ? "" : " no-note") + '" data-block="' + b.key + '">' +
      '<h2 class="bk-title">' + esc(b.title) + '</h2><p class="bk-intro">' + esc(b.intro) + '</p><div class="bk-rows">';
    if (b.multi) {
      h += '<details class="bk-ms"><summary>請選擇（可複選）' + SP + "▾</summary><div class=\"bk-ms-list\">" +
        b.rows.map((r) => '<label><input type="checkbox" class="bk-check" value="' + r.key + '">' + esc(r.short || r.label) + "</label>").join("") + "</div></details>";
    }
    h += b.rows.map((r) => rowHtml(b, r)).join("") + "</div>";
    if (b.note) h += '<p class="bk-note"></p>';
    return h + "</section>";
  }).join("");

  const rowEl = (b, r) => root.querySelector('.bk-row[data-block="' + b.key + '"][data-row="' + r.key + '"]:not([data-extra])');
  const extraEl = (b, r) => root.querySelector('.bk-row[data-block="' + b.key + '"][data-row="' + r.key + '"][data-extra]');

  // 讀一列（含加床列、升等勾選）的選擇；數量超出範圍時拉回範圍內
  function readCtrs(els, r, v, c) {
    els.forEach((el) => el.querySelectorAll(".ctr").forEach((ct) => {
      const k = ct.dataset.k, inp = ct.querySelector("input");
      let max = Number(ct.dataset.max);
      if (r.maxOf) { const m = r.maxOf(k, c); if (m != null) max = m; }
      let val = Math.round(Number(inp.value) || 0);
      val = Math.min(Math.max(val, Number(ct.dataset.min)), max);
      if (String(val) !== inp.value) inp.value = val;
      c[k] = val;
      if (r.unitOf) { const u = r.unitOf(v, k); if (u) ct.querySelector("em").textContent = u; }
    }));
  }

  function update() {
    let total = 0;
    const lines = [], sums = [];
    BLOCKS.forEach((b) => {
      let bsum = 0;
      const sec = root.querySelector('.bk-card[data-block="' + b.key + '"]');
      const chosen = [];
      let noteV = null;
      b.rows.forEach((r) => {
        const el = rowEl(b, r), ex = r.extra ? extraEl(b, r) : null;
        if (b.multi) {
          const on = sec.querySelector('.bk-ms-list input[value="' + r.key + '"]').checked;
          el.hidden = !on;
          if (ex) ex.hidden = !on;
          if (!on) return;
          chosen.push(r.short || r.label);
        }
        const sel = el.querySelector("select");
        const v = sel ? sel.value : null;
        if (sel) el.querySelector(".bk-shown").textContent = r.variants.find((x) => x[0] === v)[2];
        const c = {};
        readCtrs(ex ? [el, ex] : [el], r, v, c);
        if (r.upgrade) {
          const up = sec.querySelector(".bk-upline"), cb = up.querySelector("input");
          cb.disabled = !v;
          if (!v) cb.checked = false;
          c.up = cb.checked;
          up.querySelector("label").classList.toggle("is-off", !v);
          up.querySelector("label span").textContent = v
            ? "升等雙人套房" + SP + "每人 +" + n(I[v.replace("pkg-", "up-")].price) + " × " + (c.pair * 2 + c.single) + " 人"
            : "升等雙人套房（先選套裝）";
          noteV = v;
        }
        if (r.price) el.querySelector(".bk-price").textContent = r.price(v, c);
        let main = 0, extra = 0, upSum = 0;
        r.lines(v, c).forEach((L) => {
          const s = P.calc(I[L.id], L.a, L.b);
          if (L.extra) extra += s; else if (L.up) upSum += s; else main += s;
          if (s > 0) lines.push({ block: b.key, id: L.id, a: L.a, b: L.b, sub: s });
        });
        el.querySelector(".bk-sub").textContent = n(main);
        if (ex) ex.querySelector(".bk-sub").textContent = n(extra);
        if (r.upgrade) sec.querySelector(".bk-upline .bk-sub").textContent = n(upSum);
        bsum += main + extra + upSum;
      });
      if (b.multi) sec.querySelector(".bk-ms summary").textContent = (chosen.length ? "已選 " + chosen.length + " 項：" + chosen.join("、") : "請選擇（可複選）") + SP + SP + SP + "▾";
      if (b.note) sec.querySelector(".bk-note").textContent = b.note(noteV);
      sums.push([b.sum, bsum, b.key]);
      total += bsum;
    });
    document.getElementById("cart-total").textContent = fmt(total);
    document.getElementById("sum-total").textContent = fmt(total);
    document.getElementById("sum-lines").innerHTML = sums.map(([t, s, k]) =>
      '<li data-sum="' + k + '"><span>' + esc(t) + "</span><b>" + (s ? fmt(s) : "—") + "</b></li>").join("");
    const d = document.getElementById("bk-date").value;
    document.getElementById("sum-date").textContent = d
      ? d.replace(/-/g, " / ") + "（" + "日一二三四五六"[new Date(d + "T00:00").getDay()] + "）出發"
      : "尚未選日期";
    window.__reefOrder = { total, lines }; // 金流上線後送到伺服器重新驗算（伺服器要用 pricing.js 再算一次）
    return { total, count: lines.length };
  }

  root.addEventListener("click", (e) => {
    const btn = e.target.closest(".c-btn");
    if (!btn) return;
    const inp = btn.parentElement.querySelector("input");
    inp.value = (Number(inp.value) || 0) + Number(btn.dataset.d);
    update();
  });
  // 取消勾選＝移除那一列：數量、下拉都回到預設，再勾回來是新的一列（不會留著上次填的數字）
  root.addEventListener("change", (e) => {
    const cb = e.target.closest(".bk-ms-list input");
    if (cb && !cb.checked) {
      root.querySelectorAll('.bk-row[data-row="' + cb.value + '"]').forEach((el) => {
        el.querySelectorAll(".ctr input").forEach((inp) => { inp.value = inp.defaultValue; });
        const sel = el.querySelector("select");
        if (sel) sel.selectedIndex = 0;
      });
    }
    update();
  });
  root.addEventListener("input", update);
  document.getElementById("bk-date").addEventListener("change", update);
  // 點下拉外面就收起來
  document.addEventListener("click", (e) => root.querySelectorAll("details.bk-ms[open]").forEach((d) => { if (!d.contains(e.target)) d.open = false; }));

  // 各頁「預訂」按鈕：網址帶 ?item=代號，自動帶入那個項目（人數等預設 1）
  (function prefill(id) {
    if (!id || !I[id]) return;
    const q = (s) => root.querySelector(s);
    const set = (sel, val) => { const el = q(sel); if (el) el.value = val; };
    const tick = (key) => { const cb = q('.bk-ms-list input[value="' + key + '"]'); if (cb) cb.checked = true; return cb; };
    let block = null;
    if (id === "dsd") { set('[data-row="dsd"] .ctr[data-k="p"] input', 1); block = "dive"; }
    else if (id === "fun-shore" || id === "fun-boat") { set("#sel-fun", id); set('[data-row="fun"] .ctr[data-k="p"] input', 1); block = "dive"; }
    else if (q('#sel-course option[value="' + id + '"]')) { set("#sel-course", id); block = "course"; }
    else if (id.startsWith("pkg-") || id.startsWith("up-")) {
      set("#sel-pkg", id.replace("up-", "pkg-")); set('[data-row="pkg"] .ctr[data-k="pair"] input', 1);
      update(); // 選了套裝，升等才能勾
      if (id.startsWith("up-")) q('.bk-upline input[data-k="up"]').checked = true;
      block = "pkg";
    }
    else if (id.startsWith("ferry-")) { tick("ferry"); set("#sel-ferry", id); block = "trans"; }
    else if (/^gear-(heavy|full|computer)-/.test(id)) { tick(id.replace(/-(half|full)$/, "")); set("#sel-" + id.replace(/-(half|full)$/, ""), id); block = "gear"; }
    else if (id === "room-quad-extra") { tick("room-quad"); set('[data-row="room-quad"][data-extra] .ctr[data-k="x"] input', 1); block = "stay"; }
    else { const cb = tick(id); if (cb) block = cb.closest(".bk-card").dataset.block; }
    if (block) {
      const card = q('.bk-card[data-block="' + block + '"]');
      requestAnimationFrame(() => card.scrollIntoView({ block: "start" }));
    }
  })(new URLSearchParams(location.search).get("item"));
  update();

  // 「下一步：填資料」：至少選一個項目才往下
  const form = document.getElementById("booking-form");
  const pickMsg = form.querySelector(".bk-pick-msg");
  document.querySelectorAll("[data-next]").forEach((b) => b.addEventListener("click", () => {
    const { count } = update();
    if (!count) { pickMsg.textContent = "請至少選一個項目，人數或數量要大於 0。"; pickMsg.scrollIntoView({ block: "center" }); return; }
    pickMsg.textContent = "";
    document.getElementById("bk-step2").scrollIntoView({ behavior: "smooth", block: "start" });
  }));

  // 新增參加者：每位都要姓名和出生年月日
  let people = 1;
  document.getElementById("add-person").addEventListener("click", () => {
    people++;
    const box = document.createElement("div");
    box.className = "bk-fields";
    box.innerHTML =
      '<label class="bk-field"><span>參加者 ' + people + ' 姓名</span><input name="p' + people + '_name" required></label>' +
      '<label class="bk-field"><span>出生年月日</span><input name="p' + people + '_birthday" type="date" required></label>';
    document.getElementById("participants").appendChild(box);
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = document.getElementById("form-msg");
    const { count } = update();
    if (!count) { msg.textContent = "請至少選一個項目。"; return; }
    if (!form.checkValidity() || !document.getElementById("bk-date").checkValidity()) {
      form.reportValidity();
      if (!document.getElementById("bk-date").value) document.getElementById("bk-date").reportValidity();
      msg.textContent = "還有欄位沒填（含出發日期），或條款還沒勾選。";
      return;
    }
    if (!PAYMENT_LIVE) {
      msg.innerHTML = "線上付款正在開通中。請先打 <a href=\"tel:+886936871525\">0936-871-525</a> 預訂，我們會幫你保留名額。";
      return;
    }
    // submitOrder(form) — 金流上線後接到伺服器端產生 PAYUNi 付款單（伺服器要用 pricing.js 重算一次總價）
  });
})();