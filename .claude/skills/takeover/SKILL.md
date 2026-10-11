---
name: takeover
description: 接手——新 session 開始、換機器、使用者說「接手」時用。只讀 HANDOFF.md、對版本、確認本機跑得起來跟網站狀態，回報一段摘要再開始做事。
---

# 接手公式（Focus Island 前端）

目標：用最少的 token 掌握現況。`CLAUDE.md` 已經自動載入，**只再讀 `HANDOFF.md`**；`docs/ARCHITECTURE.md` 等要動某一塊時再 grep 那一段，不要整份讀。

## 1. 讀 HANDOFF.md
只讀這份（≤100 行）。

## 2. 對版本
- `git fetch -q && git status -sb`（有沒有落後 origin——這個專案常在不同電腦上改，**落後就先 `git pull --ff-only`**）、`git log -1 --oneline`。
- 跟 HANDOFF 第 1 段對不上（多了 commit、有沒 commit 的改動）→ 先跟使用者講。
- pull 之後如果 `package.json`／`package-lock.json` 有變（`git diff --stat HEAD@{1} HEAD -- package.json package-lock.json`），先 `npm install`。

## 3. 狀態
- 網站：`curl -s -o /dev/null -w '%{http_code}\n' https://focus-island.huangyanming.com/`（要 200）。
- 本機能不能跑：`npx vue-tsc --noEmit`（要動程式才需要；失敗先看是不是沒 `npm install`）。
- 這次的工作會不會動到後端（新的 WS 訊息、表情、座位數、登入）：會的話後端 repo `COMEANC13-backend` 也要 pull 到最新
  （家機上在跟這個 repo 同一層的 `../COMEANC13/COMEANC13-backend`），先讀它自己的文件。

## 4. 回報（≤8 行）
版本（有沒有落後、pull 了幾個 commit）、網站正常與否、第 2 段進行中、第 3 段等決定、第 4 段要看的。
第 2 段有進行中的事就預設接續它；沒有就問使用者要做什麼。
