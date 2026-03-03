import React, { useState } from 'react';
import { Clock, Trash2, Plus } from 'lucide-react';
import { UI_THEME } from '../../../../constants';
import SettingsSection from './SettingsSection';

const SubjectHintSettings = ({ 
  subjectHints, 
  setSubjectHints, 
  schedule, 
  setSchedule,
  isOpen, 
  onToggle 
}) => {
  const [newSubjectName, setNewSubjectName] = useState('');

  // --- 搬過來的邏輯 ---

  const handleAddSubject = () => {
    if (!newSubjectName.trim()) return;
    if (subjectHints[newSubjectName.trim()]) {
      alert('該科目已存在！');
      return;
    }
    setSubjectHints(prev => ({
      ...prev,
      [newSubjectName.trim()]: '請設定準備事項...'
    }));
    setNewSubjectName('');
  };

  const handleDeleteSubject = (subject) => {
    if (subject === 'default') {
      alert('預設科目無法刪除');
      return;
    }
    if (confirm(`確定要刪除「${subject}」嗎？`)) {
       // 1. 刪除提示詞
       const newHints = { ...subjectHints };
       delete newHints[subject];
       setSubjectHints(newHints);
       
       // 2. 清理課表中使用了該科目的格子
       const newSchedule = { ...schedule };
       Object.keys(newSchedule).forEach(day => {
         Object.keys(newSchedule[day]).forEach(period => {
           if (newSchedule[day][period] === subject) {
             newSchedule[day][period] = '';
           }
         });
       });
       setSchedule(newSchedule);
    }
  };

  const handleRenameSubject = (oldName, newName) => {
    const trimmedNew = newName.trim();
    if (oldName === trimmedNew || !trimmedNew) return;
    if (subjectHints[trimmedNew]) {
      alert(`科目「${trimmedNew}」已存在。`);
      return;
    }
    
    // 1. 更新提示詞 Key
    const newHints = { ...subjectHints };
    newHints[trimmedNew] = newHints[oldName];
    delete newHints[oldName];
    setSubjectHints(newHints);

    // 2. 更新課表中使用了該科目的格子
    const newSchedule = { ...schedule };
    Object.keys(newSchedule).forEach(day => {
      Object.keys(newSchedule[day]).forEach(period => {
        if (newSchedule[day][period] === oldName) {
          newSchedule[day][period] = trimmedNew;
        }
      });
    });
    setSchedule(newSchedule);
  };

  const inputStyle = `bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 outline-none rounded-lg transition-all ${UI_THEME.TEXT_PRIMARY}`;

  return (
    <SettingsSection 
      title="科目與提醒詞管理" 
      icon={Clock} 
      theme="amber" 
      isOpen={isOpen} 
      onToggle={onToggle}
    >
        {/* 新增區塊 */}
        <div className="flex gap-3 mb-6">
          <input 
              value={newSubjectName} 
              onChange={(e) => setNewSubjectName(e.target.value)} 
              placeholder="輸入新科目名稱..." 
              className={`flex-1 p-3 shadow-sm ${inputStyle}`} 
              onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()} 
          />
          <button 
              onClick={handleAddSubject} 
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center gap-2"
          >
              <Plus size={20}/> 新增
          </button>
        </div>

        {/* 列表區塊 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.keys(subjectHints).map(subject => (
            <div key={subject} className={`flex gap-3 items-center p-3 rounded-xl border shadow-sm ${UI_THEME.SURFACE_CARD} ${UI_THEME.BORDER_DEFAULT}`}>
              {subject === 'default' ? (
                  <span className={`px-3 py-1.5 rounded-lg text-sm font-bold w-24 text-center ${UI_THEME.BACKGROUND} ${UI_THEME.TEXT_MUTED}`}>預設</span>
              ) : (
                  <input 
                      defaultValue={subject} 
                      onBlur={(e) => handleRenameSubject(subject, e.target.value)} 
                      className={`w-24 px-2 py-1 font-bold bg-transparent border-b-2 border-transparent focus:border-blue-500 outline-none text-sm transition-colors ${UI_THEME.TEXT_PRIMARY}`}
                  />
              )}
              
              <input 
                  value={subjectHints[subject]} 
                  onChange={(e) => setSubjectHints({...subjectHints, [subject]: e.target.value})} 
                  className={`flex-1 bg-transparent outline-none text-sm ${UI_THEME.TEXT_SECONDARY} focus:text-blue-500`} 
                  placeholder="輸入提醒事項..." 
              />
              
              {subject !== 'default' && (
                  <button 
                      onClick={() => handleDeleteSubject(subject)} 
                      className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                  >
                      <Trash2 size={16}/>
                  </button>
              )}
            </div>
          ))}
        </div>
    </SettingsSection>
  );
};

export default SubjectHintSettings;