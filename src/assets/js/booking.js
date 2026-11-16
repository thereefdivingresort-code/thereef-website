/* 預訂頁第 1 步：七區塊選購（依 Canva「UI v4｜預訂第 1 步：選購（七區塊）」）。
   價格全部來自 _data/prices.json（頁面內嵌）；算錢一律呼叫 pricing.js 的 ReefPricing.calc，
   跟 npm test 的自動驗算用同一份算法。欄位固定，客人不能自己新增列。
   PAYMENT_LIVE = false：金流還沒串（送審版）。PAYUNi 過審後改成 true，接伺服器端付款程式。 */
(function () {
  const PAYMENT_LIVE = false;
  const P = window.ReefPricing;
  const data = JSON.parse(document.getElementById("price-data").textContent);
  const I = P.index(data);
  const n = (v) => Number(v).toLocaleString("en-US");
  const fmt = (v) => "NT$ " + n(v);
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  // ---------- 區塊設定 ----------
  // 每一列：label、價格說明 price()、選項 variants（下拉）、計數器 counters、算錢 lines(v, c)
  // c＝計數器的值；v＝下拉選到的項目代號
  const C = (k, unit, def, min, max) => ({ k, unit, def, min: min || 0, max: max || 30 });
  const per = (id) => n(I[id].price) + "／" + I[id].unit;

  const BLOCKS = [
    {
      key: "dive", title: "潛水", multi: false,
      intro: "體驗潛水不用證照；Fun Dive 需要證照，系統依人數自動套用 1 對 1～1 對 4 的每人價。",
      rows: [
        { key: "dsd", label: "體驗潛水（不用證照）", price: () => per("dsd"),
          counters: [C("p", "人", 0)],
          lines: (v, c) => [{ id: "dsd", a: 0, b: c.p, desc: "體驗潛水 " + c.p + " 人" }] },
        { key: "fun", label: "Fun Dive（有證照）",
          variants: [["fun-shore", "岸潛"], ["fun-boat", "船潛"]],
          price: (v, c) => n(P.unitFor(I[v], c.p || 1)) + "／人",
          counters: [C("t", "支", 1, 1, 20), C("p", "人", 0)],
          unitOf: (v, k) => (k === "t" ? (v === "fun-boat" ? "趟" : "支") : null),
          lines: (v, c) => [{ id: v, a: c.p, b: c.t,
            desc: (v === "fun-boat" ? "Fun Dive 船潛 " : "Fun Dive 岸潛 ") + c.p + " 人 × " + c.t + (v === "fun-boat" ? " 趟" : " 支") }] },
      ],
      note: () => "Fun Dive 每人價（1／2／3／4 人以上）：岸潛每支 " + I["fun-shore"].tiers.map(n).join("／") +
        "；船潛每趟（通常含 2 支，多趟沒有優惠）" + I["fun-boat"].tiers.map(n).join("／") + "。已含輕重裝備。",
    },
    {
      key: "course", title: "考證照與進階課程", multi: false,
      intro: "下拉選課程，再填人數。",
      rows: [
        { key: "course", label: "課程",
          variants: [["", "不選課程"]].concat(data.groups.find((g) => g.items.some((i) => i.id === "ow")).items.map((i) => [i.id, i.name])),
          price: (v) => (v ? per(v) : "—"),
          counters: [C("p", "人", 1, 1)],
          lines: (v, c) => (v ? [{ id: v, a: 0, b: c.p, desc: I[v].name + " " + c.p + " 人" }] : []) },
      ],
    },
    {
      key: "pkg", title: "3 天 2 夜套裝", multi: false,
      intro: "船票、機車、住宿都包好。2 人一組用雙人價；落單的 1 位用單人價（3 人＝1 組雙人＋1 位單人）。",
      rows: [
        { key: "pkg", label: "套裝",
          variants: [["", "不選套裝"], ["pkg-snorkel", "夏日浮潛套裝"], ["pkg-dsd", "夏日體驗潛水套裝"], ["pkg-fun", "夏日 Fun Dive 套裝"]],
          price: (v) => (v ? "雙人 " + n(I[v].price) + "／單人 " + n(I[v].single) : "—"),
          counters: [C("pair", "組雙人", 0, 0, 15), C("single", "位單人", 0, 0, 15)],
          check: { k: "up", label: (v, c) => (v ? "升等雙人套房　每人 +" + n(I[v.replace("pkg-", "up-")].price) + " × " + (c.pair * 2 + c.single) + " 人" : "升等雙人套房（先選套裝）") },
          lines: (v, c) => {
            if (!v) return [];
            const out = [{ id: v, a: c.pair, b: c.single, desc: I[v].name + " 雙人 " + c.pair + " 組＋單人 " + c.single + " 位" }];
            const ppl = c.pair * 2 + c.single;
            if (c.up && ppl) out.push({ id: v.replace("pkg-", "up-"), a: 0, b: ppl, desc: "升等雙人套房 " + ppl + " 人" });
            return out;
          } },
      ],
    },
    {
      key: "act", title: "活動", multi: true,
      rows: ["tidal", "snorkel", "glassboat", "fishing", "bluecave", "sup1", "sup2"].map((id) => ({
        key: id, label: I[id].name, price: () => per(id),
        counters: [C("p", "人", 1, 1)],
        lines: (v, c) => [{ id, a: 0, b: c.p, desc: I[id].name + " " + c.p + " 人" }] })),
    },
    {
      key: "stay", title: "住宿・每晚", multi: true,
      rows: [
        { key: "room-double", label: "豪華雙人房", price: () => n(I["room-double"].price) + "／晚",
          counters: [C("r", "間", 1, 1), C("d", "晚", 1, 1)],
          lines: (v, c) => [{ id: "room-double", a: 0, b: c.r * c.d, desc: "豪華雙人房 " + c.r + " 間 × " + c.d + " 晚" }] },
        { key: "room-quad", label: "豪華四人房", price: () => n(I["room-quad"].price) + "／晚",
          counters: [C("r", "間", 1, 1), C("d", "晚", 1, 1), C("x", "位加床", 0, 0, 2)],
          maxOf: (k, c) => (k === "x" ? c.r * 2 : null),
          lines: (v, c) => {
            const out = [{ id: "room-quad", a: 0, b: c.r * c.d, desc: "豪華四人房 " + c.r + " 間 × " + c.d + " 晚" }];
            if (c.x) out.push({ id: "room-quad-extra", a: 0, b: c.x * c.d, desc: "四人房加床 " + c.x + " 位 × " + c.d + " 晚" });
            return out;
          } },
        { key: "bed-backpacker", label: "背包客房", price: () => n(I["bed-backpacker"].price) + "／床・晚",
          counters: [C("r", "床", 1, 1), C("d", "晚", 1, 1)],
          lines: (v, c) => [{ id: "bed-backpacker", a: 0, b: c.r * c.d, desc: "背包客房 " + c.r + " 床 × " + c.d + " 晚" }] },
      ],
      note: () => "豪華四人房可加床，" + n(I["room-quad-extra"].price) + "／人・晚，每間最多住 6 人。",
    },
    {
      key: "trans", title: "交通・船票", multi: true,
      rows: [
        { key: "ferry", label: "船票", variants: [["ferry-rt", "來回"], ["ferry-ow", "單程"]],
          price: (v) => per(v), counters: [C("p", "人", 1, 1)],
          lines: (v, c) => [{ id: v, a: 0, b: c.p, desc: I[v].name + " " + c.p + " 人" }] },
      ].concat(["scooter", "ebike", "car5", "car8"].map((id) => ({
        key: id, label: I[id].name, price: () => n(I[id].price) + "／天",
        counters: [C("q", "台", 1, 1), C("d", "天", 1, 1)],
        lines: (v, c) => [{ id, a: 0, b: c.q * c.d, desc: I[id].name + " " + c.q + " 台 × " + c.d + " 天" }] }))),
      note: () => "可選：船票（來回 " + n(I["ferry-rt"].price) + "／單程 " + n(I["ferry-ow"].price) + "，每人）、" +
        ["scooter", "ebike", "car5", "car8"].map((id) => I[id].name + " " + n(I[id].price)).join("、") + "（每台每天）",
    },
    {
      key: "gear", title: "裝備租借", multi: true,
      intro: "Fun Dive 已含輕重裝備，不用另租。",
      rows: [
        { key: "gear-light", label: "輕裝（面鏡、呼吸管、防寒衣、套鞋、蛙鞋）", price: () => n(I["gear-light"].price) + "／日",
          counters: [C("q", "套", 1, 1), C("d", "日", 1, 1)],
          lines: (v, c) => [{ id: "gear-light", a: 0, b: c.q * c.d, desc: "輕裝 " + c.q + " 套 × " + c.d + " 日" }] },
      ].concat([["heavy", "重裝（BCD、調節器、鉛塊）", "重裝"], ["full", "全套輕重裝", "全套輕重裝"], ["computer", "潛水電腦錶", "潛水電腦錶"]].map(([k, label, short]) => ({
        key: "gear-" + k, label, variants: [["gear-" + k + "-full", "全日"], ["gear-" + k + "-half", "半日"]],
        price: (v) => n(I[v].price) + "／" + (v.endsWith("half") ? "半日" : "日"),
        counters: [C("q", k === "computer" ? "支" : "套", 1, 1), C("d", "日", 1, 1)],
        unitOf: (v, kk) => (kk === "d" ? (v.endsWith("half") ? "次" : "日") : null),
        lines: (v, c) => [{ id: v, a: 0, b: c.q * c.d,
          desc: short + (v.endsWith("half") ? " 半日 " : " 全日 ") + c.q + (k === "computer" ? " 支 × " : " 套 × ") + c.d + (v.endsWith("half") ? " 次" : " 日") }] }))),
      note: () => "輕裝 " + n(I["gear-light"].price) + "／日；重裝 " + n(I["gear-heavy-half"].price) + " 半日／" + n(I["gear-heavy-full"].price) +
        " 全日；全套輕重裝 " + n(I["gear-full-half"].price) + " 半日／" + n(I["gear-full-full"].price) + " 全日；潛水電腦錶 " +
        n(I["gear-computer-half"].price) + " 半日／" + n(I["gear-computer-full"].price) + " 全日。",
    },
  ];
  // 多選區塊的「可選」說明（含價格）
  BLOCKS.forEach((b) => {
    if (b.multi && !b.note) b.note = () => "可選（每人）：" + b.rows.map((r) => r.label + " " + n(I[r.key].price)).join("、");
  });

  // ---------- 畫面 ----------
  const root = document.getElementById("bk-blocks");
  const ctrHtml = (c) =>
    '<span class="ctr" data-k="' + c.k + '" data-min="' + c.min + '" data-max="' + c.max + '">' +
    '<button type="button" class="c-btn" data-d="-1" aria-label="減少">−</button>' +
    '<input type="number" inputmode="numeric" value="' + c.def + '" min="' + c.min + '" max="' + c.max + '" aria-label="' + c.unit + '">' +
    '<em>' + c.unit + "</em>" +
    '<button type="button" class="c-btn" data-d="1" aria-label="增加">＋</button></span>';

  function rowHtml(b, r) {
    let h = '<div class="bk-row" data-block="' + b.key + '" data-row="' + r.key + '"' + (b.multi ? " hidden" : "") + ">";
    h += '<div class="bk-item">';
    if (r.variants) {
      h += '<label class="sr-only" for="sel-' + r.key + '">' + esc(r.label) + "</label>";
      h += (r.label && r.key !== "course" && r.key !== "pkg" ? '<span class="bk-label">' + esc(r.label) + "</span>" : "");
      h += '<select id="sel-' + r.key + '">' + r.variants.map(([v, t]) => '<option value="' + v + '">' + esc(t) + "</option>").join("") + "</select>";
    } else h += '<span class="bk-label">' + esc(r.label) + "</span>";
    h += '</div><span class="bk-price"></span><span class="bk-ctrs">' + r.counters.map(ctrHtml).join("") + "</span>";
    h += '<span class="bk-sub">0</span>';
    if (r.check) h += '<label class="bk-check"><input type="checkbox" data-k="' + r.check.k + '"> <span></span></label>';
    return h + "</div>";
  }

  root.innerHTML = BLOCKS.map((b, i) => {
    let h = '<section class="bk-block" data-block="' + b.key + '"><h3><span class="bk-no">' + "①②③④⑤⑥⑦"[i] + "</span>" + esc(b.title) + (b.multi ? "（可複選）" : "") + "</h3>";
    if (b.intro) h += '<p class="small muted">' + esc(b.intro) + "</p>";
    if (b.multi) {
      h += '<details class="ms"><summary><span class="ms-text">請選擇（可複選）</span></summary><div class="ms-list">' +
        b.rows.map((r) => '<label><input type="checkbox" value="' + r.key + '"> ' + esc(r.label) + "</label>").join("") + "</div></details>";
    }
    h += b.rows.map((r) => rowHtml(b, r)).join("");
    if (b.note) h += '<p class="small muted bk-note">' + esc(b.note()) + "</p>";
    return h + '<p class="bk-block-sub">小計　<strong>NT$ 0</strong></p></section>';
  }).join("");

  const find = (b, r) => root.querySelector('.bk-row[data-block="' + b.key + '"][data-row="' + r.key + '"]');

  function readRow(b, r, el) {
    const v = r.variants ? el.querySelector("select").value : null;
    const c = {};
    el.querySelectorAll(".ctr").forEach((ct) => {
      const k = ct.dataset.k, inp = ct.querySelector("input");
      let max = Number(ct.dataset.max);
      if (r.maxOf) { const m = r.maxOf(k, c); if (m != null) max = m; }
      let val = Math.round(Number(inp.value) || 0);
      val = Math.min(Math.max(val, Number(ct.dataset.min)), max);
      inp.value = val; c[k] = val;
      if (r.unitOf) { const u = r.unitOf(v, k); if (u) ct.querySelector("em").textContent = u; }
    });
    if (r.check) { const cb = el.querySelector(".bk-check input"); cb.disabled = !v; if (!v) cb.checked = false; c[r.check.k] = cb.checked; el.querySelector(".bk-check span").textContent = r.check.label(v, c); }
    return { v, c };
  }

  function update() {
    let total = 0;
    const sums = [], lines = [];
    BLOCKS.forEach((b) => {
      let bsum = 0;
      const sec = root.querySelector('.bk-block[data-block="' + b.key + '"]');
      const chosen = [];
      b.rows.forEach((r) => {
        const el = find(b, r);
        if (b.multi) {
          const on = sec.querySelector('.ms-list input[value="' + r.key + '"]').checked;
          el.hidden = !on;
          if (!on) return;
          chosen.push(r.label.replace(/（.*）/, ""));
        }
        const { v, c } = readRow(b, r, el);
        el.querySelector(".bk-price").textContent = r.price(v, c);
        let rsum = 0;
        r.lines(v, c).forEach((L) => {
          const s = P.calc(I[L.id], L.a, L.b);
          if (s > 0) { rsum += s; lines.push({ id: L.id, a: L.a, b: L.b, desc: L.desc, sub: s }); }
        });
        el.querySelector(".bk-sub").textContent = n(rsum);
        bsum += rsum;
      });
      if (b.multi) sec.querySelector(".ms-text").textContent = chosen.length ? "已選 " + chosen.length + " 項：" + chosen.join("、") : "請選擇（可複選）";
      sec.querySelector(".bk-block-sub strong").textContent = fmt(bsum);
      if (bsum) sums.push([b.title, bsum]);
      total += bsum;
    });
    document.getElementById("cart-total").textContent = fmt(total);
    document.getElementById("sum-total").textContent = fmt(total);
    document.getElementById("sum-lines").innerHTML = sums.map(([t, s]) => "<li><span>" + esc(t) + "</span><span>" + fmt(s) + "</span></li>").join("") +
      (lines.length ? '<li class="sum-detail">' + lines.map((L) => esc(L.desc) + "　" + n(L.sub)).join("<br>") + "</li>" : "");
    document.getElementById("sum-count").textContent = lines.length ? "共 " + lines.length + " 個項目" : "還沒選項目";
    const d = document.getElementById("bk-date").value;
    if (d) {
      const w = "日一二三四五六"[new Date(d + "T00:00").getDay()];
      document.getElementById("sum-date").textContent = d.replace(/-/g, " / ") + "（" + w + "）出發";
    }
    window.__reefOrder = { total, lines }; // 金流上線後送到伺服器重新驗算
    return { total, count: lines.length };
  }

  root.addEventListener("click", (e) => {
    const btn = e.target.closest(".c-btn");
    if (!btn) return;
    const inp = btn.parentElement.querySelector("input");
    inp.value = (Number(inp.value) || 0) + Number(btn.dataset.d);
    update();
  });
  root.addEventListener("change", update);
  root.addEventListener("input", update);
  document.getElementById("bk-date").addEventListener("change", update);
  // 點下拉外面就收起來
  document.addEventListener("click", (e) => root.querySelectorAll("details.ms[open]").forEach((d) => { if (!d.contains(e.target)) d.open = false; }));

  // 各頁「預訂」按鈕：網址帶 ?item=代號，自動帶入
  (function prefill(id) {
    if (!id || !I[id]) return;
    const set = (sel, val) => { const el = root.querySelector(sel); if (el) el.value = val; };
    const tick = (key) => { const cb = root.querySelector('.ms-list input[value="' + key + '"]'); if (cb) cb.checked = true; };
    if (id === "dsd") set('[data-row="dsd"] .ctr[data-k="p"] input', 1);
    else if (id === "fun-shore" || id === "fun-boat") { set("#sel-fun", id); set('[data-row="fun"] .ctr[data-k="p"] input', 1); }
    else if (root.querySelector('#sel-course option[value="' + id + '"]')) set("#sel-course", id);
    else if (id.startsWith("pkg-")) { set("#sel-pkg", id); set('[data-row="pkg"] .ctr[data-k="pair"] input', 1); }
    else if (id.startsWith("ferry")) { tick("ferry"); set("#sel-ferry", id); }
    else if (id.startsWith("gear-") && !root.querySelector('.ms-list input[value="' + id + '"]')) { const k = id.replace(/-(half|full)$/, ""); tick(k); set("#sel-" + k, id); }
    else if (id === "room-quad-extra") tick("room-quad");
    else tick(id);
    const target = root.querySelector('[data-row] select option[value="' + id + '"]') || root.querySelector('.ms-list input[value="' + id + '"]');
    if (target) target.closest(".bk-block").scrollIntoView({ block: "start" });
  })(new URLSearchParams(location.search).get("item"));
  update();

  // 新增參加者：每位都要姓名和出生年月日
  let people = 1;
  document.getElementById("add-person").addEventListener("click", () => {
    people++;
    const box = document.createElement("div");
    box.className = "fields-2 person";
    box.innerHTML =
      '<label class="field"><span>參加者 ' + people + ' 姓名</span><input name="p' + people + '_name" required></label>' +
      '<label class="field"><span>出生年月日</span><input name="p' + people + '_birthday" type="date" required></label>';
    document.getElementById("participants").appendChild(box);
  });

  const form = document.getElementById("booking-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = document.getElementById("form-msg");
    const { count } = update();
    if (!count) { msg.textContent = "請至少選一個項目。"; return; }
    if (!form.checkValidity()) { form.reportValidity(); msg.textContent = "還有欄位沒填，或條款還沒勾選。"; return; }
    if (!PAYMENT_LIVE) {
      msg.innerHTML = "線上付款正在開通中。請先打 <a href=\"tel:+886936871525\">0936-871-525</a> 預訂，我們會幫你保留名額。";
      return;
    }
    // submitOrder(form) — 金流上線後接到伺服器端產生 PAYUNi 付款單（伺服器要用 pricing.js 重算一次總價）
  });
})();
