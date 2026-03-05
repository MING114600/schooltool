import React, { useState } from 'react';
import { Calendar, Users, Edit3, Trash2, Lock, ChevronLeft } from 'lucide-react';
import { UI_THEME } from '../../../../constants';
import LogForm from '../../components/LogForm';

const LogDetailPane = ({
    mobileActivePane,
    setMobileActivePane,
    selectedLogId,
    setSelectedLogId,
    isEditingMode,
    setIsEditingMode,
    activeTemplate,
    logs,
    activeStudentId,
    isSyncing,
    saveDraft,
    deleteSingleLog,
    setAlertDialog,
    setPendingAuthRetry,
    user,
    addLogEntry,
    updateLogEntry
}) => {
    // 🌟 1. 設置與 LogForm 相同的文字放大縮小狀態 (加上 localStorage 記憶功能)
    const [zoomLevel, setZoomLevel] = useState(() => {
        const saved = localStorage.getItem('caseLog_zoomLevel');
        return saved ? parseInt(saved, 10) : 0;
    });

    // 每次 zoomLevel 變更時，儲存到 localStorage
    React.useEffect(() => {
        localStorage.setItem('caseLog_zoomLevel', zoomLevel.toString());
    }, [zoomLevel]);
    const getZoomClasses = () => {
        switch (zoomLevel) {
            case 1: return { title: 'text-3xl', date: 'text-3xl', info: 'text-base', label: 'text-base', content: 'text-lg' };
            case 2: return { title: 'text-4xl', date: 'text-4xl', info: 'text-lg', label: 'text-lg', content: 'text-xl' };
            case 3: return { title: 'text-5xl', date: 'text-5xl', info: 'text-xl', label: 'text-xl', content: 'text-2xl' };
            case 4: return { title: 'text-6xl', date: 'text-6xl', info: 'text-2xl', label: 'text-2xl', content: 'text-3xl' };
            default: return { title: 'text-2xl', date: 'text-2xl', info: 'text-sm', label: 'text-sm', content: 'text-base' };
        }
    };
    const uiZoom = getZoomClasses();

    const renderLogDetail = () => {
        const log = logs.find(l => l.id === selectedLogId);
        if (!log) return null;

        const cleanAuthor = log.author.replace(' (已編輯)', '');

        return (
            <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">

                <div className={`p-6 rounded-2xl border ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_MAIN} shadow-sm`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className={`${uiZoom.title} font-bold ${UI_THEME.TEXT_PRIMARY} mb-2 flex items-center gap-2 transition-all`}>
                                    <Calendar className={UI_THEME.TEXT_SECONDARY} />
                                    {log.date}
                                </h2>

                                {/* 🌟 新增：文字放大縮小控制項 */}
                                <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 ml-2 border border-slate-200 dark:border-slate-700 shadow-inner">
                                    <button
                                        type="button"
                                        onClick={() => setZoomLevel(prev => Math.max(0, prev - 1))}
                                        disabled={zoomLevel === 0}
                                        className={`px-2 py-0.5 text-xs font-bold rounded-md transition-colors ${zoomLevel === 0 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm hover:text-indigo-600'}`}
                                        title="縮小文字"
                                    >
                                        Aa-
                                    </button>
                                    <div className="w-px h-3 bg-slate-300 dark:bg-slate-600 mx-0.5"></div>
                                    <button
                                        type="button"
                                        onClick={() => setZoomLevel(prev => Math.min(4, prev + 1))}
                                        disabled={zoomLevel === 4}
                                        className={`px-2 py-0.5 text-xs font-bold rounded-md transition-colors ${zoomLevel === 4 ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed' : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 shadow-sm hover:text-indigo-600'}`}
                                        title="放大文字"
                                    >
                                        Aa+
                                    </button>
                                </div>
                            </div>

                            <div className={`flex items-center gap-3 ${uiZoom.info} ${UI_THEME.TEXT_MUTED} transition-all`}>
                                <span className="flex items-center gap-1">
                                    <Users size={14} /> {cleanAuthor}
                                </span>
                                {log.isEdited && (
                                    <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">
                                        已編輯
                                    </span>
                                )}
                                <span>•</span>
                                <span>
                                    建立於 {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsEditingMode(true)}
                                disabled={isSyncing}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400"
                            >
                                <Edit3 size={16} /> 編輯
                            </button>

                            <button
                                onClick={() => {
                                    setAlertDialog({
                                        isOpen: true,
                                        title: '刪除單篇日誌',
                                        message: `確定要刪除這篇 ${log.date} 的紀錄嗎？\n此動作將無法復原。`,
                                        type: 'confirm',
                                        variant: 'danger',
                                        confirmText: '刪除中...',
                                        isBusy: isSyncing,
                                        onConfirm: async () => {
                                            setAlertDialog(prev => ({ ...prev, isBusy: true }));
                                            await deleteSingleLog(log.id);
                                            setSelectedLogId('new');
                                            setAlertDialog(prev => ({ ...prev, isOpen: false }));
                                        }
                                    });
                                }}
                                disabled={isSyncing}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-400"
                            >
                                <Trash2 size={16} /> 刪除
                            </button>
                        </div>
                    </div>

                    <hr className={`border-t ${UI_THEME.BORDER_DEFAULT} my-4`} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                        {log.template?.map(block => {
                            const val = log.content[block.id];
                            if (val === undefined || val === '') return null;
                            const isFullWidth = block.type === 'text' || block.type === 'image';

                            return (
                                <div key={block.id} className={`flex flex-col gap-1.5 ${isFullWidth ? 'md:col-span-2' : ''}`}>
                                    <span className={`${uiZoom.label} font-bold ${UI_THEME.TEXT_MUTED} transition-all`}>{block.label}</span>
                                    <div className={`${uiZoom.content} font-medium ${UI_THEME.TEXT_PRIMARY} whitespace-pre-wrap transition-all`}>
                                        {Array.isArray(val) ? val.join(', ') : (block.type === 'rating' ? `${val} 星` : val)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 渲染圖片附件 */}
                    {log.attachments && log.attachments.length > 0 && (
                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <span className={`${uiZoom.label} font-bold ${UI_THEME.TEXT_MUTED} mb-3 block transition-all`}>照片紀錄</span>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {log.attachments.map((file, idx) => {

                                    const hasDriveId = Boolean(file.driveId);
                                    const imgSrc = hasDriveId
                                        ? `https://drive.google.com/thumbnail?id=${file.driveId}&sz=w1000`
                                        : (file instanceof File || file instanceof Blob) ? URL.createObjectURL(file) : '';

                                    const linkHref = hasDriveId ? file.url : imgSrc;

                                    return (
                                        <div key={idx} className="relative aspect-square rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800">
                                            <a href={linkHref} target="_blank" rel="noreferrer" title="點擊開啟原圖">
                                                <img
                                                    src={imgSrc}
                                                    alt={file.name || '照片紀錄'}
                                                    className="w-full h-full object-cover transition-transform hover:scale-105"
                                                />
                                            </a>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {log.privateNote && (
                    <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-3 text-amber-700 dark:text-amber-500">
                            <Lock size={18} />
                            <span className="font-bold">內部備註 (家長不可見)</span>
                        </div>
                        <p className="text-amber-900 dark:text-amber-200 whitespace-pre-wrap leading-relaxed">
                            {log.privateNote}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className={`${mobileActivePane === 'list' ? 'hidden md:flex' : 'flex w-full'} flex-1 flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-900/50`}>
            {/* 手機版「返回日誌清單」按鈕 */}
            <div className="md:hidden flex items-center p-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <button
                    onClick={() => setMobileActivePane('list')}
                    className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400"
                >
                    <ChevronLeft size={20} /> 返回日誌清單
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
                {(selectedLogId === 'new' || isEditingMode) ? (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <LogForm
                            key={selectedLogId}
                            logId={selectedLogId}
                            template={activeTemplate}
                            initialData={selectedLogId === 'new' ? null : logs.find(l => l.id === selectedLogId)}
                            onCancel={selectedLogId === 'new' ? null : () => setIsEditingMode(false)}
                            onDeleteDraft={() => {
                                setAlertDialog({
                                    isOpen: true,
                                    title: '捨棄草稿',
                                    message: '確定要捨棄這篇未完成的草稿嗎？\n此動作將無法復原。',
                                    type: 'confirm',
                                    variant: 'danger',
                                    confirmText: '確定捨棄',
                                    onConfirm: async () => {
                                        setAlertDialog(prev => ({ ...prev, isBusy: true }));
                                        await deleteSingleLog(selectedLogId);
                                        setIsEditingMode(false);
                                        setSelectedLogId('new');
                                        setAlertDialog(prev => ({ ...prev, isOpen: false, isBusy: false }));
                                    }
                                });
                            }}
                            onSaveDraft={async (data) => {
                                const draftId = selectedLogId === 'new' ? null : selectedLogId;
                                const newId = await saveDraft(data, draftId);
                                setSelectedLogId(newId || 'new');
                                setIsEditingMode(false);
                            }}
                            onSubmit={async (data) => {
                                let targetDraftId = null;
                                const originalLogId = selectedLogId;
                                const isNewOrDraft = originalLogId === 'new' || logs.find(l => l.id === originalLogId)?.isDraft;

                                try {
                                    // 強制將最新修改存入本地草稿
                                    if (isNewOrDraft) {
                                        targetDraftId = await saveDraft(data, originalLogId === 'new' ? null : originalLogId);
                                        setSelectedLogId(targetDraftId);
                                    }

                                    // 嘗試向雲端發布
                                    if (isNewOrDraft) {
                                        await addLogEntry(data, targetDraftId);
                                    } else {
                                        await updateLogEntry(originalLogId, data);
                                    }

                                    setIsEditingMode(false);
                                    setSelectedLogId('new');

                                } catch (err) {
                                    // 發生斷線或 Token 過期時，登記重試任務
                                    setPendingAuthRetry({
                                        data,
                                        targetDraftId,
                                        isNewOrDraft,
                                        originalLogId,
                                        failedToken: user?.accessToken
                                    });
                                    console.log('雲端發布中斷，已登記自動重試任務並保留本地草稿');
                                }
                            }}
                            isSubmitting={isSyncing}
                            activeStudentId={activeStudentId}
                        />
                    </div>
                ) : (
                    renderLogDetail()
                )}
            </div>
        </div>
    );
};

export default React.memo(LogDetailPane);
