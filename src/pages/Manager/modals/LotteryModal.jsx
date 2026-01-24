import React, { useState, useEffect, useRef } from 'react';
import { Dices, X, User, Users } from 'lucide-react';
import { useAudio } from '../../../hooks/useAudio';
import { ATTENDANCE_STATUS } from '../../../utils/constants';

const LotteryModal = ({ isOpen, onClose, students, attendanceStatus }) => {
  const { playAudio } = useAudio();
  const [mode, setMode] = useState('student'); 
  const [displayValue, setDisplayValue] = useState('準備抽籤');
  const [isAnimating, setIsAnimating] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setDisplayValue('準備抽籤');
      setFinalResult(null);
      setIsAnimating(false);
    }
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const isStudentPresent = (student) => {
      const statusMap = attendanceStatus || {};
      const statusKey = statusMap[student.id] || 'present';
      if (ATTENDANCE_STATUS && ATTENDANCE_STATUS[statusKey]) {
          return ATTENDANCE_STATUS[statusKey].isPresent;
      }
      return statusKey === 'present' || statusKey === 'late';
  };

  const handleDraw = () => {
    if (isAnimating) return;
    let candidates = [];
    if (mode === 'student') {
      candidates = students.filter(s => isStudentPresent(s)).map(s => `${s.number ? s.number + ' ' : ''}${s.name}`);
    } else {
      const presentStudents = students.filter(s => isStudentPresent(s));
      const activeGroups = new Set(presentStudents.map(s => s.group).filter(g => g));
      candidates = Array.from(activeGroups).sort((a, b) => {
          const numA = parseInt(a); const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB; return a.localeCompare(b);
      }).map(g => `第 ${g} 組`);
    }

    if (candidates.length === 0) {
      setDisplayValue('無人可抽');
      playAudio('wrong');
      return;
    }

    setIsAnimating(true); setFinalResult(null);
    const duration = 2000; const intervalTime = 50; const startTime = Date.now();

    animationRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      playAudio('tick'); 
      if (elapsed >= duration) {
        clearInterval(animationRef.current);
        const winner = candidates[Math.floor(Math.random() * candidates.length)];
        setDisplayValue(winner); setFinalResult(winner); setIsAnimating(false); playAudio('applause'); 
      } else {
        const randomVal = candidates[Math.floor(Math.random() * candidates.length)];
        setDisplayValue(randomVal);
      }
    }, intervalTime);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden scale-100 flex flex-col border border-slate-200 dark:border-slate-700">
        <div className="p-4 bg-slate-800 dark:bg-slate-950 border-b border-slate-700 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg flex items-center gap-2"><Dices size={20} className="text-pink-400"/> 抽籤小幫手</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full text-slate-300"><X size={18}/></button>
        </div>
        
        {/* 模式切換 */}
        <div className="flex p-2 gap-2 bg-slate-100 dark:bg-slate-800">
          <button 
            onClick={() => { setMode('student'); setDisplayValue('準備抽籤'); setFinalResult(null); }}
            disabled={isAnimating}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'student' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
          >
            <User size={16}/> 抽學生
          </button>
          <button 
            onClick={() => { setMode('group'); setDisplayValue('準備抽籤'); setFinalResult(null); }}
            disabled={isAnimating}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${mode === 'group' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700/50'}`}
          >
            <Users size={16}/> 抽小組
          </button>
        </div>

        {/* 顯示區域 */}
        <div className="p-8 flex flex-col items-center justify-center min-h-[220px] bg-slate-50 dark:bg-slate-900">
          <div className={`text-5xl md:text-6xl font-black text-center transition-all leading-tight break-all ${finalResult ? 'text-blue-600 dark:text-blue-400 scale-110' : 'text-slate-300 dark:text-slate-700'}`}>
            {displayValue}
          </div>
          {finalResult && (
            <div className="mt-6 text-base font-bold text-emerald-500 animate-bounce">
              恭喜中選！
            </div>
          )}
        </div>

        {/* 底部按鈕 */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <button 
            onClick={handleDraw} 
            disabled={isAnimating}
            className={`w-full py-3 rounded-xl font-bold text-lg text-white shadow-md transition-all flex items-center justify-center gap-2
              ${isAnimating ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 hover:opacity-90 hover:scale-[1.02] active:scale-95'}
            `}
          >
            {isAnimating ? '抽選中...' : '開始抽選'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LotteryModal;