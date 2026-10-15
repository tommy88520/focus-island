---
name: handoff
description: 交接——使用者說「交接」、要離開／換機器／結束 session 時用。HANDOFF.md 照 7 段整份改寫（≤4KB）、細節接到 docs/HANDOFF_ARCHIVE.md 最上面、架構文件同步、commit＋push。
---

# 交接（Focus Island 前端）

目標：下一個 session（可能換機器、沒有這次對話）只讀 `HANDOFF.md` 就能接著做。**要短**：它每次接手都會被讀。

1. **收乾淨**：沒 commit 的先 commit（不 commit 就寫進第 2 段）。程式要過 `npx vue-tsc --noEmit`、`npm run lint`，
   部署（`CLAUDE.md`「部署」）後到網站看一次。動到後端 repo 的話那邊也 commit／push／部署。
2. **逐條對使用者這次的每則訊息**，每句都要落到一格：做一半 → 第 2 段；問了還沒回（附建議）→ 3；下次要確認 → 4；
   新規則／偏好 → 5（穩定的直接搬進 `CLAUDE.md`「使用者的規則」）；做完 → 6；沒修的 bug、外部問題 → 7；點子 → 3。
3. **改寫 HANDOFF.md**：只寫這個專案。固定 7 段：1 版本／2 進行中／3 等決定／4 下次要看／5 新規則／6 最近做完／7 已知問題。
   - 第 1 段的 commit 用 `git log -1 --format='%h %s' -- . ':!*.md' ':!docs' ':!.claude'`，寫部署了沒、後端要不要配合。
   - 第 6 段一天一兩行、只留兩週，**不抄使用者原話**。
   - **≤4KB**（`wc -c HANDOFF.md`）。超過就把細節搬去存檔。
   - 細節（過程、取捨、原話、試過的做法）寫成 `## 🚩 YYYY-MM-DD HH:MM：標題` 插在 `docs/HANDOFF_ARCHIVE.md` 最上面。
4. **文件跟程式走**：改了某塊行為 → 更新 `docs/ARCHITECTURE.md` 那一條；動到鐵律 → `CLAUDE.md`；
   使用者看得到的大功能 → 第 3 段提醒 README 要不要補（文字他決定）。
5. **檢查**：7 段都在、≤4KB；第 1 段 commit 對得上；每個要求都有落點；沒寫 `.env.local` 的值、token、其他專案或機器的細節（**repo 公開**）。
6. `git add -A && git commit -m "docs: 交接（<一句話>）" && git push`（只有文件不用部署）。回報使用者 ≤6 行：第 2、3、4 段重點。
