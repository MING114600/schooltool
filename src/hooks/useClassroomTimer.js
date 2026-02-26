import { useState, useEffect, useMemo } from 'react';

// 輔助函式：將 "08:00" 轉為秒數
const getSecondsFromTime = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 3600 + m * 60;
};

// 🌟 新增輔助函式：將時間字串加上分鐘數，回傳新的時間字串 "HH:MM"
const addMinutes = (timeStr, minutesToAdd) => {
  if (!timeStr) return timeStr;
  const [h, m] = timeStr.split(':').map(Number);
  const totalMinutes = h * 60 + m + minutesToAdd;
  
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
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
    // P5 start time is hardcoded as '13:20' fallback if not found
    const p5Start = timeSlots.find(s => s.id === 'p5')?.start || '13:20';

    for (let slot of timeSlots) {
       if (isDismissed) continue;
       if (slot.id === 'break3') { 
          // 半天課的大下課轉為打掃時間的特殊邏輯保留
          halfDaySlots.push({ ...slot, name: '打掃時間' }); 
          continue; 
       }
       // 如果遇到下午的時段 (大於等於第五節開始時間)
       if (getSecondsFromTime(slot.start) >= getSecondsFromTime(p5Start)) {
          // 🌟 修正：放學時間長度設為 20 分鐘 (與正常放學一致)，而非硬編碼到 17:00
          // 這樣 20 分鐘後就會自然進入 off-hours 模式
          const dismissalEnd = addMinutes(slot.start, 20);
          
          halfDaySlots.push({ 
            id: 'after', 
            name: '放學', 
            start: slot.start, 
            end: dismissalEnd, 
            type: 'break' 
          });
          
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
      // 🌟 當半天課的「放學」時段(20分鐘)結束後，foundSlot 會變成 null，
      // 自然就會進入這裡，切換為 off-hours
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