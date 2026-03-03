// src/utils/caseLogDatabase.js

const DB_NAME = 'ClassroomOS_CaseLogDB';
const DB_VERSION = 2;

const STORES = {
  STUDENTS: 'students',         // 儲存學生清單與 Sheet ID
  TEMPLATES: 'templates',       // 儲存學生專屬的日誌模板 JSON
  GLOBAL_TEMPLATES: 'global_templates', // 🌟 新增：儲存系統公版模板庫
  LOGS: 'logs',                 // 儲存近期的日誌快取 (以 studentId 為 Index)
  SYNC_QUEUE: 'sync_queue'      // 離線待同步佇列 (存放尚未寫入 Google Drive 的操作)
};

/**
 * 初始化 CaseLog 資料庫
 * @returns {Promise<IDBDatabase>}
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('[CaseLogDB] 資料庫開啟失敗:', event.target.error);
      reject(event.target.error);
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. 學生清單 Store (Key: studentId)
      if (!db.objectStoreNames.contains(STORES.STUDENTS)) {
        db.createObjectStore(STORES.STUDENTS, { keyPath: 'id' });
      }

      // 2. 模板 Store (Key: studentId)
      if (!db.objectStoreNames.contains(STORES.TEMPLATES)) {
        db.createObjectStore(STORES.TEMPLATES, { keyPath: 'studentId' });
      }

      // 3. 日誌快取 Store (Key: logId)
      if (!db.objectStoreNames.contains(STORES.LOGS)) {
        const logsStore = db.createObjectStore(STORES.LOGS, { keyPath: 'id' });
        // 建立索引，方便依據 studentId 查詢特定學生的日誌
        logsStore.createIndex('studentId', 'studentId', { unique: false });
        logsStore.createIndex('date', 'date', { unique: false });
      }

      // 4. 離線同步佇列 Store (Key: 系統生成的 UUID 或 Timestamp)
      if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
        db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
      }

      // 5. 公版模板庫 Store (Key: id)
      if (!db.objectStoreNames.contains(STORES.GLOBAL_TEMPLATES)) {
        db.createObjectStore(STORES.GLOBAL_TEMPLATES, { keyPath: 'id' });
      }
    };
  });
};

/**
 * 通用：取得 Store 中的所有資料
 */
const getAll = async (storeName) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

/**
 * 通用：儲存單筆資料至指定 Store
 */
const putItem = async (storeName, item) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

/**
 * 通用：依據 Key 取得單筆資料
 */
const getItem = async (storeName, key) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

// ==========================================
// 模組專用 API (供 CaseLogContext 呼叫)
// ==========================================

export const caseLogDB = {
  // --- 學生清單管理 ---
  getStudents: () => getAll(STORES.STUDENTS),
  saveStudent: (student) => putItem(STORES.STUDENTS, student),
  saveStudentsBatch: async (students) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.STUDENTS, 'readwrite');
      const store = transaction.objectStore(STORES.STUDENTS);
      students.forEach(student => store.put(student));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  deleteStudent: async (studentId) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      // 開啟多個 Store 的 Transaction，一次清乾淨
      const transaction = db.transaction([STORES.STUDENTS, STORES.TEMPLATES, STORES.LOGS], 'readwrite');

      transaction.objectStore(STORES.STUDENTS).delete(studentId);
      transaction.objectStore(STORES.TEMPLATES).delete(studentId);

      // 刪除該學生的所有日誌
      const logsStore = transaction.objectStore(STORES.LOGS);
      const index = logsStore.index('studentId');
      const request = index.openCursor(IDBKeyRange.only(studentId));

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // --- 客製化模板管理 ---
  getTemplate: async (studentId) => {
    const data = await getItem(STORES.TEMPLATES, studentId);
    return data ? data.blocks : [];
  },
  saveTemplate: (studentId, blocks) => putItem(STORES.TEMPLATES, { studentId, blocks, updatedAt: new Date().toISOString() }),

  // --- 公版模板庫管理 ---
  getGlobalTemplates: () => getAll(STORES.GLOBAL_TEMPLATES),
  saveGlobalTemplate: (template) => putItem(STORES.GLOBAL_TEMPLATES, { ...template, updatedAt: new Date().toISOString() }),
  deleteGlobalTemplate: async (templateId) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.GLOBAL_TEMPLATES, 'readwrite');
      const store = transaction.objectStore(STORES.GLOBAL_TEMPLATES);
      const request = store.delete(templateId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // --- 日誌快取管理 ---
  getLogsByStudent: async (studentId) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.LOGS, 'readonly');
      const store = transaction.objectStore(STORES.LOGS);
      const index = store.index('studentId');
      const request = index.getAll(studentId);

      request.onsuccess = () => {
        // 預設依據日期/時間戳降冪排序 (新到舊)
        const sortedLogs = (request.result || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        resolve(sortedLogs);
      };
      request.onerror = () => reject(request.error);
    });
  },
  saveLog: (log) => putItem(STORES.LOGS, log),

  deleteLog: async (logId) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.LOGS, 'readwrite');
      const store = transaction.objectStore(STORES.LOGS);
      const request = store.delete(logId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  // 批次更新特定學生的日誌快取 (通常用於從 Google Drive 載入最新資料後覆蓋本地)
  syncLogsForStudent: async (studentId, logs) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.LOGS, 'readwrite');
      const store = transaction.objectStore(STORES.LOGS);

      // 寫入新資料 (由於使用 put，已存在的 ID 會被覆蓋)
      logs.forEach(log => {
        if (!log.studentId) log.studentId = studentId; // 確保有關聯 ID
        store.put(log);
      });

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  },

  // --- 離線同步佇列管理 (備用) ---
  addToSyncQueue: (actionType, payload) => {
    const item = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      actionType, // 例如: 'ADD_LOG', 'UPDATE_TEMPLATE'
      payload,
      timestamp: new Date().toISOString()
    };
    return putItem(STORES.SYNC_QUEUE, item);
  },
  getSyncQueue: () => getAll(STORES.SYNC_QUEUE),
  removeFromSyncQueue: async (id) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.SYNC_QUEUE, 'readwrite');
      const store = transaction.objectStore(STORES.SYNC_QUEUE);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

