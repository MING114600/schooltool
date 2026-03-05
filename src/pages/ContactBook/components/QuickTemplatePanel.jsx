import React, { useState } from 'react';
import { useContactBookStore } from '../../../store/useContactBookStore';
import { Plus, X, Star, GripVertical } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';

const DraggableTemplateItem = ({ tpl, onAdd, onRemove, onToggleVisibility, isCustom }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `template-${tpl.id}`,
        data: {
            type: 'template',
            content: tpl.content,
            isImportant: tpl.isImportant
        }
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 10,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative flex items-center transition-all ${isDragging ? 'pointer-events-none' : ''}`}
        >
            {/* 拖曳手把 */}
            <div
                {...listeners}
                {...attributes}
                className="no-export p-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing"
            >
                <GripVertical size={14} />
            </div>

            <button
                onClick={() => onAdd(tpl.content, tpl.isImportant)}
                className={`flex-1 text-left px-3 py-2 border rounded-xl text-[14px] font-semibold transition-all hover:border-indigo-400 active:scale-95 shadow-sm
                    ${tpl.isImportant
                        ? 'border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-900/40 dark:border-rose-700 dark:text-rose-200'
                        : 'border-slate-200 bg-white text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white'}`}
            >
                <div className="truncate flex items-center gap-2">
                    {tpl.isImportant && <Star size={12} className="fill-rose-500 text-rose-500 flex-shrink-0" />}
                    <span className="truncate">{tpl.content}</span>
                </div>
            </button>
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    if (isCustom) {
                        onRemove(tpl.id);
                    } else {
                        onToggleVisibility(tpl.id);
                    }
                }}
                className={`ml-1 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg`}
                title={isCustom ? "刪除自訂模板" : "隱藏預設模板"}
            >
                <X size={14} />
            </button>
        </div>
    );
};

const QuickTemplatePanel = () => {
    const { getAllTemplates, addCustomTemplate, removeCustomTemplate, toggleTemplateVisibility, addItemToCurrentLog } = useContactBookStore();
    const [isAdding, setIsAdding] = useState(false);
    const [newTemplateContent, setNewTemplateContent] = useState('');
    const [newTemplateImportant, setNewTemplateImportant] = useState(false);

    const templates = getAllTemplates();

    const handleAddCustom = () => {
        if (newTemplateContent.trim()) {
            addCustomTemplate(newTemplateContent.trim(), newTemplateImportant);
            setNewTemplateContent('');
            setNewTemplateImportant(false);
            setIsAdding(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col pointer-events-auto">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="font-bold flex items-center justify-between text-slate-700 dark:text-slate-200">
                    <span>快速插入面板</span>
                    <button
                        onClick={() => setIsAdding(!isAdding)}
                        className="p-1 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-400 transition-colors"
                        title="新增自訂模板"
                    >
                        {isAdding ? <X size={16} /> : <Plus size={16} />}
                    </button>
                </h3>
            </div>

            {isAdding && (
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-indigo-50/50 dark:bg-indigo-900/20 space-y-3">
                    <input
                        type="text"
                        placeholder="新增自訂詞彙..."
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-slate-800 dark:border-slate-700 focus:ring-1 focus:ring-indigo-400 outline-none text-slate-800 dark:text-white shadow-inner"
                        value={newTemplateContent}
                        onChange={(e) => setNewTemplateContent(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCustom()}
                        autoFocus
                    />
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 cursor-pointer hover:text-rose-500 transition-colors">
                            <input
                                type="checkbox"
                                checked={newTemplateImportant}
                                onChange={(e) => setNewTemplateImportant(e.target.checked)}
                                className="rounded text-rose-500 focus:ring-rose-500 border-slate-300 bg-white dark:bg-slate-800"
                            />
                            預設標紅
                        </label>
                        <button
                            onClick={handleAddCustom}
                            className="text-xs px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium shadow-sm active:scale-95 transition-transform"
                        >
                            儲存
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {templates.map(tpl => (
                    <DraggableTemplateItem
                        key={tpl.id}
                        tpl={tpl}
                        isCustom={tpl.id.includes('custom')}
                        onAdd={addItemToCurrentLog}
                        onRemove={removeCustomTemplate}
                        onToggleVisibility={toggleTemplateVisibility}
                    />
                ))}
            </div>
            {!isAdding && (
                <div className="p-3 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
                    點擊或拖曳按鈕快速輸入作業
                </div>
            )}
        </div>
    );
};

export default QuickTemplatePanel;
