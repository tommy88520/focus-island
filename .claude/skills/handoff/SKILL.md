---
name: handoff
description: 交接——使用者說「交接」、要離開／換機器／結束這個 session 時用。把 HANDOFF.md 照固定 7 段整份改寫、細節接到 docs/HANDOFF_ARCHIVE.md 最上面、架構文件同步、commit＋push。
---

# 交接公式（Focus Island 前端）

目標：下一個 session（可能在另一台機器、沒有這次對話、也沒有這台的記憶）只讀 `HANDOFF.md` 就能接著做，而且不漏東西。

## 1. 先把工作收乾淨
- `git status -sb`：沒 commit 的先 commit（不 commit 的話在第 2 段寫清楚是什麼、為什麼留著）。
- 要 push 的程式先過 `npx vue-tsc --noEmit` 跟 `npm run lint`。
- **push 到 `master` 就會上線**（Vercel 自動部署）。push 完一兩分鐘到 https://focus-island.huangyanming.com 實際看一次，結果寫進第 1 段。
- 這次有動到後端（`COMEANC13-backend`，另一個 repo）的話：那邊也要 commit／push／部署（Koyeb），並在第 1 段寫明前後端各到哪個 commit、誰先上。

## 2. 從這次對話逐條抓（這步決定會不會漏）
**一則一則看使用者這次的每個訊息**，每一句都要落到下面某一格，落不到就是漏了：

| 抓什麼 | 寫到哪 |
|---|---|
| 做到一半的事（檔案、做到哪、下一步） | HANDOFF 第 2 段 |
| 我問了、使用者還沒回的（附我的建議） | 第 3 段 |
| 下次要確認的事（上線後要看的、要請別人試的） | 第 4 段 |
| 使用者講的新規則／偏好、美術或玩法上的方向（**原話**） | 第 5 段；穩定的 → CLAUDE.md「使用者的規則」或「方向」 |
| 做完的事（一行一件＋commit） | 第 6 段 |
| 發現但沒修的 bug、外部問題 | 第 7 段 |
| 之後想做的點子 | 第 3 段（等決定）或 README「接下來」（使用者同意才改 README） |

## 3. 改寫 HANDOFF.md
- **只寫這個專案（Focus Island 前端）的事**。同一個 session 順手做了別的專案的事 → 寫進那個專案自己的 `HANDOFF.md`，這份不要提
  （後端 `COMEANC13-backend` 的進度也寫在它自己那邊，這份只寫「前端需要後端配合什麼」）。
- **整份改寫，不是往下加**。固定 7 段：1 版本／2 進行中／3 等使用者決定／4 下次要看／5 使用者新規則／6 最近做完／7 已知問題。
- 第 1 段：`git log -1 --format='%h %s' -- . ':!*.md' ':!docs' ':!.claude'`（只看程式）、push 了沒、網站看過沒、後端要不要配合。
- 第 6 段只留最近兩週；更早的刪掉。
- **全長 ≤100 行**（`wc -l HANDOFF.md`）。
- 這次的**細節**（過程、取捨、使用者原話、試過哪些做法）寫成一段 `## 🚩 YYYY-MM-DD HH:MM：標題`，插在
  `docs/HANDOFF_ARCHIVE.md` 最上面（開頭說明行的下面）。HANDOFF 只放摘要。

## 4. 架構文件要跟著程式走
- 這次改了某一塊的行為（座位、連線、場景、音效、登入…）→ 更新 `docs/ARCHITECTURE.md` 對應的那一條（沒有就加一條）。
- 改到「不能動」的規則（座位順序、WS 訊息種類、表情清單、widget 共用元件）→ 更新 `CLAUDE.md` 的「鐵律」。
- 加了使用者看得到的大功能 → 在第 3 段提醒使用者 README 的「有什麼」要不要補（README 是對外的介紹，文字他決定）。

## 5. 自我檢查（全部成立才 commit）
- [ ] HANDOFF 7 段都在、≤100 行
- [ ] 第 1 段的 commit 跟 `git log` 對得上；push／上線狀態寫了
- [ ] 這次每個使用者要求，不是在第 6 段（做完），就是在第 2／3／4 段
- [ ] 改過行為的地方 `docs/ARCHITECTURE.md` 有跟上
- [ ] 沒有把 `.env.local` 的值、token 寫進任何文件（**這個 repo 是公開的**，也不要寫其他專案或機器的內部細節）

## 6. 提交與回報
- `git add -A && git commit -m "docs: 交接（<一句話>）" && git push`。⚠️ push 就會觸發 Vercel 部署——只有文件也會，沒有關係，但程式還沒好的不要一起 push。
- 回報使用者 ≤6 行：第 2、3、4 段的重點。
