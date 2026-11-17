// 關於與聯絡頁的留言表單（送審版）：網站目前沒有後台收信，按「送出」先檢查必填，
// 通過後不送出，改顯示「線上留言開通中，請先來電或加 LINE」（比照預訂頁送審版）。之後接收信服務再改這裡。
(function () {
  document.querySelectorAll("form.hc-form").forEach(function (form) {
    var msg = document.querySelector('.hc-formmsg[data-form="' + form.id + '"]');
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (msg) msg.hidden = false;
    });
  });
})();
