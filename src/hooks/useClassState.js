import { useState, useEffect, useCallback, useRef } from 'react';

// 預設資料
const DEFAULT_CLASS = {
  id: 'default_class',
  name: '範例班級',
  students: [
    { id: 's1', number: '01', name: '王小明', gender: 'M', group: '1', locked: false },
    { id: 's2', number: '02', name: '陳小美', gender: 'F', group: '1', locked: false },
	{ id: 's3', number: '03', name: '李小倫', gender: 'M', group: '2', locked: false },
	{ id: 's4', number: '04', name: '張小瑜', gender: 'M', group: '2', locked: false },
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
const CLASS_ID_KEY = 'schooltool_current_class_id'; // [新增] 用來記憶選擇的班級
const MAX_HISTORY = 20;

export const useClassState = () => {
    // 1. 初始化狀態
    const [classes, setClasses] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            return saved ? JSON.parse(saved) : [DEFAULT_CLASS];
        } catch (e) { 
            console.error("讀取存檔失敗:", e);
            return [DEFAULT_CLASS]; 
        }
    });

    const [currentClassId, setCurrentClassId] = useState(() => {
        const savedId = localStorage.getItem(CLASS_ID_KEY);
        if (savedId && classes.some(c => c.id === savedId)) {
            return savedId;
        }
        return classes[0]?.id;
    });
    
    // ★ 修正重點：合併 history 與 index，避免非同步更新導致脫節
    const [historyState, setHistoryState] = useState({
        history: [],
        index: -1
    });

    const currentClass = classes.find(c => c.id === currentClassId) || classes[0];

    // 2. 效能優化：Debounced Save (防抖寫入)
    const saveTimeoutRef = useRef(null);
    useEffect(() => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        
        saveTimeoutRef.current = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
        }, 1000);

        return () => clearTimeout(saveTimeoutRef.current);
    }, [classes]);
	
	useEffect(() => {
	  if (currentClassId) {
		localStorage.setItem(CLASS_ID_KEY, currentClassId);
	  }
	}, [currentClassId]);

    // 3. 狀態更新核心邏輯
    const updateState = (newClasses, newCurrentId) => {
    setClasses(newClasses);
    setCurrentClassId(newCurrentId);
    
    // 更新歷史紀錄
    const newHistory = historyState.history.slice(0, historyState.index + 1);
    newHistory.push({ classes: newClasses, currentClassId: newCurrentId });
    
    if (newHistory.length > MAX_HISTORY) newHistory.shift();
    
    setHistoryState({
        history: newHistory,
        index: newHistory.length - 1
      });
	};

    const updateClass = useCallback((updatedClass) => {
	  const newClasses = classes.map(c => c.id === updatedClass.id ? updatedClass : c);
	  updateState(newClasses, updatedClass.id); // 或 currentClassId
	}, [classes, currentClassId]);

    // 4. Undo / Redo 邏輯
    const undo = useCallback(() => {
        const { history, index } = historyState;
        if (index > 0) {
            const prevIndex = index - 1;
            const prevState = history[prevIndex];
            
            // 加入防呆檢查，避免 prevState 為 undefined 導致崩潰
            if (prevState) {
                setClasses(prevState.classes);
                setCurrentClassId(prevState.currentClassId);
                setHistoryState(prev => ({ ...prev, index: prevIndex }));
            }
        }
    }, [historyState]);

    const redo = useCallback(() => {
        const { history, index } = historyState;
        if (index < history.length - 1) {
            const nextIndex = index + 1;
            const nextState = history[nextIndex];
            
            if (nextState) {
                setClasses(nextState.classes);
                setCurrentClassId(nextState.currentClassId);
                setHistoryState(prev => ({ ...prev, index: nextIndex }));
            }
        }
    }, [historyState]);

    // 5. CRUD 輔助功能
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
        canUndo: historyState.index > 0,
        canRedo: historyState.index < historyState.history.length - 1
    };
};
