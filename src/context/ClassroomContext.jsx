import React, { createContext, useContext } from 'react';
import { useClassroom } from '../hooks/useClassroom';

// 建立 Context
const ClassroomContext = createContext(null);

// 建立 Provider
export const ClassroomProvider = ({ children }) => {
  // 使用您已經寫好的 useClassroom Hook
  const classroomData = useClassroom();

  return (
    <ClassroomContext.Provider value={classroomData}>
      {children}
    </ClassroomContext.Provider>
  );
};

// 建立一個方便的 Hook 供子組件使用
export const useClassroomContext = () => {
  const context = useContext(ClassroomContext);
  if (!context) {
    throw new Error('useClassroomContext must be used within a ClassroomProvider');
  }
  return context;
};