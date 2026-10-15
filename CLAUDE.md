# Focus Island（像素風線上自習室）——前端

> 這份每個 session 都會整份載入，**只放每次都用得到的東西**。各功能怎麼串起來的細節在 `docs/ARCHITECTURE.md`（要動哪一塊再 grep）；
> 現在的狀態在 `HANDOFF.md`——**接手先讀它**；要交接／接手照下面「交接公式」。

Quasar（Vue 3 + TS、`<script setup>`）SPA，部署在 Vercel（https://focus-island.huangyanming.com）。Pinia，Tailwind v4 跟 Quasar 並用。
後端是另一個 repo `COMEANC13-backend`（Go，跑在 Koyeb）。

## 文件地圖

| 檔案 | 內容 | 什麼時候讀 |
|---|---|---|
| `HANDOFF.md` | 現在的狀態（固定 7 段、≤100 行） | **每次接手先讀** |
| `docs/ARCHITECTURE.md` | 各功能怎麼串起來（選位連線、身分、像素場景、戶外地圖、F1、載具、音效、一起專注、專注幣、Google 登入、計時…） | **動某一塊之前 grep 那一段** |
| `WS_SECURITY_FLOW.md` | 連線流程：REST 快照 → 短效 token → WebSocket | 動連線／WS 訊息前 |
| `README.md` | 對外的專案介紹（功能、架構圖、截圖） | 使用者要改介紹時；加了大功能要提醒他更新 |
| `docs/HANDOFF_ARCHIVE.md` | 過期的交接段落 | 要查某天發生什麼時 grep |

## 交接公式

- **接手**：說「接手」或 `/takeover`（`.claude/skills/takeover/`）——只讀 `HANDOFF.md`、對版本、看網站狀態，回報一段摘要。
- **交接**：說「交接」或 `/handoff`（`.claude/skills/handoff/`）——`HANDOFF.md` 照固定格式**整份改寫**、細節接到
  `docs/HANDOFF_ARCHIVE.md` 最上面、commit＋push。
- Claude 的記憶是每台機器各自的；要跨機器生效的規則寫進這份。

## 指令

```bash
npm run dev            # quasar dev（網址印在終端機）
npm run build          # 輸出到 dist/spa
npm run lint
npx vue-tsc --noEmit   # 型別檢查（沒有測試）
```

需要 Node 22.12 以上。環境變數（`.env.local`／Vercel）：`VITE_BACKEND_API_URL`、`VITE_BACKEND_WS_URL`
（沒設時 WebSocket 連 `ws://localhost:8080`，REST 從它推出 `http://`）。

**部署**：push 到 `master` → Vercel 自動部署（GitHub 整合；本機沒有 `.vercel` 連結，沒辦法用指令看部署狀態）。
push 完過一兩分鐘**到網站實際看一次**才算部署好。後端改動要去 `COMEANC13-backend` 那個 repo 做（它有自己的文件）。

## 鐵律（改壞了別人馬上看得到）

1. **座位順序不能動**：座位編號 NN ↔ 地圖上的 slot 順序。只能在**最後面加**，而且要同時把後端的 `seatsPerZone` 加大
   （現在每個分區 88 個：圖書館 18、101 6、動物園 6、夜市 12、海灘 8、F1 看台 22、環河公園 16；環河公園是最後一塊，要加座位加在它後面）。
2. **同一個人開兩個分頁可以各坐一個位子**（座位是「分頁」擁有的），不要加單一分頁的鎖。
3. **座位只有換位子或斷線才會放掉**（沒有「離開」訊息）。站起來只是座位變成保留中。
4. **WebSocket 訊息種類、表情清單都是跟後端對好的**（後端只收固定幾種、表情是 `EMOTE_IDS` ↔ 後端 `allowedEmotes`）。
   要加新的訊息種類或表情，後端要先改，不然會被斷線。
5. `WidgetPage.vue`（給別的網站用 iframe 嵌入）共用 `FocusClockPanel`＋`AmbientAudioPlayer`——這兩個元件**不能用固定定位**。
6. 戶外的路人／動物／計程車、沙灘上曬太陽的人、`demo_` 機器人**都不是真的使用者**，是用時間算出來的裝飾；載具是每個瀏覽器自己的、不共享。
   不要為這些加伺服器狀態或網路訊息。
7. **這個 GitHub repo 是公開的**：文件、commit 訊息不要寫機密，也不要寫其他專案或機器的內部細節。機密不印出來（`.env.local`）。`useAccount.ts` 裡的 Google OAuth Client ID 是公開的值，可以進 repo。

## 使用者的規則（跟他其他專案一樣）

- **一律用中文（繁體）**，包括做事中間的進度回報。
- **回覆要短**：先講結論跟要他做什麼，細節放後面。
- **他交代的事，做得到的就直接做**，不要列步驟叫他做、不要一項一項問；只有要他的帳號才做得到的（Vercel／Koyeb／Google 後台）才請他動手。
- 畫面醜他會在意；這個專案本來就是做給人看的，美術跟手感優先。

## 一定會踩的坑

- Quasar 的 `.flex` 會順便設 `flex-wrap: wrap`——要維持一行的列加 `!flex-nowrap`。
- **Quasar 的全域 CSS 會蓋過 Tailwind**（Tailwind v4 有分層、Quasar 沒有）。`hidden`、`flex`、`h1`～`h6`／`p` 上的字級都會被蓋掉——
  用 `!`（`md:!hidden`、`!text-sm`、`dark:!text-white`）或 `hide-below-sm`。`dark:` 跟的是 Quasar 的 `body--dark`。
- **像素風 UI**：`src/css/app.scss` 有 `pixel-panel`／`pixel-btn`／`pixel-field`／`pixel-track` 跟 `--px-*` 顏色（`body.body--dark` 下會重新定義）；
  `font-pixel` 是 Silkscreen（只有英數）。這些沒有分層，同一個元素上不要再疊 Tailwind 的 `bg-`／`border-`／`shadow-`。
- 本機沒開後端：座位照樣用預設值畫出來；樓梯要 `GET /api/v1/library/floors` 有回應才會出現（要看樓梯就在 :8080 mock 那支）。
- 地圖有**負座標**（圖書館在 (0,0) 起，101 在 x<0、夜市在 y<0）；靜態底圖是平移原點畫的，動鏡頭／小地圖／光影要用 world 的範圍。

## 程式在哪（細節 grep `docs/ARCHITECTURE.md`）

- `src/pages/IndexPage.vue`：主頁（選位、連線流程、底部工具列）。連線在 `pages/index/composables/useLibrarySocket.ts`＋`pages/index/actions/`。
- `src/pages/index/components/SeatScenePixel.vue`：像素場景（畫圖、移動、入座、載具、打招呼、小地圖）；`F1Scene.vue`：F1 賽車場。
- `src/pages/index/pixel/`：`pixelMap.ts`（座位、家具）、`pixelWorld.ts`（戶外：101、動物園、夜市、攤位）、`pixelArt.ts`（美術）、`pixelThemes.ts`（分區主題）。
- `src/pages/index/composables/seatNavigation.ts`：碰撞＋A* 尋路（純邏輯）。
- `src/composables/`：`useAmbientAudio.ts`＋`synthAmbience.ts`（音樂、環境音）、`groupFocus.ts`（一起專注）、`usePlayerPrefs.ts`（偏好、外觀、專注幣）、
  `useAccount.ts`（Google 登入、跨裝置同步）、`focusNotify.ts`（瀏覽器通知）。
- `src/stores/pomodoro.ts`＋`src/workers/timer.worker.ts`：番茄鐘（計時跑在 Web Worker）。
- `src/pages/ProgressPage.vue`、`SettingsPage.vue`、`WidgetPage.vue`；`src/layouts/MainLayout.vue`。

## 方向

美術參考 Gather（2D 像素，不是 3D）。優先用 CC0 素材；沒有就照 Kenney 的色盤用程式畫。
