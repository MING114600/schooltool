import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { UI_THEME } from '../../../constants';

/**
 * StandardAppLayout - ClassroomOS 共用 App 外殼元件
 * 提供標準化的 頂部工具列(Header)、可收合側邊欄(Sidebar) 與主畫面(Main) 排版
 * 
 * @param {React.ReactNode} header - 頂部工具列的內容 (預設帶有毛玻璃風格)
 * @param {React.ReactNode} sidebar - 側邊導覽列的內容
 * @param {React.ReactNode} children - 中央主視圖的內容
 * @param {React.ReactNode} bottomDock - (選用) 底部浮動區或控制列
 * @param {boolean} isSidebarOpen - 側邊欄是否展開 (受控模式)
 * @param {function} onToggleSidebar - 切換側邊欄的 callback
 * @param {boolean} isFocusMode - 專注模式 (啟用時自動隱藏 Sidebar 且 Header 可能消失)
 */
const StandardAppLayout = ({
    header,
    sidebar,
    children,
    bottomDock,
    isSidebarOpen = true,
    onToggleSidebar,
    isFocusMode = false,
    sidebarWidth = 'w-80', // 預設寬度 (Tailwind class)
    sidebarOpenWidth = '20rem', // 側邊欄展開時的實際寬度 (CSS value)
}) => {
    return (
        <div className={`w-full h-full flex flex-col overflow-hidden font-sans ${UI_THEME.BACKGROUND} ${UI_THEME.TEXT_PRIMARY}`}>

            {/* --- 頂部 Header --- */}
            {header && !isFocusMode && (
                <header className={`flex-shrink-0 z-40 relative shadow-sm border-b ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_GLASS} print:hidden`}>
                    {header}
                </header>
            )}

            {/* --- 主要內容區塊 (Sidebar + Main) --- */}
            <div className="flex flex-1 overflow-hidden relative">

                {/* 1. 左側邊欄 (Sidebar) */}
                {sidebar && (
                    <aside
                        className={`
              relative flex flex-col flex-shrink-0 z-30 overflow-hidden
              transition-all duration-500 ease-in-out
              print:hidden
              border-r ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_MAIN}
              ${isFocusMode ? 'w-0 border-r-0' : (isSidebarOpen ? sidebarWidth : 'w-0 border-r-0')}
            `}
                    >
                        {/* 內容容器：避免收合時文字擠壓，強制定寬與隱藏溢出 */}
                        <div
                            className={`overflow-hidden h-full transition-opacity duration-300 ${(!isSidebarOpen || isFocusMode) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                            style={{ minWidth: sidebarOpenWidth }}
                        >
                            {sidebar}
                        </div>
                    </aside>
                )}

                {/* 側邊欄展開/收合控制按鈕 */}
                {sidebar && onToggleSidebar && !isFocusMode && (
                    <button
                        onClick={onToggleSidebar}
                        className={`
              absolute z-50 top-1/2 -translate-y-1/2 p-1.5 
              bg-white dark:bg-slate-800 rounded-r-lg shadow-md print:hidden
              border border-l-0 ${UI_THEME.BORDER_DEFAULT} 
              text-slate-400 hover:text-blue-500 hover:bg-slate-50 dark:hover:bg-slate-700
              transition-all ease-in-out duration-500
            `}
                        style={{
                            left: isSidebarOpen ? sidebarOpenWidth : '0'
                        }}
                        title={isSidebarOpen ? '收起側邊欄' : '展開側邊欄'}
                    >
                        {isSidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                )}

                {/* 2. 中央主畫面 */}
                <main className="flex-1 relative flex flex-col overflow-hidden">
                    {children}

                    {/* 3. 底部 Dock (選用) */}
                    {bottomDock && (
                        <div className="mt-auto flex-shrink-0 z-40 relative">
                            {bottomDock}
                        </div>
                    )}
                </main>
            </div>

        </div>
    );
};

export default StandardAppLayout;
