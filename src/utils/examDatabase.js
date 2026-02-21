// src/utils/examDatabase.js

const DB_NAME = 'ExamReaderDB';
const DB_VERSION = 1;
const STORE_EXAMS = 'exams';
const STORE_META = 'metadata';

// 初始化資料庫
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject(`資料庫連線失敗: ${event.target.error}`);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // 建立考卷儲存區 (以 id 為主鍵)
      if (!db.objectStoreNames.contains(STORE_EXAMS)) {
        db.createObjectStore(STORE_EXAMS, { keyPath: 'id' });
      }
      
      // 建立設定儲存區 (用來記錄考卷排序等全域設定)
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
  });
};

// 1. 儲存或更新考卷
export const saveExam = async (examData) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_EXAMS], 'readwrite');
    const store = transaction.objectStore(STORE_EXAMS);
    
    // 確保擁有必要欄位
    const dataToSave = {
      ...examData,
      updatedAt: new Date().toISOString()
    };

    const request = store.put(dataToSave);
    request.onsuccess = () => resolve(dataToSave);
    request.onerror = (event) => reject(`儲存考卷失敗: ${event.target.error}`);
  });
};

// 2. 取得所有考卷的「基本資訊」(供下拉選單使用，不含完整的 items 以節省記憶體)
export const getAllExamMetas = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_EXAMS], 'readonly');
    const store = transaction.objectStore(STORE_EXAMS);
    const request = store.getAll();

    request.onsuccess = (event) => {
      const allExams = event.target.result;
      // 只提取選單需要的輕量級資料
      const metas = allExams.map(exam => ({
        id: exam.id,
        title: exam.title,
        updatedAt: exam.updatedAt
      }));
      resolve(metas);
    };
    request.onerror = (event) => reject(`讀取考卷清單失敗: ${event.target.error}`);
  });
};

// 3. 根據 ID 取得單一考卷的「完整內容」
export const getExamById = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_EXAMS], 'readonly');
    const store = transaction.objectStore(STORE_EXAMS);
    const request = store.get(id);

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(`讀取考卷失敗: ${event.target.error}`);
  });
};

// 4. 刪除特定考卷
export const deleteExam = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_EXAMS], 'readwrite');
    const store = transaction.objectStore(STORE_EXAMS);
    const request = store.delete(id);

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(`刪除考卷失敗: ${event.target.error}`);
  });
};

// 5. 儲存自訂考卷排序 (存入 metadata 區塊)
export const saveExamOrder = async (orderArray) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_META], 'readwrite');
    const store = transaction.objectStore(STORE_META);
    const request = store.put({ key: 'exam_order', order: orderArray });

    request.onsuccess = () => resolve(true);
    request.onerror = (event) => reject(`儲存排序失敗: ${event.target.error}`);
  });
};

// 6. 讀取自訂考卷排序
export const getExamOrder = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_META], 'readonly');
    const store = transaction.objectStore(STORE_META);
    const request = store.get('exam_order');

    request.onsuccess = (event) => {
      resolve(event.target.result ? event.target.result.order : []);
    };
    request.onerror = (event) => reject(`讀取排序失敗: ${event.target.error}`);
  });
};