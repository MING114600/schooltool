import React, { useState, useEffect, useMemo } from 'react';
import { Megaphone, Users, BookOpen, Eye, Bell, MessageSquare, 
  Star, Heart, AlertTriangle, Info, Zap } from 'lucide-react';

import { UI_THEME, STANDARD_TIME_SLOTS } from './utils/constants';
import { 
  DEFAULT_SCHEDULE, DEFAULT_SUBJECT_HINTS, 
  DEFAULT_DAY_TYPES, SYSTEM_BUTTONS_CONFIG, DEFAULT_CUSTOM_BROADCASTS ,
  DEFAULT_WEATHER_CONFIG
} from './pages/Dashboard/utils/dashboardConstants';
import usePersistentState from './hooks/usePersistentState';


// --- Components ---
import SettingsModal from './pages/Dashboard/modals/SettingsModal';
import TimelineSidebar from './pages/Dashboard/components/TimelineSidebar';
import ControlDock from './pages/Dashboard/components/ControlDock';
import ToolsMenu from './pages/Dashboard/modals/ToolsMenu';
import BroadcastInputModal from './pages/Dashboard/modals/BroadcastInputModal';
import MessageInput from './pages/Dashboard/modals/MessageInput';

// --- Views ---
import ClassView from './pages/Dashboard/views/ClassView';
import BreakView from './pages/Dashboard/views/BreakView';
import EcoView from './pages/Dashboard/views/EcoView';
import OffHoursView from './pages/Dashboard/views/OffHoursView';
import SpecialView from './pages/Dashboard/views/SpecialView';
import MarqueeView from './pages/Dashboard/views/MarqueeView';

// --- Widgets ---
import TimerWidget from './components/common/widgets/TimerWidget';
import LotteryWidget from './components/common/widgets/LotteryWidget';
import SoundBoard from './components/common/widgets/SoundBoard';
import WeatherWidget from './pages/Dashboard/components/WeatherWidget';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const getSecondsFromTime = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 3600 + m * 60;
};

const ICON_MAP = {
  Megaphone, Users, BookOpen, Eye, Bell, MessageSquare, 
  Star, Heart, AlertTriangle, Info, Zap
};

// --- 主應用組件 ---

const ClassroomDashboardV2 = ({ theme, cycleTheme }) => {
  // --- Persistence States (一行搞定讀取 + 自動存檔) ---
  const [timeSlots, setTimeSlots] = usePersistentState('timeSlots', STANDARD_TIME_SLOTS);
  const [schedule, setSchedule] = usePersistentState('schedule', DEFAULT_SCHEDULE);
  const [subjectHints, setSubjectHints] = usePersistentState('subjectHints', DEFAULT_SUBJECT_HINTS);
  const [is24Hour, setIs24Hour] = usePersistentState('is24Hour', true);
  const [dayTypes, setDayTypes] = usePersistentState('dayTypes', DEFAULT_DAY_TYPES);
  const [customPresets, setCustomPresets] = usePersistentState('customPresets', DEFAULT_CUSTOM_BROADCASTS);
  const [visibleButtons, setVisibleButtons] = usePersistentState('visibleButtons', () => [
      ...SYSTEM_BUTTONS_CONFIG.singles.map(b => b.id), 
      ...SYSTEM_BUTTONS_CONFIG.groups.flatMap(g => g.items.map(b => b.id))
  ]);

  // 天氣設定
  const [weatherConfig, setWeatherConfig] = usePersistentState('weatherConfig', DEFAULT_WEATHER_CONFIG);

  // UI States
  const [teacherMessage, setTeacherMessage] = usePersistentState('teacherMessage', '');
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTools, setShowTools] = useState(false); 
  const [showBroadcastInput, setShowBroadcastInput] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false); 
  const [now, setNow] = useState(new Date());
  const [timeOffset, setTimeOffset] = useState(0); 
  const [showSidebar, setShowSidebar] = usePersistentState('showSidebar', true);
  const [isSystemSoundEnabled, setIsSystemSoundEnabled] = usePersistentState('isSystemSoundEnabled', false);
  
  // Logic States
  const [statusMode, setStatusMode] = useState('loading'); 
  const [specialStatus, setSpecialStatus] = useState(null);
  const [isManualEco, setIsManualEco] = useState(false); 
  const [isAutoEcoOverride, setIsAutoEcoOverride] = useState(false);
  const [dismissedNap, setDismissedNap] = useState(false);
  const [currentSlot, setCurrentSlot] = useState(null);
  const [nextSlot, setNextSlot] = useState(null);
  const [progress, setProgress] = useState(100);
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // Widget States
  const [toolsState, setToolsState] = useState({ timer: false, lottery: false, sound: false });
  const [lotteryStudents, setLotteryStudents] = useState([]);

  // --- Effects ---
// 監聽廣播狀態改變，自動播放語音
	useEffect(() => {
    if (specialStatus && isSystemSoundEnabled) {
        // 如果有設定 message 且 開啟了語音
        const textToSpeak = `${specialStatus.message}。${specialStatus.sub || ''}`;

        // 取消舊的
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = 'zh-TW';
        utterance.rate = 0.9;

        // 嘗試找 Google 中文
        const voices = window.speechSynthesis.getVoices();
        const zhVoice = voices.find(v => v.lang.includes('zh-TW') || v.lang.includes('zh-CN'));
        if (zhVoice) utterance.voice = zhVoice;

        window.speechSynthesis.speak(utterance);
    }
	}, [specialStatus, isSystemSoundEnabled]); // 當廣播出現時觸發


  // Load Students for Lottery
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('classroom_data');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed.classes && parsed.classes.length > 0 && parsed.classes[0].students.length > 0) {
          setLotteryStudents(parsed.classes[0].students);
          return;
        }
      }
      setLotteryStudents(Array.from({ length: 30 }, (_, i) => ({ id: `dummy_${i + 1}`, number: (i + 1).toString(), name: `${i + 1}號`, gender: 'M', group: '' })));
    } catch (e) { console.error("Failed to load students", e); }
  }, []);
  
  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (showSettings || showBroadcastInput || isEditingMessage) return;
      if (e.key === 'f' || e.key === 'F') toggleFullScreen();
      if (e.key === 'Escape') {
        if (showSettings) setShowSettings(false);
        if (showTools) setShowTools(false);
        if (showBroadcastInput) setShowBroadcastInput(false);
        if (specialStatus) setSpecialStatus(null);
        if (isEditingMessage) setIsEditingMessage(false);
        if (statusMode === 'break' && !dismissedNap) setDismissedNap(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showSettings, showTools, showBroadcastInput, specialStatus, isEditingMessage, dismissedNap, statusMode]);

  // Fullscreen Handler
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((e) => console.error(e));
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
  };
  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Time & Eco Logic
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date(Date.now() + timeOffset)), 1000);
    return () => clearInterval(timer);
  }, [timeOffset]);

  useEffect(() => {
    if (!showSettings) { setIsAutoEcoOverride(false); setDismissedNap(false); }
  }, [currentSlot?.id, showSettings]);

  // Main Status Logic
  const activeTimeSlots = useMemo(() => {
    const day = now.getDay();
    if (day === 0 || day === 6) return []; 
    const isHalfDay = dayTypes[day] === 'half';
    if (!isHalfDay) return timeSlots;
    const halfDaySlots = [];
    let isDismissed = false;
    const p5Start = timeSlots.find(s => s.id === 'p5')?.start || '13:20';
    for (let slot of timeSlots) {
       if (isDismissed) continue;
       if (slot.id === 'break3') { halfDaySlots.push({ ...slot, name: '打掃時間' }); continue; }
       if (getSecondsFromTime(slot.start) >= getSecondsFromTime(p5Start)) {
          halfDaySlots.push({ id: 'after', name: '放學', start: slot.start, end: '17:00', type: 'break' });
          isDismissed = true;
          continue;
       }
       halfDaySlots.push(slot);
    }
    return halfDaySlots;
  }, [timeSlots, dayTypes, now.getDay()]);

  useEffect(() => {
	if (specialStatus && specialStatus.mode !== 'marquee') { 
        setStatusMode('special'); 
        return; 
    }
    if (isManualEco) { setStatusMode('eco'); return; }
    const currentTimeSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    let foundSlot = null;
    let nextClass = null;
    const sortedSlots = [...activeTimeSlots].sort((a, b) => getSecondsFromTime(a.start) - getSecondsFromTime(b.start));
    if (activeTimeSlots.length === 0) { setStatusMode('off-hours'); setCurrentSlot(null); setNextSlot(null); return; }
    for (let i = 0; i < sortedSlots.length; i++) {
      const slot = sortedSlots[i];
      const startSec = getSecondsFromTime(slot.start);
      const endSec = getSecondsFromTime(slot.end);
      if (currentTimeSec >= startSec && currentTimeSec < endSec) {
        foundSlot = slot;
        for (let j = i + 1; j < sortedSlots.length; j++) { if (sortedSlots[j].type === 'class') { nextClass = sortedSlots[j]; break; } }
        break;
      }
    }
    setCurrentSlot(foundSlot);
    setNextSlot(nextClass);
    if (!foundSlot) { setStatusMode('off-hours'); return; }
    if (foundSlot.type === 'class') {
      const startSec = getSecondsFromTime(foundSlot.start);
      const elapsed = currentTimeSec - startSec;
      if (elapsed > 180 && !isAutoEcoOverride) setStatusMode('eco'); else setStatusMode('class');
    } else {
      const startSec = getSecondsFromTime(foundSlot.start);
      const endSec = getSecondsFromTime(foundSlot.end);
      const total = endSec - startSec;
      const remain = endSec - currentTimeSec;
      setSecondsRemaining(remain);
      setProgress(Math.max(0, Math.min(100, (remain / total) * 100)));
      if (remain <= 60 && remain > 0) setStatusMode('pre-bell'); else setStatusMode('break');
    }
  }, [now, activeTimeSlots, specialStatus, isManualEco]);

  // Helpers
  const isNapTime = currentSlot?.name.includes('午休') || currentSlot?.id === 'nap';
  const isDismissal = currentSlot?.name.includes('放學') || currentSlot?.id === 'after';
  const isAutoNapActive = (isNapTime || isDismissal) && !dismissedNap && statusMode === 'break';
  
  const getNextSubjectName = () => {
    if (!nextSlot) return '放學';
    const daySchedule = schedule[now.getDay()];
    if (!daySchedule) return '無課表';
    return daySchedule[nextSlot.id] || nextSlot.name;
  };

  const getSystemHint = () => {
    if (currentSlot && (currentSlot.name.includes('打掃') || currentSlot.id === 'cleaning')) return subjectHints['全天打掃'] || subjectHints['打掃時間'] || '請拿起掃具，認真打掃環境，保持整潔';
    if (currentSlot && (currentSlot.name.includes('午餐') || currentSlot.name.includes('午休') || currentSlot.name.includes('放學'))) return subjectHints[currentSlot.name] || '請保持安靜';
    const subject = getNextSubjectName();
    return subjectHints[subject] || subjectHints['default'];
  };

  const toggleTool = (tool, isOpen) => setToolsState(prev => ({ ...prev, [tool]: isOpen }));
  const isMarqueeActive = specialStatus?.mode === 'marquee';




// 3. 修改處理廣播的函式
  const handleBroadcastConfirm = (title, sub, options) => {
    const IconComponent = options.icon && typeof options.icon === 'string' 
        ? (ICON_MAP[options.icon] || Megaphone) 
        : Megaphone;

    setSpecialStatus({ 
        message: title, 
        sub: sub, 
        // 優先使用傳入的 color，沒有的話才用預設粉紅
        color: options.color || 'from-pink-500 to-rose-500', 
        type: 'input', 
        id: 99, 
        icon: IconComponent, 
        mode: options.mode 
    });

    // 處理 TTS 語音
    if (options.enableTTS) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(`${title}。${sub}`);
        utterance.lang = 'zh-TW';
        utterance.rate = 0.9;
        const voices = window.speechSynthesis.getVoices();
        const zhVoice = voices.find(v => v.lang.includes('zh-TW') || v.lang.includes('zh-CN'));
        if (zhVoice) utterance.voice = zhVoice;
        window.speechSynthesis.speak(utterance);
    }
  };

  // 4. 修改快捷按鈕的觸發函式 (修正：確保傳遞 color 與 icon)
  const onCustomBroadcast = (preset) => {
    handleBroadcastConfirm(preset.title, preset.sub, { 
        mode: preset.mode, 
        enableTTS: preset.enableTTS,
        color: preset.color, // ✅ 這裡一定要傳，不然點快捷鍵會變回預設粉紅色
        icon: preset.icon    // ✅ 這裡也要傳
    });
  };

  // --- Render ---
  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans ${UI_THEME.BACKGROUND} ${UI_THEME.TEXT_PRIMARY} selection:bg-indigo-200 dark:selection:bg-indigo-900`}>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      {/* 天氣小工具 */}
	  {weatherConfig.enabled && statusMode !== 'eco' && statusMode !== 'special' && statusMode !== 'off-hours' && (
         <div className={`absolute right-8 z-30 transition-all duration-500 ease-in-out ${isMarqueeActive ? 'top-24' : 'top-8'}`}>
            <WeatherWidget weatherConfig={weatherConfig} />
         </div>
      )}

      {/* 側邊欄 */}
      {showSidebar && statusMode !== 'eco' && statusMode !== 'off-hours' && (
        <TimelineSidebar 
          now={now} schedule={schedule} activeTimeSlots={activeTimeSlots}
          currentSlot={currentSlot} nextSlot={nextSlot} 
          is24Hour={is24Hour} dayTypes={dayTypes} 
        />
      )}

      {/* 右側主內容區塊 */}
      <div className="flex-1 flex flex-col relative transition-all duration-500">
        
        {/* 跑馬燈廣播 */}
        {specialStatus?.mode === 'marquee' && (
           <MarqueeView 
              message={specialStatus.message} 
              sub={specialStatus.sub} 
              color={specialStatus.color}
              onClose={() => {
                  setSpecialStatus(null);
                  window.speechSynthesis.cancel();
              }}
           />
        )}

        {statusMode === 'loading' && <div className="flex-1 flex items-center justify-center">Loading...</div>}
        
        {/* 各種視圖 */}
        {(statusMode === 'break' || statusMode === 'pre-bell') && (
          <BreakView 
            statusMode={statusMode} currentSlot={currentSlot} now={now} is24Hour={is24Hour}
            progress={progress} secondsRemaining={secondsRemaining}
            nextSubjectName={getNextSubjectName()} systemHint={getSystemHint()}
            teacherMessage={teacherMessage} setIsEditingMessage={setIsEditingMessage}
            dismissedNap={dismissedNap} setDismissedNap={setDismissedNap}
          />
        )}
        
        {statusMode === 'class' && <ClassView schedule={schedule} now={now} currentSlot={currentSlot} />}
        
        {statusMode === 'eco' && (
          <EcoView 
            now={now} schedule={schedule} currentSlot={currentSlot} is24Hour={is24Hour}
            onWake={() => { setIsManualEco(false); setIsAutoEcoOverride(true); }}
          />
        )}
        
        {statusMode === 'off-hours' && <OffHoursView now={now} is24Hour={is24Hour} />}
        
        {/* 全螢幕廣播 */}
        {statusMode === 'special' && specialStatus?.mode !== 'marquee' && (
          <SpecialView 
            specialStatus={specialStatus} onClose={() => setSpecialStatus(null)}
            now={now} is24Hour={is24Hour} subjectHints={subjectHints}
			isSystemSoundEnabled={isSystemSoundEnabled}
          />
        )}

        {/* 控制列 */}
        <ControlDock 
            statusMode={statusMode} 
            setSpecialStatus={setSpecialStatus} 
            setIsManualEco={setIsManualEco} 
            isFullscreen={isFullscreen} 
            toggleFullScreen={toggleFullScreen} 
            setShowSettings={setShowSettings} 
            isAutoNapActive={isAutoNapActive} 
            onBroadcastClick={() => setShowBroadcastInput(true)} 
            visibleButtons={visibleButtons} 
            setShowTools={setShowTools}
            theme={theme}
            cycleTheme={cycleTheme}
            showSidebar={showSidebar}
            toggleSidebar={() => setShowSidebar(!showSidebar)}
			isSystemSoundEnabled={isSystemSoundEnabled}
			toggleSystemSound={() => setIsSystemSoundEnabled(!isSystemSoundEnabled)}
			customPresets={customPresets} // 傳入自訂按鈕資料
			onCustomBroadcast={onCustomBroadcast} // 傳入發布函式
        />
      </div>
      
      {/* 彈出視窗 */}
      <SettingsModal 
        isOpen={showSettings} onClose={() => setShowSettings(false)} 
        timeSlots={timeSlots} setTimeSlots={setTimeSlots} 
        schedule={schedule} setSchedule={setSchedule} 
        subjectHints={subjectHints} setSubjectHints={setSubjectHints} 
        dayTypes={dayTypes} setDayTypes={setDayTypes} 
        timeOffset={timeOffset} setTimeOffset={setTimeOffset} 
        setIsManualEco={setIsManualEco} setIsAutoEcoOverride={setIsAutoEcoOverride} 
        setNow={setNow} is24Hour={is24Hour} setIs24Hour={setIs24Hour} now={now} 
        visibleButtons={visibleButtons} setVisibleButtons={setVisibleButtons}
        systemButtonsConfig={SYSTEM_BUTTONS_CONFIG}
        weatherConfig={weatherConfig}
        setWeatherConfig={setWeatherConfig}
        defaultValues={{
           TIME_SLOTS: STANDARD_TIME_SLOTS,
           SCHEDULE: DEFAULT_SCHEDULE,
           SUBJECT_HINTS: DEFAULT_SUBJECT_HINTS,
           DAY_TYPES: DEFAULT_DAY_TYPES
        }}
      />

      <ToolsMenu 
         isOpen={showTools} onClose={() => setShowTools(false)} 
         onOpenTool={(tool) => toggleTool(tool, true)}
      />

      <TimerWidget isOpen={toolsState.timer} onClose={() => toggleTool('timer', false)} />
      <SoundBoard isOpen={toolsState.sound} onClose={() => toggleTool('sound', false)} />
      <LotteryWidget isOpen={toolsState.lottery} onClose={() => toggleTool('lottery', false)} students={lotteryStudents} attendanceStatus={{}} />

      <BroadcastInputModal 
        isOpen={showBroadcastInput} 
        onClose={() => setShowBroadcastInput(false)} 
        onConfirm={handleBroadcastConfirm}
        customPresets={customPresets} 
        setCustomPresets={setCustomPresets} 
      />
      <MessageInput isOpen={isEditingMessage} onClose={() => setIsEditingMessage(false)} message={teacherMessage} setMessage={setTeacherMessage} />
    </div>
  );
};

export default ClassroomDashboardV2;