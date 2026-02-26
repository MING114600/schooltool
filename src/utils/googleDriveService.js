// src/utils/googleDriveService.js

const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';

// 🌟 構想 1 & 2：定義明確的名稱與路徑
const ROOT_FOLDER_NAME = '智慧教室儀表板';
const EXAM_FOLDER_NAME = '考卷派送檔';
const BACKUP_FILE_NAME = '智慧教室儀表板設定檔.json'; 

/**
 * 輔助函式：檢查 Token 是否過期或 API 異常
 */
const checkResponse = async (res) => {
  if (res.status === 401) {
    throw new Error('TokenExpired');
  }
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`API Error: ${res.status} - ${errorData.error?.message || 'Unknown'}`);
  }
  return res;
};

/**
 * 🌟 核心：獲取或建立資料夾 (支援多層級)
 */
const getOrCreateFolder = async (token, folderName, parentId = null) => {
  let q = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  if (parentId) {
    q += ` and '${parentId}' in parents`;
  } else {
    q += ` and 'root' in parents`;
  }

  const res = await fetch(`${DRIVE_API}?q=${encodeURIComponent(q)}&fields=files(id)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  await checkResponse(res);
  const data = await res.json();

  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }

  // 若資料夾不存在則建立
  const createRes = await fetch(DRIVE_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : []
    })
  });
  await checkResponse(createRes);
  const folder = await createRes.json();
  return folder.id;
};

/**
 * 輔助函式：在指定資料夾內依據檔名尋找檔案
 */
const findFileInFolder = async (token, fileName, folderId) => {
  const q = encodeURIComponent(`name='${fileName}' and '${folderId}' in parents and trashed=false`);
  const res = await fetch(`${DRIVE_API}?q=${q}&spaces=drive&fields=files(id,modifiedTime)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  await checkResponse(res);
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0] : null;
};

/**
 * 1. 儲存 / 覆寫全域備份到雲端 (存放在「智慧教室儀表板」資料夾)
 */
export const syncToCloud = async (token, fileName, jsonData) => {
  try {
    // 確保根目錄資料夾存在
    const rootFolderId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    let file = await findFileInFolder(token, BACKUP_FILE_NAME, rootFolderId);

    if (!file) {
      const createRes = await fetch(DRIVE_API, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          name: BACKUP_FILE_NAME, 
          mimeType: 'application/json',
          parents: [rootFolderId] 
        })
      });
      await checkResponse(createRes);
      file = await createRes.json();
    }

    const uploadRes = await fetch(`${UPLOAD_API}/${file.id}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(jsonData)
    });
    await checkResponse(uploadRes);
    
    return true;
  } catch (error) {
    console.error('雲端同步失敗:', error);
    throw error;
  }
};

/**
 * 2. 從雲端讀取全域備份 (從指定資料夾抓取)
 */
export const fetchFromCloud = async (token) => {
  try {
    const rootFolderId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const file = await findFileInFolder(token, BACKUP_FILE_NAME, rootFolderId);
    if (!file) return null;

    const res = await fetch(`${DRIVE_API}/${file.id}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await checkResponse(res);
    return await res.json();
  } catch (error) {
    console.error('讀取雲端備份失敗:', error);
    throw error;
  }
};

/**
 * 3. 建立並派送單份考卷 (存放在「智慧教室儀表板/考卷派送檔」資料夾)
 */
export const shareExamToCloud = async (token, examData, customFileName) => {
  try {
    const rootId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const examFolderId = await getOrCreateFolder(token, EXAM_FOLDER_NAME, rootId);
    
    // 🌟 關鍵修改：直接使用傳入的名稱 + 時間戳記
    // 這樣如果是單份，檔名就會是 "[派送考卷]_國語..."
    // 如果是多份，檔名就會是 "[派送考卷包]_共X份..."
    const finalFileName = `${customFileName}_${Date.now()}.json`;

    // 建立檔案於考卷資料夾
    const createRes = await fetch(DRIVE_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        name: finalFileName, // 使用新變數
        mimeType: 'application/json',
        parents: [examFolderId]
      })
    });
    await checkResponse(createRes);
    const file = await createRes.json();

    // 寫入內容
    const uploadRes = await fetch(`${UPLOAD_API}/${file.id}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(examData)
    });
    await checkResponse(uploadRes);

    // 權限設定
    const permRes = await fetch(`${DRIVE_API}/${file.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' })
    });
    await checkResponse(permRes);

    return file.id; 
  } catch (error) {
    console.error('派送考卷失敗:', error);
    throw error;
  }
};

/**
 * 4. 學生端：免登入下載派送的考卷 (不變)
 */
export const downloadSharedExam = async (shareId, apiKey) => {
  try {
    const res = await fetch(`${DRIVE_API}/${shareId}?alt=media&key=${apiKey}`);
    if (!res.ok) throw new Error('無法下載考卷，可能是連結失效或權限不符');
    return await res.json();
  } catch (error) {
    console.error('下載派送考卷失敗:', error);
    throw error;
  }
};

/**
 * 🌟 獲取雲端最後備份時間 (修正路徑)
 */
export const getCloudBackupTime = async (token) => {
  try {
    const rootFolderId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const file = await findFileInFolder(token, BACKUP_FILE_NAME, rootFolderId);
    return file ? file.modifiedTime : null;
  } catch (error) {
    if (error.message === 'TokenExpired') throw error;
    console.error('獲取備份時間失敗:', error);
    return null;
  }
};

// src/utils/googleDriveService.js 

/**
 * 5. 獲取所有已派送的考卷清單
 */
export const listSharedExams = async (token) => {
  try {
    const rootId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const examFolderId = await getOrCreateFolder(token, EXAM_FOLDER_NAME, rootId);

    // 抓取該資料夾下的所有 JSON 檔，並取得 ID、名稱與修改時間
    const q = encodeURIComponent(`'${examFolderId}' in parents and trashed=false`);
    const res = await fetch(`${DRIVE_API}?q=${q}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await checkResponse(res);
    const data = await res.json();
    return data.files || [];
  } catch (error) {
    console.error('獲取考卷清單失敗:', error);
    throw error;
  }
};

/**
 * 6. 刪除雲端考卷檔案
 */
export const deleteCloudFile = async (token, fileId) => {
  try {
    const res = await fetch(`${DRIVE_API}/${fileId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status !== 204) await checkResponse(res);
    return true;
  } catch (error) {
    console.error('刪除檔案失敗:', error);
    throw error;
  }
};