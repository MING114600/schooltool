import { create } from 'zustand';
import { contactBookDB } from '../services/contactBookDatabase';
import { syncContactBookToCloud, fetchContactBookFromCloud } from '../services/googleDriveService';

// 預設的聯絡簿模板 (可依據現場老師常見需求調整)
const DEFAULT_TEMPLATES = [
    { id: 'tpl_preset_1', content: '國習 P. ~ P.', isImportant: false },
    { id: 'tpl_preset_2', content: '甲本 P. ~ P.', isImportant: false },
    { id: 'tpl_preset_3', content: '乙本 P. ~ P.', isImportant: false },
    { id: 'tpl_preset_4', content: '社習 P. ~ P.', isImportant: false },
    { id: 'tpl_preset_5', content: '自習 P. ~ P.', isImportant: false },
    { id: 'tpl_preset_6', content: '數習 P. ~ P.', isImportant: false },
    { id: 'tpl_preset_7', content: '考', isImportant: false },
    { id: 'tpl_preset_8', content: '訂正', isImportant: true },
    { id: 'tpl_preset_9', content: '簽名', isImportant: true },
    { id: 'tpl_preset_10', content: '帶', isImportant: true },
    { id: 'tpl_preset_11', content: '小日記「」', isImportant: false },
    { id: 'tpl_preset_12', content: '閱讀「」', isImportant: false },
];

export const useContactBookStore = create((set, get) => ({
    // --- State ---
    logs: [], // 所有歷史聯絡簿紀錄 { id, date, items: [{id, content, isImportant, isChecked}] }
    currentLog: null, // 目前檢視/編輯中的聯絡簿
    customTemplates: [], // 使用者自訂模板
    hiddenTemplateIds: [], // 隱藏的預設模板 IDs

    // Undo/Redo
    undoStack: [],
    redoStack: [],

    // UI Status
    isLoading: true,
    isSaving: false,
    error: null,
    editorZoom: 100, // 記憶文字縮放比例
    writingMode: 'horizontal-tb', // 記憶直橫排模式
    exportBackground: false, // 是否匯出背景（預設關閉）
    isExporting: false, // 是否正在截圖匯出
    lastSavedTime: null, // 上次自動儲存時間 (HH:mm)

    // --- Actions ---
    setEditorZoom: (zoom) => set({ editorZoom: Math.max(50, Math.min(zoom, 300)) }),
    setWritingMode: (mode) => set({ writingMode: mode }),
    setExportBackground: (val) => set({ exportBackground: val }),
    setIsExporting: (val) => set({ isExporting: val }),

    // Undo/Redo helpers
    _pushUndo: () => {
        const { currentLog, undoStack } = get();
        if (!currentLog) return;
        const snapshot = JSON.parse(JSON.stringify(currentLog.items));
        set({ undoStack: [...undoStack.slice(-29), snapshot], redoStack: [] });
    },

    undo: () => {
        const { currentLog, undoStack, redoStack } = get();
        if (!currentLog || undoStack.length === 0) return;
        const prevItems = undoStack[undoStack.length - 1];
        const currentItems = JSON.parse(JSON.stringify(currentLog.items));
        set({
            undoStack: undoStack.slice(0, -1),
            redoStack: [...redoStack, currentItems],
            currentLog: { ...currentLog, items: prevItems }
        });
        get().saveCurrentLog();
    },

    redo: () => {
        const { currentLog, undoStack, redoStack } = get();
        if (!currentLog || redoStack.length === 0) return;
        const nextItems = redoStack[redoStack.length - 1];
        const currentItems = JSON.parse(JSON.stringify(currentLog.items));
        set({
            redoStack: redoStack.slice(0, -1),
            undoStack: [...undoStack, currentItems],
            currentLog: { ...currentLog, items: nextItems }
        });
        get().saveCurrentLog();
    },

    /**
     * 初始化 Store，載入所有 DB 中的聯絡簿與模板
     */
    initStore: async () => {
        set({ isLoading: true, error: null });
        try {
            const logs = await contactBookDB.getAllLogs();
            const customTemplates = await contactBookDB.getAllTemplates();
            const hiddenIds = await contactBookDB.getHiddenTemplateIds();

            // 排序 logs，新的在上
            const sortedLogs = logs.sort((a, b) => new Date(b.date) - new Date(a.date));

            set({
                logs: sortedLogs,
                customTemplates: customTemplates || [],
                hiddenTemplateIds: hiddenIds || [],
                isLoading: false
            });

            // 預設載入今日的聯絡簿
            const today = new Date().toISOString().split('T')[0];
            get().loadLogForDate(today);
        } catch (err) {
            console.error('[ContactBookStore] 初始化失敗:', err);
            set({ error: err.message, isLoading: false });
        }
    },

    /**
     * 取得所有模板 (系統預設 + 使用者自訂)
     */
    getAllTemplates: () => {
        const { customTemplates, hiddenTemplateIds } = get();
        const visibleDefaults = DEFAULT_TEMPLATES.filter(tpl => !hiddenTemplateIds.includes(tpl.id));
        return [...visibleDefaults, ...customTemplates];
    },

    /**
     * 載入指定日期的聯絡簿，若不存在則建立一筆空的暫存結構
     */
    loadLogForDate: (dateString) => {
        const existingLog = get().logs.find(l => l.date === dateString);
        if (existingLog) {
            set({ currentLog: existingLog, undoStack: [], redoStack: [] });
        } else {
            set({
                currentLog: {
                    id: `cb_${dateString}`,
                    date: dateString,
                    items: [],
                    lastUpdated: new Date().toISOString()
                },
                undoStack: [],
                redoStack: []
            });
        }
    },

    /**
     * 將 currentLog 儲存至 IndexedDB
     */
    saveCurrentLog: async () => {
        const { currentLog, logs } = get();
        if (!currentLog) return;

        set({ isSaving: true });
        try {
            // 更新最後編輯時間
            const now = new Date();
            const updatedLog = { ...currentLog, lastUpdated: now.toISOString() };
            await contactBookDB.saveLog(updatedLog);

            const filteredLogs = logs.filter(l => l.id !== updatedLog.id);
            const newLogs = [updatedLog, ...filteredLogs].sort((a, b) => new Date(b.date) - new Date(a.date));

            // 格式化為 HH:mm
            const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

            set({
                currentLog: updatedLog,
                logs: newLogs,
                lastSavedTime: timeStr
            });
        } catch (err) {
            console.error('[ContactBookStore] 儲存聯絡簿失敗', err);
            set({ error: err.message });
        } finally {
            set({ isSaving: false });
        }
    },

    /**
     * 新增一筆項目至目前的聯絡簿
     */
    addItemToCurrentLog: (content = '', isImportant = false) => {
        const { currentLog } = get();
        if (!currentLog) return;

        get()._pushUndo();

        const newItem = {
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            content,
            isImportant,
            isChecked: false // 提供黑板模式的大屏互動打勾
        };

        set({
            currentLog: {
                ...currentLog,
                items: [...currentLog.items, newItem]
            }
        });

        // 自動儲存
        get().saveCurrentLog();
    },

    /**
     * 更新目前的聯絡簿內的特定項目
     */
    updateItemInCurrentLog: (itemId, updates) => {
        const { currentLog } = get();
        if (!currentLog) return;

        get()._pushUndo();

        set({
            currentLog: {
                ...currentLog,
                items: currentLog.items.map(item =>
                    item.id === itemId ? { ...item, ...updates } : item
                )
            }
        });

        get().saveCurrentLog();
    },

    /**
     * 刪除目前的聯絡簿內的特定項目
     */
    removeItemFromCurrentLog: (itemId) => {
        const { currentLog } = get();
        if (!currentLog) return;

        get()._pushUndo();

        set({
            currentLog: {
                ...currentLog,
                items: currentLog.items.filter(item => item.id !== itemId)
            }
        });

        get().saveCurrentLog();
    },

    /**
     * 更動項目順序 (支援拖曳排序)
     */
    reorderItemsInCurrentLog: (startIndex, endIndex) => {
        const { currentLog } = get();
        if (!currentLog) return;

        get()._pushUndo();

        const result = Array.from(currentLog.items);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        set({
            currentLog: {
                ...currentLog,
                items: result
            }
        });

        get().saveCurrentLog();
    },

    /**
     * 從歷史的某一天「拷貝」所有項目過來今天
     */
    copyFromDate: (sourceDate) => {
        const { logs, currentLog } = get();
        const sourceLog = logs.find(l => l.date === sourceDate);
        if (!sourceLog || !currentLog) return;

        const copiedItems = sourceLog.items.map(item => ({
            ...item,
            // 賦予全新的 ID 確保 React Key 不重複
            id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
            isChecked: false // 複製過來時重置為未勾選
        }));

        set({
            currentLog: {
                ...currentLog,
                items: [...currentLog.items, ...copiedItems]
            }
        });

        get().saveCurrentLog();
    },

    // --- 自訂模板管理 ---

    addCustomTemplate: async (content, isImportant = false) => {
        const newTemplate = {
            id: `tpl_custom_${Date.now()}`,
            content,
            isImportant
        };

        try {
            await contactBookDB.saveTemplate(newTemplate);
            set(state => ({
                customTemplates: [...state.customTemplates, newTemplate]
            }));
        } catch (err) {
            console.error('[ContactBookStore] 儲存自訂模板失敗', err);
        }
    },

    removeCustomTemplate: async (id) => {
        try {
            await contactBookDB.deleteTemplate(id);
            set(state => ({
                customTemplates: state.customTemplates.filter(t => t.id !== id)
            }));
        } catch (err) {
            console.error('[ContactBookStore] 刪除自訂模板失敗', err);
        }
    },

    toggleTemplateVisibility: async (id) => {
        try {
            const { hiddenTemplateIds } = get();
            let newHiddenIds = [];

            if (hiddenTemplateIds.includes(id)) {
                // 如果已經隱藏就顯示 (不過目前 UI 只有隱藏按鈕，但保留 toggle 能力)
                newHiddenIds = hiddenTemplateIds.filter(hid => hid !== id);
            } else {
                // 隱藏
                newHiddenIds = [...hiddenTemplateIds, id];
            }

            await contactBookDB.saveHiddenTemplateIds(newHiddenIds);
            set({ hiddenTemplateIds: newHiddenIds });
        } catch (err) {
            console.error('[ContactBookStore] 切換預設模板顯示狀態失敗', err);
        }
    },

    // --- Google Drive 雲端備份 ---
    syncMonthToCloud: async (token, yearMonth) => {
        if (!token) throw new Error('未登入 Google 帳號');
        set({ isSaving: true });

        try {
            const { logs } = get();
            // 過濾出指定月份的資料
            const targetLogs = logs.filter(log => log.date.startsWith(yearMonth));
            if (targetLogs.length === 0) {
                set({ isSaving: false });
                return; // 該月無資料，不備份
            }

            await syncContactBookToCloud(token, yearMonth, targetLogs);

        } catch (err) {
            console.error('[ContactBookStore] 備份該月資料失敗:', err);
            throw err;
        } finally {
            set({ isSaving: false });
        }
    },

    restoreMonthFromCloud: async (token, yearMonth) => {
        if (!token) throw new Error('未登入 Google 帳號');
        set({ isLoading: true });

        try {
            const cloudLogs = await fetchContactBookFromCloud(token, yearMonth);
            if (!cloudLogs || !Array.isArray(cloudLogs)) return;

            // 寫入本地 IndexedDB 並更新狀態
            for (const log of cloudLogs) {
                await contactBookDB.saveLog(log);
            }

            const currentLogs = await contactBookDB.getAllLogs();
            set({
                logs: currentLogs.sort((a, b) => new Date(b.date) - new Date(a.date))
            });

        } catch (err) {
            console.error('[ContactBookStore] 還原該月資料失敗:', err);
            throw err;
        } finally {
            set({ isLoading: false });
        }
    }
}));
