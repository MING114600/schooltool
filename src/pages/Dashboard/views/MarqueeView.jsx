import React from 'react';
import { X, Megaphone } from 'lucide-react';

const MarqueeView = ({ message, sub, onClose, color }) => {
  return (
    // 修改這裡：
    // 1. 移除 'absolute top-0 left-0 right-0'
    // 2. 加入 'relative w-full shrink-0' (確保它佔據空間且不會被壓縮)
    <div className={`relative w-full shrink-0 z-[60] h-16 shadow-xl flex items-center overflow-hidden bg-gradient-to-r ${color || 'from-blue-600 to-indigo-700'} text-white`}>
      
      {/* 左側圖示區 (固定不動) */}
      <div className="flex items-center gap-2 px-4 h-full bg-black/20 z-20 shrink-0 backdrop-blur-sm border-r border-white/10">
        <Megaphone className="animate-pulse" size={24} />
        <span className="font-bold text-sm tracking-widest uppercase hidden md:block">Broadcast</span>
      </div>

      {/* 跑馬燈動畫區 */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center">
        <div className="whitespace-nowrap animate-marquee flex items-center gap-8 font-bold text-2xl">
           {/* 重複渲染以確保無縫銜接 */}
           <span>{message} {sub && ` - ${sub}`}</span>
           <span className="opacity-50 mx-4">|</span>
           <span>{message} {sub && ` - ${sub}`}</span>
           <span className="opacity-50 mx-4">|</span>
           <span>{message} {sub && ` - ${sub}`}</span>
           <span className="opacity-50 mx-4">|</span>
           <span>{message} {sub && ` - ${sub}`}</span>
        </div>
      </div>

      {/* 右側關閉按鈕 */}
      <div className="z-20 px-2 h-full flex items-center bg-black/20 backdrop-blur-sm border-l border-white/10">
        <button 
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="關閉廣播"
        >
            <X size={20} />
        </button>
      </div>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default MarqueeView;