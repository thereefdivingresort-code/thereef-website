(function () {
  "use strict";
  var btn = document.getElementById("back-to-top");
  if (!btn) return;

  // 上下安全距離：不貼頁首、不貼螢幕邊緣（11/17 Ambre：留安全距離）
  var MARGIN = 72;

  function clampY(y) {
    var max = window.innerHeight - MARGIN;
    var min = MARGIN;
    if (max < min) return (min + max) / 2;
    if (y < min) return min;
    if (y > max) return max;
    return y;
  }

  function place(y) {
    btn.style.top = clampY(y) + "px";
  }

  function updateVisible() {
    // 只有頁面比一個螢幕高度長才需要「回到頂部」（11/17 Ambre：超過一卷的頁面才加）
    var scrollable = document.documentElement.scrollHeight > window.innerHeight + 80;
    btn.classList.toggle("is-visible", scrollable);
  }

  // 一進頁面就顯示並跟著滑鼠（11/17 Ambre：不用等捲動），先放在畫面中央
  place(window.innerHeight / 2);
  updateVisible();

  document.addEventListener("mousemove", function (e) { place(e.clientY); }, { passive: true });
  window.addEventListener("resize", updateVisible, { passive: true });
  window.addEventListener("load", updateVisible);
})();
