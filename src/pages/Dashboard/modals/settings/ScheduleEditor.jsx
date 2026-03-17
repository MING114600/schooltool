import React from 'react';
import { Calendar } from 'lucide-react';
import { UI_THEME } from '../../../../constants';
import SettingsSection from './SettingsSection';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const ScheduleEditor = ({
  schedule,
  setSchedule,
  timeSlots,
  subjectHints,
  isOpen,
  onToggle
}) => {

  // 處理課表變更
  const handleScheduleChange = (day, slotId, value) => {
    setSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slotId]: value
      }
    }));
  };

  // 篩選出類型為 "class" (上課) 的時段
  const classSlots = timeSlots.filter(s => s.type === 'class');

  // 確保天數排序 (1~5)
  const sortedDays = Object.keys(schedule).sort();

  const baseInputStyle = `border-none outline-none rounded-xl transition-all duration-300 text-center text-sm cursor-pointer appearance-none shadow-sm pb-1`;

  return (
    <SettingsSection
      title="課表設定"
      icon={Calendar}
      theme="orange" // 對應 GROUP_THEME 的藍色
      isOpen={isOpen}
      onToggle={onToggle}
    >
      {/* 表頭：星期幾 */}
      <div className={`grid grid-cols-6 gap-3 text-sm text-center mb-3 font-bold p-3 rounded-xl ${UI_THEME.BACKGROUND} ${UI_THEME.TEXT_SECONDARY}`}>
        <div>節次</div>
        {sortedDays.map(day => (
          <div key={day}>週{WEEKDAYS[day]}</div>
        ))}
      </div>

      {/* 內容：各節次設定 */}
      {classSlots.length > 0 ? (
        classSlots.map(slot => (
          <div key={slot.id} className="grid grid-cols-6 gap-3 mb-3">
            {/* 節次名稱 */}
            <div className={`flex items-center justify-center font-bold rounded-lg text-sm ${UI_THEME.SURFACE_CARD} ${UI_THEME.TEXT_PRIMARY} shadow-sm border ${UI_THEME.BORDER_DEFAULT}`}>
              {slot.name}
            </div>

            {/* 每天該節次的下拉選單 */}
            {sortedDays.map(day => {
              const selectedSubject = schedule[day]?.[slot.id];
              const isSelected = Boolean(selectedSubject);

              return (
                <div key={`${day}-${slot.id}`} className="relative h-full">
                  <select
                    value={selectedSubject || ''}
                    onChange={(e) => handleScheduleChange(day, slot.id, e.target.value)}
                    className={`w-full h-full min-h-[44px] px-2 ${baseInputStyle} ${isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 ring-1 ring-indigo-200/50 dark:ring-indigo-800/50'
                        : 'bg-stone-50 dark:bg-zinc-800/50 text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 font-medium'
                      }`}
                  >
                    <option value="" className="text-zinc-400 font-normal">(空堂)</option>
                    {Object.keys(subjectHints)
                      .filter(k => k !== 'default')
                      .map(subject => (
                        <option key={subject} value={subject} className="text-zinc-800 dark:text-zinc-200 font-medium">{subject}</option>
                      ))
                    }
                  </select>
                </div>
              );
            })}
          </div>
        ))
      ) : (
        <div className={`text-center py-8 ${UI_THEME.TEXT_MUTED} text-sm border-2 border-dashed ${UI_THEME.BORDER_DEFAULT} rounded-xl`}>
          尚未設定任何「上課」時段，請先至「作息時間表」新增類型為「📚 上課」的時段。
        </div>
      )}
    </SettingsSection>
  );
};

export default ScheduleEditor;