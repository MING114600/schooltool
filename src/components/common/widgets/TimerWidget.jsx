import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Save, Maximize2, Minimize2, Bell, BellOff } from 'lucide-react';
import { useAudio } from '../../../hooks/useAudio';
import DraggableWidget from './DraggableWidget';

const TimerWidget = ({ isOpen, onClose }) => {
  const { playAudio } = useAudio();
  const [mode, setMode] = useState('timer'); 
  const [timeLeft, setTimeLeft] = useState(0); 
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(0);
  
  const [inputMin, setInputMin] = useState('');
  const [inputSec, setInputSec] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  
  const intervalRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const autoStopTimeoutRef = useRef(null); // 新增：用於自動停止的 ref

  // 1. 計時核心邏輯 (維持不變)
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (mode === 'timer') {
            if (prev <= 6 && prev > 1) { playAudio('tick'); }
            if (prev <= 1) { 
                clearInterval(intervalRef.current); 
                setIsActive(false); 
                handleTimeUp(); 
                return 0; 
            }
            return prev - 1;
          } else { 
            return prev + 1; 
          }
        });
      }, 1000);
    } else { 
      clearInterval(intervalRef.current); 
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, mode, playAudio]);

  // 2. 響鈴邏輯 (修改：加入 5 秒自動關閉)
  useEffect(() => {
    if (isRinging) {
       // A. 立即播一次
       playAudio('alarm');
       
       // B. 啟動循環播放 (每 1.2 秒響一次)
       ringIntervalRef.current = setInterval(() => {
           playAudio('alarm');
       }, 1200);

       // C. 設定 5 秒後自動停止
       autoStopTimeoutRef.current = setTimeout(() => {
           setIsRinging(false);
       }, 5000);

    } else {
       // 停止時清除所有計時器
       if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
       if (autoStopTimeoutRef.current) clearTimeout(autoStopTimeoutRef.current);
    }

    return () => {
        if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
        if (autoStopTimeoutRef.current) clearTimeout(autoStopTimeoutRef.current);
    };
  }, [isRinging, playAudio]);

  const handleTimeUp = () => {
      setIsRinging(true);
      // setIsFullScreen(true); // 如果希望時間到自動全螢幕，可取消註解
  };

  const stopRinging = () => {
      setIsRinging(false); // 手動關閉會觸發 useEffect 的 cleanup，自動清除 timeout
  };

  // ... (其餘程式碼與之前相同，不需要更動)
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60); 
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetTimer = (minutes) => { 
      const seconds = Math.round(minutes * 60); 
      setTimeLeft(seconds); 
      setInitialTime(seconds); 
      setIsActive(false); 
      setIsRinging(false);
      setMode('timer'); 
      setInputMin(''); setInputSec('');
  };

  const handleCustomSet = () => {
      const m = parseInt(inputMin) || 0;
      const s = parseInt(inputSec) || 0;
      if (m === 0 && s === 0) return;
      const totalSeconds = (m * 60) + s;
      setTimeLeft(totalSeconds);
      setInitialTime(totalSeconds);
      setIsActive(false);
      setIsRinging(false);
      setMode('timer');
  };
  
  const toggleTimer = () => { 
      if (isRinging) { stopRinging(); return; } 
      if (timeLeft === 0 && mode === 'timer') return; 
      setIsActive(!isActive); 
  };

  const handleReset = () => { 
      setIsActive(false); 
      setIsRinging(false);
      setTimeLeft(mode === 'timer' ? initialTime : 0); 
  };

  const renderContent = (isFull = false) => (
      <div className={`flex flex-col items-center justify-center ${isFull ? 'h-full w-full' : 'gap-4'}`}>
        
        <div 
            className={`
                relative group cursor-pointer tabular-nums leading-none tracking-tight font-black font-mono select-none transition-all
                ${isFull ? 'text-[25vw] text-white drop-shadow-2xl' : 'text-6xl text-slate-800 dark:text-white'}
                ${isRinging ? 'animate-bounce text-red-100' : ''}
            `}
            onClick={() => {
                if(!isActive && !isRinging) {
                    if(mode === 'timer') { setMode('stopwatch'); setTimeLeft(0); }
                    else { setMode('timer'); setTimeLeft(initialTime); }
                }
            }}
        >
            {formatTime(timeLeft)}
            
            {isRinging && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-600 animate-ping opacity-75">
                    <Bell size={isFull ? 300 : 100} fill="currentColor"/>
                </div>
            )}
        </div>

        <div className={`flex items-center gap-6 ${isFull ? 'scale-150 mt-12' : 'mt-2'}`}>
           <button 
             onClick={toggleTimer}
             className={`
                rounded-full flex items-center justify-center text-white shadow-lg transition-all active:scale-95 
                ${isFull ? 'w-24 h-24 shadow-2xl' : 'w-14 h-14 hover:scale-105'}
                ${isRinging ? 'bg-red-500 animate-pulse' : (isActive ? 'bg-amber-500' : 'bg-emerald-500')}
             `}
           >
             {isRinging ? <BellOff size={isFull?40:24}/> : (isActive ? <Pause size={isFull?40:24} fill="currentColor"/> : <Play size={isFull?40:24} fill="currentColor" className="ml-1"/>)}
           </button>
           
           <button 
             onClick={handleReset}
             className={`
                rounded-full flex items-center justify-center transition-all active:scale-95
                ${isFull ? 'w-24 h-24 bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm' : 'w-14 h-14 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}
             `}
           >
             <RotateCcw size={isFull?36:22}/>
           </button>
        </div>
      </div>
  );

  if (isFullScreen) {
      return (
        <div className={`
            fixed inset-0 z-[200] flex flex-col items-center justify-center transition-colors duration-500
            ${isRinging ? 'bg-red-600' : 'bg-slate-900'}
        `}>
            <div className="absolute top-6 right-6 flex gap-4 z-50">
                <button 
                    onClick={() => setIsFullScreen(false)}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"
                    title="縮小視窗"
                >
                    <Minimize2 size={32}/>
                </button>
                <button 
                    onClick={onClose}
                    className="p-3 bg-white/10 hover:bg-red-500/80 rounded-full text-white backdrop-blur-md transition-all"
                    title="關閉"
                >
                    <Save size={32} className="rotate-45"/> 
                </button>
            </div>
            {renderContent(true)}
        </div>
      );
  }

  return (
    <DraggableWidget 
      title="課堂計時" 
      isOpen={isOpen} 
      onClose={onClose} 
      icon={Timer}
      initialPosition={{ x: 320, y: 150 }}
      width="w-72"
    >
      <div className="flex flex-col items-center gap-4 relative">
        <button 
            onClick={() => setIsFullScreen(true)}
            className="absolute -top-2 -right-2 p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="全螢幕顯示"
        >
            <Maximize2 size={16}/>
        </button>

        {renderContent(false)}

        {mode === 'timer' && (
            <div className="w-full space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/50">
                <div className="grid grid-cols-4 gap-2">
                    {[1, 3, 5, 10].map(m => (
                    <button 
                        key={m} onClick={() => handleSetTimer(m)}
                        className="py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 transition-colors"
                    >
                        {m}分
                    </button>
                    ))}
                </div>

                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-1 flex-1">
                        <input 
                            type="number" placeholder="00" value={inputMin}
                            onChange={(e) => setInputMin(e.target.value)}
                            className="w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md py-1 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
                        />
                        <span className="text-xs font-bold text-slate-400">分</span>
                        <input 
                            type="number" placeholder="00" value={inputSec}
                            onChange={(e) => setInputSec(e.target.value)}
                            className="w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md py-1 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500"
                        />
                        <span className="text-xs font-bold text-slate-400">秒</span>
                    </div>
                    <button onClick={handleCustomSet} className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm">
                        <Save size={16}/>
                    </button>
                </div>
            </div>
        )}
      </div>
    </DraggableWidget>
  );
};

export default TimerWidget;