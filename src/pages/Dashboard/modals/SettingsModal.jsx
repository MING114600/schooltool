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
  { id: 'general', label: '系統一般', icon: Settings },
  { id: 'timeslots', label: '時段與節次', icon: Clock },
  { id: 'schedule', label: '課表排定', icon: Calendar },
  { id: 'hints', label: '科目提示語', icon: MessageSquare },
  { id: 'buttons', label: '底部快捷列', icon: LayoutGrid },
  { id: 'broadcast', label: '自訂廣播', icon: Radio },
  { id: 'weather', label: '天氣模組', icon: CloudRain },
  { id: 'maintenance', label: '系統維護', icon: Wrench },
];

const SettingsModal = ({
  isOpen, onClose,
  timeOffset, setTimeOffset,
  setIsManualEco, setIsAutoEcoOverride,
  now
}) => {
  const { openModal, openDialog: globalOpenDialog } = useModalContext();
  const settings = useDashboardSettings();
  const [activeTab, setActiveTab] = useState('general');

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
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* 2. 內層視窗：阻止冒泡，避免點擊內容時關閉視窗 */}
      <div
        className={`${UI_THEME.SURFACE_GLASS} w-full max-w-5xl h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border ${UI_THEME.BORDER_LIGHT}`}
        onClick={stopPropagation}
      >

        {/* Header */}
        <div className={`flex items-center justify-between p-5 border-b ${UI_THEME.BORDER_LIGHT} bg-white dark:bg-slate-900`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <Sliders className="text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
            <div>
              <h2 className={`text-xl font-black ${UI_THEME.TEXT_PRIMARY}`}>系統儀表板設定</h2>
              <p className={`text-xs ${UI_THEME.TEXT_MUTED}`}>自訂您的教室顯示資訊與自動化規則</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content (Split-Pane) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar Menu */}
          <div className={`w-64 flex-shrink-0 border-r ${UI_THEME.BORDER_LIGHT} bg-slate-50/50 dark:bg-black/20 overflow-y-auto p-4 space-y-2 custom-scrollbar`}>
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 font-bold' : `text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 ${UI_THEME.TEXT_MUTED}`}`}
                >
                  <Icon size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Right Content */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 custom-scrollbar bg-slate-50/50 dark:bg-black/20">
            {activeTab === 'general' && (
              <GeneralSettings
                is24Hour={settings.is24Hour} setIs24Hour={settings.setIs24Hour}
                dayTypes={settings.dayTypes} setDayTypes={settings.setDayTypes}
                timeOffset={timeOffset} setTimeOffset={setTimeOffset}
                isOpen={true} onToggle={() => { }}
              />
            )}

            {activeTab === 'timeslots' && (
              <TimeSlotSettings
                timeSlots={settings.timeSlots} setTimeSlots={settings.setTimeSlots}
                schedule={settings.schedule} setSchedule={settings.setSchedule}
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
        <div className={`p-4 border-t ${UI_THEME.BORDER_LIGHT} bg-white dark:bg-slate-900 flex justify-end`}>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold shadow-lg transition-all active:scale-95"
          >
            完成設定
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;