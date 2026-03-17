import React from 'react';
import {
    CheckCircle2, UserX, Clock, FileText,
    AlertCircle, PlayCircle, CheckSquare
} from 'lucide-react';

/**
 * 🎨 全域 UI 主題配色 (通用元件系統)
 * 用於統一 APP 的背景、卡片、按鈕與文字風格
 */
export const UI_THEME = {
    // 基礎背景 - 使用 stone 與 zinc 的混搭，打造質樸溫暖的無侵略感
    BACKGROUND: 'bg-stone-50 dark:bg-zinc-950',
    CONTENT_AREA: 'bg-stone-100/50 dark:bg-zinc-900/60',

    // 表面 (卡片/側邊欄/彈窗) - 降低不必要的層次，陰影取代實線
    SURFACE_MAIN: 'bg-white dark:bg-zinc-900',
    SURFACE_CARD: 'bg-white dark:bg-zinc-900 shadow-sm border border-stone-100 dark:border-zinc-800/60',
    SURFACE_GLASS: 'bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl',

    // 邊框
    BORDER_DEFAULT: 'border-stone-200 dark:border-zinc-800',
    BORDER_LIGHT: 'border-stone-100 dark:border-zinc-800/50',

    // 文字
    TEXT_PRIMARY: 'text-zinc-800 dark:text-zinc-100',
    TEXT_SECONDARY: 'text-zinc-500 dark:text-zinc-400',
    TEXT_MUTED: 'text-zinc-400 dark:text-zinc-500',
    TEXT_LIGHT: 'text-indigo-400 dark:text-amber-500',

    // 按鈕樣式 - 收斂 scale 動畫，改用亮度/透明度過渡
    BTN_PRIMARY: 'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white shadow-sm active:scale-[0.98] transition-all duration-300',
    BTN_SECONDARY: 'bg-white dark:bg-zinc-800 border-none text-zinc-700 dark:text-zinc-200 hover:bg-stone-50 dark:hover:bg-zinc-700 active:scale-[0.98] transition-all duration-300 shadow-sm',
    BTN_GHOST: 'text-zinc-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition-colors duration-300 rounded-lg',
    BTN_DANGER: 'bg-white dark:bg-zinc-800 border-none text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 shadow-sm transition-all duration-300 active:scale-[0.98]',
    BTN_HOVER: 'p-2 rounded-lg hover:bg-stone-100 dark:hover:bg-zinc-800 active:scale-[0.98] transition-all duration-200 text-zinc-500 dark:text-zinc-400',

    // 輸入框
    INPUT_BASE: 'bg-white dark:bg-zinc-800/50 border border-stone-200 dark:border-zinc-700/80 text-zinc-800 dark:text-zinc-100 rounded-lg focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 outline-none transition-all',
};

/**
 * 🎨 小組主題配色 (Soft UI版 - 拿掉濃烈色彩)
 */
export const GROUP_THEME = {
    0: { border: 'border-stone-200 dark:border-zinc-700', text: 'text-zinc-500 dark:text-zinc-400', bg: 'bg-white dark:bg-zinc-800' },
    1: { border: 'border-rose-300 dark:border-rose-900/50', text: 'text-rose-600 dark:text-rose-300', bg: 'bg-rose-50/50 dark:bg-rose-950/30' },
    2: { border: 'border-orange-300 dark:border-orange-900/50', text: 'text-orange-600 dark:text-orange-300', bg: 'bg-orange-50/50 dark:bg-orange-950/30' },
    3: { border: 'border-amber-300 dark:border-amber-900/50', text: 'text-amber-600 dark:text-amber-300', bg: 'bg-amber-50/50 dark:bg-amber-950/30' },
    4: { border: 'border-emerald-300 dark:border-emerald-900/50', text: 'text-emerald-600 dark:text-emerald-300', bg: 'bg-emerald-50/50 dark:bg-emerald-950/30' },
    5: { border: 'border-teal-300 dark:border-teal-900/50', text: 'text-teal-600 dark:text-teal-300', bg: 'bg-teal-50/50 dark:bg-teal-950/30' },
    6: { border: 'border-sky-300 dark:border-sky-900/50', text: 'text-sky-600 dark:text-sky-300', bg: 'bg-sky-50/50 dark:bg-sky-950/30' },
    7: { border: 'border-indigo-300 dark:border-indigo-900/50', text: 'text-indigo-600 dark:text-indigo-300', bg: 'bg-indigo-50/50 dark:bg-indigo-950/30' },
    8: { border: 'border-fuchsia-300 dark:border-fuchsia-900/50', text: 'text-fuchsia-600 dark:text-fuchsia-300', bg: 'bg-fuchsia-50/50 dark:bg-fuchsia-950/30' },
};

/**
 * 🚻 性別主題配色 (降度低飽和)
 */
export const GENDER_THEME = {
    M: {
        border: 'border-indigo-200 dark:border-indigo-900/50',
        text: 'text-indigo-800 dark:text-indigo-200',
        bg: 'bg-indigo-50/50 dark:bg-indigo-950/30',
        badge: 'bg-indigo-500/90 dark:bg-indigo-600/90',
        decoration: 'bg-indigo-400 dark:bg-indigo-500'
    },
    F: {
        border: 'border-rose-200 dark:border-rose-900/50',
        text: 'text-rose-800 dark:text-rose-200',
        bg: 'bg-rose-50/50 dark:bg-rose-950/30',
        badge: 'bg-rose-500/90 dark:bg-rose-600/90',
        decoration: 'bg-rose-400 dark:bg-rose-500'
    }
};

/**
 * 📊 狀態配置 (Soft UI，不再使用正色)
 */
export const STATUS_CONFIG = {
    present: {
        label: '出席',
        icon: <CheckCircle2 size={16} />,
        color: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-white dark:bg-zinc-800',
        border: 'border-stone-200 dark:border-zinc-700',
        isPresent: true
    },
    personal: {
        label: '請假',
        icon: <FileText size={16} />,
        color: 'text-zinc-400 dark:text-zinc-500',
        bg: 'bg-stone-50 dark:bg-zinc-900/80',
        border: 'border-stone-200 dark:border-zinc-800',
        isPresent: false
    },
    absent: {
        label: '曠課',
        icon: <UserX size={16} />,
        color: 'text-rose-600 dark:text-rose-400',
        bg: 'bg-rose-50/80 dark:bg-rose-900/30',
        border: 'border-rose-200 dark:border-rose-800/50',
        isPresent: false
    },
    late: {
        label: '遲到',
        icon: <Clock size={16} />,
        color: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50/80 dark:bg-amber-950/40',
        border: 'border-amber-200 dark:border-amber-800/50',
        isPresent: true
    },
    examining: {
        label: '測驗中',
        icon: <PlayCircle size={16} />,
        color: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-50/80 dark:bg-indigo-900/30',
        border: 'border-indigo-200 dark:border-indigo-800/50',
        isPresent: true
    },
    submitted: {
        label: '已交卷',
        icon: <CheckSquare size={16} />,
        color: 'text-teal-600 dark:text-teal-400',
        bg: 'bg-teal-50/80 dark:bg-teal-900/30',
        border: 'border-teal-200 dark:border-teal-800/50',
        isPresent: true
    },
    warning: {
        label: '異常',
        icon: <AlertCircle size={16} />,
        color: 'text-rose-500 dark:text-rose-400',
        bg: 'bg-rose-50/80 dark:bg-rose-900/30',
        border: 'border-rose-200 dark:border-rose-800/50',
        isPresent: true
    }
};

export const ATTENDANCE_STATUS = STATUS_CONFIG;

export const UI_DIMENSIONS = {
    SIDEBAR_WIDTH: 'w-80',
    TICKER_WIDTH: 'w-52',
    NAV_HEIGHT: 'h-16',
    CARD_ASPECT_RATIO: 'aspect-[3/2]'
};
