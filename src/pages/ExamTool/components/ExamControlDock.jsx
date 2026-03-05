import React from 'react';
import {
  Maximize, Minimize, Volume2, VolumeX, Plus, Mic, Settings,
  Moon, Sun, Coffee, Laptop, Timer, StopCircle, MessageSquare, MessageSquareOff
} from 'lucide-react';
import { useThemeContext } from '../../../context/ThemeContext';
import { UI_THEME } from '../../../constants';

/**
 * Control Dock - 懸浮中控台
 */
const ControlDock = ({
  onOpenSettings,
  onExtend,
  isMuted,
  toggleMute,
  onQuickExam,      // ★ 新增：開啟臨時考試彈窗
  onStopQuickExam,  // ★ 新增：停止臨時考試
  isQuickExam,       // ★ 新增：目前狀態  
  isTickerActive,   // ★ 新增：目前狀態
  onToggleTicker    // ★ 新增：切換函式

}) => {

  const { theme, cycleTheme } = useThemeContext();
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  const getThemeIcon = () => {
    if (theme === 'system') return <Laptop size={20} />;
    if (theme === 'light') return <Sun size={20} />;
    return <Moon size={20} />;
  };

  const getThemeLabel = () => {
    if (theme === 'system') return '系統設定';
    if (theme === 'light') return '淺色模式';
    return '深色模式';
  };


  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const groupClass = "flex items-center gap-1 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md rounded-2xl p-1.5 border border-white/20 shadow-lg shadow-slate-200/20 dark:shadow-black/20";

  return (
    <div className="w-full flex justify-center pb-6 pt-2 z-10 flex items-center gap-4 animate-in slide-in-from-bottom-10 fade-in duration-500 opacity-90 hover:opacity-100 transition-all">

      {/* Group 1: Display */}
      <div className={groupClass}>
        <button
          onClick={cycleTheme}
          className={`p-2 rounded-xl transition-all shrink-0 ${UI_THEME.BTN_HOVER}`}
          title={`切換主題 (目前：${getThemeLabel()})`}
        >
          {getThemeIcon()}
        </button>
        <button onClick={toggleFullscreen} className={UI_THEME.BTN_HOVER} title="全螢幕">
          {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
        </button>
      </div>

      {/* Group 2: Exam Ops (Primary) */}
      {/* ★★★ 新增/修改：臨時考試按鈕 ★★★ */}

      <div className={`${groupClass} ${UI_THEME.BTN_HOVER} scale-110 mx-2 bg-white/60 dark:bg-slate-800/60 border-blue-200/30`}>
        {isQuickExam ? (
          // 如果正在臨時考試，顯示停止按鈕
          <button onClick={onStopQuickExam} className="p-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30 transition-all active:scale-95 mx-1" title="結束測驗">
            <StopCircle size={24} strokeWidth={3} />
          </button>
        ) : (
          // 平常顯示「臨時測驗」按鈕
          <button onClick={onQuickExam} className="p-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition-all active:scale-95 mx-1" title="臨時測驗">
            <Plus size={24} strokeWidth={3} />
          </button>
        )}
        <button onClick={onExtend} className="p-4 rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 transition-all active:scale-95 mx-1 {UI_THEME.BTN_HOVER}" title="延長時間">
          <Timer size={24} strokeWidth={3} />
        </button>
        <button onClick={toggleMute} className={UI_THEME.BTN_HOVER} title={isMuted ? "解除靜音" : "靜音"}>
          {isMuted ? <VolumeX size={24} className="text-red-500" /> : <Volume2 size={24} />}
        </button>
      </div>

      {/* Group 3: Admin */}
      <div className={groupClass}>
        {/* ★★★ 新增：公告開關按鈕 ★★★ */}
        <button
          onClick={onToggleTicker}
          className={UI_THEME.BTN_HOVER}
          title={isTickerActive ? "隱藏文字公告" : "顯示文字公告"}
        >
          {isTickerActive ? (
            <MessageSquare size={24} className="text-emerald-500" />
          ) : (
            <MessageSquareOff size={24} className="text-slate-400 opacity-50" />
          )}
        </button>
        <button onClick={onOpenSettings} className={UI_THEME.BTN_HOVER} title="設定">
          <Settings size={20} />
        </button>
      </div>

    </div>
  );
};

export default ControlDock;