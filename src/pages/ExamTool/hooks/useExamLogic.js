import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import usePersistentState from '../../../hooks/usePersistentState';
import { useTTS } from '../../../hooks/useTTS';
import { useClassroomStore } from '../../../store/useClassroomStore';
import { ATTENDANCE_STATUS, SYSTEM_CONFIG, STANDARD_TIME_SLOTS } from '../../../constants';

// --- [新增] 時間計算輔助函式 ---
const getMinutes = (dateObj) => dateObj.getHours() * 60 + dateObj.getMinutes();
const getTimeString = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};
// 格式化時間 (HH:MM)
const formatTime = (dateObj) =>
  dateObj.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });

const DEFAULT_SCHEDULE = STANDARD_TIME_SLOTS.filter(slot =>
  ['p1', 'p2', 'p3'].includes(slot.id)
);


export const useExamLogic = () => {
  // --- 1. Store 與 資料整合 ---
  const classes = useClassroomStore(state => state.classes);
  const currentClassId = useClassroomStore(state => state.currentClassId);
  const currentClass = classes.find(c => c.id === currentClassId);
  // (不再需要 updateAttendance，因為這裡只是讀取資料)

  const [isManualMode, setIsManualMode] = usePersistentState('exam_is_manual_mode', false, '1.0');
  const [manualData, setManualData] = usePersistentState('exam_manual_attendance', {
    expected: 0, actual: 0, note: ''
  }, '1.0');

  const today = new Date().toLocaleDateString('en-CA');

  // --- 2. 持久化設定 ---
  const [schedule, setSchedule] = usePersistentState('exam_schedule', DEFAULT_SCHEDULE, '2.1');
  const [ttsRules, setTtsRules] = usePersistentState('exam_tts_rules', [], '1.0');
  const [quickState, setQuickState] = usePersistentState('exam_quick_state', {
    start: null,
    end: null,
    title: '隨堂考'
  }, '1.0');
  const [announcements, setAnnouncements] = usePersistentState('exam_announcements', {
    exam: ['寫上班級姓名', '保持安靜', '桌面淨空', '檢查考卷', '有問題請舉手'],
    break: ['喝水上廁所', '準備好考試用品', '靜心複習', '提早回教室'],
    active: true
  }, '1.0');

  // --- 3. 音檔管理 ---
  const [audioFiles, setAudioFiles] = useState({}); // slotId -> objectURL
  const uploadAudio = (slotId, file) => {
    if (!file) return;
    if (audioFiles[slotId]) {
      URL.revokeObjectURL(audioFiles[slotId]);
    }

    const url = URL.createObjectURL(file);
    setAudioFiles(prev => ({ ...prev, [slotId]: url }));
  };
  const removeAudio = (slotId) => {
    setAudioFiles(prev => {
      const newFiles = { ...prev };
      if (newFiles[slotId]) {
        URL.revokeObjectURL(newFiles[slotId]); // 釋放網址記憶體
        delete newFiles[slotId]; // 移除該屬性
      }
      return newFiles;
    });
  };

  // --- 4. 時間邏輯 ---
  const [now, setNow] = useState(new Date());
  const [manualExtension, setManualExtension] = useState(0);
  const { speak } = useTTS();
  const lastAnnouncedTimeRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [quickExamStart, setQuickExamStart] = useState(null);
  const [quickExamEnd, setQuickExamEnd] = useState(null); // 儲存臨時考試的「結束時間物件 (Date)」
  const [quickExamTitle, setQuickExamTitle] = useState('隨堂考');

  // 啟動臨時考試 (接收分鐘數與標題)
  const startQuickExam = (minutes, title = '隨堂考') => {
    const nowTime = new Date();
    // 使用 getTime() 計算更精準
    const targetTime = new Date(nowTime.getTime() + minutes * 60 * 1000);

    setManualExtension(0);
    // 存入 ISO String 以便 JSON 序列化
    setQuickState({
      start: nowTime.toISOString(), // 轉成字串存檔
      end: targetTime.toISOString(), // 轉成字串存檔
      title: title
    });
  };

  // [修改 3]：停止測驗時，重置為 null
  const stopQuickExam = () => {
    setManualExtension(0);
    setQuickState({
      start: null,
      end: null,
      title: '隨堂考'
    });
  };

  useEffect(() => {
    // 只有在「有進行中臨時測驗」時才檢查
    if (quickState.start && quickState.end) {
      const endTimeObj = new Date(quickState.end);

      // 記得把「手動延長」的時間算進去
      endTimeObj.setMinutes(endTimeObj.getMinutes() + manualExtension);

      // 如果現在時間 >= 結束時間
      if (now >= endTimeObj) {
        stopQuickExam(); // 自動呼叫清除，UI 會瞬間回到 Idle 或原本排程
      }
    }
  }, [now, quickState, manualExtension]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ★★★ 核心修改：自動偵測時段邏輯 (修正延長時間無效問題) ★★★
  const currentStatus = useMemo(() => {
    // 1. 準備基礎參數
    const currentMins = getMinutes(now);

    // ----------------------------------------------------------------
    // 策略 A: 臨時測驗 (最高優先權)
    // ----------------------------------------------------------------
    if (quickState.start && quickState.end) {
      const startTimeObj = new Date(quickState.start);
      const endTimeObj = new Date(quickState.end);

      // 加上手動延長
      endTimeObj.setMinutes(endTimeObj.getMinutes() + manualExtension);

      const diff = Math.floor((endTimeObj - now) / 1000);
      const totalDuration = Math.max(1, Math.floor((endTimeObj - startTimeObj) / 1000));
      const progress = Math.max(0, Math.min(100, (diff / totalDuration) * 100));

      // 如果時間到，雖然 useEffect 會清除，但 render 可能會比 effect 快一步，所以這裡做防呆
      if (diff <= 0) return { status: 'idle', message: '測驗結束', remainingSeconds: 0, totalSeconds: 1, progress: 0, nextSlot: null, isQuickExam: true };

      return {
        status: 'exam',
        slot: {
          id: 'quick-exam',
          name: quickState.title,
          start: formatTime(startTimeObj),
          end: formatTime(endTimeObj),
          type: 'class'
        },
        nextSlot: null,
        remainingSeconds: diff,
        totalSeconds: totalDuration,
        progress: progress,
        audioUrl: null,
        isQuickExam: true
      };
    }

    // ----------------------------------------------------------------
    // 策略 B: 排程測驗 (一般邏輯)
    // ----------------------------------------------------------------
    const sortedSchedule = [...schedule].sort((a, b) => a.start.localeCompare(b.start));

    // 找出目前所在的時段
    const activeSlot = sortedSchedule.find(slot => {
      const startMins = getTimeString(slot.start);
      const endMins = getTimeString(slot.end);
      // 判定：開始 <= 現在 < (結束 + 延長)
      return currentMins >= startMins && currentMins < (endMins + manualExtension);
    });

    if (activeSlot) {
      const [endH, endM] = activeSlot.end.split(':').map(Number);
      const endTimeObj = new Date(now);
      endTimeObj.setHours(endH, endM + manualExtension, 0); // 設定結束時間

      const diff = Math.floor((endTimeObj - now) / 1000);

      // 計算總時長 (從開始時間算起)
      const [startH, startM] = activeSlot.start.split(':').map(Number);
      const startTimeObj = new Date(now);
      startTimeObj.setHours(startH, startM, 0);
      const totalDuration = Math.max(1, Math.floor((endTimeObj - startTimeObj) / 1000));

      // 找下一節
      const nextSlot = sortedSchedule[sortedSchedule.indexOf(activeSlot) + 1] || null;

      return {
        status: activeSlot.type === 'break' ? 'break' : 'exam',
        slot: activeSlot,
        nextSlot: nextSlot,
        remainingSeconds: Math.max(0, diff),
        totalSeconds: totalDuration,
        progress: Math.max(0, Math.min(100, (diff / totalDuration) * 100)),
        audioUrl: audioFiles[activeSlot.id] || null,
        isQuickExam: false
      };
    }

    // ----------------------------------------------------------------
    // 策略 C: 空檔偵測 (自動判斷下課 / 考前準備)
    // ----------------------------------------------------------------
    // 找出下一個即將開始的考試
    const nextSlotIndex = sortedSchedule.findIndex(slot => {
      const startMins = getTimeString(slot.start);
      return currentMins < startMins;
    });

    if (nextSlotIndex !== -1) {
      const upcomingSlot = sortedSchedule[nextSlotIndex];

      // 取得下一節考試的開始時間物件 (共用)
      const [nextH, nextM] = upcomingSlot.start.split(':').map(Number);
      const gapEndObj = new Date(now);
      gapEndObj.setHours(nextH, nextM, 0);

      // [情境 C-1]: 夾在兩堂課中間 (課間下課)
      if (nextSlotIndex > 0) {
        const prevSlot = sortedSchedule[nextSlotIndex - 1];

        // 確保現在確實是在上一節結束之後
        if (currentMins >= getTimeString(prevSlot.end)) {
          // 計算下課開始時間 (上一節結束)
          const [prevH, prevM] = prevSlot.end.split(':').map(Number);
          const gapStartObj = new Date(now);
          gapStartObj.setHours(prevH, prevM, 0);

          // 計算倒數
          const diff = Math.floor((gapEndObj - now) / 1000);
          const totalDuration = Math.max(1, Math.floor((gapEndObj - gapStartObj) / 1000));
          const progress = Math.max(0, Math.min(100, (diff / totalDuration) * 100));

          return {
            status: 'break',
            slot: {
              id: `gap-${prevSlot.id}`,
              name: '下課休息',
              start: prevSlot.end,
              end: upcomingSlot.start,
              type: 'break'
            },
            nextSlot: upcomingSlot,
            remainingSeconds: Math.max(0, diff),
            totalSeconds: totalDuration,
            progress: progress,
            audioUrl: null,
            isQuickExam: false
          };
        }
      }
      // [情境 C-2]: 第一節課之前 (考前準備)
      else if (nextSlotIndex === 0) {
        // 定義考前準備時間：考試前 10 分鐘
        const { PREP_MINUTES } = SYSTEM_CONFIG;

        // 計算準備開始時間 (考試時間 - 10分鐘)
        const prepStartObj = new Date(gapEndObj);
        prepStartObj.setMinutes(gapEndObj.getMinutes() - PREP_MINUTES);

        // 只有當「現在時間」進入這 10 分鐘區間才觸發
        if (now >= prepStartObj) {
          const diff = Math.floor((gapEndObj - now) / 1000);
          const totalDuration = PREP_MINUTES * 60; // 固定為 600 秒
          const progress = Math.max(0, Math.min(100, (diff / totalDuration) * 100));

          // 格式化顯示開始時間 (例如 08:10 -> 08:00)
          const startStr = formatTime(prepStartObj);

          return {
            status: 'break', // 使用下課的綠色樣式，比較溫和
            slot: {
              id: `prep-${upcomingSlot.id}`,
              name: '考前準備',
              start: startStr,
              end: upcomingSlot.start,
              type: 'break'
            },
            nextSlot: upcomingSlot,
            remainingSeconds: Math.max(0, diff),
            totalSeconds: totalDuration,
            progress: progress,
            audioUrl: null,
            isQuickExam: false
          };
        }
      }
    }

    // ----------------------------------------------------------------
    // 策略 D: 閒置 (Idle)
    // ----------------------------------------------------------------
    return {
      status: 'idle',
      message: '目前無考試',
      remainingSeconds: 0,
      totalSeconds: 1,
      progress: 0,
      nextSlot: null,
      isQuickExam: false
    };

  }, [now, schedule, manualExtension, quickState, audioFiles]);

  // --- 5. 自動 TTS (支援 考試中 與 下課/考前) ---
  useEffect(() => {
    // 1. 取得目前狀態 (exam 或 break 都可以觸發)
    const currentStatusType = currentStatus.status;

    // 如果靜音、或狀態不是 exam 也不是 break (例如 idle)，則不動作
    if (isMuted || (currentStatusType !== 'exam' && currentStatusType !== 'break')) return;

    const remaining = currentStatus.remainingSeconds;

    // 2. 尋找符合的規則
    const rule = ttsRules.find(r => {
      // 相容舊資料：如果沒有 type 屬性，預設視為 'exam'
      const ruleType = r.type || 'exam';

      return r.enabled &&
        r.triggerAt === remaining &&
        ruleType === currentStatusType; // ★ 關鍵：規則類型必須對應目前狀態
    });

    if (rule && lastAnnouncedTimeRef.current !== remaining) {
      speak(rule.text);
      lastAnnouncedTimeRef.current = remaining;
    }
  }, [currentStatus.remainingSeconds, currentStatus.status, isMuted, ttsRules, speak]);

  // --- 6. 整合出缺席數據 ---
  const attendanceStats = useMemo(() => {
    // A. 手動模式
    if (isManualMode) {
      return {
        expected: manualData.expected,
        actual: manualData.actual,
        absentees: manualData.note
          ? [{ id: 'manual', name: manualData.note, isManualNote: true }]
          : []
      };
    }

    // B. 自動連動模式
    if (!currentClass) return { expected: 0, actual: 0, absentees: [] };

    const students = currentClass.students || [];
    const classRecords = currentClass.attendanceRecords || {};
    const todayRecord = classRecords[today] || {};

    const absentees = students.filter(s => {
      const status = todayRecord[s.id];
      return status === 'absent' || status === 'personal';
    }).map(s => ({
      ...s,
      status: todayRecord[s.id] || 'unknown',
      statusLabel: ATTENDANCE_STATUS[todayRecord[s.id]]?.label || '未到'
    }));

    const actualCount = students.length - absentees.length;

    return { expected: students.length, actual: actualCount, absentees };
  }, [isManualMode, manualData, currentClass, today]);

  const safeSpeak = (text) => { if (!isMuted) speak(text); };

  return {
    now,
    schedule, setSchedule,
    ttsRules, setTtsRules,
    announcements, setAnnouncements,
    audioFiles, uploadAudio, removeAudio,
    attendanceStats,
    currentStatus,
    manualExtension, setManualExtension,
    isMuted, setIsMuted,
    speak: safeSpeak,
    isManualMode, setIsManualMode,
    manualData, setManualData,
    startQuickExam, // 匯出
    stopQuickExam,  // 匯出
    isQuickExam: !!quickState.start,
    today
  };
};