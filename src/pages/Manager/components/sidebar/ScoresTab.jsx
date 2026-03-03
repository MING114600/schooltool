import React, { memo } from 'react';
import { Trophy, Table, Settings2, User, History, Trash2, Clock } from 'lucide-react';
import { useClassroomStore } from '../../../../store/useClassroomStore';
import { useModalContext } from '../../../../context/ModalContext';
import { UI_THEME, MODAL_ID } from '../../../../constants';
import { cn } from '../../../../utils/cn'; // ★ 引入工具

const ScoresTab = () => {
    const classes = useClassroomStore(state => state.classes);
    const currentClassId = useClassroomStore(state => state.currentClassId);
    const currentClass = classes.find(c => c.id === currentClassId);
    const clearScoreLogs = useClassroomStore(state => state.clearScoreLogs);

    const { openModal, openDialog, closeDialog } = useModalContext();

    const studentRanking = [...(currentClass?.students || [])]
        .filter(s => s.score !== undefined && s.score !== 0)
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 10);

    const logs = currentClass?.scoreLogs ? [...currentClass.scoreLogs].reverse() : [];

    return (
        <div className="flex-1 flex flex-col bg-slate-50/30 dark:bg-slate-900/30 overflow-hidden">
            {/* 頂部功能區 */}
            <div className={cn(
                "p-4 border-b flex flex-col gap-3",
                UI_THEME.SURFACE_MAIN,
                UI_THEME.BORDER_LIGHT
            )}>
                <div className="flex justify-between items-center">
                    <h3 className={cn(
                        "text-sm font-bold flex items-center gap-2",
                        UI_THEME.TEXT_SECONDARY
                    )}>
                        <Trophy size={16} className="text-yellow-500" /> 分數統計
                    </h3>
                    <button
                        onClick={() => openModal(MODAL_ID.EXPORT_STATS)}
                        className={cn("p-1.5 rounded", UI_THEME.BTN_GHOST)}
                        title="匯出成績"
                    >
                        <Table size={16} />
                    </button>
                </div>

                <button
                    onClick={() => openModal(MODAL_ID.BEHAVIOR_SETTINGS)}
                    className={cn(
                        "w-full py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2",
                        UI_THEME.BTN_PRIMARY
                    )}
                >
                    <Settings2 size={14} /> 評分項目設定
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">

                {/* 個人風雲榜 (Top 10) */}
                <div>
                    <h4 className={cn(
                        "text-xs font-bold mb-2 uppercase tracking-wider flex items-center gap-1",
                        UI_THEME.TEXT_MUTED
                    )}>
                        <User size={12} /> 個人風雲榜 (Top 10)
                    </h4>
                    <div className={cn(
                        "rounded-xl border shadow-sm overflow-hidden",
                        UI_THEME.SURFACE_CARD,
                        UI_THEME.BORDER_LIGHT
                    )}>
                        {studentRanking.length > 0 ? (
                            <table className="w-full text-xs">
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                                    {studentRanking.map((s, idx) => (
                                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                            <td className={cn(
                                                "p-2 w-8 text-center font-bold",
                                                UI_THEME.TEXT_MUTED
                                            )}>
                                                {idx < 3 ? <Trophy size={12} className={idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : 'text-amber-600'} /> : idx + 1}
                                            </td>
                                            <td className={cn(
                                                "p-2 font-bold",
                                                UI_THEME.TEXT_PRIMARY
                                            )}>
                                                {s.name}
                                            </td>
                                            <td className="p-2 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                                {s.score}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className={cn("text-center text-xs py-4", UI_THEME.TEXT_MUTED)}>
                                尚無個人分數
                            </div>
                        )}
                    </div>
                </div>

                {/* 近期動態 (Recent Activity) */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h4 className={cn(
                            "text-xs font-bold uppercase tracking-wider flex items-center gap-1",
                            UI_THEME.TEXT_MUTED
                        )}>
                            <History size={12} /> 近期動態 (最新15筆)
                        </h4>
                        {logs.length > 0 && (
                            <button
                                onClick={() => openDialog({
                                    type: 'confirm',
                                    title: '清除紀錄',
                                    message: '確定清除所有近期動態紀錄嗎？分數本身不會受到影響。',
                                    variant: 'warning',
                                    confirmText: '清除',
                                    onConfirm: () => {
                                        clearScoreLogs();
                                        closeDialog();
                                    }
                                })}
                                className="p-1 rounded hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-500 transition-colors"
                                title="清除紀錄"
                            >
                                <Trash2 size={12} />
                            </button>
                        )}
                    </div>
                    <div className="space-y-2">
                        {logs.length > 0 ? logs.slice(0, 15).map((log, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "p-2 rounded-lg border shadow-sm flex items-start gap-2 text-xs",
                                    UI_THEME.SURFACE_CARD,
                                    UI_THEME.BORDER_LIGHT
                                )}
                            >
                                <div className={cn(
                                    "mt-0.5 min-w-[3px] h-3 rounded-full",
                                    log.score > 0 ? "bg-emerald-400" : "bg-rose-400"
                                )}></div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className={cn("font-bold truncate mr-2", UI_THEME.TEXT_PRIMARY)} title={log.targetName}>
                                            {log.targetName || '未知目標'}
                                        </span>
                                        <span className={cn("text-[10px] flex items-center gap-0.5 whitespace-nowrap", UI_THEME.TEXT_MUTED)}>
                                            <Clock size={8} />
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    <div className={cn(
                                        "flex justify-between items-center px-1.5 py-0.5 rounded",
                                        UI_THEME.TEXT_SECONDARY,
                                        "bg-slate-50 dark:bg-slate-700/50"
                                    )}>
                                        <span className="truncate max-w-[100px]" title={log.behaviorLabel}>
                                            {log.behaviorLabel || '評分'}
                                        </span>
                                        <span className={cn(
                                            "font-mono font-bold",
                                            log.score > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                        )}>
                                            {log.score > 0 ? '+' : ''}{log.score}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className={cn(
                                "text-center text-xs py-4 border-2 border-dashed rounded-lg",
                                UI_THEME.TEXT_MUTED,
                                UI_THEME.BORDER_DEFAULT
                            )}>
                                尚無紀錄
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default memo(ScoresTab);