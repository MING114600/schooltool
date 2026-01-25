import React from 'react';
import { X, Volume2 } from 'lucide-react';
import StarryBackground from '../components/StarryBackground';

const SpecialView = ({ specialStatus, onClose, now, is24Hour, subjectHints, isSystemSoundEnabled }) => {
  if (!specialStatus) return null;
  const Icon = specialStatus.icon;

  const isStarryMode = ['nap', 'morning_reading', 'quiet'].includes(specialStatus.id);

  return (
    // 1. 修改：在最外層加入 onClick={onClose}，讓點擊背景任何地方都能關閉
    <div 
        className="fixed inset-0 z-50 flex items-center justify-center animate-in fade-in duration-500 cursor-pointer" 
        onClick={onClose}
    >
        
        {/* 背景層判斷 */}
        {isStarryMode ? (
            <div className="absolute inset-0 bg-slate-950">
                <StarryBackground />
            </div>
        ) : (
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md">
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-gradient-to-r ${specialStatus.color || 'from-blue-600 to-indigo-600'} rounded-full blur-[100px] opacity-20 pointer-events-none`}></div>
            </div>
        )}

        {/* 2. 修改：卡片層加入 stopPropagation，防止點擊卡片時意外關閉 (維持卡片操作的穩定性) */}
        <div 
            className={`relative max-w-5xl w-full mx-4 rounded-[3rem] shadow-2xl overflow-hidden border border-white/10 ${isStarryMode ? 'bg-black/20 backdrop-blur-sm' : 'bg-black/40 backdrop-blur-xl'} cursor-auto`}
            onClick={(e) => e.stopPropagation()}
        >
            
            <div className={`h-4 w-full bg-gradient-to-r ${specialStatus.color || 'from-blue-500 to-indigo-500'}`}></div>
            
            <div className="flex flex-col items-center justify-center text-center p-16 md:p-24 relative">
                {/* 關閉按鈕 */}
                <button 
                    onClick={onClose} 
                    className="absolute top-8 right-8 p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-white/5 z-20"
                >
                    <X size={28} />
                </button>

                {/* 音效提示 */}
                {isSystemSoundEnabled && (
                    <div className="absolute top-8 left-8 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-white/50 flex items-center gap-2 text-sm font-bold">
                        <Volume2 size={16} /> 語音播報中
                    </div>
                )}

                {/* 主圖示 */}
                {Icon && (
                    <div className={`mb-10 p-8 rounded-full bg-gradient-to-br ${specialStatus.color || 'from-blue-500 to-indigo-500'} shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-bounce-slow`}>
                        <Icon size={80} className="text-white drop-shadow-md" />
                    </div>
                )}

                <h1 className="text-[6rem] font-black mb-6 leading-none text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-300 drop-shadow-sm tracking-tight">
                    {specialStatus.message}
                </h1>
                <h2 className="text-3xl md:text-4xl font-bold text-indigo-100/90 leading-relaxed max-w-3xl">
                    {specialStatus.sub}
                </h2>
                
                {!specialStatus.sub && subjectHints && (
                     <div className="mt-8 text-xl text-slate-400 font-medium border border-white/10 px-6 py-2 rounded-full">
                        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24Hour })}
                     </div>
                )}
            </div>
        </div>
        
        {/* 底部提示文字 (現在點擊背景真的有效了) */}
        <div className="absolute bottom-8 text-white/20 text-sm font-bold tracking-widest uppercase hover:text-white/40 transition-colors z-20">
            Click background to close
        </div>
    </div>
  );
};

export default SpecialView;