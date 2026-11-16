// 首頁：深度段落隨捲動淡入、回到頂部按鈕顯示/隱藏
(function () {
  var cards = document.querySelectorAll(".depth-card");
  if (cards.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.25 }
    );
    cards.forEach(function (c) { io.observe(c); });
  } else {
    cards.forEach(function (c) { c.classList.add("is-in"); });
  }

  var toTop = document.getElementById("back-to-top");
  if (toTop) {
    var toggle = function () {
      toTop.classList.toggle("is-visible", window.scrollY > 640);
    };
    window.addEventListener("scroll", toggle, { passive: true });
    toggle();
  }
})();
