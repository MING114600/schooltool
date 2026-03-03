import React from 'react';
import { Gift, MousePointerClick, Plus, Minus, Trophy, Dices, Timer, Volume2 } from 'lucide-react';
import { cn } from '../../../utils/cn';

const QuickScoreBar = ({
    onClassScore,
    batchScoreMode,
    onToggleBatchMode,
    isVisible,
    isScoreTickerOpen,
    onToggleScoreTicker,
    isLotteryOpen, setIsLotteryOpen,
    isTimerOpen, setIsTimerOpen,
    isSoundBoardOpen, setIsSoundBoardOpen
}) => {
    if (!isVisible) return null;

    const toolBtnClass = "w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm border";

    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-8 fade-in duration-300 pointer-events-none no-print print:hidden">
            <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-full shadow-xl border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-3 pointer-events-auto">

                {/* 全班加分 */}
                <button
                    onClick={onClassScore}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900/50 transition-all shadow-sm"
                    title="全班加分"
                >
                    <Gift size={16} /> 全班加分
                </button>

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>

                {/* 批次模式說明 */}
                <div className="flex items-center gap-1.5 pr-2">
                    <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <MousePointerClick size={14} /> 快速評分
                    </span>
                </div>

                {/* 批次加減分開關 */}
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-inner">
                    <button
                        onClick={() => onToggleBatchMode && onToggleBatchMode('add')}
                        className={cn(
                            "px-4 py-1.5 rounded-full flex items-center justify-center gap-1 text-sm font-black transition-all",
                            batchScoreMode === 'add'
                                ? "bg-emerald-500 text-white shadow-md scale-105"
                                : "text-emerald-600 dark:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                        )}
                        title="點擊學生即 +1 分"
                    >
                        <Plus size={16} strokeWidth={3} />
                    </button>

                    <button
                        onClick={() => onToggleBatchMode && onToggleBatchMode('deduct')}
                        className={cn(
                            "px-4 py-1.5 rounded-full flex items-center justify-center gap-1 text-sm font-black transition-all",
                            batchScoreMode === 'deduct'
                                ? "bg-rose-500 text-white shadow-md scale-105"
                                : "text-rose-500 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30"
                        )}
                        title="點擊學生即 -1 分"
                    >
                        <Minus size={16} strokeWidth={3} />
                    </button>
                </div>

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                {/* 小組記分板開關 */}
                <button
                    onClick={onToggleScoreTicker}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full font-bold text-sm transition-all shadow-sm border",
                        isScoreTickerOpen
                            ? "bg-amber-500 text-white border-amber-600 shadow-inner"
                            : "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                    )}
                    title="小組記分板"
                >
                    <Trophy size={16} /> 小組
                </button>

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>

                {/* 上課小工具群 */}
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-inner">
                    <button
                        onClick={() => setIsLotteryOpen(!isLotteryOpen)}
                        className={cn(toolBtnClass, isLotteryOpen ? "bg-pink-500 text-white border-pink-600 shadow-md scale-105" : "bg-white dark:bg-slate-700 text-pink-500 hover:bg-pink-50 dark:hover:bg-slate-600 border-slate-200 dark:border-slate-600")}
                        title="抽籤"
                    >
                        <Dices size={16} />
                    </button>
                    <button
                        onClick={() => setIsTimerOpen(!isTimerOpen)}
                        className={cn(toolBtnClass, isTimerOpen ? "bg-emerald-500 text-white border-emerald-600 shadow-md scale-105" : "bg-white dark:bg-slate-700 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-600 border-slate-200 dark:border-slate-600")}
                        title="計時"
                    >
                        <Timer size={16} />
                    </button>
                    <button
                        onClick={() => setIsSoundBoardOpen(!isSoundBoardOpen)}
                        className={cn(toolBtnClass, isSoundBoardOpen ? "bg-indigo-500 text-white border-indigo-600 shadow-md scale-105" : "bg-white dark:bg-slate-700 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-600 border-slate-200 dark:border-slate-600")}
                        title="音效板"
                    >
                        <Volume2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuickScoreBar;
