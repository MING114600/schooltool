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

  const inputStyle = `bg-stone-50 dark:bg-zinc-800 border-none focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-amber-500/30 outline-none rounded-lg transition-all text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500`;

  return (
    <SettingsSection
      title="科目與提醒設定"
      icon={Clock}
      theme="amber"
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {/* 新增區塊 */}
      <div className="flex gap-2 md:gap-3 mb-6">
        <input
          value={newSubjectName}
          onChange={(e) => setNewSubjectName(e.target.value)}
          placeholder="輸入新科目名稱..."
          className={`flex-1 p-3 min-w-[120px] shadow-sm ${inputStyle}`}
          onKeyDown={(e) => e.key === 'Enter' && handleAddSubject()}
        />
        <button
          onClick={handleAddSubject}
          className="bg-emerald-500/90 hover:bg-emerald-500 text-white px-4 md:px-6 rounded-xl font-bold shadow-sm hover:shadow-md transition-all duration-300 active:scale-[0.98] outline-none flex flex-shrink-0 items-center gap-2"
        >
          <Plus size={20} /> <span className="hidden sm:inline">新增</span>
        </button>
      </div>

      {/* 列表區塊 (改為單欄寬版設計，釋放提示詞空間) */}
      <div className="flex flex-col gap-3">
        {/* 強制讓 'default' 項目排在最前面 */}
        {Object.keys(subjectHints)
          .sort((a, b) => (a === 'default' ? -1 : b === 'default' ? 1 : 0))
          .map(subject => (
            <div key={subject} className={`flex gap-3 items-center p-3 rounded-2xl md:rounded-xl border border-stone-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300`}>
              {subject === 'default' ? (
                <span className={`px-3 py-2 rounded-lg text-sm font-bold w-[160px] text-center bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 border border-amber-200/50 dark:border-amber-700/30 flex-shrink-0 shadow-sm`}>一般預設提醒</span>
              ) : (
                <input
                  defaultValue={subject}
                  onBlur={(e) => handleRenameSubject(subject, e.target.value)}
                  className={`w-[160px] px-3 py-2 font-bold bg-stone-50 md:bg-transparent border-b-2 border-stone-200 dark:border-zinc-700/50 focus:border-amber-500/50 outline-none text-sm transition-colors text-zinc-700 dark:text-zinc-200 flex-shrink-0 md:hover:bg-stone-50 dark:md:hover:bg-zinc-800 rounded-lg md:rounded-b-none`}
                  placeholder="科目名稱 (例: STEAM)"
                />
              )}

              <input
                value={subjectHints[subject]}
                onChange={(e) => setSubjectHints({ ...subjectHints, [subject]: e.target.value })}
                className={`flex-1 min-w-[100px] bg-transparent outline-none text-sm text-zinc-600 dark:text-zinc-300 focus:text-amber-700 dark:focus:text-amber-400 placeholder-zinc-300 dark:placeholder-zinc-600 transition-colors border-l border-stone-100 dark:border-zinc-700/50 pl-3 md:pl-4`}
                placeholder="輸入提醒事項，例如：請準備直笛與課本..."
              />

              {subject !== 'default' && (
                <button
                  onClick={() => handleDeleteSubject(subject)}
                  className="p-2.5 flex-shrink-0 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors duration-300 outline-none"
                  title="刪除"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          ))}
      </div>
    </SettingsSection>
  );
};

export default SubjectHintSettings;