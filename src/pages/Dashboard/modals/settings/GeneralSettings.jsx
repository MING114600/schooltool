import React from 'react';
import { Settings, RefreshCw, Check } from 'lucide-react';
import { UI_THEME } from '../../../../constants';
import SettingsSection from './SettingsSection';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const GeneralSettings = ({ 
  is24Hour, 
  setIs24Hour, 
  timeOffset, 
  setTimeOffset, 
  isOpen, 
  onToggle,
  dayTypes,
  setDayTypes
}) => {
  return (
    <SettingsSection 
      title="一般顯示設定" 
      icon={Settings} 
      theme="gray" 
      isOpen={isOpen} 
      onToggle={onToggle}
    >
             <div className="flex flex-col gap-6">
               <div className="flex items-center gap-4">
                  <span className={`font-bold w-24 ${UI_THEME.TEXT_SECONDARY}`}>時間格式：</span>
                  <div className={`flex rounded-lg p-1 ${UI_THEME.BACKGROUND}`}>
                     <button onClick={() => setIs24Hour(false)} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${!is24Hour ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-blue-400' : `${UI_THEME.TEXT_MUTED} hover:text-slate-600`}`}>12H</button>
                     <button onClick={() => setIs24Hour(true)} className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${is24Hour ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-blue-400' : `${UI_THEME.TEXT_MUTED} hover:text-slate-600`}`}>24H</button>
                  </div>
               </div>
             <span className={`font-bold w-24 ${UI_THEME.TEXT_SECONDARY}`}>全天半天：</span>
			 <div className="grid grid-cols-5 gap-4">
			                 {[1,2,3,4,5].map(day => (
                  <div key={day} className={`flex flex-col items-center gap-3 p-4 rounded-xl border ${UI_THEME.SURFACE_CARD} ${UI_THEME.BORDER_DEFAULT}`}>
                    <span className={`text-sm font-bold ${UI_THEME.TEXT_SECONDARY}`}>週{WEEKDAYS[day]}</span>
                    <div className="flex flex-col gap-2 w-full">
                        <button
                            onClick={() => setDayTypes(prev => ({...prev, [day]: 'full'}))}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm flex items-center justify-center gap-1 ${
                                dayTypes[day] === 'full' 
                                ? 'bg-blue-500 text-white border-blue-600 shadow-blue-200' 
                                : `bg-transparent ${UI_THEME.TEXT_MUTED} border-transparent hover:bg-slate-100 dark:hover:bg-slate-800`
                            }`}
                        >
                            全天
                        </button>
                        <button
                            onClick={() => setDayTypes(prev => ({...prev, [day]: 'half'}))}
                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm flex items-center justify-center gap-1 ${
                                dayTypes[day] === 'half' 
                                ? 'bg-amber-500 text-white border-amber-600 shadow-amber-200' 
                                : `bg-transparent ${UI_THEME.TEXT_MUTED} border-transparent hover:bg-slate-100 dark:hover:bg-slate-800`
                            }`}
                        >
                            半天
                        </button>
                    </div>
                  </div>
                ))}
             </div>
			 </div>
    </SettingsSection>
  );
};

export default GeneralSettings;