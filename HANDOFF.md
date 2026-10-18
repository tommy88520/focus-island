# 交接（2026-10-18——v1.6.0 一起看 YouTube）

> 固定 7 段、整份改寫、**≤4KB**。細節、使用者原話在 `docs/HANDOFF_ARCHIVE.md`（grep）。步驟見 `.claude/skills/`。

## 1. 版本
- **v1.6.0**：程式最後一次改動 `a3dfbd9`（10-18），已部署在家機、網站 200。版號在 `package.json`，發版 bump＋`git tag`。
- 後端最後一次程式改動 `98ad4d0`（WATCH 訊息），已部署。
- **push 不會自動上線**，要跑部署腳本（`CLAUDE.md`「部署」）。換電腦開工先 `git pull`，`package-lock` 有變就 `npm install`。

## 2. 進行中
- 無。

## 3. 等使用者決定／下一步
1. 一起看 YouTube 只在同房間（樓層＋分區），朋友來家裡時不行；要不要做到家裡等他說。
2. 客製化給付費用戶：目前只能在家機下 SQL 改 `users.perks`（id 3＝他朋友，villa）。要後台或接儲值再做；Ko-fi 是現在的贊助入口。
3. 他之前用 cron-job.org 叫醒 Koyeb；家機不需要。問他那個排程打哪個網址再決定要不要停。
- Redis Cloud 換密碼：他說先不用、記著。

## 4. 下次要看
- **一起看 YouTube 實際用**：他和朋友同一區，一人放影片按「邀請同房間一起看」，另一人按「一起看」。本機兩個瀏覽器測過邀請、跟看（差 <1 秒）、暫停／播放、停止分享、手機寬度；沒在真 iPhone 上測過。
- **他和朋友重新整理後再互訪一次**：兩邊要看到彼此（走路、坐書桌、躺床右邊枕頭）。屋主那邊「訪客躺右枕頭」沒親眼看過。
- iPhone 上名牌（「躺一下」等有 emoji 的）有沒有還超出框；不行就名牌全部不放 emoji。
- 朋友對新玫瑰（一枝枝、沒底座）滿不滿意。
- 「登入很容易被清掉」還沒抓到：伺服器沒有 401 紀錄。現在被登出會跳提示、後端記原因；請他回報裝置＋Safari 還是主畫面 App。
- 過場動畫的樓梯、小島載入沒逐一截圖看過。

## 5. 使用者新規則（原話在存檔）
- 每個新功能都要顧手機版；按鈕不能只有圖示。回覆一律中文（最後總結也是）。
- 回報 bug 會放截圖／錄影在 `~/Desktop/截圖/`，iPhone 截圖可能在 `~/Downloads/`；ffmpeg 壞了，用 Swift 抽影格。

## 6. 最近做完（細節 grep 存檔 2026-10-16～18）
- 10-18 v1.6：一起看 YouTube（`useWatchTogether.ts`、`WatchTogetherBar.vue`、WS `WATCH`）；設定可關邀請（`prefs.watchInvitesOff`）。
- 10-18 v1.5：家裡多人同時在（後端只把 `scene:'home'` 的 POS 送給同一個家）；名牌自己排版（`fillPillText`，emoji 固定格）；玫瑰改一枝枝；去朋友家失敗不會被踢出。
- 10-18 v1.4：過場動畫（`SceneTransition.vue`：捷運／電梯／樓梯／回家／載入）；villa 書桌升級；玫瑰重畫兩版。
- 10-17 v1.3：好友碼＋點名牌加好友、去好友家；v1.2 villa（`users.perks`）；v1.1 自己的家＋花園＋防呆；登入框不閃、Google 鈕取消可再按。
- 10-16 v1.0：頁首收起、地圖放大、性別配件、悄悄話、Ko-fi、資料庫每日備份。

## 7. 已知問題
- 沒有測試（只有 `vue-tsc`、lint）。直播存檔類 YouTube 不給嵌入；沒 Premium 有廣告。
- iPhone Safari 不能真的全螢幕。沒有備援主機（Vercel 已刪）；Koyeb 先別關（anc-13.com）。
- 備份借用期貨專案的 R2 金鑰和 venv；那邊改了這邊會失敗（看後端 `logs/focus-backup.error.log`）。
- 測試好友功能要用暫時帳號（google_sub `zz-test-*`），好友碼不能有 0 O 1 I，測完要刪。
