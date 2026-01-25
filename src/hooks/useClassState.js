import { useState, useEffect, useCallback, useRef } from 'react';

// 預設資料
const DEFAULT_CLASS = {
  id: 'default_class',
  name: '範例班級',
  students: [
    { id: 's1', number: '01', name: '王小明', gender: 'M', group: '1', locked: false },
    { id: 's2', number: '02', name: '陳小美', gender: 'F', group: '1', locked: false },
  ],
  layout: { rows: 6, cols: 5, doorSide: 'right', seats: {}, voidSeats: [] },
  groupScores: {}, scoreLogs: [], attendanceRecords: {},
  behaviors: [
    { id: 'b1', icon: '👍', label: '發表意見', score: 1, type: 'positive' },
    { id: 'b2', icon: '🤝', label: '幫助同學', score: 1, type: 'positive' },
    { id: 'b3', icon: '🤫', label: '秩序良好', score: 1, type: 'positive' },
    { id: 'b4', icon: '💤', label: '上課睡覺', score: -1, type: 'negative' },
    { id: 'b5', icon: '🗣️', label: '干擾秩序', score: -1, type: 'negative' },
  ]
};

const STORAGE_KEY = 'schooltool_classes';
const MAX_HISTORY = 20;

export const useClassState = () => {
    // 1. 初始化狀態：使用惰性初始值 (Lazy Initializer) 減少重複解析
    const [classes, setClasses] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [DEFAULT_CLASS];
        } catch (e) { 
            console.error("讀取存檔失敗:", e);
            return [DEFAULT_CLASS]; 
        }
    });

    const [currentClassId, setCurrentClassId] = useState(classes[0]?.id);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const currentClass = classes.find(c => c.id === currentClassId) || classes[0];

    // 2. 效能優化：Debounced Save (防抖寫入)
    // 避免評分時每點擊一次就觸發一次硬碟寫入，改為停止操作後 1 秒再存檔
    const saveTimeoutRef = useRef(null);
    useEffect(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        
        saveTimeoutRef.current = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
        }, 1000);

        return () => clearTimeout(saveTimeoutRef.current);
    }, [classes]);

    // 3. 狀態更新核心邏輯
    const updateState = useCallback((newClasses, newCurrentId) => {
        setClasses(newClasses);
        if (newCurrentId) setCurrentClassId(newCurrentId);

        // 紀錄歷史紀錄以供 Undo/Redo
        setHistory(prev => {
            const upToNow = prev.slice(0, historyIndex + 1);
            const newItem = { classes: newClasses, currentClassId: newCurrentId || currentClassId };
            const next = [...upToNow, newItem];
            return next.slice(-MAX_HISTORY); // 限制歷史長度
        });
        setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
    }, [historyIndex, currentClassId]);

    const updateClass = useCallback((updatedClass) => {
        const newClasses = classes.map(c => c.id === updatedClass.id ? updatedClass : c);
        updateState(newClasses, null);
    }, [classes, updateState]);

    // 4. Undo / Redo 邏輯
    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            const prevState = history[prevIndex];
            setClasses(prevState.classes);
            setCurrentClassId(prevState.currentClassId);
            setHistoryIndex(prevIndex);
        }
    }, [historyIndex, history]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            const nextState = history[nextIndex];
            setClasses(nextState.classes);
            setCurrentClassId(nextState.currentClassId);
            setHistoryIndex(nextIndex);
        }
    }, [historyIndex, history]);

    // 5. CRUD 輔助功能 (整合自 useClassData)
    const addClass = (name) => {
        const newClass = { 
            ...DEFAULT_CLASS, 
            id: `c_${Date.now()}`, 
            name: name.trim() || '新班級',
            students: [],
            scoreLogs: [] 
        };
        updateState([...classes, newClass], newClass.id);
    };

    const deleteClass = () => {
        if (classes.length <= 1) return alert("至少需保留一個班級");
        const newClasses = classes.filter(c => c.id !== currentClass.id);
        updateState(newClasses, newClasses[0]?.id);
    };

    return {
        classes, 
        currentClass, 
        currentClassId, 
        setCurrentClassId,
        updateClass,
        addClass, 
        deleteClass,
        undo, 
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < history.length - 1
    };
};