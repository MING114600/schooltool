import { useState, useEffect, useMemo } from 'react';

// 輔助函式：將 "08:00" 轉為秒數
const getSecondsFromTime = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 3600 + m * 60;
};

/**
 * 教室儀表板核心計時與狀態 Hook
 */
export function useClassroomTimer({ 
  timeSlots, 
  dayTypes, 
  specialStatus, 
  isManualEco, 
  isAutoEcoOverride, 
  timeOffset 
}) {
  const [now, setNow] = useState(new Date(Date.now() + timeOffset));
  const [statusMode, setStatusMode] = useState('loading');
  const [currentSlot, setCurrentSlot] = useState(null);
  const [nextSlot, setNextSlot] = useState(null);
  const [progress, setProgress] = useState(100);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // 1. 每秒更新時間
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date(Date.now() + timeOffset));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeOffset]);

  // 2. 計算今日有效的時段 (處理半天/全天)
  const day = now.getDay();
  const activeTimeSlots = useMemo(() => {
    
    if (day === 0 || day === 6) return []; // 週末
    
    const isHalfDay = dayTypes[day] === 'half';
    if (!isHalfDay) return timeSlots;

    const halfDaySlots = [];
    let isDismissed = false;
    const p5Start = timeSlots.find(s => s.id === 'p5')?.start || '13:20';

    for (let slot of timeSlots) {
       if (isDismissed) continue;
       if (slot.id === 'break3') { 
          halfDaySlots.push({ ...slot, name: '打掃時間' }); 
          continue; 
       }
       if (getSecondsFromTime(slot.start) >= getSecondsFromTime(p5Start)) {
          halfDaySlots.push({ id: 'after', name: '放學', start: slot.start, end: '17:00', type: 'break' });
          isDismissed = true;
          continue;
       }
       halfDaySlots.push(slot);
    }
    return halfDaySlots;
  }, [timeSlots, dayTypes, day]);

  // 3. 核心狀態判定邏輯
  useEffect(() => {
    // A. 優先權最高：全螢幕廣播模式 (排除跑馬燈)
    if (specialStatus && specialStatus.mode !== 'marquee') { 
        setStatusMode('special'); 
        return; 
    }

    // B. 手動省電模式
    if (isManualEco) { 
        setStatusMode('eco'); 
        return; 
    }

    const currentTimeSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    let foundSlot = null;
    let nextClass = null;

    // C. 排序並查找當前與下一個時段
    const sortedSlots = [...activeTimeSlots].sort((a, b) => getSecondsFromTime(a.start) - getSecondsFromTime(b.start));
    
    if (activeTimeSlots.length === 0) {
      setStatusMode('off-hours');
      setCurrentSlot(null);
      setNextSlot(null);
      return;
    }

    for (let i = 0; i < sortedSlots.length; i++) {
      const slot = sortedSlots[i];
      const startSec = getSecondsFromTime(slot.start);
      const endSec = getSecondsFromTime(slot.end);

      if (currentTimeSec >= startSec && currentTimeSec < endSec) {
        foundSlot = slot;
        // 找尋下一個「課堂」時段
        for (let j = i + 1; j < sortedSlots.length; j++) { 
            if (sortedSlots[j].type === 'class') { 
                nextClass = sortedSlots[j]; 
                break; 
            } 
        }
        break;
      }
    }

    setCurrentSlot(foundSlot);
    setNextSlot(nextClass);

    // D. 根據時段類型決定模式
    if (!foundSlot) {
      setStatusMode('off-hours');
    } else if (foundSlot.type === 'class') {
      const startSec = getSecondsFromTime(foundSlot.start);
      const elapsed = currentTimeSec - startSec;
      
      // 自動進入省電 (上課 3 分鐘後，且未被手動取消)
      if (elapsed > 180 && !isAutoEcoOverride) {
          setStatusMode('eco');
      } else {
          setStatusMode('class');
      }
    } else {
      // 下課/午休時間邏輯
      const startSec = getSecondsFromTime(foundSlot.start);
      const endSec = getSecondsFromTime(foundSlot.end);
      const total = endSec - startSec;
      const remain = endSec - currentTimeSec;

      setSecondsRemaining(remain);
      setProgress(Math.max(0, Math.min(100, (remain / total) * 100)));

      // 預備鈴 (倒數 60 秒)
      if (remain <= 60 && remain > 0) {
          setStatusMode('pre-bell');
      } else {
          setStatusMode('break');
      }
    }
  }, [now, activeTimeSlots, specialStatus, isManualEco, isAutoEcoOverride]);

  return {
    now,
    statusMode,
    currentSlot,
    nextSlot,
    progress,
    secondsRemaining,
    activeTimeSlots
  };
}