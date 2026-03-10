import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Loader2, FileText, Settings, Link as LinkIcon, Trash2, UserPlus, RefreshCw, Share2, ChevronDown, ListChecks, Printer } from 'lucide-react';
import { UI_THEME } from '../../../../constants';

const Toolbar = ({
    activeStudent,
    setActiveStudentId,
    isSyncing,
    activeTab,
    setActiveTab,
    handleGenerateShareLink,
    logs,
    selectedLogId,
    selectedLogIds,
    setSelectedLogIds, // 🌟 新增：用於支援「列印全部」功能
    isSelectionMode,
    setIsSelectionMode,
    handleShareCoedit,
    handleRefresh,
    setAlertDialog,
    deleteStudentProfile
}) => {
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef(null);

    // Click outside to close map
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (exportMenuRef.current && !exportMenuRef.current.contains(event.target)) {
                setIsExportMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!activeStudent) return null;

    return (
        <div className={`px-4 md:px-6 py-4 flex flex-wrap items-center justify-between border-b gap-3 md:gap-4 ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_GLASS}`}>
            <div className="flex items-center gap-2 md:gap-4">
                {/* 手機版「返回學生清單」按鈕 */}
                <button
                    onClick={() => setActiveStudentId(null)}
                    className="md:hidden p-1.5 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 className={`text-lg md:text-xl font-bold truncate max-w-[140px] md:max-w-[200px] ${UI_THEME.TEXT_PRIMARY}`}>
                    {activeStudent.name} 的日誌
                </h1>
                {isSyncing && <Loader2 className="animate-spin text-slate-400" size={16} />}
            </div>

            <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'logs' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : UI_THEME.TEXT_SECONDARY
                        }`}
                >
                    <FileText size={16} /> 日誌管理
                </button>
                <button
                    onClick={() => setActiveTab('template')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-bold transition-all ${activeTab === 'template' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : UI_THEME.TEXT_SECONDARY
                        }`}
                >
                    <Settings size={16} /> 模板設定
                </button>
            </div>

            <div className="flex items-center gap-3">
                {/* 🌟 新增：手動重整按鈕 */}
                <button
                    onClick={handleRefresh}
                    disabled={isSyncing}
                    className={`p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title="從雲端取得最新紀錄"
                >
                    <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} />
                </button>

                <button
                    onClick={handleShareCoedit}
                    disabled={isSyncing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shrink-0 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 transition-colors`}
                    title="管理共編教師"
                >
                    <UserPlus size={16} /> 共編管理
                </button>

                <div className="relative" ref={exportMenuRef}>
                    <button
                        onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                        disabled={isSyncing}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shrink-0 ${UI_THEME.BTN_PRIMARY} transition-all`}
                    >
                        <Share2 size={16} /> 匯出與分享 <ChevronDown size={14} className={`transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isExportMenuOpen && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                            {isSelectionMode && selectedLogIds && selectedLogIds.length > 0 ? (
                                <div className="py-1">
                                    <div className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/50 block">批次操作 (已選 {selectedLogIds.length} 篇)</div>
                                    <button
                                        onClick={() => { handleGenerateShareLink(selectedLogIds); setIsExportMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 transition-colors"
                                    >
                                        <Share2 size={16} /> 分享已選項目
                                    </button>
                                    <button
                                        onClick={() => { window.print(); setIsExportMenuOpen(false); }}
                                        className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
                                    >
                                        <Printer size={16} /> 列印已選項目
                                    </button>
                                </div>
                            ) : (
                                <div className="py-1">
                                    <div className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/50 block">單篇操作</div>
                                    <button
                                        onClick={() => { handleGenerateShareLink([selectedLogId]); setIsExportMenuOpen(false); }}
                                        disabled={selectedLogId === 'new'}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 transition-colors ${selectedLogId === 'new' ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'}`}
                                    >
                                        <Share2 size={16} /> 分享此篇紀錄
                                    </button>
                                    <button
                                        onClick={() => { window.print(); setIsExportMenuOpen(false); }}
                                        disabled={selectedLogId === 'new'}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 transition-colors border-b border-slate-100 dark:border-slate-700/50 ${selectedLogId === 'new' ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                                    >
                                        <Printer size={16} /> 列印此篇紀錄
                                    </button>

                                    <div className="px-3 py-2 text-xs font-bold text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/50 block">全域操作</div>
                                    <button
                                        onClick={() => { handleGenerateShareLink(logs ? logs.map(l => l.id) : []); setIsExportMenuOpen(false); }}
                                        disabled={!logs || logs.length === 0}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 transition-colors ${!logs || logs.length === 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                                    >
                                        <LinkIcon size={16} /> 分享全部歷史紀錄
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsSelectionMode(true);
                                            setSelectedLogIds(logs ? logs.map(l => l.id) : []);
                                            setIsExportMenuOpen(false);
                                            setTimeout(() => window.print(), 100);
                                        }}
                                        disabled={!logs || logs.length === 0}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 transition-colors ${!logs || logs.length === 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                                    >
                                        <Printer size={16} /> 列印全部歷史紀錄
                                    </button>
                                    <button
                                        onClick={() => { setIsSelectionMode(true); setIsExportMenuOpen(false); }}
                                        disabled={!logs || logs.length === 0}
                                        className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center gap-2 transition-colors border-t border-slate-100 dark:border-slate-700/50 ${!logs || logs.length === 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/50'}`}
                                    >
                                        <ListChecks size={16} /> 手動勾選特定篇數...
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button
                    onClick={() => {
                        setAlertDialog({
                            isOpen: true,
                            title: '刪除學生檔案',
                            message: `確定要刪除 ${activeStudent.name} 的日誌嗎？\n此動作將清除雲端試算表與系統紀錄。`,
                            type: 'confirm',
                            variant: 'danger',
                            confirmText: '刪除中...',
                            isBusy: isSyncing,
                            onConfirm: async () => {
                                setAlertDialog(prev => ({ ...prev, confirmText: '刪除中...', isBusy: true }));
                                await deleteStudentProfile(activeStudent.id, true);
                                setAlertDialog(prev => ({ ...prev, isOpen: false }));
                            }
                        });
                    }}
                    disabled={isSyncing}
                    className={`p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors`}
                >
                    <Trash2 size={20} />
                </button>
            </div>
        </div>
    );
};

export default React.memo(Toolbar);
