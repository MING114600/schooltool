import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, Edit3, Save } from 'lucide-react';
import { UI_THEME } from '../../../../constants';
import SettingsSection from './SettingsSection';

const BroadcastSettings = ({ 
  customPresets, 
  setCustomPresets, 
  isOpen, 
  onToggle 
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', sub: '' });

  const handleEditStart = (preset) => {
    setEditingId(preset.id);
    setEditForm({ title: preset.title, sub: preset.sub });
  };

  const handleEditSave = () => {
    setCustomPresets(prev => prev.map(p => 
      p.id === editingId ? { ...p, title: editForm.title, sub: editForm.sub } : p
    ));
    setEditingId(null);
  };

  const handleDelete = (id) => {
    if (confirm('確定刪除此預設廣播？')) {
      setCustomPresets(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleAdd = () => {
    const newId = Date.now();
    setCustomPresets(prev => [
      ...prev, 
      { id: newId, title: '新廣播', sub: '請輸入內容', icon: 'Megaphone', color: 'from-blue-500 to-cyan-500', mode: 'fullscreen' }
    ]);
    setEditingId(newId);
    setEditForm({ title: '新廣播', sub: '請輸入內容' });
  };

  return (
    <SettingsSection 
      title="廣播快捷鍵設定" 
      icon={Megaphone} 
      theme="cyan" 
      isOpen={isOpen} 
      onToggle={onToggle}
    >
      <div className="space-y-3">
        {customPresets.map(preset => (
          <div key={preset.id} className={`flex items-center gap-3 p-3 rounded-xl border ${UI_THEME.SURFACE_CARD} ${UI_THEME.BORDER_DEFAULT}`}>
            {editingId === preset.id ? (
              <div className="flex-1 grid grid-cols-2 gap-2">
                <input 
                  value={editForm.title} 
                  onChange={e => setEditForm({...editForm, title: e.target.value})}
                  className="p-2 border rounded text-sm font-bold bg-white dark:bg-slate-800 dark:border-slate-600"
                  placeholder="標題"
                />
                <input 
                  value={editForm.sub} 
                  onChange={e => setEditForm({...editForm, sub: e.target.value})}
                  className="p-2 border rounded text-sm bg-white dark:bg-slate-800 dark:border-slate-600"
                  placeholder="副標題"
                />
              </div>
            ) : (
              <div className="flex-1">
                <div className={`font-bold text-sm ${UI_THEME.TEXT_PRIMARY}`}>{preset.title}</div>
                <div className={`text-xs ${UI_THEME.TEXT_MUTED}`}>{preset.sub}</div>
              </div>
            )}

            <div className="flex gap-1">
              {editingId === preset.id ? (
                <button onClick={handleEditSave} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded"><Save size={16}/></button>
              ) : (
                <button onClick={() => handleEditStart(preset)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded"><Edit3 size={16}/></button>
              )}
              <button onClick={() => handleDelete(preset.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
        
        <button 
          onClick={handleAdd}
          className="w-full py-3 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={18} /> 新增廣播預設
        </button>
      </div>
    </SettingsSection>
  );
};

export default BroadcastSettings;