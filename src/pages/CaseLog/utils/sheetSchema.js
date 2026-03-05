// src/pages/CaseLog/utils/sheetSchema.js
export const SHEET_HEADERS = [
  'Timestamp', 'Author', 'Date', 'Template_ID', 'Content_JSON', 'Private_Note', 'Attachments'
];

export const encodeRowData = (logEntry) => {
  // 將填寫的值 (values) 與當下的模板配置 (template) 一起打包
  const payload = {
    values: logEntry.content || {},
    template: logEntry.template || [] 
  };

  return [
    logEntry.timestamp || new Date().toISOString(),
    logEntry.author || '未設定記錄者',
    logEntry.date || new Date().toISOString().split('T')[0],
    logEntry.templateId || 'default',
    JSON.stringify(payload), // 將打包後的 payload 轉為字串存入 E 欄
    logEntry.privateNote || '',
    
    // 🌟 關鍵修改：將物件陣列 (包含 driveId, url 等) 轉為 JSON 字串存入 G 欄
    JSON.stringify(logEntry.attachments || [])
  ];
};

export const decodeRowData = (row, logId) => {
  const safeRow = row || [];
  
  // 給予預設的安全結構
  let parsedPayload = { values: {}, template: [] }; 
  try {
    if (safeRow[4]) {
      parsedPayload = JSON.parse(safeRow[4]);
    }
  } catch (error) {
    console.error(`[CaseLog Schema] JSON 解析失敗 (Row ID: ${logId}):`, error);
  }

  // 🌟 關鍵修改：安全解析附件的 JSON 字串
  let parsedAttachments = [];
  if (safeRow[6]) {
    try {
      parsedAttachments = JSON.parse(safeRow[6]);
    } catch (error) {
      // 容錯機制：如果讀取到舊版的逗號分隔字串，將它轉回物件格式避免系統崩潰
      parsedAttachments = safeRow[6].split(',').filter(Boolean).map(url => ({ 
        url: url, 
        name: '舊版附件',
        driveId: null // 舊版無 driveId 無法從雲端刪除，但至少不會報錯
      }));
    }
  }

  return {
    id: logId,
    timestamp: safeRow[0] || '',
    author: safeRow[1] || '',
    date: safeRow[2] || '',
    templateId: safeRow[3] || '',
    // 直接明確地讀取打包好的結構
    content: parsedPayload.values || {},
    template: parsedPayload.template || [],
    privateNote: safeRow[5] || '',
    
    // 🌟 賦值解析後的附件陣列
    attachments: parsedAttachments
  };
};