import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Dices, User, Users, Sparkles, ChevronDown } from 'lucide-react'; 
import { useAudio } from '../../../hooks/useAudio'; 
import { ATTENDANCE_STATUS } from '../../../utils/constants'; 
import DraggableWidget from './DraggableWidget';

// 移除 attendanceStatus props，因為我們直接從 classes 裡抓比較準
const LotteryWidget = ({ isOpen, onClose, classes = [], defaultClassId }) => {
  const { playAudio } = useAudio();
  
  // 1. 班級選擇狀態
  const [selectedClassId, setSelectedClassId] = useState(defaultClassId || classes[0]?.id);
  
  const [mode, setMode] = useState('student'); 
  const [displayValue, setDisplayValue] = useState('準備抽籤');
  const [isAnimating, setIsAnimating] = useState(false);
  const [finalResult, setFinalResult] = useState(null);
  const animationRef = useRef(null);

  // 當 defaultClassId 改變時，Widget 跟著切換
  useEffect(() => {
    if (defaultClassId) {
      setSelectedClassId(defaultClassId);
    }
  }, [defaultClassId]);

  // 2. 取得「目前選中班級」的完整物件
  const selectedClassObj = useMemo(() => {
    return classes.find(c => c.id === selectedClassId);
  }, [classes, selectedClassId]);

  // 3. 計算當前要抽的「目標學生名單」
  const targetStudents = useMemo(() => {
    return selectedClassObj ? selectedClassObj.students : [];
  }, [selectedClassObj]);

  // ✅ 4. 自行計算該班級的「今日出席表」
  // 這樣無論切換到哪一班，都能抓到該班自己的紀錄
  const currentAttendance = useMemo(() => {
      if (!selectedClassObj?.attendanceRecords) return {};
      const today = new Date().toLocaleDateString('en-CA');
      return selectedClassObj.attendanceRecords[today] || {};
  }, [selectedClassObj]);

  // 初始化與重置
  useEffect(() => {
    if (isOpen) {
      if (!isAnimating && !finalResult) {
         setDisplayValue('準備抽籤');
      }
    } else {
       if (animationRef.current) clearInterval(animationRef.current);
       setIsAnimating(false);
    }
    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [isOpen]);

  useEffect(() => {
     if (!isAnimating) {
        setDisplayValue('準備抽籤');
        setFinalResult(null);
     }
  }, [mode, selectedClassId]);

  // ✅ 5. 修改判斷出席的邏輯
  const isStudentPresent = (student) => {
      // 直接使用我們剛剛算出來的 currentAttendance
      const statusKey = currentAttendance[student.id] || 'present';
      
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
      candidates = targetStudents
        .filter(s => isStudentPresent(s)) // 這裡會自動套用新邏輯
        .map(s => `${s.number ? s.number + ' ' : ''}${s.name}`);
    } else {
      const presentStudents = targetStudents.filter(s => isStudentPresent(s));
      const activeGroups = new Set(presentStudents.map(s => s.group).filter(g => g));
      
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
    const duration = 2000; 
    const intervalTime = 50; 
    const startTime = Date.now();

    animationRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
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
      initialPosition={{ x: 320, y: 500 }} 
    >
      <div className="flex flex-col gap-4">
        
        {/* 班級選擇器 */}
        {classes.length > 0 && (
          <div className="relative">
             <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                disabled={isAnimating}
                className="w-full appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-sm font-bold py-2 pl-3 pr-8 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
                {classes.map(cls => (
                    <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.students.length}人)
                    </option>
                ))}
             </select>
             <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                <ChevronDown size={16} />
             </div>
          </div>
        )}

        {/* 模式切換 Pill */}
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

        {/* 結果顯示區 */}
        <div className={`
            relative flex flex-col items-center justify-center min-h-[120px] rounded-xl border-2 transition-all duration-300
            ${finalResult 
                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50 scale-105 shadow-lg' 
                : 'bg-slate-50 dark:bg-slate-800/50 border-dashed border-slate-200 dark:border-slate-700'
            }
        `}>
            {finalResult && (
                <div className="absolute -top-3 -right-3 animate-bounce">
                    <div className="bg-amber-400 text-white p-1.5 rounded-full shadow-lg">
                        <Sparkles size={16} fill="currentColor"/>
                    </div>
                </div>
            )}
            
            <div className={`
                font-black text-center transition-all px-2 break-all leading-tight
                ${finalResult 
                    ? 'text-3xl md:text-4xl text-amber-600 dark:text-amber-400' 
                    : 'text-2xl text-slate-300 dark:text-slate-600'
                }
            `}>
                {displayValue}
            </div>
            
            {/* 顯示目前是抽哪一班 (輔助資訊) */}
            {!finalResult && !isAnimating && (
                 <div className="mt-2 text-xs text-slate-400 font-medium">
                    目標：{selectedClassObj?.name || '未知班級'}
                 </div>
            )}

            {finalResult && (
                <div className="mt-2 text-xs font-bold text-amber-600/70 dark:text-amber-400/70 uppercase tracking-widest animate-pulse">
                    Winner!
                </div>
            )}
        </div>

        {/* 底部按鈕 */}
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