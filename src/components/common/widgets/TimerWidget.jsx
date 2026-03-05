import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Save, Maximize2, Minimize2, Bell, BellOff } from 'lucide-react';
import { playAudio } from '../../../services/audioService';
import { useClassroomStore } from '../../../store/useClassroomStore';
import DraggableWidget from './DraggableWidget';

const TimerWidget = ({ isOpen, onClose }) => {
  const currentClass = useClassroomStore(state => state.classes.find(c => c.id === state.currentClassId));
  const students = currentClass?.students || [];
  const today = new Date().toLocaleDateString('en-CA');
  const attendanceStatus = currentClass?.attendanceRecords?.[today] || {};

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
  const autoStopTimeoutRef = useRef(null);

  // 1. 計時核心邏輯 (★ 修改處)
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (mode === 'timer') {
            // A. 剩餘時間提醒 (30秒)
            if (prev === 31) { playAudio('alert'); } // 在變為30秒的前一刻響

            // B. 最後倒數 (從 10 秒開始滴答聲，原本是 6 秒)
            if (prev <= 11 && prev > 1) { playAudio('tick'); }

            // C. 時間到
            if (prev <= 1) {
              clearInterval(intervalRef.current);
              setIsActive(false);
              handleTimeUp();
              return 0;
            }
            return prev - 1;
          } else {
            // 碼表模式 (Stopwatch) - 不需要倒數音效
            return prev + 1;
          }
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isActive, mode]);

  // 2. 響鈴邏輯 (★ 修改處：加入哨音)
  useEffect(() => {
    if (isRinging) {
      // A. ★ 瞬間爆發力：先吹一聲哨子，代表「停！」
      playAudio('whistle');

      // B. 延遲一點點再開始循環鬧鐘，避免聲音打架
      setTimeout(() => {
        playAudio('alarm'); // 第一聲鬧鐘

        ringIntervalRef.current = setInterval(() => {
          playAudio('alarm');
        }, 1200);
      }, 1500); // 0.8秒後接鬧鐘

      // C. 自動停止 (維持 5 秒)
      autoStopTimeoutRef.current = setTimeout(() => {
        setIsRinging(false);
      }, 5800); // 配合延遲稍微加長一點

    } else {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      if (autoStopTimeoutRef.current) clearTimeout(autoStopTimeoutRef.current);
    }

    return () => {
      if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
      if (autoStopTimeoutRef.current) clearTimeout(autoStopTimeoutRef.current);
    };
  }, [isRinging]);

  const handleTimeUp = () => {
    setIsRinging(true);
    // 如果希望時間到自動全螢幕，可取消下方註解
    // setIsFullScreen(true); 
  };

  // ... (其餘 UI 程式碼完全保持不變) ...

  const stopRinging = () => { setIsRinging(false); };
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} `;
  };

  const handleSetTimer = (minutes) => {
    const seconds = Math.round(minutes * 60);
    setTimeLeft(seconds); setInitialTime(seconds); setIsActive(false); setIsRinging(false); setMode('timer'); setInputMin(''); setInputSec('');
  };

  const handleCustomSet = () => {
    const m = parseInt(inputMin) || 0; const s = parseInt(inputSec) || 0;
    if (m === 0 && s === 0) return;
    const totalSeconds = (m * 60) + s;
    setTimeLeft(totalSeconds); setInitialTime(totalSeconds); setIsActive(false); setIsRinging(false); setMode('timer');
  };

  const toggleTimer = () => {
    if (isRinging) { stopRinging(); return; }
    if (timeLeft === 0 && mode === 'timer') return;
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false); setIsRinging(false); setTimeLeft(mode === 'timer' ? initialTime : 0);
  };

  const renderContent = (isFull = false) => (
    <div className={`flex flex - col items - center justify - center ${isFull ? 'h-full w-full' : 'gap-4'} `}>
      <div
        className={`
                relative group cursor - pointer tabular - nums leading - none tracking - tight font - black font - mono select - none transition - all
                ${isFull ? 'text-[25vw] text-white drop-shadow-2xl' : 'text-6xl text-slate-800 dark:text-white'}
                ${isRinging ? 'animate-bounce text-red-100' : ''}
                ${timeLeft <= 10 && mode === 'timer' && isActive ? 'text-red-500 scale-110' : ''} // ★ 增加視覺提示：最後10秒變紅放大
`}
        onClick={() => {
          if (!isActive && !isRinging) {
            if (mode === 'timer') { setMode('stopwatch'); setTimeLeft(0); }
            else { setMode('timer'); setTimeLeft(initialTime); }
          }
        }}
      >
        {formatTime(timeLeft)}
        {isRinging && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-red-600 animate-ping opacity-75">
            <Bell size={isFull ? 300 : 100} fill="currentColor" />
          </div>
        )}
      </div>

      <div className={`flex items - center gap - 6 ${isFull ? 'scale-150 mt-12' : 'mt-2'} `}>
        <button
          onClick={toggleTimer}
          className={`
rounded - full flex items - center justify - center text - white shadow - lg transition - all active: scale - 95 
                ${isFull ? 'w-24 h-24 shadow-2xl' : 'w-14 h-14 hover:scale-105'}
                ${isRinging ? 'bg-red-500 animate-pulse' : (isActive ? 'bg-amber-500' : 'bg-emerald-500')}
`}
        >
          {isRinging ? <BellOff size={isFull ? 40 : 24} /> : (isActive ? <Pause size={isFull ? 40 : 24} fill="currentColor" /> : <Play size={isFull ? 40 : 24} fill="currentColor" className="ml-1" />)}
        </button>
        <button
          onClick={handleReset}
          className={`
rounded - full flex items - center justify - center transition - all active: scale - 95
                ${isFull ? 'w-24 h-24 bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm' : 'w-14 h-14 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'}
`}
        >
          <RotateCcw size={isFull ? 36 : 22} />
        </button>
      </div>
    </div>
  );

  // ... (render return 部分保持不變) ...
  if (isFullScreen) {
    return (
      <div className={`fixed inset - 0 z - [200] flex flex - col items - center justify - center transition - colors duration - 500 ${isRinging ? 'bg-red-600' : 'bg-slate-900'} `}>
        <div className="absolute top-6 right-6 flex gap-4 z-50">
          <button onClick={() => setIsFullScreen(false)} className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-all"><Minimize2 size={32} /></button>
          <button onClick={onClose} className="p-3 bg-white/10 hover:bg-red-500/80 rounded-full text-white backdrop-blur-md transition-all"><Save size={32} className="rotate-45" /></button>
        </div>
        {renderContent(true)}
      </div>
    );
  }

  return (
    <DraggableWidget title="課堂計時" isOpen={isOpen} onClose={onClose} icon={Timer} initialPosition={{ x: 320, y: 150 }} width="w-72">
      <div className="flex flex-col items-center gap-4 relative">
        <button onClick={() => setIsFullScreen(true)} className="absolute -top-2 -right-2 p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"><Maximize2 size={16} /></button>
        {renderContent(false)}
        {mode === 'timer' && (
          <div className="w-full space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800/50">
            <div className="grid grid-cols-4 gap-2">
              {[1, 3, 5, 10].map(m => (
                <button key={m} onClick={() => handleSetTimer(m)} className="py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 transition-colors">{m}分</button>
              ))}
            </div>
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-1 flex-1">
                <input type="number" placeholder="00" value={inputMin} onChange={(e) => setInputMin(e.target.value)} className="w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md py-1 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500" />
                <span className="text-xs font-bold text-slate-400">分</span>
                <input type="number" placeholder="00" value={inputSec} onChange={(e) => setInputSec(e.target.value)} className="w-full text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md py-1 text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-blue-500" />
                <span className="text-xs font-bold text-slate-400">秒</span>
              </div>
              <button onClick={handleCustomSet} className="p-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-sm"><Save size={16} /></button>
            </div>
          </div>
        )}
      </div>
    </DraggableWidget>
  );
};

export default TimerWidget;