import React, { useState } from 'react';
import { Settings, Save, Library, CheckCircle2, ChevronDown, Plus, Trash2, Edit3, Loader2 } from 'lucide-react';
import { UI_THEME } from '../../../constants';
import DialogModal from '../../../components/common/DialogModal';

export default function TemplateManager({
    globalTemplates,
    getCurrentTemplate,
    onSaveAsGlobal,
    onApplyGlobal,
    onDeleteGlobal,
    isSyncing
}) {
    const [isSelectorOpen, setIsSelectorOpen] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogConfig, setDialogConfig] = useState({});

    // 關閉點擊外部
    const handleBlur = (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsSelectorOpen(false);
        }
    };

    const handleApply = (template) => {
        setDialogConfig({
            type: 'confirm',
            variant: 'warning',
            title: '套用公版模板',
            message: `確定要套用「${template.name}」嗎？\n這將會完全覆寫目前這位學生的客製化日誌版面。`,
            confirmText: '確定覆寫',
            onConfirm: async () => {
                await onApplyGlobal(template.id);
                setIsSelectorOpen(false);
                setIsDialogOpen(false); // 🌟 新增：確定後關閉對話窗
            }
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (e, template) => {
        e.stopPropagation(); // 避免觸發套用
        setDialogConfig({
            type: 'confirm',
            variant: 'danger',
            title: '刪除公版模板',
            message: `確定要刪除「${template.name}」嗎？\n已經套用過此公版的學生資料不會受到影響。`,
            confirmText: '永久刪除',
            onConfirm: async () => {
                await onDeleteGlobal(template.id);
                setIsDialogOpen(false); // 🌟 新增：刪除後也順便確保有關閉 (雖然本來因為重繪可能就沒事)
            }
        });
        setIsDialogOpen(true);
    };

    const handleSaveAsNew = () => {
        const currentTemplate = getCurrentTemplate ? getCurrentTemplate() : [];
        if (!currentTemplate || currentTemplate.length === 0) {
            setDialogConfig({
                type: 'alert',
                variant: 'info',
                title: '無法儲存',
                message: '目前的模板是空的，請先加入一些欄位後再儲存為公版。'
            });
            setIsDialogOpen(true);
            return;
        }

        setDialogConfig({
            type: 'prompt',
            variant: 'info',
            title: '儲存成新公版',
            message: '請為這個新的公版模板命名：',
            placeholder: '例如: 情緒觀察專用版',
            confirmText: '建立公版',
            onConfirm: async (name) => {
                if (!name || name.trim() === '') return false;
                const currentTemplate = getCurrentTemplate ? getCurrentTemplate() : [];
                await onSaveAsGlobal(name.trim(), currentTemplate);
                setIsSelectorOpen(false);
                setIsDialogOpen(false); // 🌟 新增：確定後關閉對話窗
            }
        });
        setIsDialogOpen(true);
    };

    return (
        <div className={`p-4 flex flex-col md:flex-row justify-between items-center gap-4 border-b ${UI_THEME.BORDER_DEFAULT} bg-white dark:bg-slate-900 sticky top-0 z-20`}>
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg">
                    <Settings size={20} />
                </div>
                <div>
                    <h2 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">版面設計器</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">目前為個別學生的客製化版面</p>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {/* 公版切換器 */}
                <div
                    className="relative"
                    onBlur={handleBlur}
                    tabIndex={0}
                >
                    <button
                        onClick={() => setIsSelectorOpen(!isSelectorOpen)}
                        disabled={isSyncing}
                        className={`flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-bold transition-colors ${isSyncing ? 'opacity-50' : ''}`}
                    >
                        <Library size={16} />
                        挑選公版套用
                        <ChevronDown size={14} className={`transition-transform ${isSelectorOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSelectorOpen && (
                        <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                <span className="text-xs font-bold text-slate-500">公版庫 ({globalTemplates.length})</span>
                                <button
                                    onClick={handleSaveAsNew}
                                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center gap-1"
                                >
                                    <Plus size={12} /> 存為新公版
                                </button>
                            </div>

                            <div className="max-h-60 overflow-y-auto p-2">
                                {globalTemplates.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-slate-400">
                                        目前還沒有任何公版
                                    </div>
                                ) : (
                                    globalTemplates.map(tpl => (
                                        <div
                                            key={tpl.id}
                                            onClick={() => handleApply(tpl)}
                                            className="group flex flex-col gap-1 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors"
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-slate-700 dark:text-slate-200">{tpl.name}</span>
                                                {!tpl.isPreset && (
                                                    <button
                                                        onClick={(e) => handleDelete(e, tpl)}
                                                        className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded opacity-0 group-hover:opacity-100 transition-all"
                                                        title="刪除公版"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                            <span className="text-xs text-slate-500">{tpl.blocks.length} 個欄位</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <DialogModal
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                isBusy={isSyncing}
                {...dialogConfig}
            />
        </div>
    );
}
