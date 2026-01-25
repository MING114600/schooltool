import React from 'react';
import { Moon, BatteryCharging } from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';
import StarryBackground from '../components/StarryBackground'; // 1. 引入

const EcoView = ({ now, schedule, currentSlot, is24Hour, onWake }) => {
  return (
    // 2. 移除原本的 bg-slate-900，改為 relative 以便放置星空
    <div 
      className="flex-1 flex flex-col items-center justify-center text-center relative overflow-hidden bg-slate-950 cursor-pointer group select-none"
      onClick={onWake}
    >
      {/* 3. 放入星空背景 */}
      <StarryBackground />

      <div className="z-10 flex flex-col items-center gap-6 animate-pulse-slow">
        {/* 月亮圖示 */}
        <div className="p-8 rounded-full bg-indigo-950/30 border border-indigo-500/20 shadow-[0_0_50px_rgba(79,70,229,0.2)]">
            <Moon size={80} className="text-indigo-300 drop-shadow-[0_0_15px_rgba(165,180,252,0.5)]" />
        </div>

        {/* 時間顯示 */}
        <div className="flex flex-col gap-2">
            <div className="text-[8rem] font-black leading-none text-slate-200 tracking-tighter drop-shadow-xl font-mono">
                {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24Hour })}
            </div>
            <div className="text-xl font-bold text-slate-500 uppercase tracking-[0.2em]">
                Power Saving Mode
            </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="absolute bottom-12 text-slate-600 text-sm font-bold animate-bounce flex items-center gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
         <BatteryCharging size={16} /> 點擊畫面喚醒系統
      </div>
    </div>
  );
};

export default EcoView;