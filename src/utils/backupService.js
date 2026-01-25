// 定義系統中所有需要備份的 localStorage Key
const SYSTEM_KEYS = [
    // --- Dashboard (時鐘) ---
    'timeSlots', 'schedule', 'subjectHints', 'dayTypes', 'is24Hour', 
    'visibleButtons', 'weatherConfig', 'customPresets', 'teacherMessage', 
    'showSidebar', 'isSystemSoundEnabled',
    
    // --- Manager (班級管理) ---
    'classroom_data', // 包含學生名單、座位表、成績
    
    // --- 其他工具 ---
    'lottery_history', // 假設未來有抽籤歷史
    'timer_presets'    // 假設未來有計時器預設值
];

/**
 * 執行全系統匯出
 */
export const exportSystemData = () => {
    const backupData = {};
    
    SYSTEM_KEYS.forEach(key => {
        const item = localStorage.getItem(key);
        if (item) {
            try {
                backupData[key] = JSON.parse(item);
            } catch (e) {
                console.warn(`[Backup] Failed to parse key: ${key}`, e);
            }
        }
    });

    const payload = {
        version: '4.0', // 統一大版本號
        type: 'universal_system_backup',
        timestamp: new Date().toISOString(),
        data: backupData
    };

    // 觸發下載
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Classroom_System_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

/**
 * 執行全系統還原
 * @param {File} file 使用者上傳的檔案
 * @returns {Promise<boolean>} 是否成功
 */
export const importSystemData = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const payload = JSON.parse(event.target.result);
                
                // 簡單的格式檢查
                if (!payload.data || !payload.type) {
                    throw new Error('無效的備份檔案格式');
                }

                // 開始還原
                Object.keys(payload.data).forEach(key => {
                    // 只還原我們定義在 SYSTEM_KEYS 裡的項目，避免寫入垃圾資料
                    if (SYSTEM_KEYS.includes(key)) {
                        localStorage.setItem(key, JSON.stringify(payload.data[key]));
                    }
                });

                resolve(true);
            } catch (err) {
                console.error('[Restore] Error:', err);
                reject(err);
            }
        };
        
        reader.onerror = () => reject(new Error('讀取檔案失敗'));
        reader.readAsText(file);
    });
};