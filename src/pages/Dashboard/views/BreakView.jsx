import React from 'react';
import { ArrowRight, BookOpen, Edit3, Moon, Home } from 'lucide-react';
import { UI_THEME } from '../../../utils/constants';
import { CircularProgress, QuietModeView } from '../components/DashboardWidgets';

const BreakView = ({ 
  statusMode, currentSlot, now, is24Hour, 
  progress, secondsRemaining, nextSubjectName, systemHint,
  teacherMessage, setIsEditingMessage, dismissedNap, setDismissedNap 
}) => {
  const isPreBell = statusMode === 'pre-bell';
  const isNap = currentSlot?.name.includes('午休') || currentSlot?.id === 'nap';
  const isDismissal = currentSlot?.name.includes('放學') || currentSlot?.id === 'after';
  const isCleaning = currentSlot && (currentSlot.name.includes('打掃') || currentSlot.id === 'cleaning');
  const isLunch = currentSlot && currentSlot.name.includes('午餐');
  
  // 計算進度條顏色
  const progressColor = (isNap || isDismissal) 
    ? 'text-indigo-400' 
    : (isPreBell ? 'text-red-500' : (progress > 50 ? 'text-emerald-500' : 'text-amber-400'));
  
  const formatCountdown = (secs) => `${Math.floor(secs / 60)}:${secs % 60 < 10 ? '0' : ''}${secs % 60}`;

  // 午休或放學時的靜音模式
  if ((isNap || isDismissal) && !dismissedNap) {
    const title = isNap ? "午休時間" : "放學時間";
    const subtext = isNap ? "Shhh... 請保持安靜，好好休息" : "請收拾書包，準備回家";
    const icon = isNap ? Moon : Home;
    
    return (
        <QuietModeView 
            title={title} 
            subtext={subtext} 
            icon={icon} 
            onClose={() => setDismissedNap(true)} 
            centerContent={
                <div className="flex flex-col items-center">
                    <div className="text-8xl font-mono font-bold text-slate-200 drop-shadow-2xl">
                        {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: !is24Hour })}
                    </div>
                    <div className="mt-8 bg-white/10 backdrop-blur-md px-8 py-4 rounded-full border border-white/10 text-indigo-200">
                        <span className="mr-4">{isNap ? '💤' : '🏠'}</span>
                        {systemHint}
                    </div>
                </div>
            } 
        />
    );
  }

  // 一般下課倒數畫面
  return (
    <div className={`flex-1 relative overflow-hidden transition-colors duration-1000 ${isPreBell ? 'bg-red-50 dark:bg-red-900/20' : UI_THEME.BACKGROUND}`}>
      <div className="h-full flex flex-col relative z-10">
        
        {/* Top Bar */}
        <div className="flex justify-between items-start p-8">
            <div className={`px-6 py-3 rounded-2xl shadow-sm border backdrop-blur-sm ${UI_THEME.SURFACE_GLASS} ${UI_THEME.BORDER_LIGHT}`}>
                <span className={`font-bold mr-2 ${UI_THEME.TEXT_SECONDARY}`}>目前時段</span>
                <span className={`text-2xl font-bold ${UI_THEME.TEXT_PRIMARY}`}>{currentSlot?.name}</span>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-12 px-8 pb-8">
          
          {/* 左側圓環倒數 */}
          <div className={`relative transition-all duration-500 ${isPreBell ? 'scale-110' : ''}`}>
            <CircularProgress progress={progress} size={400} strokeWidth={24} colorClass={progressColor}>
              <div className="text-center flex flex-col items-center">
                  <div className={`absolute -top-24 px-8 py-3 rounded-full shadow-lg border-2 flex items-center gap-4 transform hover:scale-105 transition-transform z-20 ${UI_THEME.SURFACE_GLASS} ${UI_THEME.BORDER_LIGHT}`}>
                    <span className={`text-lg font-bold uppercase tracking-wider ${UI_THEME.TEXT_MUTED}`}>NEXT</span>
                    <div className="flex items-center gap-2 text-4xl font-bold text-indigo-600 dark:text-indigo-400">
                        <ArrowRight size={32} strokeWidth={3} /> {nextSubjectName}
                    </div>
                  </div>
                  <div className={`text-[7rem] font-bold font-mono tracking-tighter leading-none ${isPreBell ? 'text-red-600 animate-pulse' : UI_THEME.TEXT_PRIMARY}`}>
                      {formatCountdown(secondsRemaining)}
                  </div>
                  <div className="text-slate-400 font-medium mt-2 tracking-widest uppercase">{isPreBell ? '預備鐘響' : 'REMAINING'}</div>
              </div>
            </CircularProgress>
          </div>

          {/* 右側資訊與留言板 */}
          <div className="max-w-xl w-full flex flex-col gap-6">
            {teacherMessage ? (
                <div onClick={() => setIsEditingMessage(true)} className="bg-yellow-200 p-6 shadow-lg transform rotate-1 hover:rotate-0 transition-transform cursor-pointer relative group" style={{ fontFamily: 'cursive, sans-serif' }}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-8 bg-yellow-300/50 backdrop-blur-sm rotate-1"></div>
                    <div className="flex justify-between items-start mb-2 opacity-50"><span className="text-xs font-bold uppercase tracking-widest text-yellow-800">MEMO</span><Edit3 size={16} className="text-yellow-700 opacity-0 group-hover:opacity-100 transition-opacity"/></div>
                    <p className={`font-bold text-slate-800 leading-snug break-words whitespace-pre-wrap ${teacherMessage.length > 50 ? 'text-2xl' : 'text-3xl'}`}>{teacherMessage}</p>
                </div>
            ) : (!isPreBell && (
                <button 
                    onClick={() => setIsEditingMessage(true)} 
                    className="group flex items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed transition-all border-slate-300 hover:border-yellow-400 hover:bg-yellow-50 dark:border-slate-600 dark:hover:border-yellow-600 dark:hover:bg-yellow-900/20"
                >
                    <Edit3 className="group-hover:text-yellow-600 text-slate-400 dark:text-slate-500" />
                    <span className="font-bold group-hover:text-yellow-700 text-slate-400 dark:text-slate-500">新增便利貼留言</span>
                </button>
            ))}
            
            <div className={`backdrop-blur-xl p-8 rounded-3xl shadow-xl border transform transition-all duration-500 ${isPreBell ? 'opacity-50 blur-[2px] scale-95' : 'opacity-100 scale-100'} ${UI_THEME.SURFACE_GLASS} ${UI_THEME.BORDER_LIGHT}`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-2xl text-blue-600"><BookOpen size={32} /></div>
                <div className="text-lg text-slate-500 font-bold">{isCleaning ? '打掃提醒' : (isLunch ? '用餐提醒' : '請準備')}</div>
              </div>
              <div className={`text-3xl font-bold leading-normal ${UI_THEME.TEXT_PRIMARY}`}>{systemHint}</div>
            </div>
          </div>
        </div>

        {/* 預備鐘響底部提示 */}
        {isPreBell && (<div className="bg-red-600 text-white p-8 rounded-3xl shadow-2xl border-4 border-red-400 animate-bounce-subtle flex items-center justify-center text-center absolute bottom-12 left-1/2 -translate-x-1/2 z-30"><div><h3 className="text-4xl font-bold mb-2">請回座位</h3><p className="text-xl opacity-90">靜候老師上課</p></div></div>)}
      </div>
    </div>
  );
};

export default BreakView;