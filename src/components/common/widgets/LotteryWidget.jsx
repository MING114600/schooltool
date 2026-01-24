import React, { useState, useEffect, useRef } from 'react';
import { Dices, User, Users, Sparkles } from 'lucide-react'; // 加入 Sparkles 增加慶祝感
import { useAudio } from '../../../hooks/useAudio'; // 確認路徑是否需調整
import { ATTENDANCE_STATUS } from '../../../utils/constants'; // 確認路徑是否需調整
import DraggableWidget from './DraggableWidget';

const LotteryWidget = ({ isOpen, onClose, students, attendanceStatus }) => {
  const { playAudio } = useAudio();
  const [mode, setMode] = useState('student'); // 'student' | 'group'
  const [displayValue, setDisplayValue] = useState('準備抽籤');
  const [isAnimating, setIsAnimating] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const animationRef = useRef(null);

  // 初始化與重置
  useEffect(() => {
    if (isOpen) {
      if (!isAnimating && !finalResult) {
         setDisplayValue('準備抽籤');
      }
    } else {
       // 關閉時若正在跑動畫，則停止
       if (animationRef.current) clearInterval(animationRef.current);
       setIsAnimating(false);
    }
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [isOpen]);

  // 切換模式時重置
  useEffect(() => {
     if (!isAnimating) {
        setDisplayValue('準備抽籤');
        setFinalResult(null);
     }
  }, [mode]);

  // 判斷學生是否出席 (沿用原有邏輯)
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

    // 1. 篩選候選名單
    let candidates = [];
    if (mode === 'student') {
      candidates = students
        .filter(s => isStudentPresent(s))
        .map(s => `${s.number ? s.number + ' ' : ''}${s.name}`);
    } else {
      const presentStudents = students.filter(s => isStudentPresent(s));
      const activeGroups = new Set(presentStudents.map(s => s.group).filter(g => g));
      
      // 小組排序邏輯
      candidates = Array.from(activeGroups)
        .sort((a, b) => {
          const numA = parseInt(a); const numB = parseInt(b);
          if (!isNaN(numA) && !isNaN(numB)) return numA - numB; 
          return a.localeCompare(b);
        })
        .map(g => `第 ${g} 組`);
    }

    // 2. 防呆：無人可抽
    if (candidates.length === 0) {
      setDisplayValue('無人可抽');
      playAudio('wrong');
      return;
    }

    // 3. 開始動畫
    setIsAnimating(true); 
    setFinalResult(null);
    const duration = 2000; // 動畫總時長
    const intervalTime = 50; 
    const startTime = Date.now();

    animationRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      
      // 播放音效 (每 150ms 才播一次以免太吵)
      if (elapsed % 150 < 50) playAudio('tick'); 

      if (elapsed >= duration) {
        clearInterval(animationRef.current);
        const winner = candidates[Math.floor(Math.random() * candidates.length)];
        setDisplayValue(winner); 
        setFinalResult(winner); 
        setIsAnimating(false); 
        playAudio('applause'); 
      } else {
        const randomVal = candidates[Math.floor(Math.random() * candidates.length)];
        setDisplayValue(randomVal);
      }
    }, intervalTime);
  };

  return (
    <DraggableWidget 
      title="幸運抽籤" 
      isOpen={isOpen} 
      onClose={onClose}
      icon={Dices}
      // 設定初始位置在計時器下方 (假設計時器在 y:80)
      initialPosition={{ x: 20, y: 350 }} 
    >
      <div className="flex flex-col gap-4">
        
        {/* 1. 模式切換 Pill */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button 
            onClick={() => setMode('student')}
            disabled={isAnimating}
            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${mode === 'student' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-blue-400' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <User size={14}/> 抽學生
          </button>
          <button 
            onClick={() => setMode('group')}
            disabled={isAnimating}
            className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1 ${mode === 'group' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-purple-400' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <Users size={14}/> 抽小組
          </button>
        </div>

        {/* 2. 結果顯示區 */}
        <div className={`
            relative flex flex-col items-center justify-center min-h-[120px] rounded-xl border-2 transition-all duration-300
            ${finalResult 
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50 scale-105 shadow-lg' 
                : 'bg-slate-50 dark:bg-slate-800/50 border-dashed border-slate-200 dark:border-slate-700'
            }
        `}>
            {/* 慶祝圖示 */}
            {finalResult && (
                <div className="absolute -top-3 -right-3 animate-bounce">
                    <div className="bg-amber-400 text-white p-1.5 rounded-full shadow-lg">
                        <Sparkles size={16} fill="currentColor"/>
                    </div>
                </div>
            )}
            
            {/* 文字本體 */}
            <div className={`
                font-black text-center transition-all px-2 break-all leading-tight
                ${finalResult 
                    ? 'text-3xl md:text-4xl text-amber-600 dark:text-amber-400' 
                    : 'text-2xl text-slate-300 dark:text-slate-600'
                }
            `}>
                {displayValue}
            </div>

            {/* 恭喜字樣 */}
            {finalResult && (
                <div className="mt-2 text-xs font-bold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-widest animate-pulse">
                    Winner!
                </div>
            )}
        </div>

        {/* 3. 底部按鈕 */}
        <button 
          onClick={handleDraw} 
          disabled={isAnimating}
          className={`
            w-full py-2.5 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 active:scale-95
            ${isAnimating 
                ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 hover:opacity-90 hover:shadow-lg'
            }
          `}
        >
          {isAnimating ? (
            <>
                <Dices size={18} className="animate-spin"/> 抽選中...
            </>
          ) : (
            <>
                <Dices size={18}/> 開始抽選
            </>
          )}
        </button>

      </div>
    </DraggableWidget>
  );
};

export default LotteryWidget;