// src/components/common/PatchNotesModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Sparkles, Rocket, Bug, Calendar, History, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { APP_VERSION, PATCH_NOTES } from '../../data/patchNotesData';

const PatchNotesModal = ({ isOpen, onClose, mode = 'latest' }) => {
  // mode: 'latest' (只顯示最新) | 'history' (顯示全部)

  // 🌟 新增：控制展開的狀態 (預設展開最新的一個)
  const [expandedVersion, setExpandedVersion] = useState(null);
  const [archiveNotes, setArchiveNotes] = useState([]);
  const [isLoadingArchive, setIsLoadingArchive] = useState(false);
  const [archiveLoaded, setArchiveLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // 開啟時，預設展開列表中的第一個 (也就是最新的那個)
      setExpandedVersion(PATCH_NOTES[0]?.version);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'new': return <Sparkles size={16} className="text-amber-500 mt-1 shrink-0" />;
      case 'improve': return <Rocket size={16} className="text-emerald-500 mt-1 shrink-0" />;
      case 'fix': return <Bug size={16} className="text-rose-500 mt-1 shrink-0" />;
      default: return <Sparkles size={16} className="shrink-0" />;
    }
  };

  // 決定要顯示的資料 (在此合併 archiveNotes)
  const displayNotes = mode === 'history' ? [...PATCH_NOTES, ...archiveNotes] : [PATCH_NOTES[0]];

  // 切換展開/收合
  const toggleExpand = (version) => {
    // 如果點擊的是已經展開的，就收起來(設為null)；否則展開該版本
    setExpandedVersion(prev => prev === version ? null : version);
  };

  // 動態載入歷史存檔
  const loadArchiveNotes = async () => {
    if (archiveLoaded) return;
    setIsLoadingArchive(true);
    try {
      // 動態 import 會讓 Webpack/Vite 把這個檔案分拆打包 (Code Splitting)
      const { PATCH_NOTES_ARCHIVE } = await import('../../data/patchNotesArchiveData');
      setArchiveNotes(PATCH_NOTES_ARCHIVE);
      setArchiveLoaded(true);
    } catch (error) {
      console.error("無法載入歷史紀錄檔案:", error);
    } finally {
      setIsLoadingArchive(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border border-slate-200 dark:border-slate-700"
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 border-b dark:border-slate-700 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              {mode === 'history' ? <History className="text-indigo-500" /> : <Sparkles className="text-amber-500" />}
              {mode === 'history' ? '系統更新歷史' : `發現新版本 v${APP_VERSION}`}
            </h2>
            {mode === 'latest' && <p className="text-sm text-slate-500 mt-1">看看我們為您準備了哪些新功能！</p>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/30 dark:bg-slate-900/10">
          <div className="space-y-3">
            {displayNotes.map((note, index) => {
              const isExpanded = expandedVersion === note.version;

              return (
                <div
                  key={note.version}
                  className={`bg-white dark:bg-slate-800 border transition-all rounded-xl overflow-hidden ${isExpanded
                      ? 'border-indigo-200 dark:border-indigo-900 shadow-md ring-1 ring-indigo-50 dark:ring-indigo-900/50'
                      : 'border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-slate-600'
                    }`}
                >
                  {/* 🌟 可點擊的標題列 (Accordion Header) */}
                  <div
                    onClick={() => toggleExpand(note.version)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {/* 版本號 Badge */}
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${index === 0 && mode === 'history' // 最新版給予特殊色
                          ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}>
                        v{note.version}
                      </span>

                      {/* 日期與標題 */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 truncate">
                        <span className="text-xs text-slate-400 font-mono flex items-center gap-1 min-w-fit">
                          <Calendar size={12} /> {note.date}
                        </span>
                        <h3 className={`font-bold truncate transition-colors ${isExpanded ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200 group-hover:text-indigo-500'}`}>
                          {note.title}
                        </h3>
                      </div>
                    </div>

                    {/* 箭頭 Icon */}
                    <div className={`p-1 rounded-full text-slate-400 transition-all ${isExpanded ? 'bg-indigo-50 text-indigo-500 rotate-180' : 'group-hover:bg-slate-100 dark:group-hover:bg-slate-700'}`}>
                      <ChevronDown size={20} />
                    </div>
                  </div>

                  {/* 🌟 展開的詳細內容 (Accordion Body) */}
                  {/* 使用隱藏/顯示的方式，或者條件渲染。這裡用條件渲染比較簡單 */}
                  {isExpanded && (
                    <div className="px-4 pb-5 pt-0 animate-in slide-in-from-top-2 duration-200">
                      <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                        <ul className="space-y-3 pl-1">
                          {note.changes.map((change, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed group/item">
                              <div className="mt-0.5 p-1 bg-slate-50 dark:bg-slate-800 rounded-md group-hover/item:scale-110 transition-transform">
                                {getIcon(change.type)}
                              </div>
                              <span className="pt-0.5">{change.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 🌟 載入歷史紀錄按鈕 */}
            {mode === 'history' && !archiveLoaded && (
              <div className="pt-4 pb-2 flex justify-center">
                <button
                  onClick={loadArchiveNotes}
                  disabled={isLoadingArchive}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoadingArchive ? (
                    <>
                      <Loader2 size={16} className="animate-spin text-indigo-500" />
                      <span>正在從封存庫載入資料...</span>
                    </>
                  ) : (
                    <>
                      <History size={16} className="text-slate-400" />
                      <span>載入更早的歷史紀錄 (v8.0 以前)</span>
                    </>
                  )}
                </button>
              </div>
            )}
            {mode === 'history' && archiveLoaded && (
              <div className="pt-6 pb-2 text-center text-xs text-slate-400 dark:text-slate-500 flex flex-col items-center gap-1">
                <Sparkles size={14} className="opacity-50" />
                <span>您已到達時光機的盡頭，感謝您見證 ClassroomOS 的成長！</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t dark:border-slate-700 text-right">
          <button onClick={onClose} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all active:scale-95">
            {mode === 'latest' ? '開始體驗' : '關閉'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatchNotesModal;