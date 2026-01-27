import React, { useState } from 'react';
import { 
  PanelLeftOpen, Star, Move, FolderOpen, PanelLeft, PanelRight, Eraser, Shuffle, LayoutGrid, 
  AlignVerticalJustifyStart, LayoutDashboard, ArrowLeftRight, Palette, Dices, Timer, Monitor, 
  GraduationCap, Maximize, ChevronUp, ChevronDown, Users, Image as ImageIcon, Volume2, School, 
  BarChart4, ArrowRightCircle, Eye, EyeOff, Moon, Sun, Grid, TrendingUp, Printer, Laptop,
  MoreVertical, XCircle, Box
} from 'lucide-react';

import { useClassroomContext } from '../../../context/ClassroomContext';
import { UI_THEME } from '../../../utils/constants';
import { useThemeContext } from '../../../context/ThemeContext';

const Toolbar = ({
  // UI 狀態控制
  isSidebarOpen, setIsSidebarOpen,
  isToolbarOpen, setIsToolbarOpen,
  appMode, handleSwitchMode,
  // 模態框控制
  setIsTemplateModalOpen, setScoringStudent, setIsLotteryOpen, setIsTimerOpen,
  isTimerOpen, isLotteryOpen,
  // 視圖與功能控制
  showShuffleMenu, setShowShuffleMenu, 
  cycleDisplayMode, getDisplayModeLabel,
  isTeacherView, setIsTeacherView,
  handleExportImage, toggleFullscreen,
  isSoundBoardOpen, setIsSoundBoardOpen,
  isScoreTickerOpen, setIsScoreTickerOpen,
  isFocusMode, setIsFocusMode,
  
  // ★ 新增：接收 Dialog 控制函式
  onShowDialog
}) => {
  const { 
    classes, currentClass, setCurrentClassId,
    updateClass, clearSeats, shuffleSeats,
    seatMode, setSeatMode 
  } = useClassroomContext();

  const { theme, cycleTheme } = useThemeContext();

  const currentLayout = currentClass.layout;

  // --- 內部處理函式 ---
  const handleShuffle = (mode) => {
    shuffleSeats(mode);
    setShowShuffleMenu(false);
  };

  // ★ 修改：清空座位 (Confirm)
  const handleClear = () => {
    onShowDialog({
        type: 'confirm',
        title: '清空座位表',
        message: '確定要清空目前的座位表嗎？\n學生將回到未排區，但分數與分組紀錄會保留。',
        variant: 'danger',
        confirmText: '清空',
        onConfirm: () => clearSeats()
    });
  };

  const handlePrintPDF = () => {
	  // 先將 UI 切換為適合列印的狀態
	  setIsFocusMode(true); 
	  setTimeout(() => {
		window.print();
	  }, 500); // 留時間讓 UI 渲染完成
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
  const btnClass = "px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all select-none hover:bg-slate-100 dark:hover:bg-slate-700/50 active:scale-95"; 
  const separatorClass = "h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1";
  const groupBg = "bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 p-1 rounded-xl flex items-center";

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
                        <Box size={16}/> 工具
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
                        <button 
							onClick={() => setIsLotteryOpen(!isLotteryOpen)} 
							className={`${isLotteryOpen ? 'bg-pink-100 dark:bg-rose-900/30 text-rose-900 dark:text-white' : ''} ${btnClass}`} 
							title="抽籤">
                           <Dices size={18} className={isLotteryOpen ? 'text-pink-600' : 'text-rose-500'}/>
						   <span className="hidden xl:inline">抽籤</span>
                        </button>
                        <button onClick={() => setIsTimerOpen(!isTimerOpen)} 
							className={`${isTimerOpen ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-900 dark:text-white' : ''} ${btnClass}`}
							title="計時">
                           <Timer size={18} className={isTimerOpen ? 'text-emerald-600' : 'text-emerald-500'}/> <span className="hidden xl:inline">計時</span>
                        </button>
                        <button 
                            onClick={() => setIsSoundBoardOpen(!isSoundBoardOpen)} 
                            className={`${isSoundBoardOpen ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600  dark:text-white' : ''} ${btnClass}`} 
                            title="音效板"
                        >
                           <Volume2 size={18} className={isSoundBoardOpen ? 'text-indigo-600' : 'text-blue-500 '}/>
						    <span className="hidden xl:inline">音效</span>
                        </button>
                        <button 
                            onClick={() => setIsScoreTickerOpen(!isScoreTickerOpen)}
                            className={`${isScoreTickerOpen ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700  dark:text-white' : ''} ${btnClass}`}
                            title="顯示評分工具"
                        >
                            <BarChart4 size={18} className={isScoreTickerOpen ? 'text-amber-600' : 'text-amber-400'}/>
							 <span className="hidden xl:inline">加分</span>
                        </button>

                    </div>
                ) : (
                    // --- 編輯模式工具 ---
                    <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-300">
                        {/* 交換/取代切換 */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mr-2">
                             <button onClick={() => setSeatMode('swap')} className={`p-1.5 rounded ${seatMode === 'swap' ? 'bg-white dark:bg-purple-600 shadow text-purple-500 dark:text-white' : 'text-slate-400 hover:text-white'}`} title="交換座位"><ArrowLeftRight size={16}/></button>
                             <button onClick={() => setSeatMode('replace')} className={`p-1.5 rounded ${seatMode === 'replace' ? 'bg-white dark:bg-blue-600 shadow text-blue-500 dark:text-white' : 'text-slate-400 hover:text-white'}`} title="取代座位"><ArrowRightCircle size={16}/></button>
                        </div>

                    <div className={groupBg}>
                        <button onClick={() => updateClass({...currentClass, layout: {...currentClass.layout, doorSide: 'left'}})} className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${currentLayout.doorSide === 'left' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`} title="門在左"><PanelLeft size={16}/></button>
                        <button onClick={() => updateClass({...currentClass, layout: {...currentClass.layout, doorSide: 'right'}})} className={`px-3 py-1.5 rounded-md text-sm font-bold flex items-center gap-2 transition-all ${(!currentLayout.doorSide || currentLayout.doorSide === 'right') ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}title="門在右"><PanelRight size={16}/></button>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white">
                        <input type="number" min="1" max="10" value={currentLayout.rows} onChange={(e) => updateClass({...currentClass, layout: {...currentClass.layout, rows: Number(e.target.value)}})} className={`w-12 text-center p-1 ${UI_THEME.INPUT_BASE} transition-colors`}/>排
                        <span className="text-slate-400">x</span>
                        <input type="number" min="1" max="10" value={currentLayout.cols} onChange={(e) => updateClass({...currentClass, layout: {...currentClass.layout, cols: Number(e.target.value)}})} className={`w-12 text-center p-1 ${UI_THEME.INPUT_BASE} transition-colors`}/>列
                    </div>

                        {/* 洗牌選單 (Dropdown) */}
                        <div className="relative">
                            <button onClick={() => setShowShuffleMenu(!showShuffleMenu)} className={`${btnClass} ${showShuffleMenu ? 'bg-slate-200 dark:bg-slate-700' : ''}`}>
                                <Shuffle size={18} className="text-purple-500"/> <span className="hidden xl:inline">自動</span>
                            </button>
                            {/* 洗牌下拉選單 */}
                            {showShuffleMenu && (
                                <div className={`absolute top-full left-0 mt-2 w-56 ${UI_THEME.SURFACE_CARD} rounded-xl shadow-2xl border ${UI_THEME.BORDER_LIGHT} p-2 flex flex-col gap-1 z-50 animate-in slide-in-from-top-2`}>
                                    <button onClick={() => handleShuffle('random')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><LayoutGrid size={14}/> 完全隨機</button>
                                    <div className={`my-1 border-t ${UI_THEME.BORDER_LIGHT}`}></div>
                                    <button onClick={() => handleShuffle('group_vertical')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><AlignVerticalJustifyStart size={14}/> 依組別：直排</button>
                                    <button onClick={() => handleShuffle('group_cluster')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><LayoutDashboard size={14}/> 依組別：區塊</button>
                                    <div className={`my-1 border-t ${UI_THEME.BORDER_LIGHT}`}></div>
                                    <button onClick={() => handleShuffle('row_gender')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><ArrowLeftRight size={14} className="rotate-90"/> 性別: 前後錯開</button>
                                    <button onClick={() => handleShuffle('checker')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><Grid size={14}/> 性別: 梅花座</button>
									<div className={`my-1 border-t ${UI_THEME.BORDER_LIGHT}`}></div>
									<button onClick={() => handleShuffle('performance_s_shape')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><TrendingUp size={14}/> 成績: S 型排列</button>
									<button onClick={() => handleShuffle('performance_checker')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><Grid size={14}/> 成績: 梅花座</button>
                                </div>
                            )}
                        </div>

                        <button onClick={() => setIsTemplateModalOpen(true)} className={btnClass} title="樣板管理">
                            <FolderOpen size={18} className="text-orange-500"/> <span className="hidden xl:inline">樣板</span>
                        </button>
                        
                        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
                        
                        <button onClick={handleClear} className={`text-red-500 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 ${btnClass}`} title="清空座位">
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
			
                 <button onClick={handlePrintPDF} className="p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-white dark:hover:bg-slate-700 transition-all" title="列印"><Printer size={18}/></button>
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