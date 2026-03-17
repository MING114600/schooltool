# 🚀 ClassroomOS 未來優化建議 (Roadmap)

此文件紀錄了各模組未來可延伸的優化方向、技術債處理以及新功能構想。

---

## 📸 班級相簿 (Photos) - 優化藍圖

### 1. 程式碼架構優化 (Architecture)
- [ ] **抽離資料獲取邏輯 (Custom Hooks)**：將 `googleDriveService` 的呼叫封裝成 `useDriveAlbums` 或 `useDrivePhotos`，讓 UI 元件更純粹地專注於渲染。
- [ ] **相片網格元件化**：將 `AlbumDetail.jsx` 中的相片瀑布流區塊獨立為 `<PhotoGrid />` 元件，提升維護性。

### 2. 效能與體驗極限優化 (Performance UX)
- [ ] **虛擬滾動 (Virtual Scrolling)**：針對照片數量極大的相簿（如 200 張以上），僅渲染畫面上可見的 DOM 節點，降低手機瀏覽器的負擔。
- [ ] **漸進式影像顯示 (Progressive Image Loading)**：在呈現真實縮圖前，先顯示極低解析度的模糊色塊或主色調占位圖，提升感官載入速度。
- [ ] **Masonry 排版優化**：改善 Masonry 佈局在動態載入時的跳動感 (Layout Shift)。

### 3. 未來管理與分享功能 (Extended Features)
- [ ] **批次下載 (Batch Download)**：實作勾選照片並一鍵打包為 ZIP 檔的功能。
- [ ] **老師端上傳通道 (Manager Upload)**：在管理分頁支援直接拖放照片上傳至對應的 Google Drive 資料夾，打造完整管理閉環。
- [ ] **年份與分類篩選**：隨著相簿累積，支援依「學期/學年度」或「活動類型標籤」進行快速篩選。
- [ ] **多語系支援**：為相簿模組提供完整的多語系鍵值對。

---

## 📋 通用系統優化 (General OS)
- [ ] **全域錯誤監測 (Telemetry)**：考慮導入極簡的匿名錯誤統計，協助追蹤不同瀏覽器的兼容性問題。
- [ ] **PWA 深度整合**：優化離線快取機制，讓聯絡簿等工具在斷網環境下具備更強大的生存能力。
