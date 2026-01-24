// src/hooks/useClassState.js
import { useState, useEffect } from 'react';

// 定義預設值 (原封不動移過來)
const DEFAULT_CLASS = {
  id: 'default_class',
  name: '範例班級',
  students: [
    { id: 's1', number: '01', name: '王小明', gender: 'M', group: '1', locked: false },
    { id: 's2', number: '02', name: '陳小美', gender: 'F', group: '1', locked: false },
    { id: 's3', number: '03', name: '林大華', gender: 'M', group: '2', locked: false },
    { id: 's4', number: '04', name: '張雅婷', gender: 'F', group: '2', locked: false },
    { id: 's5', number: '05', name: '李志豪', gender: 'M', group: '3', locked: false },
    { id: 's6', number: '06', name: '謝小芬', gender: 'F', group: '3', locked: false },
    { id: 's7', number: '07', name: '劉阿宏', gender: 'M', group: '4', locked: false },
    { id: 's8', number: '08', name: '蔡依依', gender: 'F', group: '4', locked: false },
  ],
  layout: { rows: 4, cols: 8, doorSide: 'right', seats: {}, voidSeats: [] },
  groupScores: {}, scoreLogs: [], attendanceRecords: {},
  behaviors: [
    { id: 'b1', icon: '👍', label: '發表意見', score: 1, type: 'positive' },
    { id: 'b2', icon: '🤝', label: '幫助同學', score: 1, type: 'positive' },
    { id: 'b3', icon: '🤫', label: '秩序良好', score: 1, type: 'positive' },
    { id: 'b4', icon: '💤', label: '上課睡覺', score: -1, type: 'negative' },
    { id: 'b5', icon: '🗣️', label: '干擾秩序', score: -1, type: 'negative' },
  ]
};

const MAX_HISTORY = 20;

export const useClassState = () => {
    const [classes, setClasses] = useState(() => {
        try {
            const saved = localStorage.getItem('schooltool_classes');
            return saved ? JSON.parse(saved) : [DEFAULT_CLASS];
        } catch (e) { return [DEFAULT_CLASS]; }
    });

    const [currentClassId, setCurrentClassId] = useState(() => classes[0]?.id);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const currentClass = classes.find(c => c.id === currentClassId) || classes[0];

    // LocalStorage 同步
    useEffect(() => {
        localStorage.setItem('schooltool_classes', JSON.stringify(classes));
    }, [classes]);

    // History 初始化
    useEffect(() => {
        if (history.length === 0) {
            setHistory([{ classes, currentClassId }]);
            setHistoryIndex(0);
        }
    }, []);

    const updateState = (newClasses, newCurrentId) => {
        setClasses(newClasses);
        if (newCurrentId) setCurrentClassId(newCurrentId);

        setHistory(prev => {
            const upToNow = prev.slice(0, historyIndex + 1);
            const newItem = { classes: newClasses, currentClassId: newCurrentId || currentClassId };
            const next = [...upToNow, newItem];
            if (next.length > MAX_HISTORY) next.shift();
            return next;
        });
        setHistoryIndex(prev => {
            const nextIdx = prev + 1;
            return nextIdx >= MAX_HISTORY ? MAX_HISTORY - 1 : nextIdx;
        });
    };

    const updateClass = (updatedClass) => {
        const newClasses = classes.map(c => c.id === updatedClass.id ? updatedClass : c);
        updateState(newClasses, null);
    };

    const updateAllClasses = (newClasses, newCurrentId) => {
        updateState(newClasses, newCurrentId);
    };

    const undo = () => {
        if (historyIndex > 0) {
            const prevIndex = historyIndex - 1;
            const prevState = history[prevIndex];
            setClasses(prevState.classes);
            setCurrentClassId(prevState.currentClassId);
            setHistoryIndex(prevIndex);
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const nextIndex = historyIndex + 1;
            const nextState = history[nextIndex];
            setClasses(nextState.classes);
            setCurrentClassId(nextState.currentClassId);
            setHistoryIndex(nextIndex);
        }
    };

    // 其他 CRUD 輔助
    const addClass = (name) => {
        const newClass = { ...DEFAULT_CLASS, id: `c_${Date.now()}`, name: name.trim(), students: [], layout: { rows: 4, cols: 8, doorSide: 'right', seats: {}, voidSeats: [] }, scoreLogs: [] };
        updateAllClasses([...classes, newClass], newClass.id);
    };

    const deleteClass = () => {
        const newClasses = classes.filter(c => c.id !== currentClass.id);
        updateAllClasses(newClasses, newClasses[0]?.id);
    };

    const importData = (data) => {
        if (data.classes && Array.isArray(data.classes)) {
            updateAllClasses(data.classes, data.classes[0]?.id);
        }
    };

    return {
        classes, currentClass, currentClassId, setCurrentClassId,
        historyIndex, historyLength: history.length,
        updateClass, updateAllClasses,
        addClass, deleteClass, importData,
        undo, redo,
        DEFAULT_CLASS 
    };
};