// src/utils/backupService.js
import { getAllExamMetas, getExamById, saveExam } from './examDatabase'; // 🌟 引入 IndexedDB 操作

const SYSTEM_KEYS = [
    // --- Dashboard ---
    'timeSlots', 'schedule', 'subjectHints', 'dayTypes', 'is24Hour', 
    'visibleButtons', 'weatherConfig', 'customPresets', 'teacherMessage', 
    'showSidebar', 'isSystemSoundEnabled',
    // --- Manager ---
    'schooltool_classes', 
    'schooltool_current_class_id', 
	// --- ExamTool ---
    'exam_schedule', 'exam_tts_rules', 'exam_announcements', 
    'exam_is_manual_mode', 'exam_manual_attendance',  
    // --- 其他工具 ---
    'lottery_history', 'timer_presets', 'tts_custom_dict' ,
	// --- [NEW] OS / Zhuyin System ---
    'user_custom_polyphones',       // 自訂破音字字典
    'classroom_os_zhuyin_mode',     // 全域注音模式開關狀態
    'os_launcher_pos'               // Launcher 位置 (順便補上)
];

/**
 * 🌟 核心引擎 1：收集全系統資料，產生統一的 Backup Payload
 */
export const generateSystemPayload = async () => {
    const backupData = {
        localStorage: {},
        indexedDB: { exams: [] } // 準備存放考卷
    };
    
    // 1. 收集 LocalStorage 資料
    SYSTEM_KEYS.forEach(key => {
        const item = localStorage.getItem(key);
        if (item !== null) {
            try { 
                backupData.localStorage[key] = JSON.parse(item); 
            } catch (e) { 
                // 🚀 關鍵修復：如果解析失敗 (例如純字串 "default_class")，就直接把原始字串存起來
                backupData.localStorage[key] = item; 
            }
        }
    });

    // 2. 收集 IndexedDB 考卷資料 (報讀助理的考卷)
    try {
        const metas = await getAllExamMetas();
        for (const meta of metas) {
            const exam = await getExamById(meta.id);
            if (exam) backupData.indexedDB.exams.push(exam);
        }
    } catch (e) {
        console.warn('無法讀取 IndexedDB 考卷', e);
    }

    return {
        version: '4.0',
        type: 'universal_system_backup',
        timestamp: new Date().toISOString(),
        data: backupData
    };
};

/**
 * 🌟 核心引擎 2：將 Payload 還原寫入系統
 */
export const restoreFromPayload = async (payload) => {
    if (!payload?.data || payload.type !== 'universal_system_backup') {
        throw new Error('無效的備份檔案格式');
    }

    const { localStorage: lsData, indexedDB: idbData } = payload.data;

    // 1. 還原 LocalStorage
    if (lsData) {
        Object.keys(lsData).forEach(key => {
            if (SYSTEM_KEYS.includes(key)) {
                const value = lsData[key];
                // 🚀 關鍵修復：如果是純字串直接寫入，如果是物件/陣列才做 stringify
                localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
            }
        });
    }

    // 2. 還原 IndexedDB 考卷資料
    if (idbData && Array.isArray(idbData.exams)) {
        for (const exam of idbData.exams) {
            await saveExam(exam); // 逐一寫入資料庫
        }
    }
    
    return true;
};

// ==========================================
// 實體檔案操作 (供 GlobalBackupModal 使用)
// ==========================================

export const exportSystemData = async () => {
    const payload = await generateSystemPayload(); 
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // 🌟 修改：使用指定的繁體中文檔名格式
    const dateString = new Date().toISOString().slice(0, 10);
    a.download = `智慧教室儀錶板設定備份_${dateString}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const importSystemData = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const payload = JSON.parse(event.target.result);
                await restoreFromPayload(payload); // 呼叫核心引擎
                resolve(true);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = () => reject(new Error('讀取檔案失敗'));
        reader.readAsText(file);
    });
};

/**
 * 🌟 核心引擎 3：系統重置 (恢復原廠設定)
 * 清除所有 LocalStorage 設定與 IndexedDB 考卷
 */
export const resetSystem = async () => {
    // 1. 清除 LocalStorage (只清除定義在 SYSTEM_KEYS 的項目，避免誤刪其他網站資料)
    SYSTEM_KEYS.forEach(key => {
        localStorage.removeItem(key);
    });

    // 2. 清除 IndexedDB (刪除整個資料庫)
    // 假設您的 DB 名稱是 'ExamDatabase' (請確認 examDatabase.js 中的名稱)
    const DB_NAME = 'ExamDatabase'; 
    const deleteRequest = indexedDB.deleteDatabase(DB_NAME);

    return new Promise((resolve, reject) => {
        deleteRequest.onsuccess = () => resolve(true);
        deleteRequest.onerror = () => reject(new Error('無法刪除資料庫'));
        deleteRequest.onblocked = () => console.warn('資料庫刪除被阻擋，請關閉其他分頁');
    });
};