// 照 Canva 排版的頁面（電腦版）：窄於 1440 的螢幕整頁等比縮小；魚類插圖進入畫面約 20% 時播一次進場動畫
(function () {
  var root = document.documentElement;
  var pages = document.querySelectorAll(".hc, .hc-flow"); // 預訂頁：上面頁首、中間表單、下面頁尾分成三塊，一起縮放
  function fit() {
    var w = document.documentElement.clientWidth;
    // 手機（≤768px）改用直排版（canvas-mobile.css），不縮放
    var mobile = window.matchMedia("(max-width: 768px)").matches;
    pages.forEach(function (page) { page.style.zoom = !mobile && w < 1440 ? String(w / 1440) : ""; });
  }
  fit();
  window.addEventListener("resize", fit);

  // 手機頁首選單：點 ☰ 展開／收合；點選單外面或按 Esc 收合
  document.querySelectorAll(".hc-mhead").forEach(function (head) {
    var btn = head.querySelector(".hc-mnav-btn");
    if (!btn) return;
    function set(open) { head.classList.toggle("is-open", open); btn.setAttribute("aria-expanded", open ? "true" : "false"); btn.setAttribute("aria-label", open ? "關閉選單" : "選單"); }
    btn.addEventListener("click", function (e) { e.stopPropagation(); set(!head.classList.contains("is-open")); });
    document.addEventListener("click", function (e) { if (!head.contains(e.target)) set(false); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") set(false); });
  });

  // 錨點（/about/#contact、條款頁目錄）：手機版元素改成直排，電腦版的高度不能用了 → 把錨點的 id 移到原本高度最接近的那個元素上
  if (window.matchMedia("(max-width: 768px)").matches) {
    var els = [];
    document.querySelectorAll(".hc-sec").forEach(function (sec) {
      var top = parseFloat(sec.style.top) || 0;
      sec.querySelectorAll(".hc-t, .hc-btn").forEach(function (el) { if (el.closest(".hc-mhead")) return; els.push({ el: el, y: top + (parseFloat(el.style.top) || 0) }); });
    });
    document.querySelectorAll(".hc-anchor[id]").forEach(function (a) {
      var y = parseFloat(a.style.top) || 0, best = null;
      els.forEach(function (o) { if (o.y >= y - 10 && (!best || o.y < best.y)) best = o; });
      if (!best || best.el.id) return;
      best.el.id = a.id; a.removeAttribute("id"); best.el.style.scrollMarginTop = "16px";
    });
    if (location.hash && document.getElementById(location.hash.slice(1))) document.getElementById(location.hash.slice(1)).scrollIntoView();
  }

  var fish = document.querySelectorAll(".hc-fish");
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) { root.classList.remove("hc-anim"); return; } // 不加動畫：直接顯示
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.2 });
  fish.forEach(function (f) { io.observe(f); });
})();
