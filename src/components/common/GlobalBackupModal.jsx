// src/components/common/GlobalBackupModal.jsx
import React, { useState, useEffect } from 'react'; // 🌟 記得引入 useEffect
import { 
  X, Database, CloudUpload, CloudDownload, 
  HardDriveDownload, HardDriveUpload, Loader2, AlertCircle, CheckCircle2, Clock, Trash2, AlertTriangle
} from 'lucide-react'; // 🌟 新增 Clock 圖示

// 引入全域共用的對話框模組
import DialogModal from './DialogModal';

// 引入我們寫好的兩支核心工具
import { exportSystemData, importSystemData, generateSystemPayload, restoreFromPayload, resetSystem } from '../../utils/backupService';
import { syncToCloud, fetchFromCloud, getCloudBackupTime } from '../../utils/googleDriveService';

const CLOUD_FILE_NAME = 'ClassroomOS_CloudSync.json';

const GlobalBackupModal = ({ isOpen, onClose, user, login }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' }); // type: 'success' | 'error' | ''

  // 🌟 新增：控制 DialogModal 的狀態
  const [cloudConfirmOpen, setCloudConfirmOpen] = useState(false);
  const [localConfirmOpen, setLocalConfirmOpen] = useState(false);
  const [pendingLocalFile, setPendingLocalFile] = useState(null); // 暫存老師選擇的實體檔案
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false); // 控制重置確認框
  
  // 🌟 新增：備份時間狀態
  const [lastBackupTime, setLastBackupTime] = useState(null);
  const [isLoadingTime, setIsLoadingTime] = useState(false);

  // 🌟 新增：憑證過期重登的 Dialog 狀態
  const [authExpiredOpen, setAuthExpiredOpen] = useState(false);

  // 🌟 新增：當 Modal 打開且有使用者登入時，自動抓取雲端備份時間
useEffect(() => {
    const fetchTime = async () => {           
      if (!isOpen || !user || !user.accessToken) {
        setLastBackupTime(null);
        return;
      }
      
      setIsLoadingTime(true);
      try {        
        const timeStr = await getCloudBackupTime(user.accessToken);
                
        if (timeStr) {
          setLastBackupTime(new Date(timeStr).toLocaleString('zh-TW', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit'
          }));
        } else {
          setLastBackupTime('尚無備份紀錄');
        }
      } catch (err) {        
        if (err.message === 'TokenExpired') {
          setLastBackupTime('憑證已過期');
        } else {
          setLastBackupTime('讀取失敗');
        }
      } finally {
        setIsLoadingTime(false);
      }
    };
    
    fetchTime();
  }, [isOpen, user]); // 確保依賴陣列有 isOpen 和 user

  // 輔助函式：顯示狀態訊息
  const showMessage = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 5000);
  };

  // ==========================================
  // ☁️ 雲端同步邏輯
  // ==========================================
  
  const handleCloudBackup = async () => {
    if (!user) { login(); return; }
    
    setIsProcessing(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const payload = await generateSystemPayload();
      await syncToCloud(user.accessToken, CLOUD_FILE_NAME, payload);
      showMessage('success', '雲端備份成功！資料已安全同步至 Google Drive。');
      
      // 🌟 備份成功後，更新畫面上顯示的時間
      setLastBackupTime(new Date().toLocaleString('zh-TW', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit'
      }));
    } catch (err) {
      console.error("🔥 雲端備份詳細錯誤:", err);
      if (err.message === 'TokenExpired') {
        // 🌟 改為觸發重新登入視窗
        setAuthExpiredOpen(true);
      } else {
        showMessage('error', '雲端備份失敗，請確認網路連線。');
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  // 觸發雲端還原確認視窗
  const triggerCloudRestore = () => {
    if (!user) {
      login();
      return;
    }
    setCloudConfirmOpen(true);
  };

  // 實際執行雲端還原
  const executeCloudRestore = async () => {
    setIsProcessing(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const cloudData = await fetchFromCloud(user.accessToken, CLOUD_FILE_NAME);
      if (!cloudData) {
        showMessage('error', '在雲端找不到您的備份紀錄。請確認您之前是否有執行過雲端備份。');
        setCloudConfirmOpen(false);
        return;
      }
      
      await restoreFromPayload(cloudData);
      showMessage('success', '資料還原成功！系統將在 3 秒後重新載入套用設定。');
      setCloudConfirmOpen(false);
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      console.error("🔥 雲端備份詳細錯誤:", err);
      if (err.message === 'TokenExpired') {
        // 🌟 改為觸發重新登入視窗
        setAuthExpiredOpen(true); 
      } else {
        showMessage('error', '雲端還原失敗，請確認網路連線或檔案完整性。');
      }
      setCloudConfirmOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  // ==========================================
  // 💾 本地備份邏輯
  // ==========================================

  const handleLocalBackup = async () => {
    setIsProcessing(true);
    try {
      await exportSystemData();
      showMessage('success', '本地備份檔案已開始下載！');
    } catch (err) {
      showMessage('error', '產生備份檔案失敗。');
    } finally {
      setIsProcessing(false);
    }
  };

  // 觸發本地還原確認視窗 (將選擇的檔案暫存)
  const handleLocalFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setPendingLocalFile(file);
    setLocalConfirmOpen(true);
    event.target.value = null; // 清空 input，允許重複選擇同一個檔案
  };

  // 實際執行本地還原
  const executeLocalRestore = async () => {
    if (!pendingLocalFile) return;

    setIsProcessing(true);
    setStatusMessage({ type: '', text: '' });
    try {
      await importSystemData(pendingLocalFile);
      showMessage('success', '本地資料還原成功！系統將在 3 秒後重新載入。');
      setLocalConfirmOpen(false);
      setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
      showMessage('error', '檔案格式錯誤或還原失敗。');
      setLocalConfirmOpen(false);
    } finally {
      setIsProcessing(false);
      setPendingLocalFile(null);
    }
  };

  const cancelLocalRestore = () => {
    setLocalConfirmOpen(false);
    setPendingLocalFile(null);
  };
  
  // 執行重置
  const executeReset = async () => {
    setIsProcessing(true);
    try {
      await resetSystem();
      showMessage('success', '系統已重置，即將重新整理頁面...');
      setTimeout(() => window.location.reload(), 1500); // 重整頁面生效
    } catch (err) {
      showMessage('error', '重置失敗，請手動清除瀏覽器快取');
    } finally {
      setIsProcessing(false);
      setIsResetConfirmOpen(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <>
	  {/* 🌟 1. 新增憑證過期對話框 */}
      <DialogModal
        isOpen={authExpiredOpen}
        title="登入安全時效已過"
        message="為保護您的雲端資料安全，Google 登入憑證已過期。請點擊下方按鈕重新登入以繼續操作。"
        type="confirm"
        variant="warning"
        confirmText="重新登入"
        cancelText="取消"
        onConfirm={() => {
          setAuthExpiredOpen(false);
          setTimeout(() => login(), 100); // 喚起登入
        }}
        onCancel={() => setAuthExpiredOpen(false)}
        onClose={() => setAuthExpiredOpen(false)}
      />
	
      {/* 🌟 加入雲端還原的 DialogModal */}
      <DialogModal
        isOpen={cloudConfirmOpen}
        title="雲端還原確認"
        message="確定要從雲端還原嗎？這將會覆蓋您目前電腦上的所有設定與考卷資料！"
        type="confirm"
        variant="warning"
        confirmText={isProcessing ? "還原中..." : "確定還原"}
        cancelText="取消"
        isBusy={isProcessing}
        onConfirm={executeCloudRestore}
        onCancel={() => setCloudConfirmOpen(false)}
        onClose={() => setCloudConfirmOpen(false)}
      />

      {/* 🌟 加入本地還原的 DialogModal */}
      <DialogModal
        isOpen={localConfirmOpen}
        title="本地還原確認"
        message="確定要從此檔案還原嗎？目前的資料將會被覆蓋！"
        type="confirm"
        variant="warning"
        confirmText={isProcessing ? "還原中..." : "確定還原"}
        cancelText="取消"
        isBusy={isProcessing}
        onConfirm={executeLocalRestore}
        onCancel={cancelLocalRestore}
        onClose={cancelLocalRestore}
      />
	  
	  {/* 🌟 新增：重置確認對話框 */}
      <DialogModal
        isOpen={isResetConfirmOpen}
        title="警告：即將清除所有資料"
        message={`您確定要恢復原廠設定嗎？\n\n此操作將會：\n1. 刪除所有本地考卷\n2. 清空儀表板所有設定\n3. 清除抽籤與計時紀錄\n\n⚠️ 此動作無法復原！(雲端備份不會被刪除)`}
        type="confirm"
        variant="danger"
        confirmText={isProcessing ? "清除中..." : "確定清除"}
        cancelText="取消"
        isBusy={isProcessing}
        onConfirm={executeReset}
        onCancel={() => setIsResetConfirmOpen(false)}
        onClose={() => setIsResetConfirmOpen(false)}
      />

      <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 dark:border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
          
          {/* Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Database className="text-emerald-500" size={24} />
              資料中樞 (全域備份與還原)
            </h3>
            <button onClick={onClose} disabled={isProcessing} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 disabled:opacity-50">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 flex flex-col gap-6 relative">
            
            {/* 處理中遮罩 */}
            {isProcessing && (
              <div className="absolute inset-0 z-10 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-b-2xl">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mb-3" />
                <span className="font-bold text-slate-700 dark:text-slate-200">處理中，請稍候...</span>
              </div>
            )}

            {/* 狀態提示列 */}
            {statusMessage.text && (
              <div className={`p-3 rounded-lg flex items-center gap-2 font-bold text-sm ${statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                {statusMessage.text}
              </div>
            )}

            {/* 區塊 1：雲端同步 */}
            <div className="border-2 border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-5">
              <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">☁️ Google 雲端同步 (推薦)</span>
                {/* 🌟 2. 顯示最後備份時間 */}
                {user && (
                  <span className="text-sm font-normal flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-md shadow-sm">
                    <Clock size={14} className="text-blue-500" />
                    {isLoadingTime ? '讀取中...' : (lastBackupTime || '尚無紀錄')}
                  </span>
                )}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 font-medium">
                將所有設定與考卷安全備份至您的 Google 雲端隱私空間。換電腦時只要按一鍵即可無縫接軌。
              </p>
              <div className="flex gap-3">
                <button onClick={handleCloudBackup} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold transition-all shadow-sm active:scale-95">
                  <CloudUpload size={18} />
                  上傳至雲端
                </button>
                {/* 🌟 更改為觸發 Dialog */}
                <button onClick={triggerCloudRestore} className="flex-1 flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border-2 border-blue-200 dark:border-blue-700 hover:border-blue-400 text-blue-700 dark:text-blue-300 py-2.5 rounded-lg font-bold transition-all shadow-sm active:scale-95">
                  <CloudDownload size={18} />
                  從雲端還原
                </button>
              </div>
              {!user && <p className="text-xs text-rose-500 mt-2 font-bold flex justify-center">* 點擊按鈕將會引導您進行 Google 登入</p>}
            </div>

            {/* 區塊 2：實體檔案備份 */}
            <div className="border-2 border-slate-200 dark:border-slate-700 rounded-xl p-5">
              <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-2">
                💾 本地檔案備份
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 font-medium">
                將資料打包成 JSON 檔案下載至您的電腦。適合用於長期封存，或分享設定與考卷給其他老師。
              </p>
              <div className="flex gap-3">
                <button onClick={handleLocalBackup} className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2.5 rounded-lg font-bold transition-all">
                  <HardDriveDownload size={18} />
                  下載 JSON 檔
                </button>
                
                <label className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2.5 rounded-lg font-bold transition-all cursor-pointer">
                  <HardDriveUpload size={18} />
                  匯入 JSON 檔
                  {/* 🌟 更改為觸發檔案選擇與 Dialog */}
                  <input type="file" accept=".json" className="hidden" onChange={handleLocalFileSelect} />
                </label>
              </div>
            </div>

          {/* 🌟 新增：危險區域 */}
                <div className="border-2 border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-900/10 rounded-xl p-5 mt-2">
                  <h4 className="font-bold text-rose-700 dark:text-rose-400 mb-2 flex items-center gap-2">
                    <AlertTriangle size={20} />
                    危險區域
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 font-medium">
                    如果遇到系統異常，或希望在公用電腦上移除您的個人資料，可以執行此操作。
                  </p>
                  <button 
                    onClick={() => setIsResetConfirmOpen(true)}
                    className="w-full flex items-center justify-center gap-2 bg-white dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-900 transition-all py-2.5 rounded-lg font-bold shadow-sm"
                  >
                    <Trash2 size={18} />
                    清除所有本地資料 (恢復原廠設定)
                  </button>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default GlobalBackupModal;