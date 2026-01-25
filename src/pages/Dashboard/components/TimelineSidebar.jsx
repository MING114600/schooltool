import React, { useEffect, useRef, useMemo } from 'react';
import { Clock, Coffee, BookOpen } from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';

// 輔助函式：計算進度條
const getProgress = (start, end, now) => {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const startTime = sh * 60 + sm;
  const endTime = eh * 60 + em;
  const nowTime = now.getHours() * 60 + now.getMinutes();
  
  if (nowTime < startTime) return 0;
  if (nowTime > endTime) return 100;
  return ((nowTime - startTime) / (endTime - startTime)) * 100;
};

// 子組件：SidebarHeader
const SidebarHeader = ({ now, is24Hour, dayTypes }) => {
  const dayType = dayTypes[now.getDay()] || 'full';

  return (
    <div className={`p-6 border-b flex flex-col items-center justify-center shrink-0 backdrop-blur-md ${UI_THEME.SURFACE_GLASS} ${UI_THEME.BORDER_DEFAULT}`}>
      <div className={`text-6xl font-black tracking-tighter mb-2 font-mono ${UI_THEME.TEXT_PRIMARY}`}>
        {now.toLocaleTimeString('en-US', { 
            hour12: !is24Hour, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        }).replace(/AM|PM/, '')}
      </div>
      <div className={`flex items-center gap-3 text-sm font-bold uppercase tracking-widest ${UI_THEME.TEXT_SECONDARY}`}>
        <span>{now.toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'long' })}</span>
        <span className={`px-2 py-0.5 rounded text-[10px] border ${dayType === 'half' ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800' : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800'}`}>
           {dayType === 'half' ? '半天課' : '全天課'}
        </span>
      </div>
    </div>
  );
};

// 子組件：SidebarList
const SidebarList = React.memo(({ displaySlots, daySchedule, currentSlotId, nextSlotId, now }) => {
  
  // 自動捲動邏輯 (使用 ID 查詢，更穩定)
  useEffect(() => {
    // 延遲一點點確保 DOM 已經渲染
    const timer = setTimeout(() => {
        let targetId = currentSlotId;

        // 如果當前時段不在列表內（例如現在是下課時間），嘗試捲動到「下一節課」
        const currentElement = document.getElementById(`slot-${currentSlotId}`);
        if (!currentElement && nextSlotId) {
            targetId = nextSlotId;
        }

        const element = document.getElementById(`slot-${targetId}`);
        if (element) {
            element.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center',  // 讓目標盡量在畫面中間
                inline: 'nearest' 
            });
        }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentSlotId, nextSlotId]); // 當「目前時段」或「下一節」改變時觸發

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar scroll-smooth relative">
      {displaySlots.map((slot) => {
        const isCurrent = slot.id === currentSlotId;
        const isNext = slot.id === nextSlotId;
        const subject = daySchedule[slot.id];
        const progress = isCurrent ? getProgress(slot.start, slot.end, now) : 0;

        // 動態樣式計算
        let containerClass = `relative p-4 rounded-2xl transition-all duration-500 border-l-4 `;
        
        if (isCurrent) {
            containerClass += `bg-white dark:bg-slate-800 shadow-lg scale-105 z-10 border-indigo-500 ring-1 ring-black/5 dark:ring-white/10`;
        } else if (isNext) {
            containerClass += `bg-slate-50 dark:bg-slate-800/50 border-blue-400 border-dashed opacity-80`;
        } else {
            containerClass += `bg-transparent border-transparent opacity-50 grayscale hover:opacity-80 hover:grayscale-0 hover:bg-slate-50 dark:hover:bg-slate-800/30`;
        }

        return (
          <div 
            key={slot.id} 
            id={`slot-${slot.id}`} // 加入 ID 方便定位
            className={containerClass}
          >
            {/* 進度條背景 (僅當前時段顯示) */}
            {isCurrent && (
              <div 
                className="absolute left-0 bottom-0 top-0 bg-indigo-50 dark:bg-indigo-900/20 transition-all duration-1000 -z-10 rounded-2xl" 
                style={{ width: `${progress}%` }} 
              />
            )}
            
            <div className="flex justify-between items-start mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${slot.type === 'class' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'}`}>
                {slot.name}
              </span>
              <span className={`font-mono text-sm font-bold opacity-70 ${UI_THEME.TEXT_PRIMARY}`}>
                {slot.start} - {slot.end}
              </span>
            </div>

            <div className="flex items-center gap-3">
               <div className={`p-2 rounded-full ${isCurrent ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'}`}>
                  {slot.type === 'class' ? <BookOpen size={20} /> : <Coffee size={20} />}
               </div>
               <div className={`text-lg font-bold truncate ${isCurrent ? 'text-indigo-600 dark:text-indigo-400' : UI_THEME.TEXT_PRIMARY}`}>
                  {subject || slot.name}
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});

// 主組件
const TimelineSidebar = ({ now, schedule, activeTimeSlots, currentSlot, nextSlot, is24Hour, dayTypes }) => {
  const currentDaySchedule = schedule[now.getDay()] || {};
  
  // 只保留「上課 (class)」或「午餐 (lunch)」時段
  const displaySlots = useMemo(() => activeTimeSlots.filter(s => s.type === 'class' || s.id === 'lunch'), [activeTimeSlots]);

  return (
    <div className={`w-80 h-full flex flex-col shadow-2xl z-20 border-r ${UI_THEME.SURFACE_MAIN} ${UI_THEME.BORDER_DEFAULT}`}>
      <SidebarHeader now={now} is24Hour={is24Hour} dayTypes={dayTypes} />
      <SidebarList 
        displaySlots={displaySlots} 
        daySchedule={currentDaySchedule} 
        currentSlotId={currentSlot?.id} 
        nextSlotId={nextSlot?.id} 
        now={now}
      />
    </div>
  );
};

export default TimelineSidebar;