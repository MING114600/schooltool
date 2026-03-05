import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const HistoryCalendar = ({ logs, currentDate, onSelectDate }) => {
    const [viewDate, setViewDate] = useState(() => {
        const d = currentDate ? new Date(currentDate + 'T00:00:00') : new Date();
        return { year: d.getFullYear(), month: d.getMonth() };
    });

    // 有紀錄的日期 Set（快速查詢用）
    const logDates = useMemo(() => new Set(logs.map(l => l.date)), [logs]);

    // 今天的日期字串
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    // 產生月曆格子
    const calendarDays = useMemo(() => {
        const { year, month } = viewDate;
        const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];

        // 填充前面的空白
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        // 填充日期
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push(dateStr);
        }
        return days;
    }, [viewDate]);

    const goMonth = (delta) => {
        setViewDate(prev => {
            let m = prev.month + delta;
            let y = prev.year;
            if (m < 0) { m = 11; y--; }
            if (m > 11) { m = 0; y++; }
            return { year: y, month: m };
        });
    };

    const monthLabel = `${viewDate.year} 年 ${viewDate.month + 1} 月`;

    return (
        <div className="select-none">
            {/* 月份導航 */}
            <div className="flex items-center justify-between mb-2">
                <button
                    onClick={() => goMonth(-1)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 cursor-default">
                    {monthLabel}
                </span>
                <button
                    onClick={() => goMonth(1)}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-500"
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* 星期標頭 */}
            <div className="grid grid-cols-7 gap-0.5 mb-1">
                {WEEKDAYS.map(d => (
                    <div key={d} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 py-0.5">
                        {d}
                    </div>
                ))}
            </div>

            {/* 日期格子 */}
            <div className="grid grid-cols-7 gap-0.5">
                {calendarDays.map((dateStr, i) => {
                    if (!dateStr) return <div key={`empty-${i}`} />;

                    const day = parseInt(dateStr.split('-')[2]);
                    const isToday = dateStr === todayStr;
                    const isSelected = dateStr === currentDate;
                    const hasLog = logDates.has(dateStr);

                    return (
                        <button
                            key={dateStr}
                            onClick={() => onSelectDate(dateStr)}
                            className={`
                                relative text-xs py-1.5 rounded-md transition-all text-center
                                ${isSelected
                                    ? 'bg-indigo-500 text-white font-bold shadow-sm'
                                    : isToday
                                        ? 'ring-1 ring-indigo-400 text-indigo-600 dark:text-indigo-400 font-bold'
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }
                            `}
                        >
                            {day}
                            {/* 有紀錄的小圓點 */}
                            {hasLog && !isSelected && (
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-400" />
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default HistoryCalendar;
