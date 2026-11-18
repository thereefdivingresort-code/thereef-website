// 關於與聯絡頁的留言表單（送審版）：網站目前沒有後台收信（11/18 Ambre：之後統一導入 LINE），
// 按「送出」先檢查必填（全部必填＋勾同意），通過後不送出，改顯示「線上留言開通中，請先加 LINE 或來電」。
(function () {
  document.querySelectorAll("form.hc-form").forEach(function (form) {
    var msg = document.querySelector('.hc-formmsg[data-form="' + form.id + '"]');
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (msg) msg.hidden = false;
    });
  });

  // 下拉清單（想問的方案）：點開／點選項／鍵盤上下＋Enter／Esc 或點外面關閉；選的值同步到藏起來的 select
  document.querySelectorAll("[data-dd]").forEach(function (dd) {
    var sel = dd.querySelector("select"), btn = dd.querySelector(".hc-dd-btn"), list = dd.querySelector(".hc-dd-list");
    var opts = Array.prototype.slice.call(list.querySelectorAll("li")), active = -1;
    function setActive(i) {
      opts.forEach(function (o, k) { o.classList.toggle("is-active", k === i); });
      active = i;
      if (i >= 0) opts[i].scrollIntoView({ block: "nearest" });
    }
    function open() { list.hidden = false; dd.classList.add("is-open"); btn.setAttribute("aria-expanded", "true"); setActive(Math.max(0, opts.findIndex(function (o) { return o.dataset.v === sel.value; }))); }
    function close() { list.hidden = true; dd.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); setActive(-1); }
    function pick(i) {
      var v = opts[i].dataset.v;
      sel.value = v;
      btn.textContent = v;
      btn.classList.remove("is-empty");
      opts.forEach(function (o, k) { o.setAttribute("aria-selected", k === i ? "true" : "false"); });
      sel.dispatchEvent(new Event("change", { bubbles: true }));
      close();
      btn.focus();
    }
    btn.addEventListener("click", function () { list.hidden ? open() : close(); });
    opts.forEach(function (o, i) { o.addEventListener("click", function () { pick(i); }); });
    btn.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        if (list.hidden) { open(); return; }
        setActive(Math.min(opts.length - 1, Math.max(0, active + (e.key === "ArrowDown" ? 1 : -1))));
      } else if (e.key === "Enter" && !list.hidden && active >= 0) { e.preventDefault(); pick(active); }
      else if (e.key === "Escape") { close(); }
    });
    // 必填沒選：瀏覽器會把提示對到藏起來的 select → 改成把焦點移回按鈕
    sel.addEventListener("invalid", function () { btn.focus(); });
    document.addEventListener("click", function (e) { if (!dd.contains(e.target)) close(); });
  });
})();
