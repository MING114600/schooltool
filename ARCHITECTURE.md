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

### common/widgets (桌面小工具)

- **`DraggableWidget.jsx`**：可拖原本體組件，提供小工具的視窗化、拖曳與層級管理功能。
- **`SoundBoard.jsx`**：課堂音效面板。提供手動播放音效（掌聲、答錯等），並掛載自動回饋音效。
- **`TimerWidget.jsx`** (原 TimerModal)：課堂計時器/碼表。具備快速設定、全螢幕專注模式與鬧鈴音效。
- **`LotteryWidget.jsx`** (原 LotteryModal)：抽籤小幫手，支援隨機抽取個人或小組，配合過場動畫。

### OS (作業系統層級)

- **`AppLauncher.jsx`** ：應用程式啟動器。顯示主選單 (Dashboard, Manager, ExamTool) 供使用者切換不同系統模組。

## 📂 src/config (設定檔)

- **`apps.js`** ：定義系統內各應用程式的元數據 (ID, 名稱, 圖示, 路由路徑)，供 Launcher 與 Router 使用。

## 📂 src/constants (常數定義)

- **`polyphoneDict.js`**：校園高頻破音字字典，提供 IVS 選字碼對照與變調修正。
- **`ttsDictionary.js`**：TTS 語音字典，定義特殊符號 (如化學式、數學符號) 的發音規則。
- **`charMap.js`** ：字元映射表，用於注音字型對照。

## 📂 src/context (全域狀態)

- **`OSContext.jsx`**：管理 OS 層級狀態 (Current App ID、注音模式、字型狀態)，解決跨模組溝通。
- **`ClassroomContext.jsx`**：班級經營系統狀態 Provider，解決元件樹深層傳遞問題。
- **`ThemeContext.jsx`**：管理深色/淺色模式的主題狀態與切換邏輯。
- **`ModalContext.jsx`**：集中管理全域 Modal 的開關狀態與資料傳遞 (避免 Prop Drilling)。
- **`AuthContext.jsx`**：處理 Google OAuth 2.0 登入、憑證 (Token) 管理與 Google Drive API 權限範圍 (Scopes) 設定。

## 📂 src/hooks (自定義 Hooks)

- **`useAudio.js`**：基於 Web Audio API 的全域音效控制，支援回饋音與抽籤音效。
- **`useClassroom.js`**：班級邏輯整合介面，封裝座位、評分、出缺席操作。
- **`useClassState.js`**：班級資料核心 (CRUD)，處理 LocalStorage 持久化。
- **`useClassroomTimer.js`**：時間核心。計算節次、剩餘秒數，決定 Class/Break/Eco 狀態。
- **`useDashboardEvents.js`**：處理電子看板的事件監聽 (全螢幕、快捷鍵、閒置偵測)。
- **`useHotkeys.js`**：通用鍵盤快捷鍵 Hook，支援組合鍵偵測。
- **`useModalManager.js`**：封裝 Modal 開關邏輯。
- **`usePersistentState.js`**：封裝 localStorage，讓 State 在重新整理後保留。
- **`useScoring.js`**：加扣分邏輯與分數計算。
- **`useSeating.js`**：座位拖放、交換與排列邏輯。
- **`useStudentImport.js`**：學生名單匯入解析邏輯。
- **`useTheme.js`**：系統主題切換邏輯。
- **`useTTS.js`**：Web Speech API 封裝，管理語音播放與 iOS 防回收機制。
- **`useExamCloud.js`**：考卷雲端功能，處理 Google Drive 下載、權限與分享。
- **`useExamManager.js`**：管理考卷資料庫 (CRUD) 與題目編輯狀態。
- **`useHistory.js`** ：獨立的 Undo/Redo 歷史紀錄管理 Hook (原本可能整合在 ClassState)。
- **`useZhuyin.js`** ：處理注音字型的載入狀態檢測與模式切換邏輯。

## 📂 src/pages (應用程式頁面)

### 1. Dashboard (課堂儀表板)

- **`Dashboard.jsx`**：儀表板主容器。
- **components/**
    - **`ControlDock.jsx`**：底部控制列 (模式切換、廣播)。
    - **`DashboardWidgets.jsx`**：小型 UI 元件 (圓形進度條等)。
    - **`TimelineSidebar.jsx`**：側邊時間軸 (課表、放學預測)。
    - **`WeatherWidget.jsx`**：氣象 API 顯示組件。
    - **`StarryBackground.jsx`**：星空背景 (銀河、流星雨)。
    - **`MoonPhaseTech.jsx`**：動態月相繪製元件。
- **modals/**
    - **`BroadcastInputModal.jsx`**：臨時廣播輸入窗。
    - **`MessageInput.jsx`**：下課留言板設定。
    - **`SettingsModal.jsx`**：設定主視窗容器。
    - **`ToolsMenu.jsx`**：快速工具選單。
    - **settings/** (各類設定子頁面：廣播、按鈕、一般、維護、課表、提示、作息、天氣)。
- **views/**
    - **`BreakView.jsx`**：下課模式 (倒數、留言)。
    - **`ClassView.jsx`**：上課模式 (專注顯示)。
    - **`EcoView.jsx`**：省電/待機模式。
    - **`MarqueeView.jsx`**：頂部跑馬燈。
    - **`SpecialView.jsx`**：全螢幕廣播視圖。
- **utils/**
    - **`dashboardConstants.js`**：儀表板預設參數。

### 2. ExamReader (報讀助理)

- **`ExamReader.jsx`**：報讀助理主程式。
- **components/**
    - **`ExamReaderView.jsx`**：試卷閱讀與渲染核心。
    - **`ExamControls.jsx`**：播放控制列 (上/下一題、語速)。
    - **`ExamHeader.jsx`**：頂部導覽列 (模式切換、設定)。
    - **`ExamSidebar.jsx`**：題目導覽側邊欄。
    - **`EditItemModal.jsx`**：題目編輯視窗。
    - **`ImportModal.jsx`**：試卷匯入解析視窗。
    - **`ExamPackageModal.jsx`**：考卷打包派送視窗。
    - **`ExamShareModal.jsx`**：考卷分享 (QR Code) 視窗。
    - **`TTSDictModal.jsx`**：發音字典設定。
    - **`ExamHistoryModal.jsx`** ：查看過往考試紀錄與封存檔。
- **utils/**
    - **`examParser.js`**：考卷解析核心 (Text/HTML 轉 JSON)。

### 3. ExamTool (監考系統)

- **`ExamTool.jsx`**：監考系統主程式。
- **components/**
    - **`ExamControlDock.jsx`**：監考中控台 (延長時間、公告)。
    - **`ExamMainStage.jsx`**：主畫面 (計時器、進度條)。
    - **`ExamSettingsModal.jsx`**：考程與規則設定。
    - **`ManualAttendanceModal.jsx`**：手動點名介面。
    - **`QuickExamModal.jsx`**：臨時隨堂考設定。
- **hooks/**
    - **`useExamLogic.js`**：監考核心流程控制。
    - **`useWakeLock.js`**：防止螢幕休眠 Hook (亦可移至通用 hooks)。

### 4. Manager (班級經營)

- **`Manager.jsx`** (原 ClassroomManager)：班級經營主介面。
- **components/**
    - **`Sidebar.jsx`**：左側功能導覽列。
    - **`Toolbar.jsx`**：頂部工具列 (評分/編輯切換)。
    - **`SeatGrid.jsx`** ：座位表網格容器，負責渲染所有 SeatCell。
    - **`SeatCell.jsx`**：單一座位單元 (處理 Drag & Drop)。
    - **`QuickScoreBar.jsx`**：底部加分動態島，包含全班加分、批次評分與周邊工具開關。
    - **`GroupScoreTicker.jsx`**：小組分數戰況列。
    - **`ScoreFeedback.jsx`**：分數動畫回饋元件。
    - **widgets/**
        - **`ArrangeToolboxWidget.jsx`**：排座位與走道設定的漂浮工具箱。
    - **sidebar/**
        - **`ManagementTab.jsx`**：側邊欄-班級管理分頁 (學生清單)。
        - **`ScoresTab.jsx`**：側邊欄-成績排行分頁。
- **modals/**
    - **`AttendanceModal.jsx`**：點名簿。
    - **`BatchGroupModal.jsx`**：批次分組。
    - **`BehaviorSettingsModal.jsx`**：評分項目設定。
    - **`EditStudentModal.jsx`**：學生資料編輯。
    - **`ExportStatsModal.jsx`**：成績統計匯出。
    - **`LayoutTemplateModal.jsx`**：座位佈局樣板。
    - **`ScoringModal.jsx`**：評分面板。

### 5. CaseLog (學生日誌)

> **架構設計理念：Local-First + BYOD (Bring Your Own Drive)**
> CaseLog 系統的核心理念是資料去中心化與最高隱私保護。所有學生的輔導記錄皆直接儲存於每位老師個人的 Google Drive (Google Sheets) 中，系統本身不提供任何中央伺服器或共用資料庫。
> - **安全限制 (`drive.file` scope)**：為簡化註冊流程並避免 Google 嚴苛的安全審查，系統僅要求最小的 `drive.file` 權限。這意味著系統「只能存取由 ClassroomOS 自身建立的檔案」。
> - **功能取捨**：基於上述限制，需要跨越老師權限邊界的功能（例如：共編日誌、自動讀取非系統建立的 Google Form 回覆）皆被刻意擱置或透過跳轉方式處理，以確保系統的輕量與安全性。

- **`CaseLog.jsx`**：學生日誌主介面。
- **components/**
    - **`LogForm.jsx`**：日誌編輯表單，負責依據樣板渲染輸入框並處理新增、草稿 (Debounce)、自動調整大小與文字縮放邏輯。
    - **`TemplateEditor.jsx`**：日誌樣板編輯器，提供教師自訂日誌紀錄欄位 (`text`, `rating`, `checkbox`, `select`) 與表單格式。
    - **`Sidebar.jsx`**：側邊學生選單。（註：共編匯入功能暫時隱藏）
    - **`Toolbar.jsx`**：頂部工具列。（註：共編分享按鈕暫時隱藏）
- **context/**
    - **`CaseLogContext.jsx`**：學生日誌專屬狀態管理，處理 CRUD 操作，結合 IndexedDB (Offline-first) 與 Google Sheets (Remote) 的雙向資料同步。
- **views/**
    - **`TeacherDashboard.jsx`**：教師端主控台，包含學生清單、歷史日誌、批次選取與圖片上傳/預覽邏輯。
    - **`ParentView.jsx`**：家長專屬唯讀畫面 (公開無須登入)，透過 URL 參數過濾並顯示教師指定的日誌內容，支援全文響應式文字縮放。
    - **`components/LogDetailPane.jsx`**：教師端日誌詳細閱讀區，包含唯讀展示、縮放以及刪除/編輯入口。

### 6. ContactBook (智慧聯絡簿)

- **`ContactBook.jsx`**：聯絡簿主介面，包含月曆側邊欄、模板面板與黑板編輯區。支援橫排/直排模式切換、文字縮放、大屏投影模式與全域鍵盤快捷鍵 (Ctrl+Z/Y/P, Escape)。
- **components/**
    - **`ContactBookEditor.jsx`**：黑板風格編輯區，支援 `@dnd-kit` 拖曳排序（GripVertical 手柄）、行內編輯、重要項目紅色標記與大屏打勾互動。
    - **`HistoryCalendar.jsx`**：迷你月曆元件（嵌入側邊欄），顯示當月日曆格、有紀錄日期以藍點標記、今日 ring 高亮，支援左右切月份瀏覽。
    - **`QuickTemplatePanel.jsx`**：右側快速模板面板，支援預設模板與自訂模板的一鍵插入、新增與隱藏管理。
    - **`PrintPreviewModal.jsx`**：列印與匯出預覽彈窗。支援一頁 1/2/4/8 份、直式/橫式排版、黑板背景保留切換、單圖下載（html-to-image）、Web Share API 分享（含剪貼簿 fallback）及原生列印（Portal 渲染至 body）。
- **store/**
    - **`useContactBookStore.js`** (Zustand)：聯絡簿核心狀態管理，內建 Undo/Redo 堆疊（最多 30 步）、自動儲存至 IndexedDB、歷史日期載入與模板 CRUD。
- **services/**
    - **`contactBookDatabase.js`**：IndexedDB 資料存取層，處理聯絡簿日誌與自訂模板的持久化。
- **utils/**
    - **`dateUtils.js`**：民國年日期格式化工具。

## 📂 src/utils (工具函式庫)

- **`backupService.js`**：系統備份與還原服務。
- **`cn.js`**：Classnames 與 Tailwind 合併工具。
- **`constants.jsx`**：全域常數 (狀態定義、顏色)。
- **`examDatabase.js`**：IndexedDB 操作層 (考卷儲存)。
- **`googleDriveService.js`**：封裝 Google API 操作，處理建立檔案與試算表、讀寫儲存格、權限共用及特定列更新/清除邏輯。
- **`seatAlgorithms.js`**：座位排列演算法 (梅花座、直排)。
- **`ttsProcessor.js`**：語音前處理核心 (斷句、字典替換)。
- **`dragPolyfill.js`** ：HTML5 Drag & Drop API 的行動裝置兼容性補丁。
- **`groupingAlgorithms.js`** ：專門處理分組邏輯 (如性別平均分組、分數平均分組) 的演算法庫。
- **`idbService.js`** ：IndexedDB 的底層通用封裝 (可能被 examDatabase 引用)。
- **`patchNotesData.js`** ：存放各版本更新內容的靜態資料檔。