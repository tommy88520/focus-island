# Focus Island（像素風線上自習室）——前端

> 每個 session 都整份載入，只放每次都用得到的。現況在 `HANDOFF.md`（**接手先讀**）；功能細節 grep `docs/ARCHITECTURE.md`；
> 過去的交接 grep `docs/HANDOFF_ARCHIVE.md`；連線流程 `WS_SECURITY_FLOW.md`；對外介紹 `README.md`（文字使用者決定）。

Quasar（Vue 3 + TS、`<script setup>`）SPA＋Pinia，Tailwind v4 跟 Quasar 並用。正式網址 https://focus-island.huangyanming.com 。
後端是另一個 repo `COMEANC13-backend`（Go，私人），後端改動去那邊做。

- **接手**：「接手」／`/takeover`；**交接**：「交接」／`/handoff`（`.claude/skills/`）。Claude 的記憶每台機器各自的，跨機器的規則寫這份。
- 版號：`package.json` 的 version（頁面左側選單顯示），發版 bump＋`git tag vX.Y.Z`。
- 指令：`npm run dev`、`npm run build`（→ `dist/spa`）、`npm run lint`、`npx vue-tsc --noEmit`（沒有測試）。Node 22.12+。
  環境變數 `VITE_BACKEND_API_URL`、`VITE_BACKEND_WS_URL`（`.env.local`；沒設連 `ws://localhost:8080`）。
- **部署**：前後端都在維護者自己的機器上（Cloudflare Tunnel）。**push 不會自動上線**，要跑部署腳本——在後端 repo `deploy/home/README.md`
  （這份公開 repo 不寫機器細節）。部署完到網站實際看一次。沒有備援主機（Vercel 10-16 已刪），壞了就 revert 再部署。

## 鐵律
1. **座位順序不能動**：編號 NN ↔ 地圖 slot 順序，只能加在最後面，同時加大後端 `seatsPerZone`。
   現在每區 162：圖書館 18、101 6、動物園 6、夜市 12、海灘 8、F1 22、環河公園 16、北投溫泉 16、F1 月台長椅 6、台北／台中／高雄大獎賽看台各 12、基隆廟口夜市 16（最後一塊）。
2. 同一人兩個分頁可以各坐一個位子（座位屬於分頁），不要加單分頁鎖。
3. 座位只有換位子或斷線才放掉（沒有離開訊息），站起來只是保留中。
4. WS 訊息種類、表情（`EMOTE_IDS` ↔ 後端 `allowedEmotes`）跟後端對好，加新的要後端先改。
5. `WidgetPage.vue` 共用 `FocusClockPanel`＋`AmbientAudioPlayer`，這兩個**不能用固定定位**。
6. 路人、動物、計程車、海灘遊客、`demo_` 機器人都是用時間算的裝飾；載具每個瀏覽器自己的。不要為它們加伺服器狀態或訊息。
7. **repo 是公開的**：文件、commit 不寫機密、不寫其他專案或機器的細節。Google OAuth Client ID 是公開值，可以進 repo。

## 使用者的規則
- 一律繁體中文（含進度回報）；回覆短，先講結論和要他做什麼。
- 交代的事做得到就直接做，不要列步驟叫他做；只有要他帳號的（Cloudflare、Google 後台）才請他動手。
- **每個新功能都要顧手機版**（他常用 iPhone，~375–402px 寬）：面板、按鈕列不能爆版或擠成一排，觸控目標夠大，
  不能只有 icon 沒字；做完用手機尺寸實際截圖看過再交。不要等他提醒。
- 美術跟手感優先，畫面醜他會在意。新地圖要做精緻：參考實景的地標、有名的店家都要有，做完用截圖逐區看過（遠景＋近景＋手機）。**不要為了功能改掉既有的美術**，要讓人注意到就加提示（牌子、名牌）。
- 他回報 bug 會錄影放在 `~/Desktop/截圖/`。

## 坑
- Quasar `.flex` 會加 `flex-wrap: wrap`，一行的列加 `!flex-nowrap`。Quasar 全域 CSS 蓋過 Tailwind：`hidden`、`flex`、標題字級要用 `!`
  （`md:!hidden`、`!text-sm`）；`dark:` 跟 Quasar 的 `body--dark`。
- 像素 UI：`app.scss` 的 `pixel-panel／btn／field／track`＋`--px-*` 顏色，同一元素不要再疊 Tailwind 的 `bg-／border-／shadow-`；`font-pixel` 只有英數。
- 本機沒後端：座位用預設值畫；樓梯要 `/api/v1/library/floors` 有回應才出現。
- 地圖有負座標（101 x<0、夜市 y<0），鏡頭／小地圖／光影用 world 範圍。

## 程式在哪
- `pages/IndexPage.vue` 主頁；連線 `pages/index/composables/useLibrarySocket.ts`＋`actions/`。
- 場景：`SeatScenePixel.vue`（主地圖）、`F1HubScene.vue`（F1 月台：選賽道）→ `F1Scene.vue`／`GrandPrixScene.vue`（台北台中高雄，賽道 `pixel/circuits.ts`＋`gpTrack.ts`、城市 `gpCity.ts`、地標 `gpArt.ts`、月台 `hubArt.ts`）、`MiaokouScene.vue`（基隆廟口夜市，資料 `pixel/miaokou.ts`、美術 `miaokouArt.ts`）、`RiverParkScene.vue`、`BeitouScene.vue`、`HomeScene.vue`（自己的家）；獨立地圖的 scene id 在 `sceneRemotes.ts` 的 `MAP_SCENES`（跟後端 allowedScenes 對好）；`pixel/`：`pixelMap`（座位家具）、`pixelWorld`（戶外）、`pixelArt`、`pixelThemes`；
  `seatNavigation.ts`（碰撞、A*）。
- `composables/`：`useAmbientAudio`＋`synthAmbience`（音樂）、`useYouTubeTv`（YouTube）、`usePlayerPrefs`、`useAccount`（Google 登入）、`groupFocus`。
  分享位置 `pages/index/shareLocation.ts`。番茄鐘 `stores/pomodoro.ts`＋`workers/timer.worker.ts`。

美術參考 Gather（2D 像素）；優先 CC0 素材，沒有就照 Kenney 色盤用程式畫。
