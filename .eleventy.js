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
  // 手機版排法（分組、插圖窗）：見 scripts/mobile-blocks.js、src/_data/mobile.json
  eleventyConfig.addFilter("mBlocks", require("./scripts/mobile-blocks.js"));
  eleventyConfig.addFilter("mAnchorOrder", require("./scripts/mobile-blocks.js").anchorOrder);
  // 英文版：toEn＝頁面資料換成英文（scripts/i18n.js）；zhUrl／enUrlOf＝同一頁的中文／英文網址（給頁首「中｜EN」切換）
  const i18n = require("./scripts/i18n.js");
  eleventyConfig.addFilter("toEn", i18n.toEn);
  eleventyConfig.addFilter("zhUrl", (u) => (String(u).startsWith("/en/") ? String(u).slice(3) : u));
  eleventyConfig.addFilter("enUrlOf", (u) => (String(u).startsWith("/en/") ? u : "/en" + u));
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
    const findItem = (id) => {
      for (const g of (prices && prices.groups) || []) {
        const it = (g.items || []).find((i) => i.id === id);
        if (it) return it;
      }
      throw new Error("fillPrices：prices.json 找不到 " + id);
    };
    const fmt = (n) => Number(n).toLocaleString("en-US");
    // {item:ow-aow}＝代號有連字號的單一品項價格；{extra:pkg-fun}＝單人報名加價；{tier:fun-shore:2}＝級距價第 2 格（1 對 2）
    text = String(text)
      .replace(/\{item:([a-z0-9-]+)\}/gi, (_, id) => fmt(findItem(id).price))
      // {extra:pkg-fun}＝套裝「單人報名」比雙人每人價多的金額（single − price）
      .replace(/\{extra:([a-z0-9-]+)\}/gi, (_, id) => {
        const it = findItem(id);
        if (it.single == null) throw new Error("fillPrices：" + id + " 沒有單人價（single）");
        return fmt(it.single - it.price);
      })
      .replace(/\{tier:([a-z0-9-]+):(\d)\}/gi, (_, id, n) => {
        const t = findItem(id).tiers;
        if (!t || t[n - 1] == null) throw new Error("fillPrices：" + id + " 沒有第 " + n + " 格級距價");
        return fmt(t[n - 1]);
      });
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
