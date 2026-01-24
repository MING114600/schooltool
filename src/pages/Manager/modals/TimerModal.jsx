import React, { useState, useEffect, useRef } from 'react';
import { Timer, X, Play, Pause, RotateCcw, Maximize2, Minimize2 } from 'lucide-react';
import { useAudio } from '../../../hooks/useAudio'; // 確保路徑正確

const TimerModal = ({ isOpen, onClose }) => {
  const { playAudio } = useAudio();
  const [mode, setMode] = useState('timer'); 
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(0);
  const [customMinutes, setCustomMinutes] = useState('');
  const [isFocusMode, setIsFocusMode] = useState(false); 
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (mode === 'timer') {
            if (prev <= 6 && prev > 1) { playAudio('tick'); }
            if (prev <= 1) { clearInterval(intervalRef.current); setIsActive(false); playAudio('alarm'); return 0; }
            return prev - 1;
          } else { return prev + 1; }
        });
      }, 1000);
    } else { clearInterval(intervalRef.current); }
    return () => clearInterval(intervalRef.current);
  }, [isActive, mode, playAudio]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60); const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const handleSetTimer = (minutes) => { const seconds = Math.round(minutes * 60); setTimeLeft(seconds); setInitialTime(seconds); setIsActive(false); setMode('timer'); };
  const handleCustomSet = () => { const mins = parseFloat(customMinutes); if (!isNaN(mins) && mins > 0) { handleSetTimer(mins); setCustomMinutes(''); } };
  const handleReset = () => { setIsActive(false); setTimeLeft(mode === 'timer' ? initialTime : 0); };
  const toggleTimer = () => { if (timeLeft === 0 && mode === 'timer') return; setIsActive(!isActive); };

  if (!isOpen) return null;

  const containerClass = isFocusMode 
    ? "fixed inset-0 z-[200] bg-slate-900 flex items-center justify-center animate-in fade-in duration-300"
    : "fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200";

  const cardClass = isFocusMode
    ? "w-full h-full flex flex-col items-center justify-center"
    : "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 flex flex-col border border-slate-200 dark:border-slate-700";

  const timeTextClass = isFocusMode
    ? "font-mono font-black text-[25vw] leading-none text-white transition-colors drop-shadow-2xl mb-12"
    : `font-mono font-black text-7xl tracking-wider transition-colors ${isActive ? (mode==='timer' && timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-slate-800 dark:text-white') : 'text-slate-400 dark:text-slate-600'}`;

  const headerClass = isFocusMode
    ? "absolute top-6 right-6 flex gap-4 z-50"
    : "p-4 bg-slate-800 dark:bg-slate-950 border-b border-slate-700 flex justify-between items-center text-white";

  return (
    <div className={containerClass}>
      <div className={cardClass}>
        
        {/* Header */}
        <div className={headerClass}>
          {!isFocusMode && (
            <h3 className="font-bold text-lg flex items-center gap-2"><Timer size={20} className="text-emerald-400"/> 課堂計時器</h3>
          )}
          
          <div className="flex gap-2">
            <button 
                onClick={() => setIsFocusMode(!isFocusMode)} 
                className={`p-1 rounded-full transition-colors ${isFocusMode ? 'text-white/50 hover:text-white hover:bg-white/10 p-2' : 'hover:bg-slate-700 text-slate-300'}`}
                title={isFocusMode ? "退出專注模式" : "進入專注模式"}
            >
                {isFocusMode ? <Minimize2 size={32}/> : <Maximize2 size={18}/>}
            </button>
            <button onClick={onClose} className={`p-1 rounded-full transition-colors ${isFocusMode ? 'text-white/50 hover:text-white hover:bg-white/10 p-2' : 'hover:bg-slate-700 text-slate-300'}`}>
                <X size={isFocusMode ? 32 : 18}/>
            </button>
          </div>
        </div>

        {/* Tabs */}
        {!isFocusMode && (
            <div className="flex p-2 gap-2 bg-slate-100 dark:bg-slate-800">
            <button 
                onClick={() => { setMode('timer'); setIsActive(false); setTimeLeft(initialTime); }}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'timer' ? 'bg-white dark:bg-slate-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
            >
                倒數計時
            </button>
            <button 
                onClick={() => { setMode('stopwatch'); setIsActive(false); setTimeLeft(0); }}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'stopwatch' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
            >
                碼表
            </button>
            </div>
        )}

        {/* Display */}
        <div className={`flex flex-col items-center justify-center ${isFocusMode ? 'w-full' : 'p-8 bg-slate-50 dark:bg-slate-900 min-h-[180px]'}`}>
          <div className={timeTextClass}>
            {formatTime(timeLeft)}
          </div>
          
          <div className="flex gap-6 mt-6">
            <button 
              onClick={toggleTimer}
              className={`rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 ${isFocusMode ? 'w-24 h-24 text-white bg-opacity-90 hover:bg-opacity-100' : 'w-16 h-16 text-white'} ${isActive ? 'bg-amber-500' : 'bg-emerald-500'}`}
            >
              {isActive ? <Pause size={isFocusMode ? 48 : 32} fill="currentColor"/> : <Play size={isFocusMode ? 48 : 32} fill="currentColor" className="ml-1"/>}
            </button>
            <button 
              onClick={handleReset}
              className={`rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 ${isFocusMode ? 'w-24 h-24 bg-white/10 text-white hover:bg-white/20' : 'w-16 h-16 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}`}
            >
              <RotateCcw size={isFocusMode ? 40 : 28}/>
            </button>
          </div>
        </div>

        {/* Controls */}
        {!isFocusMode && mode === 'timer' && (
          <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
            <div className="text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider">快速設定</div>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[1, 3, 5, 10].map(m => (
                <button 
                  key={m} 
                  onClick={() => handleSetTimer(m)}
                  className="py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-500 transition-all"
                >
                  {m}分
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="number" 
                placeholder="自訂分鐘 (可小數)" 
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                className="flex-1 p-2 border rounded-lg text-sm outline-none focus:border-emerald-500 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                step="0.1"
                min="0.1"
              />
              <button 
                onClick={handleCustomSet}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 font-bold rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 text-sm"
              >
                設定
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimerModal;