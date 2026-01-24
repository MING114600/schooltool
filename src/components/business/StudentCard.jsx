import React, { memo } from 'react';
import { Lock, Unlock } from 'lucide-react'; 
import { GROUP_THEME, STATUS_CONFIG, GENDER_THEME } from '../../utils/constants'; 

const StudentCard = memo(({ 
  student, 
  isDragging, 
  onDragStart, 
  onClick, 
  displayMode = 'normal', 
  mode = 'view', 
  attendanceStatus, 
  onToggleLock, 
  isMapEditActive 
}) => {
  if (!student) return null;

  const statusKey = attendanceStatus?.[student.id] || student.status || 'present';
  const statusConfig = STATUS_CONFIG[statusKey] || STATUS_CONFIG['present'];
  const isAbsent = !statusConfig.isPresent;

  // --- 樣式計算邏輯 ---
  const getCardStyles = () => {
    // 預設樣式
    let styles = "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white shadow-sm";
    let badge = "bg-slate-500 dark:bg-slate-600";
    let decoration = null;

    if (displayMode === 'group' && student.group) {
      const groupStr = String(student.group);
      const groupNum = parseInt(groupStr);
      const groupIndex = (isNaN(groupNum) ? groupStr.charCodeAt(0) : groupNum) % 9;
      const theme = GROUP_THEME[groupIndex];
      
      // ✅ 簡化：theme.border/bg/text 已包含 dark 模式
      styles = `${theme.border} ${theme.bg} ${theme.text}`;
      badge = "bg-slate-600 dark:bg-slate-500";

    } else if (displayMode === 'gender') {
      const theme = GENDER_THEME[student.gender] || GENDER_THEME.M;
      
      // ✅ 簡化引用
      styles = `${theme.border} ${theme.bg} ${theme.text}`;
      badge = theme.badge;
      decoration = theme.decoration;
    }

    return { styles, badge, decoration };
  };

  const { styles: cardStyleClass, badge: badgeClass, decoration: decorationClass } = getCardStyles();

  const interactionClass = mode === 'score' 
    ? 'cursor-pointer hover:ring-4 ring-yellow-400 dark:ring-yellow-500/50 ring-opacity-50 hover:scale-105 active:scale-95' 
    : 'cursor-move hover:scale-105 hover:shadow-md active:cursor-grabbing';

  // 處理鎖定按鈕點擊
  const handleLockClick = (e) => {
    e.stopPropagation(); 
	
    if (onToggleLock) {
      onToggleLock(student.id);
    }
  };

  return (
    <div 
      id={`student-card-${student.id}`} 
      draggable={mode === 'arrange' && !student.locked} 
      onDragStart={(e) => mode === 'arrange' && !student.locked && onDragStart && onDragStart(e, student.id)}
      onClick={onClick}
      className={`
        relative p-1.5 rounded-xl border-2 select-none transition-all duration-200
        flex flex-col items-center justify-center gap-0.5 h-full w-full overflow-hidden
        ${cardStyleClass} 
        ${isDragging ? 'opacity-40 scale-90' : interactionClass} 
        ${isAbsent ? 'opacity-60 grayscale-[0.3]' : ''} 
        ${student.locked ? 'ring-2 ring-slate-400 dark:ring-slate-500 ring-offset-2 dark:ring-offset-slate-900' : ''}
        animate-fade-in
      `}
      title={student.locked ? "已鎖定座位" : "點擊進行操作"}
    >
      {/* 出缺席/特殊狀態遮罩 */}
      {isAbsent && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/40 dark:bg-slate-900/70 backdrop-blur-[1px]">
          <div className={`flex flex-col items-center justify-center font-bold ${statusConfig.color}`}>
            {statusConfig.icon}
            <span className="text-[10px] tracking-tighter">{statusConfig.label}</span>
          </div>
        </div>
      )}

      {/* 鎖定控制按鈕 - 確保在最上層且可點擊 */}
      {mode === 'arrange' && !isMapEditActive && (
        <div 
          onClick={handleLockClick} 
          className={`
            absolute top-1 right-1 p-1 rounded-full z-30 shadow-sm border border-white dark:border-slate-800 transition-colors cursor-pointer
            ${student.locked ? 'bg-slate-700 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-500'}
          `} 
          title={student.locked ? "點擊解鎖" : "點擊鎖定"}
        >
          {student.locked ? <Lock size={14} fill="currentColor"/> : <Unlock size={14} />}
        </div>
      )}

      {/* 右下角組別標記 */}
      {displayMode === 'group' && student.group && (
        <div className="absolute bottom-0.5 right-0.5 px-1.5 py-0.5 bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-300 rounded text-[12px] font-bold z-10">
          {student.group}組
        </div>
      )}

      {/* 左下角分數/狀態氣泡 */}
      {(student.score !== undefined && student.score !== 0) && (
        <div className={`
          absolute bottom-1 left-1 min-w-[20px] h-7 px-1 py-0.5 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm border border-white dark:border-slate-800 z-10
          ${student.score > 0 ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700' : 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700'}
        `}>
          {student.score > 0 ? '+' : ''}{student.score}
        </div>
      )}

      {/* 座號標籤 */}
      <div className={`
        text-[14px] font-black px-1.5 py-0.5 rounded-full text-white leading-none mb-0.5 shadow-sm
        ${badgeClass}
      `}>
        {student.number}
      </div>

      {/* 姓名文字 */}
      <div className="font-bold text-current truncate w-full text-center text-lg md:text-sm lg:text-base leading-tight px-1">
        {student.name}
      </div>

      {/* 性別裝飾底紋 */}
      {displayMode === 'gender' && decorationClass && (
         <div className={`absolute bottom-0 right-0 w-6 h-6 rounded-tl-full opacity-10 pointer-events-none ${decorationClass}`} />
      )}
    </div>
  );
});

StudentCard.displayName = 'StudentCard';

export default StudentCard;