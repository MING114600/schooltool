import React, { useState, useEffect, useRef, memo } from 'react';
import { Lock, Unlock } from 'lucide-react';
import { GROUP_THEME, ATTENDANCE_STATUS, GENDER_THEME } from '../../../constants';
import { cn } from '../../../utils/cn';

// ★ 修正：將 arePropsEqual 移到這裡 (組件外部)，這樣底部的 memo 才讀得到
const arePropsEqual = (prevProps, nextProps) => {
  // 1. 拖曳目標改變 (最優先)
  if (prevProps.isDragTarget !== nextProps.isDragTarget) return false;
  if (prevProps.onStudentClick !== nextProps.onStudentClick) return false;

  // 2. 基本屬性改變
  if (prevProps.isVoid !== nextProps.isVoid) return false;
  if (prevProps.displayMode !== nextProps.displayMode) return false;
  if (prevProps.mode !== nextProps.mode) return false;
  if (prevProps.hoveredGroup !== nextProps.hoveredGroup) return false;
  if (prevProps.seatMode !== nextProps.seatMode) return false;

  // 3. 學生資料改變
  const prevS = prevProps.student;
  const nextS = nextProps.student;

  if (!prevS || !nextS) return prevS === nextS;

  return (
    prevS.id === nextS.id &&
    prevS.name === nextS.name &&
    prevS.score === nextS.score &&
    prevS.group === nextS.group &&
    prevS.gender === nextS.gender &&
    prevS.locked === nextS.locked &&
    prevProps.attendanceStatus?.[prevS.id] === nextProps.attendanceStatus?.[nextS.id]
  );
};

const SeatCell = ({
  row, col, student,
  onDrop, onDragStart, onStudentClick,
  displayMode = 'normal', mode = 'arrange',
  attendanceStatus = {},
  isVoid, onToggleVoid, onToggleLock,
  hoveredGroup,
  isCompact = false,
  layoutRows,
  // 新增的 Props
  isDragTarget,
  onCellDragOver,
  onCellDragLeave,
  seatMode,
  onToggleColumnVoid,
  onToggleRowVoid
}) => {
  const [isShaking, setIsShaking] = useState(false);
  const prevScoreRef = useRef(student?.score || 0);

  const statusKey = (student && attendanceStatus[student.id]) ? attendanceStatus[student.id] : 'present';
  const statusConfig = ATTENDANCE_STATUS[statusKey] || ATTENDANCE_STATUS.present;

  useEffect(() => {
    if (student) {
      if (student.score < prevScoreRef.current) {
        requestAnimationFrame(() => {
          setIsShaking(true);
          setTimeout(() => setIsShaking(false), 400);
        });
      }
      prevScoreRef.current = student.score;
    }
  }, [student?.score]);

  const handleClick = (e) => {
    if (mode === 'arrange') {
      if (seatMode === 'toggle_single') {
        onToggleVoid(row, col);
      } else if (seatMode === 'toggle_col') {
        if (onToggleColumnVoid) onToggleColumnVoid(col);
      } else if (seatMode === 'toggle_row') {
        if (onToggleRowVoid) onToggleRowVoid(row);
      } else {
        // swap mode 
        if (student) {
          if (student.locked) {
            onToggleLock(student.id);
          } else {
            onStudentClick(student);
          }
        }
      }
    } else {
      if (student) onStudentClick(student);
    }
  };

  const handleContextMenu = (e) => {
    if (mode === 'arrange') {
      e.preventDefault();
      onToggleVoid(row, col);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (onCellDragOver) onCellDragOver(e, row, col);
  };

  const handleDragLeave = (e) => {
    if (onCellDragLeave) onCellDragLeave(e);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (onCellDragLeave) onCellDragLeave(e);

    const studentId = e.dataTransfer.getData("studentId");
    const sourceSeat = e.dataTransfer.getData("sourceSeat");

    if (studentId) {
      onDrop(studentId, row, col, sourceSeat || null);
    }
  };

  const getHeightClass = (rows, isCompact) => {
    if (isCompact) return 'min-h-[36px]';
    return 'h-full min-h-[36px]';
  };

  const heightClass = getHeightClass(layoutRows, isCompact);
  const nameLength = student?.name?.length || 0;

  const getNameSizeClass = (rows, len) => {
    if (rows <= 5) return len > 3 ? 'text-2xl' : 'text-3xl';
    if (rows <= 6) return len > 3 ? 'text-xl' : 'text-2xl';
    if (rows <= 7) return len > 3 ? 'text-lg' : 'text-xl';
    if (rows <= 8) return len > 3 ? 'text-sm' : 'text-base';
    return len > 3 ? 'text-[10px]' : 'text-xs md:text-sm';
  };

  let nameSizeClass = getNameSizeClass(layoutRows, nameLength);

  // --- 1. 虛擬座位 (Void) ---
  if (isVoid) {
    return (
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={cn(
          "w-full transition-colors duration-200",
          heightClass,
          mode === 'arrange'
            ? "bg-slate-100/50 border border-dashed border-slate-200 cursor-cell hover:bg-slate-200/50 relative group"
            : "opacity-0 pointer-events-none"
        )}
      >
        {mode === 'arrange' && <span className="absolute inset-0 flex items-center justify-center text-[14px] text-slate-300 opacity-0 group-hover:opacity-100 select-none">右鍵復原</span>}
      </div>
    );
  }

  // --- 2. 空座位 (Empty) ---
  if (!student) {
    return (
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "w-full transition-all flex items-center justify-center",
          heightClass,
          mode === 'arrange' && [
            "rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-300",
            "bg-slate-50/50 dark:bg-slate-600 text-slate-300 dark:text-white",
            "hover:bg-slate-100 hover:dark:bg-slate-800 hover:border-slate-300 cursor-cell"
          ],
          // 拖曳視覺引導
          (isDragTarget && mode === 'arrange') && "ring-4 ring-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/30 z-20 scale-105 border-yellow-400"
        )}
        title={mode === 'arrange' ? '右鍵設為走道' : ''}
      >
        {mode === 'arrange' && <span className="text-base font-bold">空</span>}
      </div>
    );
  }

  // --- 3. 有學生 (Student) - 樣式邏輯 ---
  let bgClass = "bg-white dark:bg-slate-900/80";
  let borderClass = "border-slate-700 dark:border-slate-200 border-b-[3px]";
  let textClass = "text-slate-700 dark:text-slate-200";

  if (displayMode === 'gender') {
    const genderStyle = GENDER_THEME[student.gender] || GENDER_THEME.M;
    bgClass = genderStyle.bg;
    borderClass = `${genderStyle.border} border-b-[3px]`;
    textClass = genderStyle.text;

  } else if (displayMode === 'group') {
    const groupNum = parseInt(student.group) || 0;
    const colorIndex = groupNum % 9;
    const theme = GROUP_THEME[colorIndex] || GROUP_THEME[0];
    borderClass = `${theme.border} border-b-[4px]`;
  }

  if (statusKey !== 'present' && statusKey !== 'late') {
    bgClass = statusConfig.bg;
    textClass = statusConfig.color;
    borderClass = statusConfig.border;
  }

  const isHighlighted = hoveredGroup && String(student.group) === String(hoveredGroup);
  const isLocked = student.locked;
  const isAbsentOrPersonal = statusKey === 'absent' || statusKey === 'personal';

  return (
    <div
      id={`student-card-${student.id}`}
      onContextMenu={handleContextMenu}
      draggable={mode === 'arrange' && !isLocked}
      onDragStart={(e) => {
        if (mode === 'arrange' && !isLocked) onDragStart(e, student.id);
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      className={cn(
        "relative w-full rounded-xl border shadow-sm transition-all duration-200",
        "flex flex-col items-center justify-center select-none overflow-hidden",

        heightClass,
        bgClass,
        borderClass,
        textClass,

        statusKey === 'present' && "hover:shadow-md hover:-translate-y-0.5",

        (mode === 'arrange' && !isLocked)
          ? "cursor-grab active:cursor-grabbing"
          : "cursor-pointer",

        isShaking && "animate-shake ring-2 ring-rose-400",
        isHighlighted && "ring-4 ring-yellow-400 scale-105 z-20 shadow-xl",

        // 拖曳視覺引導
        (isDragTarget && mode === 'arrange') && "ring-4 ring-blue-400 dark:ring-blue-500 scale-105 z-20 shadow-xl opacity-90"
      )}
      title={mode === 'arrange' ? '右鍵設為走道' : ''}
    >
      {/* 1. 左上角：座號標籤 */}
      <div className={cn(
        "absolute top-1 left-2 px-1.5 pt-0.5 pb-1 rounded-br-lg backdrop-blur-sm",
        "text-[12px] md:text-base font-black font-mono leading-none z-10",
        isAbsentOrPersonal ? "text-white/70" : "text-slate-700 dark:text-white"
      )}>
        {student.number}
      </div>

      {/* 2. 左下角：分數氣泡 */}
      {!isAbsentOrPersonal && (student.score !== 0 && student.score !== undefined) && (
        <div className={cn(
          "absolute bottom-1 left-1 px-1 py-0.5 rounded-full md:text-sm font-black shadow-sm z-10",
          student.score > 0
            ? "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700"
            : "bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700"
        )}>
          {student.score > 0 ? '+' : ''}{student.score}
        </div>
      )}

      {/* 3. 右上角：鎖定圖示 */}
      {mode === 'arrange' && (
        <div className="absolute top-0 right-1 z-10">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onToggleLock(student.id); }}
            className={cn(
              "p-1 rounded-full transition-colors",
              isLocked
                ? "text-slate-500 bg-slate-50 dark:bg-slate-900/30"
                : "text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
            )}
          >
            {isLocked ? <Lock size={12} fill="currentColor" /> : <Unlock size={12} />}
          </button>
        </div>
      )}

      {/* 4. 右下角：小組 */}
      {!isCompact && student.group && displayMode !== 'group' && (
        <div className="absolute bottom-1 right-1 opacity-30 z-0">
          <span className="md:text-sm font-bold flex items-center gap-0.5">
            <UsersGroupIcon size={10} />
            {student.group}
          </span>
        </div>
      )}

      {/* 5. 中央：姓名 */}
      <div className="w-full px-1 flex flex-col items-center justify-center z-0">
        <span className={cn(
          "font-bold leading-tight text-center line-clamp-2",
          nameSizeClass
        )}>
          {student.name}
        </span>

        {/* 狀態標籤 */}
        {statusKey !== 'present' && statusKey !== 'late' && (
          <span className={cn(
            "mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm",
            "bg-white/20 backdrop-blur-sm border border-white/10 text-current"
          )}>
            {statusConfig.icon} {statusConfig.label}
          </span>
        )}
      </div>

      {/* 背景裝飾 (性別模式) */}
      {displayMode === 'gender' && (
        <div className={cn(
          "absolute bottom-0 right-0 w-8 h-8 rounded-tl-3xl opacity-20 pointer-events-none",
          GENDER_THEME[student.gender]?.decoration || GENDER_THEME.M.decoration
        )} />
      )}

    </div>
  );
};

// 輔助圖示組件 (不變)
const UsersGroupIcon = ({ size = 12 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

export default memo(SeatCell, arePropsEqual);