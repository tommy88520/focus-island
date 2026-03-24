# 🏝️ Focus Island (數位專注島)

一個基於 **Quasar (Vue 3)** 與 **Golang** 開發的沉浸式多人同步專注平台。
本專案旨在練習並整合現代 Web 開發的三大核心技術：**WebSocket**、**Web Worker** 與 **Service Worker**。

---

## 🎯 專案目標 (Project Goals)

- **精準計時**：利用 **Web Worker** 確保番茄鐘在背景標籤頁不被瀏覽器降頻 (Throttling)。
- **實時互動**：透過 **WebSocket** (Golang 後端) 實現多人異地同步專注狀態與「專注樹」生長。
- **離線支援**：透過 **Service Worker (PWA)** 確保在斷網情況下仍能使用核心功能並接收通知。
- **極致體驗**：使用 **Quasar Framework** 提供絲滑的 UI 互動與多層次環境白雜音播放。

---

## 🛠️ 技術棧 (Tech Stack)

### 前端 (Frontend)

- **Framework**: [Quasar Framework](https://quasar.dev/) (Vite + Vue 3 + TypeScript)
- **State Management**: [Pinia](https://pinia.vuejs.org/)
- **HTTP Client**: Axios
- **Deployment**: [Vercel](https://vercel.com/) (Output: `dist/spa`)

### 後端 (Backend)

- **Language**: [Golang](https://go.dev/) (Gin / Fiber) - _已完成基礎開發_
- **Real-time**: Gorilla WebSocket
- **Database/Cache**: PostgreSQL & Redis
- **Infrastructure**: Docker

---

## 🏗️ 核心架構與實作規劃 (Implementation Plan)

### 1. Web Worker (Timer Logic)

- **檔案位置**: `src/workers/timer.worker.ts`
- **職責**: 獨立執行緒處理 `setInterval` 倒數，避免主線程 (Main Thread) 阻塞或休眠導致時間失準。
- **通訊**: 透過 `postMessage` 與 Pinia Store 連動，更新 UI 剩餘秒數。

### 2. WebSocket (Social Sync)

- **職責**:
  - 使用者進入「島嶼」房間時建立持久連線。
  - 廣播使用者的即時狀態（專注中 🔥、休息中 ☕、暫離 💤）。
  - 異步同步全站累積的專注能量數值。

### 3. Service Worker (PWA Features)

- **模式**: Quasar PWA Mode (InjectManifest)
- **職責**:
  - 靜態資源預快取 (Pre-caching)：音效檔案、UI 元件。
  - 實作 **Push API**：當專注結束時，即使分頁關閉也能發送系統通知。

---

## 🚀 部署與設定 (Deployment)

### Vercel 設定

- **Framework Preset**: `Other`
- **Build Command**: `npm run build`
- **Output Directory**: `dist/spa`
- **Rewrites**: 需配置 `vercel.json` 處理 SPA 路由跳轉。

### 環境變數 (.env)

- `VITE_API_URL`: 指向 Golang 後端 API 地址。
- `VITE_WS_URL`: 指向 WebSocket 連線地址。

---

## 📝 開發規範 (Dev Notes)

- 嚴格遵守 **Vue 3 Composition API (`<script setup>`)**。
- 優先使用 **TypeScript** 定義 Data Schema。
- 介面採用 **Material Design** 風格，確保跨端（Web/Mobile）體驗一致。
