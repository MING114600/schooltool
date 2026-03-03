import React from 'react';
import { Clock, Trash2, Plus } from 'lucide-react';
import { UI_THEME } from '../../../../constants';
import SettingsSection from './SettingsSection';

const TimeSlotSettings = ({ 
  timeSlots, 
  setTimeSlots, 
  schedule, 
  setSchedule,
  isOpen, 
  onToggle 
}) => {

  // --- 邏輯區 (從 SettingsModal 搬過來) ---

  const handleTimeSlotChange = (id, field, value) => {
    const newSlots = timeSlots.map(slot => 
      slot.id === id ? { ...slot, [field]: value } : slot
    );
    // 自動排序：根據開始時間排序，避免時段亂跳
    newSlots.sort((a, b) => a.start.localeCompare(b.start));
    setTimeSlots(newSlots);
  };

  const handleAddSlot = () => {
    const newId = `custom_${Date.now()}`;
    const newSlot = { 
        id: newId, 
        name: '新時段', 
        start: '00:00', 
        end: '00:00', 
        type: 'break' 
    };
    setTimeSlots([...timeSlots, newSlot]);
  };

  const handleDeleteSlot = (id) => {
    if (confirm('確定要刪除此時段嗎？這將會一併清除該時段的課表資料。')) {
        // 1. 刪除時段
        setTimeSlots(timeSlots.filter(s => s.id !== id));
        
        // 2. 清理課表 (schedule) 中對應的垃圾資料
        const newSchedule = { ...schedule };
        Object.keys(newSchedule).forEach(day => {
            if (newSchedule[day][id]) delete newSchedule[day][id];
        });
        setSchedule(newSchedule);
    }
  };

  // 通用樣式
  const inputStyle = `bg-slate-100 dark:bg-slate-800 border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/50 outline-none rounded-lg transition-all ${UI_THEME.TEXT_PRIMARY}`;

  return (
    <SettingsSection 
      title="作息時間表設定" 
      icon={Clock} 
      theme="rose" // 對應 GROUP_THEME 的紅色系
      isOpen={isOpen} 
      onToggle={onToggle}
    >
      <div className="space-y-3">
          {/* 表頭 */}
          <div className={`grid grid-cols-12 gap-4 text-xs font-bold px-4 uppercase tracking-wider ${UI_THEME.TEXT_MUTED} opacity-70`}>
              <div className="col-span-3">時段名稱</div>
              <div className="col-span-2">開始</div>
              <div className="col-span-2">結束</div>
              <div className="col-span-3">類型</div>
              <div className="col-span-2 text-center">操作</div>
          </div>
          
          {/* 列表 */}
          {timeSlots.map((slot) => (
              <div key={slot.id} className={`grid grid-cols-12 gap-4 items-center p-3 rounded-xl border transition-all hover:shadow-md ${UI_THEME.SURFACE_CARD} ${UI_THEME.BORDER_DEFAULT}`}>
                  <div className="col-span-3">
                      <input 
                          value={slot.name} 
                          onChange={(e) => handleTimeSlotChange(slot.id, 'name', e.target.value)}
                          className={`w-full font-bold px-3 py-2 ${inputStyle}`}
                      />
                  </div>
                  <div className="col-span-2">
                      <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => handleTimeSlotChange(slot.id, 'start', e.target.value)}
                          className={`w-full font-mono font-bold text-center px-1 py-2 ${inputStyle}`}
                      />
                  </div>
                  <div className="col-span-2">
                      <input
                          type="time"
                          value={slot.end}
                          onChange={(e) => handleTimeSlotChange(slot.id, 'end', e.target.value)}
                          className={`w-full font-mono font-bold text-center px-1 py-2 ${inputStyle}`}
                      />
                  </div>
                  <div className="col-span-3">
                      <select 
                          value={slot.type} 
                          onChange={(e) => handleTimeSlotChange(slot.id, 'type', e.target.value)}
                          className={`w-full text-sm font-bold px-3 py-2 cursor-pointer ${inputStyle} ${slot.type === 'class' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                      >
                          <option value="class">📚 上課 (Class)</option>
                          <option value="break">☕ 下課 (Break)</option>
                      </select>
                  </div>
                  <div className="col-span-2 text-center">
                      <button 
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                          <Trash2 size={18} />
                      </button>
                  </div>
              </div>
          ))}

          {/* 新增按鈕 */}
          <button 
              onClick={handleAddSlot}
              className="w-full py-4 mt-4 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition-all flex items-center justify-center gap-2"
          >
              <Plus size={20} /> 新增時間段
          </button>
      </div>
    </SettingsSection>
  );
};

export default TimeSlotSettings;