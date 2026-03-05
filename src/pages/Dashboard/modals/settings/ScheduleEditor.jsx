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

  const inputStyle = `bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 outline-none rounded-lg transition-all ${UI_THEME.TEXT_PRIMARY}`;

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
            {sortedDays.map(day => (
              <select
                key={`${day}-${slot.id}`}
                value={schedule[day]?.[slot.id] || ''}
                onChange={(e) => handleScheduleChange(day, slot.id, e.target.value)}
                className={`text-center text-sm cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 ${inputStyle} p-2 appearance-none`}
              >
                <option value="" className="text-slate-400">(空堂)</option>
                {Object.keys(subjectHints)
                    .filter(k => k !== 'default')
                    .map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                    ))
                }
              </select>
            ))}
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