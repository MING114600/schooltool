import React, { useState } from 'react';
import { useContactBookStore } from '../../../store/useContactBookStore';
import { Plus, X, Star, GripVertical, Settings, Eye, EyeOff, Trash2 } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TemplateItem = ({ tpl, onAdd, onRemove, onToggleVisibility, isCustom, isEditing, isHidden }) => {
    // 依據是否為編輯模式，決定使用 useSortable 還是 useDraggable
    const dragData = isEditing ? {
        id: `tpl-sort-${tpl.id}`,
        hook: useSortable({
            id: `tpl-sort-${tpl.id}`,
            data: { type: 'template-sort', template: tpl }
        })
    } : {
        id: `template-insert-${tpl.id}`,
        hook: useDraggable({
            id: `template-insert-${tpl.id}`,
            data: { type: 'template-insert', content: tpl.content, isImportant: tpl.isImportant }
        })
    };

    const { attributes, listeners, setNodeRef, transform, isDragging, transition } = dragData.hook;

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
        transition: isEditing ? transition : undefined,
        opacity: isDragging ? 0.5 : (isHidden ? 0.6 : 1),
        zIndex: isDragging ? 50 : 10,
    } : {
        opacity: isHidden ? 0.6 : 1,
        transition: isEditing ? transition : undefined,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative flex items-center transition-all ${isDragging ? 'pointer-events-none' : ''}`}
        >
            {/* 拖曳手把 (一般模式下拖曳插入，編輯模式下排序) */}
            <div
                {...listeners}
                {...attributes}
                className={`no-export p-1 cursor-grab active:cursor-grabbing 
                    ${isEditing ? 'text-slate-400 hover:text-slate-600' : 'text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity'}`}
            >
                <GripVertical size={14} />
            </div>

            <button
                onClick={() => {
                    if (!isEditing && !isHidden) {
                        onAdd(tpl.content, tpl.isImportant);
                    }
                }}
                className={`flex-1 text-left px-3 py-2 border rounded-xl text-[14px] font-semibold transition-all shadow-sm transform-gpu will-change-transform
                    ${!isEditing && !isHidden ? 'hover:border-indigo-400 active:scale-95' : 'cursor-default'}
                    ${tpl.isImportant
                        ? 'border-rose-200 bg-rose-50 text-rose-800 dark:bg-rose-900/40 dark:border-rose-700 dark:text-rose-200'
                        : 'border-slate-200 bg-white text-slate-900 dark:bg-slate-800 dark:border-slate-700 dark:text-white'}
                    ${isHidden ? '!bg-slate-100 !border-slate-200 !text-slate-400 dark:!bg-slate-800/40 dark:!border-slate-800 dark:!text-slate-500' : ''}`}
            >
                <div className={`truncate flex items-center gap-2 ${isHidden ? 'opacity-70' : ''}`}>
                    {tpl.isImportant && <Star size={12} className={`flex-shrink-0 ${isHidden ? 'fill-slate-400 text-slate-400' : 'fill-rose-500 text-rose-500'}`} />}
                    <span className={`truncate ${isHidden ? 'line-through' : ''}`}>{tpl.content}</span>
                </div>
            </button>
            
            {/* 編輯模式的操作按鈕 */}
            {isEditing && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (isCustom) {
                            onRemove(tpl.id);
                        } else {
                            onToggleVisibility(tpl.id);
                        }
                    }}
                    className={`ml-1 p-1.5 transition-opacity rounded-lg transform-gpu will-change-opacity
                        ${isCustom 
                            ? 'text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30' 
                            : (isHidden ? 'text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800')}`}
                    title={isCustom ? "刪除自訂模板" : (isHidden ? "顯示預設模板" : "隱藏預設模板")}
                >
                    {isCustom ? <Trash2 size={16} /> : (isHidden ? <EyeOff size={16} /> : <Eye size={16} />)}
                </button>
            )}
        </div>
    );
};

const QuickTemplatePanel = () => {
    const { getAllTemplates, hiddenTemplateIds, addCustomTemplate, removeCustomTemplate, toggleTemplateVisibility, addItemToCurrentLog } = useContactBookStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [newTemplateContent, setNewTemplateContent] = useState('');
    const [newTemplateImportant, setNewTemplateImportant] = useState(false);

    // 編輯模式時顯示包含隱藏的所有模板
    const templates = getAllTemplates(isEditing);

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
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => {
                                setIsEditing(!isEditing);
                                setIsAdding(false);
                            }}
                            className={`p-1.5 rounded-md transition-colors ${isEditing ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            title={isEditing ? "完成編輯" : "編輯/排序面板"}
                        >
                            <Settings size={16} />
                        </button>
                        <button
                            onClick={() => {
                                setIsAdding(!isAdding);
                                setIsEditing(false);
                            }}
                            className={`p-1.5 rounded-md transition-colors ${isAdding ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900 dark:text-indigo-400'}`}
                            title="新增自訂模板"
                        >
                            {isAdding ? <X size={16} /> : <Plus size={16} />}
                        </button>
                    </div>
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
                <SortableContext 
                    items={templates.map(tpl => `tpl-sort-${tpl.id}`)} 
                    strategy={verticalListSortingStrategy}
                >
                    {templates.map(tpl => (
                        <TemplateItem
                            key={tpl.id}
                            tpl={tpl}
                            isCustom={tpl.id.includes('custom')}
                            isEditing={isEditing}
                            isHidden={hiddenTemplateIds.includes(tpl.id)}
                            onAdd={addItemToCurrentLog}
                            onRemove={removeCustomTemplate}
                            onToggleVisibility={toggleTemplateVisibility}
                        />
                    ))}
                </SortableContext>
            </div>
            
            <div className="p-3 text-center text-xs text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800">
                {isEditing ? '拖曳左側把手可自由排序面板' : '點擊或拖曳按鈕快速輸入作業'}
            </div>
        </div>
    );
};

export default QuickTemplatePanel;
