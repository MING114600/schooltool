import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, Download, Clock, FlaskConical } from 'lucide-react';
import { UI_THEME } from '../../../../constants';
import SettingsSection from './SettingsSection';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const MaintenanceSettings = ({ 
  onOpenBackup, 
  setTimeOffset,
  setIsManualEco,
  setIsAutoEcoOverride,
  isOpen, 
  onToggle ,
  openDialog,
  handleResetRequest,
  onCloseSettings,
}) => {
	
  const [debugTime, setDebugTime] = useState('');
  const [debugDay, setDebugDay] = useState(''); // '' means current day

const applyTimeChange = () => {
    const nowReal = new Date();
    let targetDate = new Date(nowReal);

    // 1. 設定目標時間
    if (debugTime) {
      const [h, m] = debugTime.split(':').map(Number);
      targetDate.setHours(h, m, 0);
    }

    // 2. 設定目標星期 (計算日期差)
    if (debugDay !== '') {
      const currentDay = nowReal.getDay();
      const targetDay = parseInt(debugDay, 10);
      const dayDiff = targetDay - currentDay;
      targetDate.setDate(nowReal.getDate() + dayDiff);
    }

    // 3. 計算 Offset (目標 - 真實)
    const offset = targetDate.getTime() - nowReal.getTime();
    
    // 4. 套用設定
    setTimeOffset(offset);
    
    // 5. 強制重置省電模式，確保畫面立即更新
    setIsManualEco(false);
    setIsAutoEcoOverride(true);

    openDialog({
      type: 'alert',
      title: '時光機啟動',
      message: `已模擬時間為：週${WEEKDAYS[targetDate.getDay()]} ${targetDate.toLocaleTimeString()}\n即將返回主畫面...`,
	  onConfirm: () => {
          if (onCloseSettings) onCloseSettings(); // 🚀 關閉設定視窗
      }
    });
  };

  const resetTime = () => {
    setTimeOffset(0);
    setDebugTime('');
    setDebugDay('');
    openDialog({
      type: 'alert',
      title: '時間重置',
      message: '系統時間已回歸正常。',
	  onConfirm: () => {
          if (onCloseSettings) onCloseSettings(); // 🚀 關閉設定視窗
      }
    });
  };
return (
    <SettingsSection title="系統維護與測試" icon={AlertTriangle} theme="purple" isOpen={isOpen} onToggle={onToggle}>
      <div className="space-y-6">
        
        {/* --- 新增：時光機 (Debug Mode) --- */}
        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl">
           <h4 className="font-bold mb-3 flex items-center gap-2 text-indigo-700 dark:text-indigo-300">
              <FlaskConical size={18}/> 時光機 (測試用)
           </h4>
           
           <div className="flex gap-3 mb-3">
              {/* 選擇時間 */}
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 mb-1 block">設定時間</label>
                <input 
                  type="time" 
                  value={debugTime}
                  onChange={(e) => setDebugTime(e.target.value)}
                  className={`w-full p-2 rounded-lg font-mono font-bold ${UI_THEME.INPUT_BASE}`}
                />
              </div>

              {/* 選擇星期 */}
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 mb-1 block">設定星期</label>
                <select
                  value={debugDay}
                  onChange={(e) => setDebugDay(e.target.value)}
                  className={`w-full p-2 rounded-lg font-bold ${UI_THEME.INPUT_BASE} cursor-pointer`}
                >
                  <option value="">(維持今天)</option>
                  {WEEKDAYS.map((d, i) => (
                    <option key={i} value={i}>週{d}</option>
                  ))}
                </select>
              </div>
           </div>

           <div className="flex gap-2">
              <button 
                onClick={resetTime}
                className="flex-1 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Clock size={14}/> 重置時間
              </button>
              <button 
                onClick={applyTimeChange}
                className="flex-1 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1"
              >
                <FlaskConical size={14}/> 套用模擬
              </button>
           </div>
        </div>

        <div className="w-full h-px bg-slate-200 dark:bg-slate-700"></div>

        {/* 資料備份區塊 */}
        <div className="p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
           <h4 className="font-bold mb-2 flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Download size={18}/> 資料備份與還原
           </h4>
           <button 
              onClick={onOpenBackup}
              className="w-full py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-lg shadow-sm transition-all"
           >
              開啟備份管理員
           </button>
        </div>


      </div>
    </SettingsSection>
  );
};

export default MaintenanceSettings;