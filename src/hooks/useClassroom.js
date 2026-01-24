// src/hooks/useClassroom.js
import { useState } from 'react';
import { useClassState } from './useClassState';
import { useSeating } from './useSeating';
import { useScoring } from './useScoring';

export const useClassroom = () => {
  // 1. 核心狀態 (State & Persistence)
  const classState = useClassState();
  const { currentClass, updateClass } = classState;

  // 2. 座位與佈局邏輯 (Seating Logic)
  const seating = useSeating(currentClass, updateClass);

  // 3. 評分與反饋邏輯 (Scoring & Feedback)
  const scoring = useScoring(currentClass, updateClass);

  // 4. 其他 UI 狀態 (UI State)
  const [hoveredGroup, setHoveredGroup] = useState(null);
  const [groupBoardMode, setGroupBoardMode] = useState('entity');

  // 5. 雜項功能 (Misc)
  const updateAttendance = (date, statusMap) => {
      const newRecords = { ...(currentClass.attendanceRecords || {}), [date]: statusMap };
      updateClass({ ...currentClass, attendanceRecords: newRecords });
  };
  
  const updateStudents = (newStudents) => {
      updateClass({...currentClass, students: newStudents});
  };

  // 組裝並回傳所有介面 (維持原 API 結構)
  return {
    // State
    ...classState,

    // Seating
    ...seating,

    // Scoring & Feedback
    ...scoring,

    // UI Misc
    hoveredGroup, setHoveredGroup,
    groupBoardMode, setGroupBoardMode,

    // Helpers
    updateAttendance,
    updateStudents,
  };
};