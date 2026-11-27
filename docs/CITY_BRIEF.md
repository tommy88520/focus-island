# 新城市地圖：共用規格（每個助手都要先讀完）

> 這份是派助手畫新城市時給的規格。開工前要先暫時加回：佔位的 `pixel/cityStub.ts`（讓型別先過）和 `CityScene.vue` 的除錯開關（`window.__cityScale`／`__cityNight`／`__me`），做完都拿掉。寫法見 2026-11 出國那批的 git 歷史（`3c45b2b`）。一次最多開 1–2 個助手（使用者的電腦撐不住）。

專案：focus-island repo 根目錄（Quasar + Vue 3 + TS，像素風線上自習室 Focus Island）。
城市地圖是「獨立地圖」，全部共用 `src/pages/index/components/CityScene.vue` 的玩法；每個城市 = 一份資料 `pixel/<id>.ts` ＋ 一份美術 `pixel/<id>Art.ts`。
現在 `pixel/<id>Art.ts` 是佔位用的 stub（`stubCity(...)`），你要把它整份換成真的地圖。

## 一定要先讀的範本（照著它的寫法）
- `src/pages/index/pixel/city.ts`：`CityDef` 等型別（只讀，不要改）。
- `src/pages/index/pixel/kobe.ts` ＋ `kobeArt.ts`：最接近的完整範本（資料／美術分開、座位、攤子、地標介紹、名牌、路人、車流、晚上的燈）。
- `src/pages/index/pixel/cityArt.ts`：共用畫法（`T`、`text`、`glow`、`cached`、`blit`、`road`、`tiles`、`zebra`、`drawBench`、`drawFoodCart`、`drawMarketTable`、`drawStool`、`drawStringLights`、`drawArch`、`drawStoneBench`、`drawPalm`、`drawSeaWaves`、`drawStreetTree`、`drawLamp`、`townhouseSprite`…）。
- 日式共用：`kyotoArt.ts` 匯出 `tiledRoof`、`drawLantern`、`drawWillow`、`drawMaple`、`drawStoneLantern`、`drawStreetLamp`；`osakaArt.ts` 匯出 `drawSakura`。
- 有抽籤（`fortune`）的範例：`kyotoArt.ts`、`tokyoArt.ts`（grep `fortune:`）。
- 小吃已經定義好了：`src/pages/index/pixel/cityItems.ts` 裡的 `<CITY>_ITEMS`（例如 `NARA_ITEMS`），直接 import 用，**不要改 cityItems.ts**。

## 只能動的檔案
- 只寫你自己的 `pixel/<id>.ts`（新檔）和 `pixel/<id>Art.ts`（覆蓋 stub）。
- **不要改任何其他檔案**（city.ts、cities.ts、cityItems.ts、CityScene.vue、pixelWorld.ts…都不行）——其他助手同時在改別的城市。需要共用的畫法就從別的 Art 檔 import（不要改它們），或在自己的檔案裡寫一份。
- `cached()` 的 key 一定要用你城市專屬的前綴（例如奈良 `nr-`），免得跟別的城市撞。
- 匯出的常數名稱和 `id`、`country`、`line`、`emoji` 跟 stub 裡的一樣（cities.ts 已經 import 它）。

## 硬規則
- **座位剛好 12 個**（`seats` 陣列順序 = 座位編號，你的編號範圍寫在任務裡）。座位是這張地圖的重點：這是線上自習室，每張地圖都是「另一個可以坐下來專注的地方」。座位要放在好看、有氣氛的地方（看風景的長椅、店裡的桌子、屋台的吧台…），坐下去的人不能被建築擋住、也不能卡在擋路的格子裡。
- 地圖大小大約 W 52–60、H 40–46 格（1 格 16px）。北邊通常是遠景（天空、山、天際線），往南是街區、廣場、水邊。
- 一定要有：車站 `station`（站到旁邊跳出搭車面板；名字照任務）、2–4 個賣任務指定小吃的攤子／店（`shops`）、5–7 個地標介紹（`infos`，繁中＋英文，寫真的歷史知識；取景有簡化的地方要在介紹裡誠實說明）、名牌 `labels`（標出座位區）、路人 `walkers`、車流 `traffic`（有馬路的話）、晚上的燈 `lights`、`hintDesktop`／`hintTouch`（照 kobe 的格式寫）。
- `solid` 擋路要正確：建築、水、牆不能走進去；但座位、攤子前面、車站前面一定要走得到。用 `blocked` 處理不規則形狀（可選）。
- 會動的東西（車、船、纜車、噴泉、煙火…）用 `d.seconds` 算（每個人看到一樣），不要用 Math.random 在每幀畫；超出地圖的要 clip。
- 晚上（`d.night`）燈要亮、霓虹要閃；城市夜景要好看。
- 美術要精緻、像實景：有名的地標一定要畫，而且一眼認得出來。畫面醜使用者會直接說「好醜」要重做。
- **不要畫商標、品牌 logo、受版權保護的角色**（像固力果跑跑人、迪士尼角色、可口可樂、賭場品牌名都不行）；看板用通用的圖案或自己編的字。地標建築（鐵塔、橋、寺廟、城堡）可以畫。
- 文字：繁體中文＋英文兩種（`Text2`）。程式註解用繁體中文，寫法參考 kobe。
- 不要寫測試。不要 commit、不要 push、不要部署。

## 檢查（做完一定要做）
1. 型別：在 repo 根目錄跑 `npx vue-tsc --noEmit 2>&1 | grep '<id>'`（別人的檔案可能暫時有錯，只看你的；跑一次要 1–2 分鐘，不要一直跑）。
   Lint：`npx eslint src/pages/index/pixel/<id>.ts src/pages/index/pixel/<id>Art.ts`。
2. 截圖（開發伺服器在 http://localhost:9000，**不要自己再開或關掉它**）：用 chrome-devtools MCP 工具（先用 ToolSearch 載入 `select:mcp__chrome-devtools__new_page,mcp__chrome-devtools__navigate_page,mcp__chrome-devtools__take_screenshot,mcp__chrome-devtools__evaluate_script,mcp__chrome-devtools__emulate`）。
   - **一定要開自己的分頁**：`new_page`（`url: http://localhost:9000/`、`background: true`、`isolatedContext: '<id>'`），記住回傳的 pageId，之後每個呼叫都帶這個 `pageId`；別的助手也在同一個瀏覽器，不要碰別人的分頁、不要用 select_page。
   - 進到你的地圖：`navigate_page`（`pageId`、`type: 'reload'`、`initScript: "localStorage.setItem('focus_island_scene_v1', JSON.stringify({scene:'<id>', x: <站附近x>, y: <站附近y>, seated:false, at: Date.now()})); window.__cityScale = 0.6; window.__cityNight = false;"`）。等 2–3 秒再截圖。
   - 本機有暫時的除錯開關：`window.__cityScale`（畫面倍數，0.5–0.7 看整張、2–3 看近景）、`window.__cityNight`（true 看晚上）、`window.__me`（玩家，可以改 `__me.x`、`__me.y` 瞬移鏡頭）。可以用 `evaluate_script` 直接改，不用重新載入。
   - 要看：整張白天、整張晚上、2 倍近景逐區（每個地標、座位區、攤子、車站）、手機（`emulate` `viewport: '390x844x3,mobile,touch'`，看車站面板、店的面板會不會爆版）。
   - 用 `evaluate_script` 走到攤子、車站旁邊（改 `__me`），確認會跳出面板；確認座位能點、坐下去不會被擋。
   - 截圖直接看（不要存檔一大堆）。看到醜的、重疊的、超出地圖的、名牌壓到東西的，就修，再截一次。
   - 檔案改了 Vite 會熱更新；有時候要重新 reload 才會用新的 sprite（`cached` 有快取）。
3. 做完回報（給我看的，短）：地圖上有什麼（地標、座位在哪、攤子）、取景簡化了什麼、你自己看到但沒修好的問題。
