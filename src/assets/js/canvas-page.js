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
