import React, { useState } from 'react';
import { Map, X, Save, LayoutGrid, Trash2 } from 'lucide-react';

const LayoutTemplateModal = ({ isOpen, onClose, currentLayout, onApplyTemplate, onSaveTemplate, templates, onDeleteTemplate }) => {
    const [newTemplateName, setNewTemplateName] = useState('');

    if (!isOpen) return null;

    const handleSave = () => {
        if (!newTemplateName.trim()) return;
        onSaveTemplate(newTemplateName);
        setNewTemplateName('');
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
                <div className="p-4 bg-slate-800 dark:bg-slate-950 border-b border-slate-700 flex justify-between items-center text-white">
                    <h3 className="font-bold text-xl flex items-center gap-2"><Map size={24} className="text-blue-400"/> 座位樣板管理</h3>
                    <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full text-slate-300"><X size={20}/></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-800">
                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider flex items-center gap-2"><Save size={16}/> 儲存目前配置</h4>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newTemplateName}
                                onChange={(e) => setNewTemplateName(e.target.value)}
                                placeholder="輸入樣板名稱 (例如: 英文課分組)"
                                className="flex-1 p-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg text-sm outline-none focus:border-blue-500"
                            />
                            <button onClick={handleSave} disabled={!newTemplateName.trim()} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">儲存</button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2"><LayoutGrid size={16}/> 選擇樣板套用</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {templates.map(tpl => (
                                <div key={tpl.id} className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md transition-all group relative">
                                    <div className="flex justify-between items-start mb-1">
                                        <h5 className="font-bold text-slate-800 dark:text-white">{tpl.name}</h5>
                                        {tpl.type === 'custom' && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); if(confirm('確定刪除此樣板？')) onDeleteTemplate(tpl.id); }}
                                                className="text-slate-300 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 p-1"
                                            >
                                                <Trash2 size={14}/>
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">{tpl.description || (tpl.type === 'preset' ? '系統預設' : '自訂樣板')}</p>
                                    <button 
                                        onClick={() => { if(confirm(`確定套用「${tpl.name}」嗎？\n這將會改變目前的教室尺寸與走道設定。\n(學生將會保留，若位置不足會移至未排區)`)) { onApplyTemplate(tpl); onClose(); } }}
                                        className="w-full py-2 bg-slate-100 dark:bg-slate-600 hover:bg-blue-50 dark:hover:bg-slate-500 text-slate-600 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white font-bold rounded-lg text-sm transition-colors"
                                    >
                                        套用此樣板
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LayoutTemplateModal;