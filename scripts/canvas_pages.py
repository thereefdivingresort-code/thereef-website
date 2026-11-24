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
#   anchors    ＝ 錨點名稱 → y（例如 "contact": 1250 → 網址 /about/#contact 直接跳到這個高度）
#   form       ＝ 留言表單：真的網頁欄位照 Canva 輸入框座標放（輸入框外觀留在底圖、欄位本身透明）
#                fields＝(box 輸入框形狀 id, ph 提示字 id, label 標題文字 id, 欄位設定)；check＝同意勾選框；submit＝送出鈕；msg＝送出後訊息的位置
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
                "船潛 1 趟（2 支）\n"  # 11/19 Ambre：船潛以趟計價（一趟通常 2 支），原 Canva「船潛 1 支」
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
        # 插圖：月亮夜釣、SUP（連同後面的太陽）、藍洞探險（取代烤肉）滑到時慢慢浮現（11/18 Ambre）
        "illustrations": {
            "LBZQVMYsBZZF9mqP": {"code": "T1", "file": "trips_moon_fishing", "name": "月亮夜釣", "anim": {"dx": 0, "dy": 12, "dur": 1.8, "delay": 0, "float": 0}},
            "LB8f2js7y9qclGlr": {"code": "T2", "file": "trips_sup_sun", "name": "SUP 立槳與太陽", "with": ["LBT3trKSS4gn3Z1n"], "anim": {"dx": 0, "dy": 12, "dur": 1.8, "delay": 0, "float": 0}},
            # 原本烤肉的位置換成藍洞探險（11/18 Ambre）：不是 Canva 的圖，是照同風格畫的 docs/trips-bluecave.svg，
            #   匯出插圖 PNG 後貼在烤肉的範圍（x1012.4 y3381.7 w178.6 h155.4）再跑產生器；太陽跟頁首選單的太陽同色
            "LBQszyFHm6Q0GkDP": {"code": "T3", "file": "trips_bluecave", "name": "藍洞探險", "anim": {"dx": 0, "dy": 12, "dur": 1.8, "delay": 0, "float": 0}},
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
            # 烤肉吃到飽、招牌桶仔雞：Sheet 沒有（11/16 Ambre 拿掉餐食）→ 不放（11/18 Ambre 確認，烤肉插圖也拿掉）；電動自行車 Sheet 只有單人 600（ebike），
            #   Canva「600／天起」的「起」是指雙人 800，Sheet 沒有 → 拿掉「起」（都列在待 Ambre 決定）
            "LBRvm9XldnhzNjsQ": {"fill": True, "text": "電動自行車　{item:ebike}／天"},
        },
    },
    "about": {
        "canva": "about-canva-elements.json",
        "title": "關於與聯絡",
        "active": "/about/",
        "textScale": 0.9,  # 全站規則（11/17 Ambre）：字級 ×0.9，位置、框寬不變
        "sections": [
            ("open", "開場", 0, 960),
            ("links", "Stay／Scuba／Tour", 960, 1260),
            ("contact", "聯絡我們", 1260, 1940),
            ("form", "留言表單", 1940, 2950),
            ("footer", "頁尾", 2950, 3900),
        ],
        # 插圖動畫（11/18 Ambre）：KEN 漫畫滑到時慢慢浮現（比住宿頁的 1.8 秒慢）＋一直上下左右輕輕晃；
        #   美人魚潛水員微微上下浮動；她手上的水母（從同一張圖分出來）明顯上下飄
        "illustrations": {
            "LBLnjyDMXnTGlchB": {"code": "K1", "file": "about_ken", "name": "KEN 漫畫潛水員",
                                 "anim": {"dx": 0, "dy": 24, "dur": 2.8, "delay": 0, "float": 0, "wobble": 7}},
            "LBxyHnkMr8DdqfFL": {"code": "M1", "file": "about_mermaid", "name": "美人魚潛水員", "minus": ["jelly"],
                                 "anim": {"dx": 0, "dy": 0, "dur": 1.2, "delay": 0, "float": 0, "bob": 5.5, "amp": 6}},
            "jelly": {"code": "M2", "file": "about_jelly", "name": "水母", "box": [860, 1340, 1000, 1475],
                      "anim": {"dx": 0, "dy": 0, "dur": 1.2, "delay": 0, "float": 0, "bob": 3.2, "amp": 18}},
        },
        # /about/#contact：頁尾「聯絡我們」按鈕連這裡。「聯絡我們」標題（y 1310）上面留 60px，捲過來不會貼齊螢幕頂端
        "anchors": {"contact": 1250},
        "shared": {
            "open": [{"from": "open", "maxY": 140}],               # 頁首：關於頁 Canva 的頁首跟首頁同位置（選單沒有「聯絡」，11/17 Ambre）
            "footer": [{"from": "footer", "dx": 0, "dy": 0}],      # 頁尾：Canva 關於頁頁尾＝首頁頁尾往上 4100px（段落起點差同樣 4100）
        },
        "skip": ["LBVgvFxw6lY1DSTj", "LB03RgQTfgCyg1JD",
                 "LBkgGKbL8FnpWQRC", "LBQ8kpyHBmnLbPJZ", "LBMHQ0zlL8C4SNT9", "LBf9d6bFprMBxBrK", "LB0NHbLXsNTZVjzy",
                 "LBFBq5RnZJg3mkXF", "LBfWQ2kxmrb7JvwZ", "LBK7K6Lcrnd7jtRL"],
        "form": {
            "id": "contact-form",
            "fields": [
                ("LBDZH9trsd15r4rD", "LBBYrgmDdwSkL5dt", "LBCz2WF6cRRFVfH4", {"tag": "input", "type": "text", "name": "name", "required": True, "autocomplete": "name"}),
                ("LB7jhWNphkTcsmhn", "LB2Kp8jWMwN1XhHr", "LBRBYVfk5R1XDhZ4", {"tag": "input", "type": "tel", "name": "phone", "required": True, "autocomplete": "tel"}),
                ("LBnmZmrdsyQ1qnvK", "LBKnSRNlb5F5Hkkk", "LBM69tzyTwyxtfyT", {"tag": "input", "type": "email", "name": "email", "required": True, "autocomplete": "email"}),
                # 想問的方案：選項 11/18 Ambre 確認；做成自己畫的下拉清單（固定高度、裡面捲動，不會拉出一整條超長的框）。11/18 Ambre：全部必填
                ("LBDJqVXwyb92RgQg", "LBy9y3phwwPh0T8Q", "LBCVxK5vywktxSgM", {"tag": "select", "name": "plan", "required": True, "options":
                    ["體驗潛水", "OW", "AOW", "OW＋AOW", "Fun Dive", "3 天 2 夜套裝", "住宿", "其他"]}),
                ("LB2sfSdvwKVBRF3V", "LBNRpGRdTTzNWjJv", "LBvDHf4PSJjpnMCJ", {"tag": "textarea", "name": "message", "required": True}),
            ],
            "check": ("LBtK8yZZjywRFDj2", "LBDgBsMVTL9JYQ6V", "agree"),
            "submit": ("LBk81ls7yY7ZwJf4", "LBgp81XgB2Whc7v9"),
            "msg": {"x": 403.4, "w": 830},  # 送出鈕右邊，垂直置中對齊送出鈕
        },
        # 「加 LINE 好友」按鈕（11/18 Ambre：聯絡我們那段 LINE 放最顯眼）：放在「聯絡我們」標題右邊，連 site.json 的 lineUrl
        "extraButtons": [
            {"x": 360, "y": 1311, "w": 190, "h": 50, "radius": 25, "bg": "#ec6b0c", "color": "#ffffff", "fs": 18,
             "label": "加 LINE 好友", "href": "site:lineUrl", "newTab": True},
        ],
        "overrides": {
            # 開場：橘色標題那一行 26px 粗體、下面說明 22px（Canva 同一個文字框兩種字級）
            "LBHYTVnZQPcWzF46": {"fs": 19.8, "fw": 400, "spans": [
                {"t": "綠芙The Reef 是由一位叫做KEN的元老級潛水教練所創立 \n", "c": "#ec6c0c", "fs": 23.4, "fw": 700},
                {"t": "他是一個60+老屁孩，關於大海的故事，絕對是你能遇過最豐富最多的人，畢竟有點年紀了，還想趁潛不動以前，再去一次世界各地探望以前那些厲害的潛點，所以他不一定會在島上（想他要預約）但一定在某個地方吐泡泡。", "c": "#12355b"}]},
            # KEN 條列：最後一行照 Canva 換行（字縮小後會擠成一行）
            "LBRs96Rzy11tlyxz": {"text": "從小在關島長大\n在菲律賓及澳洲長期教學\n\n中英台語多聲道\n30年以上的潛水教學資歷\n水下兇巴巴只是怕你會危險\n水上不正經基本是他的常態\n想去世界各地的潛點問他沒錯\n他是活字典。"},
            # Stay／Scuba／Tour 三欄連結
            "LBb1s8wgGsFvPNT3": {"href": "/stay/"},
            "LBbKySyHdPCbGWcd": {"href": "/courses/"},
            "LB94FGCLpjcMLcVc": {"href": "/trips/"},
            # 聯絡資訊一律讀 site.json（電話可點撥號；信箱、客服時間 null＝（待填））
            "LB6r9cQ56ntDPXSm": {"site": "contactLines"},
            "LBDK8z1bkGh8wgjf": {"site": "companyInfo"},
            "LB4xcClTbYPkMk0Y": {"links": [["在 Google 地圖開啟 →", "site:googleMapUrl"]]},
            # 「留言給我們or KEN」補空格
            "LB9Qh3WqWh0dc2Xh": {"text": "留言給我們 or KEN"},
            # 同意勾選：〈隱私權政策〉做成連結（另開分頁，表單填的字不會不見）
            "LBDgBsMVTL9JYQ6V": {"spans": [
                {"t": "我已閱讀並同意", "c": "#12355b"},
                {"t": "〈隱私權政策〉", "c": "#12355b", "href": "/privacy/", "newTab": True},
                {"t": "，同意綠芙用這些資料回覆我。", "c": "#12355b"}]},
        },
    },
}

# 三個條款頁（服務條款、隱私權、退款與停航）共用：右側目錄跟著捲動、〈…政策〉自動變連結
LEGAL_LINKS = {"〈服務條款〉": "/terms/", "〈隱私權政策〉": "/privacy/", "〈退款與停航政策〉": "/refund/"}


def toc_spans(lines, color):
    """目錄每一行連到該條（#t1、#t2…）"""
    out = []
    for i, t in enumerate(lines):
        out.append({"t": t, "c": color, "href": f"#t{i + 1}"})
        if i < len(lines) - 1:
            out.append({"t": "\n", "c": color})
    return out


PAGES["terms"] = {
    "canva": "terms-canva-elements.json",
    "title": "服務條款",
    "active": None,
    "textScale": 0.9,  # 全站規則（11/17 Ambre）：字級 ×0.9，位置、框寬不變
    "sections": [
        ("open", "開場", 0, 580),
        ("c1", "第 1–4 條", 580, 1320),
        ("c2", "第 5–9 條", 1320, 2110),
        ("c3", "第 10–13 條", 2110, 2770),
        ("closing", "還有其他問題？", 2770, 3040),
        ("footer", "頁尾", 3040, 4000),
    ],
    # 目錄點了跳到該條：標題上面留 40px
    "anchors": {f"t{i + 1}": round(y - 40) for i, y in enumerate([609.4, 768.1, 993.2, 1151.8, 1343.7, 1535.6, 1694.3, 1853.0, 2011.7, 2137.2, 2329.0, 2487.7, 2613.2])},
    "shared": {
        "open": [{"from": "open", "maxY": 140}],                 # 頁首：跟首頁同位置（Canva 這頁選單還有「聯絡」，全站已拿掉）
        "footer": [{"from": "footer", "dx": 35.6, "dy": 16.4}],  # 頁尾：Canva 這頁的頁尾是首頁舊版複本（整組往右、往下），用首頁那份；dx、dy 用像素量測對齊左欄
    },
    "skip": ["LBR7S9PnyPPK4HjL", "LBfzD2VxRlF0mGyG",
             "LBFhfblnYZNk9w2t", "LB6j44GPp3lZ06p5", "LBV1CtJNxnBG7jHF", "LB7CcJy7kXTjWkth", "LBq4f68s7JDtsxZB",
             "LBVnVlzSd01s80qc", "LB3Dqt9QGf7Yv3pY", "LBXCsZC1nLDhyXgd"],
    "keep": ["LBk3Yn14GsLGg9Gy"],  # 「最後更新：2026 年 11 月」是黃色，但不是設計標籤，是內容
    "autoLinks": LEGAL_LINKS,
    "autoLinksUnderline": ["〈退款與停航政策〉"],  # 11/18 Ambre：條文裡的〈退款與停航政策〉一直有底線（跟文字同色）；〈隱私權政策〉維持滑過才有
    # 右側目錄：Canva 上的白色卡片、分隔線、紅珊瑚、目錄文字一起跟著捲動（需求總表第 4 節），捲到「還有其他問題？」上面就停
    "sticky": [{
        "id": "toc", "label": "本頁目錄", "box": "LBGTjwr8NBd07yj8", "lines": ["LBwK4ZPPq1P2frht"],
        "imgs": [{"id": "LBSX3vZnbRPtk9G1", "file": "terms_coral", "alt": "", "box": [1229, 346, 171, 170]}],
        "members": ["LBTp9CBCd778jnz1", "LByXL1nwHM05vc8b", "LBJjjbwBLsbFNCNX"],
        "until": 2760, "top": 16,
    }],
    "overrides": {
        # 11/18 Ambre 條文更新圖（docs/compare/terms/_Ambre_11-18_條文更新.webp）：11/19 照圖改
        "LBk3Yn14GsLGg9Gy": {"text": "最後更新：2026 年 11 月"},
        "LBpbkLrMbXwgMV7v": {"text": "預訂前請先讀這一頁，這裡說明你和綠芙雙方的權利與責任。"},
        "LBqx79KDNQ71VLcv": {"text": "本條款適用於你在綠芙 The Reef 網站預訂的潛水課程、住宿、3 天 2 夜套裝和島上行程。\n完成預訂，代表你已閱讀並同意本條款、〈隱私權政策〉和〈退款與停航政策〉。"},
        "LB7CpwCjV5n2sTQp": {"text": "送出預訂並完成付款（PAYUNi 統一金流、銀行匯款或 PayPal）後，我們會寄確認信給你，訂單才算成立。\n如果遇到客滿、價格標示錯誤或其他無法提供服務的情況，我們會主動通知你，並全額退款。"},
        "LBR7HBpb5zk4wVqG": {"text": "網站價格以新台幣計算。付款可用 PAYUNi 統一金流、銀行匯款或 PayPal，可用的方式以付款頁為準；PayPal 扣除的手續費差額，請到現場以現金補齊。套裝內容、加購項目和額外費用（例如單人加價、升等房型），以預訂時頁面顯示的內容為準，綠島為免稅區域，不另開發票。"},
        "LBC8tLD02Jx4hTnt": {"text": "參加潛水課程或體驗前，請誠實填寫 PADI 健康問卷；問卷中有需要醫師評估的項目時，請先取得醫師同意。未滿 18 歲的參加者需要法定代理人同意；各課程的最低年齡依 PADI 規定，例如：體驗潛水為 10 歲。懷孕、近期動過手術或有心肺疾病的人，請先和我們聯絡。"},
        "LBY179B2jHKSxcJB": {"text": "入住和退房時間：下午3點後入住，隔天中午12點前退房。請愛惜房間和公共設備；因故意或過失造成損壞，需依實際修復費用負責。"},
        "LBSf4JrFKXDHqCl7": {"text": "潛水是一項有風險的活動，綠芙為全數水上活動投保責任保險，你也可以依自己的需要另外投保旅遊平安險。因綠芙的過失造成你的損害，我們依法負責；因參加者未遵守安全規定或隱瞞健康狀況造成的損害，依法減輕或免除綠芙的責任。"},
        "LBBnmsGwvwtbZtWS": {"text": "教練可能在活動中拍攝照片或影片，讓你留念。如果要把能認出你的照片用在官網或社群，請在下水前與教練溝通，也可以事先購買明信片寫好至海底信箱投遞。"},  # 圖上寫「投地」，錯字，改「投遞」
        "LBvBM3XsJTPBlvY0": {"text": "綠芙保有更新本條款的權益，更新後將公布在本頁並標示日期。已成立之訂單，適用下單當時的條款。"},
        "LB20qVqxDNk9Bry9": {"site": "operator"},                        # 經營者資訊：讀 site.json
        "LBJjjbwBLsbFNCNX": {"site": "askPhone", "pre": "有疑問？"},       # 目錄下面：電話可撥號
        "LBL14qQxcl13Bx1v": {"site": "askLine", "pre": "對條款有疑問，", "end": ""},  # 還有其他問題？：電話、信箱讀 site.json；11/18 圖上信箱後面沒有句號
        # 目錄清單：字縮小 0.9 但每一行的位置照 Canva（行距 29.3px 不縮），清單才會剛好排到分隔線上面
        "LByXL1nwHM05vc8b": {"lh": 2.083, "y": 494.1, "spans": toc_spans(["1 適用範圍", "2 經營者資訊", "3 預訂與訂單成立", "4 價格與付款", "5 參加資格與健康", "6 安全規定",
                                                 "7 天候與停航", "8 住宿規範", "9 裝備使用", "10 保險與責任", "11 照片與影像", "12 條款修改", "13 準據法與管轄"], "#12355b")},
        "LBncY3BCBfMbsdFq": {"spans": [{"t": "隱私權政策 →", "c": "#ec6c0c", "href": "/privacy/"}, {"t": "\n", "c": "#ec6c0c"},
                                       {"t": "退款與停航政策 →", "c": "#ec6c0c", "href": "/refund/"}]},
    },
}


PAGES["privacy"] = {
    "canva": "privacy-canva-elements.json",
    "title": "隱私權政策",
    "active": None,
    "textScale": 0.9,  # 全站規則（11/17 Ambre）：字級 ×0.9，位置、框寬不變
    "sections": [
        ("open", "開場", 0, 520),
        ("c1", "第 1–3 條", 520, 1210),
        ("c2", "第 4–6 條", 1210, 1880),
        ("c3", "第 7–10 條", 1880, 2640),
        ("closing", "想查詢或刪除你的資料？", 2640, 2840),
        ("footer", "頁尾", 2840, 3800),
    ],
    "anchors": {f"t{i + 1}": round(y - 40) for i, y in enumerate([557.8, 772.5, 1055.8, 1236.2, 1519.5, 1734.2, 1914.5, 2094.9, 2275.2, 2421.2])},
    "shared": {
        "open": [{"from": "open", "maxY": 140}],                 # 頁首：跟首頁同位置（Canva 這頁選單還有「聯絡」，全站已拿掉）
        "footer": [{"from": "footer", "dx": 7.45, "dy": 12.1}],  # 頁尾：Canva 這頁的頁尾是首頁舊版複本，用首頁那份；dx、dy 用像素量測對齊左欄
    },
    "skip": ["LB5ZnYjRz316jkpb", "LBTgYjgcT4TcxNPF",
             "LBtTMyldXbfk41Bm", "LBgbLq8q6wlkd0hQ", "LByFWjyNgw1t2v4G", "LBPQR54dv8j7KJTw", "LBFSMRjkPZr1HsYj",
             "LBqjhQzw9MPJzByp", "LBWg5417YV1BW3YZ", "LBD1vChFMT92fggq"],
    "autoLinks": LEGAL_LINKS,
    # 右側目錄：白卡、分隔線、海星、目錄文字一起跟著捲動；捲到右下角珊瑚插圖上面就停（不蓋到珊瑚）
    "sticky": [{
        "id": "toc", "label": "本頁目錄", "box": "LBn2RDcT65vYnd6b", "lines": ["LBsSLcbNN3bz6PzW"],
        "imgs": [{"id": "LBKCtsR4CySFqZ0Q", "file": "privacy_star", "alt": "", "box": [1255, 535, 96, 96]}],
        "members": ["LBnJrB0C6GSHRBml", "LBkYfHfxw1PqN0vR", "LBy5sjrZYxFS5mSV"],
        "until": 2215, "top": 79,
    }],
    "overrides": {
        # 11/18 Ambre 回覆：11/19 改
        "LBBj6Pt2KdhyNpJ7": {"text": "最後更新：2026 年 11 月"},
        "LBnlPyllz6CpH6lw": {"text": "綠芙只蒐集「提供服務所需」的資料，並妥善保管，這一頁將說明細節。"},
        "LB5v7M095jYbj3BM": {"text": "提供和管理你預訂的課程、住宿與行程；辦理保險；申請 PADI 潛水證照；聯絡與客服；記帳；分析網站使用狀況、改善服務。"},
        "LBpCc0hcJVzbyM8P": {"site": "contactWindow"},                                   # 聯絡窗口：讀 site.json
        "LBy5sjrZYxFS5mSV": {"site": "askPhone", "pre": "有疑問？"},                       # 目錄下面：電話可撥號
        "LBSFxG3Vlfk7cd7j": {"site": "askLine", "pre": "", "post": "，告訴我們你的姓名和訂單編號"},  # 電話、信箱讀 site.json
        # 目錄清單：字縮小 0.9 但每一行的位置照 Canva（行距不縮）
        "LBkYfHfxw1PqN0vR": {"lh": 2.083, "y": 630.5 - (2.083 - 1.2) * 16.156 * 0.9 / 2 - 0.9, "spans": toc_spans(["1 適用範圍", "2 我們蒐集的資料", "3 使用目的", "4 利用期間與對象", "5 你的權利",
                                                 "6 不提供的影響", "7 Cookie", "8 資料安全", "9 政策修改", "10 聯絡窗口"], "#12355b")},
        "LBCvT42HV427v1X1": {"spans": [{"t": "服務條款 →", "c": "#ec6c0c", "href": "/terms/"}, {"t": "\n", "c": "#ec6c0c"},
                                       {"t": "退款與停航政策 →", "c": "#ec6c0c", "href": "/refund/"}]},
    },
}


# 退款頁表格：字縮小 0.9 但每一列的位置照 Canva（行距 2.2 → 2.2 ÷ 0.9，不縮），右欄（退款比例）右緣對齊 Canva（文字框寬 +4 的部分往左移回來）
def _row_fix(top, fs=19.67683839718186, lh=2.2, sc=0.9):
    lhn = lh / sc
    return {"lh": round(lhn, 4), "y": round(top - (lhn - 1.2) * fs * sc / 2, 1)}


PAGES["refund"] = {
    "canva": "refund-canva-elements.json",
    "title": "退款與停航政策",
    "active": None,
    "textScale": 0.9,  # 全站規則（11/17 Ambre）：字級 ×0.9，位置、框寬不變
    "sections": [
        ("open", "開場", 0, 520),
        ("c1", "第 1 條 天候與停航", 520, 880),
        ("c2", "第 2 條 只訂住宿", 880, 1330),
        ("c3", "第 3 條 課程與套裝", 1330, 1880),
        ("c4", "第 4–5 條", 1880, 2380),
        ("closing", "需要改期或退款？", 2380, 2640),
        ("footer", "頁尾", 2640, 3600),
    ],
    "shared": {
        "open": [{"from": "open", "maxY": 140}],                 # 頁首：跟首頁同位置（Canva 這頁選單還有「聯絡」，全站已拿掉）
        "footer": [{"from": "footer", "dx": 34.8, "dy": 18.3}],  # 頁尾：Canva 這頁的頁尾是首頁舊版複本，用首頁那份；dx、dy 用像素量測對齊左欄
    },
    "skip": ["LB4FL7gHvbM0T5HF", "LBrJ1NrjbpFF2DMR",
             "LBjf4PZFQW93wH47", "LBwRmxDm89zJXNlp", "LBvjY0WMf9mS4k73", "LB3cqxHGDyJNjTkK", "LBVBF2nYNqgyWg6B",
             "LBLXXZM98xSpkCr0", "LBkZPwDGcTBjdmnr", "LBn2lw0p79JpZC2W",
             "LBmJkfy6HXFdmBRM"],  # 11/19 Ambre 文字修改：整句刪掉「也可以選擇不退款，把已付金額保留 1 年，折抵之後的住宿。」
    "autoLinks": LEGAL_LINKS,
    "overrides": {
        "LByjlfqcdqtfKytN": _row_fix(1086.3534125935694),
        "LB1xdspvPbXjJ2Y6": dict(_row_fix(1086.3534125935694), x=902.4),
        "LBxgkx7n9q8stbLQ": _row_fix(1535.8138265081443),
        "LBgB8t3nxwJTB3qZ": dict(_row_fix(1535.8138265081443), x=902.4),
        "LBNBz0czMDNDXLkY": {"x": 902.4},
        "LBYgK7c8yDFC4YB1": {"x": 902.4},
        # 第 1 條天候與停航｜11/19 Ambre 文字修改：①「會先扣除並提供單據」拿掉「並提供單據」②「回程船班停航、需要延長住宿時」句改成「…，每天的住宿有半價優惠。」（保留條件句，Ambre 11/19 確認）
        "LB2GnCz9ZZzDVn2t": {"text": "・出發前遇到颱風、海象不佳、船班停航，或主管機關公告停止活動，我們會主動聯絡你。你可以選擇免費改期，或退款。\n・行程中因天候停航或無法下水，未進行的部分可以改期或退款。\n・已代購且無法退回的費用（例如已出票的船票），會先扣除。\n・回程船班停航、需要延長住宿時，每天的住宿有半價優惠。"},
        # 第 3 條課程與套裝｜改期那句｜11/19 Ambre 文字修改：拿掉「（改期規則待業主確認）」括號，其餘不變
        "LBMkC6zkqmjtsg5t": {"text": "改期：出發前請盡早聯絡我們，依船班和名額安排。"},
        # 第 5 條申請方式：「加入LINE」橘色粗體、點了開 LINE（讀 site.json 的 LINE 網址）；信箱讀 site.json、可寄信（Ambre 11/18 已在 Canva 改好這段文字）
        "LBxY8mwCGqFJRRBp": {"site": "refundApply", "pre": "・信用卡付款：退回原信用卡，入帳時間依發卡銀行作業。\n・ATM 轉帳、銀行匯款：退到你提供的帳戶。\n・PayPal：退回原 PayPal 帳戶。\n・作業時間：確認退款後七個工作天內處理。\n・申請方式："},
        "LBm9fRRCyRzpp3rn": {"site": "askLine", "pre": "", "post": "，告訴我們訂單編號"},
        "LBPF2mjTRc9cbxdQ": {"spans": [{"t": "服務條款 →", "c": "#ec6c0c", "href": "/terms/"}, {"t": "\n", "c": "#ec6c0c"},
                                       {"t": "隱私權政策 →", "c": "#ec6c0c", "href": "/privacy/"}]},
    },
}
