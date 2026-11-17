# 各頁設定（給 scripts/build-canvas-data.py 用）。首頁有魚類動畫，仍用自己的 scripts/build-home-data.py。
# 每頁：
#   canva      ＝ docs/ 裡從 Canva 讀一次存下來的元素座標檔
#   sections   ＝ (代號, 中文名, y 起, y 迄)：底圖依這個切成每段一張 WebP
#   shared     ＝ 這段直接拿首頁（home.json）哪一段的元素（頁首、頁尾全站一份）；dx、dy＝位移，maxY＝只拿 y 小於這個的
#   skip       ＝ Canva 上有、但改用共用頁首／頁尾的元素 id（不另外產生）
#   buttons    ＝ 按鈕：群組 id（裡面一個形狀＋一段文字）→ 連結
#   pairs      ＝ 按鈕：形狀 id 和文字 id 不在同一個群組時 → (形狀 id, 文字 id, 連結)
#   overrides  ＝ 文字 id → 換成價格／連結／修正（價格一律從 prices.json 讀）
PAGES = {
    "courses": {
        "canva": "courses-canva-elements.json",
        "title": "課程",
        "active": "/courses/",
        "textScale": 0.9,  # 11/17 Ambre：比照首頁，字級 ×0.9（位置、框寬不變）
        # 11/17 Ambre：OW、AOW「含｜…」那段不要縮在左邊（畫面不平均），維持 Canva 的寬度、扁平兩行，
        #   換行跟 Canva 一樣（第一行到「機車」）；預訂按鈕右緣對齊這段的右緣、價格跟著移（全站規則：按鈕和字的最右邊對齊）
        "columns": {"ow": (["LBN9YVvqBxNhtfDy"], []), "aow": (["LBljR0j6Hvqt5Ltv"], [])},
        "buttonAlign": {  # 按鈕群組 id → (欄, 一起移動的價格文字 id)
            "LBhhjwRx9fZF22NR": ("ow", "LB7wpznLPFr6yGkv"),
            "LBsFwHTtt6NbRR06": ("aow", "LBsJdgwf1NsKMFsl"),
        },
        "sections": [
            ("open", "開場", 0, 1560),
            ("ow", "PADI OW", 1560, 2400),
            ("aow", "AOW", 2400, 3600),
            ("plans", "其他方案", 3600, 4560),
            ("notice", "下水前請先看", 4560, 5120),
            ("footer", "頁尾", 5120, 6000),
        ],
        "shared": {
            "open": [{"from": "open", "maxY": 140}],                 # 頁首：選單、預訂鈕
            "footer": [{"from": "footer", "dx": -4.5, "dy": -74}],   # 頁尾：Canva 課程頁的頁尾比首頁往左 4.5px
        },
        "skip": ["LBrHwHFFgrHrtZzH", "LBNcz1hBWcx1YCC7", "LBsvWwhFTGzmXFxt",
                 "LBl39HMnKJ99dw8s", "LBrJvD372LB0D8Rn", "LBrx3qJpXYCm2QlN", "LBJ0CmbT1MB7mZ0j", "LBz8jbCY8Vv7d61N",
                 "LBGc0Mrtv1klhwjd", "LBXFbqQyj3mX36tC", "LBD06N15Z1M6MMB5", "LBm5jZsg8BPTjsTl", "LBLh8dycYGQwQlhk"],
        "buttons": {
            "LBhhjwRx9fZF22NR": "/booking/?item=ow",
            "LBsFwHTtt6NbRR06": "/booking/?item=aow",
        },
        "pairs": [("LB3GdLk0P62sQtyt", "LBk6lZZC7pWDzhSS", "/booking/?item=ow-aow")],
        "overrides": {
            # 行距微調：用像素量測對齊 Canva（Canva 的行距比網頁略緊）
            # AOW 包含內容：拿掉「深潛改成 2 支船潛加收 NT$ 1,400」（11/17 Ambre：1,400 不在價目表，這句拿掉）
            "LBN9YVvqBxNhtfDy": {"w": 800},
            "LBljR0j6Hvqt5Ltv": {"w": 800, "text": "含｜線上學科、PADI 證照申請費、5 支術科、全套裝備和電腦錶、背包房 2 晚、碼頭接送、機車 2 人 1 台、保險"},
            "LB7wpznLPFr6yGkv": {"priceId": "ow", "text": "NT$ {price} ／人"},
            "LBsJdgwf1NsKMFsl": {"priceId": "aow", "text": "NT$ {price} ／人"},
            "LBrDZT1G6gSqkWdg": {"priceId": "ow-aow", "text": "NT$ {price} ／人"},
            "LBVPTq767chDn6td": {"fill": True, "lh": 1.582, "text":
                "已有證照，岸潛和船潛都能約。\n岸潛 1 支\n"
                "1 對 1 NT${tier:fun-shore:1}／人\n1 對 2 NT${tier:fun-shore:2}／人\n1 對 3 NT${tier:fun-shore:3}／人\n1 對 4（含以上）NT${tier:fun-shore:4}／人\n\n"
                "船潛 1 支\n"
                "1 對 1 NT${tier:fun-boat:1}／人\n1 對 2 NT${tier:fun-boat:2}／人\n1 對 3 NT${tier:fun-boat:3}／人\n1 對 4（含以上）NT${tier:fun-boat:4}／人"},
            # Canva「近一步」是錯字 → 「進一步」
            "LB8p0P2RKSVGfw4g": {"fill": True, "lh": 1.582, "text":
                "複習 Re-active　NT${item:reactive}／人\n高氧 EAN　NT${item:ean}／人\n緊急反應 EFR　NT${item:efr}／人\n"
                "救援 Rescue　NT${item:rescue}／人\n潛水長 DM　NT${item:dm}／人\n\n\n進階課程請私訊我們獲取進一步資訊"},
            # 〈退款與停航政策〉做成連結
            "LBFBq2R4zJq6nNBb": {"lh": 1.765, "spans": [
                {"t": "・有心臟病、高血壓、糖尿病、癲癇、氣喘、肺部疾病、耳鼻喉問題、\n    近期動過手術或懷孕，不建議潛水，或需先經醫師評估。\n ", "c": "#ffffff"},
                {"t": "   報名時會請你填 PADI 健康問卷。", "c": "#edc40f"},
                {"t": "\n・潛水後至少間隔 12–18 小時再搭飛機。\n・潛水前 8–12 小時不喝酒；前一晚睡飽，感冒鼻塞請改期。\n・天候或海況不佳時，教練會以安全為優先調整或取消，\n    退款方式請見", "c": "#ffffff"},
                {"t": "〈退款與停航政策〉", "c": "#ffffff", "href": "/refund/"},
                {"t": "。", "c": "#ffffff"}]},
        },
    },
}
