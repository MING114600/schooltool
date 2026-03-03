export const STANDARD_TIME_SLOTS = [
    { id: 'arrival', name: '上學時間', start: '07:20', end: '07:50', type: 'break' },
    { id: 'morning', name: '晨光時間', start: '07:50', end: '08:25', type: 'class' },
    { id: 'break1', name: '下課', start: '08:25', end: '08:30', type: 'break' },
    { id: 'p1', name: '第一節', start: '08:30', end: '09:10', type: 'class' },
    { id: 'break2', name: '下課', start: '09:10', end: '09:20', type: 'break' },
    { id: 'p2', name: '第二節', start: '09:20', end: '10:00', type: 'class' },
    { id: 'break3', name: '大下課', start: '10:00', end: '10:20', type: 'break' },
    { id: 'p3', name: '第三節', start: '10:20', end: '11:00', type: 'class' },
    { id: 'break4', name: '下課', start: '11:00', end: '11:10', type: 'break' },
    { id: 'p4', name: '第四節', start: '11:10', end: '11:50', type: 'class' },
    { id: 'lunch_prep', name: '準備午餐', start: '11:50', end: '12:00', type: 'break' },
    { id: 'lunch', name: '午餐時間', start: '12:00', end: '12:40', type: 'break' },
    { id: 'nap', name: '午休時間', start: '12:40', end: '13:15', type: 'break' },
    { id: 'break_noon', name: '準備上課', start: '13:15', end: '13:20', type: 'break' },
    { id: 'p5', name: '第五節', start: '13:20', end: '14:00', type: 'class' },
    { id: 'break6', name: '下課', start: '14:00', end: '14:10', type: 'break' },
    { id: 'p6', name: '第六節', start: '14:10', end: '14:50', type: 'class' },
    { id: 'cleaning', name: '打掃時間', start: '14:50', end: '15:10', type: 'break' },
    { id: 'p7', name: '第七節', start: '15:10', end: '15:50', type: 'class' },
    { id: 'after', name: '放學', start: '15:50', end: '16:10', type: 'break' },
];

export const ATTENDANCE_CYCLE = ['present', 'personal', 'absent', 'late'];

export const SYSTEM_CONFIG = {
    MAX_ROWS: 10,
    MAX_COLS: 10,
    DEFAULT_ROWS: 4,
    DEFAULT_COLS: 8,
    UNDO_LIMIT: 20,
    PREP_MINUTES: 10,
};

export const MODAL_ID = {
    LAYOUT_TEMPLATE: 'layout_template',
    ATTENDANCE: 'attendance',
    BATCH_GROUP: 'batch_group',
    BEHAVIOR_SETTINGS: 'behavior_settings',
    EXPORT_STATS: 'export_stats',
    SCORING: 'scoring',
    EDIT_STUDENT: 'edit_student'
};
