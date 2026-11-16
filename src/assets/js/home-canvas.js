// 首頁（電腦版）：窄於 1440 的螢幕整頁等比縮小；魚類插圖進入畫面約 20% 時播一次進場動畫
(function () {
  var root = document.documentElement;
  var page = document.querySelector(".hc");
  function fit() {
    var w = document.documentElement.clientWidth;
    page.style.zoom = w < 1440 ? String(w / 1440) : "";
  }
  fit();
  window.addEventListener("resize", fit);

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
