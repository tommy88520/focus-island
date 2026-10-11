> 📦 **過期的交接紀錄**（每次交接把這次的細節接在這份最上面）。不會自動載入，要查用 grep。

## 🚩 2026-10-12 02:00（家機，在期貨專案的 session 裡做的）：文件整理＋交接公式
- 使用者：「focus-island, 一樣pull 優化，寫交接skill」。家機這份落後 origin 55 個 commit（09-03 之後都在別台電腦開發），`git pull --ff-only` 拉到 `8c976aa`。
- 原本的 `CLAUDE.md` 11KB、英文，大部分是「How it fits together」——每個 session 都整份載入，但那些細節只有動到那一塊才用得到。
  搬到 `docs/ARCHITECTURE.md`（內容沒改），`CLAUDE.md` 剩約 6.7KB：把「改壞別人馬上看得到」的幾條（座位順序、分頁擁有座位、WS 訊息／表情跟後端對好、
  widget 共用元件不能固定定位）拉出來當鐵律。原本「Direction」寫沙灘沒有座位，已經過時（現在海灘有 8 個座位），拿掉那句。
- README：搜尋 101／夜市／動物園／F1／YouBike／Google／專注幣都找不到 → 「有什麼」補 9 條、「專案結構」補 4 個檔案。
- 後端 repo 在家機跟這個 repo 同一層的 `../COMEANC13/COMEANC13-backend`（落後 19 個 commit，沒動它）。
