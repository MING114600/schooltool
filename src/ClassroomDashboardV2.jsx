import React, { useState, useMemo , useCallback} from 'react';
import { Megaphone, Users, BookOpen, Eye, Bell, MessageSquare, 
  Star, Heart, AlertTriangle, Info, Zap } from 'lucide-react';

import { UI_THEME, STANDARD_TIME_SLOTS } from './utils/constants';
import { 
  DEFAULT_SCHEDULE, DEFAULT_SUBJECT_HINTS, 
  DEFAULT_DAY_TYPES, SYSTEM_BUTTONS_CONFIG, DEFAULT_CUSTOM_BROADCASTS ,
  DEFAULT_WEATHER_CONFIG
} from './pages/Dashboard/utils/dashboardConstants';
import usePersistentState from './hooks/usePersistentState';
import { useClassroomTimer } from './hooks/useClassroomTimer';
import { useTTS } from './hooks/useTTS';
import { useDashboardEvents } from './hooks/useDashboardEvents';
import { useOS } from './context/OSContext';
import { ClassroomProvider, useClassroomContext } from './context/ClassroomContext';

// --- Components ---
import ErrorBoundary from './components/common/ErrorBoundary';
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

const ICON_MAP = {
  Megaphone, Users, BookOpen, Eye, Bell, MessageSquare, 
  Star, Heart, AlertTriangle, Info, Zap
};

// --- 效能優化包裝 (Memoized Components) ---
// 1. 天氣小工具：只有 weatherConfig 改變時才重繪 (不用每秒重繪)
const MemoizedWeatherWidget = React.memo(WeatherWidget);
// 2. 控制列：只有 statusMode 或 visibleButtons 改變時才重繪
const MemoizedControlDock = React.memo(ControlDock);
// 3. 側邊欄：雖然它需要顯示時間線，但不需要 "每秒" 更新，可以優化
// (注意：如果你側邊欄有紅線要每秒跑，就不適合 Memo，或者要自訂比較邏輯)
const MemoizedTimelineSidebar = React.memo(TimelineSidebar);
// 4. 設定視窗：隱藏時完全不該消耗效能，開啟時也不該受時間影響
const MemoizedSettingsModal = React.memo(SettingsModal);
// 5. 跑馬燈：只有訊息改變時才重繪
const MemoizedMarqueeView = React.memo(MarqueeView);

// --- 主應用組件 ---
const DashboardContent = ({ theme, cycleTheme}) => {
  // --- Persistence States (一行搞定讀取 + 自動存檔) ---
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

  // 天氣設定
  const [weatherConfig, setWeatherConfig] = usePersistentState('weatherConfig', DEFAULT_WEATHER_CONFIG);

  // UI States
  const [teacherMessage, setTeacherMessage] = usePersistentState('teacherMessage', '');
  const [isEditingMessage, setIsEditingMessage] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTools, setShowTools] = useState(false); 
  const [showBroadcastInput, setShowBroadcastInput] = useState(false);
  const [timeOffset, setTimeOffset] = useState(0); 
  const [showSidebar, setShowSidebar] = usePersistentState('showSidebar', true);
  const [isSystemSoundEnabled, setIsSystemSoundEnabled] = usePersistentState('isSystemSoundEnabled', false);
  
  // Logic States
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

	const uiKeyGuard = useMemo(() => ({
	  isEditingMessage,
	  showSettings,
	  showBroadcastInput,
	}), [isEditingMessage, showSettings, showBroadcastInput]);
	
	// 統一的關閉邏輯 (ESC Handler)
	const handleCloseAll = useCallback(() => {
	  setShowSettings(false);
	  setShowTools(false);
	  setShowBroadcastInput(false);
	  setSpecialStatus(null);
	  setIsEditingMessage(false);

	  if (statusMode === 'break' && !dismissedNap) setDismissedNap(true);
	}, [statusMode, dismissedNap]);

	// --- Side Effects Hook (處理語音、全螢幕、快捷鍵) ---
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
			color: preset.color, // ✅ 這裡一定要傳，不然點快捷鍵會變回預設粉紅色
			icon: preset.icon ,   // ✅ 這裡也要傳
			showZhuyin: preset.showZhuyin
		});
	  },  [handleBroadcastConfirm]); // 確保依賴項正確

	const handleBroadcastClick = useCallback(() => setShowBroadcastInput(true), []);
	  
	  const handleToggleSidebar = useCallback(() => {
		setShowSidebar(prev => !prev);
	  }, [setShowSidebar]);

	  const handleToggleSystemSound = useCallback(() => {
		setIsSystemSoundEnabled(prev => !prev);
	  }, [setIsSystemSoundEnabled]);

	  const todayAttendance = useMemo(() => {
		if (!currentClass?.attendanceRecords) return {};
	  const today = new Date().toLocaleDateString('en-CA'); 
		return currentClass.attendanceRecords[today] || {};
	  }, [currentClass?.attendanceRecords]);

	const closeSettings = useCallback(() => setShowSettings(false), []);
	const closeTools = useCallback(() => setShowTools(false), []);
	const closeBroadcastInput = useCallback(() => setShowBroadcastInput(false), []);
	const closeMessageInput = useCallback(() => setIsEditingMessage(false), []);

  // --- Render ---
  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans ${UI_THEME.BACKGROUND} ${UI_THEME.TEXT_PRIMARY} selection:bg-indigo-200 dark:selection:bg-indigo-900`}>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      {/* 天氣小工具 */}
	  {weatherConfig.enabled && statusMode !== 'eco' && statusMode !== 'special' && statusMode !== 'off-hours' && (
		<div className={`absolute top-5 right-8 z-30`}>
            <ErrorBoundary 
              fallback={
                <div className="bg-white/80 backdrop-blur px-3 py-2 rounded-xl text-xs font-bold text-slate-500 border border-slate-200 shadow-sm">
                   天氣資訊無法載入
                </div>
              }
            >
                <MemoizedWeatherWidget weatherConfig={weatherConfig} />
            </ErrorBoundary>
         </div>
      )}

      {/* 側邊欄 */}
      {showSidebar && statusMode !== 'eco' && statusMode !== 'off-hours' && (
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
                
        {/* 各種視圖 */}
        {(statusMode === 'break' || statusMode === 'pre-bell') && (
          <BreakView 
            statusMode={statusMode} currentSlot={currentSlot} now={now} is24Hour={is24Hour}
            progress={progress} secondsRemaining={secondsRemaining}
            nextSubjectName={getNextSubjectName()} systemHint={getSystemHint()}
            teacherMessage={teacherMessage} setIsEditingMessage={setIsEditingMessage}
            dismissedNap={dismissedNap} setDismissedNap={setDismissedNap}
			isGlobalZhuyin={isGlobalZhuyin}
          />
        )}
        
		{statusMode === 'class' && (
            <ClassView 
                schedule={schedule} 
                now={now} 
                currentSlot={currentSlot} 
                isGlobalZhuyin={isGlobalZhuyin} // ✅ 補上這行
            />
        )}
        
        {statusMode === 'eco' && (
          <EcoView 
            now={now} schedule={schedule} currentSlot={currentSlot} is24Hour={is24Hour}
            onWake={() => { setIsManualEco(false); setIsAutoEcoOverride(true); }}
			weatherConfig={weatherConfig}
          />
        )}
        
        {statusMode === 'off-hours' && <OffHoursView now={now} is24Hour={is24Hour} weatherConfig={weatherConfig}/>}
        
        {/* 全螢幕廣播 */}
		{statusMode === 'special' && specialStatus?.mode !== 'marquee' && (
          <SpecialView 
            specialStatus={specialStatus} onClose={() => setSpecialStatus(null)}
            now={now} is24Hour={is24Hour} subjectHints={subjectHints}
            isSystemSoundEnabled={isSystemSoundEnabled}
            isGlobalZhuyin={isGlobalZhuyin} // ✅ 補上這行
          />
        )}

        {/* 控制列 */}
		<MemoizedControlDock 
            statusMode={statusMode} 
            setSpecialStatus={setSpecialStatus} 
            setIsManualEco={setIsManualEco} 
            isFullscreen={isFullscreen} 
            toggleFullScreen={toggleFullScreen} 
            setShowSettings={setShowSettings} 
            isAutoNapActive={isAutoNapActive} 
            onBroadcastClick={handleBroadcastClick} // ✅ 使用穩定的函式
            visibleButtons={visibleButtons} 
            setShowTools={setShowTools}
            theme={theme}
            cycleTheme={cycleTheme}
            showSidebar={showSidebar}
            toggleSidebar={handleToggleSidebar} // ✅ 使用穩定的函式
            isSystemSoundEnabled={isSystemSoundEnabled}
            toggleSystemSound={handleToggleSystemSound} // ✅ 使用穩定的函式
            customPresets={customPresets}
            onCustomBroadcast={onCustomBroadcast} // ✅ 使用穩定的函式
        />
      </div>

      
      {/* 彈出視窗 */}
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
        weatherConfig={weatherConfig}
        setWeatherConfig={setWeatherConfig}
		setCustomPresets={setCustomPresets}
		customPresets={customPresets}
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
            // ✅ 改為傳入完整班級列表與當前 ID
            classes={classes}
            defaultClassId={currentClassId}            
            // ⚠️ 注意：attendanceStatus 目前僅支援 ClassView 裡的即時狀態
            // 如果你在 Dashboard 沒有用 useClassroom 來管理出席，這裡可以先傳空物件 {}
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

export default DashboardContent