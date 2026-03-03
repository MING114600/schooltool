import React, { useState } from 'react';
import {
    Move, FolderOpen, PanelLeft, PanelRight, Eraser, Shuffle,
    LayoutGrid, AlignVerticalJustifyStart, LayoutDashboard,
    ArrowLeftRight, Grid, TrendingUp, ArrowRightCircle, Check,
    MousePointer2, Columns, Rows
} from 'lucide-react';
import { useClassroomStore } from '../../../../store/useClassroomStore';
import { useModalContext } from '../../../../context/ModalContext';
import { UI_THEME, MODAL_ID } from '../../../../constants';
import { cn } from '../../../../utils/cn';
import DraggableWidget from '../../../../components/common/widgets/DraggableWidget';

const ArrangeToolboxWidget = ({ isVisible, onComplete }) => {
    const classes = useClassroomStore(state => state.classes);
    const currentClassId = useClassroomStore(state => state.currentClassId);
    const updateClass = useClassroomStore(state => state.updateClass);
    const clearSeats = useClassroomStore(state => state.clearSeats);
    const shuffleSeats = useClassroomStore(state => state.shuffleSeats);
    const seatMode = useClassroomStore(state => state.seatMode);
    const setSeatMode = useClassroomStore(state => state.setSeatMode);
    const currentClass = classes.find(c => c.id === currentClassId);
    const currentLayout = currentClass?.layout || {};

    const { openModal, openDialog, closeDialog } = useModalContext();
    const [showShuffleMenu, setShowShuffleMenu] = useState(false);

    if (!currentClass) return null; // DraggableWidget itself handles isVisible through isOpen

    const handleShuffle = (mode) => {
        shuffleSeats(mode);
        setShowShuffleMenu(false);
    };

    const handleClear = () => {
        openDialog({
            type: 'confirm',
            title: '清空座位表',
            message: '確定要清空目前的座位表嗎？\n學生將回到未排區，但分數與分組紀錄會保留。',
            variant: 'danger',
            confirmText: '清空',
            onConfirm: () => {
                clearSeats();
                closeDialog();
            }
        });
    };

    const btnClass = "px-3 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all select-none w-full hover:bg-slate-100 dark:hover:bg-slate-700/50 active:scale-95 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700";

    const defaultPosition = {
        x: typeof window !== 'undefined' ? Math.max(window.innerWidth - 300, 20) : 1000,
        y: 80
    };

    return (
        <DraggableWidget
            title="排座位工具箱"
            icon={LayoutDashboard}
            isOpen={isVisible}
            onClose={onComplete}
            initialPosition={defaultPosition}
            width="w-64"
        >
            <div className="flex flex-col gap-4">
                {/* 1. 排座位模式 */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">排座位模式</span>
                    <div className="grid grid-cols-2 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
                        <button onClick={() => setSeatMode('swap')} className={cn("px-2 py-2 rounded-lg flex flex-col items-center gap-1 text-[11px] font-bold transition-all", seatMode === 'swap' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')} title="兩人互換座位">
                            <ArrowLeftRight size={16} /> 互換
                        </button>
                        <button onClick={() => setSeatMode('replace')} className={cn("px-2 py-2 rounded-lg flex flex-col items-center gap-1 text-[11px] font-bold transition-all", seatMode === 'replace' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')} title="取代並擠出原學生">
                            <Move size={16} /> 取代
                        </button>
                    </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700 w-full" />

                {/* 2. 設定走道模式 */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">設定走道模式</span>
                    <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-inner">
                        <button onClick={() => setSeatMode('toggle_single')} className={cn("px-2 py-2 w-full rounded-lg flex flex-col items-center gap-1 text-[11px] font-bold transition-all", seatMode === 'toggle_single' ? 'bg-white dark:bg-slate-700 shadow text-amber-600 dark:text-amber-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')} title="單點走道">
                            <Eraser size={16} /> 單點
                        </button>
                        <button onClick={() => setSeatMode('toggle_col')} className={cn("px-2 py-2 w-full rounded-lg flex flex-col items-center gap-1 text-[11px] font-bold transition-all", seatMode === 'toggle_col' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')} title="整列變走道 (直)">
                            <Columns size={16} /> 直排
                        </button>
                        <button onClick={() => setSeatMode('toggle_row')} className={cn("px-2 py-2 w-full rounded-lg flex flex-col items-center gap-1 text-[11px] font-bold transition-all", seatMode === 'toggle_row' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400')} title="整排變走道 (橫)">
                            <Rows size={16} /> 橫排
                        </button>
                    </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700 w-full" />

                {/* 2. 教室網格 */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">教室網格 (排 × 列)</span>
                    <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 justify-center">
                        <input type="number" min="1" max="10" value={currentLayout.rows} onChange={(e) => updateClass({ ...currentClass, layout: { ...currentClass.layout, rows: Number(e.target.value) } })} className={cn("w-12 text-center bg-white dark:bg-slate-900 rounded-md outline-none border border-slate-200 dark:border-slate-700")} /> <span className="text-slate-400 font-normal">排</span>
                        <span className="text-slate-300">×</span>
                        <input type="number" min="1" max="10" value={currentLayout.cols} onChange={(e) => updateClass({ ...currentClass, layout: { ...currentClass.layout, cols: Number(e.target.value) } })} className={cn("w-12 text-center bg-white dark:bg-slate-900 rounded-md outline-none border border-slate-200 dark:border-slate-700")} /> <span className="text-slate-400 font-normal">列</span>
                    </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700 w-full" />

                {/* 3. 講台門口位置 */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">門口位置</span>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                        <button onClick={() => updateClass({ ...currentClass, layout: { ...currentClass.layout, doorSide: 'left' } })} className={cn("flex-1 px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all text-slate-500", currentLayout.doorSide === 'left' && 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm')} title="門在左"><PanelLeft size={16} /> 左側</button>
                        <button onClick={() => updateClass({ ...currentClass, layout: { ...currentClass.layout, doorSide: 'right' } })} className={cn("flex-1 px-3 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-1.5 transition-all text-slate-500", (!currentLayout.doorSide || currentLayout.doorSide === 'right') && 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm')} title="門在右"><PanelRight size={16} /> 右側</button>
                    </div>
                </div>

                <div className="h-px bg-slate-200 dark:bg-slate-700 w-full" />

                {/* 4. 進階功能 (樣板, 清空, 自動) */}
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-slate-400 px-1 uppercase tracking-wider">進階功能</span>

                    {/* 自動排列選單 */}
                    <div className="relative">
                        <button onClick={() => setShowShuffleMenu(!showShuffleMenu)} className={cn(btnClass, showShuffleMenu ? 'bg-slate-200 dark:bg-slate-700' : '')}>
                            <Shuffle size={16} className="text-purple-500" /> 自動排列
                        </button>
                        {showShuffleMenu && (
                            <div className={`mt-2 w-full ${UI_THEME.SURFACE_CARD} rounded-xl shadow-inner border ${UI_THEME.BORDER_LIGHT} p-2 flex flex-col gap-1 z-50 animate-in slide-in-from-top-2 overflow-hidden`}>
                                <button onClick={() => handleShuffle('random')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><LayoutGrid size={14} /> 完全隨機</button>
                                <div className={`my-1 border-t ${UI_THEME.BORDER_LIGHT}`}></div>
                                <button onClick={() => handleShuffle('group_vertical')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><AlignVerticalJustifyStart size={14} /> 依組別：直排</button>
                                <button onClick={() => handleShuffle('group_cluster')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><LayoutDashboard size={14} /> 依組別：區塊</button>
                                <div className={`my-1 border-t ${UI_THEME.BORDER_LIGHT}`}></div>
                                <button onClick={() => handleShuffle('row_gender')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><ArrowLeftRight size={14} className="rotate-90" /> 性別：前後錯開</button>
                                <button onClick={() => handleShuffle('checker')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><Grid size={14} /> 性別：梅花座</button>
                                <div className={`my-1 border-t ${UI_THEME.BORDER_LIGHT}`}></div>
                                <button onClick={() => handleShuffle('performance_s_shape')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><TrendingUp size={14} /> 成績：S 型</button>
                                <button onClick={() => handleShuffle('performance_checker')} className={`text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-sm font-bold flex items-center gap-2 ${UI_THEME.TEXT_PRIMARY}`}><Grid size={14} /> 成績：梅花座</button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => openModal(MODAL_ID.LAYOUT_TEMPLATE)} className={btnClass}>
                            <FolderOpen size={16} className="text-orange-500" /> 樣板
                        </button>
                        <button onClick={handleClear} className={cn(btnClass, "hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:border-rose-200 text-rose-600 dark:text-rose-400")}>
                            <Eraser size={16} /> 清空
                        </button>
                    </div>
                </div>

                {/* 5. 結束按鈕 */}
                <button
                    onClick={onComplete}
                    className="mt-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black shadow-lg shadow-blue-500/30 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                    <Check size={20} /> 完成排座位
                </button>
            </div>
        </DraggableWidget>
    );
};

export default ArrangeToolboxWidget;
