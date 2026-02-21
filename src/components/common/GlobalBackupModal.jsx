// src/components/common/GlobalBackupModal.jsx
import React, { useState } from 'react';
import { 
  X, Database, CloudUpload, CloudDownload, 
  HardDriveDownload, HardDriveUpload, Loader2, AlertCircle, CheckCircle2 
} from 'lucide-react';

// 引入全域共用的對話框模組
import DialogModal from './DialogModal';

// 引入我們寫好的兩支核心工具
import { exportSystemData, importSystemData, generateSystemPayload, restoreFromPayload } from '../../utils/backupService';
import { syncToCloud, fetchFromCloud } from '../../utils/googleDriveService';

const CLOUD_FILE_NAME = 'ClassroomOS_CloudSync.json';

const GlobalBackupModal = ({ isOpen, onClose, user, login }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' }); // type: 'success' | 'error' | ''

  // 🌟 新增：控制 DialogModal 的狀態
  const [cloudConfirmOpen, setCloudConfirmOpen] = useState(false);
  const [localConfirmOpen, setLocalConfirmOpen] = useState(false);
  const [pendingLocalFile, setPendingLocalFile] = useState(null); // 暫存老師選擇的實體檔案

  if (!isOpen) return null;

  // 輔助函式：顯示狀態訊息
  const showMessage = (type, text) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage({ type: '', text: '' }), 5000);
  };

  // ==========================================
  // ☁️ 雲端同步邏輯
  // ==========================================
  
  const handleCloudBackup = async () => {
    if (!user) {
      login();
      return;
    }
    
    setIsProcessing(true);
    setStatusMessage({ type: '', text: '' });
    try {
      const payload = await generateSystemPayload();
      await syncToCloud(user.accessToken, CLOUD_FILE_NAME, payload);
      showMessage('success', '雲端備份成功！資料已安全同步至 Google Drive。');
    } catch (err) {
		console.error("🔥 雲端備份詳細錯誤:", err);
      if (err.message === 'TokenExpired') {
        showMessage('error', '登入憑證已過期，請關閉視窗並重新點擊「老師登入」。');
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
        showMessage('error', '登入憑證已過期，請關閉視窗並重新點擊「老師登入」。');
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

  return (
    <>
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
              <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                ☁️ Google 雲端同步 (推薦)
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

          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalBackupModal;