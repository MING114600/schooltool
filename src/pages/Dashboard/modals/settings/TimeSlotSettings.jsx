import React from 'react';
import { Clock, Trash2, Plus } from 'lucide-react';
import { UI_THEME } from '../../../../constants';
import SettingsSection from './SettingsSection';

const TimeSlotSettings = ({
    timeSlots,
    setTimeSlots,
    schedule,
    setSchedule,
    is24Hour,
    setIs24Hour,
    dayTypes,
    setDayTypes,
    timeOffset,
    setTimeOffset,
    isOpen,
    onToggle
}) => {
    const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

    // --- 邏輯區 (從 SettingsModal 搬過來) ---

    const handleTimeSlotChange = (id, field, value) => {
        const newSlots = timeSlots.map(slot =>
            slot.id === id ? { ...slot, [field]: value } : slot
        );
        // 自動排序：根據開始時間排序，避免時段亂跳
        newSlots.sort((a, b) => a.start.localeCompare(b.start));
        setTimeSlots(newSlots);
    };

    const handleAddSlot = () => {
        const newId = `custom_${Date.now()}`;
        const newSlot = {
            id: newId,
            name: '新時段',
            start: '00:00',
            end: '00:00',
            type: 'break'
        };
        setTimeSlots([...timeSlots, newSlot]);
    };

    const handleDeleteSlot = (id) => {
        if (confirm('確定要刪除此時段嗎？這將會一併清除該時段的課表資料。')) {
            // 1. 刪除時段
            setTimeSlots(timeSlots.filter(s => s.id !== id));

            // 2. 清理課表 (schedule) 中對應的垃圾資料
            const newSchedule = { ...schedule };
            Object.keys(newSchedule).forEach(day => {
                if (newSchedule[day][id]) delete newSchedule[day][id];
            });
            setSchedule(newSchedule);
        }
    };

    // 通用樣式 (低調暖灰色系)
    const inputStyle = `bg-stone-50 dark:bg-zinc-800 border-none focus:bg-white dark:focus:bg-zinc-900 focus:ring-2 focus:ring-amber-500/30 outline-none rounded-lg transition-all text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500`;

    return (
        <SettingsSection
            title="時間與作息管理"
            icon={Clock}
            theme="rose"
            isOpen={isOpen}
            onToggle={onToggle}
        >
            <div className="space-y-6">
                {/* 緊湊型全域控制列 (Compact Control Bar) */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-4 rounded-2xl bg-stone-50/50 dark:bg-zinc-800/30 border border-stone-100 dark:border-zinc-800">
                    
                    {/* 一週作息藥丸開關 */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
                            每週作息 
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-200/50 dark:bg-zinc-700/50 text-zinc-400">點擊切換全天半天</span>
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4, 5].map(day => (
                                <button
                                    key={day}
                                    onClick={() => setDayTypes(prev => ({ ...prev, [day]: dayTypes[day] === 'full' ? 'half' : 'full' }))}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border outline-none shadow-sm hover:shadow active:scale-95
                                        ${dayTypes[day] === 'full' 
                                            ? 'bg-amber-100/80 text-amber-700 border-amber-200/80 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-800/60' 
                                            : 'bg-white text-rose-500 border-rose-200/80 dark:bg-zinc-900 dark:text-rose-400 dark:border-zinc-700'}`}
                                    title="點擊切換"
                                >
                                    <span className={`opacity-70 ${dayTypes[day] === 'half' && 'text-zinc-400 dark:text-zinc-500'}`}>週{WEEKDAYS[day]}</span>
                                    <span>{dayTypes[day] === 'full' ? '全天' : '半天'}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 時間格式切換 */}
                    <div className="flex flex-col gap-2">
                        <span className="text-sm font-bold text-zinc-500 dark:text-zinc-400 hidden sm:block whitespace-nowrap">時間顯示</span>
                        <div className="flex bg-stone-100 dark:bg-zinc-900 rounded-xl p-1 shadow-inner ring-1 ring-stone-200/50 dark:ring-zinc-700/50">
                            <button
                                onClick={() => setIs24Hour(false)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all outline-none ${!is24Hour ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-800 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-600'}`}
                            >
                                12H
                            </button>
                            <button
                                onClick={() => setIs24Hour(true)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all outline-none ${is24Hour ? 'bg-white dark:bg-zinc-700 shadow-sm text-zinc-800 dark:text-zinc-100' : 'text-zinc-400 hover:text-zinc-600'}`}
                            >
                                24H
                            </button>
                        </div>
                    </div>
                </div>

                {/* 作息時段列表 */}
                <div className="space-y-4">
                    {/* 表頭 (使用固定寬度確保精準對齊) */}
                    <div className={`hidden md:flex items-center gap-6 text-xs font-bold px-4 uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1`}>
                        <div className="w-[110px] pl-1">時段名稱</div>
                        <div className="w-[280px] text-center">時間區間</div>
                        <div className="w-[140px] text-center ml-auto">類型</div>
                        <div className="w-12 text-center">操作</div>
                    </div>

                    {/* 列表 - 支援響應式 */}
                    {timeSlots.map((slot) => (
                        <div key={slot.id} className={`flex flex-col md:flex-row gap-3 md:gap-6 md:items-center p-3 md:p-2.5 rounded-2xl md:rounded-xl border border-stone-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] transition-all duration-300`}>

                            {/* 時段名稱 (110px 剛好容納 5-6 個中文字) */}
                            <div className="w-full md:w-[110px] flex-shrink-0">
                                <input
                                    value={slot.name}
                                    onChange={(e) => handleTimeSlotChange(slot.id, 'name', e.target.value)}
                                    className={`w-full font-bold px-3 py-2 text-center md:text-left ${inputStyle}`}
                                    placeholder="例: 第一節"
                                    maxLength={12}
                                />
                            </div>

                            {/* 時間區間 (擴大至 280px 以容納「上午/下午」顯示) */}
                            <div className="w-full md:w-[280px] flex-shrink-0 flex items-center justify-center gap-2">
                                <div className="flex-1 flex items-center gap-2">
                                    <span className="md:hidden text-xs text-zinc-400 font-bold whitespace-nowrap">開始</span>
                                    <input
                                        type="time"
                                        value={slot.start}
                                        onChange={(e) => handleTimeSlotChange(slot.id, 'start', e.target.value)}
                                        className={`w-full min-w-[110px] font-mono font-bold text-center px-1 md:px-2 py-2 ${inputStyle}`}
                                    />
                                </div>
                                <span className="text-zinc-300 dark:text-zinc-600 font-bold">-</span>
                                <div className="flex-1 flex items-center gap-2">
                                    <span className="md:hidden text-xs text-zinc-400 font-bold whitespace-nowrap">結束</span>
                                    <input
                                        type="time"
                                        value={slot.end}
                                        onChange={(e) => handleTimeSlotChange(slot.id, 'end', e.target.value)}
                                        className={`w-full min-w-[110px] font-mono font-bold text-center px-1 md:px-2 py-2 ${inputStyle}`}
                                    />
                                </div>
                            </div>

                            {/* 類型開關 */}
                            <div className="w-full md:w-auto md:ml-auto flex flex-shrink-0 justify-center mt-2 md:mt-0">
                                <button
                                    onClick={() => handleTimeSlotChange(slot.id, 'type', slot.type === 'class' ? 'break' : 'class')}
                                    className={`group relative flex items-center h-[38px] p-1 rounded-xl w-[140px] transition-all duration-300 outline-none select-none overflow-hidden
                              ${slot.type === 'class' ? 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 ring-1 ring-amber-200 dark:ring-amber-800' : 'bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 ring-1 ring-stone-200 dark:ring-zinc-700'}`}
                                    title="點擊切換上課/下課"
                                >
                                    {/* 背景滑塊 */}
                                    <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg bg-white dark:bg-zinc-700 shadow-[0_2px_8px_rgba(0,0,0,0.12)] transition-all duration-300 ease-spring pointer-events-none
                              ${slot.type === 'class' ? 'left-[calc(50%+2px)]' : 'left-1'}`}>
                                    </div>

                                    {/* 左側：下課 */}
                                    <div className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 h-full transition-all duration-300 ${slot.type === 'class' ? 'opacity-40 scale-90' : 'opacity-100 scale-100'}`}>
                                        <span className="text-sm">☕</span>
                                        <span className="text-xs font-bold leading-none mt-0.5">下課</span>
                                    </div>

                                    {/* 右側：上課 */}
                                    <div className={`relative z-10 flex-1 flex items-center justify-center gap-1.5 h-full transition-all duration-300 ${slot.type === 'break' ? 'opacity-40 scale-90' : 'opacity-100 scale-100'}`}>
                                        <span className="text-sm shadow-amber-500/20 drop-shadow-sm">📚</span>
                                        <span className="text-xs font-bold leading-none mt-0.5">上課</span>
                                    </div>
                                </button>
                            </div>

                            {/* 刪除按鈕 */}
                            <div className="flex-1 flex justify-end md:justify-center">
                                <button
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors duration-300 outline-none"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {/* 新增按鈕 */}
                    <button
                        onClick={handleAddSlot}
                        className="w-full py-4 mt-4 border-2 border-dashed border-stone-200 dark:border-zinc-700/80 rounded-2xl text-zinc-400 font-bold hover:bg-stone-50 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300 transition-all duration-300 outline-none flex items-center justify-center gap-2"
                    >
                        <Plus size={20} /> 新增時間段
                    </button>
                </div>
            </div>
        </SettingsSection>
    );
};

export default TimeSlotSettings;