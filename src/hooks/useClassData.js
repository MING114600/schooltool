import { useState, useEffect, useCallback } from 'react';

// 預設班級資料 (從您原本的程式碼提取)
const DEFAULT_CLASS = {
  id: 'default_class',
  name: '範例班級',
  students: [
    { id: 's1', number: '01', name: '王小明', gender: 'M', group: '1', locked: false },
    // ... 其他預設學生 ...
  ],
  layout: {
    rows: 4, 
    cols: 8,
    doorSide: 'right', 
    seats: {},
    voidSeats: [] 
  },
  groupScores: {}, 
  scoreLogs: [], 
  attendanceRecords: {},
  behaviors: [
    { id: 'b1', icon: '👍', label: '發表意見', score: 1, type: 'positive' },
    { id: 'b2', icon: '🤝', label: '幫助同學', score: 1, type: 'positive' },
    { id: 'b3', icon: '✅', label: '秩序良好', score: 1, type: 'positive' },
    { id: 'b4', icon: '💤', label: '上課睡覺', score: -1, type: 'negative' },
    { id: 'b5', icon: '🗣️', label: '干擾秩序', score: -1, type: 'negative' },
  ]
};

const STORAGE_KEY = 'schooltool_classes';

export const useClassData = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // 讀取資料
  const refreshClasses = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setClasses(JSON.parse(saved));
      } else {
        setClasses([DEFAULT_CLASS]);
      }
    } catch (e) {
      console.error("Failed to load class data", e);
      setClasses([DEFAULT_CLASS]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始讀取
  useEffect(() => {
    refreshClasses();
  }, [refreshClasses]);

  // 儲存資料 (全量更新)
  const saveClasses = useCallback((newClasses) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newClasses));
      setClasses(newClasses);
    } catch (e) {
      console.error("Failed to save class data", e);
      alert("儲存失敗，可能是儲存空間不足");
    }
  }, []);

  // 更新單一班級
  const updateClass = useCallback((updatedClass) => {
    setClasses(prevClasses => {
      const newClasses = prevClasses.map(c => 
        c.id === updatedClass.id ? updatedClass : c
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newClasses));
      return newClasses;
    });
  }, []);

  return {
    classes,
    loading,
    refreshClasses, // 當 App 切換 Tab 時可以呼叫這個
    saveClasses,
    updateClass
  };
};