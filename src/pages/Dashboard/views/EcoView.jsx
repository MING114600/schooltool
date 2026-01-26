import React from 'react';
import { Moon, BatteryCharging,MousePointer2 } from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';
import StarryBackground from '../components/StarryBackground'; // 1. 引入
import WeatherWidget from '../components/WeatherWidget';

const EcoView = ({ now, is24Hour, onWake, weatherConfig }) => {
  return (
    <div 
      onClick={onWake}
      className="h-full w-full flex flex-col items-center justify-center bg-slate-950 cursor-pointer relative overflow-hidden group select-none"
    >
	<div className="absolute inset-0 z-0">
		<StarryBackground />
	</div>

      {/* 喚醒提示 */}
      <div className="absolute bottom-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center gap-2 text-slate-400 font-bold bg-slate-900/50 px-4 py-2 rounded-full border border-slate-700">
        <MousePointer2 size={16} className="animate-bounce" />
        點擊畫面喚醒系統
      </div>

      {/* 主內容 */}
      <div className="z-10 flex flex-col items-center gap-6 animate-pulse-slow text-center">
        {/* 月亮圖示 */}
        <div className="p-8 rounded-full bg-indigo-950/30 border border-indigo-500/20 shadow-[0_0_50px_rgba(79,70,229,0.2)]">
            <Moon size={80} className="text-indigo-300 drop-shadow-[0_0_15px_rgba(165,180,252,0.5)]" />
        </div>

        {/* 時間與天氣顯示區 */}
        <div className="flex flex-col gap-2 items-center">
            <div className="text-[8rem] font-black leading-none text-slate-200 tracking-tighter drop-shadow-xl font-mono">
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24Hour })}
            </div>
            
            <div className="text-xl font-bold text-slate-500 uppercase tracking-[0.2em] mb-4">
                Power Saving Mode
            </div>

            {/* ✅ 天氣小工具 (強制深色模式 + 放大) */}
            {weatherConfig?.enabled && (
               <div className="dark mt-4 transform scale-125 origin-top opacity-90 hover:opacity-100 transition-opacity"> 
                  <WeatherWidget weatherConfig={weatherConfig} />
               </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default EcoView;