// src/utils/idbService.js

const DB_NAME = 'ClassroomDB'; // 🌟 新名稱
const DB_VERSION = 2; // 🌟 版本號
const OLD_DB_NAME = 'ExamReaderDB'; // 舊 DB 名稱 (用於遷移)

// 定義所有的 Store 名稱
export const STORES = {
  EXAMS: 'exams',
  CLASSES: 'classes', // 🌟 新增：班級資料
  METADATA: 'metadata'
};

// 初始化並升級資料庫
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (e) => reject(`DB Error: ${e.target.error}`);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // 1. 建立考卷區 (如果不存在)
      if (!db.objectStoreNames.contains(STORES.EXAMS)) {
        db.createObjectStore(STORES.EXAMS, { keyPath: 'id' });
      }

      // 2. 建立班級區 (🌟 新增)
      if (!db.objectStoreNames.contains(STORES.CLASSES)) {
        db.createObjectStore(STORES.CLASSES, { keyPath: 'id' });
      }
      
      // 3. 建立設定區
      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
  });
};

// ==========================================
// 通用 CRUD 函式 (Generic CRUD)
// ==========================================

// 讀取單筆
export const getItem = async (storeName, key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

// 讀取全部
export const getAllItems = async (storeName) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};

// 寫入/更新單筆
export const saveItem = async (storeName, data) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    // 確保有 updateAt
    const payload = { ...data, updatedAt: new Date().toISOString() };
    const req = tx.objectStore(storeName).put(payload);
    req.onsuccess = () => resolve(payload);
    req.onerror = () => reject(req.error);
  });
};

// 刪除單筆
export const deleteItem = async (storeName, key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(key);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
};

// ==========================================
// 🌟 遷移腳本 (Migration Script)
// ==========================================

export const migrateDataIfNeeded = async () => {
    // 檢查是否已經遷移過 (用 metadata 標記)
    const migrated = await getItem(STORES.METADATA, 'migration_v2_complete');
    if (migrated) return; 

    console.log('🔄 開始資料庫遷移...');

    // 1. 搬移舊 DB (ExamReaderDB) 的資料
    const oldDBRequest = indexedDB.open(OLD_DB_NAME);
    oldDBRequest.onsuccess = async (e) => {
        const oldDB = e.target.result;
        if (oldDB.objectStoreNames.contains('exams')) {
            const tx = oldDB.transaction('exams', 'readonly');
            const req = tx.objectStore('exams').getAll();
            req.onsuccess = async () => {
                const oldExams = req.result;
                // 寫入新 DB
                for (const exam of oldExams) {
                    await saveItem(STORES.EXAMS, exam);
                }
                console.log(`✅ 遷移了 ${oldExams.length} 份考卷`);
                
                // 關閉並刪除舊 DB
                oldDB.close();
                indexedDB.deleteDatabase(OLD_DB_NAME);
            };
        }
    };

    // 2. 搬移 LocalStorage 的班級資料
    const lsClasses = localStorage.getItem('schooltool_classes');
    if (lsClasses) {
        try {
            const classes = JSON.parse(lsClasses);
            for (const cls of classes) {
                await saveItem(STORES.CLASSES, cls);
            }
            console.log(`✅ 遷移了 ${classes.length} 個班級`);
            
            // 標記 LS 資料已遷移 (暫不刪除，為了保險)
            // localStorage.removeItem('schooltool_classes'); 
        } catch (err) {
            console.error('班級遷移失敗', err);
        }
    }

    // 3. 標記完成
    await saveItem(STORES.METADATA, { key: 'migration_v2_complete', value: true });
    console.log('🎉 資料庫遷移完成！');
};