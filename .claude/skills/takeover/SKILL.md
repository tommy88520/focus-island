---
name: takeover
description: 接手——新 session 開始、換機器、使用者說「接手」時用。只讀 HANDOFF.md、對版本、看網站狀態，回報一段摘要再開始做事。
---

# 接手（Focus Island 前端）

用最少的 token 掌握現況：`CLAUDE.md` 已自動載入，**只再讀 `HANDOFF.md`**；其他文件要動哪一塊再 grep，不要整份讀。

1. `git fetch -q && git status -sb && git log -1 --oneline`。落後就 `git pull --ff-only`；`package-lock.json` 有變就 `npm install`。
   跟 HANDOFF 第 1 段對不上（多了 commit、有沒 commit 的改動）→ 先跟使用者講。
2. 網站 `curl -s -o /dev/null -w '%{http_code}\n' https://focus-island.huangyanming.com/` 要 200。要動程式才跑 `npx vue-tsc --noEmit`。
   會動到後端（WS 訊息、表情、座位數、登入）就把後端 repo `COMEANC13-backend` 也 pull 到最新。
3. 回報 ≤6 行：版本、網站、第 2 段進行中（有就預設接續）、第 3 段等決定、第 4 段要看的。
