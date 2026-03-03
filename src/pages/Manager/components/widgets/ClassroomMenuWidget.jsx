import React, { useState, useRef, useEffect } from 'react';
import {
    School, ChevronDown, Monitor, GraduationCap, Palette, UserCheck,
    Sun, Moon, Laptop, Printer, Image as ImageIcon, Maximize
} from 'lucide-react';

import { useClassroomStore } from '../../../../store/useClassroomStore';
import { useModalContext } from '../../../../context/ModalContext';
import { UI_THEME, MODAL_ID } from '../../../../constants';
import { useThemeContext } from '../../../../context/ThemeContext';
import { cn } from '../../../../utils/cn';

const ClassroomMenuWidget = ({
    isTeacherView, setIsTeacherView,
    cycleDisplayMode, getDisplayModeLabel,
    handleExportImage, toggleFullscreen,
    isSidebarOpen, sidebarWidth = 340
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef(null);
    const timerRef = useRef(null);

    const classes = useClassroomStore(state => state.classes);
    const currentClassId = useClassroomStore(state => state.currentClassId);
    const setCurrentClassId = useClassroomStore(state => state.setCurrentClassId);
    const currentClass = classes.find(c => c.id === currentClassId);

    const { openModal } = useModalContext();
    const { theme, cycleTheme } = useThemeContext();

    // 處理點擊外部關閉選單 (因為我們現在用 hover 其實也可以，但考慮到平版操作，加上 click)
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 使用滑鼠移出延遲關閉，體驗會更好
    const handleMouseLeave = () => {
        timerRef.current = setTimeout(() => setIsOpen(false), 500); // 延遲500ms
    };
    const handleMouseEnter = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setIsOpen(true);
    };

    const handlePrintPDF = () => {
        setIsOpen(false);
        setTimeout(() => window.print(), 300);
    };

    const getThemeIcon = () => {
        if (theme === 'system') return <Laptop size={16} />;
        if (theme === 'light') return <Sun size={16} />;
        return <Moon size={16} />;
    };

    const btnBaseClass = "px-3 py-2 rounded-xl text-sm font-bold flex gap-2 items-center justify-center transition-all";

    return (
        <div
            ref={menuRef}
            className="absolute top-4 left-4 z-[70] no-print group select-none transition-transform duration-300 ease-in-out"
            style={{ transform: isSidebarOpen ? `translateX(${sidebarWidth}px)` : 'translateX(0)' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* 觸發區塊 (膠囊按鈕) */}
            <div
                className={cn(
                    "flex items-center gap-2 px-4 py-2 cursor-pointer transition-all duration-300",
                    "bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-lg border border-slate-200 dark:border-slate-700",
                    isOpen ? "rounded-t-2xl rounded-b-sm shadow-xl" : "rounded-2xl hover:bg-white dark:hover:bg-slate-800"
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                <School size={18} className="text-blue-500" />
                <span className="font-bold text-slate-700 dark:text-slate-200">{currentClass?.name || "未選擇班級"}</span>
                <ChevronDown size={14} className={cn("text-slate-400 transition-transform duration-300", isOpen && "rotate-180")} />
            </div>

            {/* 展開面板 */}
            <div
                className={cn(
                    "absolute top-full left-0 mt-2 w-64 origin-top-left transition-all duration-300 ease-out",
                    "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-2xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden",
                    isOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
                )}
            >
                <div className="p-3 flex flex-col gap-3">
                    {/* 1. 班級下拉 (實體 Select 方便操作) */}
                    <div className="bg-slate-100 dark:bg-slate-800/50 rounded-xl px-2 py-1 flex items-center">
                        <select
                            value={currentClassId}
                            onChange={(e) => setCurrentClassId(e.target.value)}
                            className="w-full bg-transparent p-2 text-sm font-bold outline-none cursor-pointer text-slate-700 dark:text-slate-200"
                        >
                            {classes.map(c => <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900">{c.name}</option>)}
                        </select>
                    </div>

                    <div className="h-px bg-slate-200 dark:bg-slate-800 w-full"></div>

                    {/* 2. 視角切換 (老師/學生) */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button onClick={() => setIsTeacherView(true)} className={cn(btnBaseClass, "flex-1 py-1.5", isTeacherView ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
                            <Monitor size={14} /> 老師
                        </button>
                        <button onClick={() => setIsTeacherView(false)} className={cn(btnBaseClass, "flex-1 py-1.5", !isTeacherView ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm' : 'text-slate-400 hover:text-slate-600')}>
                            <GraduationCap size={14} /> 學生
                        </button>
                    </div>

                    {/* 3. 視圖切換 (一般/性別/小組) */}
                    <button onClick={cycleDisplayMode} className={cn(btnBaseClass, "w-full justify-start hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300")}>
                        <Palette size={16} /> <span className="flex-1 text-left">{getDisplayModeLabel()}</span> <span className="text-xs text-slate-400">點擊切換</span>
                    </button>

                    <div className="h-px bg-slate-200 dark:bg-slate-800 w-full"></div>

                    {/* 4. 點名與系統快捷鍵 */}
                    <div className="grid grid-cols-5 gap-1">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsOpen(false); openModal(MODAL_ID.ATTENDANCE); }}
                            className="flex flex-col items-center justify-center p-2 rounded-xl text-slate-500 hover:bg-orange-50 hover:text-orange-500 dark:hover:bg-orange-900/30 transition-all group col-span-2"
                            title="班級點名"
                        >
                            <UserCheck size={20} className="mb-1 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold">點名</span>
                        </button>

                        <div className="col-span-3 grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                            <button onClick={cycleTheme} className="p-2 flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-all" title="切換主題">
                                {getThemeIcon()}
                            </button>
                            <button onClick={handlePrintPDF} className="p-2 flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-all" title="列印">
                                <Printer size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); handleExportImage(); }} className="p-2 flex items-center justify-center rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-all" title="匯出圖片">
                                <ImageIcon size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); toggleFullscreen(); }} className="p-2 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white dark:hover:bg-slate-700 transition-all" title="全螢幕">
                                <Maximize size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClassroomMenuWidget;
