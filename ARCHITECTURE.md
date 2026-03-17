# 📂 根目錄 (Root)

- **`src/main.jsx`**：React 應用程式進入點，負責將主元件掛載至瀏覽器 DOM 樹。
- **`src/App.jsx`**：程式主介面。做為整個 ClassroomOS 的進入點，負責載入與切換不同的應用程式模組，以及管理全域狀態與路由。
- **`src/index.css`**：全域樣式表。包含 Tailwind CSS 的基礎指令以及系統級自訂 CSS (如列印隱藏、字型設定)。

## 📂 src/components (共用元件)

### business (業務邏輯元件)

- **`StudentCard.jsx`**：高度共用的學生卡片 UI 元件，支援拖曳排座、鎖定、出缺席狀態疊加、小組與分數徽章顯示。

### common (通用 UI 元件)

- **`DialogModal.jsx`**：通用型對話框，標準化處理系統提示、確認操作與簡易文字輸入。
- **`ErrorBoundary.jsx`**：錯誤邊界元件，攔截子組件崩潰以防止整個畫面變白。
- **`GlobalBackupModal.jsx`**：全域備份還原彈窗。負責將系統所有班級資料匯出為 JSON 檔案，或讀取備份檔還原。
- **`ZhuyinRenderer.jsx`**：注音渲染器。根據全域狀態自動切換文字 CSS，顯示或隱藏注音字型。
- **`ZhuyinSettingsModal.jsx`**：注音設定視窗。提供字體下載連結、安裝檢測及開關。
- **`AboutDevModal.jsx`** ：開發者資訊彈窗。
- **`PatchNotesModal.jsx`** ：系統改版紀錄顯示視窗，讀取更新日誌資料。
- **`ZhuyinCustomizer.jsx`** ：破音字設定工具。老師可以自行設定字詞注音的讀音。
- **`ModalRoot.jsx`** ：全域 Modal 掛載根節點，統一管理多個系統 Modal 的重疊顯示。

### common/layout (佈局元件)

- **`StandardAppLayout.jsx`** ：標準應用程式佈局，提供統一的導覽列、側邊欄與主要視圖的容器結構。

### common/widgets (桌面小工具)

- **`DraggableWidget.jsx`**：可拖曳本體組件，提供小工具的視窗化、拖曳與層級管理功能。
- **`SoundBoard.jsx`**：課堂音效面板。提供手動播放音效（掌聲、答錯等），並掛載自動回饋音效。
- **`TimerWidget.jsx`** (原 TimerModal)：課堂計時器/碼表。具備快速設定、全螢幕專注模式與鬧鈴音效。
- **`LotteryWidget.jsx`** (原 LotteryModal)：抽籤小幫手，支援隨機抽取個人或小組，配合過場動畫。

### OS (作業系統層級)

- **`AppLauncher.jsx`** ：應用程式啟動器。顯示主選單 (Dashboard, Manager, ExamTool 等) 供使用者切換不同系統模組。

## 📂 src/config (設定檔)

- **`apps.js`** ：定義系統內各應用程式的元數據 (ID, 名稱, 圖示, 路由路徑)，供 Launcher 與 Router 使用。

## 📂 src/constants (常數定義)

- **`polyphoneDict.js`**：校園高頻破音字字典，提供 IVS 選字碼對照與變調修正。
- **`ttsDictionary.js`**：TTS 語音字典，定義特殊符號 (如化學式、數學符號) 的發音規則。
- **`charMap.js`** ：字元映射表，用於注音字型對照。
- **`config.js`** ：系統通用組態。
- **`theme.jsx`** ：主題樣式相關常數定義。

## 📂 src/context (全域狀態 - Context API)

- **`OSContext.jsx`**：管理 OS 層級狀態 (Current App ID、注音模式、字型狀態)，解決跨模組溝通。
- **`ThemeContext.jsx`**：管理深色/淺色模式的主題狀態與切換邏輯。
- **`ModalContext.jsx`**：集中管理全域 Modal 的開關狀態與資料傳遞 (避免 Prop Drilling)。
- **`AuthContext.jsx`**：處理 Google OAuth 2.0 登入、憑證 (Token) 管理與 Google Drive API 權限範圍 (Scopes) 設定。

## 📂 src/store (全域狀態 - Zustand)

- **`useClassroomStore.js`**：班級經營系統狀態管理，封裝座位、評分、出缺席等資料核心，取代舊有的 Context 寫法。
- **`useContactBookStore.js`**：聯絡簿核心狀態管理，內建 Undo/Redo 堆疊、自動儲存。
- **`useCaseLogStore.js`**：學生日誌狀態管理。
- **`usePhotoStore.js`**：相簿緩存與載入狀態管理。

## 📂 src/services (服務與資料存取)

- **`audioService.js`**：全域音效服務 (原 useAudio Hook)，基於 Web Audio API。
- **`backupService.js`**：系統備份與還原服務。
- **`googleDriveService.js`**：封裝 Google API 操作，處理建立檔案與試算表、讀寫儲存格、權限共用邏輯。
- **`googlePickerService.js`**：處理 Google Picker 檔案選取介面。
- **`examDatabase.js`** / **`contactBookDatabase.js`**：IndexedDB 操作層實作。
- **`idbService.js`** ：IndexedDB 的底層通用封裝。

## 📂 src/hooks (自定義 Hooks)

- **`useDashboardEvents.js`**：處理電子看板的事件監聽 (全螢幕、快捷鍵、閒置偵測)。
- **`useExamCloud.js`**：考卷雲端功能，處理 Google Drive 下載、權限與分享。
- **`useHistory.js`** ：獨立的 Undo/Redo 歷史紀錄管理 Hook。
- **`useHotkeys.js`**：通用鍵盤快捷鍵 Hook，支援組合鍵偵測。
- **`useModalManager.js`**：封裝 Modal 開關邏輯。
- **`usePersistentState.js`**：封裝 localStorage 持久化。
- **`useStudentImport.js`**：學生名單匯入解析邏輯。
- **`useTheme.js`**：系統主題切換邏輯。
- **`useTTS.js`**：Web Speech API 封裝，管理語音播放與 iOS 防回收機制。
- **`useZhuyin.js`** ：處理注音字型的載入狀態檢測與模式切換邏輯。

## 📂 src/data (靜態資產與更新日誌)

- **`patchNotesData.js`** ：存放最新版本更新內容。
- **`patchNotesArchiveData.js`** ：存放舊版本更新內容的封存檔。

## 📂 src/pages (應用程式頁面)

### 1. Dashboard (課堂儀表板)

- **`Dashboard.jsx`**：儀表板主容器。
- **components/**
    - **`ControlDock.jsx`**：底部控制列 (模式切換、廣播)。
    - **`DashboardWidgets.jsx`** / **`DashboardWidgetsLayer.jsx`**：小型 UI 儀表與元件。
    - **`DashboardContactBookWidget.jsx`**：儀表板上的聯絡簿速覽組件。
    - **`TimelineSidebar.jsx`**：側邊時間軸 (課表、放學預測)。
    - **`WeatherWidget.jsx`**：氣象 API 顯示組件。
    - **`StarryBackground.jsx`**：星空背景 (銀河、流星雨)。
    - **`MoonPhaseTech.jsx`**：動態月相繪製元件。
- **context/**
    - **`DashboardSettingsContext.jsx`**：儀表板專屬設定資料。
- **hooks/**
    - **`useClassroomTimer.js`**：時間核心。計算節次、剩餘秒數，決定 Class/Break/Eco 狀態。
- **modals/**
    - **`BroadcastInputModal.jsx`**：臨時廣播輸入窗。
    - **`MessageInput.jsx`**：下課留言板設定。
    - **`SettingsModal.jsx`**：設定主視窗容器。
    - **`ToolsMenu.jsx`**：快速工具選單。
    - **settings/** (各類設定子頁面：BroadcastSettings, ButtonSettings, GeneralSettings, MaintenanceSettings, ScheduleEditor, SettingsSection, SubjectHintSettings, TimeSlotSettings, WeatherSettings)。
- **views/**
    - **`BreakView.jsx`**：下課模式 (倒數、留言)。
    - **`ClassView.jsx`**：上課模式 (專注顯示)。
    - **`EcoView.jsx`**：省電/待機模式。
    - **`MarqueeView.jsx`**：頂部跑馬燈。
    - **`SpecialView.jsx`**：全螢幕廣播視圖。
- **utils/**
    - **`dashboardConstants.js`**：儀表板預設參數。

### 2. ExamTool (監考系統)

- **`ExamTool.jsx`**：監考系統主程式。
- **components/**
    - **`ExamControlDock.jsx`**：監考中控台 (延長時間、公告)。
    - **`ExamMainStage.jsx`**：主畫面 (計時器、進度條)。
    - **`ExamSettingsModal.jsx`**：考程與規則設定。
    - **`ManualAttendanceModal.jsx`**：手動點名介面。
    - **`QuickExamModal.jsx`**：臨時隨堂考設定。
- **hooks/**
    - **`useExamLogic.js`**：監考核心流程控制。
    - **`useWakeLock.js`**：防止螢幕休眠。

### 3. Manager (班級經營)

- **`Manager.jsx`**：班級經營主介面。
- **components/**
    - **`SeatGrid.jsx`** ：座位表網格容器。
    - **`SeatCell.jsx`**：單一座位單元 (處理 Drag & Drop)。
    - **`QuickScoreBar.jsx`**：底部加分動態島，包含全班加分、批次評分與周邊工具開關。
    - **`GroupScoreTicker.jsx`**：小組分數戰況列。
    - **`ScoreFeedback.jsx`**：分數動畫回饋元件。
    - **`Sidebar.jsx`**：左側導覽列。
    - **sidebar/** (`ManagementTab.jsx`, `ScoresTab.jsx`)：側邊欄分頁管理。
    - **widgets/** (`ArrangeToolboxWidget.jsx`, `ClassroomMenuWidget.jsx`)：工具箱小組件。
- **hooks/**
    - **`useManagerUI.js`** ：管理介面 UI 邏輯。
- **modals/**
    - **`AttendanceModal.jsx`**：點名簿。
    - **`BatchGroupModal.jsx`**：批次分組。
    - **`BehaviorSettingsModal.jsx`**：評分項目設定。
    - **`EditStudentModal.jsx`**：學生資料編輯。
    - **`ExportStatsModal.jsx`**：成績統計匯出。
    - **`LayoutTemplateModal.jsx`**：座位佈局樣板。
    - **`ScoringModal.jsx`**：評分面板。

### 4. ContactBook (智慧聯絡簿)

- **`ContactBook.jsx`**：聯絡簿主介面，包含月曆側邊欄、模板面板與黑板編輯區。
- **components/**
    - **`ContactBookEditor.jsx`**：黑板風格編輯區，支援 `@dnd-kit` 拖曳排序、行內編輯與大屏打勾互動。
    - **`ContactBookRow.jsx`**：單獨待辦事項紀錄。
    - **`HistoryCalendar.jsx`**：迷你月曆元件，顯示紀錄與高亮今日，支援左右切月份。
    - **`QuickTemplatePanel.jsx`**：右側快速模板面板，支援一鍵插入、新增管理。
    - **`PrintPreviewModal.jsx`**：列印與匯出預覽彈窗 (A4 轉出、圖檔匯出)。
- **utils/**
    - **`dateUtils.js`**：民國年日期格式化等應用工具。

### 5. Photos (班級相簿)

- **`index.jsx`**：相簿應用程式主進入點。
- **`AlbumList.jsx`** / **`AlbumDetail.jsx`** / **`SharedAlbums.jsx`**：相簿導覽與相片一覽視圖。
- **components/**
    - **`AlbumManager.jsx`**：相簿管理與建立模組。
    - **`PhotoLightbox.jsx`**：全螢幕高解析照片預覽。
    - **`PhotosShareModal.jsx`**：分享設定視窗。

### 6. ExamReader (報讀助理)

- **`ExamReader.jsx`**：報讀助理主程式。
- **components/**
    - **`ExamReaderView.jsx`**：試卷閱讀與渲染核心。
    - **`ExamControls.jsx`**：播放控制列 (上/下一題、語速)。
    - **`ExamHeader.jsx`**：頂部導覽列。
    - **`ExamSidebar.jsx`**：題目導覽側邊欄。
    - **`EditItemModal.jsx`**：題目編輯視窗。
    - **`ImportModal.jsx`**：試卷匯入解析視窗。
    - **`ExamPackageModal.jsx`**：考卷打包派送視窗。
    - **`ExamShareModal.jsx`**：考卷分享。
    - **`TTSDictModal.jsx`**：發音字典設定。
    - **`ExamHistoryModal.jsx`** ：查看紀錄與封存檔。
- **hooks/**
    - **`useExamManager.js`**：管理考卷資料庫。
- **utils/**
    - **`examParser.js`**：考卷解析核心 (Text/HTML 轉 JSON)。

### 7. CaseLog (學生日誌)

> **架構設計理念：Local-First + BYOD (Bring Your Own Drive)**
> CaseLog 系統資料直接儲存於老師個人的 Google Drive (Google Sheets) 中。
> - **安全限制 (`drive.file` scope)**：系統僅要求最小的 `drive.file` 權限，確保安全審查過關。

- **`CaseLog.jsx`**：學生日誌主介面。
- **components/**
    - **`LogForm.jsx`**：日誌編輯表單。
    - **`TemplateEditor.jsx`** / **`TemplateManager.jsx`**：表單樣板管理。
- **context/**
    - **`CaseLogContext.jsx`**：學生日誌專屬狀態管理。
- **utils/**
    - **`caseLogDatabase.js`** ：IndexedDB 持久化。
    - **`sheetSchema.js`** ：Google Sheets 欄位定義。
- **views/**
    - **`TeacherDashboard.jsx`**：教師端主控台 (歷史日誌、批次選取)。
    - **`ParentView.jsx`**：家長專屬唯讀畫面。
- **views/components/**
    - **`LogDetailPane.jsx`** / **`LogListPane.jsx`**：日誌詳情與列表視圖。
    - **`PrintView.jsx`**：列印用樣式。
    - **`ShareManagerModal.jsx`**：分享彈窗。
    - **`Sidebar.jsx`** / **`Toolbar.jsx`**：導覽與工具列。

## 📂 src/utils (工具函式庫)

- **`cn.js`**：Classnames 與 Tailwind 合併工具。
- **`dragPolyfill.js`** ：HTML5 Drag & Drop API 行動裝置兼容補丁。
- **`driveUtils.js`** ：Google Drive 基礎路徑與 API 工具。
- **`groupingAlgorithms.js`** ：專門處理分組邏輯 (如性別/分數平均分組)。
- **`seatAlgorithms.js`** ：座位排列演算法 (梅花座、直排)。
- **`ttsProcessor.js`** ：語音前處理核心 (斷句、字典替換)。


> [!TIP]
> 關於各個模組的詳細未來優化計畫與功能藍圖，請參閱 [ROADMAP.md](file:///d:/schooltool/ClassroomTools/ROADMAP.md)。