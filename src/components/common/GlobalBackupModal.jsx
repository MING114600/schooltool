import React, { useRef, useState } from 'react';
import { Database, Download, Upload, X, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { exportSystemData, importSystemData } from '../../utils/backupService'; // 引入剛剛寫好的服務
import { UI_THEME } from '../../utils/constants'; // 假設這是您的共用樣式常數

const GlobalBackupModal = ({ isOpen, onClose }) => {
  const fileInputRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle, processing, success, error

  if (!isOpen) return null;

  const handleDownload = () => {
    exportSystemData();
    // 簡單的視覺回饋
    setStatus('processing');
    setTimeout(() => setStatus('idle'), 1000);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!confirm('⚠️ 高風險操作\n\n您即將還原「整個系統」的資料。\n目前的課表、學生名單、成績紀錄將被完全覆蓋。\n\n確定要繼續嗎？')) {
        e.target.value = '';
        return;
    }

    try {
        setStatus('processing');
        await importSystemData(file);
        setStatus('success');
        
        // 成功後延遲一下，讓使用者看到成功畫面，然後重整頁面
        setTimeout(() => {
            alert('✅ 系統還原成功！網頁將重新整理以讀取新資料。');
            window.location.reload();
        }, 500);
        
    } catch (error) {
        console.error(error);
        alert('還原失敗：' + error.message);
        setStatus('error');
    }
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
           <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-white">
             <div className="p-2 bg-blue-500 text-white rounded-lg shadow-blue-500/30">
                <Database size={20}/>
             </div>
             系統資料中樞
           </h3>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-full transition-colors">
             <X size={20}/>
           </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
            
            {/* 提示區塊 */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                此工具可對<b>所有應用程式</b>（時鐘、班級管理、工具箱）進行完整的資料備份與還原。適合在更換電腦或定期存檔時使用。
            </div>

            <div className="grid gap-4">
                {/* 匯出按鈕 */}
                <button 
                    onClick={handleDownload}
                    className="group relative w-full p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 bg-white dark:bg-slate-800 flex items-center gap-4 transition-all active:scale-95"
                >
                    <div className="p-3 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                        <Download size={24} />
                    </div>
                    <div className="text-left">
                        <div className="font-bold text-slate-800 dark:text-white">備份系統設定 (匯出)</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">下載 .json 檔案到電腦</div>
                    </div>
                </button>

                {/* 匯入按鈕 */}
                <div className="relative">
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="group w-full p-4 rounded-xl border-2 border-slate-100 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-800 flex items-center gap-4 transition-all active:scale-95"
                    >
                        <div className="p-3 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                            <Upload size={24} />
                        </div>
                        <div className="text-left">
                            <div className="font-bold text-slate-800 dark:text-white">還原系統設定 (匯入)</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">讀取 .json 並覆蓋目前資料</div>
                        </div>
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".json"/>
                </div>
            </div>

            {/* 重置按鈕 (選用) */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                <button 
                    onClick={() => {
                        if(confirm('⚠️ 危險操作：這將清除瀏覽器內「所有」本系統的資料並回到初始狀態。確定嗎？')) {
                            localStorage.clear();
                            window.location.reload();
                        }
                    }}
                    className="text-xs font-bold text-slate-400 hover:text-red-500 flex items-center gap-1 transition-colors"
                >
                    <RefreshCw size={12}/> 清除所有資料並重置
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default GlobalBackupModal;