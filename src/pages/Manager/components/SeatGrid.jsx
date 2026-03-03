import React, { memo, useState, useCallback } from 'react';
import { DoorOpen } from 'lucide-react';
import { useClassroomStore } from '../../../store/useClassroomStore';
import SeatCell from './SeatCell';

const SeatGrid = memo(({
  isTeacherView,
  onSeatDrop,
  onStudentClick,
  displayMode,
  appMode,
  onToggleVoid,
  onToggleLock,
  hoveredGroup,
  seatMode,
  onToggleColumnVoid,
  onToggleRowVoid
}) => {
  const currentClass = useClassroomStore(state => state.classes.find(c => c.id === state.currentClassId));
  const layout = currentClass?.layout;
  const students = currentClass?.students || [];
  const today = new Date().toLocaleDateString('en-CA');
  const attendanceStatus = currentClass?.attendanceRecords?.[today] || {};
  // 2. 新增狀態：追蹤目前拖曳經過的目標格子
  const [dragOverTarget, setDragOverTarget] = useState(null); // { r, c }

  // 3. 定義穩定的 Handler (使用 useCallback 避免破壞 SeatCell 的 memo)
  const handleCellDragOver = useCallback((e, r, c) => {
    e.preventDefault();
    // 只有當「格子變了」才更新 state，避免頻繁渲染
    setDragOverTarget(prev => {
      if (prev?.r === r && prev?.c === c) return prev;
      return { r, c };
    });
  }, []);

  const handleCellDragLeave = useCallback(() => {
    setDragOverTarget(null);
  }, []);

  // ... (中間的 layout 計算邏輯保持不變) ...
  if (!layout) return null;
  const { rows, cols, seats, voidSeats, doorSide } = layout;
  const rowIndices = Array.from({ length: cols }, (_, i) => i);
  if (isTeacherView) rowIndices.reverse();
  const isVisualRight = isTeacherView ? (doorSide === 'left') : (doorSide === 'right');
  const doorSideClass = isVisualRight
    ? '-right-8 md:-right-12 rounded-l-xl border-l-4'
    : '-left-8 md:-left-12 rounded-r-xl border-r-4';

  return (
    <div className="relative w-full max-w-5xl mx-auto flex-1 flex flex-col transition-all duration-300">

      {/* 門位標示 (保持不變) */}
      <div className={`absolute w-6 h-24 bg-amber-200 dark:bg-amber-900/80 border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-800 dark:text-amber-200 font-bold text-[16px] writing-vertical ${doorSideClass} top-12 transition-colors z-10 shadow-md`}>
        <span className="tracking-widest">{isTeacherView ? '後門' : '前門'}</span>
      </div>
      <div className={`absolute w-6 h-24 bg-amber-200 dark:bg-amber-900/80 border-amber-300 dark:border-amber-700 flex items-center justify-center text-amber-800 dark:text-amber-200 font-bold text-[16px] writing-vertical ${doorSideClass} bottom-12 transition-colors z-10 shadow-md`}>
        <span className="tracking-widest">{isTeacherView ? '前門' : '後門'}</span>
      </div>

      <div className="flex-1 w-full min-h-0 grid gap-1 md:gap-2" style={{ gridTemplateRows: `repeat(${cols}, minmax(0, 1fr))` }}>
        {rowIndices.map(r => (
          <div key={r} className="grid gap-2 h-full" style={{ gridTemplateColumns: `repeat(${rows}, minmax(0, 1fr))` }}>
            {Array.from({ length: rows }, (_, c) => {
              const displayCol = isTeacherView ? (rows - 1 - c) : c;
              const key = `${r}-${displayCol}`;
              const student = students.find(s => s.id === seats[key]);

              // 4. 計算是否為當前拖曳目標
              const isDragTarget = dragOverTarget?.r === r && dragOverTarget?.c === displayCol;

              return (
                <SeatCell
                  key={key}
                  row={r}
                  col={displayCol}
                  student={student}
                  onDrop={onSeatDrop}
                  onDragStart={(e, id) => {
                    e.dataTransfer.setData("studentId", id);
                    e.dataTransfer.setData("sourceSeat", key);
                  }}
                  onStudentClick={onStudentClick}
                  displayMode={displayMode}
                  mode={appMode}
                  attendanceStatus={attendanceStatus}
                  isVoid={voidSeats?.includes(key)}
                  onToggleVoid={onToggleVoid}
                  onToggleLock={onToggleLock}
                  hoveredGroup={hoveredGroup}
                  layoutRows={cols}

                  // ★ 新增這三個 Props
                  isDragTarget={isDragTarget}
                  onCellDragOver={handleCellDragOver}
                  onCellDragLeave={handleCellDragLeave}
                  seatMode={seatMode}
                  onToggleColumnVoid={onToggleColumnVoid}
                  onToggleRowVoid={onToggleRowVoid}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
});

SeatGrid.displayName = 'SeatGrid';
export default SeatGrid;