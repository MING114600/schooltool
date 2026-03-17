// src/utils/googleDriveService.js
import { SHEET_HEADERS } from '../pages/CaseLog/utils/sheetSchema';

const DRIVE_API = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3/files';
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'; // 🌟 新增 Sheets API 端點

// 定義明確的名稱與路徑
const ROOT_FOLDER_NAME = '智慧教室儀表板';
const EXAM_FOLDER_NAME = '考卷派送檔';
const CASELOG_FOLDER_NAME = '個案日誌檔'; // 🌟 新增個案日誌資料夾
const CASELOG_ATTACHMENTS_FOLDER_NAME = '個案日誌附件檔'; // 🌟 新增：專門存放上傳照片的資料夾
const CONTACTBOOK_FOLDER_NAME = '聯絡簿紀錄'; // 🌟 新增聯絡簿資料夾
const BACKUP_FILE_NAME = 'ClassroomOS_CloudSync.json';

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
 * 核心：獲取或建立資料夾 (支援多層級)
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

// ==========================================
// 模組 1：系統備份與考卷派送 (現有功能)
// ==========================================

export const syncToCloud = async (token, fileName, jsonData) => {
  try {
    const rootFolderId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const targetName = fileName || BACKUP_FILE_NAME;
    let file = await findFileInFolder(token, targetName, rootFolderId);

    if (!file) {
      const createRes = await fetch(DRIVE_API, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: targetName,
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

export const fetchFromCloud = async (token, fileName) => {
  try {
    const rootFolderId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const targetName = fileName || BACKUP_FILE_NAME;
    const file = await findFileInFolder(token, targetName, rootFolderId);
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

export const shareExamToCloud = async (token, examData, customFileName) => {
  try {
    const rootId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const examFolderId = await getOrCreateFolder(token, EXAM_FOLDER_NAME, rootId);

    // 🌟 1. 終極防呆命名邏輯：從各種可能的位置提取標題
    let baseName = '未命名考卷';
    if (customFileName) {
      baseName = customFileName; // 優先使用傳入的自訂檔名
    } else if (examData.packageTitle) {
      baseName = examData.packageTitle; // 其次使用 Payload 上的標題
    } else if (examData.title) {
      baseName = examData.title; // 相容舊版單一考卷
    } else if (examData.exams && examData.exams.length > 0 && examData.exams[0].title) {
      // 處理直接傳入物件但漏傳檔名的情況 (從第一份考卷提取)
      baseName = `[派送考卷]_${examData.exams[0].title}`;
    }

    // 🌟 2. 將 Date.now() 轉換為一般日期時間格式 (YYYYMMDD_HHMM)
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const timeString = `${yyyy}${mm}${dd}_${hh}${min}`; // 產生如 20240315_0930 的字串

    const finalFileName = `${baseName}_${timeString}.json`;

    const createRes = await fetch(DRIVE_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: finalFileName,
        mimeType: 'application/json',
        parents: [examFolderId]
      })
    });
    await checkResponse(createRes);
    const file = await createRes.json();

    const uploadRes = await fetch(`${UPLOAD_API}/${file.id}?uploadType=media`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(examData)
    });
    await checkResponse(uploadRes);

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

export const getCloudBackupTime = async (token, fileName = BACKUP_FILE_NAME) => {
  try {
    const rootFolderId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const file = await findFileInFolder(token, fileName, rootFolderId);
    return file ? file.modifiedTime : null;
  } catch (error) {
    if (error.message === 'TokenExpired') throw error;
    console.error('獲取備份時間失敗:', error);
    return null;
  }
};

export const listSharedExams = async (token) => {
  try {
    const rootId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const examFolderId = await getOrCreateFolder(token, EXAM_FOLDER_NAME, rootId);

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

// ==========================================
// 模組 2：CaseLog 個案日誌 (新增功能)
// ==========================================

/**
 * 建立單一學生的個案日誌 (Google Sheet)
 */
export const createCaseLogSheet = async (token, studentName) => {
  try {
    const rootId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const caseLogFolderId = await getOrCreateFolder(token, CASELOG_FOLDER_NAME, rootId);

    // 1. 透過 Drive API 建立 Spreadsheet 檔案並指定資料夾
    const createRes = await fetch(DRIVE_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `[日誌] ${studentName}`,
        mimeType: 'application/vnd.google-apps.spreadsheet',
        parents: [caseLogFolderId]
      })
    });
    await checkResponse(createRes);
    const file = await createRes.json();
    const spreadsheetId = file.id;

    // 2. 透過 Sheets API 寫入標題列 (Headers)
    const headerRes = await fetch(`${SHEETS_API}/${spreadsheetId}/values/A1:G1?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [SHEET_HEADERS] })
    });
    await checkResponse(headerRes);

    // 3. 凍結第一列 (提升閱讀體驗)
    // 3.1 獲取 sheetId
    const metaRes = await fetch(`${SHEETS_API}/${spreadsheetId}?fields=sheets(properties(sheetId))`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await checkResponse(metaRes);
    const metaData = await metaRes.json();
    const sheetId = metaData.sheets[0].properties.sheetId;

    // 3.2 執行 batchUpdate 凍結
    await fetch(`${SHEETS_API}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [{
          updateSheetProperties: {
            properties: { sheetId: sheetId, gridProperties: { frozenRowCount: 1 } },
            fields: 'gridProperties.frozenRowCount'
          }
        }]
      })
    });

    return spreadsheetId;
  } catch (error) {
    console.error('建立學生日誌失敗:', error);
    throw error;
  }
};

/**
 * 寫入單筆日誌資料 (Append Row)
 */
export const appendCaseLogRow = async (token, spreadsheetId, rowData) => {
  try {
    const res = await fetch(`${SHEETS_API}/${spreadsheetId}/values/A:G:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ values: [rowData] })
    });
    await checkResponse(res);
    return await res.json();
  } catch (error) {
    console.error('寫入日誌資料失敗:', error);
    throw error;
  }
};

/**
 * 讀取學生的所有日誌資料
 */
// src/utils/googleDriveService.js

export const fetchCaseLogData = async (token, spreadsheetId) => {
  try {
    // 🌟 1. 攔截器：先透過 Drive API 檢查檔案是否被丟進垃圾桶
    const driveRes = await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?fields=trashed`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // 🌟 新增：第一道防線，精準捕捉 Token 過期
    if (driveRes.status === 401) {
      throw new Error('TokenExpired');
    }

    if (driveRes.ok) {
      const driveData = await driveRes.json();
      // 如果檔案的 trashed 屬性為 true，直接拋出遺失錯誤
      if (driveData.trashed) {
        console.log(`[Drive API] 檔案 ${spreadsheetId} 已被移至垃圾桶，拒絕讀取。`);
        throw new Error('FILE_MISSING_OR_TRASHED');
      }
    } else if (driveRes.status === 404 || driveRes.status === 403) {
      // ⚠️ 修改：如果是 404 或 403，有可能是因為它是「共編檔案」且我們只有 drive.file 權限
      // 這時候不要馬上報錯，我們「放行」直接去試試看 Sheets API 能不能讀出內容！
      console.warn(`[Drive API] 無法確認 ${spreadsheetId} 狀態，將直接嘗試使用 Sheets API 讀取。`);
    }

    // 🌟 2. 檔案狀態正常 (不在垃圾桶)，才繼續呼叫 Sheets API 讀取內容
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A2:G`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // 🌟 新增：第二道防線，精準捕捉 Token 過期
    if (response.status === 401) {
      throw new Error('TokenExpired');
    }

    if (!response.ok) {
      if (response.status === 404 || response.status === 403 || response.status === 400) {
        throw new Error('FILE_MISSING_OR_TRASHED');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.values || [];
  } catch (error) {
    console.error('讀取試算表失敗:', error);
    throw error;
  }
};

/**
 * 設定唯讀分享權限 (供家長端檢視)
 */
export const shareSheetWithParent = async (token, spreadsheetId) => {
  try {
    // 1. 設定權限
    const permRes = await fetch(`${DRIVE_API}/${spreadsheetId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' })
    });
    await checkResponse(permRes);

    // 2. 獲取 webViewLink
    const fileRes = await fetch(`${DRIVE_API}/${spreadsheetId}?fields=webViewLink`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await checkResponse(fileRes);
    const fileData = await fileRes.json();

    return fileData.webViewLink;
  } catch (error) {
    console.error('設定分享權限失敗:', error);
    throw error;
  }
};

/**
 * 家長端專用：免登入讀取公開的個案日誌
 * 使用 API Key 來讀取設定為 anyone reader 的試算表
 */
export const fetchPublicCaseLog = async (spreadsheetId, apiKey) => {
  try {
    // 1. 取得試算表 metadata (為了拿標題當作學生姓名)
    const metaRes = await fetch(`${SHEETS_API}/${spreadsheetId}?key=${apiKey}`);
    if (!metaRes.ok) throw new Error('無法讀取，可能是權限未開放或網址有誤');
    const metaData = await metaRes.json();

    // 移除我們建立檔案時加上的 "[日誌] " 前綴
    const studentName = metaData.properties.title.replace('[日誌] ', '');

    // 2. 取得實際的日誌資料列 (跳過標題列 A2 開始)
    const dataRes = await fetch(`${SHEETS_API}/${spreadsheetId}/values/A2:G?key=${apiKey}`);
    if (!dataRes.ok) throw new Error('無法讀取日誌內容');
    const data = await dataRes.json();

    return {
      studentName,
      values: data.values || []
    };
  } catch (error) {
    console.error('[DriveService] 讀取公開日誌失敗:', error);
    throw error;
  }
};

// src/utils/googleDriveService.js

/**
 * 🌟 新增：與其他老師共編 (給予特定 Email 編輯權限)
 */
export const shareSheetWithEmail = async (token, sheetId, email) => {
  try {
    const res = await fetch(`${DRIVE_API}/${sheetId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'writer',
        type: 'user',
        emailAddress: email
      })
    });

    // 如果對方信箱不存在或無法授予權限，會拋出錯誤由外層接住
    await checkResponse(res);
    return true;
  } catch (error) {
    console.error(`分享給 ${email} 失敗:`, error);
    throw error;
  }
};

/**
 * 🌟 新增：取得檔案目前的共用權限清單 (用來顯示已經分享給誰)
 */
export const getSharedPermissions = async (token, fileId) => {
  const url = `${DRIVE_API}/${fileId}/permissions?fields=permissions(id,type,emailAddress,role)`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  await checkResponse(res);
  const data = await res.json();
  // 只回傳有 email 的 (使用者或群組)
  return data.permissions?.filter(p => p.emailAddress) || [];
};

/**
 * 🌟 新增：撤銷特定使用者的共用權限
 * @param {string} token - Google Access Token
 * @param {string} fileId - 試算表 ID
 * @param {string} permissionId - 要撤銷的權限 ID (由 getSharedPermissions 取得)
 */
export const removeSharedPermission = async (token, fileId, permissionId) => {
  try {
    const res = await fetch(`${DRIVE_API}/${fileId}/permissions/${permissionId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.status !== 204) await checkResponse(res);
    return true;
  } catch (error) {
    console.error(`撤銷權限失敗 (permissionId: ${permissionId}):`, error);
    throw error;
  }
};

/**
 * 🌟 新增：取得試算表的基本資訊 (主要用於 B 老師匯入時，確認檔案存在並取得檔名)
 */
export const getSpreadsheetInfo = async (token, sheetId) => {
  try {
    // 因為使用者可能只有 drive.file 權限而沒有 spreadsheets 權限，
    // 對於別人分享來的檔案，Drive API 可能回報 404 (如果還沒加到我的雲端硬碟)
    // 我們直接嘗試用 Sheets API 去讀取 metadata。
    // 在很多情況下，只要有編輯權限，即使用了 drive.file token 還是可以讀到基礎資訊。
    const res = await fetch(`${SHEETS_API}/${sheetId}?fields=properties.title,spreadsheetUrl`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // 如果連 Sheets API 都被擋，就拋出
    await checkResponse(res);
    const data = await res.json();
    return {
      id: sheetId,
      name: data.properties.title,
      webViewLink: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${sheetId}`
    };
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('403')) {
      // 💡 終極退路：如果真的抓不到 metadata，但使用者確定有網址，我們可以直接回傳一個「未知名稱」的結構，
      // 讓系統強行綁定這個 ID 進行後續日誌讀寫。如果後續讀寫失敗，自然會在那個階段報錯。
      console.warn('無法取得試算表資訊 (可能權限不足)，將採用強制綁定模式', error);
      return {
        id: sheetId,
        name: `[日誌] 匯入學生_${sheetId.slice(-4)}`, // 給個假名稱
        webViewLink: `https://docs.google.com/spreadsheets/d/${sheetId}`
      };
    }
    console.error('無法讀取試算表資訊:', error);
    throw error;
  }
};

// ==========================================
// 模組 4：Photos 班級相簿 (新增功能)
// ==========================================

export const validatePublicFolder = async (folderId, apiKey) => {
  try {
    const res = await fetch(`${DRIVE_API}/${folderId}?fields=id,name,mimeType&key=${apiKey}`);
    if (!res.ok) throw new Error('資料夾無效或這不是一個公開資料夾');
    const data = await res.json();
    if (data.mimeType !== 'application/vnd.google-apps.folder') {
      throw new Error('提供的連結不是一個資料夾');
    }
    return {
      isValid: true,
      folderName: data.name
    };
  } catch (error) {
    console.error('[Photos] 驗證資料夾失敗:', error);
    return { isValid: false, error: error.message };
  }
};

export const fetchPublicFolderPhotos = async (folderId, apiKey, pageToken = '') => {
  try {
    const q = encodeURIComponent(`'${folderId}' in parents and mimeType contains 'image/' and trashed=false`);
    // 請求 id, name 以及 imageMediaMetadata (為了正確的高寬比)
    let url = `${DRIVE_API}?q=${q}&fields=nextPageToken,files(id,name,imageMediaMetadata)&pageSize=100&orderBy=name&key=${apiKey}`;
    if (pageToken) {
      url += `&pageToken=${pageToken}`;
    }

    const res = await fetch(url);
    if (!res.ok) throw new Error('無法讀取相片，可能無權限或資料夾不存在');
    
    const data = await res.json();
    return {
      files: data.files || [],
      nextPageToken: data.nextPageToken || null
    };
  } catch (error) {
    console.error('[Photos] 讀取相片失敗:', error);
    throw error;
  }
};
// 🌟 更新特定列的日誌資料
export const updateCaseLogRow = async (token, spreadsheetId, rowIndex, rowData) => {
  const response = await fetch(`${SHEETS_API}/${spreadsheetId}/values/A${rowIndex}:G${rowIndex}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values: [rowData] })
  });

  // 🌟 直接使用您寫好的攔截器
  await checkResponse(response);
  return response.json();
};

// 🌟 清除特定列的資料
export const clearCaseLogRow = async (token, spreadsheetId, rowIndex) => {
  const response = await fetch(`${SHEETS_API}/${spreadsheetId}/values/A${rowIndex}:G${rowIndex}:clear`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  // 🌟 直接使用您寫好的攔截器
  await checkResponse(response);
  return response.json();
};

/**
 * 上傳實體圖片至 Google Drive 並設定為公開檢視
 * @param {string} token - Google Access Token
 * @param {File} file - 來自 input 的 File 物件
 * @param {string} studentName - 學生姓名
 * @param {string} sheetId - 試算表 ID
 * @returns {Promise<Object>} 包含 driveId, url 與 name 的 Metadata
 */
export const uploadImageToDrive = async (token, file, studentName, sheetId) => {
  try {
    // 1. 確保附檔根目錄存在
    const rootId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const attachmentsRootId = await getOrCreateFolder(token, CASELOG_ATTACHMENTS_FOLDER_NAME, rootId);

    // 2. 建立專屬學生的子資料夾：[附件] 學生姓名_SheetID後6碼
    const suffix = sheetId ? sheetId.slice(-6) : 'unknown';
    const folderName = `[附件] ${studentName}_${suffix}`;
    const studentFolderId = await getOrCreateFolder(token, folderName, attachmentsRootId);

    // 3. 準備 Multipart 上傳資料 (中介資料 + 檔案本體)
    const metadata = {
      name: `${Date.now()}_${file.name}`,
      mimeType: file.type,
      parents: [studentFolderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    // 3. 執行上傳
    // 注意：使用 FormData 時，Fetch 會自動計算 boundary，切勿手動設定 Content-Type
    const uploadRes = await fetch(`${UPLOAD_API}?uploadType=multipart&fields=id,webViewLink,webContentLink`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    });

    await checkResponse(uploadRes);
    const fileData = await uploadRes.json();

    // 4. 設定為任何人皆可檢視 (確保家長透過網址檢視時不會看到破圖)
    const permRes = await fetch(`${DRIVE_API}/${fileData.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' })
    });
    await checkResponse(permRes);

    return {
      driveId: fileData.id,
      url: fileData.webViewLink || fileData.webContentLink,
      name: file.name
    };
  } catch (error) {
    console.error('圖片上傳至 Drive 失敗:', error);
    throw error;
  }
};

/**
 * 依據資料夾名稱與父資料夾刪除整個資料夾
 * 主要用於刪除學生時，連同其附件資料夾一併刪除
 */
export const deleteCloudFolderByName = async (token, folderName, parentFolderName = CASELOG_ATTACHMENTS_FOLDER_NAME) => {
  try {
    // 1. 取得根目錄與附件區的 ID
    const rootId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const attachmentsFolderId = await getOrCreateFolder(token, parentFolderName, rootId);

    // 2. 尋找目標資料夾
    const q = encodeURIComponent(`name='${folderName}' and '${attachmentsFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
    const res = await fetch(`${DRIVE_API}?q=${q}&fields=files(id)`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    await checkResponse(res);
    const data = await res.json();

    // 3. 如果找到資料夾，呼叫 DELETE API
    if (data.files && data.files.length > 0) {
      const folderId = data.files[0].id;
      const deleteRes = await fetch(`${DRIVE_API}/${folderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      // 204 No Content 代表成功
      if (deleteRes.status !== 204) await checkResponse(deleteRes);
      return true;
    }
    return false; // 資料夾不存在
  } catch (error) {
    console.error(`刪除資料夾 ${folderName} 失敗:`, error);
    throw error; // 視需求決定是否要拋出
  }
};

// ==========================================
// 模組 3：ContactBook 聯絡簿紀錄 (新增功能)
// ==========================================

export const syncContactBookToCloud = async (token, yearMonth, logsData) => {
  try {
    const rootId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const cbFolderId = await getOrCreateFolder(token, CONTACTBOOK_FOLDER_NAME, rootId);

    const fileName = `${yearMonth}_ContactBook.json`;
    let file = await findFileInFolder(token, fileName, cbFolderId);

    if (!file) {
      const createRes = await fetch(DRIVE_API, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: fileName,
          mimeType: 'application/json',
          parents: [cbFolderId]
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
      body: JSON.stringify(logsData)
    });
    await checkResponse(uploadRes);

    return true;
  } catch (error) {
    console.error('聯絡簿雲端備份失敗:', error);
    throw error;
  }
};

export const fetchContactBookFromCloud = async (token, yearMonth) => {
  try {
    const rootId = await getOrCreateFolder(token, ROOT_FOLDER_NAME);
    const cbFolderId = await getOrCreateFolder(token, CONTACTBOOK_FOLDER_NAME, rootId);

    const fileName = `${yearMonth}_ContactBook.json`;
    const file = await findFileInFolder(token, fileName, cbFolderId);

    if (!file) return null;

    const res = await fetch(`${DRIVE_API}/${file.id}?alt=media`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    await checkResponse(res);
    return await res.json();
  } catch (error) {
    console.error('讀取聯絡簿雲端備份失敗:', error);
    throw error;
  }
};

