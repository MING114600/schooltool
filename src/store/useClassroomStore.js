import { create } from 'zustand';
import { getAllItems, saveItem, deleteItem, STORES, migrateDataIfNeeded } from '../services/idbService';
import { calculateShuffledSeats } from '../utils/seatAlgorithms';
import { ATTENDANCE_STATUS } from '../constants';
import { playAudio } from '../services/audioService';

const MAX_HISTORY = 20;
const CLASS_ID_KEY = 'schooltool_current_class_id';
const MAX_LOGS = 100;
const MILESTONE_STEP = 10;

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
    groupScores: {},
    scoreLogs: [],
    attendanceRecords: {},
    behaviors: [
        { id: 'b1', icon: '👍', label: '發表意見', score: 1, type: 'positive' },
        { id: 'b2', icon: '🤝', label: '幫助同學', score: 1, type: 'positive' },
        { id: 'b3', icon: '🤫', label: '秩序良好', score: 1, type: 'positive' },
        { id: 'b4', icon: '💤', label: '上課睡覺', score: -1, type: 'negative' },
        { id: 'b5', icon: '🗣️', label: '干擾秩序', score: -1, type: 'negative' },
    ]
};

const DEFAULT_TEMPLATES = [
    { id: 'tpl_standard', name: '一般教室配置', type: 'preset', description: '清空走道模式，標準直排 (6排x5列)' },
    { id: 'tpl_group', name: '小組隊形 (6組)', type: 'preset', description: '8排x7列 (含走道)，分為6個島嶼' },
    { id: 'tpl_u_shape', name: 'U型會議配置', type: 'preset', description: '6排x7列，前方中央區域留空' },
];

export const useClassroomStore = create((set, get) => ({
    // 1. State Variables
    classes: [DEFAULT_CLASS],
    currentClassId: null,
    isLoading: true,
    historyState: { history: [], index: -1 },
    seatMode: 'replace',
    templates: [],
    hoveredGroup: null,
    groupBoardMode: 'entity',
    feedbacks: [],

    // --- Core Lifecycle ---
    initStore: async () => {
        await migrateDataIfNeeded();
        const dbClasses = await getAllItems(STORES.CLASSES);

        let initialClasses = dbClasses.length > 0 ? dbClasses : [DEFAULT_CLASS];
        let initialClassId = localStorage.getItem(CLASS_ID_KEY) || initialClasses[0]?.id || DEFAULT_CLASS.id;

        // Load templates
        const savedTemplatesJSON = localStorage.getItem('schooltool_templates');
        let customTemplates = [];
        if (savedTemplatesJSON) {
            try { customTemplates = JSON.parse(savedTemplatesJSON).filter(t => t.type === 'custom'); }
            catch (e) { console.error(e); }
        }

        set({
            classes: initialClasses,
            currentClassId: initialClassId,
            isLoading: false,
            historyState: {
                history: [{ classes: initialClasses, currentClassId: initialClassId }],
                index: 0
            },
            templates: [...DEFAULT_TEMPLATES, ...customTemplates]
        });
    },

    debouncedSaveTimeout: null,

    _scheduleSave: () => {
        const { classes, isLoading, debouncedSaveTimeout } = get();
        if (isLoading || classes.length === 0) return;

        if (debouncedSaveTimeout) clearTimeout(debouncedSaveTimeout);

        const timeout = setTimeout(async () => {
            for (const cls of classes) { await saveItem(STORES.CLASSES, cls); }
        }, 1000);

        set({ debouncedSaveTimeout: timeout });
    },

    // 2. Core Updates
    updateState: (newClasses, newCurrentId) => {
        const { historyState, currentClassId } = get();
        const targetId = newCurrentId || currentClassId;

        if (newCurrentId) localStorage.setItem(CLASS_ID_KEY, newCurrentId);

        const newHistory = historyState.history.slice(0, historyState.index + 1);
        newHistory.push({ classes: newClasses, currentClassId: targetId });
        if (newHistory.length > MAX_HISTORY) newHistory.shift();

        set({
            classes: newClasses,
            currentClassId: targetId,
            historyState: { history: newHistory, index: newHistory.length - 1 }
        });

        get()._scheduleSave();
    },

    updateClass: (updatedClass) => {
        const { classes } = get();
        const newClasses = classes.map(c => c.id === updatedClass.id ? updatedClass : c);
        get().updateState(newClasses);
    },

    // --- CRUD Classes ---
    setCurrentClassId: (id) => {
        localStorage.setItem(CLASS_ID_KEY, id);
        get().updateState(get().classes, id);
    },

    addClass: (name) => {
        const newClass = {
            ...DEFAULT_CLASS,
            id: `c_${Date.now()}`,
            name: name.trim() || '新班級',
            students: [], scoreLogs: []
        };
        get().updateState([...get().classes, newClass], newClass.id);
    },

    deleteClass: async () => {
        const { classes, currentClassId } = get();
        if (classes.length <= 1) return alert("至少需保留一個班級");

        const newClasses = classes.filter(c => c.id !== currentClassId);
        const nextClassId = newClasses[0]?.id;

        await deleteItem(STORES.CLASSES, currentClassId);
        get().updateState(newClasses, nextClassId);
    },

    // --- Undo/Redo ---
    canUndo: () => get().historyState.index > 0,
    canRedo: () => get().historyState.index < get().historyState.history.length - 1,

    undo: () => {
        const { historyState } = get();
        const { history, index } = historyState;
        if (index > 0) {
            const prevIndex = index - 1;
            const prevState = history[prevIndex];
            if (prevState) {
                if (prevState.currentClassId) localStorage.setItem(CLASS_ID_KEY, prevState.currentClassId);
                set({
                    classes: prevState.classes,
                    currentClassId: prevState.currentClassId,
                    historyState: { ...historyState, index: prevIndex }
                });
                get()._scheduleSave();
            }
        }
    },

    redo: () => {
        const { historyState } = get();
        const { history, index } = historyState;
        if (index < history.length - 1) {
            const nextIndex = index + 1;
            const nextState = history[nextIndex];
            if (nextState) {
                if (nextState.currentClassId) localStorage.setItem(CLASS_ID_KEY, nextState.currentClassId);
                set({
                    classes: nextState.classes,
                    currentClassId: nextState.currentClassId,
                    historyState: { ...historyState, index: nextIndex }
                });
                get()._scheduleSave();
            }
        }
    },

    // --- Seating Logic ---
    setSeatMode: (mode) => set({ seatMode: mode }),

    seatDrop: (studentId, targetRow, targetCol, sourceSeatKey) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;

        const newSeats = { ...currentClass.layout.seats };
        const targetSeatKey = `${targetRow}-${targetCol}`;
        const existingStudentIdAtTarget = newSeats[targetSeatKey];

        // Ensure student exists
        const studentIndex = currentClass.students.findIndex(s => s.id === studentId);
        if (studentIndex === -1) return;

        // Ensure we don't accidentally overwrite a locked student
        const targetStudent = currentClass.students.find(s => s.id === existingStudentIdAtTarget);
        if (targetStudent && targetStudent.locked) return; // Prevent dropping on a locked target

        if (get().seatMode === 'replace') {
            // Replace Mode: source takes target slot, existing target student is unassigned
            if (sourceSeatKey) {
                delete newSeats[sourceSeatKey];
            }
            newSeats[targetSeatKey] = studentId;
        } else {
            // Swap Mode (default): Exchange seats
            if (existingStudentIdAtTarget) {
                if (sourceSeatKey) {
                    newSeats[sourceSeatKey] = existingStudentIdAtTarget;
                }
            } else {
                if (sourceSeatKey) {
                    delete newSeats[sourceSeatKey];
                }
            }
            newSeats[targetSeatKey] = studentId;
        }

        get().updateClass({
            ...currentClass,
            layout: { ...currentClass.layout, seats: newSeats }
        });
    },

    toggleLock: (studentId) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;
        const updatedStudents = currentClass.students.map(s => s.id === studentId ? { ...s, locked: !s.locked } : s);
        get().updateClass({ ...currentClass, students: updatedStudents });
    },

    toggleVoid: (row, col) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;
        const key = `${row}-${col}`;
        const voidSeats = currentClass.layout.voidSeats || [];
        const newVoidSeats = voidSeats.includes(key) ? voidSeats.filter(k => k !== key) : [...voidSeats, key];
        const newSeats = { ...currentClass.layout.seats };
        if (newSeats[key]) delete newSeats[key];
        get().updateClass({ ...currentClass, layout: { ...currentClass.layout, voidSeats: newVoidSeats, seats: newSeats } });
    },

    toggleColumnVoid: (col) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;
        const { rows } = currentClass.layout;
        const voidSeats = currentClass.layout.voidSeats || [];

        let allVoid = true;
        for (let r = 0; r < rows; r++) {
            if (!voidSeats.includes(`${r}-${col}`)) {
                allVoid = false;
                break;
            }
        }

        let newVoidSeats = [...voidSeats];
        const newSeats = { ...currentClass.layout.seats };

        if (allVoid) {
            // Restore all
            for (let r = 0; r < rows; r++) {
                newVoidSeats = newVoidSeats.filter(k => k !== `${r}-${col}`);
            }
        } else {
            // Set all to void
            for (let r = 0; r < rows; r++) {
                const key = `${r}-${col}`;
                if (!newVoidSeats.includes(key)) newVoidSeats.push(key);
                if (newSeats[key]) delete newSeats[key];
            }
        }
        get().updateClass({ ...currentClass, layout: { ...currentClass.layout, voidSeats: newVoidSeats, seats: newSeats } });
    },

    toggleRowVoid: (row) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;
        const { cols } = currentClass.layout;
        const voidSeats = currentClass.layout.voidSeats || [];

        let allVoid = true;
        for (let c = 0; c < cols; c++) {
            if (!voidSeats.includes(`${row}-${c}`)) {
                allVoid = false;
                break;
            }
        }

        let newVoidSeats = [...voidSeats];
        const newSeats = { ...currentClass.layout.seats };

        if (allVoid) {
            // Restore all
            for (let c = 0; c < cols; c++) {
                newVoidSeats = newVoidSeats.filter(k => k !== `${row}-${c}`);
            }
        } else {
            // Set all to void
            for (let c = 0; c < cols; c++) {
                const key = `${row}-${c}`;
                if (!newVoidSeats.includes(key)) newVoidSeats.push(key);
                if (newSeats[key]) delete newSeats[key];
            }
        }
        get().updateClass({ ...currentClass, layout: { ...currentClass.layout, voidSeats: newVoidSeats, seats: newSeats } });
    },

    clearSeats: () => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        get().updateClass({ ...currentClass, layout: { ...currentClass.layout, seats: {} } });
    },

    seatDrop: (studentId, row, col, sourceSeat) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;
        const { seatMode } = get();
        const newSeats = { ...currentClass.layout.seats };
        const targetKey = `${row}-${col}`;
        const targetStudentId = newSeats[targetKey];

        if (seatMode === 'swap' && targetStudentId && sourceSeat) {
            newSeats[targetKey] = studentId;
            newSeats[sourceSeat] = targetStudentId;
        } else {
            if (sourceSeat) delete newSeats[sourceSeat];
            else {
                const existingKey = Object.keys(newSeats).find(k => newSeats[k] === studentId);
                if (existingKey) delete newSeats[existingKey];
            }
            newSeats[targetKey] = studentId;
        }
        get().updateClass({ ...currentClass, layout: { ...currentClass.layout, seats: newSeats } });
    },

    sidebarDrop: (sourceSeat) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass || !sourceSeat) return;
        const newLayout = { ...currentClass.layout, seats: { ...currentClass.layout.seats } };
        delete newLayout.seats[sourceSeat];
        get().updateClass({ ...currentClass, layout: newLayout });
    },

    shuffleSeats: (mode) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;
        const lockedAssignments = {};
        Object.entries(currentClass.layout.seats).forEach(([key, studentId]) => {
            const student = currentClass.students.find(s => s.id === studentId);
            if (student && student.locked) lockedAssignments[key] = studentId;
        });
        const newSeats = calculateShuffledSeats(mode, currentClass.students, currentClass.layout, lockedAssignments);
        get().updateClass({ ...currentClass, layout: { ...currentClass.layout, seats: newSeats } });
    },

    saveTemplate: (name) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;
        const newTemplate = {
            id: `tpl_${Date.now()}`, name, type: 'custom',
            layout: { voidSeats: currentClass.layout.voidSeats, rows: currentClass.layout.rows, cols: currentClass.layout.cols }
        };
        const newTemplates = [...get().templates, newTemplate];
        set({ templates: newTemplates });
        localStorage.setItem('schooltool_templates', JSON.stringify(newTemplates));
    },

    deleteTemplate: (id) => {
        const newTemplates = get().templates.filter(t => t.id !== id);
        set({ templates: newTemplates });
        localStorage.setItem('schooltool_templates', JSON.stringify(newTemplates));
    },

    applyTemplate: (template) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;
        let newLayout = { ...currentClass.layout };
        if (template.type === 'custom') {
            newLayout.rows = template.layout.rows;
            newLayout.cols = template.layout.cols;
            newLayout.voidSeats = template.layout.voidSeats;
        } else {
            newLayout.voidSeats = [];
            if (template.id === 'tpl_standard') { newLayout.rows = 6; newLayout.cols = 5; }
            else if (template.id === 'tpl_group') {
                newLayout.rows = 8; newLayout.cols = 7;
                for (let y = 0; y < 7; y++) { newLayout.voidSeats.push(`${y}-2`, `${y}-5`); }
                for (let x = 0; x < 8; x++) { if (x !== 2 && x !== 5) newLayout.voidSeats.push(`3-${x}`); }
            } else if (template.id === 'tpl_u_shape') {
                newLayout.rows = 6; newLayout.cols = 7;
                for (let y = 0; y <= 3; y++) { newLayout.voidSeats.push(`${y}-2`, `${y}-3`); }
            }
        }
        const newSeats = { ...newLayout.seats };
        Object.keys(newSeats).forEach(key => {
            const [r, c] = key.split('-').map(Number);
            if (c >= newLayout.rows || r >= newLayout.cols || newLayout.voidSeats.includes(key)) delete newSeats[key];
        });
        newLayout.seats = newSeats;
        get().updateClass({ ...currentClass, layout: newLayout });
    },

    importStudentList: (newStudents) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;
        get().updateClass({
            ...currentClass,
            students: newStudents,
            layout: { ...currentClass.layout, seats: {}, rows: 4, cols: 8, doorSide: 'right', voidSeats: [] },
            scoreLogs: []
        });
    },

    // --- Scoring & Feedback Logic ---
    setHoveredGroup: (groupId) => set({ hoveredGroup: groupId }),
    setGroupBoardMode: (mode) => set({ groupBoardMode: mode }),

    scoreStudent: (targetId, behavior, mode) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;

        const timestamp = Date.now();
        const scoreValue = Number(behavior.value !== undefined ? behavior.value : (behavior.score || 0));
        const todayDate = new Date().toLocaleDateString('en-CA');
        const todayAttendance = currentClass.attendanceRecords?.[todayDate] || {};

        let targetStudents = [];
        if (mode === 'individual') targetStudents = currentClass.students.filter(s => s.id === targetId);
        else if (mode === 'class') targetStudents = currentClass.students;
        else if (mode === 'group_members') targetStudents = currentClass.students.filter(s => s.group === targetId);
        else if (mode === 'group') targetStudents = [];

        let validStudents = targetStudents;
        if (mode === 'class' || mode === 'group_members') {
            validStudents = targetStudents.filter(s => {
                const statusKey = todayAttendance[s.id] || 'present';
                if (ATTENDANCE_STATUS && ATTENDANCE_STATUS[statusKey]) return ATTENDANCE_STATUS[statusKey].isPresent;
                return statusKey !== 'absent' && statusKey !== 'personal' && statusKey !== 'leave' && statusKey !== 'sick';
            });
        }

        let targetName = '未知目標';
        if (mode === 'class') targetName = '全班同學';
        else if (mode === 'group') targetName = `第 ${targetId} 組 (小組)`;
        else if (mode === 'group_members') targetName = `第 ${targetId} 組 (全員)`;
        else if (mode === 'individual') targetName = targetStudents[0]?.name || '未知';

        const behaviorLabel = behavior.label || (behavior.isQuick ? (scoreValue > 0 ? '快速加分' : '快速扣分') : '評分');
        const effectType = behavior.type || (scoreValue > 0 ? 'positive' : scoreValue < 0 ? 'negative' : 'neutral');

        const newLog = {
            id: `log_${timestamp}_${Math.random()}`,
            targetId: targetId === 'all' ? 'all' : targetId,
            targetType: mode,
            targetName,
            behaviorId: behavior.id || 'quick',
            behaviorLabel,
            score: scoreValue,
            value: scoreValue,
            timestamp,
            effectType,
            count: validStudents.length,
            validStudentIds: validStudents.map(s => s.id)
        };

        let updates = {};
        let milestoneEvents = [];

        if (mode === 'group') {
            const currentGroupScores = currentClass.groupScores || {};
            const oldScore = currentGroupScores[targetId] || 0;
            const newScore = oldScore + scoreValue;
            updates.groupScores = { ...currentGroupScores, [targetId]: newScore };

            if (scoreValue > 0 && Math.floor(newScore / MILESTONE_STEP) > Math.floor(oldScore / MILESTONE_STEP)) {
                milestoneEvents.push({ type: 'group', id: targetId, score: Math.floor(newScore / MILESTONE_STEP) * MILESTONE_STEP });
            }
        } else {
            const validIds = new Set(validStudents.map(s => s.id));
            updates.students = currentClass.students.map(s => {
                if (validIds.has(s.id)) {
                    const oldScore = s.score || 0;
                    const newScore = oldScore + scoreValue;
                    if (scoreValue > 0 && Math.floor(newScore / MILESTONE_STEP) > Math.floor(oldScore / MILESTONE_STEP)) {
                        milestoneEvents.push({ type: 'student', id: s.id, score: Math.floor(newScore / MILESTONE_STEP) * MILESTONE_STEP });
                    }
                    return { ...s, score: newScore };
                }
                return s;
            });
        }

        const currentLogs = currentClass.scoreLogs || [];
        newLog.milestones = milestoneEvents;
        const updatedLogs = [...currentLogs, newLog].slice(-MAX_LOGS);
        get().updateClass({ ...currentClass, ...updates, scoreLogs: updatedLogs });

        // Audio Playback
        if (scoreValue > 0) {
            if (mode === 'class') playAudio('coin_class');
            else if (mode === 'group' || mode === 'group_members') playAudio('coin_group');
            else playAudio('coin');
        } else if (scoreValue < 0) {
            playAudio('negative');
        }

        const newFeedbacks = [];

        if (mode === 'group' || mode === 'group_members') {
            newFeedbacks.push({
                id: `fb_${timestamp}_GROUP`,
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                value: scoreValue,
                label: `第 ${targetId} 組加分`,
                type: 'group'
            });
        } else if (mode === 'class') {
            newFeedbacks.push({
                id: `fb_${timestamp}_CLASS`,
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                value: scoreValue,
                label: '全班加分',
                type: 'class'
            });
        }

        if (mode !== 'group' && mode !== 'class') {
            (validStudents || []).forEach((s, index) => {
                const el = document.getElementById(`student-card-${s.id}`);
                let rect = { left: window.innerWidth / 2 - 30, top: window.innerHeight / 2, width: 60 };
                if (el) rect = el.getBoundingClientRect();

                newFeedbacks.push({
                    id: `fb_${timestamp}_${s.id}_${Math.random()}`,
                    x: rect.left + rect.width / 2 - 20,
                    y: rect.top,
                    value: scoreValue,
                    delay: index * 10,
                    type: 'student'
                });
            });
        }

        milestoneEvents.forEach(event => {
            let x = window.innerWidth / 2;
            let y = window.innerHeight / 2;
            if (event.type === 'student') {
                const el = document.getElementById(`student-card-${event.id}`);
                if (el) {
                    const rect = el.getBoundingClientRect();
                    x = rect.left + rect.width / 2;
                    y = rect.top + rect.height / 2;
                }
            }
            newFeedbacks.push({
                id: `milestone_${timestamp}_${event.id}`,
                x, y, value: event.score, label: '里程碑達成！', type: 'milestone', milestoneType: event.type
            });
        });

        if (newFeedbacks.length > 0) {
            set(state => ({ feedbacks: [...state.feedbacks, ...newFeedbacks] }));
            setTimeout(() => {
                const idsToRemove = new Set(newFeedbacks.map(f => f.id));
                set(state => ({ feedbacks: state.feedbacks.filter(f => !idsToRemove.has(f.id)) }));
            }, 3000);
        }
        if (milestoneEvents.length > 0) setTimeout(() => { playAudio('applause'); }, 400);
    },

    resetScores: (type) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;
        let updates = {};
        if (type === 'student') {
            updates.students = currentClass.students.map(s => ({ ...s, score: 0 }));
            updates.scoreLogs = currentClass.scoreLogs.filter(log => log.targetType !== 'student');
        } else if (type === 'group') {
            updates.groupScores = {};
            updates.scoreLogs = currentClass.scoreLogs.filter(log => log.targetType !== 'group_entity');
        }
        get().updateClass({ ...currentClass, ...updates });
    },

    updateBehaviors: (newBehaviors) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;
        get().updateClass({ ...currentClass, behaviors: newBehaviors });
    },

    clearScoreLogs: () => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;
        get().updateClass({ ...currentClass, scoreLogs: [] });
    },

    updateAttendance: (date, statusMap) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;
        const newRecords = { ...(currentClass.attendanceRecords || {}), [date]: statusMap };
        get().updateClass({ ...currentClass, attendanceRecords: newRecords });
    },

    updateStudent: (updatedStudent) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;
        const newStudents = currentClass.students.map(s => s.id === updatedStudent.id ? updatedStudent : s);
        get().updateClass({ ...currentClass, students: newStudents });
    },

    updateStudents: (newStudents) => {
        const currentClass = get().classes.find(c => c.id === get().currentClassId);
        if (!currentClass) return;
        get().updateClass({ ...currentClass, students: newStudents });
    }

}));
