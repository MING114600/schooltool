# 🏫 ClassroomOS (Photos App)

[![Version](https://img.shields.io/badge/version-8.1.0-blue.svg)](/CHANGELOG_ARCHIVE.md)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](/LICENSE)
[![Built with Vite](https://img.shields.io/badge/built%20with-Vite-646CFF.svg)](https://vitejs.dev/)

**ClassroomOS** 是一個專為教師設計的開源、離線優先、隱私受護的系統。它並非傳統的雲端服務，而是採用 **BYOD (Bring Your Own Data)** 模式，讓老師完全掌握自己的班級資料，並整合 Google Drive 實現無縫同步。

## ✨ 核心哲學 (Core Philosophy)

-   **隱私首選 (Privacy First)**：所有資料優先儲存於瀏覽器本地 (IndexedDB)，不經過任何後端伺服器。
-   **主權回歸 (Data Sovereignty)**：透過 `drive.file` 權限，系統僅能讀寫由其建立的檔案，確保 Google Drive 其他資料安全。
-   **毛玻璃美學 (Glassmorphism)**：現代化、沉浸式的 UI 介面，支援深色與淺色模式，並針對課堂教學展示進行優化。
-   **全方位支援**：內建「注音渲染器」與「TTS 語音工具」，貼合國小及特教教學需求。

---

## 🚀 七大核心模組 (Core Modules)

| 模組名稱 | 描述 |
| :--- | :--- |
| **📺 儀表板 (Dashboard)** | 課堂指揮中心。包含流程時間軸、氣象、課表、動態月相與快速小工具。 |
| **🛡️ 監考系統 (ExamTool)** | 專業考場管理。提供倒數計時、分段提醒、防止螢幕休眠技術與全螢幕專注模式。 |
| **👩‍🏫 班級經營 (Manager)** | 沉浸式排座系統。支援隨機抽籤、即時加分動態島、出缺席管理與座位自適應佈局。 |
| **📒 智慧聯絡簿 (ContactBook)** | 智慧型溝通工具。內稱萬用模板、離線自動儲存、Undo/Redo 歷史紀錄與 A4 精準列印。 |
| **📸 班級相簿 (Photos)** | 輕量化雲端相簿。直接瀏覽 Google Drive 照片，支援高效快取與專業預覽。 |
| **🎧 報讀助理 (ExamReader)** | 專為特殊教育設計。自動解析考卷文本進行逐題報讀，支援多國語系與語意典藏。 |
| **📝 學生日誌 (CaseLog)** | 三欄式專業輔導紀錄。支援跨裝置縮放、圖文雲端備份與加密分享連結。 |

---

## 🛠️ 技術棧 (Tech Stack)

-   **前端框架**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
-   **狀態管理**: [Zustand](https://github.com/pmndrs/zustand)
-   **樣式與設計**: [Tailwind CSS 4](https://tailwindcss.com/)
-   **資料持久化**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (via `idb-keyval`)
-   **雲端整合**: [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2) + [Google Drive API](https://developers.google.com/drive/api)
-   **部署**: 可靜態部署至 GitHub Pages、Vercel 或單機離線運行

---

## 📄 授權條款

本專案採用 MIT 授權條款運作。
