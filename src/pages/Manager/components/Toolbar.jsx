import React, { useState } from 'react';
import { 
  PanelLeftOpen, Star, Move, FolderOpen, PanelLeft, PanelRight, Eraser, Shuffle, LayoutGrid, 
  AlignVerticalJustifyStart, LayoutDashboard, ArrowLeftRight, Palette, Dices, Timer, Monitor, 
  GraduationCap, Maximize, ChevronUp, ChevronDown, Users, Image as ImageIcon, Volume2, School, 
  BarChart4, ArrowRightCircle, Eye, EyeOff, Moon, Sun, Grid, TrendingUp, Printer, Laptop,
  MoreVertical, XCircle
} from 'lucide-react';

import { useClassroomContext } from '../../../context/ClassroomContext';
import { UI_THEME } from '../../../utils/constants';

const Toolbar = ({
  // UI 狀態控制
  isSidebarOpen, setIsSidebarOpen,
  isToolbarOpen, setIsToolbarOpen,
  appMode, handleSwitchMode,
  // 模態框控制
  setIsTemplateModalOpen, setScoringStudent, setIsLotteryOpen, setIsTimerOpen,
  // 視圖與功能控制
  showShuffleMenu, setShowShuffleMenu, 
  cycleDisplayMode, getDisplayModeLabel,
  isTeacherView, setIsTeacherView,
  handleExportImage, toggleFullscreen,
  isSoundBoardOpen, setIsSoundBoardOpen,
  isScoreTickerOpen, setIsScoreTickerOpen,
  isFocusMode, setIsFocusMode,
  // 主題
  theme, cycleTheme 
}) => {
  const { 
    classes, currentClass, setCurrentClassId,
    updateClass, clearSeats, shuffleSeats,
    seatMode, setSeatMode 
  } = useClassroomContext();

  const currentLayout = currentClass.layout;

  // --- 內部處理函式 ---
  const handleShuffle = (mode) => {
    shuffleSeats(mode);
    setShowShuffleMenu(false);
  };

  const handleClear = () => {
    if(window.confirm('確定要清空目前的座位表嗎？\n學生將回到未排區，此動作無法復原。')) {
        clearSeats();
    }
  };

  const getThemeIcon = () => {
    if (theme === 'system') return <Laptop size={18} />;
    if (theme === 'light') return <Sun size={18} />;
    return <Moon size={18} />;
  };

  // --- 渲染：收合狀態 (只顯示一個小藥丸按鈕) ---
  if (!isToolbarOpen) {
    // 在專注模式下，如果您希望連這個展開按鈕都隱藏，可以加 isFocusMode 的判斷
    if (isFocusMode) return null;
	return (
      <div className="absolute top-0 left-0 right-0 flex justify-center z-[60] no-print pointer-events-none">
        <button 
          onClick={() => setIsToolbarOpen(true)} 
          className="mt-2 pointer-events-auto px-4 py-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur text-slate-600 dark:text-slate-300 rounded-full shadow-lg font-bold text-xs flex items-center gap-2 hover:scale-105 transition-all border border-slate-200 dark:border-slate-700"
        >
          <ChevronDown size={14}/> 工具列
        </button>
      </div>
    );
  }

  // --- 樣式變數 ---
  const btnClass = "px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 active:scale-95 text-slate-600 dark:text-slate-300";
  const activeBtnClass = "px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all select-none shadow-sm active:scale-95";
  const separatorClass = "h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1";

  return (
    <div className={`
        absolute top-0 left-0 right-0 z-[60] no-print
        p-3 flex flex-wrap items-center justify-between gap-3
        transition-all duration-300 ease-in-out
        ${UI_THEME.SURFACE_GLASS} border-b ${UI_THEME.BORDER_LIGHT} shadow-sm
    `}>
        
        {/* ================= 左側區塊：全域導覽 ================= */}
        <div className="flex items-center gap-2">
            {/* 側邊欄開關 */}
            {!isSidebarOpen && !isFocusMode && (
              <button onClick={() => setIsSidebarOpen(true)} className={`${btnClass} px-2`} title="開啟側邊欄">
                <PanelLeftOpen size={20}/>
              </button>
            )}

            {/* 班級選擇 */}
            <div className={`flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all`}>
                 <School size={16} className="text-slate-400 dark:text-slate-500"/>
                 <select 
                    value={currentClass.id} 
                    onChange={(e) => setCurrentClassId(e.target.value)}
                    className="text-sm font-bold bg-transparent outline-none cursor-pointer min-w-[100px] text-slate-700 dark:text-slate-200"
                 >
                     {classes.map(c => <option key={c.id} value={c.id} className="bg-white dark:bg-slate-900">{c.name}</option>)}
                 </select>
            </div>
            
            <div className={separatorClass}></div>

            {/* 視角切換 (老師/學生) */}
            <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                <button onClick={() => setIsTeacherView(true)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${isTeacherView ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Monitor size={14}/> 老師
                </button>
                <button onClick={() => setIsTeacherView(false)} className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${!isTeacherView ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                    <GraduationCap size={14}/> 學生
                </button>
            </div>
        </div>

        {/* ================= 中央區塊：核心功能 (情境感知) ================= */}
        <div className="flex items-center justify-center flex-1 min-w-[300px]">
            <div className="flex items-center gap-3 p-1.5 bg-white/50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-sm shadow-sm">
                
                {/* 1. 模式切換 Pill */}
                <div className="flex bg-slate-800 dark:bg-slate-950 rounded-xl p-1 shadow-inner">
                    <button onClick={() => handleSwitchMode('score')} className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${appMode === 'score' ? 'bg-amber-400 text-amber-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                        <Star size={16}/> 評分
                    </button>
                    <button onClick={() => handleSwitchMode('arrange')} className={`px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${appMode === 'arrange' ? 'bg-white text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
                        <Move size={16}/> 編輯
                    </button>
                </div>

                <div className="w-px h-6 bg-slate-300 dark:bg-slate-600"></div>

                {/* 2. 動態工具列：根據模式顯示不同按鈕 */}
                {appMode === 'score' ? (
                    // --- 評分模式工具 ---
                    <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-300">
                        <button onClick={() => setIsLotteryOpen(true)} className={btnClass} title="抽籤">
                           <Dices size={18} className="text-pink-500"/> <span className="hidden xl:inline">抽籤</span>
                        </button>
                        <button onClick={() => setIsTimerOpen(true)} className={btnClass} title="計時">
                           <Timer size={18} className="text-emerald-500"/> <span className="hidden xl:inline">計時</span>
                        </button>
                        <button 
                            onClick={() => setIsSoundBoardOpen(!isSoundBoardOpen)} 
                            className={`${isSoundBoardOpen ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600' : ''} ${btnClass}`} 
                            title="音效板"
                        >
                           <Volume2 size={18} className={isSoundBoardOpen ? 'text-indigo-600' : 'text-blue-500'}/>
                        </button>
                        <button 
                            onClick={() => setIsScoreTickerOpen(!isScoreTickerOpen)}
                            className={`${isScoreTickerOpen ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700' : ''} ${btnClass}`}
                            title="顯示評分工具"
                        >
                            <BarChart4 size={18} className={isScoreTickerOpen ? 'text-amber-600' : 'text-slate-400'}/>
                        </button>
                        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                        <button onClick={() => setScoringStudent({ isClassEntity: true, name: '全班同學' })} className={`${activeBtnClass} bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200`}>
                            <Users size={16}/> 全班
                        </button>
                    </div>
                ) : (
                    // --- 編輯模式工具 ---
                    <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-300">
                        {/* 交換/取代切換 */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mr-2">
                             <button onClick={() => setSeatMode('swap')} className={`p-1.5 rounded ${seatMode === 'swap' ? 'bg-white dark:bg-slate-600 shadow text-purple-600' : 'text-slate-400'}`} title="交換座位"><ArrowLeftRight size={16}/></button>
                             <button onClick={() => setSeatMode('replace')} className={`p-1.5 rounded ${seatMode === 'replace' ? 'bg-white dark:bg-slate-600 shadow text-blue-600' : 'text-slate-400'}`} title="取代座位"><ArrowRightCircle size={16}/></button>
                        </div>

                        {/* 洗牌選單 (Dropdown) */}
                        <div className="relative">
                            <button onClick={() => setShowShuffleMenu(!showShuffleMenu)} className={`${btnClass} ${showShuffleMenu ? 'bg-slate-200 dark:bg-slate-700' : ''}`}>
                                <Shuffle size={18} className="text-purple-500"/> <span className="hidden xl:inline">洗牌</span>
                            </button>
                            {/* 洗牌下拉選單 */}
                            {showShuffleMenu && (
                                <div className={`absolute top-full left-0 mt-2 w-56 ${UI_THEME.SURFACE_CARD} rounded-xl shadow-2xl border ${UI_THEME.BORDER_LIGHT} p-2 flex flex-col gap-1 z-50 animate-in slide-in-from-top-2`}>
                                    <button onClick={() => handleShuffle('random')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><LayoutGrid size={14}/> 完全隨機</button>
                                    <div className={`my-1 border-t ${UI_THEME.BORDER_LIGHT}`}></div>
                                    <button onClick={() => handleShuffle('group_vertical')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><AlignVerticalJustifyStart size={14}/> 依組別：直排</button>
                                    <button onClick={() => handleShuffle('group_cluster')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><LayoutDashboard size={14}/> 依組別：區塊</button>
                                    <div className={`my-1 border-t ${UI_THEME.BORDER_LIGHT}`}></div>
                                    <button onClick={() => handleShuffle('row_gender')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><ArrowLeftRight size={14} className="rotate-90"/> 性別: 前後錯開</button>
                                    <button onClick={() => handleShuffle('checker')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><Grid size={14}/> 性別: 梅花座</button>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setIsTemplateModalOpen(true)} className={btnClass} title="樣板管理">
                            <FolderOpen size={18} className="text-orange-500"/> <span className="hidden xl:inline">樣板</span>
                        </button>
                        
                        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                        
                        <button onClick={handleClear} className={`${btnClass} text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20`} title="清空座位">
                            <Eraser size={18}/>
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* ================= 右側區塊：系統設定 ================= */}
        <div className="flex items-center gap-2">
            
            {/* 顯示模式 (性別/小組/一般) */}
            <button onClick={cycleDisplayMode} className={`${btnClass} min-w-[100px] justify-center hidden md:flex`} title="切換顯示模式">
                <Palette size={16}/> {getDisplayModeLabel()}
            </button>

            <div className={separatorClass}></div>

            {/* 主題切換 */}
            <button onClick={cycleTheme} className={btnClass} title="切換主題">
                {getThemeIcon()}
            </button>

            {/* 專注模式 */}
            <button 
                onClick={() => setIsFocusMode(!isFocusMode)} 
                className={`${isFocusMode ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' : btnClass}`} 
                title={isFocusMode ? "退出專注模式" : "進入專注模式"}
            >
                {isFocusMode ? <EyeOff size={18}/> : <Eye size={18}/>}
            </button>

            {/* 更多功能 (截圖/全螢幕/收合) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
                 <button onClick={handleExportImage} className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-all" title="匯出圖片"><ImageIcon size={18}/></button>
                 <button onClick={toggleFullscreen} className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-white dark:hover:bg-slate-700 transition-all" title="全螢幕"><Maximize size={18}/></button>
                 <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                 <button onClick={() => setIsToolbarOpen(false)} className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 transition-all" title="收起工具列"><ChevronUp size={18}/></button>
            </div>
        </div>
    </div>
  );
};

export default Toolbar;