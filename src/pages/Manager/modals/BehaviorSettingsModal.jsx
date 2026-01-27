import React, { useState } from 'react';
import { Settings, Plus, X, Trash2, Save, ThumbsUp, ThumbsDown, Smile, Frown, ArrowUp, ArrowDown } from 'lucide-react';

const PRESET_ICONS = ['👍', '⭐', '❤️', '🔥', '💡', '🎓', '🏆', '🚀', '⚡', '📝', '🤝', '🗣️', '💤', '❌', '⚠️', '🐢', '📱', '🔊'];

// ★ 新增：接收 onShowDialog
const BehaviorSettingsModal = ({ isOpen, onClose, behaviors = [], onUpdateBehaviors, onResetScores, onShowDialog }) => {
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ icon: '⭐', label: '', score: 1, type: 'positive' });

  if (!isOpen) return null;

  const positiveBehaviors = behaviors.filter(b => (b.score >= 0 || b.type === 'positive'));
  const negativeBehaviors = behaviors.filter(b => (b.score < 0 || b.type === 'negative'));

  const handleEdit = (behavior) => { setEditingId(behavior.id); setFormData({ ...behavior }); };
  const handleAdd = (type) => { setEditingId('new'); setFormData({ id: `b_${Date.now()}`, icon: type === 'positive' ? '⭐' : '⚠️', label: '', score: type === 'positive' ? 1 : -1, type }); };
  
  // ★ 修改：驗證提示 (Alert)
  const handleSave = () => {
      if (!formData.label.trim()) { 
          onShowDialog({ type: 'alert', title: '格式錯誤', message: '請輸入項目名稱', variant: 'warning' });
          return; 
      }
      let newBehaviors = [...behaviors];
      if (editingId === 'new') {
          if (formData.type === 'positive') {
               const lastPosIndex = newBehaviors.map(b => b.score >= 0 || b.type === 'positive').lastIndexOf(true);
               if (lastPosIndex !== -1) newBehaviors.splice(lastPosIndex + 1, 0, formData);
               else newBehaviors.unshift(formData);
          } else { newBehaviors.push(formData); }
      } else { newBehaviors = newBehaviors.map(b => b.id === editingId ? formData : b); }
      onUpdateBehaviors(newBehaviors); setEditingId(null);
  };

  // ★ 修改：刪除確認 (Confirm)
  const handleDelete = (id) => { 
      onShowDialog({
          type: 'confirm',
          title: '刪除項目',
          message: '確定要刪除此評分項目嗎？',
          variant: 'danger',
          onConfirm: () => {
              const newBehaviors = behaviors.filter(b => b.id !== id);
              onUpdateBehaviors(newBehaviors);
              if (editingId === id) setEditingId(null);
          }
      });
  };

  const handleMove = (e, item, direction) => { 
      e.stopPropagation(); 
      const isPositive = (item.score >= 0 || item.type === 'positive');
      const currentList = isPositive ? [...positiveBehaviors] : [...negativeBehaviors];
      const otherList = isPositive ? [...negativeBehaviors] : [...positiveBehaviors];
      const index = currentList.findIndex(b => b.id === item.id);
      if (index === -1) return;
      if (direction === 'up') { if (index === 0) return; [currentList[index], currentList[index - 1]] = [currentList[index - 1], currentList[index]]; }
      else { if (index === currentList.length - 1) return; [currentList[index], currentList[index + 1]] = [currentList[index + 1], currentList[index]]; }
      const newList = isPositive ? [...currentList, ...otherList] : [...otherList, ...currentList];
      onUpdateBehaviors(newList);
  };
  const resetForm = () => { setEditingId(null); };

  return (
    <>
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] relative border border-slate-200 dark:border-slate-700">
            
            {/* Header */}
            <div className="p-4 bg-slate-800 dark:bg-slate-950 flex justify-between items-center text-white shrink-0">
            <h3 className="font-bold text-lg flex items-center gap-2">
                <Settings size={20} className="text-slate-400"/> 評分項目設定
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full text-slate-300"><X size={20}/></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-800">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 加分列表 */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2"><Smile className="text-emerald-500"/> 加分項目</h4>
                            <button onClick={() => handleAdd('positive')} className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors"><Plus size={16}/></button>
                        </div>
                        <div className="space-y-2">
                            {positiveBehaviors.map((b, idx) => (
                                <div 
                                    key={b.id} 
                                    onClick={() => handleEdit(b)}
                                    className="group flex items-center justify-between p-3 bg-white dark:bg-slate-700 border border-emerald-100 dark:border-emerald-900/50 rounded-xl shadow-sm cursor-pointer hover:border-emerald-300 dark:hover:border-emerald-500 hover:shadow-md transition-all active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{b.icon}</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{b.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg text-based">+{b.score}</span>
                                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => handleMove(e, b, 'up')} disabled={idx === 0} className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-slate-100 hover:text-slate-600 hover:dark:text-white disabled:opacity-0"><ArrowUp size={12}/></button>
                                            <button onClick={(e) => handleMove(e, b, 'down')} disabled={idx === positiveBehaviors.length - 1} className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-slate-100 hover:text-slate-600 dark:hover:text-white disabled:opacity-0"><ArrowDown size={12}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {positiveBehaviors.length === 0 && <div className="text-center py-4 text-xs text-slate-400 border-2 border-dashed border-emerald-100 dark:border-emerald-900/30 rounded-xl">尚無項目</div>}
                        </div>
                    </div>

                    {/* 扣分列表 */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2"><Frown className="text-rose-500"/> 扣分項目</h4>
                            <button onClick={() => handleAdd('negative')} className="p-1.5 bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 rounded-full hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-colors"><Plus size={16}/></button>
                        </div>
                        <div className="space-y-2">
                            {negativeBehaviors.map((b, idx) => (
                                <div 
                                    key={b.id} 
                                    onClick={() => handleEdit(b)}
                                    className="group flex items-center justify-between p-3 bg-white dark:bg-slate-700 border border-rose-100 dark:border-rose-900/50 rounded-xl shadow-sm cursor-pointer hover:border-rose-300 dark:hover:border-rose-500 hover:shadow-md transition-all active:scale-[0.98]"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all">{b.icon}</span>
                                        <span className="font-bold text-slate-700 dark:text-slate-200">{b.label}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-rose-600 dark:text-rose-100 bg-rose-50 dark:bg-rose-700/50 px-2 py-1 rounded-lg text-base">{b.score}</span>
                                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={(e) => handleMove(e, b, 'up')} disabled={idx === 0} className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white disabled:opacity-0"><ArrowUp size={12}/></button>
                                            <button onClick={(e) => handleMove(e, b, 'down')} disabled={idx === negativeBehaviors.length - 1} className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-600 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white disabled:opacity-0"><ArrowDown size={12}/></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {negativeBehaviors.length === 0 && <div className="text-center py-4 text-xs text-slate-400 border-2 border-dashed border-rose-100 dark:border-rose-900/30 rounded-xl">尚無項目</div>}
                        </div>
                    </div>

                </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center shrink-0">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500">系統操作</span>
                <div className="flex gap-3">
                    {/* ★ 修改：歸零分數 (Confirm) */}
                    <button 
                        onClick={() => onShowDialog({
                            type: 'confirm',
                            title: '歸零個人分數',
                            message: '確定要歸零所有學生的分數嗎？此操作無法復原。',
                            variant: 'danger',
                            onConfirm: () => onResetScores('student')
                        })}
                        className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                    >
                        歸零個人分數
                    </button>
                    <button 
                        onClick={() => onShowDialog({
                            type: 'confirm',
                            title: '歸零小組分數',
                            message: '確定要歸零所有小組的分數嗎？此操作無法復原。',
                            variant: 'danger',
                            onConfirm: () => onResetScores('group')
                        })}
                        className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                    >
                        歸零小組分數
                    </button>
                </div>
            </div>

        </div>
        </div>

        {/* 編輯視窗 (Portal) */}
        {editingId && (
            <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-[2px] flex items-center justify-center p-6 animate-in fade-in duration-200">
                <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-indigo-100 dark:border-indigo-900 ring-4 ring-indigo-50 dark:ring-indigo-900/30 animate-in zoom-in-95 duration-200 flex flex-col" onClick={e => e.stopPropagation()}>
                    
                    {/* Editor Header */}
                    <div className="flex justify-between items-center p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-2xl">
                        <h4 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                            {editingId === 'new' ? <Plus size={18} className="text-indigo-500"/> : <Edit3 size={18} className="text-indigo-500"/>} 
                            {editingId === 'new' ? '新增評分項目' : '編輯評分項目'}
                        </h4>
                        <button onClick={resetForm} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"><X size={18}/></button>
                    </div>
                    
                    {/* Editor Body */}
                    <div className="p-6 space-y-5">
                        <div className="grid grid-cols-1 gap-5">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">圖示 (Icon)</label>
                                <div className="flex gap-3 items-center">
                                    <div className="w-14 h-14 flex items-center justify-center text-3xl bg-slate-50 dark:bg-slate-900 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 shrink-0">
                                        {formData.icon}
                                    </div>
                                    <div className="flex-1 grid grid-cols-6 gap-2">
                                        {PRESET_ICONS.map(icon => (
                                            <button 
                                                key={icon} 
                                                onClick={() => setFormData({...formData, icon})}
                                                className={`p-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-xl transition-all ${formData.icon === icon ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-400 scale-110' : 'text-slate-500 dark:text-slate-400'}`}
                                            >
                                                {icon}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">名稱 (Label)</label>
                                    <input 
                                        type="text" 
                                        value={formData.label}
                                        onChange={(e) => setFormData({...formData, label: e.target.value})}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition-all"
                                        placeholder="例如：發表意見、回答問題..."
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">分數 (Score)</label>
                                    <input 
                                        type="number" 
                                        value={formData.score}
                                        onChange={(e) => setFormData({...formData, score: parseInt(e.target.value) || 0})}
                                        className={`w-full p-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded-xl text-sm font-black outline-none focus:ring-2 transition-all ${formData.score >= 0 ? 'text-emerald-600 dark:text-emerald-400 focus:ring-emerald-400' : 'text-rose-600 dark:text-rose-400 focus:ring-rose-400'}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">類型 (Type)</label>
                                    <select 
                                        value={formData.type}
                                        onChange={(e) => setFormData({...formData, type: e.target.value})}
                                        className="w-full p-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-400 transition-all"
                                    >
                                        <option value="positive">加分 (Positive)</option>
                                        <option value="negative">扣分 (Negative)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Editor Footer */}
                    <div className="flex justify-between items-center p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-2xl">
                        {editingId !== 'new' ? (
                            <button onClick={() => handleDelete(editingId)} className="px-4 py-2 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors">
                                <Trash2 size={16}/> 刪除此項
                            </button>
                        ) : <div></div>}
                        <div className="flex gap-2">
                            <button onClick={resetForm} className="px-5 py-2.5 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-sm transition-colors">取消</button>
                            <button onClick={handleSave} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95">
                                <Save size={18}/> 儲存設定
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

const Edit3 = ({ size, className }) => (
    <svg width={size} height={size} className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9"></path>
        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
    </svg>
);

export default BehaviorSettingsModal;