/* 計價核心：網站預訂頁和自動驗算（npm test）共用同一份，算法只寫在這裡。
   規則＝Google Sheet 主檔 02_計算規則。
   calc(item, a, b)：
     fixed（固定單價）：price × b
     tier（依人數級距）：該人數的每人價 × a（人數）× b（支數或趟數）；4 人以上用最後一格
     pair（雙人組＋單人）：a（雙人組數）× 2 × price ＋ b（單人數）× single */
(function (root) {
  function unitFor(item, persons) {
    if (item.method === "tier") {
      const t = item.tiers;
      return t[Math.min(Math.max(persons, 1), t.length) - 1];
    }
    return item.price;
  }
  function calc(item, a, b) {
    a = Number(a) || 0; b = Number(b) || 0;
    if (item.method === "pair") return a * 2 * item.price + b * item.single;
    if (item.method === "tier") return a > 0 ? unitFor(item, a) * a * b : 0;
    return item.price * b;
  }
  function index(data) {
    const m = {};
    data.groups.forEach((g) => g.items.forEach((i) => (m[i.id] = i)));
    return m;
  }
  const api = { unitFor, calc, index };
  root.ReefPricing = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
