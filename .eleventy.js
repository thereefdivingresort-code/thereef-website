// Eleventy 設定：src 是原始檔，_site 是產生出來的網站
const { HtmlBasePlugin } = require("@11ty/eleventy");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  // rich：把多行文字轉成段落；「・」開頭的行變成條列
  eleventyConfig.addFilter("rich", function (text) {
    if (!text) return "";
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const out = [];
    let list = [];
    const flush = () => { if (list.length) { out.push("<ul>" + list.join("") + "</ul>"); list = []; } };
    String(text).split("\n").forEach((line) => {
      const t = line.trim();
      if (!t) { flush(); return; }
      if (t.startsWith("・")) list.push("<li>" + esc(t.slice(1).trim()) + "</li>");
      else { flush(); out.push("<p>" + esc(t) + "</p>"); }
    });
    flush();
    return out.join("");
  });
  eleventyConfig.addFilter("money", (n) => Number(n).toLocaleString("en-US"));
  // priceItem：用代號從 prices.json 找一個品項（{{ "dsd" | priceItem(prices) }}），價格只讀不手打
  eleventyConfig.addFilter("priceItem", function (id, prices) {
    if (!prices || !prices.groups) return null;
    for (const g of prices.groups) {
      const item = (g.items || []).find((i) => i.id === id);
      if (item) return item;
    }
    return null;
  });

  // fillPrices：文字裡的 {price:dsd}、{price:dsd*5}、{price:ow-dsd*5} 換成 prices.json 的價格（加千分位），不手打數字
  eleventyConfig.addFilter("fillPrices", function (text, prices) {
    const find = (id) => {
      for (const g of (prices && prices.groups) || []) {
        const it = (g.items || []).find((i) => i.id === id);
        if (it) return it.price;
      }
      throw new Error("fillPrices：prices.json 找不到 " + id);
    };
    return String(text).replace(/\{price:([a-z0-9*+\- -]+)\}/gi, (_, expr) => {
      let total = 0;
      for (const m of expr.replace(/\s/g, "").matchAll(/([+-]?)([a-z0-9-]+?)(?:\*(\d+))?(?=[+-]|$)/gi)) {
        total += (m[1] === "-" ? -1 : 1) * find(m[2]) * (m[3] ? Number(m[3]) : 1);
      }
      return Number(total).toLocaleString("en-US");
    });
  });

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    // 用 GitHub 免費網址時是 /thereef-website/；之後接自己的網域改成 "/"
    pathPrefix: process.env.PATH_PREFIX || "/",
    templateFormats: ["njk", "md"],
    htmlTemplateEngine: "njk",
  };
};
