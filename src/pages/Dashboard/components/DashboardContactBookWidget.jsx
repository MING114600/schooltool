import React, { useEffect, useState } from 'react';
import { useContactBookStore } from '../../../store/useContactBookStore';
import ZhuyinRenderer from '../../../components/common/ZhuyinRenderer';
import { BookOpen, X, CheckSquare, Square } from 'lucide-react';

const DashboardContactBookWidget = ({ isOpen, onClose, isGlobalZhuyin, statusMode }) => {
    const { currentLog, initStore, updateItemInCurrentLog } = useContactBookStore();
    const [dontShowToday, setDontShowToday] = useState(false);
    const [autoRemindEnabled, setAutoRemindEnabled] = useState(true);

    // Initial load
    useEffect(() => {
        initStore();
        // Load auto-remind setting
        const savedAutoRemind = localStorage.getItem('cb_auto_remind_enabled');
        if (savedAutoRemind === 'false') {
            setAutoRemindEnabled(false);
        }
    }, [initStore]);

    // Read/write "Don't show today" flag
    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        const flag = localStorage.getItem(`cb_dont_show_${today}`);
        if (flag === 'true') {
            setDontShowToday(true);
        }
    }, [isOpen]);

    // 5-minute auto-close timer
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                onClose();
            }, 5 * 60 * 1000); // 5 minutes
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    // Auto-close when class starts or prep bell rings
    useEffect(() => {
        if (isOpen && (statusMode === 'class' || statusMode === 'eco-auto' || statusMode === 'pre-bell')) {
            onClose();
        }
    }, [isOpen, statusMode, onClose]);

    const handleDontShowToggle = () => {
        const today = new Date().toISOString().split('T')[0];
        const newValue = !dontShowToday;
        setDontShowToday(newValue);
        if (newValue) {
            localStorage.setItem(`cb_dont_show_${today}`, 'true');
        } else {
            localStorage.removeItem(`cb_dont_show_${today}`);
        }
    };

    const handleAutoRemindToggle = () => {
        const newValue = !autoRemindEnabled;
        setAutoRemindEnabled(newValue);
        localStorage.setItem('cb_auto_remind_enabled', String(newValue));
    };

    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-50 flex justify-center items-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#274C43] w-11/12 max-w-5xl h-5/6 rounded-2xl shadow-2xl border-4 border-[#3e4f45] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b border-white/20 bg-black/20">
                    <h2 className="flex items-center gap-3 text-2xl text-white tracking-widest">
                        <BookOpen className="text-emerald-400" size={28} />
                        <ZhuyinRenderer text="今日聯絡簿" isActive={isGlobalZhuyin} />
                        <span className="text-xl opacity-70 ml-2">{currentLog?.date}</span>
                    </h2>
                    <div className="flex items-center gap-6">
                        {/* 下課自動提醒 Toggle */}
                        <label className="flex items-center gap-2 text-white/70 cursor-pointer hover:text-white transition-colors">
                            <input
                                type="checkbox"
                                checked={autoRemindEnabled}
                                onChange={handleAutoRemindToggle}
                                className="w-5 h-5 rounded bg-black/20 border-white/30 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="text-lg font-normal"><ZhuyinRenderer text="下課自動提醒" isActive={isGlobalZhuyin} /></span>
                        </label>
                        {/* 今日不再自動顯示 Toggle */}
                        <label className="flex items-center gap-2 text-white/70 cursor-pointer hover:text-white transition-colors">
                            <input
                                type="checkbox"
                                checked={dontShowToday}
                                onChange={handleDontShowToggle}
                                className="w-5 h-5 rounded bg-black/20 border-white/30 text-emerald-500 focus:ring-emerald-500"
                            />
                            <span className="text-lg font-normal"><ZhuyinRenderer text="今日不再自動顯示" isActive={isGlobalZhuyin} /></span>
                        </label>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/10 hover:bg-rose-500 text-white rounded-xl transition-colors"
                        >
                            <X size={28} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    {/* 黑板粉筆灰質感背景 - 與主介面一致 */}
                    <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 0.8px, transparent 0.8px)', backgroundSize: '24px 24px' }}></div>

                    {!currentLog || !currentLog.items || currentLog.items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-white/40 space-y-4">
                            <BookOpen size={64} className="opacity-50" />
                            <p className="text-3xl tracking-widest"><ZhuyinRenderer text="今日尚無聯絡簿作業" isActive={isGlobalZhuyin} /></p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
                            {currentLog.items.map((item, index) => (
                                <div 
                                    key={item.id} 
                                    className="flex items-start gap-4 w-full cursor-pointer group/item"
                                    onClick={() => updateItemInCurrentLog(item.id, { isChecked: !item.isChecked })}
                                >
                                    <span className={`text-4xl opacity-60 select-none whitespace-nowrap pt-1 text-white transition-all ${item.isChecked ? 'opacity-20 line-through' : ''}`}>{index + 1}.</span>
                                    <div className={`flex-1 text-5xl leading-relaxed cursor-pointer select-none transition-all duration-300 ${item.isImportant ? 'text-[color:#ffa0a0]' : 'text-white'} ${item.isChecked ? 'line-through opacity-30 grayscale' : ''}`}>
                                        <ZhuyinRenderer text={item.content} isActive={isGlobalZhuyin} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardContactBookWidget;
