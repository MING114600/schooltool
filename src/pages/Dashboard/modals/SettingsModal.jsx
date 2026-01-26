import React, { useState , useCallback} from 'react';
import { X, Sliders } from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';

// --- Components ---
import GlobalBackupModal from '../../../components/common/GlobalBackupModal';
import DialogModal from '../../../components/common/DialogModal';

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

const SettingsModal = ({ 
  isOpen, onClose, 
  // State Setters
  timeSlots, setTimeSlots, 
  schedule, setSchedule, 
  subjectHints, setSubjectHints, 
  dayTypes, setDayTypes, 
  timeOffset, setTimeOffset, 
  setIsManualEco, setIsAutoEcoOverride, 
  is24Hour, setIs24Hour, 
  now, 
  visibleButtons, setVisibleButtons,
  systemButtonsConfig,
  weatherConfig, setWeatherConfig,
  customPresets, setCustomPresets,
  defaultValues
}) => {
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  
  // Dialog 狀態管理
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    type: 'alert',
    title: '',
    message: '',
    onConfirm: null
  });

  // 控制各個區塊的展開/收合
  const [expandedSections, setExpandedSections] = useState({
    general: true,
    weather: false,
    timeslots: false,
    schedule: false,
    hints: false,
    buttons: false,
    broadcast: false,
    maintenance: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // 開啟 Dialog 的通用函式
  const openDialog = ({ type, title, message, onConfirm }) => {
    setDialogConfig({
      isOpen: true,
      type,
      title,
      message,
      onConfirm
    });
  };

  const closeDialog = () => {
    setDialogConfig(prev => ({ ...prev, isOpen: false }));
  };

	const closeSelf = useCallback(() => {
	  onClose?.();
	}, [onClose]);

	const openBackup = useCallback(() => {
	  setIsBackupOpen(true);
	}, []);

	const closeBackup = useCallback(() => {
	  setIsBackupOpen(false);
	}, []);

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
      <GlobalBackupModal isOpen={isBackupOpen} onClose={closeBackup} />
      
      {/* Dialog 組件 */}
      <DialogModal 
        isOpen={dialogConfig.isOpen}
        onClose={closeDialog}
        type={dialogConfig.type}
        title={dialogConfig.title}
        message={dialogConfig.message}
        onConfirm={(val) => {
            if (dialogConfig.onConfirm) dialogConfig.onConfirm(val);
            if (dialogConfig.type !== 'prompt') closeDialog();
        }}
      />

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

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/50 dark:bg-black/20">
          
          <GeneralSettings 
             is24Hour={is24Hour} setIs24Hour={setIs24Hour}
             dayTypes={dayTypes} setDayTypes={setDayTypes}
             timeOffset={timeOffset} setTimeOffset={setTimeOffset}
             isOpen={expandedSections.general} onToggle={() => toggleSection('general')}
          />

          <TimeSlotSettings 
             timeSlots={timeSlots} setTimeSlots={setTimeSlots}
             schedule={schedule} setSchedule={setSchedule}
             isOpen={expandedSections.timeslots} onToggle={() => toggleSection('timeslots')}
          />

          <ScheduleEditor 
             schedule={schedule} setSchedule={setSchedule}
             timeSlots={timeSlots} subjectHints={subjectHints}
             isOpen={expandedSections.schedule} onToggle={() => toggleSection('schedule')}
          />

          <SubjectHintSettings 
             subjectHints={subjectHints} setSubjectHints={setSubjectHints}
             schedule={schedule} setSchedule={setSchedule}
             isOpen={expandedSections.hints} onToggle={() => toggleSection('hints')}
          />

          <ButtonSettings 
             visibleButtons={visibleButtons} setVisibleButtons={setVisibleButtons}
             systemButtonsConfig={systemButtonsConfig}
             isOpen={expandedSections.buttons} onToggle={() => toggleSection('buttons')}
          />         

          <BroadcastSettings 
             customPresets={customPresets} setCustomPresets={setCustomPresets}
             isOpen={expandedSections.broadcast} onToggle={() => toggleSection('broadcast')}
          />

          <WeatherSettings 
             weatherConfig={weatherConfig} setWeatherConfig={setWeatherConfig}
             isOpen={expandedSections.weather} onToggle={() => toggleSection('weather')}
          />

          <MaintenanceSettings 
             // 傳遞時光機需要的參數
             setTimeOffset={setTimeOffset}
             setIsManualEco={setIsManualEco}
             setIsAutoEcoOverride={setIsAutoEcoOverride}          
             onOpenBackup={() => setIsBackupOpen(true)}
             openDialog={openDialog}
             isOpen={expandedSections.maintenance} 
             onToggle={() => toggleSection('maintenance')}
			 onCloseSettings={onClose}
          />

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