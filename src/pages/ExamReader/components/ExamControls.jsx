import React from 'react';
import { Play, Square, SkipBack, SkipForward, Volume2, Pause } from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';

const ExamControls = ({
  speechRate, setSpeechRate,
  ttsState, // ✅ 接收新的狀態 ('stopped' | 'playing' | 'paused')
  onPlay, onPause, onStop, onNext, onPrev,
  currentIndex, totalItems
}) => {
  return (
    <footer className={`h-28 border-t ${UI_THEME.BORDER_DEFAULT} ${UI_THEME.SURFACE_GLASS} flex items-center justify-between px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-10`}>
      
      {/* 語速控制：加入 ml-12 往右推，避開左下角 OS Launcher 按鈕 */}
      <div className="flex items-center gap-4 w-1/4 ml-12">
        <Volume2 className={UI_THEME.TEXT_SECONDARY} size={28} />
        <div className={`flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl`}>
          {[0.5, 0.85, 1.0].map(rate => (
            <button
              key={rate}
              onClick={() => setSpeechRate(rate)}
              className={`
                px-4 py-2 rounded-lg font-bold text-lg transition-all
                ${speechRate === rate 
                  ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm' 
                  : UI_THEME.TEXT_SECONDARY + ' hover:bg-white/50 dark:hover:bg-slate-700'}
              `}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>

{/* 播放控制器 */}
      <div className="flex items-center gap-6">
        <button 
          onClick={onPrev} disabled={currentIndex === 0}
          className={`p-3 rounded-full transition-all ${currentIndex === 0 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 active:scale-95'}`}
        >
          <SkipBack size={24} />
        </button>

        {/* ✅ 動態切換播放與暫停按鈕 */}
        {ttsState === 'playing' ? (
          <button 
            onClick={onPause} 
            className="w-16 h-16 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg transition-all active:scale-95 hover:shadow-amber-500/30"
          >
            <Pause size={32} />
          </button>
        ) : (
          <button 
            onClick={onPlay} 
            className="w-16 h-16 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all active:scale-95 hover:shadow-blue-500/30 ml-1"
          >
            <Play size={32} className="ml-2" />
          </button>
        )}

        <button 
          onClick={onStop} 
          disabled={ttsState === 'stopped'} // ✅ 停止狀態下禁用停止按鈕
          className={`w-14 h-14 flex items-center justify-center rounded-full transition-all ${ttsState === 'stopped' ? 'text-slate-300 dark:text-slate-600 bg-slate-100 dark:bg-slate-800' : 'bg-rose-100 text-rose-500 hover:bg-rose-200 dark:bg-rose-900/30 dark:hover:bg-rose-900/50 active:scale-95'}`}
        >
          <Square size={24} fill="currentColor" />
        </button>

        <button 
          onClick={onNext} disabled={currentIndex === totalItems - 1}
          className={`p-3 rounded-full transition-all ${currentIndex === totalItems - 1 ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700 active:scale-95'}`}
        >
          <SkipForward size={24} />
        </button>
      </div>

      {/* 進度顯示：加入 mr-12 往左推，避免 OS Launcher 切換至右側時遮擋 */}
      <div className={`w-1/4 text-right font-bold text-xl mr-12 ${UI_THEME.TEXT_SECONDARY}`}>
        進度 {totalItems > 0 ? currentIndex + 1 : 0} / {totalItems}
      </div>
    </footer>
  );
};

export default ExamControls;