const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';

const BACKUP_FILE_NAME = 'ClassroomOS_GlobalBackup.json';

/**
 * 輔助函式：檢查 Token 是否過期
 */
const checkResponse = async (res) => {
  if (res.status === 401) {
    throw new Error('TokenExpired'); // 讓外層捕捉並強制登出
  }
  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }
  return res;
};

/**
 * 輔助函式：依據檔名在雲端尋找檔案
 */
const findFileByName = async (token, fileName) => {
  const q = encodeURIComponent(`name='${fileName}' and trashed=false`);
  // 🌟 修改：在網址後面加上 &fields=files(id,modifiedTime) 讓它順便抓時間回來
  const res = await fetch(`${DRIVE_API}?q=${q}&spaces=drive&fields=files(id,modifiedTime)`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  await checkResponse(res);
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0] : null;
};

/**
 * 1. 儲存 / 覆寫全域備份到雲端 (老師跨裝置同步)
 */
export const syncToCloud = async (token, fileName, jsonData) => {
	try {
    let file = await findFileByName(token, BACKUP_FILE_NAME);

    // 如果沒有找到備份檔，先建立一個空檔案 (取得 ID)
    if (!file) {
      const createRes = await fetch(DRIVE_API, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: BACKUP_FILE_NAME, mimeType: 'application/json' })
      });
      await checkResponse(createRes);
      file = await createRes.json();
    }

    // 透過檔案 ID，將最新的 JSON 內容覆寫進去 (uploadType=media)
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
 * 2. 從雲端讀取全域備份 (老師換電腦時下載)
 */
export const fetchFromCloud = async (token) => {
  try {
    const file = await findFileByName(token, BACKUP_FILE_NAME);
    if (!file) return null; // 雲端沒有備份資料

    // 取得檔案的實際內容 (alt=media)
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
 * 3. 建立並派送單份考卷 (學生掃描用)
 * 將檔案設為「知道連結的人皆可讀取」，並回傳檔案 ID (即 shareId)
 */
export const shareExamToCloud = async (token, examData, examTitle) => {
  try {
    const fileName = `[派送考卷]_${examTitle}_${Date.now()}.json`;

    // 步驟一：建立檔案
    const createRes = await fetch(DRIVE_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: fileName, mimeType: 'application/json' })
    });
    await checkResponse(createRes);
    const file = await createRes.json();

    // 步驟二：寫入考卷內容
    const uploadRes = await fetch(`${UPLOAD_API}/${file.id}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(examData)
    });
    await checkResponse(uploadRes);

    // 步驟三：更改權限為「公開讀取」 (關鍵！)
    const permRes = await fetch(`${DRIVE_API}/${file.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' })
    });
    await checkResponse(permRes);

    // 回傳檔案 ID 給外層產生 QR Code
    return file.id; 
  } catch (error) {
    console.error('派送考卷失敗:', error);
    throw error;
  }
};

/**
 * 4. 學生端：免登入下載派送的考卷
 * 注意：因為是公開檔案，所以不需要帶 Authorization Token
 */
export const downloadSharedExam = async (shareId, apiKey) => {
  try {
    // 必須使用 API Key 來存取公開的 Drive 檔案
    const res = await fetch(`${DRIVE_API}/${shareId}?alt=media&key=${apiKey}`);
    if (!res.ok) throw new Error('無法下載考卷，可能是連結失效或權限不符');
    
    return await res.json();
  } catch (error) {
    console.error('下載派送考卷失敗:', error);
    throw error;
  }
};

/**
 * 🌟 新增：獲取雲端最後備份時間
 */
export const getCloudBackupTime = async (token) => {
  try {
    const file = await findFileByName(token, BACKUP_FILE_NAME);
    return file ? file.modifiedTime : null;
  } catch (error) {
    if (error.message === 'TokenExpired') throw error;
    console.error('獲取備份時間失敗:', error);
    return null;
  }
};