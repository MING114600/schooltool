import React from 'react';
import { Star, X } from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';

// 圓形進度條
export const CircularProgress = ({ progress, size = 300, strokeWidth = 15, children, colorClass }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle className="text-slate-200/30" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
        <circle className={`transition-all duration-1000 ease-linear ${colorClass}`} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx={size / 2} cy={size / 2} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center flex-col">{children}</div>
    </div>
  );
};

// 安靜模式/特殊訊息全螢幕視圖
export const QuietModeView = ({ title, subtext, icon: IconComponent, centerContent, onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse pointer-events-none"></div>
      <Star className="absolute top-10 right-20 text-yellow-100 opacity-40 w-4 h-4 animate-ping pointer-events-none" />
      <Star className="absolute bottom-10 left-20 text-yellow-100 opacity-30 w-6 h-6 animate-pulse pointer-events-none" />
      <Star className="absolute top-1/3 left-10 text-blue-200 opacity-20 w-3 h-3 animate-pulse delay-700 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center p-8 w-full h-full">
         <div className="mb-12 flex flex-col items-center">
            {IconComponent && <IconComponent size={80} className="text-indigo-200 mb-6 drop-shadow-[0_0_15px_rgba(199,210,254,0.5)]" />}
            <h2 className="text-6xl font-bold text-indigo-100 tracking-wider mb-4">{title}</h2>
            {subtext && <p className="text-2xl text-indigo-300 font-light">{subtext}</p>}
         </div>
         {centerContent}
         {onClose && (
           <button onClick={onClose} className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-50 group" title="回到主畫面 (Esc)">
             <X size={32} className="group-hover:scale-110 transition-transform"/>
           </button>
         )}
      </div>
    </div>
  );
};