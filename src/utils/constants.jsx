import React from 'react';
import {
  CheckCircle2, UserX, Clock, FileText,
  AlertCircle, PlayCircle, CheckSquare
} from 'lucide-react';

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


/**
 * 🎨 全域 UI 主題配色 (通用元件系統)
 * 用於統一 APP 的背景、卡片、按鈕與文字風格
 */
export const UI_THEME = {
  // 基礎背景
  BACKGROUND: 'bg-slate-100 dark:bg-slate-950', // APP 最底層背景
  CONTENT_AREA: 'bg-slate-200/50 dark:bg-slate-900/60', // 主要內容區塊背景 (略深於底層)
  
  // 表面 (卡片/側邊欄/彈窗)
  SURFACE_MAIN: 'bg-white dark:bg-slate-900', // 主要表面 (如 Sidebar)
  SURFACE_CARD: 'bg-white dark:bg-slate-800', // 卡片表面
  SURFACE_GLASS: 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-md', // 毛玻璃效果 (如 Toolbar)
  
  // 邊框
  BORDER_DEFAULT: 'border-slate-200 dark:border-slate-700', // 標準邊框
  BORDER_LIGHT: 'border-slate-100 dark:border-slate-800', // 輕微邊框
  
  // 文字
  TEXT_PRIMARY: 'text-slate-900 dark:text-white', // 主要文字
  TEXT_SECONDARY: 'text-slate-500 dark:text-slate-400', // 次要文字
  TEXT_MUTED: 'text-slate-400 dark:text-slate-500', // 提示/微弱文字
  TEXT_LIGHT: 'text-blue-400 dark:text-amber-500', // 提示/發亮文字
  
  // 按鈕樣式 (含 Hover/Active 互動)
  BTN_PRIMARY: 'bg-slate-800 dark:bg-slate-700 text-white hover:bg-slate-700 dark:hover:bg-slate-600 shadow-sm active:scale-95 transition-all',
  BTN_SECONDARY: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-95 transition-all shadow-sm',
  BTN_GHOST: 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
  BTN_DANGER: 'bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 shadow-sm transition-all',
  
  // 輸入框
  INPUT_BASE: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none',
};

/**
 * 🎨 小組主題配色 (優化版：整合 Light/Dark 模式)
 * 直接將 dark: class 整合進對應屬性，使用時更直覺
 */
export const GROUP_THEME = {
  0: { 
    border: 'border-slate-200 dark:border-slate-700', 
    text: 'text-slate-500 dark:text-slate-400', 
    bg: 'bg-white dark:bg-slate-800' 
  },
  1: { 
    border: 'border-red-400 dark:border-red-500/60', 
    text: 'text-red-600 dark:text-red-300', 
    bg: 'bg-red-50 dark:bg-red-900/40' 
  },
  2: { 
    border: 'border-orange-400 dark:border-orange-500/60', 
    text: 'text-orange-600 dark:text-orange-300', 
    bg: 'bg-orange-50 dark:bg-orange-900/40' 
  },
  3: { 
    border: 'border-amber-400 dark:border-amber-500/60', 
    text: 'text-amber-600 dark:text-amber-300', 
    bg: 'bg-amber-50 dark:bg-amber-900/40' 
  },
  4: { 
    border: 'border-emerald-400 dark:border-emerald-500/60', 
    text: 'text-emerald-600 dark:text-emerald-300', 
    bg: 'bg-emerald-50 dark:bg-emerald-900/40' 
  },
  5: { 
    border: 'border-cyan-400 dark:border-cyan-500/60', 
    text: 'text-cyan-600 dark:text-cyan-300', 
    bg: 'bg-cyan-50 dark:bg-cyan-900/40' 
  },
  6: { 
    border: 'border-blue-400 dark:border-blue-500/60', 
    text: 'text-blue-600 dark:text-blue-300', 
    bg: 'bg-blue-50 dark:bg-blue-900/40' 
  },
  7: { 
    border: 'border-violet-400 dark:border-violet-500/60', 
    text: 'text-violet-600 dark:text-violet-300', 
    bg: 'bg-violet-50 dark:bg-violet-900/40' 
  },
  8: { 
    border: 'border-fuchsia-400 dark:border-fuchsia-500/60', 
    text: 'text-fuchsia-600 dark:text-fuchsia-300', 
    bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/40' 
  },
};

/**
 * 🚻 性別主題配色 (同樣整合 Light/Dark)
 */
export const GENDER_THEME = {
  M: { 
    border: 'border-blue-200 dark:border-blue-800', 
    text: 'text-blue-900 dark:text-blue-100', 
    bg: 'bg-blue-50/80 dark:bg-blue-900/40', 
    badge: 'bg-blue-500 dark:bg-blue-600',
    decoration: 'bg-blue-400 dark:bg-blue-500'
  },
  F: { 
    border: 'border-rose-200 dark:border-rose-800', 
    text: 'text-rose-900 dark:text-rose-100', 
    bg: 'bg-rose-50/80 dark:bg-rose-900/40', 
    badge: 'bg-rose-500 dark:bg-rose-600',
    decoration: 'bg-rose-400 dark:bg-rose-500'
  }
};

/**
 * 📊 狀態配置
 */
export const STATUS_CONFIG = {
  present: {
    label: '出席',
    icon: <CheckCircle2 size={16}/>,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-white dark:bg-slate-800',
    border: 'border-slate-200 dark:border-slate-700',
    isPresent: true
  },
  personal: {
    label: '請假',
    icon: <FileText size={16}/>,
    color: 'text-slate-400 dark:text-slate-400',
    bg: 'bg-slate-100 dark:bg-slate-900/80',
    border: 'border-slate-200 dark:border-slate-800',
    isPresent: false
  },
  absent: {
    label: '曠課',
    icon: <UserX size={16}/>,
    color: 'text-white',
    bg: 'bg-rose-500 dark:bg-rose-600',
    border: 'border-rose-600 dark:border-rose-500',
    isPresent: false
  },
  late: {
    label: '遲到',
    icon: <Clock size={16}/>,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-200 dark:border-amber-800',
    isPresent: true
  },
  examining: {
    label: '測驗中',
    icon: <PlayCircle size={16}/>,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
    border: 'border-blue-200 dark:border-blue-700',
    isPresent: true
  },
  submitted: {
    label: '已交卷',
    icon: <CheckSquare size={16}/>,
    color: 'text-indigo-600 dark:text-indigo-300',
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    border: 'border-indigo-200 dark:border-indigo-700',
    isPresent: true
  },
  warning: {
    label: '異常',
    icon: <AlertCircle size={16}/>,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/30',
    border: 'border-rose-200 dark:border-rose-700',
    isPresent: true
  }
};

export const ATTENDANCE_STATUS = STATUS_CONFIG;
export const ATTENDANCE_CYCLE = ['present', 'personal', 'absent', 'late'];

export const UI_DIMENSIONS = {
  SIDEBAR_WIDTH: 'w-80',
  TICKER_WIDTH: 'w-52',
  NAV_HEIGHT: 'h-16',
  CARD_ASPECT_RATIO: 'aspect-[3/2]'
};

export const SYSTEM_CONFIG = {
  MAX_ROWS: 10,
  MAX_COLS: 10,
  DEFAULT_ROWS: 4,
  DEFAULT_COLS: 8,
  UNDO_LIMIT: 20
};