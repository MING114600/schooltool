import { create } from 'zustand';
import { caseLogDB } from '../pages/CaseLog/utils/caseLogDatabase';
import { encodeRowData, decodeRowData } from '../pages/CaseLog/utils/sheetSchema';
import {
    createCaseLogSheet,
    appendCaseLogRow,
    fetchCaseLogData,
    shareSheetWithParent,
    shareSheetWithEmail,      // 🌟 新增：共編分享
    getSpreadsheetInfo,       // 🌟 新增：取得共編檔案資訊
    deleteCloudFile,
    updateCaseLogRow, clearCaseLogRow,
    uploadImageToDrive,
    deleteCloudFolderByName
} from '../services/googleDriveService';

export const useCaseLogStore = create((set, get) => ({
    // --- Core State ---
    students: [],
    activeStudentId: null,
    activeTemplate: [],
    globalTemplates: [], // 🌟 新增：公版模板清單
    logs: [],

    // --- UI Status ---
    isLoading: true,
    isSyncing: false,
    error: null,

    // --- Basic Actions ---
    setStudents: (students) => set({ students }),
    setActiveStudentId: (id) => set({ activeStudentId: id }),
    setActiveTemplate: (template) => set({ activeTemplate: template }),
    setGlobalTemplates: (templates) => set({ globalTemplates: templates }), // 🌟 新增：設定公版模板清單
    setLogs: (logs) => set({ logs }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setIsSyncing: (isSyncing) => set({ isSyncing }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),

    // --- 系統初始化 ---
    loadInitialStudents: async () => {
        try {
            set({ isLoading: true });
            const cachedStudents = await caseLogDB.getStudents();
            if (cachedStudents && cachedStudents.length > 0) {
                set({ students: cachedStudents });
            }
            // 初始化時順便載入公版模板
            get().loadGlobalTemplates();
        } catch (err) {
            console.error('[CaseLogStore] 初始化快取失敗:', err);
        } finally {
            set({ isLoading: false });
        }
    },

    // --- 公版模板管理 ---
    loadGlobalTemplates: async () => {
        try {
            const templates = await caseLogDB.getGlobalTemplates();
            set({ globalTemplates: templates || [] });
        } catch (err) {
            console.error('[CaseLogStore] 載入公版失敗:', err);
        }
    },

    saveGlobalTemplate: async (name, blocks) => {
        try {
            const newTemplate = {
                id: `global_tpl_${Date.now()}`,
                name,
                blocks,
                isPreset: false
            };
            await caseLogDB.saveGlobalTemplate(newTemplate);
            await get().loadGlobalTemplates();
            return newTemplate;
        } catch (err) {
            console.error('[CaseLogStore] 儲存公版失敗:', err);
            throw err;
        }
    },

    deleteGlobalTemplate: async (templateId) => {
        try {
            await caseLogDB.deleteGlobalTemplate(templateId);
            await get().loadGlobalTemplates();
        } catch (err) {
            console.error('[CaseLogStore] 刪除公版失敗:', err);
            throw err;
        }
    },

    applyGlobalTemplate: async (studentId, globalTemplateId) => {
        const { globalTemplates } = get();
        const globalTemplate = globalTemplates.find(t => t.id === globalTemplateId);
        if (!globalTemplate) throw new Error('找不到公版模板');

        try {
            // 深拷貝積木，避免參照污染，並重新產生 block ID
            const safeBlocks = Array.isArray(globalTemplate.blocks) ? globalTemplate.blocks : [];
            const newBlocks = safeBlocks.map(b => ({
                ...b,
                id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
            }));

            await caseLogDB.saveTemplate(studentId, newBlocks);
            set({ activeTemplate: newBlocks });
        } catch (err) {
            console.error('[CaseLogStore] 套用公版失敗:', err);
            throw err;
        }
    },

    // --- 載入特定學生資料 ---
    loadStudentData: async (studentId, user, handleError, setAlertDialog) => {
        const { students } = get();
        // 1. 如果切換走，重置狀態
        if (!studentId) {
            set({ logs: [], activeTemplate: [] });
            return;
        }

        const activeStudent = students.find(s => s.id === studentId);
        if (!activeStudent || !activeStudent.sheetId) return;

        try {
            set({ isSyncing: true, error: null });

            // Step 1: 讀取本地 IndexedDB 快取
            const cachedTemplate = await caseLogDB.getTemplate(studentId);
            if (cachedTemplate) set({ activeTemplate: cachedTemplate });

            const cachedLogs = await caseLogDB.getLogsByStudent(studentId);

            if (cachedLogs && cachedLogs.length > 0) {
                // 🌟 保留去重邏輯：過濾掉快取中重複的日誌
                const uniqueCachedLogs = Array.from(new Map(cachedLogs.map(item => [item.timestamp, item])).values());
                set({ logs: uniqueCachedLogs });
            }

            const localDrafts = cachedLogs ? cachedLogs.filter(log => log.isDraft) : [];

            // Step 2: 雲端同步 (若未登入則跳過雲端同步，僅顯示本地快取)
            if (!user || !user.accessToken) return;
            const token = user.accessToken;

            const rawSheetData = await fetchCaseLogData(token, activeStudent.sheetId);

            const parsedLogs = rawSheetData.map((row, index) => {
                if (!row || row.length === 0) return null; // 過濾掉被 clear 清空的空白列
                const uniqueId = `log_${studentId}_${index}_${row[0]}`;
                const decoded = decodeRowData(row, uniqueId);
                decoded.sheetRowIndex = index + 2; // 🌟 紀錄真實列數 (A2 是第 2 列)
                return decoded;
            }).filter(Boolean).reverse();

            // 🌟 防護 2：將雲端日誌與剛剛提取的本地草稿合併
            const combinedLogs = [...localDrafts, ...parsedLogs];

            set({ logs: combinedLogs });

            // 🌟 核心修正 1：如果目前的 activeTemplate 是空的，從最新的一篇日誌中提取
            const currentTemplate = get().activeTemplate;
            if ((!currentTemplate || currentTemplate.length === 0) && parsedLogs.length > 0) {
                const latestLogWithTemplate = parsedLogs.find(log => log.template && log.template.length > 0);
                if (latestLogWithTemplate) {
                    const extractedTemplate = latestLogWithTemplate.template;
                    await caseLogDB.saveTemplate(studentId, extractedTemplate);
                    set({ activeTemplate: extractedTemplate });
                }
            }

            // 同步回本地 IndexedDB 時，也寫入合併後的完整陣列
            await caseLogDB.syncLogsForStudent(studentId, combinedLogs);

        } catch (err) {
            console.error('[CaseLogStore 錯誤]', err.message);
            const errMsg = err.message || '';

            if (errMsg.includes('FILE_MISSING_OR_TRASHED') || errMsg.includes('404') || errMsg.includes('403')) {
                if (setAlertDialog) {
                    // 如果是共編學生
                    if (activeStudent.isShared) {
                        setAlertDialog({
                            isOpen: true,
                            title: '無法讀取共編個案',
                            message: `無法讀取 ${activeStudent.name} 的日誌檔案。\n可能是原作者已取消您的權限，或檔案已遭刪除。\n\n是否要將此個案從您的清單中移除？`,
                            type: 'confirm',
                            variant: 'danger',
                            confirmText: '移除本地連結',
                            onConfirm: async () => {
                                get().deleteStudentProfile(studentId, false, user, handleError);
                                setAlertDialog(prev => ({ ...prev, isOpen: false }));
                            }
                        });
                    } else {
                        // 如果是自己建立的學生
                        setAlertDialog({
                            isOpen: true,
                            title: '雲端檔案遺失',
                            message: `在 Google Drive 中找不到 ${activeStudent.name} 的日誌檔案。可能是被手動刪除或移至垃圾桶了。\n\n是否要將此學生從系統清單中移除？`,
                            type: 'confirm',
                            variant: 'danger',
                            confirmText: '移除本地紀錄',
                            onConfirm: async () => {
                                get().deleteStudentProfile(studentId, false, user, handleError);
                                setAlertDialog(prev => ({ ...prev, isOpen: false }));
                            }
                        });
                    }
                }
            } else {
                handleError(err, '背景同步失敗，目前顯示為離線快取資料。');
            }
        } finally {
            set({ isSyncing: false });
        }
    },

    // --- 🌟 核心修正 3：新增手動重新整理功能 ---
    refreshStudentLogs: async (studentId, user, handleError) => {
        if (!user || !user.accessToken || !studentId) return;

        const { students } = get();
        const activeStudent = students.find(s => s.id === studentId);
        if (!activeStudent || !activeStudent.sheetId) return;

        try {
            set({ isSyncing: true, error: null });

            const token = user.accessToken;
            const rawSheetData = await fetchCaseLogData(token, activeStudent.sheetId);

            const parsedLogs = rawSheetData.map((row, index) => {
                if (!row || row.length === 0) return null;
                const uniqueId = `log_${studentId}_${index}_${row[0]}`;
                const decoded = decodeRowData(row, uniqueId);
                decoded.sheetRowIndex = index + 2;
                return decoded;
            }).filter(Boolean).reverse();

            // 保留本地草稿
            const { logs } = get();
            const localDrafts = logs.filter(log => log.isDraft);
            const combinedLogs = [...localDrafts, ...parsedLogs];

            set({ logs: combinedLogs });
            await caseLogDB.syncLogsForStudent(studentId, combinedLogs);

            // 更新模板
            const currentTemplate = get().activeTemplate;
            if ((!currentTemplate || currentTemplate.length === 0) && parsedLogs.length > 0) {
                const latestLogWithTemplate = parsedLogs.find(log => log.template && log.template.length > 0);
                if (latestLogWithTemplate) {
                    const extractedTemplate = latestLogWithTemplate.template;
                    await caseLogDB.saveTemplate(studentId, extractedTemplate);
                    set({ activeTemplate: extractedTemplate });
                }
            }
        } catch (err) {
            handleError(err, '重新整理失敗，請檢查網路。');
        } finally {
            set({ isSyncing: false });
        }
    },

    createStudentProfile: async (studentName, user, handleError) => {
        if (!user || !user.accessToken) throw new Error('未登入');
        set({ isSyncing: true, error: null });

        try {
            const token = user.accessToken;
            const sheetId = await createCaseLogSheet(token, studentName);

            const newStudent = {
                id: `student_${Date.now()}`,
                name: studentName,
                sheetId,
                createdAt: new Date().toISOString()
            };

            await caseLogDB.saveStudent(newStudent);
            set(state => ({
                students: [...state.students, newStudent],
                activeStudentId: newStudent.id
            }));
            return newStudent;
        } catch (err) {
            handleError(err, '建立學生檔案失敗，請檢查權限或網路。');
            throw err;
        } finally {
            set({ isSyncing: false });
        }
    },

    // --- 🌟 升級：透過 Google Picker 匯入他人分享的學生檔案 (共編) ---
    importSharedStudent: async (sheetId, fileName, user, handleError) => {
        if (!user || !user.accessToken) throw new Error('未登入');
        set({ isSyncing: true, error: null });

        try {
            const token = user.accessToken;

            // 1. 清理檔名 (移除 "[日誌] " 前綴以還原學生姓名)
            const studentName = (fileName || '未知學生').replace('[日誌] ', '').trim();

            // 2. 檢查本地是否已經有這個學生了
            const { students } = get();
            const exists = students.some(s => s.sheetId === sheetId);
            if (exists) {
                throw new Error(`您已經匯入過「${studentName}」了！`);
            }

            // 3. 嘗試讀取日誌資料以驗證權限 (Picker opened 後 drive.file 應已覆蓋)
            await fetchCaseLogData(token, sheetId);

            // 4. 存入本地資料庫
            const newStudent = {
                id: `student_shared_${Date.now()}`,
                name: studentName,
                sheetId: sheetId,
                isShared: true, // 註記為匯入的共編學生
                createdAt: new Date().toISOString()
            };

            await caseLogDB.saveStudent(newStudent);
            set(state => ({
                students: [...state.students, newStudent],
                activeStudentId: newStudent.id
            }));

            return newStudent;
        } catch (err) {
            // 直接拋出，由 UI 層負責呼叫 setAlertDialog 顯示錯誤
            throw err;
        } finally {
            set({ isSyncing: false });
        }
    },

    // --- 刪除學生檔案 ---
    deleteStudentProfile: async (studentId, deleteFromCloud = false, user, handleError) => {
        const { students, activeStudentId } = get();
        const student = students.find(s => s.id === studentId);
        if (!student) return;

        set({ isSyncing: true });
        try {
            // 🌟 檢查是否為匯入的共編學生
            if (deleteFromCloud && user && user.accessToken && student.sheetId && !student.isShared) {
                // 1. 刪除試算表
                await deleteCloudFile(user.accessToken, student.sheetId);
                // 2. 刪除專屬附件資料夾
                const suffix = student.sheetId.slice(-6);
                const folderName = `[附件] ${student.name}_${suffix}`;
                try {
                    await deleteCloudFolderByName(user.accessToken, folderName);
                } catch (folderErr) {
                    console.warn('忽略附件資料夾刪除錯誤', folderErr);
                }
            } else if (deleteFromCloud && student.isShared) {
                // 共編學生不刪除雲端實體檔案，只移除本地連結
                console.log('匯入的共編學生，僅移除本地端連結，不刪除實體檔案');
            }

            // 無論是否刪除雲端檔案，都清除本地資料
            await caseLogDB.deleteStudent(studentId);

            set(state => ({
                students: state.students.filter(s => s.id !== studentId),
                activeStudentId: state.activeStudentId === studentId ? null : state.activeStudentId
            }));
        } catch (err) {
            handleError(err, '刪除學生檔案失敗');
        } finally {
            set({ isSyncing: false });
        }
    },

    // --- 儲存為本地草稿 ---
    saveDraft: async (logData, existingDraftId = null, user) => {
        const { activeStudentId, students, activeTemplate } = get();
        const activeStudent = students.find(s => s.id === activeStudentId);
        if (!activeStudent) return;

        const draftId = existingDraftId || `draft_${Date.now()}`;
        const draftLog = {
            ...logData,
            id: draftId,
            studentId: activeStudentId,
            template: activeTemplate,
            timestamp: new Date().toISOString(),
            date: logData.date || new Date().toISOString().split('T')[0],
            author: user?.profileObj?.name || '目前登入老師',
            isDraft: true
        };

        try {
            await caseLogDB.saveLog(draftLog);
            set(state => {
                const filtered = state.logs.filter(l => l.id !== draftId);
                return { logs: [draftLog, ...filtered] };
            });
            return draftId;
        } catch (err) {
            console.error('儲存草稿失敗', err);
        }
    },

    // --- 新增並推播雲端日誌 ---
    addLogEntry: async (logData, draftIdToRemove = null, user, handleError) => {
        if (!user || !user.accessToken) throw new Error('未登入');
        const { activeStudentId, students, activeTemplate, logs } = get();

        const activeStudent = students.find(s => s.id === activeStudentId);
        if (!activeStudent || !activeStudent.sheetId) return;

        set({ isSyncing: true, error: null });
        try {
            const token = user.accessToken;

            // 1. 處理附件上傳
            const processedAttachments = [];
            if (logData.attachments && logData.attachments.length > 0) {
                for (const file of logData.attachments) {
                    if (file instanceof File) {
                        const driveData = await uploadImageToDrive(token, file, activeStudent.name, activeStudent.sheetId);
                        processedAttachments.push(driveData);
                    } else {
                        processedAttachments.push(file);
                    }
                }
            }

            const fullLogData = {
                ...logData,
                attachments: processedAttachments,
                template: activeTemplate,
                timestamp: new Date().toISOString(),
                date: logData.date || new Date().toISOString().split('T')[0],
                author: user?.profileObj?.name || '目前登入老師'
            };

            const rowData = encodeRowData(fullLogData);
            const result = await appendCaseLogRow(token, activeStudent.sheetId, rowData);

            const newLog = decodeRowData(rowData, `log_${Date.now()}`);
            newLog.studentId = activeStudentId;
            newLog.attachments = processedAttachments;

            const match = result?.updates?.updatedRange?.match(/\d+/g);
            newLog.sheetRowIndex = match ? parseInt(match[match.length - 1], 10) : (logs.length + 2);

            await caseLogDB.saveLog(newLog);

            if (draftIdToRemove && caseLogDB.deleteLog) {
                await caseLogDB.deleteLog(draftIdToRemove).catch(() => { });
            }

            set(state => {
                const next = draftIdToRemove ? state.logs.filter(l => l.id !== draftIdToRemove) : state.logs;
                return { logs: [newLog, ...next] };
            });
        } catch (err) {
            handleError(err, '日誌儲存失敗。若處於離線狀態，請稍後重試。');
            throw err;
        } finally {
            set({ isSyncing: false });
        }
    },

    // --- 更新雲端日誌 ---
    updateLogEntry: async (logId, updatedData, user, handleError) => {
        if (!user || !user.accessToken) throw new Error('未登入');
        const { activeStudentId, students, activeTemplate, logs } = get();

        const activeStudent = students.find(s => s.id === activeStudentId);
        const targetLog = logs.find(l => l.id === logId);
        if (!activeStudent || !targetLog || !targetLog.sheetRowIndex) return;

        set({ isSyncing: true });
        try {
            const token = user.accessToken;

            // 1. 處理被刪除的附件
            const oldAttachments = targetLog.attachments || [];
            const newAttachments = updatedData.attachments || [];
            const removedAttachments = oldAttachments.filter(
                oldAtt => !newAttachments.some(newAtt => newAtt.driveId === oldAtt.driveId)
            );

            for (const att of removedAttachments) {
                if (att.driveId) {
                    try {
                        await deleteCloudFile(token, att.driveId);
                    } catch (e) {
                        console.error(`刪除舊圖片 ${att.driveId} 失敗`, e);
                    }
                }
            }

            // 2. 處理新上傳的附件
            const processedAttachments = [];
            for (const file of newAttachments) {
                if (file instanceof File) {
                    const driveData = await uploadImageToDrive(token, file, activeStudent.name, activeStudent.sheetId);
                    processedAttachments.push(driveData);
                } else {
                    processedAttachments.push(file);
                }
            }

            const fullLogData = {
                ...targetLog,
                ...updatedData,
                attachments: processedAttachments,
                template: activeTemplate,
                author: targetLog.author.includes('(已編輯)') ? targetLog.author : `${targetLog.author} (已編輯)`
            };

            const rowData = encodeRowData(fullLogData);
            await updateCaseLogRow(token, activeStudent.sheetId, targetLog.sheetRowIndex, rowData);

            const updatedLog = { ...fullLogData };
            await caseLogDB.saveLog(updatedLog);

            set(state => ({
                logs: state.logs.map(l => l.id === logId ? updatedLog : l)
            }));
        } catch (err) {
            handleError(err, '更新日誌失敗。');
            throw err;
        } finally {
            set({ isSyncing: false });
        }
    },

    // --- 刪除雲端(或本地)日誌 ---
    deleteSingleLog: async (logId, user, handleError) => {
        const { activeStudentId, students, logs } = get();
        const activeStudent = students.find(s => s.id === activeStudentId);
        const targetLog = logs.find(l => l.id === logId);

        if (!activeStudent || !targetLog) return;
        if (!targetLog.isDraft && !targetLog.sheetRowIndex) return;

        set({ isSyncing: true });
        try {
            if (targetLog.isDraft) {
                if (caseLogDB.deleteLog) await caseLogDB.deleteLog(logId);
                set(state => ({ logs: state.logs.filter(l => l.id !== logId) }));
                return;
            }

            if (!user || !user.accessToken) throw new Error('未登入');
            const token = user.accessToken;

            if (targetLog.attachments && targetLog.attachments.length > 0) {
                for (const att of targetLog.attachments) {
                    if (att.driveId) {
                        try {
                            await deleteCloudFile(token, att.driveId);
                        } catch (imgErr) {
                            console.error(`圖片 ${att.driveId} 刪除失敗，略過此檔案`, imgErr);
                        }
                    }
                }
            }

            await clearCaseLogRow(token, activeStudent.sheetId, targetLog.sheetRowIndex);

            set(state => ({ logs: state.logs.filter(l => l.id !== logId) }));
        } catch (err) {
            handleError(err, '刪除日誌失敗。');
            throw err;
        } finally {
            set({ isSyncing: false });
        }
    },

    // --- 更新模板 ---
    saveTemplate: async (newTemplate) => {
        const { activeStudentId } = get();
        if (!activeStudentId) return;

        set({ isSyncing: true });
        try {
            await caseLogDB.saveTemplate(activeStudentId, newTemplate);
            set({ activeTemplate: newTemplate });
        } catch (err) {
            set({ error: '模板儲存失敗。' });
            throw err;
        } finally {
            set({ isSyncing: false });
        }
    },

    // --- 產生家長檢視連結 ---
    generateParentLink: async (user, handleError) => {
        if (!user || !user.accessToken) throw new Error('未登入');
        const { activeStudentId, students } = get();
        const activeStudent = students.find(s => s.id === activeStudentId);
        if (!activeStudent || !activeStudent.sheetId) throw new Error('無效的學生檔案');

        set({ isSyncing: true });
        try {
            const token = user.accessToken;
            await shareSheetWithParent(token, activeStudent.sheetId);

            const basePath = import.meta.env.BASE_URL || '/';
            const originWithBase = `${window.location.origin}${basePath}`.replace(/\/$/, '');
            const fakeToken = btoa(`${activeStudent.sheetId}_${Date.now()}`);

            return `${originWithBase}/parent/view?id=${activeStudent.sheetId}&token=${fakeToken}`;
        } catch (err) {
            handleError(err, '產生家長連結失敗。');
            throw err;
        } finally {
            set({ isSyncing: false });
        }
    }
}));
