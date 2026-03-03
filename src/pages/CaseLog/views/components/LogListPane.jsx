import React from 'react';
import { Search, X, Plus, CheckSquare, Square, ChevronDown, ChevronRight, Users, Printer } from 'lucide-react';
import { UI_THEME } from '../../../../constants';

const LogListPane = ({
    mobileActivePane,
    setMobileActivePane,
    searchQuery,
    setSearchQuery,
    selectedLogId,
    setSelectedLogId,
    isSelectionMode,
    setIsSelectionMode,
    selectedLogIds,
    setSelectedLogIds,
    logs,
    groupedLogs,
    expandedMonths,
    toggleMonth,
    toggleSelectLog,
    handleSelectAll,
    setIsEditingMode
}) => {
    return (
        <div className={`${mobileActivePane === 'detail' ? 'hidden md:flex' : 'flex w-full'} md:w-80 shrink-0 flex-col border-r ${UI_THEME.BORDER_DEFAULT} bg-slate-50/30 dark:bg-slate-900/30 relative`}>

            {/* 中欄頂部：控制列 */}
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                <div className="relative">
                    <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${UI_THEME.TEXT_MUTED}`} />
                    <input
                        type="text"
                        placeholder="搜尋內容、備註或日期..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full pl-9 pr-8 py-2 text-sm transition-all ${UI_THEME.INPUT_BASE}`}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className={`absolute right-2.5 top-1/2 -translate-y-1/2 hover:text-rose-500 transition-colors ${UI_THEME.TEXT_MUTED}`}
                            title="清除搜尋"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <button
                    onClick={() => {
                        setSelectedLogId('new');
                        setMobileActivePane('detail');
                    }}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all shadow-sm ${selectedLogId === 'new' && !isSelectionMode
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 dark:bg-slate-800 dark:border-blue-900 dark:text-blue-400 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
                        }`}
                >
                    <Plus size={18} /> 撰寫新日誌
                </button>

                {logs && logs.length > 0 && (
                    <div className="flex items-center justify-between px-1">
                        <button
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                if (isSelectionMode) setSelectedLogIds([]);
                            }}
                            className={`text-sm font-bold flex items-center gap-1.5 transition-colors ${isSelectionMode ? 'text-blue-600 dark:text-blue-400' : UI_THEME.TEXT_SECONDARY + ' hover:text-blue-500'
                                }`}
                        >
                            {isSelectionMode ? <CheckSquare size={16} /> : <Square size={16} />}
                            {isSelectionMode ? '取消選取模式' : '批次選取'}
                        </button>

                        {isSelectionMode && (
                            <button
                                onClick={handleSelectAll}
                                className={`text-xs font-bold ${UI_THEME.TEXT_MUTED} hover:text-blue-500 underline`}
                            >
                                {selectedLogIds.length === logs.length ? '取消全選' : '全選'}
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* 中欄內容：摺疊清單 */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                {groupedLogs.length === 0 ? (
                    <div className={`text-sm text-center p-8 ${UI_THEME.TEXT_MUTED} font-bold`}>尚無歷史紀錄</div>
                ) : (
                    groupedLogs.map(group => (
                        <div key={group.month} className="flex flex-col gap-1.5">
                            <button
                                onClick={() => toggleMonth(group.month)}
                                className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-sm font-bold transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/50 ${UI_THEME.TEXT_SECONDARY}`}
                            >
                                <div className="flex items-center gap-1.5">
                                    {expandedMonths[group.month] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    <span>{group.month}</span>
                                </div>
                                <span className="text-xs opacity-60 font-medium bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                                    {group.logs.length} 篇
                                </span>
                            </button>

                            {expandedMonths[group.month] && (
                                <div className="flex flex-col gap-1.5 animate-in slide-in-from-top-2 duration-200 pl-1 border-l-2 border-slate-200/50 dark:border-slate-800/50 ml-2.5">
                                    {group.logs.map(log => {
                                        const isSelected = selectedLogIds.includes(log.id);
                                        return (
                                            <button
                                                key={log.id}
                                                onClick={(e) => {
                                                    if (isSelectionMode) {
                                                        toggleSelectLog(log.id, e);
                                                    } else {
                                                        setSelectedLogId(log.id);
                                                        setMobileActivePane('detail');
                                                        if (log.isDraft) setIsEditingMode(true);
                                                        else setIsEditingMode(false);
                                                    }
                                                }}
                                                className={`relative p-3 rounded-xl text-left border transition-all ml-1.5 ${isSelectionMode && isSelected
                                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/40 shadow-sm'
                                                        : selectedLogId === log.id && !isSelectionMode
                                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                                                            : `border-transparent hover:bg-white dark:hover:bg-slate-800 ${UI_THEME.TEXT_PRIMARY}`
                                                    }`}
                                            >
                                                <div className="flex justify-between items-start mb-1 gap-2">
                                                    <div className="flex items-center gap-2">
                                                        {isSelectionMode && (
                                                            <div className={`shrink-0 ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                                                {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                                            </div>
                                                        )}
                                                        <span className="font-bold text-sm">{log.date}</span>
                                                        {/* 顯示草稿標籤 */}
                                                        {log.isDraft && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 font-bold shrink-0">
                                                                草稿
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`text-xs shrink-0 mt-0.5 ${UI_THEME.TEXT_MUTED}`}>
                                                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className={`text-xs ${UI_THEME.TEXT_SECONDARY} truncate flex items-center gap-1.5 ${isSelectionMode ? 'pl-6' : ''}`}>
                                                    <Users size={12} /> {log.author}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* 底部浮動操作列 */}
            {isSelectionMode && selectedLogIds.length > 0 && (
                <div className="absolute bottom-4 left-4 right-4 animate-in slide-in-from-bottom-4">
                    <div className="bg-slate-800 dark:bg-slate-100 rounded-2xl p-3 shadow-xl flex items-center justify-between">
                        <span className="text-white dark:text-slate-900 text-sm font-bold pl-2">
                            已選 {selectedLogIds.length} 篇
                        </span>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-white px-3 py-1.5 rounded-lg text-sm font-bold transition-colors"
                        >
                            <Printer size={16} /> 列印/匯出
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(LogListPane);
