// src/components/common/ExamHistoryModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Cloud, Trash2, QrCode, Loader2, RefreshCw, FileJson, AlertTriangle } from 'lucide-react';
import { listSharedExams, deleteCloudFile } from '../../../services/googleDriveService';
import DialogModal from '../../../components/common/DialogModal';

// 🌟 新增 login 參數
const ExamHistoryModal = ({ isOpen, onClose, token, onReShare, login }) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  // 🌟 新增：控制憑證過期對話框的狀態
  const [authExpiredOpen, setAuthExpiredOpen] = useState(false);

  // 抓取雲端考卷清單
  const fetchExams = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const files = await listSharedExams(token);
      setExams(files);
    } catch (err) {
      console.error("讀取清單失敗", err);
      // 🌟 偵測憑證過期
      if (err.message === 'TokenExpired') {
        setAuthExpiredOpen(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchExams();
  }, [isOpen, token]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteCloudFile(token, deleteTarget.id);
      setExams(prev => prev.filter(e => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      console.error("刪除失敗", err);
      // 🌟 偵測憑證過期
      if (err.message === 'TokenExpired') {
        setAuthExpiredOpen(true);
      } else {
        alert("刪除失敗，請檢查網路連線");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // 執行重新登入
  const handleReLogin = () => {
    setAuthExpiredOpen(false);
    onClose(); // 關閉管理視窗
    setTimeout(() => login(), 100); // 呼叫登入
  };

  if (!isOpen) return null;

  return (
    <>
      {/* 🌟 憑證過期警示框 */}
      <DialogModal
        isOpen={authExpiredOpen}
        title="登入憑證已過期"
        message="您的 Google 登入時效已過，無法讀取或修改雲端檔案。請重新登入以繼續操作。"
        type="confirm"
        variant="warning"
        confirmText="重新登入"
        cancelText="取消"
        onConfirm={handleReLogin}
        onCancel={() => setAuthExpiredOpen(false)}
        onClose={() => setAuthExpiredOpen(false)}
      />

      <div 
        className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-700"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-white">
              <Cloud className="text-emerald-500" size={20} /> 已派送考卷管理
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={fetchExams} 
                disabled={loading}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
                title="重整清單"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
              <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-emerald-500" size={40} />
                <p className="text-slate-400 font-bold">正在讀取雲端資料...</p>
              </div>
            ) : exams.length === 0 ? (
              <div className="py-20 text-center">
                <FileJson size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-400 font-bold text-lg">目前雲端沒有已派送的考卷</p>
                <p className="text-slate-400 text-sm mt-1">您可以點擊「派送」按鈕來分享考卷給學生</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {exams.map(exam => {
                  const displayName = exam.name.replace('[派送考卷]_', '').replace('[派送考卷包]_', '').split('_')[0];
                  const isPackage = exam.name.includes('派送考卷包');
                  
                  return (
                    <div key={exam.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-xl hover:border-emerald-400 dark:hover:border-emerald-500 transition-all group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`p-2.5 rounded-xl ${isPackage ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400'}`}>
                          <FileJson size={22} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="font-bold text-slate-700 dark:text-slate-200 truncate text-base">{displayName}</p>
                          <p className="text-xs text-slate-400 font-medium flex gap-2">
                             <span>{new Date(exam.modifiedTime).toLocaleString('zh-TW')}</span>
                             {isPackage && <span className="text-indigo-500 font-bold">• 考卷包</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onReShare(exam.id, displayName)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-600 text-emerald-600 border border-emerald-100 dark:border-emerald-500 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-500 transition-all shadow-sm font-bold text-sm"
                        >
                          <QrCode size={16} />
                          再次分享
                        </button>
                        <button 
                          onClick={() => setDeleteTarget(exam)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors"
                          title="從雲端刪除"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <DialogModal 
        isOpen={!!deleteTarget}
        title="確定要刪除此雲端考卷？"
        message={`這將會永久移除雲端上的派送檔。學生若掃描舊的 QR Code 將無法讀取內容。\n\n考卷名稱：${deleteTarget?.name.replace('[派送考卷]_', '').replace('[派送考卷包]_', '').split('_')[0]}`}
        type="confirm" 
        variant="danger"
        confirmText="確認刪除"
        isBusy={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
};

export default ExamHistoryModal;