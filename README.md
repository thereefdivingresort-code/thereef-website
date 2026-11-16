# 綠芙 The Reef 潛水網站

> 先讀 `docs/需求總表.md`（要做什麼）。這份寫「程式怎麼組成、怎麼改、怎麼上線」。
> 給業主／非工程人員：看 `docs/維護手冊.md`。

## 技術組成

| 項目 | 用什麼 | 為什麼 |
|---|---|---|
| 網站產生器 | [Eleventy 3](https://www.11ty.dev/)（Nunjucks 樣板） | 產出純 HTML，速度快、好維護，不用資料庫 |
| 內容 | `src/_data/*.json`（全站資料、價目）、`src/pages/*.njk` 的 front matter（每頁的積木清單） | 內容和外觀分開，之後可以接表單式後台 |
| 外觀 | `src/assets/css/style.css`（最上面 `:root` 是顏色、字級） | 改一處全站一起變 |
| 積木 | `src/_includes/blocks/*.njk`，一個檔 = 一種積木 | 頁面 = 積木清單 |
| 主機 | GitHub Pages，`main` 分支有更新就自動發布（`.github/workflows/deploy.yml`） | 免費 |

## 資料夾

```
src/
  _data/site.json        公司資訊、選單、頁尾（null = 待填）
  _data/prices.json      唯一價目表（預訂頁與各商品頁共用）
  _includes/base.njk     共用頁首頁尾
  _includes/page.njk     依 blocks 清單組頁面
  _includes/blocks/      積木：page-intro、legal、steps、booking、info-cols…
  pages/                 每一頁一個檔（front matter 裡的 blocks）
  assets/css|js|img/
docs/                    需求總表、維護手冊
```

## 頁面怎麼組成

```yaml
---
layout: page.njk
title: 退款與停航政策
permalink: /refund/
blocks:
  - type: page-intro      # 對應 _includes/blocks/page-intro.njk
    title: 退款與停航政策
  - type: legal
    sections: [...]
---
```

新增一種積木：在 `src/_includes/blocks/` 加 `名稱.njk`（用變數 `b` 讀資料），樣式寫進 `style.css`，頁面裡就能用 `type: 名稱`。

## 本機預覽

```bash
npm install
npm start          # http://localhost:8080
```

## 上線

- 推到 `main` 就會自動發布到 `https://thereefdivingresort-code.github.io/thereef-website/`。
- 免費網址有子路徑，所以 workflow 設了 `PATH_PREFIX=/thereef-website/`。換成自己的網域時，把 workflow 裡的 `PATH_PREFIX` 改成 `/`，並在 GitHub 設定 Custom domain。

## 預訂與金流

- `src/assets/js/booking.js` 讀頁面裡內嵌的價目（來自 `prices.json`），計算單價、依人數套用 `tiers`、小計、合計、摘要。
- 現在 `PAYMENT_LIVE = false`（送審版不會真的付款）。
- **金流版要做的事**：PAYUNi 的付款單要在伺服器端用商店的 HashKey／HashIV 加密產生，**金鑰絕對不能放在前端或 repo**。建議把主機換成 Cloudflare Pages（可連這個 GitHub repo），新增 `functions/api/checkout.js`：收訂單 → 用 `prices.json` 重新計算金額（不要相信前端送來的金額）→ 產生 PAYUNi 付款資料 → 轉到 PAYUNi。付款結果通知（NotifyURL）再寫一支 function：驗證後寫入訂單紀錄（先用 Google Sheet）、寄確認信。PAYUNi 有 Sandbox 可以先測。

## 之後要接的後台

內容已經是 JSON／YAML 檔。可以加 Git 型表單後台（例如 Pages CMS 或 Decap CMS），讓業主登入後用表單改 `site.json`、`prices.json` 和各頁 blocks，存檔＝commit＝網站自動重建。選型時要確認：業主好不好用、能不能上傳圖片、在 GitHub Pages 或 Cloudflare 上登入方式是否簡單。
