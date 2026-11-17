# 各頁設定（給 scripts/build-canvas-data.py 用）。首頁有魚類動畫，仍用自己的 scripts/build-home-data.py。
# 每頁：
#   canva      ＝ docs/ 裡從 Canva 讀一次存下來的元素座標檔
#   sections   ＝ (代號, 中文名, y 起, y 迄)：底圖依這個切成每段一張 WebP
#   shared     ＝ 這段直接拿首頁（home.json）哪一段的元素（頁首、頁尾全站一份）；dx、dy＝位移，maxY＝只拿 y 小於這個的
#   skip       ＝ Canva 上有、但改用共用頁首／頁尾的元素 id（不另外產生）
#   buttons    ＝ 按鈕：群組 id（裡面一個形狀＋一段文字）→ 連結
#   pairs      ＝ 按鈕：形狀 id 和文字 id 不在同一個群組時 → (形狀 id, 文字 id, 連結)
#   overrides  ＝ 文字 id → 換成價格／連結／修正（價格一律從 prices.json 讀）
#   columns    ＝ 欄名 → (參考文字 id 們, 要縮到同寬的文字 id 們)：欄的右緣＝參考文字的實際最右邊
#   buttonAlign＝ 按鈕 id（群組或形狀）→ (欄名, 一起移動的價格文字 id 或 None)：按鈕右緣對齊那一欄
#   illustrations ＝ 插圖 id → 檔名、動畫（做成版型的 fish 元素，進入畫面時播一次進場）
#   illusMatte ＝ 插圖匯出圖裡刪不掉的鎖定底紋（透明度、顏色），切圖時扣掉
#   illusClip  ＝ 插圖 id → Canva 上疊在它上面的東西範圍（挖空，網頁才不會蓋住）
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
    "stay": {
        "canva": "stay-canva-elements.json",
        "title": "住宿",
        "active": "/stay/",
        "textScale": 0.9,  # 全站規則（11/17 Ambre）：字級 ×0.9，位置、框寬不變
        # 預訂按鈕右緣對齊同一欄文字的實際最右邊（全站規則）。價格在欄的最左邊，不跟著移（移了會跑出欄外）。
        "columns": {
            "double": (["LBLTK0qVl43kvNlw", "LBF0tFJyd2lLhB47", "LBLv7pw1gzvXfYsn", "LBRlCXK0D5gQdCLT"], []),
            "quad": (["LBRqrVhXGVSx541R", "LBpzGHHpqh61Z7Qg", "LBQ1BPgDZK8BnqGT", "LBW3SnNFJRdt4wtH"], []),
            "backpacker": (["LBPD8qF529k5FLhF", "LBtSZbM9rjQMlmnm", "LBVyQMFdSpRXcQxG", "LBd7zl8tfhM3HTqy"], []),
        },
        "buttonAlign": {
            "LBdXTsn1SndpvStP": ("double", None),
            "LB5vKycJl33TRj8b": ("quad", None),
            "LB4XmhvXWgTfjnSQ": ("backpacker", None),
        },
        "sections": [
            ("open", "開場", 0, 1000),
            ("double", "豪華雙人房", 1000, 2100),
            ("quad", "豪華四人房", 2100, 3000),
            ("backpacker", "背包客房", 3000, 3660),
            ("notice", "入住前請先看", 3660, 4050),
            ("footer", "頁尾", 4050, 5000),
        ],
        "shared": {
            "open": [{"from": "open", "maxY": 140, "dy": 9.7}],            # 頁首：住宿頁 Canva 的頁首比首頁往下 9.7px
            "footer": [{"from": "footer", "dx": -0.6, "dy": 0}],           # 頁尾：比首頁往左 0.6px（像素量測）
        },
        "skip": ["LBzWvTswG6HrYD9L", "LBN9RY4GyZ07gR8S",
                 "LBRrZSffVHFYKcNR", "LBKsxnf6tDWpt68M", "LB9LCbWttBWbNV4Z", "LBfLW7vfX0KYYq6v", "LB5Tf9zB305JRpsq",
                 "LBCQHLfLpTYFMYXW", "LBsFdLyRf4Jy6Xwv", "LBkdpr2GDFdcf2P6"],
        "pairs": [
            ("LBdXTsn1SndpvStP", "LBMP446DQtQkS7dH", "/booking/?item=room-double"),
            ("LB5vKycJl33TRj8b", "LBDlwt1dnRXZ7Tvs", "/booking/?item=room-quad"),
            ("LB4XmhvXWgTfjnSQ", "LBhbQsLL1VdCSVt4", "/booking/?item=bed-backpacker"),
        ],
        # 房子藍曬插圖、開場白色 logo：滑到時緩慢浮現（11/17 Ambre；Canva 頁面備註沒有動畫規格）
        "illustrations": {
            # 開場照片中央的白色 logo：漸漸浮現（11/17 Ambre）。插圖工作檔裡是重新放回的同一張圖（新 id LBrG1LDP5qbvkJw8），座標照原頁
            "LBS99CLLmb0JcsM8": {"code": "L1", "file": "stay_logo_white", "name": "綠芙潛水白色 logo", "anim": {"dx": 0, "dy": 12, "dur": 1.8, "delay": 0.3, "float": 0}},
            "LBbHL189lzp1pmMd": {"code": "H1", "file": "stay_house_double", "name": "雙人房房子", "anim": {"dx": 0, "dy": 12, "dur": 1.8, "delay": 0, "float": 0}},
            "LBSFndCVbhV2crhF": {"code": "H2", "file": "stay_house_quad", "name": "四人房前院", "anim": {"dx": 0, "dy": 12, "dur": 1.8, "delay": 0, "float": 0}},
            "LBXLvH6x2ylXknJl": {"code": "H3", "file": "stay_house_backpacker", "name": "背包客房床位", "anim": {"dx": 0, "dy": 12, "dur": 1.8, "delay": 0, "float": 0}},
        },
        "illusMatte": {"alpha": 171, "color": [249, 249, 243], "y": [962, 4219]},  # 鎖定的紙紋底（透明度 0.67，y 962–4219）刪不掉
        "illusClip": {"LBbHL189lzp1pmMd": [[844.6, 1091.5, 1288.5, 1627.1]]},  # 雙人房照片疊在房子上面
        "overrides": {
            # 價格一律從 prices.json 讀（＝Sheet 01_價目表）
            "LB8MwmV4jhh8FlN8": {"priceId": "room-double", "text": "NT$ {price} ／房／晚"},
            "LBYtZvF3TchTmCJj": {"priceId": "room-quad", "text": "NT$ {price} ／房／晚"},
            # Canva「NT$ 600 起」→ Sheet 是 800（以 Sheet 為準），拿掉「起」（待 Ambre 決定）
            "LBDdnnNRPRPqnXr0": {"priceId": "bed-backpacker", "text": "NT$ {price} ／床／晚"},
            "LBW3SnNFJRdt4wtH": {"fill": True, "text": "可住 4 人（最多 6 人）｜獨立前院｜私人衛浴\n第 5、6 位房客每人加 NT$ {item:room-quad-extra}"},
            # 〈退款與停航政策〉做成連結
            "LBkjkHYNjWMlR0jg": {"spans": [
                {"t": "・入住時間下午3點以後，退房時間中午12點以前。\n・房價是每晚價格。\n・訂房可以取消或改期，退款比例請見", "c": "#12355b"},
                {"t": "〈退款與停航政策〉", "c": "#12355b", "href": "/refund/"},
                {"t": "。\n・考照套裝和 3 天 2 夜套裝已經含背包客房，不用另外訂。", "c": "#12355b"}]},
        },
    },
    "trips": {
        "canva": "trips-canva-elements.json",
        "title": "行程",
        "active": "/trips/",
        "textScale": 0.9,  # 全站規則（11/17 Ambre）：字級 ×0.9，位置、框寬不變
        # 預訂按鈕右緣對齊同一張卡片說明文字的實際最右邊（全站規則）。Canva 是靠左（待 Ambre 決定）
        "columns": {
            "snorkel": (["LBzSVlpmsyKY969S"], []),
            "dsd": (["LBC99NYrzPNRb5V3"], []),
            "fun": (["LBWlG8kv6BRD4VTt"], []),
        },
        "buttonAlign": {
            "LB8ZB478rkxNBW2W": ("snorkel", None),
            "LB6ZkxmTckCCLlBy": ("dsd", None),
            "LBZ9wlyDbmv99gFr": ("fun", None),
        },
        "sections": [
            ("open", "開場", 0, 1330),
            ("includes", "每個套裝皆含", 1330, 1560),
            ("packages", "三張套裝卡", 1560, 2480),
            ("days", "3 天怎麼過", 2480, 3020),
            ("addons", "島上加購", 3020, 3700),
            ("footer", "頁尾", 3700, 4500),
        ],
        "shared": {
            "open": [{"from": "open", "maxY": 140}],                  # 頁首：行程頁 Canva 的頁首跟首頁同位置
            "footer": [{"from": "footer", "dx": 0, "dy": -150}],      # 頁尾：Canva 行程頁頁尾＝首頁頁尾往上 3500px（段落起點差 150）
        },
        "skip": ["LB78BVbQGW0x9XFd", "LBQ6xlXCM3TJSkkZ",
                 "LBLrX4221rNXYHdV", "LBlFKNkhXTTK1jgs", "LB1kly2sPrlhWHwT", "LBytDVwcT9xnmLWr", "LBCR0YpRslFW3hM4",
                 "LBqj21fVbl0DBL3Q", "LBDnGGMCtyHbYRdh", "LBhK872CHTstVTwf"],
        "pairs": [
            ("LB8ZB478rkxNBW2W", "LBdffbJZsL5g35Tt", "/booking/?item=pkg-snorkel"),
            ("LB6ZkxmTckCCLlBy", "LByPGnkHgHbswcVC", "/booking/?item=pkg-dsd"),
            ("LBZ9wlyDbmv99gFr", "LB5xp8Sh33YwsxQ3", "/booking/?item=pkg-fun"),
        ],
        "overrides": {
            # 錯字：「Fun Dive都可以」補空格
            "LBZwHWRgxX45RNy5": {"text": "從台東搭船到綠島，碼頭有人接，機車和背包客房都準備好。\n你只要選想怎麼玩：浮潛、體驗潛水，或已經有證照的 Fun Dive 都可以！"},
            # 套裝價格（雙人每人價＝price）、升等（up-*）、單人報名加價（single − price）一律從 prices.json 讀
            "LBw7xdQDG4rmzMrz": {"priceId": "pkg-snorkel", "text": "NT$ {price} ／人"},
            "LBZTblQpt7HphBhC": {"priceId": "pkg-dsd", "text": "NT$ {price} ／人"},
            "LBGrLP8yBGVmXXnm": {"priceId": "pkg-fun", "text": "NT$ {price} ／人"},
            "LBmLjYGqVlSNZXFh": {"fill": True, "text": "升等雙人套房每人＋NT$ {item:up-snorkel}\n單人報名＋NT$ {extra:pkg-snorkel}"},
            # Canva 備註：體驗套裝升等中文＋500、英文＋800 → 照 Sheet（up-dsd）
            "LBvvnr4lVHHvtqYy": {"fill": True, "text": "升等雙人套房每人＋NT$ {item:up-dsd}\n單人報名＋NT$ {extra:pkg-dsd}"},
            "LBt6pcV4Zs1ZdM5H": {"fill": True, "text": "升等雙人套房每人＋NT$ {item:up-fun}\n單人報名＋NT$ {extra:pkg-fun}（機車和導潛費）"},
            # 島上加購：價格從 prices.json 讀
            "LBs4ySQ7DzrGbxvL": {"fill": True, "text": "潮間帶導覽　{item:tidal}\n夜釣　{item:fishing}\n藍洞秘境探險　{item:bluecave}"},
            "LBQjBtrl9LjzlkRT": {"fill": True, "text": "SUP 立槳（單人板）　{item:sup1}\nSUP 立槳（雙人板）　{item:sup2}\n玻璃船　{item:glassboat}"},
            # 烤肉吃到飽、招牌桶仔雞：Sheet 沒有（11/16 Ambre 拿掉餐食）→ 先不放；電動自行車 Sheet 只有單人 600（ebike），
            #   Canva「600／天起」的「起」是指雙人 800，Sheet 沒有 → 拿掉「起」（都列在待 Ambre 決定）
            "LBRvm9XldnhzNjsQ": {"fill": True, "text": "電動自行車　{item:ebike}／天"},
        },
    },
}
