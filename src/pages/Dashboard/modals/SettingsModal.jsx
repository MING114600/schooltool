import React, { useState, useCallback } from 'react';
import { X, Sliders } from 'lucide-react';
import { UI_THEME } from '../../../constants';

// --- Components ---
import { useModalContext } from '../../../context/ModalContext';

// --- Sub-Settings ---
import SettingsSection from './settings/SettingsSection';
import GeneralSettings from './settings/GeneralSettings';
import WeatherSettings from './settings/WeatherSettings';
import TimeSlotSettings from './settings/TimeSlotSettings';
import ScheduleEditor from './settings/ScheduleEditor';
import SubjectHintSettings from './settings/SubjectHintSettings';
import ButtonSettings from './settings/ButtonSettings';
import BroadcastSettings from './settings/BroadcastSettings';
import MaintenanceSettings from './settings/MaintenanceSettings';

import { useDashboardSettings } from '../context/DashboardSettingsContext';
import { SYSTEM_BUTTONS_CONFIG } from '../utils/dashboardConstants';
import { Settings, CloudRain, Clock, Calendar, MessageSquare, LayoutGrid, Radio, Wrench } from 'lucide-react';

const TABS = [
  { id: 'timeslots', label: '時間與作息管理', icon: Clock },
  { id: 'hints', label: '科目與提醒', icon: MessageSquare },
  { id: 'schedule', label: '功課表管理', icon: Calendar },
  { id: 'broadcast', label: '自訂廣播管理', icon: Radio },
  { id: 'buttons', label: '預設廣播管理', icon: LayoutGrid },
  { id: 'weather', label: '天氣模組', icon: CloudRain },
  { id: 'maintenance', label: '系統維護管理', icon: Wrench },
];

const SettingsModal = ({
  isOpen, onClose,
  timeOffset, setTimeOffset,
  setIsManualEco, setIsAutoEcoOverride,
  now
}) => {
  const { openModal, openDialog: globalOpenDialog } = useModalContext();
  const settings = useDashboardSettings();
  const [activeTab, setActiveTab] = useState('timeslots');

  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // 開啟 Dialog 的通用函式
  const openDialog = ({ type, title, message, onConfirm }) => {
    globalOpenDialog({
      type,
      title,
      message,
      onConfirm
    });
  };

  const closeSelf = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const openBackup = useCallback(() => {
    openModal('global_backup');
  }, [openModal]);

  const onOverlayClick = useCallback(() => {
    closeSelf();
  }, [closeSelf]);

  const stopPropagation = useCallback((e) => {
    e.stopPropagation();
  }, []);

  if (!isOpen) return null;

  return (
    // 1. 外層背景：點擊關閉
    <div
      className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* 2. 內層視窗：阻止冒泡，避免點擊內容時關閉視窗 */}
      <div
        className={`bg-white/90 dark:bg-zinc-900/90 backdrop-blur-2xl w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/40 dark:ring-white/5 transition-all animate-in zoom-in-[0.98] duration-300`}
        onClick={stopPropagation}
      >

        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b border-stone-100/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50`}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/90 dark:bg-indigo-500/80 rounded-2xl shadow-sm text-white">
              <Sliders size={24} />
            </div>
            <div>
              <h2 className={`text-xl font-black text-zinc-800 dark:text-zinc-100`}>系統儀表板設定</h2>
              <p className={`text-xs text-zinc-500 dark:text-zinc-400 mt-0.5`}>自訂您的教室顯示資訊與自動化規則</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 mr-2 rounded-full hover:bg-stone-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors duration-300 outline-none"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content (Split-Pane) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar Menu */}
          <div className={`w-64 flex-shrink-0 border-r border-stone-100/50 dark:border-zinc-800/50 bg-stone-50/30 dark:bg-zinc-950/20 overflow-y-auto p-4 space-y-2 custom-scrollbar`}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 outline-none ${isActive ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 font-bold shadow-sm ring-1 ring-stone-100 dark:ring-zinc-700/50' : `text-zinc-500 dark:text-zinc-500 hover:bg-stone-100/50 dark:hover:bg-zinc-800/50 hover:text-zinc-800 dark:hover:text-zinc-300`}`}
                >
                  <Icon size={20} className={isActive ? 'text-indigo-500 dark:text-indigo-400' : 'text-zinc-400 dark:text-zinc-500'} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 md:px-10 space-y-8 custom-scrollbar bg-stone-50/50 dark:bg-zinc-950/40">
            {activeTab === 'timeslots' && (
              <TimeSlotSettings
                timeSlots={settings.timeSlots} setTimeSlots={settings.setTimeSlots}
                schedule={settings.schedule} setSchedule={settings.setSchedule}
                is24Hour={settings.is24Hour} setIs24Hour={settings.setIs24Hour}
                dayTypes={settings.dayTypes} setDayTypes={settings.setDayTypes}
                timeOffset={timeOffset} setTimeOffset={setTimeOffset}
                isOpen={true} onToggle={() => { }}
              />
            )}

            {activeTab === 'schedule' && (
              <ScheduleEditor
                schedule={settings.schedule} setSchedule={settings.setSchedule}
                timeSlots={settings.timeSlots} subjectHints={settings.subjectHints}
                isOpen={true} onToggle={() => { }}
              />
            )}

            {activeTab === 'hints' && (
              <SubjectHintSettings
                subjectHints={settings.subjectHints} setSubjectHints={settings.setSubjectHints}
                schedule={settings.schedule} setSchedule={settings.setSchedule}
                isOpen={true} onToggle={() => { }}
              />
            )}

            {activeTab === 'buttons' && (
              <ButtonSettings
                visibleButtons={settings.visibleButtons} setVisibleButtons={settings.setVisibleButtons}
                systemButtonsConfig={SYSTEM_BUTTONS_CONFIG}
                isOpen={true} onToggle={() => { }}
              />
            )}

            {activeTab === 'broadcast' && (
              <BroadcastSettings
                customPresets={settings.customPresets} setCustomPresets={settings.setCustomPresets}
                isOpen={true} onToggle={() => { }}
              />
            )}

            {activeTab === 'weather' && (
              <WeatherSettings
                weatherConfig={settings.weatherConfig} setWeatherConfig={settings.setWeatherConfig}
                isOpen={true} onToggle={() => { }}
              />
            )}

            {activeTab === 'maintenance' && (
              <MaintenanceSettings
                setTimeOffset={setTimeOffset}
                setIsManualEco={setIsManualEco}
                setIsAutoEcoOverride={setIsAutoEcoOverride}
                onOpenBackup={() => setIsBackupOpen(true)}
                openDialog={openDialog}
                isOpen={true}
                onToggle={() => { }}
                onCloseSettings={onClose}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-5 px-8 border-t border-stone-100/50 dark:border-zinc-800/50 bg-white/50 dark:bg-zinc-900/50 flex justify-end`}>
          <button
            onClick={onClose}
            className="px-8 py-3 bg-zinc-800 dark:bg-zinc-200 hover:bg-zinc-700 dark:hover:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold shadow-sm active:scale-[0.98] transition-all duration-300 outline-none"
          >
            完成設定
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;