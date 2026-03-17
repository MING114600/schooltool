/**
 * 解析 Google Drive 的資料夾或檔案網址，擷取出唯一的 ID
 * 支援格式:
 * - https://drive.google.com/drive/folders/ABCDEFG...
 * - https://drive.google.com/drive/u/1/folders/ABCDEFG...
 * - https://drive.google.com/file/d/ABCDEFG.../view
 * - ABCDEFG... (純 ID)
 * 
 * @param {string} urlOrId 
 * @returns {string|null} folderId 或是 null (無效網址)
 */
export const extractDriveId = (urlOrId) => {
    if (!urlOrId || typeof urlOrId !== 'string') return null;
    
    // 如果傳入的本身就不包含 / 或 .，且長度足夠，可能就是純 ID
    if (!urlOrId.includes('/') && urlOrId.length > 15) {
        return urlOrId.trim();
    }
    
    // 透過正規表達式匹配各種常見的 Google Drive ID 格式
    const regex1 = /\/folders\/([a-zA-Z0-9-_]+)/;
    const regex2 = /\/file\/d\/([a-zA-Z0-9-_]+)/;
    const regex3 = /\?id=([a-zA-Z0-9-_]+)/;

    const match1 = urlOrId.match(regex1);
    if (match1 && match1[1]) return match1[1];

    const match2 = urlOrId.match(regex2);
    if (match2 && match2[1]) return match2[1];

    const match3 = urlOrId.match(regex3);
    if (match3 && match3[1]) return match3[1];

    return null;
};
