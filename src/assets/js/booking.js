/* 預訂購物車：讀 _data/prices.json（頁面內嵌），自動算小計與合計。
   PAYMENT_LIVE = false：金流還沒串（送審版）。PAYUNi 過審、拿到商店代號後，
   改成 true，並把 submitOrder() 接到伺服器端的付款程式（見 docs/工程說明.md）。 */
(function () {
  const PAYMENT_LIVE = false;
  const data = JSON.parse(document.getElementById("price-data").textContent);
  const items = {};
  data.groups.forEach((g) => g.items.forEach((i) => (items[i.id] = i)));
  const fmt = (n) => "NT$ " + Number(n).toLocaleString("en-US");

  const rowsEl = document.getElementById("cart-rows");
  const form = document.getElementById("booking-form");

  // 依人數決定單價：tiers 裡符合 min/max 的優先，否則用基本價
  function unitPrice(item, qty) {
    if (item.tiers) {
      const t = item.tiers.find((t) => qty >= (t.min || 1) && (t.max == null || qty <= t.max));
      if (t) return t.price;
    }
    return item.price;
  }

  function optionsHtml() {
    let h = '<option value="">請選擇項目</option>';
    data.groups.forEach((g) => {
      h += '<optgroup label="' + g.name + '">';
      g.items.forEach((i) => (h += '<option value="' + i.id + '">' + i.name + "</option>"));
      h += "</optgroup>";
    });
    return h;
  }

  function addRow(id, qty) {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML =
      '<select aria-label="項目">' + optionsHtml() + "</select>" +
      '<span class="unit">—</span>' +
      '<span class="qty"><button type="button" class="q-minus" aria-label="減少">−</button>' +
      '<input type="number" min="1" value="' + (qty || 1) + '" aria-label="數量">' +
      '<button type="button" class="q-plus" aria-label="增加">＋</button></span>' +
      '<span class="sub">0</span>' +
      '<button type="button" class="row-del" aria-label="刪除這列">×</button>';
    if (id) row.querySelector("select").value = id;
    rowsEl.appendChild(row);
    update();
  }

  function readRows() {
    return [...rowsEl.querySelectorAll(".cart-row")].map((r) => {
      const id = r.querySelector("select").value;
      const qty = Math.max(1, parseInt(r.querySelector("input").value, 10) || 1);
      return { r, item: items[id], qty };
    });
  }

  function update() {
    let total = 0, count = 0;
    const lines = [];
    readRows().forEach(({ r, item, qty }) => {
      const unitEl = r.querySelector(".unit"), subEl = r.querySelector(".sub");
      if (!item) { unitEl.textContent = "—"; subEl.textContent = "0"; return; }
      const up = unitPrice(item, qty), sub = up * qty;
      unitEl.textContent = up.toLocaleString("en-US") + "／" + item.unit;
      subEl.textContent = sub.toLocaleString("en-US");
      total += sub; count++;
      lines.push("<li><span>" + item.name + " × " + qty + "</span><span>" + fmt(sub) + "</span></li>");
    });
    document.getElementById("cart-total").textContent = fmt(total);
    document.getElementById("sum-total").textContent = fmt(total);
    document.getElementById("sum-lines").innerHTML = lines.join("");
    document.getElementById("sum-count").textContent = "共 " + count + " 個項目";
    const d = document.getElementById("bk-date").value;
    if (d) {
      const w = "日一二三四五六"[new Date(d + "T00:00").getDay()];
      document.getElementById("sum-date").textContent = d.replace(/-/g, " / ") + "（" + w + "）出發";
    }
    return { total, count };
  }

  rowsEl.addEventListener("change", update);
  rowsEl.addEventListener("input", update);
  rowsEl.addEventListener("click", (e) => {
    const row = e.target.closest(".cart-row");
    if (!row) return;
    const input = row.querySelector("input");
    if (e.target.classList.contains("q-plus")) input.value = (parseInt(input.value, 10) || 1) + 1;
    if (e.target.classList.contains("q-minus")) input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
    if (e.target.classList.contains("row-del")) row.remove();
    update();
  });
  document.getElementById("add-row").addEventListener("click", () => addRow());
  document.getElementById("bk-date").addEventListener("change", update);

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

  // 網址帶 ?item=ow 時，自動帶入該項目（各頁「預訂」按鈕用）
  const pre = new URLSearchParams(location.search).get("item");
  addRow(items[pre] ? pre : "", 1);

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
    // submitOrder(form) — 金流上線後接到伺服器端產生 PAYUNi 付款單
  });
})();
