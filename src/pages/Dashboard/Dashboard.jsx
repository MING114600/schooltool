import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Megaphone, Users, BookOpen, Eye, Bell, MessageSquare, 
  Star, Heart, AlertTriangle, Info, Zap } from 'lucide-react';

// --- Utils & Constants ---
import { UI_THEME, STANDARD_TIME_SLOTS } from '../../utils/constants';
import { 
  DEFAULT_SCHEDULE, DEFAULT_SUBJECT_HINTS, 
  DEFAULT_DAY_TYPES, SYSTEM_BUTTONS_CONFIG, DEFAULT_CUSTOM_BROADCASTS ,
  DEFAULT_WEATHER_CONFIG
} from './utils/dashboardConstants';

import usePersistentState from '../../hooks/usePersistentState';
import { useClassroomTimer } from '../../hooks/useClassroomTimer';
import { useTTS } from '../../hooks/useTTS';
import { useDashboardEvents } from '../../hooks/useDashboardEvents';
import { useOS } from '../../context/OSContext';
import { useClassroomContext } from '../../context/ClassroomContext';

// --- Components (Common) ---
import ErrorBoundary from '../../components/common/ErrorBoundary';

// --- Components (Dashboard Local) ---
import SettingsModal from './modals/SettingsModal';
import TimelineSidebar from './components/TimelineSidebar';
import ControlDock from './components/ControlDock';
import ToolsMenu from './modals/ToolsMenu';
import BroadcastInputModal from './modals/BroadcastInputModal';
import MessageInput from './modals/MessageInput';

// --- Views ---
import ClassView from './views/ClassView';
import BreakView from './views/BreakView';
import EcoView from './views/EcoView';
// import OffHoursView from './views/OffHoursView'; // 已移除，由 EcoView 接管
import SpecialView from './views/SpecialView';
import MarqueeView from './views/MarqueeView';

// --- Widgets ---
import TimerWidget from '../../components/common/widgets/TimerWidget';
import LotteryWidget from '../../components/common/widgets/LotteryWidget';
import SoundBoard from '../../components/common/widgets/SoundBoard';
import WeatherWidget from './components/WeatherWidget';

const ICON_MAP = {
  Megaphone, Users, BookOpen, Eye, Bell, MessageSquare, 
  Star, Heart, AlertTriangle, Info, Zap
};

// --- Memoized Components ---
const MemoizedWeatherWidget = React.memo(WeatherWidget);
const MemoizedControlDock = React.memo(ControlDock);
const MemoizedTimelineSidebar = React.memo(TimelineSidebar);
const MemoizedSettingsModal = React.memo(SettingsModal);
const MemoizedMarqueeView = React.memo(MarqueeView);

// --- 主應用組件 ---
const Dashboard = ({ theme, cycleTheme}) => {
  // --- Persistence States ---
  const { isGlobalZhuyin } = useOS();
  const { classes, currentClassId, currentClass } = useClassroomContext();
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
  const [weatherConfig, setWeatherConfig] = usePersistentState('weatherConfig', DEFAULT_WEATHER_CONFIG);

  // --- UI States ---
  const [teacherMessage, setTeacherMessage] = usePersistentState('teacherMessage', '');
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTools, setShowTools] = useState(false); 
  const [showBroadcastInput, setShowBroadcastInput] = useState(false);
  const [timeOffset, setTimeOffset] = useState(0); 
  const [showSidebar, setShowSidebar] = usePersistentState('showSidebar', true);
  const [isSystemSoundEnabled, setIsSystemSoundEnabled] = usePersistentState('isSystemSoundEnabled', false);
  
  // --- Logic States ---
  const [specialStatus, setSpecialStatus] = useState(null);
  const [isManualEco, setIsManualEco] = useState(false); 
  const [isAutoEcoOverride, setIsAutoEcoOverride] = useState(false);
  const [dismissedNap, setDismissedNap] = useState(false);
  
  // Widget States
  const [toolsState, setToolsState] = useState({ timer: false, lottery: false, sound: false });
  
  const { 
    now, statusMode, currentSlot, nextSlot, progress, secondsRemaining, activeTimeSlots 
  } = useClassroomTimer({
    timeSlots,
    dayTypes,
    specialStatus,
    isManualEco,
    isAutoEcoOverride,
    timeOffset
  });

  // --- View Logic: Determine Active View ---
  // 判斷是否為放學時間 (statusMode 為 off-hours 或 slot 為 after)
  const isOffHours = useMemo(() => {
    return statusMode === 'off-hours' || currentSlot?.id === 'after';
  }, [statusMode, currentSlot]);

  // 決定目前顯示哪個 View
  // 優先級: 手動省電 > 放學自動省電 > 一般狀態
  const activeView = useMemo(() => {
      if (isManualEco) return 'eco-manual';
      if (isOffHours) return 'eco-auto';
      return statusMode; // 'class', 'break', 'pre-bell', 'special'
  }, [isManualEco, isOffHours, statusMode]);

  // EcoView 背景點擊處理 (退出邏輯)
  const handleEcoBackgroundClick = useCallback(() => {
      // 只有手動進入的省電模式，點擊背景才允許退出
      if (activeView === 'eco-manual') {
          setIsManualEco(false);
      }
      // eco-auto (放學) 點擊背景不執行退出，只會觸發 EcoView 內部的 UI 喚醒
  }, [activeView]);

  const uiKeyGuard = useMemo(() => ({
    isEditingMessage,
    showSettings,
    showBroadcastInput,
  }), [isEditingMessage, showSettings, showBroadcastInput]);
  
  // 統一關閉邏輯
  const handleCloseAll = useCallback(() => {
    setShowSettings(false);
    setShowTools(false);
    setShowBroadcastInput(false);
    setSpecialStatus(null);
    setIsEditingMessage(false);
    if (statusMode === 'break' && !dismissedNap) setDismissedNap(true);
  }, [statusMode, dismissedNap]);

  const tts = useTTS();
  const { isFullscreen, toggleFullScreen } = useDashboardEvents({
    specialStatus,
    isSystemSoundEnabled,
    uiState: uiKeyGuard,
    onCloseUI: handleCloseAll,
    tts
  });

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
  
  const handleBroadcastConfirm = useCallback((title, sub, options) => {
    const IconComponent = options.icon && typeof options.icon === 'string' 
      ? (ICON_MAP[options.icon] || Megaphone) 
      : Megaphone;

    setSpecialStatus({ 
      message: title, 
      sub: sub, 
      color: options.color || 'from-pink-500 to-rose-500', 
      type: 'input', 
      id: Date.now(), 
      icon: IconComponent, 
      mode: options.mode,
      showZhuyin: options.showZhuyin,
      enableTTS: options.enableTTS ?? true,
    });
  }, []);

  const onCustomBroadcast = useCallback((preset) => {
    handleBroadcastConfirm(preset.title, preset.sub, { 
      mode: preset.mode, 
      enableTTS: preset.enableTTS,
      color: preset.color, 
      icon: preset.icon , 
      showZhuyin: preset.showZhuyin
    });
  }, [handleBroadcastConfirm]);

  const handleBroadcastClick = useCallback(() => setShowBroadcastInput(true), []);
  const handleToggleSidebar = useCallback(() => setShowSidebar(prev => !prev), []);
  const handleToggleSystemSound = useCallback(() => setIsSystemSoundEnabled(prev => !prev), []);

  const todayAttendance = useMemo(() => {
    if (!currentClass?.attendanceRecords) return {};
    const today = new Date().toLocaleDateString('en-CA'); 
    return currentClass.attendanceRecords[today] || {};
  }, [currentClass?.attendanceRecords]);

  const closeSettings = useCallback(() => setShowSettings(false), []);
  const closeTools = useCallback(() => setShowTools(false), []);
  const closeBroadcastInput = useCallback(() => setShowBroadcastInput(false), []);
  const closeMessageInput = useCallback(() => setIsEditingMessage(false), []);
  
  const prevStatusModeRef = useRef(statusMode);
  useEffect(() => {
    if (prevStatusModeRef.current !== 'class' && statusMode === 'class') {
      if (specialStatus?.mode === 'marquee') {
        setSpecialStatus(null);
        tts.cancel();
      }
    }
    prevStatusModeRef.current = statusMode;
  }, [statusMode, specialStatus, tts]);

  // 渲染 Dock 的共用函數 (減少重複代碼)
  const renderDock = (isGhost = false) => (
    <MemoizedControlDock 
      statusMode={statusMode} 
      setSpecialStatus={setSpecialStatus} 
      setIsManualEco={setIsManualEco} 
      isFullscreen={isFullscreen} 
      toggleFullScreen={toggleFullScreen} 
      setShowSettings={setShowSettings} 
      isAutoNapActive={isAutoNapActive} 
      onBroadcastClick={handleBroadcastClick}
      visibleButtons={visibleButtons} 
      setShowTools={setShowTools}
      theme={theme}
      cycleTheme={cycleTheme}
      showSidebar={showSidebar}
      toggleSidebar={handleToggleSidebar}
      isSystemSoundEnabled={isSystemSoundEnabled}
      toggleSystemSound={handleToggleSystemSound}
      customPresets={customPresets}
      onCustomBroadcast={onCustomBroadcast}
      // 新增：Ghost Mode 參數
      ghostMode={isGhost}
      onToggleEco={() => setIsManualEco(false)} // 傳入退出函數
    />
  );

  return (
    <div className={`flex w-full h-full overflow-hidden font-sans ${UI_THEME.BACKGROUND} ${UI_THEME.TEXT_PRIMARY} selection:bg-indigo-200 dark:selection:bg-indigo-900`}>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      {/* 天氣小工具 (非 Eco/Off-hours/Special 模式下顯示) */}
      {weatherConfig.enabled && !activeView.startsWith('eco') && activeView !== 'special' && (
        <div className={`absolute top-5 right-8 z-30`}>
            <ErrorBoundary fallback={<div className="text-xs text-slate-500">Weather Error</div>}>
                <MemoizedWeatherWidget weatherConfig={weatherConfig} />
            </ErrorBoundary>
         </div>
      )}

      {/* 側邊欄 (非 Eco/Off-hours 模式下顯示) */}
      {showSidebar && !activeView.startsWith('eco') && (
        <ErrorBoundary>
            <MemoizedTimelineSidebar 
              now={now} schedule={schedule} activeTimeSlots={activeTimeSlots}
              currentSlot={currentSlot} nextSlot={nextSlot} 
              is24Hour={is24Hour} dayTypes={dayTypes} 
              isGlobalZhuyin={isGlobalZhuyin}
            />
        </ErrorBoundary>
      )}

      {/* 右側主內容區塊 */}
      <div className="flex-1 flex flex-col relative transition-all duration-500">
        
        {/* 跑馬燈廣播 */}
        {specialStatus?.mode === 'marquee' && (
           <ErrorBoundary>
               <MemoizedMarqueeView 
                  message={specialStatus.message} 
                  sub={specialStatus.sub} 
                  color={specialStatus.color}
                  isGlobalZhuyin={isGlobalZhuyin}
                  showZhuyin={specialStatus.showZhuyin}
                  onClose={() => {
                      setSpecialStatus(null);
                       tts.cancel();
                  }}
               />
           </ErrorBoundary>
        )}
                
        {/* --- Views 切換 --- */}

        {/* 1. 下課/預備鐘 */}
        {(activeView === 'break' || activeView === 'pre-bell') && (
          <BreakView 
            statusMode={statusMode} currentSlot={currentSlot} now={now} is24Hour={is24Hour}
            progress={progress} secondsRemaining={secondsRemaining}
            nextSubjectName={getNextSubjectName()} systemHint={getSystemHint()}
            teacherMessage={teacherMessage} setIsEditingMessage={setIsEditingMessage}
            dismissedNap={dismissedNap} setDismissedNap={setDismissedNap}
            isGlobalZhuyin={isGlobalZhuyin}
          />
        )}
        
        {/* 2. 上課 */}
        {activeView === 'class' && (
            <ClassView 
                schedule={schedule} 
                now={now} 
                currentSlot={currentSlot} 
                isGlobalZhuyin={isGlobalZhuyin}
            />
        )}
        
        {/* 3. Eco / 放學 (整合) */}
        {(activeView === 'eco-manual' || activeView === 'eco-auto') && (
          <EcoView 
            now={now} schedule={schedule} currentSlot={currentSlot} is24Hour={is24Hour}
            // 點擊背景的行為：手動模式退出，自動模式不動作(僅喚醒UI)
            onBackgroundClick={handleEcoBackgroundClick}
            // 點擊UI喚醒回調 (通常是為了確保從睡眠回來重置狀態)
            onWake={() => { if(activeView === 'eco-manual') setIsAutoEcoOverride(true); }}
            weatherConfig={weatherConfig}
            // 傳入幽靈模式的 Dock
            controlDock={renderDock(true)}
          />
        )}
        
        {/* 4. 全螢幕廣播 */}
        {activeView === 'special' && specialStatus?.mode !== 'marquee' && (
          <SpecialView 
            specialStatus={specialStatus} onClose={() => setSpecialStatus(null)}
            now={now} is24Hour={is24Hour} subjectHints={subjectHints}
            isSystemSoundEnabled={isSystemSoundEnabled}
            isGlobalZhuyin={isGlobalZhuyin}
          />
        )}

        {/* 一般模式下的 ControlDock (懸浮於底部) */}
        {!activeView.startsWith('eco') && activeView !== 'special' && renderDock(false)}

      </div>

      
      {/* --- Modals & Overlays --- */}
      <MemoizedSettingsModal 
        isOpen={showSettings} onClose={closeSettings} 
        timeSlots={timeSlots} setTimeSlots={setTimeSlots} 
        schedule={schedule} setSchedule={setSchedule} 
        subjectHints={subjectHints} setSubjectHints={setSubjectHints} 
        dayTypes={dayTypes} setDayTypes={setDayTypes} 
        timeOffset={timeOffset} setTimeOffset={setTimeOffset} 
        setIsManualEco={setIsManualEco} setIsAutoEcoOverride={setIsAutoEcoOverride} 
        is24Hour={is24Hour} setIs24Hour={setIs24Hour} 
        visibleButtons={visibleButtons} setVisibleButtons={setVisibleButtons}
        systemButtonsConfig={SYSTEM_BUTTONS_CONFIG}
        weatherConfig={weatherConfig} setWeatherConfig={setWeatherConfig}
        setCustomPresets={setCustomPresets} customPresets={customPresets}
        now={showSettings ? now : null}
        defaultValues={{
           TIME_SLOTS: STANDARD_TIME_SLOTS,
           SCHEDULE: DEFAULT_SCHEDULE,
           SUBJECT_HINTS: DEFAULT_SUBJECT_HINTS,
           DAY_TYPES: DEFAULT_DAY_TYPES
        }}
      />

      <ToolsMenu 
         isOpen={showTools} onClose={closeTools} 
         onOpenTool={(tool) => toggleTool(tool, true)}
      />

      <ErrorBoundary>
          <TimerWidget isOpen={toolsState.timer} onClose={() => toggleTool('timer', false)} />
      </ErrorBoundary>
      
      <ErrorBoundary>
          <SoundBoard isOpen={toolsState.sound} onClose={() => toggleTool('sound', false)} />
      </ErrorBoundary>
      
      <ErrorBoundary>
        <LotteryWidget 
            isOpen={toolsState.lottery} 
            onClose={() => toggleTool('lottery', false)} 
            classes={classes}
            defaultClassId={currentClassId}            
            attendanceStatus={todayAttendance} 
          />
      </ErrorBoundary>

      <BroadcastInputModal 
        isOpen={showBroadcastInput} 
        onClose={closeBroadcastInput} 
        onConfirm={handleBroadcastConfirm}
        customPresets={customPresets} 
        setCustomPresets={setCustomPresets} 
      />
      <MessageInput isOpen={isEditingMessage} onClose={closeMessageInput} message={teacherMessage} setMessage={setTeacherMessage} />
    </div>
  );
};

export default Dashboard;