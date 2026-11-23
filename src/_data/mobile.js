// 手機版（≤ 768px）每頁每段的少量設定。排法規則在 scripts/mobile-plan.js，外觀在 src/assets/css/canvas-page.css 最後的 @media 段。
// 座標一律用電腦版（1440 寬）「該段裡」的座標（不是整頁座標）。沒寫的段落用預設：底圖鋪滿、文字由上往下排、同一高度的並排成一列。
//   bg    ＝ 段落底圖：pos（對準位置）、size（cover＝鋪滿）、color（底色）、img:false（不用底圖，只用底色）
//   pad   ＝ [上, 下] 留白（px）；minH＝最小高度
//   pics  ＝ 把底圖的一塊（照片、地圖、插畫）原樣切出來放：r＝[x, y, 寬, 高]；w＝手機上寬度（預設 100%）；o＝排在哪個 y 的位置；fade＝上下邊緣淡出
//   boxes ＝ 卡片：r＝[x, y, 寬, 高]；bg、radius、shadow、lines（每列下面加細線）
//   items ＝ 個別元素（用文字開頭或插圖檔名找）：hide、o（改排序位置 y）、fs（手機字級）、mt（上方間距）、solo（不跟旁邊並排）；插圖：x、y（%）、s（放大倍數）、hide
//   fishScale ＝ 這段插圖在手機上的放大倍數（預設 1＝跟電腦版同比例）
module.exports = {
  home: {
    _all: { fishScale: 1.5 },
    open: { pad: [36, 36], minH: 700, bg: { pos: "38% 50%" } },
    d12: {
      bg: { pos: "8% 50%" }, pad: [56, 120], pics: [{ r: [773, 341, 552, 731], w: "86%" }],
      items: { home_fish_A01: { at: "12 m", x: 58, y: -22 }, home_fish_A02: { at: "在水下聽不見", x: 60, y: 3 } },
    },
    d18: {
      pad: [40, 150],
      items: {
        home_fish_B01: { at: "18 m", x: 70, y: -14 }, home_fish_B03: { at: "NT$", x: 70, y: 4, s: 0.9 },
        home_fish_B02: { at: "NT$", x: 6, y: 22, s: 1.1 },
      },
    },
    d30: {
      pad: [40, 280],
      items: {
        home_fish_C01: { at: "30 m", x: 50, y: -30, s: 1 }, home_fish_C02: { at: "也有住宿房型", x: 62, y: 2, s: 1.1 },
        home_fish_C04: { at: "預訂", x: 2, y: 22 }, home_fish_C06: { at: "預訂", x: 24, y: 14 },
        home_fish_C07: { at: "預訂", x: 50, y: 30 }, home_fish_C07b: { at: "預訂", x: 80, y: 44 }, home_fish_C05: { at: "預訂", x: 70, y: 10 },
      },
    },
    faq: { items: { "回到頂部": { hide: true } } },
    map: {
      bg: { img: false, color: "#f5f3ef" }, pad: [0, 56],
      pics: [{ r: [160, 0, 1120, 470] }, { r: [600, 470, 790, 600], o: 1200, w: "94%" }],
    },
  },
};
