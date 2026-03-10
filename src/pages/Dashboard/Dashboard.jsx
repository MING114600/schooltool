import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Megaphone, Users, BookOpen, Eye, Bell, MessageSquare,
  Star, Heart, AlertTriangle, Info, Zap
} from 'lucide-react';

// --- Utils & Constants ---
import { UI_THEME, STANDARD_TIME_SLOTS } from '../../constants';
import {
  DEFAULT_SCHEDULE, DEFAULT_SUBJECT_HINTS,
  DEFAULT_DAY_TYPES, SYSTEM_BUTTONS_CONFIG, DEFAULT_CUSTOM_BROADCASTS,
  DEFAULT_WEATHER_CONFIG
} from './utils/dashboardConstants';

import usePersistentState from '../../hooks/usePersistentState';
import { useClassroomTimer } from '../../pages/Dashboard/hooks/useClassroomTimer';
import { useTTS } from '../../hooks/useTTS';
import { useDashboardEvents } from '../../pages/Dashboard/hooks/useDashboardEvents';
import { useOS } from '../../context/OSContext';
import { useClassroomStore } from '../../store/useClassroomStore';
import { DashboardSettingsProvider, useDashboardSettings } from './context/DashboardSettingsContext';

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
import DashboardWidgetsLayer from './components/DashboardWidgetsLayer';

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
const DashboardInner = ({ theme, cycleTheme }) => {
  // --- Context States ---
  const {
    timeSlots, setTimeSlots,
    schedule, setSchedule,
    subjectHints, setSubjectHints,
    is24Hour, setIs24Hour,
    dayTypes, setDayTypes,
    customPresets, setCustomPresets,
    visibleButtons, setVisibleButtons,
    weatherConfig, setWeatherConfig
  } = useDashboardSettings();

  // --- Persistence States ---
  const { isGlobalZhuyin } = useOS();
  const classes = useClassroomStore(state => state.classes);
  const currentClassId = useClassroomStore(state => state.currentClassId);
  const currentClass = classes.find(c => c.id === currentClassId);

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
  const [isContactBookOpen, setIsContactBookOpen] = useState(false);

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

  // 1. 修正 activeView 判斷邏輯：確保 'eco' 狀態有被歸類
  const activeView = useMemo(() => {
    // (A) 手動省電：最高優先級
    if (isManualEco) return 'eco-manual';

    // (B) 放學待機：次高優先級 (透過 OffHoursView 合併進來的邏輯)
    if (isOffHours) return 'eco-auto';

    // (C) 上課自動省電 (修正點：接住 statusMode === 'eco')
    // 當 useClassroomTimer 數到時間到，會把 statusMode 設為 'eco'
    // 我們將其視為 'eco-auto' 來渲染
    if (statusMode === 'eco') return 'eco-auto';

    // (D) 一般狀態 (class, break, pre-bell, special)
    return statusMode;
  }, [isManualEco, isOffHours, statusMode]);


  // 2. 修正喚醒邏輯：區分三種 Eco 的喚醒行為
  const handleEcoWake = useCallback(() => {
    // 情境 A: 手動省電 -> 退出手動模式
    if (activeView === 'eco-manual') {
      setIsManualEco(false);
      return;
    }

    // 情境 B: 放學待機 -> 不退出 (只在 EcoView 內部喚醒 UI)
    if (isOffHours) {
      return;
    }

    // 情境 C: 上課自動省電 (statusMode === 'eco') -> 設定 Override 防止馬上又睡著
    // 如果不是手動也不是放學，那一定是上課自動省電
    setIsAutoEcoOverride(true);

  }, [activeView, isOffHours, setIsManualEco, setIsAutoEcoOverride]);

  const tts = useTTS();
  // 3. 修正 TTS 殘留：在關閉廣播或特殊狀態時強制 Cancel
  const handleCloseAll = useCallback(() => {
    setShowSettings(false);
    setShowTools(false);
    setShowBroadcastInput(false);
    setSpecialStatus(null);
    tts.cancel(); // ★ 修正：確保語音停止
    setIsEditingMessage(false);
    if (statusMode === 'break' && !dismissedNap) setDismissedNap(true);
  }, [statusMode, dismissedNap, tts]);

  const uiKeyGuard = useMemo(() => ({
    isEditingMessage,
    showSettings,
    showBroadcastInput,
  }), [isEditingMessage, showSettings, showBroadcastInput]);


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
      icon: preset.icon,
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
  // 處理狀態變更事件 (如廣播取消、聯絡簿彈窗)
  useEffect(() => {
    // 進入上課模式時關閉跑馬燈
    if (prevStatusModeRef.current !== 'class' && statusMode === 'class') {
      if (specialStatus?.mode === 'marquee') {
        setSpecialStatus(null);
        tts.cancel();
      }
      setIsContactBookOpen(false); // 上課自動關閉聯絡簿
    }

    // 剛下課時自動彈出聯絡簿
    if (prevStatusModeRef.current === 'class' && statusMode === 'break') {
      const today = new Date().toISOString().split('T')[0];
      const dontShow = localStorage.getItem(`cb_dont_show_${today}`);
      const autoRemindEnabled = localStorage.getItem('cb_auto_remind_enabled') !== 'false';

      if (dontShow !== 'true' && autoRemindEnabled) {
        setIsContactBookOpen(true);
      }
    }

    // 預備鈴響時自動關閉聯絡簿
    if (prevStatusModeRef.current === 'break' && statusMode === 'pre-bell') {
      setIsContactBookOpen(false);
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
      // 聯絡簿控制
      onOpenContactBook={() => setIsContactBookOpen(true)}
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
            now={now}
            schedule={schedule}
            currentSlot={currentSlot}
            is24Hour={is24Hour}

            // ★ 修正：傳入新的統一喚醒處理函數
            onWake={handleEcoWake}

            weatherConfig={weatherConfig}
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
        timeOffset={timeOffset} setTimeOffset={setTimeOffset}
        setIsManualEco={setIsManualEco} setIsAutoEcoOverride={setIsAutoEcoOverride}
        now={showSettings ? now : null}
      />

      <ToolsMenu
        isOpen={showTools} onClose={closeTools}
        onOpenTool={(tool) => toggleTool(tool, true)}
      />

      {/* 小工具與浮動視窗層 */}
      <DashboardWidgetsLayer
        toolsState={toolsState}
        toggleTool={toggleTool}
        classes={classes}
        currentClassId={currentClassId}
        todayAttendance={todayAttendance}
        isContactBookOpen={isContactBookOpen}
        setIsContactBookOpen={setIsContactBookOpen}
        isGlobalZhuyin={isGlobalZhuyin}
        statusMode={statusMode}
      />

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

const Dashboard = (props) => (
  <DashboardSettingsProvider>
    <DashboardInner {...props} />
  </DashboardSettingsProvider>
);

export default Dashboard;